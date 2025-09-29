// 用户类型
export interface User {
  id: number
  username: string
  email?: string
  role: 'viewer' | 'editor' | 'admin'
  created_at: string
}

// 故障标签类型
export interface FaultTag {
  id: number
  name: string
  color: string
  usage_count: number
}

// 维修报告类型
export interface Report {
  id: number
  created_at: string
  updated_at: string
  reporter: string
  device_name: string
  fault_tags: string[] // JSON数组
  duration_minutes?: number
  fault_category: string
  description: string
  attachments: Attachment[] // JSON数组
  is_deleted: number
  author_id?: number
}

// 附件类型
export interface Attachment {
  id: number
  filename: string
  url: string
  size: number
  type: string
}

// AI分析类型
export interface AIAnalysis {
  id: number
  report_id: number
  analysis_type: 'summary' | 'diagnosis' | 'solution'
  prompt: string
  response: string
  tokens_used?: number
  created_at: string
}

// 用户AI使用记录类型
export interface AIUsageLog {
  id: number
  user_id: number
  usage_date: string // YYYY-MM-DD
  request_count: number
  last_request_at?: string
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  timestamp: string
}

// 分页请求参数类型
export interface PaginationParams {
  page: number
  size: number
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// 维修报告查询参数类型
export interface ReportQueryParams extends PaginationParams {
  keyword?: string
  fault_category?: string
  tag_id?: number
  start_date?: string
  end_date?: string
  reporter?: string
}

// 创建维修报告参数类型
export interface CreateReportParams {
  device_name: string
  fault_tags: string[]
  duration_minutes?: number
  fault_category: string
  description: string
  attachments?: Attachment[]
}

// 更新维修报告参数类型
export interface UpdateReportParams extends Partial<CreateReportParams> {
  id: number
}

// AI诊断请求参数类型
export interface AIDiagnoseParams {
  device_name: string
  fault_description: string
  fault_tags?: string[]
}

// AI诊断响应类型
export interface AIDiagnoseResponse {
  diagnosis: string
  possible_causes: string[]
  suggested_solutions: string[]
  confidence: number
}

// AI使用统计类型
export interface AIUsageStats {
  total_requests: number
  total_tokens: number
  daily_usage: {
    date: string
    request_count: number
    token_count: number
  }[]
}