export function Login() {
  return (
    <div class="container">
      <div class="login-container">
        <h1>Cloudflare Image Cloud</h1>
        <p style="margin-bottom: 2rem; color: #666;">Login to access your image hosting service</p>

        <div class="login-form">
          <h2>Login</h2>

          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              autocomplete="current-password"
            />
          </div>

          <button class="login-btn" type="button">
            Login
          </button>

          <div class="error-message" style="display: none; color: #f44336; margin-top: 1rem;"></div>
        </div>
      </div>
    </div>
  )
}
