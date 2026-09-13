import { EntitySchema } from 'typeorm'

export interface DocTemplate {
  id: number
  name: string
  code: string
  description: string | null
  schemaJson: string
  version: number
  status: string
  createdAt: Date
  updatedAt: Date
}

export const DocTemplateSchema = new EntitySchema<DocTemplate>({
  name: 'doc_templates',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 120, unique: true },
    code: { type: String, length: 60, unique: true },
    description: { type: 'text', nullable: true },
    schemaJson: { type: 'text' },
    version: { type: Number, default: 1 },
    status: { type: String, length: 16, default: 'DRAFT' },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
})
