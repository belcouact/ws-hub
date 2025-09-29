import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../db'
import { reports, faultTags } from '../db/schema'
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm'

const report = new Hono()

// 获取报告列表
report.get('/', jwt({ alg: 'HS256' }), zValidator('query', z.object({
  page: z.coerce.number().int().min(1, '页码必须大于0').default(1),
  pageSize: z.coerce.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').default(10),
  faultCategory: z.string().optional(),
  faultTagIds: z.string().transform(val => {
    if (!val) return []
    try {
      return val.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    } catch {
      return []
    }
  }).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reporter: z.string().optional(),
  sortBy: z.enum(['id', 'deviceName', 'faultCategory', 'createdAt', 'durationMinutes']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})), async (c) => {
  const { page, pageSize, faultCategory, faultTagIds, startDate, endDate, reporter, sortBy, sortOrder } = c.req.valid('query')
  const db = getDB(c)
  
  try {
    // 构建查询条件
    const conditions = [eq(reports.isDeleted, 0)]
    
    if (faultCategory) {
      conditions.push(eq(reports.faultCategory, faultCategory))
    }
    
    if (startDate) {
      conditions.push(gte(reports.createdAt, startDate))
    }
    
    if (endDate) {
      conditions.push(lte(reports.createdAt, endDate))
    }
    
    if (reporter) {
      conditions.push(eq(reports.reporter, reporter))
    }
    
    const whereCondition = and(...conditions)
    
    // 构建标签筛选条件
    let tagFilterCondition = undefined
    if (faultTagIds && faultTagIds.length > 0) {
      tagFilterCondition = sql`EXISTS (
        SELECT 1 FROM json_each(${reports.faultTags}) AS tag 
        WHERE tag.value IN (${faultTagIds.join(',')})
      )`
    }
    
    // 查询总数
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(whereCondition)
    
    if (tagFilterCondition) {
      countQuery = countQuery.where(tagFilterCondition)
    }
    
    const countResult = await countQuery
    const total = countResult[0].count
    
    // 查询报告列表
    const offset = (page - 1) * pageSize
    const orderBy = sortOrder === 'desc' ? desc(reports[sortBy]) : reports[sortBy]
    
    let reportsQuery = db
      .select({
        id: reports.id,
        deviceName: reports.deviceName,
        faultCategory: reports.faultCategory,
        faultTags: reports.faultTags,
        durationMinutes: reports.durationMinutes,
        reporter: reports.reporter,
        createdAt: reports.createdAt,
        authorId: reports.authorId,
      })
      .from(reports)
      .where(whereCondition)
    
    if (tagFilterCondition) {
      reportsQuery = reportsQuery.where(tagFilterCondition)
    }
    
    const reportsResult = await reportsQuery
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset)
    
    // 获取标签详情
    const allTagIds = new Set<number>()
    reportsResult.forEach(report => {
      if (report.faultTags) {
        try {
          const tags = JSON.parse(report.faultTags as string) as number[]
          tags.forEach(id => allTagIds.add(id))
        } catch (e) {
          console.error('解析标签ID失败:', e)
        }
      }
    })
    
    let tagDetails: any[] = []
    if (allTagIds.size > 0) {
      tagDetails = await db
        .select({
          id: faultTags.id,
          name: faultTags.name,
          color: faultTags.color,
        })
        .from(faultTags)
        .where(inArray(faultTags.id, Array.from(allTagIds)))
    }
    
    // 构建标签映射
    const tagMap = new Map()
    tagDetails.forEach(tag => {
      tagMap.set(tag.id, tag)
    })
    
    // 组合数据
    const list = reportsResult.map(report => {
      let tags = []
      if (report.faultTags) {
        try {
          const tagIds = JSON.parse(report.faultTags as string) as number[]
          tags = tagIds.map(id => tagMap.get(id)).filter(Boolean)
        } catch (e) {
          console.error('解析标签失败:', e)
        }
      }
      
      return {
        ...report,
        tags,
      }
    })
    
    return c.json({
      success: true,
      message: '获取报告列表成功',
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
    console.error('获取报告列表失败:', error)
    return c.json({
      success: false,
      message: '获取报告列表失败',
      data: null,
    }, 500)
  }
})

// 获取报告详情
report.get('/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), async (c) => {
  const { id } = c.req.valid('param')
  const db = getDB(c)
  
  try {
    // 查询报告详情
    const reportResult = await db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.id, id),
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
    
    // 获取标签详情
    let tags = []
    if (report.faultTags) {
      try {
        const tagIds = JSON.parse(report.faultTags as string) as number[]
        if (tagIds.length > 0) {
          const tagDetails = await db
            .select({
              id: faultTags.id,
              name: faultTags.name,
              color: faultTags.color,
            })
            .from(faultTags)
            .where(inArray(faultTags.id, tagIds))
          
          tags = tagDetails
        }
      } catch (e) {
        console.error('解析标签失败:', e)
      }
    }
    
    // 获取AI分析记录
    const aiAnalyses = await db
      .select({
        id: sql<number>`ai_analyses.id`,
        analysisType: sql<string>`ai_analyses.analysis_type`,
        createdAt: sql<string>`ai_analyses.created_at`,
        tokensUsed: sql<number>`ai_analyses.tokens_used`,
      })
      .from(sql`ai_analyses`)
      .where(eq(sql`ai_analyses.report_id`, id))
      .orderBy(desc(sql`ai_analyses.created_at`))
    
    return c.json({
      success: true,
      message: '获取报告详情成功',
      data: {
        ...report,
        tags,
        aiAnalyses,
      },
    })
  } catch (error) {
    console.error('获取报告详情失败:', error)
    return c.json({
      success: false,
      message: '获取报告详情失败',
      data: null,
    }, 500)
  }
})

