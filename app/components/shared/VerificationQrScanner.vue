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
import type { IScannerControls } from '@zxing/browser'

const ignoredDecodeErrors = new Set(['NotFoundException', 'ChecksumException', 'FormatException'])

const emit = defineEmits<{
  decoded: [value: string]
  close: []
}>()

const videoElement = ref<HTMLVideoElement>()
const cameraError = ref('')
let scannerControls: IScannerControls | undefined
let isActive = false

const stopCamera = () => {
  isActive = false
  scannerControls?.stop()
  scannerControls = undefined

  const stream = videoElement.value?.srcObject
  if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) {
    stream.getTracks().forEach(track => track.stop())
  }
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
    const controls = await reader.decodeFromVideoDevice(undefined, videoElement.value, (result, error) => {
      if (result) {
        const decodedValue = result.getText()
        stopCamera()
        if (decodedValue.length === 0) {
          cameraError.value = 'Der QR-Code ist leer. Gib den Verifizierungscode manuell ein.'
        } else {
          emit('decoded', decodedValue)
        }
        return
      }

      if (error && !ignoredDecodeErrors.has(error.name)) {
        cameraError.value = 'Der QR-Code konnte nicht gelesen werden. Versuche es mit einem anderen QR-Code oder gib den Verifizierungscode manuell ein.'
        stopCamera()
      }
    })

    if (isActive) {
      scannerControls = controls
    } else {
      controls.stop()
    }
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
  width: 100%;
  max-height: 300px;
  border-radius: 8px;
  background: #171717;
  object-fit: cover;
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
