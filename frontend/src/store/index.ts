import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: '' as string, user: null as any }),
  actions: {
    login(token: string, user: any) { this.token = token; this.user = user },
    logout() { this.token = ''; this.user = null }
  }
})
