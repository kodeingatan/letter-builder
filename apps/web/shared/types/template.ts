export type TemplateStatus = 'draft' | 'published'

export interface TemplateVersion {
  id: number
  templateId: number
  version: number
  content: string
  publishedBy: number | null
  createdAt: string
  nodeCount?: number
}

export interface TemplateUsageRef {
  id: number
  name: string
}

export interface TemplateUsedBy {
  steps: TemplateUsageRef[]
  documents: TemplateUsageRef[]
  stepCount: number
  documentCount: number
}

export interface DocTemplate {
  id: number
  name: string
  description: string | null
  content: string | null
  version: number
  status: TemplateStatus
  createdAt: string
  updatedAt: string
}

export interface TemplateListItem extends DocTemplate {
  nodeCount: number
  stepCount: number
  documentCount: number
  usageCount: number
}

export interface TemplateDetail extends DocTemplate {
  versions: TemplateVersion[]
  usedBy: TemplateUsedBy
  usageCount: number
  nodeCount: number
}

export interface CreateTemplate {
  name: string
  description?: string | null
  content?: string | null
}

export interface UpdateTemplate {
  name?: string
  description?: string | null
  content?: string | null
}

export interface QueryTemplate {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// --- Composition Editor (Task 15) -------------------------------------------
// Canonical composition-tree contracts (Task 24): `server/utils/composition-tree.ts`
// re-exports these names instead of redeclaring them, so Nuxt auto-import
// registers each exactly once.

export const COMPOSITION_KINDS = [
  'text',
  'image',
  'table',
  'component',
  'data-token',
  'loop',
  'condition',
  'page-break',
] as const

export type CompositionKind = (typeof COMPOSITION_KINDS)[number]

export interface CompositionNode {
  id: string
  kind: CompositionKind
  attrs?: Record<string, any>
  children?: CompositionNode[]
}

export interface LoopSourceConfig {
  tableName: string
  mode: 'all' | 'selected' | 'filtered'
  rowIds?: number[]
  filter?: Array<{ field: string; operator: string; value?: unknown }>
}

export interface TreeIssue {
  path: string
  message: string
}

export interface UnboundSlot {
  nodeId: string
  componentId: number
  componentName?: string
  requirement: string
  type: string
}

export interface TreeValidationResult {
  valid: boolean
  errors: TreeIssue[]
  warnings: TreeIssue[]
  unbound: UnboundSlot[]
  stats: {
    nodeCount: number
    placementCount: number
    loopCount: number
    conditionCount: number
    tokenCount: number
  }
}

export interface SlotChip {
  name: string
  type: string
  bound: boolean
}
