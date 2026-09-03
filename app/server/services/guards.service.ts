import { getDataSource } from '~~/server/utils/db'
import { GuardSchema } from '~~/server/entities/guard.entity'
import { GuardUrlSchema } from '~~/server/entities/guard-url.entity'
import type { QueryInput } from '~~/server/dto/users.dto'
import type { CreateGuardInput, UpdateGuardInput } from '~~/server/dto/guards.dto'

const searchableFields = ['guardName', 'description']
const sortableFields = ['id', 'guardName', 'description', 'createdAt', 'updatedAt']

export const GuardsService = {
  async findAll(query: QueryInput) {
    const ds = await getDataSource()
    const qb = ds.getRepository(GuardSchema).createQueryBuilder('guard')

    if (query.search) {
      if (query.searchField && searchableFields.includes(query.searchField)) {
        qb.where(`guard.${query.searchField} LIKE :search`, { search: `%${query.search}%` })
      } else {
        const conditions = searchableFields.map(f => `guard.${f} LIKE :search`)
        qb.where(`(${conditions.join(' OR ')})`, { search: `%${query.search}%` })
      }
    }

    if (sortableFields.includes(query.sortBy)) {
      qb.orderBy(`guard.${query.sortBy}`, query.sortOrder)
    }

    const total = await qb.getCount()
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const guard = await ds.getRepository(GuardSchema).findOne({ where: { id } })
    if (!guard) throw new Error('Guard not found')
    return guard
  },

  async create(data: CreateGuardInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(GuardSchema)
    const guard = repo.create({ guardName: data.guardName, description: data.description })
    const saved = await repo.save(guard)

    const urlRepo = ds.getRepository(GuardUrlSchema)
    if (data.allowUrls?.length) {
      for (const url of data.allowUrls) {
        await urlRepo.save(urlRepo.create({ url, type: 'allow', guard: saved }))
      }
    }
    if (data.denyUrls?.length) {
      for (const url of data.denyUrls) {
        await urlRepo.save(urlRepo.create({ url, type: 'deny', guard: saved }))
      }
    }

    return this.findOne(saved.id)
  },

  async update(id: number, data: UpdateGuardInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(GuardSchema)
    const guard = await repo.findOne({ where: { id } })
    if (!guard) throw new Error('Guard not found')

    if (data.guardName) guard.guardName = data.guardName
    if (data.description !== undefined) guard.description = data.description
    await repo.save(guard)

    if (data.allowUrls || data.denyUrls) {
      await ds.getRepository(GuardUrlSchema).delete({ guard: { id } as any })
      const urlRepo = ds.getRepository(GuardUrlSchema)
      if (data.allowUrls) {
        for (const url of data.allowUrls) {
          await urlRepo.save(urlRepo.create({ url, type: 'allow', guard }))
        }
      }
      if (data.denyUrls) {
        for (const url of data.denyUrls) {
          await urlRepo.save(urlRepo.create({ url, type: 'deny', guard }))
        }
      }
    }

    return this.findOne(id)
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(GuardSchema)
    const guard = await repo.findOne({ where: { id } })
    if (!guard) throw new Error('Guard not found')
    await repo.remove(guard)
    return { message: 'Guard deleted' }
  },
}
