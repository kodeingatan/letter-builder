import { defineEventHandler, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { CreateAdministrationSchema } from '~~/server/dto/persuratan.dto'
import { AdministrationsService } from '~~/server/services/administrations.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** POST /api/administrations — create with steps + mapping. */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const parsed = CreateAdministrationSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const admin = await AdministrationsService.create(parsed.data)
    await ActivityLogsService.log({
      userId, action: 'ADMINISTRATION_CREATE', entity: 'Administration',
      description: `Create administration ${(admin as { name: string }).name}`,
    }).catch(() => {})
    return admin
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
