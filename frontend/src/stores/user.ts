import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)
  const isInitialized = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.role || 'viewer')
  const isAdmin = computed(() => role.value === 'admin')
  const isEditor = computed(() => role.value === 'editor' || isAdmin.value)

  // 登录
  const login = async (username: string, password: string) => {
    loading.value = true
    try {
      const response = await userApi.login(username, password)
      token.value = response.token
      user.value = response.user
      localStorage.setItem('token', token.value)
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (username: string, email: string, password: string) => {
    loading.value = true
    try {
      const response = await userApi.register(username, email, password)
      token.value = response.token
      user.value = response.user
      localStorage.setItem('token', token.value)
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    if (!token.value) return
    
    loading.value = true
    try {
      const currentUser = await userApi.getCurrentUser()
      user.value = currentUser
      return currentUser
    } catch (error) {
      // 如果获取用户信息失败，可能是token过期，清除token
      logout()
      throw error
    } finally {
      loading.value = false
    }
  }

  // 修改密码
  const changePassword = async (oldPassword: string, newPassword: string) => {
    loading.value = true
    try {
      await userApi.changePassword(oldPassword, newPassword)
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 初始化用户状态
  const initialize = async () => {
    if (token.value && !user.value) {
      try {
        await fetchCurrentUser()
      } catch (error) {
        console.error('Failed to initialize user:', error)
      }
    }
    isInitialized.value = true
  }

  return {
    user,
    token,
    loading,
    isInitialized,
    isLoggedIn,
    role,
    isAdmin,
    isEditor,
    login,
    register,
    logout,
    fetchCurrentUser,
    changePassword,
    initialize
  }
})