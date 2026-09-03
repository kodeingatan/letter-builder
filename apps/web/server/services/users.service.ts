import { getDataSource } from '~~/server/utils/db'
import { UserSchema } from '~~/server/entities/user.entity'
import { RoleSchema } from '~~/server/entities/role.entity'
import { hashPassword } from '~~/server/utils/password'
import type { QueryInput, CreateUserInput, UpdateUserInput } from '~~/server/dto/users.dto'

const searchableFields = ['firstName', 'lastName', 'username', 'email']
const sortableFields = ['id', 'firstName', 'lastName', 'username', 'email', 'createdAt', 'updatedAt']

export const UsersService = {
  async findAll(query: QueryInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)
    const qb = repo.createQueryBuilder('user')

    if (query.search) {
      if (query.searchField && searchableFields.includes(query.searchField)) {
        qb.where(`user.${query.searchField} LIKE :search`, { search: `%${query.search}%` })
      } else {
        const conditions = searchableFields.map(f => `user.${f} LIKE :search`)
        qb.where(`(${conditions.join(' OR ')})`, { search: `%${query.search}%` })
      }
    }

    if (sortableFields.includes(query.sortBy)) {
      qb.orderBy(`user.${query.sortBy}`, query.sortOrder)
    }

    const total = await qb.getCount()
    const data = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getMany()

    const sanitized = data.map(({ password, ...rest }) => rest)
    return { data: sanitized, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const user = await ds.getRepository(UserSchema).findOne({ where: { id } })
    if (!user) throw new Error('User not found')
    const { password, ...rest } = user
    return rest
  },

  async create(data: CreateUserInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)
    const roleRepo = ds.getRepository(RoleSchema)

    const hashedPassword = await hashPassword(data.password)
    const user = repo.create({ ...data, password: hashedPassword })

    if (data.roleIds?.length) {
      user.roles = await roleRepo.findBy({ id: { $in: data.roleIds } as any })
    }

    const saved = await repo.save(user)
    const { password, ...rest } = saved
    return rest
  },

  async update(id: number, data: UpdateUserInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)
    const roleRepo = ds.getRepository(RoleSchema)

    const user = await repo.findOne({ where: { id } })
    if (!user) throw new Error('User not found')

    if (data.password) {
      user.password = await hashPassword(data.password)
    }

    Object.assign(user, { firstName: data.firstName, lastName: data.lastName, username: data.username, email: data.email })

    if (data.roleIds) {
      user.roles = data.roleIds.length ? await roleRepo.findBy({ id: { $in: data.roleIds } as any }) : []
    }

    const saved = await repo.save(user)
    const { password, ...rest } = saved
    return rest
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(UserSchema)
    const user = await repo.findOne({ where: { id } })
    if (!user) throw new Error('User not found')
    await repo.remove(user)
    return { message: 'User deleted' }
  },

  async findOneWithRoles(id: number) {
    const ds = await getDataSource()
    return ds.getRepository(UserSchema).findOne({ where: { id } })
  },
}
