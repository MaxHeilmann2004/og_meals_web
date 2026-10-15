import { getRequestURL, sendRedirect, setResponseHeader } from 'h3'
import { getBackendVerificationStatus, setVerificationCookie } from '../utils/verification'

export default defineEventHandler(async (event) => {
  const requestUrl = getRequestURL(event)
  if (requestUrl.pathname !== '/' || !requestUrl.searchParams.has('verification')) return

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const codes = requestUrl.searchParams.getAll('verification')
  const token = codes.length === 1 ? codes[0] : undefined
  if (typeof token === 'string' && token) {
    try {
      const status = await getBackendVerificationStatus(event, token)
      if (status.configured && status.authenticated) setVerificationCookie(event, token)
    } catch {
      // Redirect without authenticating; the clean page load will report backend availability.
    }
  }

  const destination = new URL(requestUrl)
  destination.searchParams.delete('verification')
  return sendRedirect(event, `${destination.pathname}${destination.search}`, 303)
})
