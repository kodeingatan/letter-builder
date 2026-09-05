import { EntitySchema } from 'typeorm'

export interface DocTemplate {
  id: number
  name: string
  description: string | null
  content: string | null
  version: number
  status: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Immutable snapshot of a published template version.
 * `content` stores the frozen JSON document tree (`{ nodes: [...] }`).
 * Rows are append-only — never updated or deleted by the service
 * (BR-003). Rollback copies a snapshot into the draft working copy
 * and publishes again as a NEW version (AC-003).
 */
export interface TemplateVersion {
  id: number
  templateId: number
  version: number
  content: string
  publishedBy: number | null
  createdAt: Date
}

export const TemplateSchema = new EntitySchema<DocTemplate>({
  name: 'templates',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 100, unique: true },
    description: { type: 'text', nullable: true },
    content: { type: 'text', nullable: true },
    version: { type: Number, default: 0 },
    status: { type: String, length: 16, default: 'draft' },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  indices: [
    { name: 'IDX_TEMPLATE_NAME', columns: ['name'], unique: true },
    { name: 'IDX_TEMPLATE_STATUS', columns: ['status'] },
  ],
})

export const TemplateVersionSchema = new EntitySchema<TemplateVersion>({
  name: 'template_versions',
  columns: {
    id: { type: Number, primary: true, generated: true },
    templateId: { type: Number },
    version: { type: Number },
    content: { type: 'text' },
    publishedBy: { type: Number, nullable: true },
    createdAt: { type: 'datetime', createDate: true },
  },
  indices: [
    { name: 'IDX_TEMPLATE_VERSION_TEMPLATE_ID_VERSION', columns: ['templateId', 'version'], unique: true },
    { name: 'IDX_TEMPLATE_VERSION_TEMPLATE_ID', columns: ['templateId'] },
  ],
})
