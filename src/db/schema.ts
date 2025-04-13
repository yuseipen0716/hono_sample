import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// User テーブル
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  address: text('address'),
  role: text('role', { enum: ['admin', 'leader', 'member'] }).notNull().default('member'),
  groupId: integer('group_id').references(() => groups.id),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

// Group テーブル
export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
})

// Circular テーブル (回覧板)
export const circulars = sqliteTable('circulars', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text('expires_at'),
  creatorId: integer('creator_id').references(() => users.id).notNull(),
})

// CircularGroup テーブル (回覧板と組の中間テーブル)
export const circularGroups = sqliteTable('circular_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  circularId: integer('circular_id').references(() => circulars.id).notNull(),
  groupId: integer('group_id').references(() => groups.id).notNull(),
})

// ReadStatus テーブル (既読状態)
export const readStatuses = sqliteTable('read_statuses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  circularId: integer('circular_id').references(() => circulars.id).notNull(),
  readAt: text('read_at').default(sql`CURRENT_TIMESTAMP`),
})
