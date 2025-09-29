import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { timing } from 'hono/timing'
import { secureHeaders } from 'hono/secure-headers'

import auth from './routes/auth'
import user from './routes/user'
import report from './routes/report'
import tag from './routes/tag'
import ai from './routes/ai'

const app = new Hono()

// 中间件
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', timing())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // 前端开发服务器地址
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// 路由
app.route('/api/auth', auth)
app.route('/api/users', user)
app.route('/api/reports', report)
app.route('/api/tags', tag)
app.route('/api/ai', ai)

// 健康检查
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
      environment: process.env.NODE_ENV || 'development',
    },
    message: 'Service is healthy',
  })
})

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Not Found',
    error: {
      status: 404,
      text: 'The requested resource was not found',
    },
    timestamp: new Date().toISOString(),
  }, 404)
})

// 全局错误处理
app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`)
  
  return c.json({
    success: false,
    message: 'Internal Server Error',
    error: {
      status: 500,
      text: err.message,
    },
    timestamp: new Date().toISOString(),
  }, 500)
})

export default app