import http from './http'
import type { AIDiagnoseRequest, AIDiagnoseResponse, AIUsageStats } from '@/types/ai'

export const aiApi = {
  // AI故障诊断
  diagnose(data: AIDiagnoseRequest) {
    return http.post<AIDiagnoseResponse>('/ai/diagnose', data)
  },
  
  // 获取AI使用统计
  getUsageStats() {
    return http.get<AIUsageStats>('/ai/usage')
  }
}