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
        background: '#EE0020',
      },
    },
    apple: {
      ...preset.apple,
      resizeOptions: {
        ...preset.apple.resizeOptions,
        background: '#EE0020',
      },
    },
  },
  images: ['public/pwa-icon.svg'],
})
