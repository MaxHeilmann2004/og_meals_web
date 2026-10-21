// Generates the PWA manifest icons: the white logo centered on a full-bleed red tile.
//
// - maskable (Android home screen): logo at 60% to stay inside the safe zone of any launcher mask
// - any (splash screen, install dialogs): logo at 80%
//
// Android's themed icons turn icons without a monochrome layer into greyscale, and Chrome ignores the
// manifest `monochrome` purpose for installed PWAs. The red tile with a white logo keeps good
// brightness contrast in greyscale.
//
//   pnpm generate:pwa-icons
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

const SOURCE = 'app/assets/pwa-icon.svg'
const TILE = '#EE0020'

const OUTPUTS = [
  { prefix: 'pwa', sizes: [64, 192, 512, 1024], logoScale: 0.8 },
  { prefix: 'maskable-icon', sizes: [512, 1024], logoScale: 0.6 }
]

const svg = (await readFile(SOURCE, 'utf8')).replace(/<rect[^>]*\/>/, '')

for (const { prefix, sizes, logoScale } of OUTPUTS) {
  for (const size of sizes) {
    const logoSize = Math.round(size * logoScale)
    const offset = Math.round((size - logoSize) / 2)
    const logo = await sharp(Buffer.from(svg), { density: 96 * (logoSize / 2000) * 2 })
      .resize(logoSize, logoSize)
      .png()
      .toBuffer()

    await sharp({ create: { width: size, height: size, channels: 4, background: TILE } })
      .composite([{ input: logo, left: offset, top: offset }])
      .png()
      .toFile(`public/${prefix}-${size}x${size}.png`)
  }
}
