import { createError, getCookie, getQuery, getRequestHeader, setResponseHeaders } from 'h3'
import { getBackendVerificationStatus, verificationCookieName } from '../utils/verification'
import { MealPlanImageOptionsError, parseMealPlanImageOptions } from '../utils/mealPlanImage/options'
import { renderMealPlanImage } from '../utils/mealPlanImage/render'

const unauthorized = () => createError({
  statusCode: 401,
  statusMessage: 'Verifizierung erforderlich.',
})

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, { 'Cache-Control': 'private, no-store' })

  const query = getQuery(event)
  const queryToken = query.verification
  if (Array.isArray(queryToken)) {
    throw createError({ statusCode: 400, statusMessage: 'Der Verifizierungscode darf nur einmal angegeben werden.' })
  }

  // Header and query token take precedence; the browser cookie allows opening the endpoint directly while debugging.
  const token = getRequestHeader(event, 'x-verification-code')
    || (typeof queryToken === 'string' ? queryToken : '')
    || getCookie(event, verificationCookieName)
    || ''
  if (!token) throw unauthorized()

  const status = await getBackendVerificationStatus(event, token)
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
  const png = await renderMealPlanImage(event, token, options)

  setResponseHeaders(event, {
    'Content-Type': 'image/png',
    'Content-Disposition': `${options.inline ? 'inline' : 'attachment'}; filename="speiseplan-${options.date}.png"`,
  })
  return Buffer.from(png)
})
