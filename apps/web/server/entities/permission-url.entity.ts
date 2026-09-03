import { EntitySchema } from 'typeorm'

export interface PermissionUrl {
  id: number
  url: string
  permissionId: number
  createdAt: Date
}

export const PermissionUrlSchema = new EntitySchema<PermissionUrl>({
  name: 'permission_urls',
  columns: {
    id: { type: Number, primary: true, generated: true },
    url: { type: String },
    permissionId: { type: Number },
    createdAt: { type: 'datetime', createDate: true },
  },
  relations: {
    permission: {
      type: 'many-to-one',
      target: 'permissions',
      inverseSide: 'urls',
      joinColumn: { name: 'permissionId' },
      onDelete: 'CASCADE',
    },
  },
})
