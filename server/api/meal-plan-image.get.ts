import { createError, getCookie, getQuery, getRequestHeader, setResponseHeaders } from 'h3'
import { getBackendVerificationStatus, verificationCookieName } from '../utils/verification'
import { createStepTimer, formatBytes, logMealPlanImage, newRequestId, toServerTiming, warnMealPlanImage } from '../utils/mealPlanImage/log'
import { MealPlanImageOptionsError, parseMealPlanImageOptions } from '../utils/mealPlanImage/options'
import { renderMealPlanImage } from '../utils/mealPlanImage/render'

const unauthorized = () => createError({
  statusCode: 401,
  statusMessage: 'Verifizierung erforderlich.',
})

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, { 'Cache-Control': 'private, no-store' })

  const requestId = newRequestId()
  const timer = createStepTimer(requestId)

  try {
    const query = getQuery(event)
    const queryToken = query.verification
    if (Array.isArray(queryToken)) {
      throw createError({ statusCode: 400, statusMessage: 'Der Verifizierungscode darf nur einmal angegeben werden.' })
    }

    // Header and query token take precedence; the browser cookie allows opening the endpoint directly while debugging.
    const headerToken = getRequestHeader(event, 'x-verification-code')
    const cookieToken = getCookie(event, verificationCookieName)
    const tokenSource = headerToken ? 'header' : queryToken ? 'query' : cookieToken ? 'cookie' : 'none'
    const token = headerToken || (typeof queryToken === 'string' ? queryToken : '') || cookieToken || ''
    logMealPlanImage(requestId, `request received (token from ${tokenSource})`)
    if (!token) throw unauthorized()

    const status = await timer.step('verification', () => getBackendVerificationStatus(event, token))
    if (!status.configured) {
      throw createError({ statusCode: 503, statusMessage: 'Der Zugriff auf den Speiseplan ist auf diesem Server nicht eingerichtet.' })
    }
    if (!status.authenticated) throw unauthorized()

    let options: ReturnType<typeof parseMealPlanImageOptions>
    try {
      options = parseMealPlanImageOptions(
        Object.fromEntries(
          Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value?.toString()]),
        ),
      )
    } catch (error) {
      if (error instanceof MealPlanImageOptionsError) throw createError({ statusCode: 400, statusMessage: error.message })
      throw error
    }

    const { png, timings, cache } = await renderMealPlanImage(event, token, options, requestId)

    // Steps of the render itself are only measured for the request that actually rendered.
    const serverTiming = toServerTiming({ ...timer.timings, ...(cache === 'miss' ? timings : {}) })
    setResponseHeaders(event, {
      'Content-Type': 'image/png',
      'Content-Disposition': `${options.inline ? 'inline' : 'attachment'}; filename="speiseplan-${options.date}.png"`,
      'Server-Timing': `${serverTiming ? `${serverTiming}, ` : ''}total;dur=${timer.totalMs()}`,
      'X-Meal-Plan-Image-Request': requestId,
    })
    logMealPlanImage(requestId, `responded in ${timer.totalMs()}ms (cache ${cache}, ${formatBytes(png.byteLength)})`)
    return Buffer.from(png)
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500
    warnMealPlanImage(requestId, `failed after ${timer.totalMs()}ms with HTTP ${statusCode}: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
})
