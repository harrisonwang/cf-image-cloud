import type { Context } from 'hono'
import type { CloudflareBindings } from '../../types/env'
import type { ImageListResponse } from '../../types/image'
import { getAllMetadata } from '../../services/metadata'

export async function imagesHandler(
  c: Context<{ Bindings: CloudflareBindings }>
): Promise<Response> {
  try {
    const images = await getAllMetadata(c.env.IMAGE_METADATA)

    images.sort((a, b) => {
      return new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
    })

    return c.json<ImageListResponse>({
      images,
      total: images.length,
    })
  } catch (error) {
    console.error('List images error:', error)
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list images',
      },
      500
    )
  }
}
