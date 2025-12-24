import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import type { CloudflareBindings } from '../types/env'
import { verifyToken } from '../utils/jwt'

export async function authMiddleware(
  c: Context<{ Bindings: CloudflareBindings }>,
  next: Next
) {
  const token = getCookie(c, 'auth_token')
  const jwtSecret = c.env.JWT_SECRET

  if (!token) {
    return c.json({ success: false, error: 'Not authenticated' }, 401)
  }

  if (!jwtSecret) {
    return c.json({ success: false, error: 'Server configuration error' }, 500)
  }

  const payload = await verifyToken(token, jwtSecret)

  if (!payload) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }

  // Store user info in context for use in routes
  c.set('user', payload)

  await next()
}
