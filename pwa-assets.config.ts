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
    maskable: {
      ...preset.maskable,
      resizeOptions: {
        ...preset.maskable.resizeOptions,
        background: '#201A19',
      },
    },
    apple: {
      ...preset.apple,
      resizeOptions: {
        ...preset.apple.resizeOptions,
        background: '#201A19',
      },
    },
  },
  images: ['public/icon.svg'],
})
