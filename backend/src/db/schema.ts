import { sql } from 'drizzle-orm'
import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core'

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['viewer', 'editor', 'admin'] }).default('viewer').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 故障标签表
export const faultTags = sqliteTable('fault_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').default('#409EFF').notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 维修报告表
export const reports = sqliteTable('reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reporter: text('reporter').notNull(),
  deviceName: text('device_name').notNull(),
  faultTags: text('fault_tags'), // JSON数组
  durationMinutes: integer('duration_minutes'),
  faultCategory: text('fault_category').notNull(),
  description: text('description'), // 合并描述/原因/解决方案
  attachments: text('attachments'), // JSON数组
  isDeleted: integer('is_deleted').default(0).notNull(),
  authorId: integer('author_id').references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// AI分析记录表
export const aiAnalyses = sqliteTable('ai_analyses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportId: integer('report_id').notNull().references(() => reports.id),
  analysisType: text('analysis_type', { enum: ['summary', 'diagnosis', 'solution'] }).notNull(),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  tokensUsed: integer('tokens_used'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 用户AI使用记录表
export const aiUsageLogs = sqliteTable('ai_usage_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  usageDate: text('usage_date').notNull(), // YYYY-MM-DD
  requestCount: integer('request_count').default(0).notNull(),
  lastRequestAt: text('last_request_at'),
})

// 关系类型
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type FaultTag = typeof faultTags.$inferSelect
export type NewFaultTag = typeof faultTags.$inferInsert
export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
export type AiAnalysis = typeof aiAnalyses.$inferSelect
export type NewAiAnalysis = typeof aiAnalyses.$inferInsert
export type AiUsageLog = typeof aiUsageLogs.$inferSelect
export type NewAiUsageLog = typeof aiUsageLogs.$inferInsert