import { getCookie, setResponseHeader } from 'h3'
import { getBackendVerificationStatus, verificationCookieName } from '../utils/verification'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, verificationCookieName)

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const status = await getBackendVerificationStatus(event, token)
  return { ...status, authenticated: status.configured && status.authenticated }
})
