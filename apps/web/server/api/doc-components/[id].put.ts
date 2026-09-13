import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { UpdateDocComponentSchema } from '~~/server/dto/persuratan.dto'
import { DocComponentsService } from '~~/server/services/doc-components.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** PUT /api/doc-components/:id — update (bumps version). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  const parsed = UpdateDocComponentSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const component = await DocComponentsService.update(id, parsed.data)
    await ActivityLogsService.log({
      userId, action: 'COMPONENT_UPDATE', entity: 'DocComponent',
      description: `Update component ${id}`,
    }).catch(() => {})
    return component
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
