import { getDataSource } from '~~/server/utils/db'
import { RoleSchema } from '~~/server/entities/role.entity'
import { GuardSchema } from '~~/server/entities/guard.entity'
import { PermissionSchema } from '~~/server/entities/permission.entity'
import type { QueryInput } from '~~/server/dto/users.dto'
import type { CreateRoleInput, UpdateRoleInput } from '~~/server/dto/roles.dto'

const searchableFields = ['roleName', 'description']
const sortableFields = ['id', 'roleName', 'description', 'createdAt', 'updatedAt']

export const RolesService = {
  async findAll(query: QueryInput) {
    const ds = await getDataSource()
    const qb = ds.getRepository(RoleSchema).createQueryBuilder('role')

    if (query.search) {
      if (query.searchField && searchableFields.includes(query.searchField)) {
        qb.where(`role.${query.searchField} LIKE :search`, { search: `%${query.search}%` })
      } else {
        const conditions = searchableFields.map(f => `role.${f} LIKE :search`)
        qb.where(`(${conditions.join(' OR ')})`, { search: `%${query.search}%` })
      }
    }

    if (sortableFields.includes(query.sortBy)) {
      qb.orderBy(`role.${query.sortBy}`, query.sortOrder)
    }

    const total = await qb.getCount()
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const role = await ds.getRepository(RoleSchema).findOne({ where: { id } })
    if (!role) throw new Error('Role not found')
    return role
  },

  async create(data: CreateRoleInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(RoleSchema)
    const role = repo.create({ roleName: data.roleName, description: data.description })

    if (data.guardIds?.length) {
      role.guards = await ds.getRepository(GuardSchema).findBy({ id: { $in: data.guardIds } as any })
    }
    if (data.permissionIds?.length) {
      role.permissions = await ds.getRepository(PermissionSchema).findBy({ id: { $in: data.permissionIds } as any })
    }

    return repo.save(role)
  },

  async update(id: number, data: UpdateRoleInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(RoleSchema)
    const role = await repo.findOne({ where: { id } })
    if (!role) throw new Error('Role not found')

    if (data.roleName) role.roleName = data.roleName
    if (data.description !== undefined) role.description = data.description
    if (data.guardIds) {
      role.guards = data.guardIds.length ? await ds.getRepository(GuardSchema).findBy({ id: { $in: data.guardIds } as any }) : []
    }
    if (data.permissionIds) {
      role.permissions = data.permissionIds.length ? await ds.getRepository(PermissionSchema).findBy({ id: { $in: data.permissionIds } as any }) : []
    }

    return repo.save(role)
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(RoleSchema)
    const role = await repo.findOne({ where: { id } })
    if (!role) throw new Error('Role not found')
    await repo.remove(role)
    return { message: 'Role deleted' }
  },
}
