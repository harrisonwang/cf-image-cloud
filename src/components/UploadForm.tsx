import { useState } from 'hono/jsx'

interface UploadFormProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  onUploadSuccess: () => void
  onShowToast: (message: string, type: 'success' | 'error') => void
}

export function UploadForm({ apiKey, onApiKeyChange, onUploadSuccess, onShowToast }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files[0]) {
      setSelectedFile(target.files[0])
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      onShowToast('Please select a file', 'error')
      return
    }

    if (!apiKey) {
      onShowToast('Please enter your API key', 'error')
      return
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onShowToast('Image uploaded successfully!', 'success')
        setSelectedFile(null)
        onUploadSuccess()
      } else {
        onShowToast(result.error || 'Upload failed', 'error')
      }
    } catch (error) {
      onShowToast('Upload failed: ' + (error as Error).message, 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div class="upload-form">
      <h2>Upload Image</h2>

      <div class="form-group">
        <label for="api-key">API Key</label>
        <input
          type="password"
          id="api-key"
          value={apiKey}
          onInput={(e) => onApiKeyChange((e.target as HTMLInputElement).value)}
          placeholder="Enter your API key"
        />
      </div>

      <div
        class={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          type="file"
          id="file-input"
          accept="image/*"
          onChange={handleFileSelect}
        />
        {selectedFile ? (
          <div>
            <p>Selected: {selectedFile.name}</p>
            <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div>
            <p>Drag and drop an image here, or click to select</p>
            <p style="color: #999; font-size: 0.9rem;">Supported: JPG, PNG, GIF, WebP, SVG (Max 10MB)</p>
          </div>
        )}
      </div>

      <button
        class="upload-btn"
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>
    </div>
  )
}
