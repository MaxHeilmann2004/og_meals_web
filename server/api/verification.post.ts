import { readBody, setResponseHeader } from 'h3'
import { getBackendVerificationStatus, setVerificationCookie } from '../utils/verification'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const body = await readBody<{ token?: unknown }>(event)
  if (typeof body?.token !== 'string' || !body.token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid verification code.',
    })
  }

  const status = await getBackendVerificationStatus(event, body.token)
  if (!status.configured) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Meal plan access is not configured on this server.',
    })
  }
  if (!status.authenticated) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid verification code.',
    })
  }

  setVerificationCookie(event, body.token)

  return { configured: true, authenticated: true }
})
