import { EntitySchema } from 'typeorm'

export interface Setting {
  id: number
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

export const SettingSchema = new EntitySchema<Setting>({
  name: 'settings',
  columns: {
    id: { type: Number, primary: true, generated: true },
    key: { type: String, unique: true },
    value: { type: 'text' },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
})
