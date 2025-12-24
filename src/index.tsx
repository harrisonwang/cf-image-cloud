import { Hono } from 'hono'
import { renderer } from './renderer'
import type { CloudflareBindings } from './types/env'
import { errorMiddleware } from './middleware/error'
import { authMiddleware } from './middleware/auth'
import { uploadHandler } from './routes/api/upload'
import { imagesHandler } from './routes/api/images'
import { imageDetailHandler } from './routes/api/image-detail'
import { deleteHandler } from './routes/api/delete'
import { serveImageHandler } from './routes/serve'
import { loginHandler, logoutHandler } from './routes/api/login'
import { checkAuthHandler } from './routes/api/check-auth'
import { Home } from './pages/Home'
import { Login } from './pages/Login'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use(errorMiddleware)
app.use(renderer)

// Public routes
app.post('/api/login', loginHandler)
app.post('/api/logout', logoutHandler)
app.get('/api/check-auth', checkAuthHandler)
app.get('/i/:id', serveImageHandler)
app.get('/api/images/:id', imageDetailHandler)

// Protected routes
app.post('/api/upload', authMiddleware, uploadHandler)
app.get('/api/images', authMiddleware, imagesHandler)
app.delete('/api/images/:id', authMiddleware, deleteHandler)

// Pages
app.get('/login', (c) => {
  return c.render(<Login />)
})

app.get('/', (c) => {
  return c.render(<Home />)
})

export default app
