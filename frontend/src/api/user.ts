import http from './http'
import type { User, LoginParams, RegisterParams, ChangePasswordParams } from '@/types/user'

export const userApi = {
  // 用户登录
  login(username: string, password: string) {
    return http.post<{ token: string; user: User }>('/auth/login', { username, password })
  },

  // 用户注册
  register(username: string, email: string, password: string) {
    return http.post<{ token: string; user: User }>('/auth/register', { username, email, password })
  },

  // 获取当前用户信息
  getCurrentUser() {
    return http.get<User>('/auth/me')
  },

  // 修改密码
  changePassword(oldPassword: string, newPassword: string) {
    return http.post<void>('/auth/change-password', { oldPassword, newPassword })
  },

  // 用户登出
  logout() {
    return http.post<void>('/auth/logout')
  }
}