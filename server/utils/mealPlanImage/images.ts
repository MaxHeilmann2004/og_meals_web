import sharp from 'sharp'
import type { ElementNode } from 'ultrahtml'
import { collectImages } from './markup'

export type AssetFetcher = (path: string) => Promise<Response>

const allowedPathPrefixes = ['/api/backend/', '/icons/', '/ic_ai.svg', '/meal_placeholder.png']
const internalOrigin = 'http://internal.invalid'
const placeholderPath = '/meal_placeholder.png'

const toDataUri = (contentType: string, data: Uint8Array | string) =>
  `data:${contentType};base64,${Buffer.from(data).toString('base64')}`

// Only same-origin paths to known asset locations are fetched, never arbitrary URLs.
const normalizeAssetPath = (src: string) => {
  if (!src.startsWith('/') || src.startsWith('//')) return null
  const url = new URL(src, internalOrigin)
  if (url.origin !== internalOrigin) return null
  const path = `${url.pathname}${url.search}`
  if (url.pathname.includes('..')) return null
  return allowedPathPrefixes.some(prefix => url.pathname.startsWith(prefix)) ? path : null
}

const tintSvg = (svg: string, color: string) => {
  if (!/^#[0-9a-f]{3,8}$/i.test(color)) return svg
  return svg.replace(/\sfill="[^"]*"/g, '').replace('<svg', `<svg fill="${color}"`)
}

// Satori cannot decode every format the backend serves (e.g. WebP) and full-size photos bloat the SVG,
// so every raster image is cropped to its display size and re-encoded as JPEG.
const rasterToDataUri = async (data: Uint8Array, width: number, height: number, scale: number) => {
  const jpeg = await sharp(data)
    .rotate()
    .resize(Math.round(width * scale), Math.round(height * scale), { fit: 'cover' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 88 })
    .toBuffer()
  return toDataUri('image/jpeg', jpeg)
}

/** Replaces every `<img src>` with a self-contained data URI so Satori needs no network access. */
export const inlineImages = async (root: ElementNode, fetchAsset: AssetFetcher, scale: number) => {
  const placeholders = new Map<string, Promise<string>>()
  const getPlaceholder = (width: number, height: number) => {
    const key = `${width}x${height}`
    let placeholder = placeholders.get(key)
    if (!placeholder) {
      placeholder = fetchAsset(placeholderPath)
        .then(async response => rasterToDataUri(new Uint8Array(await response.arrayBuffer()), width, height, scale))
      placeholders.set(key, placeholder)
    }
    return placeholder
  }

  const resolved = new Map<string, Promise<string | null>>()
  const resolve = (src: string, tint: string | undefined, width: number, height: number) => {
    const key = `${tint ?? ''}|${width}x${height}|${src}`
    let result = resolved.get(key)
    if (!result) {
      result = (async () => {
        const path = normalizeAssetPath(src)
        if (!path) return null
        try {
          const response = await fetchAsset(path)
          if (!response.ok) return null
          const contentType = (response.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase()
          if (contentType === 'image/svg+xml') {
            const svg = await response.text()
            return toDataUri(contentType, tint ? tintSvg(svg, tint) : svg)
          }
          if (!contentType.startsWith('image/')) return null
          return await rasterToDataUri(new Uint8Array(await response.arrayBuffer()), width, height, scale)
        } catch {
          return null
        }
      })()
      resolved.set(key, result)
    }
    return result
  }

  await Promise.all(collectImages(root).map(async (image) => {
    const src = image.attributes.src ?? ''
    const tint = image.attributes['data-tint']
    delete image.attributes['data-tint']
    if (src.startsWith('data:')) return

    const width = Number(image.attributes.width)
    const height = Number(image.attributes.height)
    image.attributes.src = (src === placeholderPath ? null : await resolve(src, tint, width, height))
      ?? await getPlaceholder(width, height)
  }))
}

const publicContentTypes: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png' }

/** Reads a file from `public/` via Nitro server assets and wraps it in a Response. */
export const readPublicAsset = async (path: string) => {
  const pathname = path.split('?')[0]!
  const data = await useStorage('assets:static').getItemRaw<Uint8Array>(pathname.slice(1))
  if (!data) return new Response(null, { status: 404 })
  const extension = pathname.split('.').pop()!.toLowerCase()
  return new Response(Buffer.from(data), { headers: { 'content-type': publicContentTypes[extension] ?? 'application/octet-stream' } })
}
