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
