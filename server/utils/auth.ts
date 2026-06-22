import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { getCookie, getHeader } from 'h3'

const JWT_SECRET = process.env.JWT_SECRET || 'cloud-game-dev-secret'

export interface JWTPayload {
  userId: string
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  }
  catch {
    return null
  }
}

/**
 * Extract a JWT from the request and verify it. Looks at:
 *  1. `Authorization: Bearer <token>` header
 *  2. `auth-token` cookie
 * Returns the decoded payload or null.
 */
export function getAuthPayload(event: H3Event): JWTPayload | null {
  const auth = getHeader(event, 'authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined
  const cookieToken = getCookie(event, 'auth-token')
  const token = bearer || cookieToken
  if (!token) return null
  return verifyJWT(token)
}
