export interface PermissionMethod {
  id: number
  method: string
}

export interface PermissionUrl {
  id: number
  url: string
}

export interface Permission {
  id: number
  permissionName: string
  description: string | null
  methods: PermissionMethod[]
  urls: PermissionUrl[]
  createdAt: string
  updatedAt: string
}

export interface CreatePermission {
  permissionName: string
  description?: string
  methods?: string[]
  urls?: string[]
}

export interface UpdatePermission {
  permissionName?: string
  description?: string
  methods?: string[]
  urls?: string[]
}

export interface QueryPermission {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
