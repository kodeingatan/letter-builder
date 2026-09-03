import { EntitySchema } from 'typeorm'

export interface PermissionMethod {
  id: number
  method: string
  permissionId: number
  createdAt: Date
}

export const PermissionMethodSchema = new EntitySchema<PermissionMethod>({
  name: 'permission_methods',
  columns: {
    id: { type: Number, primary: true, generated: true },
    method: { type: String },
    permissionId: { type: Number },
    createdAt: { type: 'datetime', createDate: true },
  },
  relations: {
    permission: {
      type: 'many-to-one',
      target: 'permissions',
      inverseSide: 'methods',
      joinColumn: { name: 'permissionId' },
      onDelete: 'CASCADE',
    },
  },
})
