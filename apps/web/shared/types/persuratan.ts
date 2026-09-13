/**
 * Persuratan canonical types (Task 07 — Template & Administrasi).
 *
 * Layers: DocComponent (Tiptap + bindings) → DocTemplate (JSON Tree +
 * requirements) → Administration (multi-step + mapping) → Document (run
 * result with locked template_version + rendered HTML + PDF path).
 */

export type DocTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type DocumentStatus = 'DRAFT' | 'FINAL' | 'CANCELLED'

export type BindingView = 'text' | 'image' | 'component'

export interface BindingSpec {
  /** Display name, e.g. `nama`. */
  name: string
  /** Binding target path, e.g. `item.name` or `pegawai.nama`. */
  target: string
  view: BindingView
  /** For view=component: referenced component name. */
  component?: string
}

export interface DocComponent {
  id: number
  name: string
  is_looping: boolean
  tiptap_json: string
  preview_html: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface RequirementSpec {
  /** Binding path as scanned from the schema, e.g. `employees` or `letter.number`. */
  path: string
  /** Inside a repeater scope (`item.*`) — provided by loop data, not mapped. */
  scoped: boolean
}

export interface DocTemplate {
  id: number
  name: string
  code: string
  description: string | null
  schema_json: string
  version: number
  status: DocTemplateStatus
  createdAt: string
  updatedAt: string
}

export type MappingSourceKind = 'field' | 'value' | 'master-cell' | 'master-list' | 'system'

export interface MappingEntry {
  kind: MappingSourceKind
  /** field → `step1.nomor`; value → literal; master-cell → `pegawai.nama#3`; master-list → `pegawai`; system → `current_date`. */
  ref: string
}

export interface AdminStep {
  id: number
  admin_id: number
  template_id: number
  step_order: number
  mapping_json: string
  template?: DocTemplate
}

export interface Administration {
  id: number
  name: string
  slug: string
  description: string | null
  steps?: AdminStep[]
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: number
  admin_id: number | null
  template_id: number | null
  document_number: string | null
  data_json: string
  rendered_html: string | null
  pdf_path: string | null
  status: DocumentStatus
  template_version: number
  createdAt: string
  updatedAt: string
}

export interface CreateDocComponent {
  name: string
  is_looping?: boolean
  tiptap_json: Record<string, unknown>
}

export interface CreateDocTemplate {
  name: string
  code: string
  description?: string
  schema_json: Record<string, unknown>
}

export interface CreateAdministration {
  name: string
  slug?: string
  description?: string
  steps?: Array<{ template_id: number; step_order: number; mapping: Record<string, MappingEntry> }>
}

export interface RunWizardInput {
  /** `step1.nomor` style admin data. */
  data?: Record<string, unknown>
  /** Extra steps appended at run time (ALT-03): same shape as admin steps. */
  extra_steps?: Array<{ template_id: number; mapping: Record<string, MappingEntry> }>
  document_number?: string
  as_draft?: boolean
}
