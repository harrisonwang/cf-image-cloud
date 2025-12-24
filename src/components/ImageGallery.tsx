import { useState, useEffect } from 'hono/jsx'
import type { ImageMetadata } from '../types/image'
import { ImageCard } from './ImageCard'

interface ImageGalleryProps {
  apiKey: string
  refreshTrigger: number
  onShowToast: (message: string, type: 'success' | 'error') => void
}

export function ImageGallery({ apiKey, refreshTrigger, onShowToast }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageMetadata[]>([])
  const [loading, setLoading] = useState(true)

  const fetchImages = async () => {
    if (!apiKey) {
      setImages([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/images', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      const result = await response.json()

      if (result.images) {
        setImages(result.images)
      } else {
        onShowToast(result.error || 'Failed to load images', 'error')
      }
    } catch (error) {
      onShowToast('Failed to load images: ' + (error as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [apiKey, refreshTrigger])

  const handleRefresh = () => {
    fetchImages()
  }

  return (
    <div class="gallery">
      <div class="gallery-header">
        <h2>My Images ({images.length})</h2>
        <button class="refresh-btn" onClick={handleRefresh}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div class="loading">Loading images...</div>
      ) : images.length === 0 ? (
        <div class="empty-state">
          <p>No images uploaded yet</p>
          <p>Upload your first image to get started!</p>
        </div>
      ) : (
        <div class="image-grid">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              apiKey={apiKey}
              onDelete={fetchImages}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  )
}
