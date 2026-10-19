import { Resvg } from '@resvg/resvg-js'
import { createError, type H3Event } from 'h3'
import satori from 'satori'
import { html as toVNode } from 'satori-html'
import { verificationCookieName } from '../verification'
import { loadMealPlanImageFonts } from './fonts'
import { inlineImages, readPublicAsset } from './images'
import { decodeEntities, extractImageRoot, renderMarkup } from './markup'
import { mealPlanImageRenderHeader, mealPlanImageRenderPath, mealPlanImageRenderSecret } from './internal'
import type { MealPlanImageOptions } from './options'

const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX_ENTRIES = 24
const MAX_CONCURRENT_RENDERS = 2

const cache = new Map<string, { expiresAt: number, png: Promise<Uint8Array> }>()

let activeRenders = 0
const waiting: Array<() => void> = []

const acquire = async () => {
  if (activeRenders >= MAX_CONCURRENT_RENDERS) await new Promise<void>(resolve => waiting.push(resolve))
  activeRenders++
}

const release = () => {
  activeRenders--
  waiting.shift()?.()
}

const cacheKey = (options: MealPlanImageOptions) =>
  [options.date, options.width, options.scale, options.theme, options.studentPrices].join('|')

const renderPng = async (event: H3Event, token: string, options: MealPlanImageOptions) => {
  const headers = {
    cookie: `${verificationCookieName}=${encodeURIComponent(token)}`,
    [mealPlanImageRenderHeader]: mealPlanImageRenderSecret,
  }
  const fetchPage = (path: string) => event.fetch(path, { headers })
  const fetchAsset = (path: string) => path.startsWith('/api/backend/') ? fetchPage(path) : readPublicAsset(path)

  const query = new URLSearchParams({
    date: options.date,
    width: String(options.width),
    theme: options.theme,
    studentPrices: options.studentPrices ? '1' : '0',
  })
  const page = await fetchPage(`${mealPlanImageRenderPath}?${query}`)
  if (!page.ok) {
    throw createError({
      statusCode: page.status === 401 || page.status === 403 ? 401 : 502,
      statusMessage: 'Der Speiseplan konnte nicht geladen werden.',
    })
  }

  const root = extractImageRoot(await page.text())
  await inlineImages(root, fetchAsset, options.scale)

  const svg = await satori(decodeEntities(toVNode(await renderMarkup(root))) as Parameters<typeof satori>[0], {
    width: options.width,
    fonts: await loadMealPlanImageFonts(),
  })

  return new Resvg(svg, { fitTo: { mode: 'zoom', value: options.scale } }).render().asPng()
}

/** The image only depends on the options, not on who asked, so equal requests share one render. */
export const renderMealPlanImage = (event: H3Event, token: string, options: MealPlanImageOptions) => {
  const key = cacheKey(options)
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) return hit.png

  for (const [entryKey, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(entryKey)
  }
  while (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value!)

  const png = (async () => {
    await acquire()
    try {
      return await renderPng(event, token, options)
    } finally {
      release()
    }
  })()
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, png })
  png.catch(() => {
    if (cache.get(key)?.png === png) cache.delete(key)
  })
  return png
}
