import type { Context } from 'hono'
import type { CloudflareBindings } from '../../types/env'
import { getMetadata } from '../../services/metadata'

export async function imageDetailHandler(
  c: Context<{ Bindings: CloudflareBindings }>
): Promise<Response> {
  try {
    const id = c.req.param('id')

    if (!id) {
      return c.json({ success: false, error: 'Image ID is required' }, 400)
    }

    const metadata = await getMetadata(c.env.IMAGE_METADATA, id)

    if (!metadata) {
      return c.json({ success: false, error: 'Image not found' }, 404)
    }

    return c.json(metadata)
  } catch (error) {
    console.error('Get image detail error:', error)
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get image details',
      },
      500
    )
  }
}
