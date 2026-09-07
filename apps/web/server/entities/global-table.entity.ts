import { EntitySchema } from 'typeorm'

export interface GlobalTable {
  id: number
  name: string
  displayName: string
  menuOrder: number | null
  menuIcon: string | null
  createdAt: Date
  updatedAt: Date
}

export const GlobalTableSchema = new EntitySchema<GlobalTable>({
  name: 'global_tables',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 64, unique: true },
    displayName: { type: String, length: 100 },
    menuOrder: { type: Number, nullable: true },
    menuIcon: { type: String, length: 32, nullable: true },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
})
