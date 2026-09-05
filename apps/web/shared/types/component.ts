export type ComponentRequirementType = 'text' | 'date' | 'image' | 'number' | 'richtext'

export type ComponentStatus = 'draft' | 'published'

export interface ComponentRequirement {
  id?: number
  componentId?: number
  name: string
  type: ComponentRequirementType
}

export interface ComponentVersion {
  id: number
  componentId: number
  version: number
  content: string | null
  looping: boolean
  requirements: ComponentRequirement[]
  createdAt: string
}

export interface ComponentTemplateUsage {
  id: number
  name: string
}

export interface DocComponent {
  id: number
  name: string
  content: string | null
  looping: boolean
  preview: string | null
  version: number
  status: ComponentStatus
  createdAt: string
  updatedAt: string
}

export interface ComponentListItem extends DocComponent {
  requirementCount: number
  usageCount: number
}

export interface ComponentDetail extends DocComponent {
  requirements: ComponentRequirement[]
  versions: ComponentVersion[]
  usedBy: ComponentTemplateUsage[]
  usageCount: number
  placeholderWarnings: string[]
  placeholderUnknown: string[]
}

export interface CreateComponent {
  name: string
  content?: string | null
  looping?: boolean
  requirements?: ComponentRequirement[]
}

export interface UpdateComponent {
  name?: string
  content?: string | null
  looping?: boolean
  requirements?: ComponentRequirement[]
}

export interface ComponentPreviewResult {
  html: string
  blockCount: number
  looping: boolean
  unknown: string[]
  warnings: string[]
}

export interface QueryComponent {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
