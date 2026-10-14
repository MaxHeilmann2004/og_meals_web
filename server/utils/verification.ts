import { getRequestURL, setCookie } from 'h3'
import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export const verificationCookieName = 'og-meals-verification'

export const isVerificationTokenValid = (token: string | undefined, expectedToken: string) => {
  if (!token) return false

  const tokenBytes = Buffer.from(token)
  const expectedBytes = Buffer.from(expectedToken)
  if (tokenBytes.length !== expectedBytes.length) return false

  return timingSafeEqual(tokenBytes, expectedBytes)
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
