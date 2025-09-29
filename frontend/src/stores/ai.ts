import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/utils/http'
import type { AIDiagnoseParams, AIDiagnoseResponse, AIUsageLog } from '@/types'

export const useAIStore = defineStore('ai', () => {
  // 状态
  const diagnosing = ref(false)
  const diagnosisResult = ref<AIDiagnoseResponse | null>(null)
  const usageLogs = ref<AIUsageLog[]>([])
  const dailyUsageCount = ref(0)
  const loading = ref(false)

  // AI故障诊断
  const diagnose = async (params: AIDiagnoseParams) => {
    diagnosing.value = true
    try {
      const response = await http.post<AIDiagnoseResponse>('/ai/diagnose', params)
      diagnosisResult.value = response.data
      return response.data
    } catch (error) {
      throw error
    } finally {
      diagnosing.value = false
    }
  }

  // 获取AI使用统计
  const fetchUsageStats = async () => {
    loading.value = true
    try {
      const response = await http.get<{ logs: AIUsageLog[], today_count: number }>('/ai/usage')
      usageLogs.value = response.data.logs
      dailyUsageCount.value = response.data.today_count
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 清空诊断结果
  const clearDiagnosisResult = () => {
    diagnosisResult.value = null
  }

  return {
    diagnosing,
    diagnosisResult,
    usageLogs,
    dailyUsageCount,
    loading,
    diagnose,
    fetchUsageStats,
    clearDiagnosisResult
  }
})