import type { Context, Next } from 'hono'

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next()
  } catch (error) {
    console.error('Error:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    return c.json(
      {
        success: false,
        error: message,
      },
      500
    )
  }
}