// 创建报告
report.post('/', jwt({ alg: 'HS256' }), zValidator('json', z.object({
  deviceName: z.string().min(1, '设备名称不能为空'),
  faultCategory: z.string().min(1, '故障类别不能为空'),
  faultTagIds: z.array(z.number().int().positive('标签ID必须为正整数')).optional(),
  durationMinutes: z.number().int().min(0, '维修时长不能为负数').optional(),
  description: z.string().min(1, '维修描述不能为空'),
  attachments: z.array(z.string()).optional(),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { deviceName, faultCategory, faultTagIds, durationMinutes, description, attachments } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 权限检查：只有编辑和管理员可以创建报告
    if (payload.role === 'viewer') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 检查标签是否存在
    if (faultTagIds && faultTagIds.length > 0) {
      const tagCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(faultTags)
        .where(inArray(faultTags.id, faultTagIds))
      
      if (tagCountResult[0].count !== faultTagIds.length) {
        return c.json({
          success: false,
          message: '包含不存在的标签',
          data: null,
        }, 400)
      }
    }
    
    // 创建报告
    const result = await db
      .insert(reports)
      .values({
        deviceName,
        faultCategory,
        faultTags: faultTagIds ? JSON.stringify(faultTagIds) : null,
        durationMinutes,
        description,
        attachments: attachments ? JSON.stringify(attachments) : null,
        reporter: payload.username,
        authorId: payload.userId,
      })
      .returning({
        id: reports.id,
        deviceName: reports.deviceName,
        faultCategory: reports.faultCategory,
        faultTags: reports.faultTags,
        durationMinutes: reports.durationMinutes,
        description: reports.description,
        attachments: reports.attachments,
        reporter: reports.reporter,
        createdAt: reports.createdAt,
      })
    
    const newReport = result[0]
    
    // 更新标签使用计数
    if (faultTagIds && faultTagIds.length > 0) {
      await db
        .update(faultTags)
        .set({
          usageCount: sql`${faultTags.usageCount} + 1`,
        })
        .where(inArray(faultTags.id, faultTagIds))
    }
    
    return c.json({
      success: true,
      message: '创建报告成功',
      data: newReport,
    })
  } catch (error) {
    console.error('创建报告失败:', error)
    return c.json({
      success: false,
      message: '创建报告失败',
      data: null,
    }, 500)
  }
})

// 更新报告
report.put('/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), zValidator('json', z.object({
  deviceName: z.string().min(1, '设备名称不能为空'),
  faultCategory: z.string().min(1, '故障类别不能为空'),
  faultTagIds: z.array(z.number().int().positive('标签ID必须为正整数')).optional(),
  durationMinutes: z.number().int().min(0, '维修时长不能为负数').optional(),
  description: z.string().min(1, '维修描述不能为空'),
  attachments: z.array(z.string()).optional(),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { id } = c.req.valid('param')
  const { deviceName, faultCategory, faultTagIds, durationMinutes, description, attachments } = c.req.valid('json')
  const db = getDB(c)
  
  try {
    // 权限检查：只有编辑和管理员可以更新报告
    if (payload.role === 'viewer') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 检查报告是否存在
    const existingReport = await db
      .select({
        id: reports.id,
        faultTags: reports.faultTags,
      })
      .from(reports)
      .where(
        and(
          eq(reports.id, id),
          eq(reports.isDeleted, 0)
        )
      )
      .limit(1)
    
    if (existingReport.length === 0) {
      return c.json({
        success: false,
        message: '报告不存在',
        data: null,
      }, 404)
    }
    
    // 检查标签是否存在
    if (faultTagIds && faultTagIds.length > 0) {
      const tagCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(faultTags)
        .where(inArray(faultTags.id, faultTagIds))
      
      if (tagCountResult[0].count !== faultTagIds.length) {
        return c.json({
          success: false,
          message: '包含不存在的标签',
          data: null,
        }, 400)
      }
    }
    
    // 获取原有标签
    const report = existingReport[0]
    let oldTagIds: number[] = []
    if (report.faultTags) {
      try {
        oldTagIds = JSON.parse(report.faultTags as string) as number[]
      } catch (e) {
        console.error('解析原有标签失败:', e)
      }
    }
    
    // 更新报告
    const result = await db
      .update(reports)
      .set({
        deviceName,
        faultCategory,
        faultTags: faultTagIds ? JSON.stringify(faultTagIds) : null,
        durationMinutes,
        description,
        attachments: attachments ? JSON.stringify(attachments) : null,
      })
      .where(eq(reports.id, id))
      .returning({
        id: reports.id,
        deviceName: reports.deviceName,
        faultCategory: reports.faultCategory,
        faultTags: reports.faultTags,
        durationMinutes: reports.durationMinutes,
        description: reports.description,
        attachments: reports.attachments,
        reporter: reports.reporter,
        createdAt: reports.createdAt,
      })
    
    const updatedReport = result[0]
    
    // 更新标签使用计数
    const newTagIds = faultTagIds || []
    
    // 计算需要增加和减少的标签
    const tagsToAdd = newTagIds.filter(id => !oldTagIds.includes(id))
    const tagsToRemove = oldTagIds.filter(id => !newTagIds.includes(id))
    
    // 增加新标签的使用计数
    if (tagsToAdd.length > 0) {
      await db
        .update(faultTags)
        .set({
          usageCount: sql`${faultTags.usageCount} + 1`,
        })
        .where(inArray(faultTags.id, tagsToAdd))
    }
    
    // 减少移除标签的使用计数（确保不会小于0）
    if (tagsToRemove.length > 0) {
      await db
        .update(faultTags)
        .set({
          usageCount: sql`MAX(0, ${faultTags.usageCount} - 1)`,
        })
        .where(inArray(faultTags.id, tagsToRemove))
    }
    
    return c.json({
      success: true,
      message: '更新报告成功',
      data: updatedReport,
    })
  } catch (error) {
    console.error('更新报告失败:', error)
    return c.json({
      success: false,
      message: '更新报告失败',
      data: null,
    }, 500)
  }
})

