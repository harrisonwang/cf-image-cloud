import type { Context } from 'hono'
import { setCookie } from 'hono/cookie'
import type { CloudflareBindings } from '../../types/env'
import { generateToken } from '../../utils/jwt'

export async function loginHandler(c: Context<{ Bindings: CloudflareBindings }>): Promise<Response> {
  try {
    const body = await c.req.json()
    const { username, password } = body

    const envUsername = c.env.AUTH_USERNAME
    const envPassword = c.env.AUTH_PASSWORD
    const jwtSecret = c.env.JWT_SECRET

    if (!envUsername || !envPassword || !jwtSecret) {
      return c.json({ success: false, error: 'Server configuration error' }, 500)
    }

    if (username === envUsername && password === envPassword) {
      const token = await generateToken(username, jwtSecret)

      setCookie(c, 'auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return c.json({ success: true })
    }

    return c.json({ success: false, error: 'Invalid username or password' }, 401)
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, error: 'Login failed' }, 500)
  }
}

export async function logoutHandler(c: Context): Promise<Response> {
  setCookie(c, 'auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 0,
    path: '/',
  })

  return c.json({ success: true })
}
