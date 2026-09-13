import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { AdministrationsService } from '~~/server/services/administrations.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** DELETE /api/administrations/:id — runs are kept (detached), steps cascade. */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  try {
    const result = await AdministrationsService.remove(id)
    await ActivityLogsService.log({
      userId, action: 'ADMINISTRATION_DELETE', entity: 'Administration',
      description: `Delete administration ${id}`,
    }).catch(() => {})
    return result
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
