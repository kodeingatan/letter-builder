import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { MasterDataService } from '~~/server/services/master-data.service'

/** GET /api/master-data/:slug/schema — column list for the Task 07 builder. */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  try {
    return await MasterDataService.getSchema(slug)
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
