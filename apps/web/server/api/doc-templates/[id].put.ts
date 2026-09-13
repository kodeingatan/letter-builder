import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { UpdateDocTemplateSchema } from '~~/server/dto/persuratan.dto'
import { DocTemplatesService } from '~~/server/services/doc-templates.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** PUT /api/doc-templates/:id — update / publish (bumps version) / archive. */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  const parsed = UpdateDocTemplateSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const template = await DocTemplatesService.update(id, parsed.data)
    await ActivityLogsService.log({
      userId, action: 'TEMPLATE_UPDATE', entity: 'DocTemplate',
      description: `Update template ${id}`,
    }).catch(() => {})
    return template
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
