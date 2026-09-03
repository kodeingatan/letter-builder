import { getDataSource } from '~~/server/utils/db'
import { PermissionSchema } from '~~/server/entities/permission.entity'
import { PermissionMethodSchema } from '~~/server/entities/permission-method.entity'
import { PermissionUrlSchema } from '~~/server/entities/permission-url.entity'
import type { QueryInput } from '~~/server/dto/users.dto'
import type { CreatePermissionInput, UpdatePermissionInput } from '~~/server/dto/permissions.dto'

const searchableFields = ['permissionName', 'description']
const sortableFields = ['id', 'permissionName', 'description', 'createdAt', 'updatedAt']

export const PermissionsService = {
  async findAll(query: QueryInput) {
    const ds = await getDataSource()
    const qb = ds.getRepository(PermissionSchema).createQueryBuilder('perm')

    if (query.search) {
      if (query.searchField && searchableFields.includes(query.searchField)) {
        qb.where(`perm.${query.searchField} LIKE :search`, { search: `%${query.search}%` })
      } else {
        const conditions = searchableFields.map(f => `perm.${f} LIKE :search`)
        qb.where(`(${conditions.join(' OR ')})`, { search: `%${query.search}%` })
      }
    }

    if (sortableFields.includes(query.sortBy)) {
      qb.orderBy(`perm.${query.sortBy}`, query.sortOrder)
    }

    const total = await qb.getCount()
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const perm = await ds.getRepository(PermissionSchema).findOne({ where: { id } })
    if (!perm) throw new Error('Permission not found')
    return perm
  },

  async create(data: CreatePermissionInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(PermissionSchema)
    const perm = repo.create({ permissionName: data.permissionName, description: data.description })
    const saved = await repo.save(perm)

    if (data.methods?.length) {
      const methodRepo = ds.getRepository(PermissionMethodSchema)
      for (const method of data.methods) {
        await methodRepo.save(methodRepo.create({ method, permission: saved }))
      }
    }
    if (data.urls?.length) {
      const urlRepo = ds.getRepository(PermissionUrlSchema)
      for (const url of data.urls) {
        await urlRepo.save(urlRepo.create({ url, permission: saved }))
      }
    }

    return this.findOne(saved.id)
  },

  async update(id: number, data: UpdatePermissionInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(PermissionSchema)
    const perm = await repo.findOne({ where: { id } })
    if (!perm) throw new Error('Permission not found')

    if (data.permissionName) perm.permissionName = data.permissionName
    if (data.description !== undefined) perm.description = data.description
    await repo.save(perm)

    if (data.methods) {
      await ds.getRepository(PermissionMethodSchema).delete({ permission: { id } as any })
      const methodRepo = ds.getRepository(PermissionMethodSchema)
      for (const method of data.methods) {
        await methodRepo.save(methodRepo.create({ method, permission: perm }))
      }
    }
    if (data.urls) {
      await ds.getRepository(PermissionUrlSchema).delete({ permission: { id } as any })
      const urlRepo = ds.getRepository(PermissionUrlSchema)
      for (const url of data.urls) {
        await urlRepo.save(urlRepo.create({ url, permission: perm }))
      }
    }

    return this.findOne(id)
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(PermissionSchema)
    const perm = await repo.findOne({ where: { id } })
    if (!perm) throw new Error('Permission not found')
    await repo.remove(perm)
    return { message: 'Permission deleted' }
  },
}
