import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import type { CloudflareBindings } from '../../types/env'
import { verifyToken } from '../../utils/jwt'

export async function checkAuthHandler(c: Context<{ Bindings: CloudflareBindings }>): Promise<Response> {
  const token = getCookie(c, 'auth_token')
  const jwtSecret = c.env.JWT_SECRET

  if (!token || !jwtSecret) {
    return c.json({ authenticated: false })
  }

  const payload = await verifyToken(token, jwtSecret)

  if (payload) {
    return c.json({ authenticated: true, username: payload.username })
  }

  return c.json({ authenticated: false })
}
