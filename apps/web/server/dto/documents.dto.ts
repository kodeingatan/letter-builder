import { z } from 'zod'

export const DocumentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  administrationId: z.coerce.number().int().positive().optional(),
  createdBy: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type DocumentQueryInput = z.infer<typeof DocumentQuerySchema>

/**
 * Server-internal creation payload validation (BR-001): a document
 * without frozen template content + bindings is invalid.
 * Creation rides `POST /api/runs/:runId/complete` — there is no public POST.
 */
export const DocumentSnapshotSchema = z.object({
  runInput: z.record(z.string(), z.unknown()),
  templateContent: z.string().min(1, 'Snapshot requires frozen template content'),
  componentSnapshots: z.array(z.unknown()),
  bindings: z.array(z.unknown()),
  resolvedPins: z.array(z.unknown()),
  systemContext: z.record(z.string(), z.unknown()),
})

export type DocumentSnapshotInput = z.infer<typeof DocumentSnapshotSchema>
