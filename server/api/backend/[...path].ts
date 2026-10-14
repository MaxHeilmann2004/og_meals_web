import { getCookie, getRequestURL, getRouterParam, proxyRequest, setResponseHeader } from 'h3'
import { isVerificationTokenValid, verificationCookieName } from '../../utils/verification'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const expectedToken = config.verificationToken

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  if (!expectedToken) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Meal plan access is not configured on this server.',
    })
  }

  const verificationToken = getCookie(event, verificationCookieName)
  if (!isVerificationTokenValid(verificationToken, expectedToken)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Verification required.',
    })
  }

  const upstreamBaseUrl = new URL(config.public.apiBaseUrl)
  const upstreamUrl = new URL(`/${getRouterParam(event, 'path') ?? ''}`, upstreamBaseUrl)
  if (upstreamUrl.origin !== upstreamBaseUrl.origin) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid API path.',
    })
  }
  upstreamUrl.search = getRequestURL(event).search

  return proxyRequest(event, upstreamUrl.toString(), {
    headers: {
      'x-verification-code': verificationToken,
      cookie: '',
    },
  })
})
