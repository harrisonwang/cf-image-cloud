// Client-side JavaScript for file upload interactions and authentication

let selectedFile: File | null = null
let isAuthenticated = false

function showToast(message: string, type: 'success' | 'error', duration: number = 3000) {
  const existingToast = document.querySelector('.toast')
  if (existingToast) {
    existingToast.remove()
  }

  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.innerHTML = `<p>${message}</p>`
  document.body.appendChild(toast)

  setTimeout(() => toast.remove(), duration)
}

function updateFileDisplay() {
  const uploadZone = document.querySelector('.upload-zone')
  if (!uploadZone) return

  if (selectedFile) {
    uploadZone.innerHTML = `
      <div>
        <p>Selected: ${selectedFile.name}</p>
        <p>Size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    `
  } else {
    uploadZone.innerHTML = `
      <input type="file" id="file-input" accept="image/*" style="display: none;" />
      <div>
        <p>Drag and drop an image here, or click to select</p>
        <p style="color: #999; font-size: 0.9rem;">Supported: JPG, PNG, GIF, WebP, SVG (Max 10MB)</p>
      </div>
    `
    attachFileInputListener()
  }
}

function attachFileInputListener() {
  const fileInput = document.getElementById('file-input') as HTMLInputElement
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files[0]) {
        selectedFile = target.files[0]
        updateFileDisplay()
      }
    })
  }
}

async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/check-auth')
    const result = await response.json()
    isAuthenticated = result.authenticated
    return result.authenticated
  } catch (error) {
    isAuthenticated = false
    return false
  }
}

async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    const result = await response.json()

    if (result.success) {
      return true
    } else {
      showToast(result.error || 'Login failed', 'error')
      return false
    }
  } catch (error) {
    showToast('Login failed: ' + (error as Error).message, 'error')
    return false
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/login'
  } catch (error) {
    showToast('Logout failed', 'error')
  }
}

async function uploadImage() {
  const uploadBtn = document.querySelector('.upload-btn') as HTMLButtonElement

  if (!selectedFile) {
    showToast('Please select a file', 'error')
    return
  }

  uploadBtn.disabled = true
  uploadBtn.textContent = 'Uploading...'

  const formData = new FormData()
  formData.append('file', selectedFile)

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (response.status === 401) {
      showToast('Session expired. Please login again.', 'error')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      return
    }

    if (result.success && result.image) {
      // Auto-copy image URL to clipboard
      const imageUrl = `${window.location.origin}/i/${result.image.id}`

      try {
        await navigator.clipboard.writeText(imageUrl)
        showToast(
          `✅ Image uploaded!<br><strong>URL copied to clipboard</strong><br><small style="color: #666; word-break: break-all;">${imageUrl}</small>`,
          'success',
          4000 // Show for 4 seconds
        )
      } catch (clipboardError) {
        // Fallback if clipboard API fails
        console.error('Failed to copy to clipboard:', clipboardError)
        showToast(
          `✅ Image uploaded!<br><small style="color: #666; word-break: break-all;">${imageUrl}</small>`,
          'success',
          4000
        )
      }

      selectedFile = null
      updateFileDisplay()
      loadImages()
    } else {
      showToast(result.error || 'Upload failed', 'error')
    }
  } catch (error) {
    showToast('Upload failed: ' + (error as Error).message, 'error')
  } finally {
    uploadBtn.disabled = false
    uploadBtn.textContent = 'Upload Image'
  }
}

