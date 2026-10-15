<template>
  <div class="verification-scanner">
    <video
      ref="videoElement"
      class="verification-scanner-video"
      autoplay
      muted
      playsinline
      aria-label="Kameravorschau für QR-Code"
    />
    <p v-if="cameraError" class="verification-scanner-error" role="alert">
      {{ cameraError }}
    </p>
    <p v-else class="verification-scanner-instructions">
      Richte die Kamera auf den Kochwerk-QR-Code.
    </p>
    <var-button type="primary" native-type="button" block @click="closeScanner">
      Kamera schließen
    </var-button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const expectedFrameMissErrors = new Set(['NotFoundException', 'ChecksumException', 'FormatException'])

const emit = defineEmits<{
  decoded: [value: string]
  close: []
}>()

const videoElement = ref<HTMLVideoElement>()
const cameraError = ref('')
let cameraStream: MediaStream | undefined
let scanTimeout: ReturnType<typeof setTimeout> | undefined
let isActive = false
let hasLoggedExpectedFrameMiss = false
let hasLoggedUnexpectedDecodeError = false
let hasLoggedMissingVideoFrame = false

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  if (typeof error === 'object' && error !== null) {
    const details: { name: string, message: string, stack?: string } = {
      name: 'name' in error ? String(error.name) : 'UnknownError',
      message: 'message' in error ? String(error.message) : String(error),
    }
    if ('stack' in error && typeof error.stack === 'string') details.stack = error.stack
    return details
  }
  return { name: 'UnknownError', message: String(error) }
}

const stopCamera = (reason: string) => {
  const shouldLog = isActive || cameraStream !== undefined
  const trackStates = cameraStream?.getTracks().map(track => track.readyState) ?? []
  isActive = false
  if (scanTimeout !== undefined) clearTimeout(scanTimeout)
  scanTimeout = undefined

  cameraStream?.getTracks().forEach(track => track.stop())
  cameraStream = undefined
  if (videoElement.value) videoElement.value.srcObject = null
  if (shouldLog) {
    console.info('[VerificationQrScanner] Camera stopped.', { reason, trackStates })
  }
}

const getCameraErrorMessage = (error: unknown) => {
  const errorName = typeof error === 'object' && error !== null && 'name' in error
    ? error.name
    : ''

  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorName === 'SecurityError') {
    return 'Der Kamerazugriff wurde verweigert. Erlaube den Kamerazugriff in den Browsereinstellungen oder gib den Code manuell ein.'
  }
  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return 'Keine Kamera gefunden. Gib den Verifizierungscode manuell ein.'
  }
  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return 'Die Kamera konnte nicht gestartet werden. Schließe andere Apps, die sie verwenden, oder gib den Code manuell ein.'
  }
  return 'Die Kamera konnte nicht gestartet werden. Prüfe die Browserberechtigungen oder gib den Code manuell ein.'
}

const startCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'Das Scannen mit der Kamera wird von diesem Browser oder dieser Verbindung nicht unterstützt. Gib den Code manuell ein.'
    console.error('[VerificationQrScanner] Camera API unavailable.', {
      secureContext: window.isSecureContext,
      mediaDevicesAvailable: Boolean(navigator.mediaDevices),
    })
    return
  }

  isActive = true
  try {
    console.info('[VerificationQrScanner] Requesting environment-facing camera.', {
      secureContext: window.isSecureContext,
    })
    const { BrowserQRCodeReader } = await import('@zxing/browser')
    if (!isActive || !videoElement.value) return

    const reader = new BrowserQRCodeReader()
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
    if (!isActive) {
      console.info('[VerificationQrScanner] Releasing camera stream after scanner closed during setup.')
      stream.getTracks().forEach(track => track.stop())
      return
    }

    cameraStream = stream
    const video = videoElement.value
    if (!video) {
      stopCamera('video-element-unavailable')
      return
    }
    video.srcObject = stream
    const track = stream.getVideoTracks()[0]
    console.info('[VerificationQrScanner] Camera stream attached.', {
      trackReadyState: track?.readyState,
      facingMode: track?.getSettings().facingMode,
    })
    await video.play()
    console.info('[VerificationQrScanner] Video playback started.', {
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    })
    const playbackStartedAt = Date.now()

    const scanFrame = () => {
      if (!isActive) return

      const currentVideo = videoElement.value
      // Avoid decoding the initial empty frame, which ZXing treats as a fatal scan error.
      if (currentVideo && currentVideo.videoWidth > 0 && currentVideo.videoHeight > 0) {
        hasLoggedMissingVideoFrame = false
        let decodedValue: string | undefined
        try {
          const result = reader.decode(currentVideo)
          if (result) decodedValue = result.getText()
        } catch (error) {
          // ZXing decodes one frame at a time; a failed frame must not stop the live stream.
          const errorName = typeof error === 'object' && error !== null && 'name' in error
            ? String(error.name)
            : ''
          const frameDetails = {
            ...getErrorDetails(error),
            videoWidth: currentVideo.videoWidth,
            videoHeight: currentVideo.videoHeight,
            readyState: currentVideo.readyState,
          }
          if (expectedFrameMissErrors.has(errorName) && !hasLoggedExpectedFrameMiss) {
            console.info('[VerificationQrScanner] First frame contained no decodable QR code; continuing to scan.', frameDetails)
            hasLoggedExpectedFrameMiss = true
          } else if (!expectedFrameMissErrors.has(errorName) && !hasLoggedUnexpectedDecodeError) {
            console.warn('[VerificationQrScanner] Unexpected frame decode error; continuing to scan.', frameDetails)
            hasLoggedUnexpectedDecodeError = true
          }
        }

        if (decodedValue !== undefined) {
          stopCamera('qr-decoded')
          if (decodedValue.length === 0) {
            cameraError.value = 'Der QR-Code ist leer. Gib den Verifizierungscode manuell ein.'
          } else {
            emit('decoded', decodedValue)
          }
          return
        }
      } else if (currentVideo && !hasLoggedMissingVideoFrame && Date.now() - playbackStartedAt >= 2000) {
        const track = cameraStream?.getVideoTracks()[0]
        console.warn('[VerificationQrScanner] Camera stream has not produced video frames.', {
          videoWidth: currentVideo.videoWidth,
          videoHeight: currentVideo.videoHeight,
          readyState: currentVideo.readyState,
          trackReadyState: track?.readyState,
        })
        hasLoggedMissingVideoFrame = true
      }

      scanTimeout = setTimeout(scanFrame, 250)
    }

    scanFrame()
  } catch (error) {
    if (isActive) {
      cameraError.value = getCameraErrorMessage(error)
      console.error('[VerificationQrScanner] Camera startup or playback failed.', getErrorDetails(error))
    }
    stopCamera('camera-start-failed')
  }
}

const closeScanner = () => {
  stopCamera('user-closed')
  emit('close')
}

onMounted(() => {
  void startCamera()
})

onBeforeUnmount(() => stopCamera('component-unmounted'))
</script>

<style scoped>
.verification-scanner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.verification-scanner-video {
  align-self: center;
  width: min(100%, 400px);
  height: auto;
  aspect-ratio: 4 / 3;
  max-height: 300px;
  border-radius: 8px;
  background: #171717;
  object-fit: contain;
}

.verification-scanner-error,
.verification-scanner-instructions {
  margin: 0;
  text-align: center;
}

.verification-scanner-error {
  color: var(--color-danger);
}

.verification-scanner-instructions {
  color: var(--color-on-surface-variant);
}
</style>
