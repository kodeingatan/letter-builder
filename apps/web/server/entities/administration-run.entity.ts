import { EntitySchema } from 'typeorm'

export type AdministrationRunStatus = 'in_progress' | 'completed' | 'cancelled'

export interface AdministrationRun {
  id: number
  administrationId: number
  administrationVersion: number
  resolvedPins: string
  stepData: string
  status: string
  startedBy: number | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

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

export const AdministrationRunSchema = new EntitySchema<AdministrationRun>({
  name: 'administration_runs',
  columns: {
    id: { type: Number, primary: true, generated: true },
    administrationId: { type: Number },
    administrationVersion: { type: Number, default: 0 },
    resolvedPins: { type: 'text' },
    stepData: { type: 'text' },
    status: { type: String, length: 16, default: 'in_progress' },
    startedBy: { type: Number, nullable: true },
    startedAt: { type: 'datetime', nullable: true },
    completedAt: { type: 'datetime', nullable: true },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  indices: [
    { name: 'IDX_ADMIN_RUN_ADMIN_ID_STATUS', columns: ['administrationId', 'status'] },
    { name: 'IDX_ADMIN_RUN_STARTED_BY', columns: ['startedBy'] },
  ],
})
