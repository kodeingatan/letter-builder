import { getDataSource } from '~~/server/utils/db'
import { ActivityLogSchema } from '~~/server/entities/activity-log.entity'
import type { QueryActivityLogInput } from '~~/server/dto/activity-logs.dto'

export const ActivityLogsService = {
  async log(data: {
    userId?: number
    action: string
    entity: string
    entityId?: number
    description?: string
    metadata?: string
    ipAddress?: string
    userAgent?: string
    level?: string
  }) {
    const ds = await getDataSource()
    const repo = ds.getRepository(ActivityLogSchema)
    const log = repo.create(data)
    return repo.save(log)
  },

  async findAll(query: QueryActivityLogInput) {
    const ds = await getDataSource()
    const qb = ds.getRepository(ActivityLogSchema).createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')

    if (query.search) {
      qb.where('(log.description LIKE :search OR user.username LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)', { search: `%${query.search}%` })
    }
    if (query.action) qb.andWhere('log.action = :action', { action: query.action })
    if (query.entity) qb.andWhere('log.entity = :entity', { entity: query.entity })
    if (query.userId) qb.andWhere('log.userId = :userId', { userId: query.userId })
    if (query.level) qb.andWhere('log.level = :level', { level: query.level })
    if (query.startDate) qb.andWhere('log.createdAt >= :startDate', { startDate: query.startDate })
    if (query.endDate) qb.andWhere('log.createdAt <= :endDate', { endDate: query.endDate })

    qb.orderBy(`log.${query.sortBy}`, query.sortOrder)

    const total = await qb.getCount()
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const log = await ds.getRepository(ActivityLogSchema).findOne({ where: { id }, relations: ['user'] })
    if (!log) throw new Error('Activity log not found')
    return log
  },

  async getStats() {
    const ds = await getDataSource()
    const repo = ds.getRepository(ActivityLogSchema)
    const total = await repo.count()
    const byAction = await repo.createQueryBuilder('log').select('log.action', 'action').addSelect('COUNT(*)', 'count').groupBy('log.action').getRawMany()
    const byEntity = await repo.createQueryBuilder('log').select('log.entity', 'entity').addSelect('COUNT(*)', 'count').groupBy('log.entity').getRawMany()
    const byLevel = await repo.createQueryBuilder('log').select('log.level', 'level').addSelect('COUNT(*)', 'count').groupBy('log.level').getRawMany()
    return { total, byAction, byEntity, byLevel }
  },
}
