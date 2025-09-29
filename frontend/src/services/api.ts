import { Article, Repair, User } from './models'

// Very small in-memory mock DB to make pages functional without backend
const users: User[] = [
  { id: 'u1', username: 'alice', name: 'Alice', role: 'technician' },
  { id: 'u2', username: 'bob', name: 'Bob', role: 'admin' }
]

let articles: Article[] = [
  { id: 'a1', title: 'Fix overheating motor', summary: 'Steps to fix motor overheating', content: '1. Check bearings\n2. Replace fan', authorId: 'u1', tags: ['motor','heat'], createdAt: new Date().toISOString() },
  { id: 'a2', title: 'Replace belt', summary: 'Belt replacement procedure', content: '1. Stop machine\n2. Remove cover', authorId: 'u2', tags: ['belt'], createdAt: new Date().toISOString() }
]

let repairs: Repair[] = [
  { id: 'r1', machineId: 'm1', technicianId: 'u1', symptoms: 'Noisy motor', diagnosis: 'Worn bearings', createdAt: new Date().toISOString() }
]

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      const user = users.find(u => u.username === username)
      if (!user) throw { status: 401, message: 'invalid credentials' }
      return { token: 'mock-token-'+user.id, user }
    }
  },
  articles: {
    list: async (q?: string) => {
      if (!q) return { data: articles }
      const lowered = q.toLowerCase()
      return { data: articles.filter(a => a.title.toLowerCase().includes(lowered) || a.content.toLowerCase().includes(lowered)) }
    },
    get: async (id: string) => articles.find(a => a.id === id),
    create: async (payload: Partial<Article>) => {
      const a: Article = { id: 'a' + (articles.length + 1), title: payload.title || 'Untitled', content: payload.content || '', authorId: payload.authorId || 'u1', createdAt: new Date().toISOString() }
      articles.unshift(a)
      return a
    }
  },
  repairs: {
    list: async () => ({ data: repairs }),
    create: async (payload: Partial<Repair>) => {
      const r: Repair = { id: 'r' + (repairs.length + 1), machineId: payload.machineId || 'm1', technicianId: payload.technicianId || 'u1', symptoms: payload.symptoms || '', createdAt: new Date().toISOString() }
      repairs.unshift(r)
      return r
    },
    get: async (id: string) => repairs.find(r => r.id === id)
  },
  users: {
    list: async () => users
  }
}
