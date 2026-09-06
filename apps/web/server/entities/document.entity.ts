import { EntitySchema } from 'typeorm'

export interface Document {
  id: number
  runId: number
  administrationId: number
  stepId: number | null
  templateId: number | null
  templateVersion: number
  dataSnapshot: string
  outputHtml: string | null
  outputFilePath: string | null
  replacesId: number | null
  createdBy: number | null
  createdAt: Date
}

/**
 * Immutable record of one issued document (Task 19).
 * One row per template-step of a completed run (`runId` shared across
 * the run's documents, ordered by step order at issue time).
 * `dataSnapshot` stores the frozen JSON snapshot
 * (`{ runInput, templateContent, componentSnapshots, bindings,
 * resolvedPins, systemContext }`) — rows are append-only, never updated
 * by the service (REQ-006). Re-issue creates a NEW row with `replacesId`
 * (REQ-005). Only an explicit admin purge deletes rows.
 */
export const DocumentSchema = new EntitySchema<Document>({
  name: 'documents',
  columns: {
    id: { type: Number, primary: true, generated: true },
    runId: { type: Number },
    administrationId: { type: Number },
    stepId: { type: Number, nullable: true },
    templateId: { type: Number, nullable: true },
    templateVersion: { type: Number },
    dataSnapshot: { type: 'text' },
    outputHtml: { type: 'text', nullable: true },
    outputFilePath: { type: String, length: 500, nullable: true },
    replacesId: { type: Number, nullable: true },
    createdBy: { type: Number, nullable: true },
    createdAt: { type: 'datetime', createDate: true },
  },
  indices: [
    { name: 'IDX_DOCUMENT_ADMIN_ID_CREATED_AT', columns: ['administrationId', 'createdAt'] },
    { name: 'IDX_DOCUMENT_RUN_ID', columns: ['runId'] },
  ],
})
