import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { QueryMasterRowSchema } from '~~/server/dto/master-data.dto'
import { MasterDataService } from '~~/server/services/master-data.service'

/** GET /api/master-data/:slug/rows — browse rows (search/sort/page). */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  const parsed = QueryMasterRowSchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    return await MasterDataService.findAllRows(slug, parsed.data)
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
