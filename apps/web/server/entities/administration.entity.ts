import { EntitySchema } from 'typeorm'

export interface Administration {
  id: number
  name: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export const AdministrationSchema = new EntitySchema<Administration>({
  name: 'administrations',
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, length: 120, unique: true },
    slug: { type: String, length: 64, unique: true },
    description: { type: 'text', nullable: true },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  relations: {
    steps: {
      type: 'one-to-many',
      target: 'admin_steps',
      inverseSide: 'administration',
      cascade: true,
    },
  },
})
