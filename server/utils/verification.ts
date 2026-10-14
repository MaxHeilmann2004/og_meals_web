import { createError, getRequestURL, setCookie } from 'h3'
import type { H3Event } from 'h3'

export const verificationCookieName = 'og-meals-verification'

export interface BackendVerificationStatus {
  configured: boolean
  authenticated: boolean
}

const verificationUnavailable = () => createError({
  statusCode: 503,
  statusMessage: 'Could not verify access with the backend.',
})

export const getBackendVerificationStatus = async (event: H3Event, token?: string): Promise<BackendVerificationStatus> => {
  const config = useRuntimeConfig(event)
  let verificationUrl: URL
  try {
    verificationUrl = new URL('/verification', config.public.apiBaseUrl)
  } catch {
    throw verificationUnavailable()
  }

  let response: Response
  try {
    response = await fetch(verificationUrl, {
      cache: 'no-store',
      headers: {
        'cache-control': 'no-store',
        ...(token ? { 'x-verification-code': token } : {}),
      },
    })
  } catch {
    throw verificationUnavailable()
  }

  if (!response.ok) throw verificationUnavailable()

  let status: unknown
  try {
    status = await response.json()
  } catch {
    throw verificationUnavailable()
  }

  if (
    typeof status !== 'object'
    || status === null
    || !('configured' in status)
    || typeof status.configured !== 'boolean'
    || !('authenticated' in status)
    || typeof status.authenticated !== 'boolean'
  ) {
    throw verificationUnavailable()
  }

  return {
    configured: status.configured,
    authenticated: status.authenticated,
  }
}

export const setVerificationCookie = (event: H3Event, token: string) => {
  setCookie(event, verificationCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || getRequestURL(event).protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}
