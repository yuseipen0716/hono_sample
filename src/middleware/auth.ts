import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { JWT_SECRET } from '../config'

// middleware for user authentication
export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'auth_token')

  if (!token) {
    return c.json({ error: 'Authnetication required' }, 401)
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number }
    const user = db.select().from(users).where(eq(users.id, decoded.id)).get()

    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    // remove password hash
    const { passwordHash, ...safeUser } = user
    c.set('user', safeUser)

    await next()
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}

// 特定の役割をもつユーザーのみ許可するミドルウェア
export function roleMiddleware(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: 'Permission denied' }, 403)
    }

    await next()
  }
}
