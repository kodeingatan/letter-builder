import { defineEventHandler, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { CreateDocTemplateSchema } from '~~/server/dto/persuratan.dto'
import { DocTemplatesService } from '~~/server/services/doc-templates.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** POST /api/doc-templates — create draft (Template Write). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const parsed = CreateDocTemplateSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const template = await DocTemplatesService.create(parsed.data)
    await ActivityLogsService.log({
      userId, action: 'TEMPLATE_CREATE', entity: 'DocTemplate',
      description: `Create template ${(template as { name: string }).name}`,
    }).catch(() => {})
    return template
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
