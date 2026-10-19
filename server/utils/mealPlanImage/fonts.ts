import type { Font } from 'satori'

const fontFiles = [
  { file: 'outfit-400.woff', weight: 400 },
  { file: 'outfit-500.woff', weight: 500 },
  { file: 'outfit-700.woff', weight: 700 },
] as const

let fonts: Promise<Font[]> | undefined

// Fonts live in server/assets/fonts and are available through Nitro's `assets:server` storage.
export const loadMealPlanImageFonts = () => {
  fonts ??= Promise.all(fontFiles.map(async ({ file, weight }) => {
    const data = await useStorage('assets:server').getItemRaw<Uint8Array>(`fonts/${file}`)
    if (!data) throw new Error(`Font asset missing: ${file}`)
    return { name: 'Outfit', data: Buffer.from(data), weight, style: 'normal' as const }
  })).catch((error) => {
    fonts = undefined
    throw error
  })
  return fonts
}
