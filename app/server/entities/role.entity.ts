import { EntitySchema } from 'typeorm'

export interface Role {
  id: number
  roleName: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export const RoleSchema = new EntitySchema<Role>({
  name: 'roles',
  columns: {
    id: { type: Number, primary: true, generated: true },
    roleName: { type: String, unique: true },
    description: { type: String, nullable: true },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  relations: {
    users: {
      type: 'many-to-many',
      target: 'users',
      inverseSide: 'roles',
    },
    guards: {
      type: 'many-to-many',
      target: 'guards',
      inverseSide: 'roles',
      joinTable: {
        name: 'roles_guards',
        joinColumn: { name: 'roleId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'guardId', referencedColumnName: 'id' },
      },
      eager: true,
    },
    permissions: {
      type: 'many-to-many',
      target: 'permissions',
      inverseSide: 'roles',
      joinTable: {
        name: 'roles_permissions',
        joinColumn: { name: 'roleId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
      },
      eager: true,
    },
  },
})
