export interface TableDataColumn {
  id: number
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
  relationTableId: number | null
  relationConfig: string | { displayColumns: string[]; separator?: string; onTargetDelete?: string } | null
}

export interface TableRow {
  id: number
  createdAt: string
  updatedAt: string
  _display?: Record<string, string>
  [columnName: string]: unknown
}

export interface TableBrowseResponse {
  data: TableRow[]
  total: number
  page: number
  limit: number
  totalPages: number
  table: { id: number; name: string; displayName: string }
  columns: TableDataColumn[]
}

export interface ImportSummary {
  imported: number
  failed: number
  errors: Array<{ row: number; reason: string }>
}
