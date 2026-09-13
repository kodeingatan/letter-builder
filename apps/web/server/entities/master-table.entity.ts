import { EntitySchema } from 'typeorm'

export interface MasterTable {
  id: number
  name: string
  displayName: string
  slug: string
  description: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export const MasterTableSchema = new EntitySchema<MasterTable>({
  name: 'master_tables',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 60 },
    displayName: { type: String, length: 120 },
    slug: { type: String, length: 64, unique: true },
    description: { type: 'text', nullable: true },
    status: { type: String, length: 16, default: 'DRAFT' },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  relations: {
    columns: {
      type: 'one-to-many',
      target: 'master_table_columns',
      inverseSide: 'table',
      cascade: true,
    },
  },
})
