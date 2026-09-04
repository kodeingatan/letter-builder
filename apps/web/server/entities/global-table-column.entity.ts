import { EntitySchema } from 'typeorm'

export interface GlobalTableColumn {
  id: number
  globalTableId: number
  name: string
  displayName: string
  type: string
  defaultValue: string | null
  required: boolean
  searchable: boolean
  orderable: boolean
  position: number
  options: string | null
  format: string | null
  createdAt: Date
  updatedAt: Date
}

export const GlobalTableColumnSchema = new EntitySchema<GlobalTableColumn>({
  name: 'global_table_columns',
  columns: {
    id: { type: Number, primary: true, generated: true },
    globalTableId: { type: Number },
    name: { type: String, length: 64 },
    displayName: { type: String, length: 100 },
    type: { type: String, length: 32 },
    defaultValue: { type: String, nullable: true },
    required: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
    orderable: { type: Boolean, default: false },
    position: { type: Number },
    options: { type: 'text', nullable: true },
    format: { type: String, length: 32, nullable: true },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  indices: [
    { name: 'IDX_GLOBAL_TABLE_COLUMN_TABLE_ID_NAME', columns: ['globalTableId', 'name'], unique: true },
    { name: 'IDX_GLOBAL_TABLE_COLUMN_TABLE_ID_POSITION', columns: ['globalTableId', 'position'] },
  ],
})