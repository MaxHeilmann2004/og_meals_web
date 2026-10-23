import { Resvg } from '@resvg/resvg-js'
import { createError, type H3Event } from 'h3'
import satori from 'satori'
import { html as toVNode } from 'satori-html'
import { verificationCookieName } from '../verification'
import { loadMealPlanImageFonts } from './fonts'
import { inlineImages, readPublicAsset } from './images'
import { decodeEntities, extractImageRoot, renderMarkup, restoreInlinedAssets } from './markup'
import { formatBytes, logMealPlanImage, mealPlanImageRequestIdHeader, warnMealPlanImage, createStepTimer, type StepTimings } from './log'
import { mealPlanImageRenderHeader, mealPlanImageRenderPath, mealPlanImageRenderSecret } from './internal'
import type { MealPlanImageOptions } from './options'

const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX_ENTRIES = 24

export type RenderCacheStatus = 'hit' | 'joined' | 'miss'

export interface RenderResult {
  png: Uint8Array
  timings: StepTimings
}

interface CacheEntry {
  expiresAt: number
  requestId: string
  settled: boolean
  result: Promise<RenderResult>
}

const cache = new Map<string, CacheEntry>()

let activeRenders = 0
let completedRenders = 0

const cacheKey = (options: MealPlanImageOptions) =>
  [options.date, options.width, options.scale, options.textScale, options.theme, options.canteens.map(token => token.toLowerCase()).sort().join(','), options.studentPrices, options.transparent].join('|')

const renderPng = async (
  event: H3Event,
  token: string,
  options: MealPlanImageOptions,
  requestId: string,
  timer: ReturnType<typeof createStepTimer>,
) => {
  const headers = {
    cookie: `${verificationCookieName}=${encodeURIComponent(token)}`,
    [mealPlanImageRenderHeader]: mealPlanImageRenderSecret,
    [mealPlanImageRequestIdHeader]: requestId,
  }
  const fetchPage = (path: string) => event.fetch(path, { headers })
  const fetchAsset = (path: string) => path.startsWith('/api/backend/') ? fetchPage(path) : readPublicAsset(path)

  const query = new URLSearchParams({
    date: options.date,
    width: String(options.width),
    theme: options.theme,
    textScale: String(options.textScale),
    canteens: options.canteens.join(','),
    studentPrices: options.studentPrices ? '1' : '0',
    transparent: options.transparent ? '1' : '0',
  })
  // Includes the Nuxt SSR render (lazy-loaded on the first request) and the meals request to the backend.
  const html = await timer.step('page', async () => {
    const page = await fetchPage(`${mealPlanImageRenderPath}?${query}`)
    if (!page.ok) {
      warnMealPlanImage(requestId, `render page responded with HTTP ${page.status}`)
      throw createError({
        statusCode: page.status === 401 || page.status === 403 ? 401 : 502,
        statusMessage: 'Der Speiseplan konnte nicht geladen werden.',
      })
    }
    return page.text()
  }, result => formatBytes(result.length))

  const root = await timer.step('parse', () => extractImageRoot(html))
  const { assets } = await timer.step(
    'images',
    () => inlineImages(root, fetchAsset, options.scale, requestId),
    result => `${result.images} images, ${result.fallbacks} placeholders, ${formatBytes(result.sourceBytes)} downloaded, slowest ${result.slowestMs}ms`,
  )

  const fonts = await timer.step('fonts', () => loadMealPlanImageFonts())
  const vnode = await timer.step('markup', async () => restoreInlinedAssets(decodeEntities(toVNode(await renderMarkup(root))), assets))
  const svg = await timer.step('satori', () => satori(vnode as Parameters<typeof satori>[0], {
    width: options.width,
    fonts,
  }), result => formatBytes(result.length))

  return timer.step(
    'resvg',
    // Satori already converts text to paths, so scanning the system fonts would only cost time.
    () => new Resvg(svg, { fitTo: { mode: 'zoom', value: options.scale }, font: { loadSystemFonts: false } }).render().asPng(),
    result => formatBytes(result.byteLength),
  )
}

/** The image only depends on the options, not on who asked, so equal requests share one render. */
export const renderMealPlanImage = async (
  event: H3Event,
  token: string,
  options: MealPlanImageOptions,
  requestId: string,
): Promise<RenderResult & { cache: RenderCacheStatus }> => {
  const key = cacheKey(options)
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) {
    const cacheStatus = hit.settled ? 'hit' : 'joined'
    logMealPlanImage(requestId, hit.settled
      ? 'served from cache'
      : `waiting for the identical render already running in request ${hit.requestId}`)
    return { ...await hit.result, cache: cacheStatus }
  }

  for (const [entryKey, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(entryKey)
  }
  while (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value!)

  const result = (async () => {
    const timer = createStepTimer(requestId)
    const coldStart = completedRenders === 0
    logMealPlanImage(requestId, `render started for ${key}${coldStart ? ' (first render since server start)' : ''}, ${activeRenders} already running`)
    activeRenders++
    try {
      const png = await renderPng(event, token, options, requestId, timer)
      completedRenders++
      logMealPlanImage(requestId, `render finished in ${timer.totalMs()}ms`)
      return { png, timings: timer.timings }
    } finally {
      activeRenders--
    }
  })()
  const entry: CacheEntry = { expiresAt: now + CACHE_TTL_MS, requestId, settled: false, result }
  cache.set(key, entry)
  result.then(() => {
    entry.settled = true
  }, () => {
    if (cache.get(key) === entry) cache.delete(key)
  })
  return { ...await result, cache: 'miss' }
}