async function loadImages() {
  const galleryElement = document.querySelector('.image-grid')
  if (!galleryElement) return

  galleryElement.innerHTML = '<div class="loading">Loading images...</div>'

  try {
    const response = await fetch('/api/images')

    if (response.status === 401) {
      window.location.href = '/login'
      return
    }

    const result = await response.json()

    if (result.images && result.images.length > 0) {
      galleryElement.innerHTML = result.images
        .map(
          (img: any) => `
        <div class="image-card" data-id="${img.id}">
          <img src="/i/${img.id}" alt="${img.originalFilename}" />
          <div class="image-info">
            <h3 title="${img.originalFilename}">${img.originalFilename}</h3>
            <div class="image-meta">
              <div>Size: ${(img.size / 1024 / 1024).toFixed(2)} MB</div>
              <div>Uploaded: ${new Date(img.uploadTime).toLocaleString()}</div>
            </div>
            <div class="image-actions">
              <button class="btn btn-copy" onclick="copyImageLink('${img.id}')">Copy Link</button>
              <button class="btn btn-delete" onclick="deleteImage('${img.id}')">Delete</button>
            </div>
          </div>
        </div>
      `
        )
        .join('')
    } else {
      galleryElement.innerHTML = `
        <div class="empty-state">
          <p>No images uploaded yet</p>
          <p>Upload your first image to get started!</p>
        </div>
      `
    }

    const totalElement = document.querySelector('.gallery-header h2')
    if (totalElement) {
      totalElement.textContent = `My Images (${result.images?.length || 0})`
    }
  } catch (error) {
    showToast('Failed to load images', 'error')
  }
}

function copyImageLink(id: string) {
  const url = `${window.location.origin}/i/${id}`
  navigator.clipboard.writeText(url).then(
    () => showToast('Link copied to clipboard!', 'success'),
    () => showToast('Failed to copy link', 'error')
  )
}

async function deleteImage(id: string) {
  if (!confirm('Are you sure you want to delete this image?')) {
    return
  }

  try {
    const response = await fetch(`/api/images/${id}`, {
      method: 'DELETE',
    })

    if (response.status === 401) {
      window.location.href = '/login'
      return
    }

    const result = await response.json()

    if (result.success) {
      showToast('Image deleted successfully', 'success')
      loadImages()
    } else {
      showToast(result.message || 'Delete failed', 'error')
    }
  } catch (error) {
    showToast('Delete failed', 'error')
  }
}

// Make functions globally available
;(window as any).copyImageLink = copyImageLink
;(window as any).deleteImage = deleteImage

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on the login page
  if (window.location.pathname === '/login') {
    const loginBtn = document.querySelector('.login-btn')
    const errorMsg = document.querySelector('.error-message') as HTMLElement

    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const username = (document.getElementById('username') as HTMLInputElement).value
        const password = (document.getElementById('password') as HTMLInputElement).value

        if (!username || !password) {
          if (errorMsg) {
            errorMsg.textContent = 'Please enter username and password'
            errorMsg.style.display = 'block'
          }
          return
        }

        const loginBtnElement = loginBtn as HTMLButtonElement
        loginBtnElement.disabled = true
        loginBtnElement.textContent = 'Logging in...'

        const success = await login(username, password)

        if (success) {
          window.location.href = '/'
        } else {
          loginBtnElement.disabled = false
          loginBtnElement.textContent = 'Login'
          if (errorMsg) {
            errorMsg.style.display = 'block'
          }
        }
      })

      // Allow Enter key to submit
      document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          loginBtn.dispatchEvent(new Event('click'))
        }
      })
    }
    return
  }

  // For all other pages, check authentication
  const authenticated = await checkAuth()
  if (!authenticated) {
    window.location.href = '/login'
    return
  }

  // Logout button
  const logoutBtn = document.querySelector('.logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout)
  }

  // Load images on home page
  loadImages()

  // Upload zone - click to select file
  const uploadZone = document.querySelector('.upload-zone')
  if (uploadZone) {
    uploadZone.addEventListener('click', () => {
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      fileInput?.click()
    })

    // Drag and drop handlers
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
      uploadZone.classList.add('drag-over')
    })

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault()
      e.stopPropagation()
      uploadZone.classList.remove('drag-over')
    })

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault()
      e.stopPropagation()
      uploadZone.classList.remove('drag-over')

      const dt = (e as DragEvent).dataTransfer
      if (dt?.files && dt.files[0]) {
        selectedFile = dt.files[0]
        updateFileDisplay()
      }
    })
  }

  // File input change
  attachFileInputListener()

  // Upload button
  const uploadBtn = document.querySelector('.upload-btn')
  if (uploadBtn) {
    uploadBtn.addEventListener('click', uploadImage)
  }

  // Refresh button
  const refreshBtn = document.querySelector('.refresh-btn')
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadImages())
  }

  // Prevent default drag behavior on document
  document.addEventListener('dragover', (e) => e.preventDefault())
  document.addEventListener('drop', (e) => e.preventDefault())
})
