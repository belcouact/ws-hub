import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../db'
import { getCurrentDate } from '../utils/date'
import { aiAnalyses, aiUsageLogs, reports } from '../db/schema'
import { eq, and, desc, gte, lte, sql, inArray } from 'drizzle-orm'

const ai = new Hono()

// AI故障诊断
ai.post('/diagnose', jwt({ alg: 'HS256' }), zValidator('json', z.object({
  reportId: z.number().int().positive('报告ID必须为正整数'),
  analysisType: z.enum(['summary', 'diagnosis', 'solution']).default('diagnosis'),
  customPrompt: z.string().optional(),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { reportId, analysisType, customPrompt } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 检查报告是否存在
    const reportResult = await db
      .select({
        id: reports.id,
        deviceName: reports.deviceName,
        faultCategory: reports.faultCategory,
        description: reports.description,
        faultTags: reports.faultTags,
      })
      .from(reports)
      .where(
        and(
          eq(reports.id, reportId),
          eq(reports.isDeleted, 0)
        )
      )
      .limit(1)
    
    if (reportResult.length === 0) {
      return c.json({
        success: false,
        message: '报告不存在',
        data: null,
      }, 404)
    }
    
    const report = reportResult[0]
    
    // 检查用户今日AI使用次数
    const today = getCurrentDate()
    const usageResult = await db
      .select({
        id: aiUsageLogs.id,
        requestCount: aiUsageLogs.requestCount,
      })
      .from(aiUsageLogs)
      .where(
        and(
          eq(aiUsageLogs.userId, payload.userId),
          eq(aiUsageLogs.usageDate, today)
        )
      )
      .limit(1)
    
    const maxDailyRequests = 10 // 每日最大请求次数
    
    if (usageResult.length > 0) {
      const usage = usageResult[0]
      if (usage.requestCount >= maxDailyRequests) {
        return c.json({
          success: false,
          message: `今日AI使用次数已达上限（${maxDailyRequests}次）`,
          data: null,
        }, 429)
      }
    }
    
    // 生成提示词
    let prompt = ''
    if (customPrompt) {
      prompt = customPrompt
    } else {
      switch (analysisType) {
        case 'summary':
          prompt = `请为以下设备维修报告生成一个简洁的摘要：
设备名称：${report.deviceName}
故障类别：${report.faultCategory}
维修描述：${report.description}
请提供100字以内的摘要，突出关键信息。`
          break
        case 'diagnosis':
          prompt = `请分析以下设备维修报告，提供可能的故障原因分析：
设备名称：${report.deviceName}
故障类别：${report.faultCategory}
维修描述：${report.description}
请提供详细的故障原因分析，包括可能的原因和排查思路。`
          break
        case 'solution':
          prompt = `请为以下设备维修报告提供解决方案建议：
设备名称：${report.deviceName}
故障类别：${report.faultCategory}
维修描述：${report.description}
请提供详细的解决方案，包括步骤和注意事项。`
          break
      }
    }
    
    // 调用AI API（这里使用模拟响应）
    const response = `这是针对报告ID ${reportId} 的${analysisType}分析结果。在实际应用中，这里会调用GLM-4.5 API获取真实的AI分析结果。`
    const tokensUsed = 100 // 模拟token使用量
    
    // 保存AI分析记录
    const analysisResult = await db
      .insert(aiAnalyses)
      .values({
        reportId,
        analysisType,
        prompt,
        response,
        tokensUsed,
      })
      .returning({
        id: aiAnalyses.id,
        analysisType: aiAnalyses.analysisType,
        createdAt: aiAnalyses.createdAt,
        tokensUsed: aiAnalyses.tokensUsed,
      })
    
    // 更新用户AI使用记录
    if (usageResult.length > 0) {
      // 更新现有记录
      await db
        .update(aiUsageLogs)
        .set({
          requestCount: sql`${aiUsageLogs.requestCount} + 1`,
          lastRequestAt: new Date().toISOString(),
        })
        .where(eq(aiUsageLogs.id, usageResult[0].id))
    } else {
      // 创建新记录
      await db
        .insert(aiUsageLogs)
        .values({
          userId: payload.userId,
          usageDate: today,
          requestCount: 1,
          lastRequestAt: new Date().toISOString(),
        })
    }
    
    return c.json({
      success: true,
      message: 'AI分析完成',
      data: {
        ...analysisResult[0],
        response,
      },
    })
  } catch (error) {
    console.error('AI分析失败:', error)
    return c.json({
      success: false,
      message: 'AI分析失败',
      data: null,
    }, 500)
  }
})

// 获取AI使用统计
ai.get('/usage', jwt({ alg: 'HS256' }), zValidator('query', z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { startDate, endDate } = c.req.valid('query')
  const db = getDB(c)
  
  try {
    // 构建查询条件
    const conditions = [eq(aiUsageLogs.userId, payload.userId)]
    
    if (startDate) {
      conditions.push(gte(aiUsageLogs.usageDate, startDate))
    }
    
    if (endDate) {
      conditions.push(lte(aiUsageLogs.usageDate, endDate))
    }
    
    const whereCondition = and(...conditions)
    
    // 查询用户使用统计
    const usageResult = await db
      .select({
        usageDate: aiUsageLogs.usageDate,
        requestCount: aiUsageLogs.requestCount,
        lastRequestAt: aiUsageLogs.lastRequestAt,
      })
      .from(aiUsageLogs)
      .where(whereCondition)
      .orderBy(desc(aiUsageLogs.usageDate))
    
    // 计算总请求数
    const totalResult = await db
      .select({
        totalRequests: sql<number>`SUM(${aiUsageLogs.requestCount})`,
      })
      .from(aiUsageLogs)
      .where(whereCondition)
    
    const totalRequests = totalResult[0].totalRequests || 0
    
    return c.json({
      success: true,
      message: '获取AI使用统计成功',
      data: {
        usage: usageResult,
        totalRequests,
      },
    })
  } catch (error) {
    console.error('获取AI使用统计失败:', error)
    return c.json({
      success: false,
      message: '获取AI使用统计失败',
      data: null,
    }, 500)
  }
})

// 获取AI分析记录列表
ai.get('/analyses', jwt({ alg: 'HS256' }), zValidator('query', z.object({
  page: z.coerce.number().int().min(1, '页码必须大于0').default(1),
  pageSize: z.coerce.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').default(10),
  reportId: z.number().int().positive('报告ID必须为正整数').optional(),
  analysisType: z.enum(['summary', 'diagnosis', 'solution']).optional(),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { page, pageSize, reportId, analysisType } = c.req.valid('query')
  const db = getDB(c)
  
  try {
    // 构建查询条件
    const conditions = []
    
    if (reportId) {
      conditions.push(eq(aiAnalyses.reportId, reportId))
    }
    
    if (analysisType) {
      conditions.push(eq(aiAnalyses.analysisType, analysisType))
    }
    
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined
    
    // 查询总数
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(aiAnalyses)
    
    if (whereCondition) {
      countQuery = countQuery.where(whereCondition)
    }
    
    const countResult = await countQuery
    const total = countResult[0].count
    
    // 查询分析记录列表
    const offset = (page - 1) * pageSize
    const analysesResult = await db
      .select({
        id: aiAnalyses.id,
        reportId: aiAnalyses.reportId,
        analysisType: aiAnalyses.analysisType,
        createdAt: aiAnalyses.createdAt,
        tokensUsed: aiAnalyses.tokensUsed,
      })
      .from(aiAnalyses)
      .where(whereCondition)
      .orderBy(desc(aiAnalyses.createdAt))
      .limit(pageSize)
      .offset(offset)
    
    // 获取关联的报告信息
    const reportIds = analysesResult.map(a => a.reportId)
    let reportMap = new Map()
    
    if (reportIds.length > 0) {
      const reportsResult = await db
        .select({
          id: reports.id,
          deviceName: reports.deviceName,
          faultCategory: reports.faultCategory,
        })
        .from(reports)
        .where(
          and(
            inArray(reports.id, reportIds),
            eq(reports.isDeleted, 0)
          )
        )
      
      reportsResult.forEach(report => {
        reportMap.set(report.id, report)
      })
    }
    
    // 组合数据
    const list = analysesResult.map(analysis => {
      const report = reportMap.get(analysis.reportId)
      return {
        ...analysis,
        report: report ? {
          id: report.id,
          deviceName: report.deviceName,
          faultCategory: report.faultCategory,
        } : null,
      }
    })
    
    return c.json({
      success: true,
      message: '获取AI分析记录列表成功',
      data: {
        list,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('获取AI分析记录列表失败:', error)
    return c.json({
      success: false,
      message: '获取AI分析记录列表失败',
      data: null,
    }, 500)
  }
})

// 获取AI分析记录详情
ai.get('/analyses/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), async (c) => {
  const { id } = c.req.valid('param')
  const db = getDB(c)
  
  try {
    // 查询分析记录详情
    const analysisResult = await db
      .select()
      .from(aiAnalyses)
      .where(eq(aiAnalyses.id, id))
      .limit(1)
    
    if (analysisResult.length === 0) {
      return c.json({
        success: false,
        message: '分析记录不存在',
        data: null,
      }, 404)
    }
    
    const analysis = analysisResult[0]
    
    // 获取关联的报告信息
    const reportResult = await db
      .select({
        id: reports.id,
        deviceName: reports.deviceName,
        faultCategory: reports.faultCategory,
        description: reports.description,
      })
      .from(reports)
      .where(
        and(
          eq(reports.id, analysis.reportId),
          eq(reports.isDeleted, 0)
        )
      )
      .limit(1)
    
    const report = reportResult.length > 0 ? reportResult[0] : null
    
    return c.json({
      success: true,
      message: '获取AI分析记录详情成功',
      data: {
        ...analysis,
        report,
      },
    })
  } catch (error) {
    console.error('获取AI分析记录详情失败:', error)
    return c.json({
      success: false,
      message: '获取AI分析记录详情失败',
      data: null,
    }, 500)
  }
})

export default ai