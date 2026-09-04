import { EntitySchema } from 'typeorm'

export interface GlobalTable {
  id: number
  name: string
  displayName: string
  createdAt: Date
  updatedAt: Date
}

export const GlobalTableSchema = new EntitySchema<GlobalTable>({
  name: 'global_tables',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 64, unique: true },
    displayName: { type: String, length: 100 },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
})
