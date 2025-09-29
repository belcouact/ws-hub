import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../db'
import { faultTags } from '../db/schema'
import { eq, ilike, or, desc, sql } from 'drizzle-orm'

const tag = new Hono()

// 获取标签列表
tag.get('/', jwt({ alg: 'HS256' }), zValidator('query', z.object({
  page: z.coerce.number().int().min(1, '页码必须大于0').default(1),
  pageSize: z.coerce.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').default(10),
  keyword: z.string().optional(),
  sortBy: z.enum(['id', 'name', 'usageCount', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})), async (c) => {
  const { page, pageSize, keyword, sortBy, sortOrder } = c.req.valid('query')
  const db = getDB(c)
  
  try {
    // 构建查询条件
    let whereCondition = undefined
    
    if (keyword) {
      whereCondition = or(
        ilike(faultTags.name, `%${keyword}%`)
      )
    }
    
    // 查询总数
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(faultTags)
    
    if (whereCondition) {
      countQuery = countQuery.where(whereCondition)
    }
    
    const countResult = await countQuery
    const total = countResult[0].count
    
    // 查询标签列表
    const offset = (page - 1) * pageSize
    const orderBy = sortOrder === 'desc' ? desc(faultTags[sortBy]) : faultTags[sortBy]
    
    let tagsQuery = db
      .select({
        id: faultTags.id,
        name: faultTags.name,
        color: faultTags.color,
        usageCount: faultTags.usageCount,
        createdAt: faultTags.createdAt,
      })
      .from(faultTags)
    
    if (whereCondition) {
      tagsQuery = tagsQuery.where(whereCondition)
    }
    
    const tagsResult = await tagsQuery
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset)
    
    return c.json({
      success: true,
      message: '获取标签列表成功',
      data: {
        list: tagsResult,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('获取标签列表失败:', error)
    return c.json({
      success: false,
      message: '获取标签列表失败',
      data: null,
    }, 500)
  }
})

// 获取热门标签
tag.get('/popular', jwt({ alg: 'HS256' }), zValidator('query', z.object({
  limit: z.coerce.number().int().min(1, '数量必须大于0').max(50, '数量不能超过50').default(10),
})), async (c) => {
  const { limit } = c.req.valid('query')
  const db = getDB(c)
  
  try {
    const result = await db
      .select({
        id: faultTags.id,
        name: faultTags.name,
        color: faultTags.color,
        usageCount: faultTags.usageCount,
      })
      .from(faultTags)
      .orderBy(desc(faultTags.usageCount))
      .limit(limit)
    
    return c.json({
      success: true,
      message: '获取热门标签成功',
      data: result,
    })
  } catch (error) {
    console.error('获取热门标签失败:', error)
    return c.json({
      success: false,
      message: '获取热门标签失败',
      data: null,
    }, 500)
  }
})

// 创建标签
tag.post('/', jwt({ alg: 'HS256' }), zValidator('json', z.object({
  name: z.string().min(1, '标签名称不能为空').max(20, '标签名称不能超过20个字符'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '颜色格式不正确，应为#RRGGBB格式').default('#409EFF'),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { name, color } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 权限检查：只有编辑和管理员可以创建标签
    if (payload.role === 'viewer') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 检查标签名称是否已存在
    const existingTag = await db
      .select({ id: faultTags.id })
      .from(faultTags)
      .where(eq(faultTags.name, name))
      .limit(1)
    
    if (existingTag.length > 0) {
      return c.json({
        success: false,
        message: '标签名称已存在',
        data: null,
      }, 400)
    }
    
    // 创建标签
    const result = await db
      .insert(faultTags)
      .values({
        name,
        color,
        usageCount: 0,
      })
      .returning({
        id: faultTags.id,
        name: faultTags.name,
        color: faultTags.color,
        usageCount: faultTags.usageCount,
        createdAt: faultTags.createdAt,
      })
    
    return c.json({
      success: true,
      message: '创建标签成功',
      data: result[0],
    })
  } catch (error) {
    console.error('创建标签失败:', error)
    return c.json({
      success: false,
      message: '创建标签失败',
      data: null,
    }, 500)
  }
})

// 更新标签
tag.put('/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), zValidator('json', z.object({
  name: z.string().min(1, '标签名称不能为空').max(20, '标签名称不能超过20个字符'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '颜色格式不正确，应为#RRGGBB格式'),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { id } = c.req.valid('param')
  const { name, color } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 权限检查：只有编辑和管理员可以更新标签
    if (payload.role === 'viewer') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 检查标签是否存在
    const existingTag = await db
      .select({ id: faultTags.id, name: faultTags.name })
      .from(faultTags)
      .where(eq(faultTags.id, id))
      .limit(1)
    
    if (existingTag.length === 0) {
      return c.json({
        success: false,
        message: '标签不存在',
        data: null,
      }, 404)
    }
    
    // 检查标签名称是否已被其他标签使用
    if (name !== existingTag[0].name) {
      const nameConflict = await db
        .select({ id: faultTags.id })
        .from(faultTags)
        .where(
          and(
            eq(faultTags.name, name),
            sql`${faultTags.id} != ${id}`
          )
        )
        .limit(1)
      
      if (nameConflict.length > 0) {
        return c.json({
          success: false,
          message: '标签名称已存在',
          data: null,
        }, 400)
      }
    }
    
    // 更新标签
    const result = await db
      .update(faultTags)
      .set({
        name,
        color,
      })
      .where(eq(faultTags.id, id))
      .returning({
        id: faultTags.id,
        name: faultTags.name,
        color: faultTags.color,
        usageCount: faultTags.usageCount,
        createdAt: faultTags.createdAt,
      })
    
    return c.json({
      success: true,
      message: '更新标签成功',
      data: result[0],
    })
  } catch (error) {
    console.error('更新标签失败:', error)
    return c.json({
      success: false,
      message: '更新标签失败',
      data: null,
    }, 500)
  }
})

// 删除标签
tag.delete('/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { id } = c.req.valid('param')
  const db = getDB(c)
  
  try {
    // 权限检查：只有管理员可以删除标签
    if (payload.role !== 'admin') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 检查标签是否存在
    const existingTag = await db
      .select({ id: faultTags.id, usageCount: faultTags.usageCount })
      .from(faultTags)
      .where(eq(faultTags.id, id))
      .limit(1)
    
    if (existingTag.length === 0) {
      return c.json({
        success: false,
        message: '标签不存在',
        data: null,
      }, 404)
    }
    
    // 检查标签是否已被使用
    if (existingTag[0].usageCount > 0) {
      return c.json({
        success: false,
        message: '该标签已被使用，无法删除',
        data: null,
      }, 400)
    }
    
    // 删除标签
    await db
      .delete(faultTags)
      .where(eq(faultTags.id, id))
    
    return c.json({
      success: true,
      message: '删除标签成功',
      data: null,
    })
  } catch (error) {
    console.error('删除标签失败:', error)
    return c.json({
      success: false,
      message: '删除标签失败',
      data: null,
    }, 500)
  }
})

export default tag