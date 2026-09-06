import { EntitySchema } from 'typeorm'

export interface Administration {
  id: number
  name: string
  description: string | null
  status: string
  version: number
  createdAt: Date
  updatedAt: Date
}

export interface AdministrationStep {
  id: number
  administrationId: number
  order: number
  name: string
  templateId: number | null
  templateVersion: string | null
  fields: string | null
}

export interface AdministrationVersion {
  id: number
  administrationId: number
  version: number
  steps: string
  publishedBy: number | null
  createdAt: Date
}

export const AdministrationSchema = new EntitySchema<Administration>({
  name: 'administrations',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 100, unique: true },
    description: { type: 'text', nullable: true },
    status: { type: String, length: 16, default: 'draft' },
    version: { type: Number, default: 0 },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  indices: [
    { name: 'IDX_ADMINISTRATION_NAME', columns: ['name'], unique: true },
    { name: 'IDX_ADMINISTRATION_STATUS', columns: ['status'] },
  ],
})

export const AdministrationStepSchema = new EntitySchema<AdministrationStep>({
  name: 'administration_steps',
  columns: {
    id: { type: Number, primary: true, generated: true },
    administrationId: { type: Number },
    order: { type: Number },
    name: { type: String, length: 100 },
    templateId: { type: Number, nullable: true },
    templateVersion: { type: String, length: 16, nullable: true },
    fields: { type: 'text', nullable: true },
  },
  indices: [
    { name: 'IDX_ADMIN_STEP_ADMIN_ID', columns: ['administrationId'] },
    { name: 'IDX_ADMIN_STEP_ADMIN_ID_ORDER', columns: ['administrationId', 'order'], unique: true },
    { name: 'IDX_ADMIN_STEP_TEMPLATE_ID', columns: ['templateId'] },
  ],
})

/**
 * Immutable snapshot of a published workflow version.
 * `steps` stores the frozen ordered step list as JSON:
 * `[{ order, name, templateId, templateVersion, fields }]`.
 * Rows are append-only — never updated or deleted by the service.
 * Editing a published administration reopens the working copy as draft
 * (via `POST :id/new-version`); publishing again yields a NEW version.
 */
export const AdministrationVersionSchema = new EntitySchema<AdministrationVersion>({
  name: 'administration_versions',
  columns: {
    id: { type: Number, primary: true, generated: true },
    administrationId: { type: Number },
    version: { type: Number },
    steps: { type: 'text' },
    publishedBy: { type: Number, nullable: true },
    createdAt: { type: 'datetime', createDate: true },
  },
  indices: [
    { name: 'IDX_ADMIN_VERSION_ADMIN_ID_VERSION', columns: ['administrationId', 'version'], unique: true },
    { name: 'IDX_ADMIN_VERSION_ADMIN_ID', columns: ['administrationId'] },
  ],
})
