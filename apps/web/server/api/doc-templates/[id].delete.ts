import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocTemplatesService } from '~~/server/services/doc-templates.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** DELETE /api/doc-templates/:id — 409 when used by steps (BR-004). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  try {
    const result = await DocTemplatesService.remove(id)
    await ActivityLogsService.log({
      userId, action: 'TEMPLATE_DELETE', entity: 'DocTemplate',
      description: `Delete template ${id}`,
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
