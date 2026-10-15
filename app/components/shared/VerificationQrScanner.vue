<template>
  <div class="verification-scanner">
    <video
      ref="videoElement"
      class="verification-scanner-video"
      autoplay
      muted
      playsinline
      aria-label="QR code camera preview"
    />
    <p v-if="cameraError" class="verification-scanner-error" role="alert">
      {{ cameraError }}
    </p>
    <p v-else class="verification-scanner-instructions">
      Point your camera at the Kochwerk QR code.
    </p>
    <var-button type="primary" native-type="button" block @click="closeScanner">
      Close camera
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
    return 'Camera access was denied. Allow camera access in your browser settings or enter the code manually.'
  }
  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return 'No camera was found. Enter the verification code manually.'
  }
  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return 'The camera could not be started. Close other apps using it or enter the code manually.'
  }
  return 'Could not start the camera. Check your browser permissions or enter the code manually.'
}

const startCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'Camera scanning is not supported by this browser or connection. Enter the code manually.'
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
          cameraError.value = 'The QR code is empty. Enter the verification code manually.'
        } else {
          emit('decoded', decodedValue)
        }
        return
      }

      if (error && !ignoredDecodeErrors.has(error.name)) {
        cameraError.value = 'Could not read that QR code. Try another or enter the verification code manually.'
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
