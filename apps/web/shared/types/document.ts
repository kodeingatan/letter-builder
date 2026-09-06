export interface DocumentSnapshotSummary {
  hasTemplateContent: boolean
  componentCount: number
  bindingCount: number
  stepName: string | null
  administrationVersion: number | null
}

export interface DocumentListItem {
  id: number
  runId: number
  administrationId: number
  stepId: number | null
  templateId: number | null
  templateVersion: number
  outputHtml: string | null
  outputFilePath: string | null
  replacesId: number | null
  createdBy: number | null
  createdAt: string
  administrationName: string | null
  templateName: string | null
  currentTemplateVersion: number | null
  drifted: boolean
  driftBadge: string
  createdByName: string | null
  title: string
}

export interface DocumentDetail extends DocumentListItem {
  snapshotSummary: DocumentSnapshotSummary
  pins: Array<{ stepId: number; templateId: number; version: string }>
  snapshot?: unknown
}

export interface QueryDocuments {
  page?: number
  limit?: number
  administrationId?: number
  createdBy?: number
  startDate?: string
  endDate?: string
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
