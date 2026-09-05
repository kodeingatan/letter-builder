import { EntitySchema } from 'typeorm'

export interface Component {
  id: number
  name: string
  content: string | null
  looping: boolean
  preview: string | null
  version: number
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface ComponentDataRequirement {
  id: number
  componentId: number
  name: string
  type: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Immutable snapshot of a published component version.
 * `requirements` stores the frozen requirement list as JSON:
 * `[{ name, type }]`. Rows are append-only — never updated or deleted
 * by the service (BR-005 / AC-003).
 */
export interface ComponentVersion {
  id: number
  componentId: number
  version: number
  content: string | null
  looping: boolean
  requirements: string
  createdAt: Date
}

export const ComponentSchema = new EntitySchema<Component>({
  name: 'components',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 100, unique: true },
    content: { type: 'text', nullable: true },
    looping: { type: Boolean, default: false },
    preview: { type: 'text', nullable: true },
    version: { type: Number, default: 1 },
    status: { type: String, length: 16, default: 'draft' },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  indices: [
    { name: 'IDX_COMPONENT_NAME', columns: ['name'], unique: true },
    { name: 'IDX_COMPONENT_STATUS', columns: ['status'] },
  ],
})

export const ComponentDataRequirementSchema = new EntitySchema<ComponentDataRequirement>({
  name: 'component_data_requirements',
  columns: {
    id: { type: Number, primary: true, generated: true },
    componentId: { type: Number },
    name: { type: String, length: 64 },
    type: { type: String, length: 16 },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  indices: [
    { name: 'IDX_COMPONENT_REQUIREMENT_COMPONENT_ID_NAME', columns: ['componentId', 'name'], unique: true },
    { name: 'IDX_COMPONENT_REQUIREMENT_COMPONENT_ID', columns: ['componentId'] },
  ],
})

export const ComponentVersionSchema = new EntitySchema<ComponentVersion>({
  name: 'component_versions',
  columns: {
    id: { type: Number, primary: true, generated: true },
    componentId: { type: Number },
    version: { type: Number },
    content: { type: 'text', nullable: true },
    looping: { type: Boolean, default: false },
    requirements: { type: 'text' },
    createdAt: { type: 'datetime', createDate: true },
  },
  indices: [
    { name: 'IDX_COMPONENT_VERSION_COMPONENT_ID_VERSION', columns: ['componentId', 'version'], unique: true },
    { name: 'IDX_COMPONENT_VERSION_COMPONENT_ID', columns: ['componentId'] },
  ],
})
