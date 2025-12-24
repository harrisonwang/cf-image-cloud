import type { ImageMetadata } from '../types/image'

interface ImageCardProps {
  image: ImageMetadata
  apiKey: string
  onDelete: () => void
  onShowToast: (message: string, type: 'success' | 'error') => void
}

export function ImageCard({ image, apiKey, onDelete, onShowToast }: ImageCardProps) {
  const imageUrl = `/i/${image.id}`

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${imageUrl}`
    navigator.clipboard.writeText(fullUrl).then(
      () => onShowToast('Link copied to clipboard!', 'success'),
      () => onShowToast('Failed to copy link', 'error')
    )
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${image.originalFilename}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        onShowToast('Image deleted successfully', 'success')
        onDelete()
      } else {
        onShowToast(result.message || 'Delete failed', 'error')
      }
    } catch (error) {
      onShowToast('Delete failed: ' + (error as Error).message, 'error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <div class="image-card">
      <img src={imageUrl} alt={image.originalFilename} />
      <div class="image-info">
        <h3 title={image.originalFilename}>{image.originalFilename}</h3>
        <div class="image-meta">
          <div>Size: {formatSize(image.size)}</div>
          <div>Uploaded: {formatDate(image.uploadTime)}</div>
        </div>
        <div class="image-actions">
          <button class="btn btn-copy" onClick={handleCopyLink}>
            Copy Link
          </button>
          <button class="btn btn-delete" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
