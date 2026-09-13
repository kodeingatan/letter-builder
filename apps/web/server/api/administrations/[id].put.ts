import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { UpdateAdministrationSchema } from '~~/server/dto/persuratan.dto'
import { AdministrationsService } from '~~/server/services/administrations.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** PUT /api/administrations/:id — update + replace steps. */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  const parsed = UpdateAdministrationSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const admin = await AdministrationsService.update(id, parsed.data)
    await ActivityLogsService.log({
      userId, action: 'ADMINISTRATION_UPDATE', entity: 'Administration',
      description: `Update administration ${id}`,
    }).catch(() => {})
    return admin
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
