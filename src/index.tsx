/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { authMiddleware } from './middleware/auth'
import { initializeDatabase } from './db/client'

// ルート
import authRoutes from './routes/auth'

// データベースの初期化
initializeDatabase()

const app = new Hono()

// ミドルウェア
app.use('*', logger())
app.use('*', secureHeaders())

// 認証関連のルート
app.route('/auth', authRoutes)

// メインページ (認証が必要)
app.get('/', authMiddleware, (c) => {
  const user = c.get('user')
  
  return c.html(
    <html>
      <head>
        <title>組ぼーど - ホーム</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body {
            font-family: sans-serif
            max-width: 800px
            margin: 0 auto
            padding: 1rem
          }
          header {
            display: flex
            justify-content: space-between
            align-items: center
            margin-bottom: 2rem
            border-bottom: 1px solid #eee
            padding-bottom: 1rem
          }
          .circulars {
            margin-top: 2rem
          }
          .circular {
            border: 1px solid #ddd
            padding: 1rem
            margin-bottom: 1rem
            border-radius: 4px
          }
          .circular h3 {
            margin-top: 0
          }
          .logout-form {
            display: inline
          }
          .logout-button {
            background: none
            border: none
            color: blue
            text-decoration: underline
            cursor: pointer
            padding: 0
          }
        `}</style>
      </head>
      <body>
        <header>
          <h1>組ぼーど</h1>
          <div>
            <span>こんにちは、{user.name}さん</span>
            <form action="/auth/logout" method="post" class="logout-form">
              <button type="submit" class="logout-button">ログアウト</button>
            </form>
          </div>
        </header>
        
        <main>
          <h2>未読の回覧</h2>
          <div class="circulars">
            <div class="circular">
              <h3>地域清掃活動のお知らせ</h3>
              <p>5月10日に地域清掃活動を行います。9時に公民館前に集合してください。</p>
              <small>期限: 2023/05/09</small>
            </div>
            <div class="circular">
              <h3>防災訓練のお知らせ</h3>
              <p>5月15日に防災訓練を行います。参加可能な方は事前に組長までご連絡ください。</p>
              <small>期限: 2023/05/14</small>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
})

// サーバーの起動
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

export default app
