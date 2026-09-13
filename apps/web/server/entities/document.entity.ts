import { EntitySchema } from 'typeorm'

export interface Document {
  id: number
  adminId: number | null
  templateId: number | null
  documentNumber: string | null
  dataJson: string
  renderedHtml: string | null
  pdfPath: string | null
  status: string
  templateVersion: number
  createdAt: Date
  updatedAt: Date
}

export const DocumentSchema = new EntitySchema<Document>({
  name: 'documents',
  columns: {
    id: { type: Number, primary: true, generated: true },
    adminId: { type: Number, nullable: true },
    templateId: { type: Number, nullable: true },
    documentNumber: { type: String, length: 120, nullable: true, unique: true },
    dataJson: { type: 'text', default: '{}' },
    renderedHtml: { type: 'text', nullable: true },
    pdfPath: { type: String, length: 255, nullable: true },
    status: { type: String, length: 16, default: 'DRAFT' },
    templateVersion: { type: Number, default: 1 },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
})
