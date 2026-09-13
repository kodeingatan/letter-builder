import { EntitySchema } from 'typeorm'

export interface MasterTableColumn {
  id: number
  tableId: number
  name: string
  displayName: string
  type: string
  configJson: string | null
  defaultValue: string | null
  isRequired: boolean
  isOrderable: boolean
  isSearchable: boolean
  sortOrder: number
}

export const MasterTableColumnSchema = new EntitySchema<MasterTableColumn>({
  name: 'master_table_columns',
  columns: {
    id: { type: Number, primary: true, generated: true },
    tableId: { type: Number },
    name: { type: String, length: 60 },
    displayName: { type: String, length: 120 },
    type: { type: String, length: 32 },
    configJson: { type: 'text', nullable: true },
    defaultValue: { type: 'text', nullable: true },
    isRequired: { type: Boolean, default: false },
    isOrderable: { type: Boolean, default: false },
    isSearchable: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  relations: {
    table: {
      type: 'many-to-one',
      target: 'master_tables',
      joinColumn: { name: 'tableId', referencedColumnName: 'id' },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    { columns: ['tableId', 'name'], unique: true },
  ],
})
