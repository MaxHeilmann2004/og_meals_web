// Generates the monochrome PWA icons used for Android themed (monochrome) app icons.
// The logo is rendered as a single opaque color on a transparent background; Android uses only the alpha
// channel and tints it with the user's theme.
//
//   pnpm generate:pwa-monochrome
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

const SOURCE = 'app/assets/pwa-icon.svg'
const SIZES = [512, 1024]
// Logo share of the canvas; keeps it inside the launcher's safe zone like the maskable icon
const LOGO_SCALE = 0.6

const svg = (await readFile(SOURCE, 'utf8'))
  .replace(/<rect[^>]*\/>/, '')
  .replace(/fill:rgb\(238,0,32\)/g, 'fill:#000')

for (const size of SIZES) {
  const logoSize = Math.round(size * LOGO_SCALE)
  const offset = Math.round((size - logoSize) / 2)
  const logo = await sharp(Buffer.from(svg), { density: 96 * (logoSize / 2000) * 2 })
    .resize(logoSize, logoSize)
    .png()
    .toBuffer()

  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(`public/monochrome-icon-${size}x${size}.png`)
}
