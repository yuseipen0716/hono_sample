import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

const app = new Hono()

// logger middlewareを追加
app.use('*', logger())

app.get('/', (c) => {
  // return c.text('Hello Hono!')
  return c.html('<h1>Hello Hono!!</h1>')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
