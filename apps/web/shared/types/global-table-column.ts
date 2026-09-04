export interface GlobalTableColumn {
  id: number
  globalTableId: number
  name: string
  displayName: string
  type: string
  defaultValue: string | null
  required: boolean
  searchable: boolean
  orderable: boolean
  position: number
  options: string | null
  format: string | null
  expression: string | null
  dependencies: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateGlobalTableColumn {
  name: string
  displayName: string
  type: string
  defaultValue?: string | null
  required?: boolean
  searchable?: boolean
  orderable?: boolean
  position?: number
  options?: string | null
  format?: string | null
  expression?: string
}

export interface UpdateGlobalTableColumn {
  displayName?: string
  type?: string
  defaultValue?: string | null
  required?: boolean
  searchable?: boolean
  orderable?: boolean
  position?: number
  options?: string | null
  format?: string | null
  expression?: string
}

export interface QueryGlobalTableColumn {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface ReorderGlobalTableColumns {
  orderedIds: number[]
}

export interface GlobalTableColumnStats {
  total: number
  columnCount: number
  averageOptionsPerColumn: number
}