export interface Report {
  id: number
  created_at: string
  updated_at: string
  reporter: string
  device_name: string
  fault_tags: string[]
  duration_minutes: number
  fault_category: string
  description: string
  attachments: Attachment[]
  is_deleted: number
  author_id: number
}

export interface Attachment {
  id: number
  filename: string
  url: string
  size: number
  type: string
}

export interface CreateReportRequest {
  device_name: string
  fault_tags: string[]
  duration_minutes: number
  fault_category: string
  description: string
  attachments?: Attachment[]
}

export interface UpdateReportRequest {
  device_name?: string
  fault_tags?: string[]
  duration_minutes?: number
  fault_category?: string
  description?: string
  attachments?: Attachment[]
}

export interface ReportsQueryParams {
  page?: number
  size?: number
  keyword?: string
  fault_category?: string
  fault_tags?: string[]
  reporter?: string
  start_date?: string
  end_date?: string
}