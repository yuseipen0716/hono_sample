import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { eq } from 'drizzle-orm'

// SQLiteのDBファイルへのpath
const sqlite = new Database(process.env.DATABASE_PATH)

// drizzle client
export const db = drizzle(sqlite, { schema })

// 必要に応じてDBのmigrationを実行する
export function initializeDatabase() {
  // テーブルが存在しない場合のみ作成
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      address TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      group_id INTEGER,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    )
    
    CREATE TABLE IF NOT EXISTS circulars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      creator_id INTEGER NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
    
    CREATE TABLE IF NOT EXISTS circular_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circular_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      FOREIGN KEY (circular_id) REFERENCES circulars(id),
      FOREIGN KEY (group_id) REFERENCES groups(id)
    )
    
    CREATE TABLE IF NOT EXISTS read_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      circular_id INTEGER NOT NULL,
      read_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (circular_id) REFERENCES circulars(id)
    )
  `)

  // 初期データ投入（開発用）
  const adminExists = db.select()
    .from(schema.users)
    .where(eq(schema.users.email, 'admin@example.com'))
    .get()

  if (!adminExists) {
    // 管理ユーザーの作成
    const bcrypt = require('bcrypt')
    const passwordHash = bcrypt.hashSync('password', 10)

    // 初期グループの作成
    db.insert(schema.groups).values({
      name: '第1組',
      description: '中央地区第1組'
    }).run()

    // 管理者ユーザーの作成
    db.insert(schema.users).values({
      name: '管理者',
      email: 'admin@example.com',
      role: 'admin',
      passwordHash
    }).run()
  }
}
