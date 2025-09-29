import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/utils/http'
import type { Report, ReportQueryParams, CreateReportParams, UpdateReportParams, PaginatedResponse } from '@/types'

export const useReportStore = defineStore('report', () => {
  // 状态
  const reports = ref<Report[]>([])
  const currentReport = ref<Report | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 计算属性
  const hasReports = computed(() => reports.value.length > 0)

  // 获取维修报告列表
  const fetchReports = async (params: ReportQueryParams = { page: 1, size: 10 }) => {
    loading.value = true
    try {
      const response = await http.get<PaginatedResponse<Report>>('/reports', { params })
      reports.value = response.data.items
      total.value = response.data.total
      currentPage.value = response.data.page
      pageSize.value = response.data.size
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取维修报告详情
  const fetchReportById = async (id: number) => {
    loading.value = true
    try {
      const response = await http.get<Report>(`/reports/${id}`)
      currentReport.value = response.data
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建维修报告
  const createReport = async (params: CreateReportParams) => {
    loading.value = true
    try {
      const response = await http.post<Report>('/reports', params)
      // 将新报告添加到列表开头
      reports.value.unshift(response.data)
      total.value += 1
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新维修报告
  const updateReport = async (params: UpdateReportParams) => {
    loading.value = true
    try {
      const response = await http.put<Report>(`/reports/${params.id}`, params)
      // 更新列表中的报告
      const index = reports.value.findIndex(r => r.id === params.id)
      if (index !== -1) {
        reports.value[index] = response.data
      }
      // 如果是当前查看的报告，也更新它
      if (currentReport.value && currentReport.value.id === params.id) {
        currentReport.value = response.data
      }
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除维修报告
  const deleteReport = async (id: number) => {
    loading.value = true
    try {
      await http.delete(`/reports/${id}`)
      // 从列表中移除报告
      reports.value = reports.value.filter(r => r.id !== id)
      total.value -= 1
      // 如果删除的是当前查看的报告，清空它
      if (currentReport.value && currentReport.value.id === id) {
        currentReport.value = null
      }
      return true
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 清空当前报告
  const clearCurrentReport = () => {
    currentReport.value = null
  }

  return {
    reports,
    currentReport,
    loading,
    total,
    currentPage,
    pageSize,
    hasReports,
    fetchReports,
    fetchReportById,
    createReport,
    updateReport,
    deleteReport,
    clearCurrentReport
  }
})