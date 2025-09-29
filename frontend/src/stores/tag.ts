import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/utils/http'
import type { FaultTag } from '@/types'

export const useTagStore = defineStore('tag', () => {
  // 状态
  const tags = ref<FaultTag[]>([])
  const loading = ref(false)

  // 获取故障标签列表
  const fetchTags = async () => {
    loading.value = true
    try {
      const response = await http.get<FaultTag[]>('/tags')
      tags.value = response.data
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建故障标签
  const createTag = async (name: string, color = '#409EFF') => {
    loading.value = true
    try {
      const response = await http.post<FaultTag>('/tags', { name, color })
      tags.value.push(response.data)
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新故障标签
  const updateTag = async (id: number, name: string, color: string) => {
    loading.value = true
    try {
      const response = await http.put<FaultTag>(`/tags/${id}`, { name, color })
      const index = tags.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tags.value[index] = response.data
      }
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除故障标签
  const deleteTag = async (id: number) => {
    loading.value = true
    try {
      await http.delete(`/tags/${id}`)
      tags.value = tags.value.filter(t => t.id !== id)
      return true
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取标签
  const getTagById = (id: number) => {
    return tags.value.find(tag => tag.id === id)
  }

  // 根据名称获取标签
  const getTagByName = (name: string) => {
    return tags.value.find(tag => tag.name === name)
  }

  // 获取所有标签名称
  const getTagNames = () => {
    return tags.value.map(tag => tag.name)
  }

  return {
    tags,
    loading,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagByName,
    getTagNames
  }
})