import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../db'
import { users } from '../db/schema'
import { eq, ilike, or, desc, sql } from 'drizzle-orm'

const user = new Hono()

// 获取用户列表
user.get('/', jwt({ alg: 'HS256' }), zValidator('query', z.object({
  page: z.coerce.number().int().min(1, '页码必须大于0').default(1),
  pageSize: z.coerce.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').default(10),
  search: z.string().optional(),
  role: z.enum(['viewer', 'editor', 'admin']).optional(),
  sortBy: z.enum(['id', 'username', 'email', 'role', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})), async (c) => {
  const { page, pageSize, search, role, sortBy, sortOrder } = c.req.valid('query')
  const db = getDB(c)
  
  try {
    // 构建查询条件
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      )
    }
    
    if (role) {
      conditions.push(eq(users.role, role))
    }
    
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined
    
    // 查询总数
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
    
    if (whereCondition) {
      countQuery = countQuery.where(whereCondition)
    }
    
    const countResult = await countQuery
    const total = countResult[0].count
    
    // 查询用户列表
    const offset = (page - 1) * pageSize
    const orderBy = sortOrder === 'desc' ? desc(users[sortBy]) : users[sortBy]
    
    let usersQuery = db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
    
    if (whereCondition) {
      usersQuery = usersQuery.where(whereCondition)
    }
    
    const usersResult = await usersQuery
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset)
    
    return c.json({
      success: true,
      message: '获取用户列表成功',
      data: {
        list: usersResult,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return c.json({
      success: false,
      message: '获取用户列表失败',
      data: null,
    }, 500)
  }
})

// 获取用户详情
user.get('/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), async (c) => {
  const { id } = c.req.valid('param')
  const db = getDB(c)
  
  try {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    
    if (result.length === 0) {
      return c.json({
        success: false,
        message: '用户不存在',
        data: null,
      }, 404)
    }
    
    return c.json({
      success: true,
      message: '获取用户详情成功',
      data: result[0],
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return c.json({
      success: false,
      message: '获取用户详情失败',
      data: null,
    }, 500)
  }
})

// 创建用户
user.post('/', jwt({ alg: 'HS256' }), zValidator('json', z.object({
  username: z.string().min(3, '用户名至少需要3个字符'),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  password: z.string().min(6, '密码至少需要6个字符'),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { username, email, password, role } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 权限检查：只有管理员可以创建用户
    if (payload.role !== 'admin') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 检查用户名是否已存在
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
    
    if (existingUser.length > 0) {
      return c.json({
        success: false,
        message: '用户名已存在',
        data: null,
      }, 400)
    }
    
    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingEmail = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
      
      if (existingEmail.length > 0) {
        return c.json({
          success: false,
          message: '邮箱已被使用',
          data: null,
        }, 400)
      }
    }
    
    // 创建用户
    const result = await db
      .insert(users)
      .values({
        username,
        email: email || null,
        password, // 实际应用中应该加密存储
        role,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
    
    return c.json({
      success: true,
      message: '创建用户成功',
      data: result[0],
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    return c.json({
      success: false,
      message: '创建用户失败',
      data: null,
    }, 500)
  }
})

// 更新用户
user.put('/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), zValidator('json', z.object({
  username: z.string().min(3, '用户名至少需要3个字符'),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  role: z.enum(['viewer', 'editor', 'admin']),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { id } = c.req.valid('param')
  const { username, email, role } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 权限检查：只有管理员可以更新用户
    if (payload.role !== 'admin') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 检查用户是否存在
    const existingUser = await db
      .select({ 
        id: users.id, 
        username: users.username, 
        email: users.email 
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    
    if (existingUser.length === 0) {
      return c.json({
        success: false,
        message: '用户不存在',
        data: null,
      }, 404)
    }
    
    const user = existingUser[0]
    
    // 检查用户名是否已被其他用户使用
    if (username !== user.username) {
      const usernameConflict = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.username, username),
            sql`${users.id} != ${id}`
          )
        )
        .limit(1)
      
      if (usernameConflict.length > 0) {
        return c.json({
          success: false,
          message: '用户名已存在',
          data: null,
        }, 400)
      }
    }
    
    // 检查邮箱是否已被其他用户使用（如果提供了邮箱）
    if (email && email !== user.email) {
      const emailConflict = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.email, email),
            sql`${users.id} != ${id}`
          )
        )
        .limit(1)
      
      if (emailConflict.length > 0) {
        return c.json({
          success: false,
          message: '邮箱已被使用',
          data: null,
        }, 400)
      }
    }
    
    // 更新用户
    const result = await db
      .update(users)
      .set({
        username,
        email: email || null,
        role,
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
    
    return c.json({
      success: true,
      message: '更新用户成功',
      data: result[0],
    })
  } catch (error) {
    console.error('更新用户失败:', error)
    return c.json({
      success: false,
      message: '更新用户失败',
      data: null,
    }, 500)
  }
})

// 删除用户
user.delete('/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { id } = c.req.valid('param')
  const db = getDB(c)
  
  try {
    // 权限检查：只有管理员可以删除用户
    if (payload.role !== 'admin') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 不能删除自己
    if (id === payload.userId) {
      return c.json({
        success: false,
        message: '不能删除自己的账户',
        data: null,
      }, 400)
    }
    
    // 检查用户是否存在
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    
    if (existingUser.length === 0) {
      return c.json({
        success: false,
        message: '用户不存在',
        data: null,
      }, 404)
    }
    
    // 删除用户
    await db
      .delete(users)
      .where(eq(users.id, id))
    
    return c.json({
      success: true,
      message: '删除用户成功',
      data: null,
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    return c.json({
      success: false,
      message: '删除用户失败',
      data: null,
    }, 500)
  }
})

export default user