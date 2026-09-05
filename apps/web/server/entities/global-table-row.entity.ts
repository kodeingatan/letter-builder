import { EntitySchema } from 'typeorm'

export interface GlobalTableRow {
  id: number
  globalTableId: number
  values: string
  createdAt: Date
  updatedAt: Date
}

export const GlobalTableRowSchema = new EntitySchema<GlobalTableRow>({
  name: 'global_table_rows',
  columns: {
    id: { type: Number, primary: true, generated: true },
    globalTableId: { type: Number },
    values: { type: 'text' },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  indices: [{ name: 'IDX_GLOBAL_TABLE_ROWS_TABLE_ID', columns: ['globalTableId'] }],
})
