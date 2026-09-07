import { defineEventHandler } from 'h3'
import { requireAuth } from '~~/server/utils/route-guard'
import { NavigationService } from '~~/server/services/navigation.service'

/**
 * Task 21 — Generated Menu projection.
 * Auth-only (per-item inclusion is the authorization: tables need a GET
 * grant on /api/data/<table>, administrations a runnable grant).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  return NavigationService.getProjection(userId)
})
