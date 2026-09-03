import { EntitySchema } from 'typeorm'

export interface Permission {
  id: number
  permissionName: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export const PermissionSchema = new EntitySchema<Permission>({
  name: 'permissions',
  columns: {
    id: { type: Number, primary: true, generated: true },
    permissionName: { type: String, unique: true },
    description: { type: String, nullable: true },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  relations: {
    methods: {
      type: 'one-to-many',
      target: 'permission_methods',
      inverseSide: 'permission',
      eager: true,
    },
    urls: {
      type: 'one-to-many',
      target: 'permission_urls',
      inverseSide: 'permission',
      eager: true,
    },
  },
})
