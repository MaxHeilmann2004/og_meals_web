// Generates the maskable (Android home screen) PWA icons: a white logo on a red tile.
//
// Android's themed icons turn icons without a monochrome layer into greyscale, and Chrome ignores the
// manifest `monochrome` purpose for installed PWAs. A dark tile with a red logo has almost no brightness
// contrast in greyscale, so the home screen icon uses a red tile with a white logo instead.
//
//   pnpm generate:pwa-maskable
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

const SOURCE = 'app/assets/pwa-icon.svg'
const SIZES = [512, 1024]
const TILE = '#EE0020'
const LOGO = '#FFFFFF'
// Logo share of the canvas; keeps it inside the maskable safe zone (circle, 80% diameter)
const LOGO_SCALE = 0.6

const svg = (await readFile(SOURCE, 'utf8'))
  .replace(/<rect[^>]*\/>/, '')
  .replace(/fill:rgb\(238,0,32\)/g, `fill:${LOGO}`)

for (const size of SIZES) {
  const logoSize = Math.round(size * LOGO_SCALE)
  const offset = Math.round((size - logoSize) / 2)
  const logo = await sharp(Buffer.from(svg), { density: 96 * (logoSize / 2000) * 2 })
    .resize(logoSize, logoSize)
    .png()
    .toBuffer()

  await sharp({ create: { width: size, height: size, channels: 4, background: TILE } })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(`public/maskable-icon-${size}x${size}.png`)
}
