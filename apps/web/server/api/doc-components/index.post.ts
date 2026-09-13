import { defineEventHandler, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { CreateDocComponentSchema } from '~~/server/dto/persuratan.dto'
import { DocComponentsService } from '~~/server/services/doc-components.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** POST /api/doc-components — create (Component Write). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const parsed = CreateDocComponentSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const component = await DocComponentsService.create(parsed.data)
    await ActivityLogsService.log({
      userId, action: 'COMPONENT_CREATE', entity: 'DocComponent',
      description: `Create component ${(component as { name: string }).name}`,
    }).catch(() => {})
    return component
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
      data: (error as Error & { data?: unknown }).data,
    })
  }
})
