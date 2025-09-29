import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// 获取数据库实例
export function getDB(c: any) {
  // 检查是否在Cloudflare Workers环境中
  if (typeof c !== 'undefined' && c && c.env && c.env.DB) {
    return drizzle(c.env.DB, { schema })
  }
  
  // 开发环境模拟数据库
  // 在实际开发中，应该使用本地SQLite或其他数据库
  throw new Error('数据库连接失败: 未找到有效的数据库实例')
}

// 数据库操作工具函数
export const dbUtils = {
  // 分页查询
  async paginate(query: any, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize
    const data = await query.limit(pageSize).offset(offset)
    return {
      data,
      pagination: {
        page,
        pageSize,
        total: 0, // 需要额外查询获取总数
      }
    }
  },
  
  // 事务处理
  async transaction(c: any, callback: (tx: any) => Promise<any>) {
    const db = getDB(c)
    // 注意：D1目前不支持事务，这里只是模拟
    // 在实际应用中，可能需要使用其他方式保证数据一致性
    try {
      const result = await callback(db)
      return result
    } catch (error) {
      console.error('事务执行失败:', error)
      throw error
    }
  }
}