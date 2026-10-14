import { readBody, setResponseHeader } from 'h3'
import { isVerificationTokenValid, setVerificationCookie } from '../utils/verification'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const expectedToken = config.verificationToken

  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  if (!expectedToken) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Meal plan access is not configured on this server.',
    })
  }

  const body = await readBody<{ token?: unknown }>(event)
  if (typeof body?.token !== 'string' || !isVerificationTokenValid(body.token, expectedToken)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid verification code.',
    })
  }

  setVerificationCookie(event, body.token)

  return { configured: true, authenticated: true }
})
