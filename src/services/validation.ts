import { ALLOWED_IMAGE_TYPES } from '../utils/constants'

export function validateFileType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(contentType as any)
}

export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateFile(
  contentType: string,
  size: number,
  maxSize: number
): ValidationResult {
  if (!validateFileType(contentType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    }
  }

  if (!validateFileSize(size, maxSize)) {
    return {
      valid: false,
      error: `File size must be between 1 byte and ${maxSize / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}
