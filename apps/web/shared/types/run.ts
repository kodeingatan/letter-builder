export type AdministrationRunStatus = 'in_progress' | 'completed' | 'cancelled'

export interface ResolvedPin {
  stepId: number
  templateId: number
  version: string
}

export interface RunStepData {
  fields: Record<string, unknown>
  rowSelections: Record<string, number[]>
  manualInputs: Record<string, unknown>
}

export type RunStepDataMap = Record<string, RunStepData>

export interface RunStep {
  id: number
  administrationId: number
  order: number
  name: string
  templateId: number | null
  templateVersion: string | null
  fields: import('~/shared/types/administration').StepField[]
  fieldCount?: number
  templateName?: string | null
  resolvedTemplateVersion?: string | null
}

export interface AdministrationRun {
  id: number
  administrationId: number
  administrationVersion: number
  resolvedPins: ResolvedPin[]
  stepData: RunStepDataMap
  status: AdministrationRunStatus
  startedBy: number | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdministrationRunListItem extends AdministrationRun {
  administrationName: string | null
}

export interface AdministrationRunDetail extends AdministrationRun {
  steps: RunStep[]
  administrationName: string | null
  administrationStatus: string | null
}

export interface StepSavePayload {
  fields?: Record<string, unknown>
  rowSelections?: Record<string, number[]>
  manualInputs?: Record<string, unknown>
}

export interface StepSaveResult extends AdministrationRunDetail {
  droppedRows: Record<string, number[]>
  warning?: string
}

export interface CompleteRunResult {
  runId: number
  documentIds: number[]
}

export type RunStepStatus = 'pending' | 'active' | 'done' | 'invalid'

export interface QueryRuns {
  page?: number
  limit?: number
  status?: AdministrationRunStatus
  scope?: 'mine' | 'all'
  search?: string
  searchField?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
