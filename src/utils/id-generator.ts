import { nanoid } from 'nanoid'

export function generateImageId(): string {
  return nanoid(12)
}
