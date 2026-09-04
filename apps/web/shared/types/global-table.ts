export interface GlobalTableReferenceItem {
  tableId: number
  tableName: string
  columnName: string
}

export interface GlobalTableBindingItem {
  source: string
  ref: string
}

export interface GlobalTableReferencedBy {
  relations: GlobalTableReferenceItem[]
  bindings: GlobalTableBindingItem[]
}

export interface GlobalTable {
  id: number
  name: string
  displayName: string
  createdAt: string
  updatedAt: string
}

export interface GlobalTableDetail extends GlobalTable {
  columnCount: number
  referencedBy: GlobalTableReferencedBy
}

export interface CreateGlobalTable {
  name: string
  displayName: string
}

export interface UpdateGlobalTable {
  displayName: string
}

export interface QueryGlobalTable {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
