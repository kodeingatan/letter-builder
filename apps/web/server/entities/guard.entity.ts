import { EntitySchema } from 'typeorm'

export interface Guard {
  id: number
  guardName: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export const GuardSchema = new EntitySchema<Guard>({
  name: 'guards',
  columns: {
    id: { type: Number, primary: true, generated: true },
    guardName: { type: String, unique: true },
    description: { type: String, nullable: true },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  relations: {
    urls: {
      type: 'one-to-many',
      target: 'guard_urls',
      inverseSide: 'guard',
      eager: true,
    },
  },
})
