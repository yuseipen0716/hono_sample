import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

const app = new Hono()

// logger middlewareを追加
app.use('*', logger())

// 独自のmiddleware
app.use('/admin/*', async(c, next) => {
  // 認証checkのシミュレーション
  const isAuthenticated = c.req.header('X-API-Key') === undefined
  console.log(c.req.header('X-API-Key'))
  if (!isAuthenticated) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

app.get('/admin/dashboard', (c) => {
  return c.json({ message: 'Admin dashboard' })
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
