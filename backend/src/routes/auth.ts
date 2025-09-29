import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import { hashPassword, verifyPassword } from '../utils/auth'

const auth = new Hono()

// 登录
auth.post('/login', zValidator('json', z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})), async (c) => {
  const { username, password } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 查找用户
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
    
    if (result.length === 0) {
      return c.json({
        success: false,
        message: '用户名或密码错误',
        data: null,
      }, 401)
    }
    
    const user = result[0]
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      return c.json({
        success: false,
        message: '用户名或密码错误',
        data: null,
      }, 401)
    }
    
    // 生成JWT令牌
    const jwtPayload = {
      sub: user.id.toString(),
      userId: user.id,
      username: user.username,
      role: user.role,
    }
    
    const token = await sign(jwtPayload, process.env.JWT_SECRET || 'default-secret')
    
    return c.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error('登录失败:', error)
    return c.json({
      success: false,
      message: '登录失败',
      data: null,
    }, 500)
  }
})

// 注册
auth.post('/register', zValidator('json', z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
})), async (c) => {
  const { username, password, email } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 检查用户名是否已存在
    const existingUser = await db
      .select()
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
        .select()
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
    
    // 加密密码
    const hashedPassword = await hashPassword(password)
    
    // 创建用户
    const result = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        email: email || null,
        role: 'viewer', // 默认角色为查看者
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
    
    const newUser = result[0]
    
    // 生成JWT令牌
    const jwtPayload = {
      sub: newUser.id.toString(),
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
    }
    
    const token = await sign(jwtPayload, process.env.JWT_SECRET || 'default-secret')
    
    return c.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      },
    })
  } catch (error) {
    console.error('注册失败:', error)
    return c.json({
      success: false,
      message: '注册失败',
      data: null,
    }, 500)
  }
})

// 修改密码
auth.post('/change-password', jwt({ alg: 'HS256' }), zValidator('json', z.object({
  oldPassword: z.string().min(1, '原密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { oldPassword, newPassword } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 查找用户
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)
    
    if (result.length === 0) {
      return c.json({
        success: false,
        message: '用户不存在',
        data: null,
      }, 404)
    }
    
    const user = result[0]
    
    // 验证原密码
    const isPasswordValid = await verifyPassword(oldPassword, user.password)
    
    if (!isPasswordValid) {
      return c.json({
        success: false,
        message: '原密码错误',
        data: null,
      }, 400)
    }
    
    // 加密新密码
    const hashedNewPassword = await hashPassword(newPassword)
    
    // 更新密码
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
      })
      .where(eq(users.id, payload.userId))
    
    return c.json({
      success: true,
      message: '密码修改成功',
      data: null,
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    return c.json({
      success: false,
      message: '修改密码失败',
      data: null,
    }, 500)
  }
})

export default auth