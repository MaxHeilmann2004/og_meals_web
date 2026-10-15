import { getCookie, setResponseHeader } from 'h3'
import { clearVerificationCookie, getBackendVerificationStatus, setVerificationCookie, verificationCookieName } from '../utils/verification'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, verificationCookieName)

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const status = await getBackendVerificationStatus(event, token)
  const authenticated = status.configured && status.authenticated
  if (token) {
    if (authenticated) setVerificationCookie(event, token)
    else clearVerificationCookie(event)
  }

  return { ...status, authenticated }
})
