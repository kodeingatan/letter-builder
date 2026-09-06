export type AdministrationStatus = 'draft' | 'published' | 'archived'

export type StepFieldType = 'text' | 'richtext' | 'date' | 'select' | 'number' | 'currency' | 'image'

export const STEP_FIELD_TYPES: StepFieldType[] = ['text', 'richtext', 'date', 'select', 'number', 'currency', 'image']

export interface StepField {
  name: string
  label: string
  type: StepFieldType
  required: boolean
  options?: string[]
}

export interface AdministrationStep {
  id: number
  administrationId: number
  order: number
  name: string
  templateId: number | null
  templateVersion: string | null
  fields: StepField[]
  fieldCount: number
  templateName: string | null
  templateMissing: boolean
  resolvedTemplateVersion: string | null
}

export interface StepInput {
  id?: number
  name: string
  templateId?: number | null
  templateVersion?: string | null
  fields?: StepField[]
}

export interface AdministrationVersion {
  id: number
  administrationId: number
  version: number
  steps: StepField[] | unknown
  publishedBy: number | null
  createdAt: string
}

export interface Administration {
  id: number
  name: string
  description: string | null
  status: AdministrationStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface AdministrationListItem extends Administration {
  stepCount: number
  docsCount: number
  documentCount: number
}

export interface AdministrationDetail extends Administration {
  steps: AdministrationStep[]
  versions: AdministrationVersion[]
  stepCount: number
  docsCount: number
  documentCount: number
  templatesUsed: number[]
  templatesUsedCount: number
}

export interface CreateAdministration {
  name: string
  description?: string | null
}

export interface UpdateAdministration {
  name?: string
  description?: string | null
}

export interface QueryAdministration {
  page?: number
  limit?: number
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface StepIssue {
  index: number
  stepName: string
  message: string
}
