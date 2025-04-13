/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { setCookie } from 'hono/cookie'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { JWT_SECRET } from '../config'

const app = new Hono()

// ログインフォームのコンポーネント
const LoginForm = () => {
  return (
    <html>
      <head>
        <title>組ぼーど - ログイン</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body {
            font-family: sans-serif
            max-width: 500px
            margin: 0 auto
            padding: 1rem
          }
          .form-group {
            margin-bottom: 1rem
          }
          label {
            display: block
            margin-bottom: 0.5rem
          }
          input {
            width: 100%
            padding: 0.5rem
            box-sizing: border-box
          }
          button {
            background: #4CAF50
            color: white
            border: none
            padding: 0.5rem 1rem
            cursor: pointer
          }
        `}</style>
      </head>
      <body>
        <h1>組ぼーど - ログイン</h1>
        <form action="/auth/login" method="post">
          <div class="form-group">
            <label for="email">メールアドレス</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">パスワード</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit">ログイン</button>
        </form>
        <p>
          アカウントをお持ちでない方は<a href="/auth/register">こちら</a>から登録できます。
        </p>
      </body>
    </html>
  )
}

// 登録フォームのコンポーネント
const RegisterForm = () => {
  return (
    <html>
      <head>
        <title>組ぼーど - 登録</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body {
            font-family: sans-serif
            max-width: 500px
            margin: 0 auto
            padding: 1rem
          }
          .form-group {
            margin-bottom: 1rem
          }
          label {
            display: block
            margin-bottom: 0.5rem
          }
          input {
            width: 100%
            padding: 0.5rem
            box-sizing: border-box
          }
          button {
            background: #4CAF50
            color: white
            border: none
            padding: 0.5rem 1rem
            cursor: pointer
          }
        `}</style>
      </head>
      <body>
        <h1>組ぼーど - ユーザー登録</h1>
        <form action="/auth/register" method="post">
          <div class="form-group">
            <label for="name">お名前</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div class="form-group">
            <label for="email">メールアドレス</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="address">住所</label>
            <input type="text" id="address" name="address" />
          </div>
          <div class="form-group">
            <label for="password">パスワード</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit">登録</button>
        </form>
        <p>
          すでにアカウントをお持ちの方は<a href="/auth/login">こちら</a>からログインできます。
        </p>
      </body>
    </html>
  )
}

// ログインページ
app.get('/login', (c) => {
  return c.html(<LoginForm />)
})

// 登録ページ
app.get('/register', (c) => {
  return c.html(<RegisterForm />)
})

// ログイン処理
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

app.post('/login', zValidator('form', loginSchema), async(c) => {
  const { email, password } = c.req.valid('form')

  // select users
  const user = db.select().from(users).where(eq(users.email, email)).get()

  if (!user) {
    return c.html(<LoginForm />)
  }

  // verify password
  const passwordValid = await bcrypt.compare(password, user.passwordHash)

  if (!passwordValid) {
    return c.html(<LoginForm />)
  }

  // generate JWT token
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })

  // set token to cookie
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })

  // redirect to root path
  return c.redirect('/')
})

// register new user
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  address: z.string().optional(),
  password: z.string().min(6)
})

app.post('/register', zValidator('form', registerSchema), async (c) => {
  const { name, email, address, password } = c.req.valid('form')

  // check user exists?
  const existingUser = db.select().from(users).where(eq(users.email, email)).get()

  if (existingUser) {
    return c.html(<RegisterForm />)
  }

  // hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // create user
  const result = db.insert(users).values({
    name,
    email,
    address: address || '',
    role: 'member',
    passwordHash
  }).run()

  if (!result) {
    return c.html(<RegisterForm />)
  }

  // redirect to login page
  return c.redirect('/auth/login')
})

// logout
app.post('/logout', (c) => {
  setCookie(c, 'auth_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/'
  })

  return c.redirect('/auth/login')
})

export default app
