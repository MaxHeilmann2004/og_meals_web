import { getCookie, setResponseHeader } from 'h3'
import { isVerificationTokenValid, verificationCookieName } from '../utils/verification'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const configured = Boolean(config.verificationToken)
  const token = getCookie(event, verificationCookieName)

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  return {
    configured,
    authenticated: configured && isVerificationTokenValid(token, config.verificationToken),
  }
})
