import type { Context } from 'hono'
import type { CloudflareBindings } from '../../types/env'
import type { UploadResponse, ImageMetadata } from '../../types/image'
import { generateImageId } from '../../utils/id-generator'
import { validateFile } from '../../services/validation'
import { uploadToR2 } from '../../services/storage'
import { saveMetadata } from '../../services/metadata'

export async function uploadHandler(
  c: Context<{ Bindings: CloudflareBindings }>
): Promise<Response> {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return c.json<UploadResponse>(
        {
          success: false,
          error: 'No file provided',
        },
        400
      )
    }

    const maxFileSize = c.env.MAX_FILE_SIZE || 10485760
    const validation = validateFile(file.type, file.size, maxFileSize)

    if (!validation.valid) {
      return c.json<UploadResponse>(
        {
          success: false,
          error: validation.error,
        },
        400
      )
    }

    const id = generateImageId()
    const r2Key = `images/${id}/${file.name}`
    const arrayBuffer = await file.arrayBuffer()

    await uploadToR2(c.env.IMAGE_BUCKET, r2Key, arrayBuffer, file.type)

    const metadata: ImageMetadata = {
      id,
      filename: `${id}_${file.name}`,
      originalFilename: file.name,
      size: file.size,
      contentType: file.type,
      uploadTime: new Date().toISOString(),
      r2Key,
    }

    await saveMetadata(c.env.IMAGE_METADATA, metadata)

    return c.json<UploadResponse>({
      success: true,
      image: metadata,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json<UploadResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      500
    )
  }
}
