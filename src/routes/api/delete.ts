import type { Context } from 'hono'
import type { CloudflareBindings } from '../../types/env'
import type { DeleteResponse } from '../../types/image'
import { getMetadata, deleteMetadata } from '../../services/metadata'
import { deleteFromR2 } from '../../services/storage'

export async function deleteHandler(
  c: Context<{ Bindings: CloudflareBindings }>
): Promise<Response> {
  try {
    const id = c.req.param('id')

    if (!id) {
      return c.json<DeleteResponse>(
        {
          success: false,
          message: 'Image ID is required',
        },
        400
      )
    }

    const metadata = await getMetadata(c.env.IMAGE_METADATA, id)

    if (!metadata) {
      return c.json<DeleteResponse>(
        {
          success: false,
          message: 'Image not found',
        },
        404
      )
    }

    await deleteFromR2(c.env.IMAGE_BUCKET, metadata.r2Key)
    await deleteMetadata(c.env.IMAGE_METADATA, id)

    return c.json<DeleteResponse>({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error) {
    console.error('Delete image error:', error)
    return c.json<DeleteResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete image',
      },
      500
    )
  }
}
