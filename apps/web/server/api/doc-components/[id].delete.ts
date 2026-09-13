import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocComponentsService } from '~~/server/services/doc-components.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** DELETE /api/doc-components/:id — 409 when still used (ALT-01). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  try {
    const result = await DocComponentsService.remove(id)
    await ActivityLogsService.log({
      userId, action: 'COMPONENT_DELETE', entity: 'DocComponent',
      description: `Delete component ${id}`,
    }).catch(() => {})
    return result
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
      data: (error as Error & { data?: unknown }).data,
    })
  }
})
