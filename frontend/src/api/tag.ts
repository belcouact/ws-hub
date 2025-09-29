import http from './http'
import type { FaultTag } from '@/types/tag'

export const tagApi = {
  // 获取标签列表
  getTags(keyword?: string) {
    return http.get<FaultTag[]>('/tags', { params: { keyword } })
  },
  
  // 创建标签
  createTag(name: string, color?: string) {
    return http.post<FaultTag>('/tags', { name, color })
  },
  
  // 更新标签
  updateTag(id: number, name: string, color?: string) {
    return http.put<FaultTag>(`/tags/${id}`, { name, color })
  },
  
  // 删除标签
  deleteTag(id: number) {
    return http.delete<void>(`/tags/${id}`)
  }
}