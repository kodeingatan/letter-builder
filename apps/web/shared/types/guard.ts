export interface GuardUrl {
  id: number
  url: string
  type: 'allow' | 'deny'
}

export interface Guard {
  id: number
  guardName: string
  description: string | null
  urls: GuardUrl[]
  createdAt: string
  updatedAt: string
}

export interface CreateGuard {
  guardName: string
  description?: string
  allowUrls?: string[]
  denyUrls?: string[]
}

export interface UpdateGuard {
  guardName?: string
  description?: string
  allowUrls?: string[]
  denyUrls?: string[]
}

export interface QueryGuard {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
