/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import type { FC } from 'hono/jsx'
import 'dotenv/config'

const app = new Hono()

const Layout: FC = (props) => {
  return (
    <html>
      <body>{props.children}</body>
    </html>
  )
}

const Top: FC<{ messages: string[] }> = (props: {
  messages: string[]
}) => {
  return (
    <Layout>
      <h1>Hello Hono!</h1>
      <ul>
        {props.messages.map((message) => {
          return <li>{message}!!</li>
        })}
      </ul>
    </Layout>
  )
}

app.get('/', (c) => {
  const messages = ['Good Morning', 'Good Evenint', 'Good Night']
  return c.html(<Top messages={messages} />)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http:localhost:${info.port}`)
})

export default app
