import type { Guard } from '@/shared/types/guard'
import type { Permission } from '@/shared/types/permission'

export interface Role {
  id: number
  roleName: string
  description: string | null
  guards: Guard[]
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface CreateRole {
  roleName: string
  description?: string
  guardIds?: number[]
  permissionIds?: number[]
}

export interface UpdateRole {
  roleName?: string
  description?: string
  guardIds?: number[]
  permissionIds?: number[]
}

export interface QueryRole {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
