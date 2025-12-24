export function Home() {
  return (
    <div class="container">
      <div class="header-bar">
        <div>
          <h1>Cloudflare Image Cloud</h1>
          <p style="color: #666;">
            A simple and fast image hosting service powered by Cloudflare Workers, R2, and KV
          </p>
        </div>
        <button class="logout-btn">Logout</button>
      </div>

      <div class="upload-form">
        <h2>Upload Image</h2>

        <div class="upload-zone">
          <input type="file" id="file-input" accept="image/*" style="display: none;" />
          <div>
            <p>Drag and drop an image here, or click to select</p>
            <p style="color: #999; font-size: 0.9rem;">Supported: JPG, PNG, GIF, WebP, SVG (Max 10MB)</p>
          </div>
        </div>

        <button class="upload-btn">
          Upload Image
        </button>
      </div>

      <div class="gallery">
        <div class="gallery-header">
          <h2>My Images (0)</h2>
          <button class="refresh-btn">Refresh</button>
        </div>

        <div class="image-grid">
          <div class="empty-state">
            <p>No images uploaded yet</p>
            <p>Upload your first image to get started!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
