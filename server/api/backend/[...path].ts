import { getCookie, getRequestURL, getRouterParam, proxyRequest, setResponseHeader } from 'h3'
import { verificationCookieName } from '../../utils/verification'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const verificationToken = getCookie(event, verificationCookieName)
  if (!verificationToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Verifizierung erforderlich.',
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
