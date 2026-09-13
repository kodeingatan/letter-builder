import { EntitySchema } from 'typeorm'

export interface DocComponent {
  id: number
  name: string
  isLooping: boolean
  tiptapJson: string
  previewHtml: string | null
  version: number
  createdAt: Date
  updatedAt: Date
}

export const DocComponentSchema = new EntitySchema<DocComponent>({
  name: 'doc_components',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 120, unique: true },
    isLooping: { type: Boolean, default: false },
    tiptapJson: { type: 'text' },
    previewHtml: { type: 'text', nullable: true },
    version: { type: Number, default: 1 },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
})
