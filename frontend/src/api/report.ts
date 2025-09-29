import http from './http'
import type { 
  Report, 
  CreateReportRequest, 
  UpdateReportRequest, 
  ReportsQueryParams
} from '@/types/report'

export const reportApi = {
  // 获取报告列表
  getReports(params: ReportsQueryParams) {
    return http.get<{ list: Report[], total: number }>('/reports', { params })
  },
  
  // 获取报告详情
  getReportById(id: number) {
    return http.get<Report>(`/reports/${id}`)
  },
  
  // 创建报告
  createReport(data: CreateReportRequest) {
    return http.post<Report>('/reports', data)
  },
  
  // 更新报告
  updateReport(id: number, data: UpdateReportRequest) {
    return http.put<Report>(`/reports/${id}`, data)
  },
  
  // 删除报告
  deleteReport(id: number) {
    return http.delete<void>(`/reports/${id}`)
  },
  
  // 上传报告附件
  uploadAttachment(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append('file', file)
    
    return http.post<{ url: string, filename: string }>('/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  },
  
  // 下载报告附件
  downloadAttachment(url: string, filename: string) {
    return http.get(url, {
      responseType: 'blob'
    }).then(response => {
      const blobUrl = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    })
  }
}