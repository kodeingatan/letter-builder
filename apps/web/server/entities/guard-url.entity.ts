import { EntitySchema } from 'typeorm'

export interface GuardUrl {
  id: number
  url: string
  type: 'allow' | 'deny'
  guardId: number
  createdAt: Date
}

export const GuardUrlSchema = new EntitySchema<GuardUrl>({
  name: 'guard_urls',
  columns: {
    id: { type: Number, primary: true, generated: true },
    url: { type: String },
    type: { type: 'varchar' },
    guardId: { type: Number },
    createdAt: { type: 'datetime', createDate: true },
  },
  relations: {
    guard: {
      type: 'many-to-one',
      target: 'guards',
      inverseSide: 'urls',
      joinColumn: { name: 'guardId' },
      onDelete: 'CASCADE',
    },
  },
})
