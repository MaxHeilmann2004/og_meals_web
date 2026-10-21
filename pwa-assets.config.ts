import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...preset,
    transparent: {
      ...preset.transparent,
      // 1024px avoids upscaling (blurry splash screen) on high-density devices
      sizes: [64, 192, 512, 1024],
      padding: 0,
    },
    maskable: {
      ...preset.maskable,
      sizes: [512, 1024],
      // Keep the logo inside the maskable safe zone (circle, 80% diameter)
      padding: 0.4,
      resizeOptions: {
        ...preset.maskable.resizeOptions,
        background: '#201A19',
      },
    },
    apple: {
      ...preset.apple,
      // iOS applies its own rounded mask: ship a full-bleed opaque icon
      padding: 0,
      resizeOptions: {
        ...preset.apple.resizeOptions,
        background: '#201A19',
      },
    },
  },
  // Full-bleed square source: rounded/transparent corners show up as a white background on Android
  images: ['app/assets/pwa-icon.svg'],
})
