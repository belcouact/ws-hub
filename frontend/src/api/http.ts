import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 创建axios实例
const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
http.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const userStore = useUserStore()
    // 如果token存在，则在请求头中添加Authorization
    if (userStore.token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // Backend responses use { success: boolean, message: string, data: any }
    if (res && typeof res === 'object') {
      if (res.success === false) {
        ElMessage.error(res.message || '系统错误')

        // handle auth failure when backend returns 401 status via error handler below
        return Promise.reject(new Error(res.message || '系统错误'))
      }

      // when success true, return data directly
      return res.data
    }

    // if response shape is unexpected, just return response.data
    return response.data
  },
  (error) => {
    // 处理HTTP错误
    let message = '系统错误'
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请登录'
          // 清除用户信息并跳转到登录页
          const userStore = useUserStore()
          userStore.logout()
          window.location.href = '/login'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 429:
          message = '请求过于频繁，请稍后再试'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `系统错误: ${error.response.status}`
      }
    } else if (error.request) {
      message = '网络错误，请检查您的网络连接'
    } else {
      message = error.message || '系统错误'
    }
    
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  }
)

export default http