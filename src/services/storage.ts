export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer,
  contentType: string
): Promise<void> {
  try {
    await bucket.put(key, data, {
      httpMetadata: {
        contentType,
      },
    })
  } catch (error) {
    console.error('R2 upload error:', error)
    throw new Error('Failed to upload file to storage')
  }
}

export async function getFromR2(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  try {
    return await bucket.get(key)
  } catch (error) {
    console.error('R2 get error:', error)
    throw new Error('Failed to retrieve file from storage')
  }
}

export async function deleteFromR2(bucket: R2Bucket, key: string): Promise<void> {
  try {
    await bucket.delete(key)
  } catch (error) {
    console.error('R2 delete error:', error)
    throw new Error('Failed to delete file from storage')
  }
}
