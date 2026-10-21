import sharp from 'sharp'
import type { ElementNode } from 'ultrahtml'
import { formatBytes, logMealPlanImage, warnMealPlanImage } from './log'
import { collectImages } from './markup'

export type AssetFetcher = (path: string) => Promise<Response>

const allowedPathPrefixes = ['/api/backend/', '/icons/', '/ic_ai.svg', '/meal_placeholder.webp']
const internalOrigin = 'http://internal.invalid'
const placeholderPath = '/meal_placeholder.webp'

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

const SLOW_ASSET_MS = 1000

export const inlinedAssetPrefix = 'asset:'

export interface InlineImagesSummary {
  /** Data URIs by short token; the markup only carries the token because satori-html is extremely slow on large attributes. */
  assets: Map<string, string>
  images: number
  fallbacks: number
  sourceBytes: number
  slowestMs: number
}

/** Replaces every `<img src>` with a self-contained data URI so Satori needs no network access. */
export const inlineImages = async (
  root: ElementNode,
  fetchAsset: AssetFetcher,
  scale: number,
  requestId: string,
): Promise<InlineImagesSummary> => {
  const summary: InlineImagesSummary = { assets: new Map(), images: 0, fallbacks: 0, sourceBytes: 0, slowestMs: 0 }

  const placeholders = new Map<string, Promise<string>>()
  const getPlaceholder = (width: number, height: number) => {
    const key = `${width}x${height}`
    let placeholder = placeholders.get(key)
    if (!placeholder) {
      const startedAt = performance.now()
      placeholder = fetchAsset(placeholderPath)
        .then(async (response) => {
          const data = new Uint8Array(await response.arrayBuffer())
          const dataUri = await rasterToDataUri(data, width, height, scale)
          logMealPlanImage(requestId, `placeholder ${key} prepared in ${Math.round(performance.now() - startedAt)}ms (source ${formatBytes(data.byteLength)})`)
          return dataUri
        })
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
        const startedAt = performance.now()
        const elapsed = () => Math.round(performance.now() - startedAt)
        const fail = (reason: string) => {
          warnMealPlanImage(requestId, `image ${src} falls back to placeholder after ${elapsed()}ms: ${reason}`)
          return null
        }

        const path = normalizeAssetPath(src)
        if (!path) return fail('path is not allowed')
        try {
          const response = await fetchAsset(path)
          const fetchedMs = elapsed()
          if (!response.ok) return fail(`HTTP ${response.status}`)
          const contentType = (response.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase()
          if (contentType === 'image/svg+xml') {
            const svg = await response.text()
            return toDataUri(contentType, tint ? tintSvg(svg, tint) : svg)
          }
          if (!contentType.startsWith('image/')) return fail(`unexpected content type "${contentType}"`)

          const data = new Uint8Array(await response.arrayBuffer())
          const downloadedMs = elapsed()
          const dataUri = await rasterToDataUri(data, width, height, scale)
          const totalMs = elapsed()
          summary.sourceBytes += data.byteLength
          summary.slowestMs = Math.max(summary.slowestMs, totalMs)
          const detail = `headers ${fetchedMs}ms, download ${downloadedMs - fetchedMs}ms, resize ${totalMs - downloadedMs}ms, ${formatBytes(data.byteLength)} ${contentType}`
          if (totalMs >= SLOW_ASSET_MS) warnMealPlanImage(requestId, `slow image ${src}: ${totalMs}ms (${detail})`)
          else logMealPlanImage(requestId, `image ${src}: ${totalMs}ms (${detail})`)
          return dataUri
        } catch (error) {
          return fail(error instanceof Error ? error.message : String(error))
        }
      })()
      resolved.set(key, result)
    }
    return result
  }

  const tokens = new Map<string, string>()
  await Promise.all(collectImages(root).map(async (image) => {
    const src = image.attributes.src ?? ''
    const tint = image.attributes['data-tint']
    delete image.attributes['data-tint']
    if (src.startsWith('data:')) return

    summary.images++
    const width = Number(image.attributes.width)
    const height = Number(image.attributes.height)
    const dataUri = src === placeholderPath ? null : await resolve(src, tint, width, height)
    if (!dataUri) summary.fallbacks++
    const resolvedUri = dataUri ?? await getPlaceholder(width, height)
    let token = tokens.get(resolvedUri)
    if (!token) {
      token = `${inlinedAssetPrefix}${tokens.size}`
      tokens.set(resolvedUri, token)
      summary.assets.set(token, resolvedUri)
    }
    image.attributes.src = token
  }))

  return summary
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
