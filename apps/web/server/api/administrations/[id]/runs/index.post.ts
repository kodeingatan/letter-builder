import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { RunWizardSchema } from '~~/server/dto/persuratan.dto'
import { AdministrationsService } from '~~/server/services/administrations.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** POST /api/administrations/:id/runs — execute the wizard (Step 6, FR-008). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  const parsed = RunWizardSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const result = await AdministrationsService.executeRun(id, parsed.data)
    await ActivityLogsService.log({
      userId, action: 'ADMINISTRATION_RUN', entity: 'Document',
      description: `Run administration ${id} → document ${(result.document as unknown as { id: number }).id}`,
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
