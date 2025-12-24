export interface ImageMetadata {
  id: string
  filename: string
  originalFilename: string
  size: number
  contentType: string
  uploadTime: string
  r2Key: string
}

export interface ImageListResponse {
  images: ImageMetadata[]
  total: number
}

export interface UploadResponse {
  success: boolean
  image?: ImageMetadata
  error?: string
}

export interface DeleteResponse {
  success: boolean
  message: string
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]
