import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { MasterDataService } from '~~/server/services/master-data.service'

/** GET /api/master-data/:slug/rows/:id — row detail. */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  const id = Number(getRouterParam(event, 'id'))
  try {
    return await MasterDataService.findOneRow(slug, id)
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
