import { EntitySchema } from 'typeorm'

export interface User {
  id: number
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export const UserSchema = new EntitySchema<User>({
  name: 'users',
  columns: {
    id: { type: Number, primary: true, generated: true },
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: { type: String },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  relations: {
    roles: {
      type: 'many-to-many',
      target: 'roles',
      inverseSide: 'users',
      joinTable: {
        name: 'users_roles',
        joinColumn: { name: 'userId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
      },
      eager: true,
    },
  },
})
