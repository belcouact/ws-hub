export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  created_at: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isInitialized: boolean
}