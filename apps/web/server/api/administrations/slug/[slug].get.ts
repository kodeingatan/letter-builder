import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { getDataSource } from '~~/server/utils/db'
import { AdministrationSchema } from '~~/server/entities/administration.entity'
import { AdministrationsService } from '~~/server/services/administrations.service'

/** GET /api/administrations/slug/:slug — lookup for the per-letter menu. */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  try {
    const ds = await getDataSource()
    const row = await ds.getRepository(AdministrationSchema).findOne({ where: { slug } })
    if (!row) throw createError({ statusCode: 404, message: `Administration "${slug}" not found` })
    return await AdministrationsService.findOne((row as unknown as { id: number }).id)
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode) throw error
    throw createError({ statusCode: 500, message: (error as Error).message })
  }
})
