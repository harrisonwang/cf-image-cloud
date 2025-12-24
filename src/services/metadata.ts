import type { ImageMetadata } from '../types/image'

const KV_PREFIX = 'img:'

export async function saveMetadata(
  kv: KVNamespace,
  metadata: ImageMetadata
): Promise<void> {
  try {
    await kv.put(`${KV_PREFIX}${metadata.id}`, JSON.stringify(metadata))
  } catch (error) {
    console.error('KV save error:', error)
    throw new Error('Failed to save image metadata')
  }
}

export async function getMetadata(
  kv: KVNamespace,
  id: string
): Promise<ImageMetadata | null> {
  try {
    const data = await kv.get(`${KV_PREFIX}${id}`)
    if (!data) return null
    return JSON.parse(data) as ImageMetadata
  } catch (error) {
    console.error('KV get error:', error)
    throw new Error('Failed to retrieve image metadata')
  }
}

export async function getAllMetadata(kv: KVNamespace): Promise<ImageMetadata[]> {
  try {
    const list = await kv.list({ prefix: KV_PREFIX })
    const metadataPromises = list.keys.map(async (key) => {
      const data = await kv.get(key.name)
      return data ? (JSON.parse(data) as ImageMetadata) : null
    })

    const results = await Promise.all(metadataPromises)
    return results.filter((item): item is ImageMetadata => item !== null)
  } catch (error) {
    console.error('KV list error:', error)
    throw new Error('Failed to list image metadata')
  }
}

export async function deleteMetadata(kv: KVNamespace, id: string): Promise<void> {
  try {
    await kv.delete(`${KV_PREFIX}${id}`)
  } catch (error) {
    console.error('KV delete error:', error)
    throw new Error('Failed to delete image metadata')
  }
}
