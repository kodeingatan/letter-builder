import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { NavigationService } from '~~/server/services/navigation.service'
import { MenuUpdateSchema } from '~~/server/dto/navigation.dto'

/**
 * Task 21 — Designer-gated reorder/icon update for a Data menu entry.
 * Covered by the existing `Global Table Management` permission grant.
 */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) throw createError({ statusCode: 400, message: 'Invalid table id' })
  const parsed = MenuUpdateSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    return await NavigationService.updateTableMenu(id, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 500, message: e.message, data: e.data })
  }
})
