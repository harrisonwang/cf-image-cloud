import type { Context } from 'hono'
import type { CloudflareBindings } from '../types/env'
import { getMetadata } from '../services/metadata'
import { getFromR2 } from '../services/storage'

export async function serveImageHandler(
  c: Context<{ Bindings: CloudflareBindings }>
): Promise<Response> {
  try {
    const id = c.req.param('id')

    if (!id) {
      return c.text('Image ID is required', 400)
    }

    const metadata = await getMetadata(c.env.IMAGE_METADATA, id)

    if (!metadata) {
      return c.text('Image not found', 404)
    }

    const object = await getFromR2(c.env.IMAGE_BUCKET, metadata.r2Key)

    if (!object) {
      return c.text('Image file not found in storage', 404)
    }

    const headers = new Headers({
      'Content-Type': metadata.contentType,
      'Content-Disposition': `inline; filename="${metadata.originalFilename}"`,
      // Browser cache: 1 year
      'Cache-Control': 'public, max-age=31536000, immutable',
      // Cloudflare CDN cache: 1 year
      'CDN-Cache-Control': 'public, max-age=31536000',
      // Additional cache headers
      'ETag': `"${metadata.id}"`,
      'Last-Modified': new Date(metadata.uploadTime).toUTCString(),
    })

    return new Response(object.body, { headers })
  } catch (error) {
    console.error('Serve image error:', error)
    return c.text('Failed to serve image', 500)
  }
}
