export type BindingSource = 'administration' | 'global_table' | 'manual' | 'expression' | 'system'

export type BindingStatus = 'bound' | 'stale' | 'unbound'

export interface TemplateBinding {
  /** Null for synthetic `unbound` slots that have no persisted row yet. */
  id: number | null
  templateId: number
  placementId: string
  componentId: number
  requirementName: string
  source: BindingSource
  sourceRef: string | null
  literalValue: string | null
  expression: string | null
  status: BindingStatus
  createdAt: string
  updatedAt: string
}

export interface BindingWithMeta extends TemplateBinding {
  componentName?: string
  requirementType?: string
  staleReason?: string
}

export interface PlacementBindings {
  placementId: string
  componentId: number
  componentName: string
  componentVersion?: number
  /** True when the placement sits inside a loop node (REQ-004 item.* defaults). */
  inLoop?: boolean
  /** True when the placement no longer exists in the draft tree. */
  orphaned?: boolean
  bindings: BindingWithMeta[]
  unboundCount: number
}

export interface BindingsResponse {
  placements: PlacementBindings[]
  totalBindings: number
  totalUnbound: number
}

export interface BindingUpsertItem {
  templateId: number
  placementId: string
  componentId: number
  requirementName: string
  source: BindingSource
  sourceRef?: string | null
  literalValue?: string | null
  expression?: string | null
}

export interface BindingsUpsertResult {
  saved: number
  stale: string[]
}

export interface PreviewSampleContext {
  [key: string]: unknown
}

export interface PreviewResolvedSlot {
  placementId: string
  requirementName: string
  source: BindingSource
  resolvedValue: unknown
  error?: string
}

export interface BindingsPreviewResult {
  slots: PreviewResolvedSlot[]
}
