export interface User {
  id: string
  username: string
  name: string
  email?: string
  role?: string
}

export interface Article {
  id: string
  title: string
  summary?: string
  content: string
  authorId: string
  tags?: string[]
  createdAt: string
}

export interface Repair {
  id: string
  machineId: string
  technicianId: string
  symptoms: string
  diagnosis?: string
  createdAt: string
}
