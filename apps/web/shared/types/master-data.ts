/**
 * Master Data canonical types (Task 06 — replaces removed Global Tables).
 *
 * Admin-defined tables materialized as physical `mst_<slug>` tables via
 * safe DDL. Each ACTIVE table doubles as a Data Source for Task 07.
 */

export type MasterColumnType =
  | 'text'
  | 'richtext'
  | 'date'
  | 'datetime'
  | 'time'
  | 'image'
  | 'select'
  | 'select_multiple'
  | 'relation_single'
  | 'relation_multiple'
  | 'number'
  | 'hidden_operation_text'
  | 'readonly_operation_text'

export type MasterTableStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export interface SelectColumnConfig {
  options: string[]
}

export interface RelationColumnConfig {
  /** Target table slug (without `mst_` prefix). */
  target_slug: string
  /** Column name shown as the option label. Defaults to the first text column. */
  display_column?: string
}

export interface DateColumnConfig {
  /** Display format. Defaults: date `m-d-Y`, datetime `m-d-Y H:i:s`, time `H:i:s`. */
  format?: string
}

export interface NumberColumnConfig {
  /** Show IDR formatting in inputs. */
  currency?: boolean
}

export interface OperationColumnConfig {
  /** Text-operation expression, e.g. `"Total: "++gaji+bonus`. */
  expression: string
}

export type MasterColumnConfig =
  | SelectColumnConfig
  | RelationColumnConfig
  | DateColumnConfig
  | NumberColumnConfig
  | OperationColumnConfig
  | Record<string, unknown>

export interface MasterColumn {
  id: number
  table_id: number
  name: string
  display_name: string
  type: MasterColumnType
  config_json: string | null
  default_value: string | null
  is_required: boolean
  is_orderable: boolean
  is_searchable: boolean
  sort_order: number
}

export interface MasterTable {
  id: number
  name: string
  display_name: string
  slug: string
  description: string | null
  status: MasterTableStatus
  columns?: MasterColumn[]
  createdAt: string
  updatedAt: string
}

export interface CreateMasterTable {
  name: string
  display_name: string
  slug?: string
  description?: string
  columns: Array<{
    name: string
    display_name: string
    type: MasterColumnType
    config?: MasterColumnConfig
    default_value?: string
    is_required?: boolean
    is_orderable?: boolean
    is_searchable?: boolean
    sort_order?: number
  }>
}

export type MasterRow = Record<string, unknown> & { id: number }

export interface MasterTableSchema {
  slug: string
  display_name: string
  columns: Array<{
    name: string
    display_name: string
    type: MasterColumnType
    config: MasterColumnConfig | null
    is_required: boolean
    is_orderable: boolean
    is_searchable: boolean
  }>
}

export interface QueryMasterTable {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface QueryMasterRow extends QueryMasterTable {
  searchField?: string
}
