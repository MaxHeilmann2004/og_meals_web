import { getRequestURL, sendRedirect, setResponseHeader } from 'h3'
import { isVerificationTokenValid, setVerificationCookie } from '../utils/verification'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)
  if (requestUrl.pathname !== '/' || !requestUrl.searchParams.has('verification')) return

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const config = useRuntimeConfig(event)
  const codes = requestUrl.searchParams.getAll('verification')
  const token = codes.length === 1 ? codes[0] : undefined
  if (
    typeof token === 'string'
    && config.verificationToken
    && isVerificationTokenValid(token, config.verificationToken)
  ) {
    setVerificationCookie(event, token)
  }

  const destination = new URL(requestUrl)
  destination.searchParams.delete('verification')
  return sendRedirect(event, `${destination.pathname}${destination.search}`, 303)
})