// 删除报告
report.delete('/:id', jwt({ alg: 'HS256' }), zValidator('param', z.object({
  id: z.coerce.number().int().positive('ID必须为正整数'),
})), async (c) => {
  const payload = c.get('jwtPayload')
  const { id } = c.req.valid('param')
  const db = getDB(c)
  
  try {
    // 权限检查：只有管理员可以删除报告
    if (payload.role !== 'admin') {
      return c.json({
        success: false,
        message: '权限不足',
        data: null,
      }, 403)
    }
    
    // 检查报告是否存在
    const existingReport = await db
      .select({
        id: reports.id,
        faultTags: reports.faultTags,
      })
      .from(reports)
      .where(
        and(
          eq(reports.id, id),
          eq(reports.isDeleted, 0)
        )
      )
      .limit(1)
    
    if (existingReport.length === 0) {
      return c.json({
        success: false,
        message: '报告不存在',
        data: null,
      }, 404)
    }
    
    const report = existingReport[0]
    
    // 获取标签ID
    let tagIds: number[] = []
    if (report.faultTags) {
      try {
        tagIds = JSON.parse(report.faultTags as string) as number[]
      } catch (e) {
        console.error('解析标签失败:', e)
      }
    }
    
    // 软删除报告
    await db
      .update(reports)
      .set({
        isDeleted: 1,
      })
      .where(eq(reports.id, id))
    
    // 减少标签使用计数（确保不会小于0）
    if (tagIds.length > 0) {
      await db
        .update(faultTags)
        .set({
          usageCount: sql`MAX(0, ${faultTags.usageCount} - 1)`,
        })
        .where(inArray(faultTags.id, tagIds))
    }
    
    return c.json({
      success: true,
      message: '删除报告成功',
      data: null,
    })
  } catch (error) {
    console.error('删除报告失败:', error)
    return c.json({
      success: false,
      message: '删除报告失败',
      data: null,
    }, 500)
  }
})

export default report