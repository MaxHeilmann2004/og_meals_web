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
let hasLoggedUnexpectedDecodeError = false

const stopCamera = () => {
  isActive = false
  if (scanTimeout !== undefined) clearTimeout(scanTimeout)
  scanTimeout = undefined

  cameraStream?.getTracks().forEach(track => track.stop())
  cameraStream = undefined
  if (videoElement.value) videoElement.value.srcObject = null
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
    return
  }

  isActive = true
  try {
    const { BrowserQRCodeReader } = await import('@zxing/browser')
    if (!isActive || !videoElement.value) return

    const reader = new BrowserQRCodeReader()
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
    if (!isActive) {
      stream.getTracks().forEach(track => track.stop())
      return
    }

    cameraStream = stream
    const video = videoElement.value
    if (!video) {
      stopCamera()
      return
    }
    video.srcObject = stream
    await video.play()

    const scanFrame = () => {
      if (!isActive) return

      const currentVideo = videoElement.value
      // Avoid decoding the initial empty frame, which ZXing treats as a fatal scan error.
      if (currentVideo && currentVideo.videoWidth > 0 && currentVideo.videoHeight > 0) {
        let decodedValue: string | undefined
        try {
          const result = reader.decode(currentVideo)
          if (result) decodedValue = result.getText()
        } catch (error) {
          // ZXing decodes one frame at a time; a failed frame must not stop the live stream.
          const errorName = typeof error === 'object' && error !== null && 'name' in error
            ? String(error.name)
            : ''
          if (!hasLoggedUnexpectedDecodeError && !expectedFrameMissErrors.has(errorName)) {
            console.warn('Unexpected QR frame decode error; continuing to scan.', error)
            hasLoggedUnexpectedDecodeError = true
          }
        }

        if (decodedValue !== undefined) {
          stopCamera()
          if (decodedValue.length === 0) {
            cameraError.value = 'Der QR-Code ist leer. Gib den Verifizierungscode manuell ein.'
          } else {
            emit('decoded', decodedValue)
          }
          return
        }
      }

      scanTimeout = setTimeout(scanFrame, 250)
    }

    scanFrame()
  } catch (error) {
    if (isActive) cameraError.value = getCameraErrorMessage(error)
    stopCamera()
  }
}

const closeScanner = () => {
  stopCamera()
  emit('close')
}

onMounted(() => {
  void startCamera()
})

onBeforeUnmount(stopCamera)
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
