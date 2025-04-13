import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { eq } from 'drizzle-orm'
import { DATABASE_PATH } from '../config'
import bcrypt from 'bcrypt'

// SQLiteのDBファイルへのpath
const sqlite = new Database(DATABASE_PATH)

// drizzle client
export const db = drizzle(sqlite, { schema })

// 必要に応じてDBのmigrationを実行する
export function initializeDatabase() {
  // テーブルが存在しない場合のみ作成
  try {
    // テーブルの作成を別々のステートメントで実行
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
    `)
    
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    `)
    
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS circulars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT,
        creator_id INTEGER NOT NULL,
        FOREIGN KEY (creator_id) REFERENCES users(id)
      )
    `)
    
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS circular_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        circular_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        FOREIGN KEY (circular_id) REFERENCES circulars(id),
        FOREIGN KEY (group_id) REFERENCES groups(id)
      )
    `)
    
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS read_statuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        circular_id INTEGER NOT NULL,
        read_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (circular_id) REFERENCES circulars(id)
      )
    `)
    
    console.log("Database tables created successfully")

    // 初期データ投入（開発用）
    const adminExists = db.select()
      .from(schema.users)
      .where(eq(schema.users.email, 'admin@example.com'))
      .get()

    if (!adminExists) {
      // 管理ユーザーの作成
      const passwordHash = bcrypt.hashSync('Password$1234', 10)

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

      console.log("Initial data created successfully")
    }
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}
