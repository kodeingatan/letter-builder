import { defineEventHandler, getHeader } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

export default defineEventHandler(async (event) => {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.method)) return

  const auth = getHeader(event, 'authorization')
  let userId: number | undefined
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(auth.slice(7))
      userId = payload.sub
    } catch {}
  }

  const path = event.path || ''
  const method = event.method
  let entity = 'unknown'
  let entityId: number | undefined
  const firstId = (re: RegExp): number | undefined => {
    const m = path.match(re)
    return m?.[1] ? Number(m[1]) : undefined
  }

  // Task 12: /api/data/* writes are logged by TableDataService with
  // entity = table displayName (BR-006). Skip here to avoid double-logging.
  if (path.includes('/api/data/')) return

  if (path.includes('/api/users')) { entity = 'user'; entityId = firstId(/\/(\d+)/) }
  else if (path.includes('/api/roles')) { entity = 'role'; entityId = firstId(/\/(\d+)/) }
  else if (path.includes('/api/permissions')) { entity = 'permission'; entityId = firstId(/\/(\d+)/) }
  else if (path.includes('/api/guards')) { entity = 'guard'; entityId = firstId(/\/(\d+)/) }
  // NOTE (Task 22): column branch must precede the GlobalTable branch —
  // column URLs contain `/api/global-tables/.../columns/...`.
  else if (path.includes('/api/global-tables') && path.includes('/columns')) {
    entity = 'GlobalTableColumn'
    entityId = firstId(/\/columns\/(\d+)/) ?? firstId(/\/global-tables\/(\d+)/)
  }
  else if (path.includes('/api/global-tables')) { entity = 'GlobalTable'; entityId = firstId(/\/global-tables\/(\d+)/) }
  else if (path.includes('/api/components')) { entity = 'Component'; entityId = firstId(/\/components\/(\d+)/) }
  // Task 22: template binding mutations log as TemplateBinding (not Template).
  else if (path.includes('/api/templates') && path.includes('/bindings')) {
    entity = 'TemplateBinding'
    entityId = firstId(/\/bindings\/(\d+)/) ?? firstId(/\/templates\/(\d+)/)
  }
  else if (path.includes('/api/templates')) { entity = 'Template'; entityId = firstId(/\/templates\/(\d+)/) }
  // Task 22: nested run start (`POST /api/administrations/:id/runs`) is a
  // run-lifecycle event, not an administration edit.
  else if (path.includes('/api/administrations') && path.includes('/runs')) {
    entity = 'AdministrationRun'
    entityId = firstId(/\/runs\/(\d+)/) ?? firstId(/\/administrations\/(\d+)/)
  }
  else if (path.includes('/api/administrations')) { entity = 'Administration'; entityId = firstId(/\/administrations\/(\d+)/) }
  else if (path.includes('/api/runs')) {
    entity = 'AdministrationRun'
    entityId = firstId(/\/runs\/(\d+)/) ?? firstId(/\/administrations\/(\d+)/)
  }
  else if (path.includes('/api/documents')) { entity = 'Document'; entityId = firstId(/\/documents\/(\d+)/) }
  // Task 22: expression + render usage is audited (REQ-002 lifecycle).
  else if (path.includes('/api/expressions')) { entity = 'Expression' }
  else if (path.includes('/api/render')) { entity = 'Render' }
  else if (path.includes('/api/settings')) entity = 'setting'

  const action = method === 'POST' ? 'create' : method === 'PUT' ? 'update' : method === 'PATCH' ? 'update' : 'delete'

  try {
    await ActivityLogsService.log({
      userId,
      action,
      entity,
      entityId,
      description: `${method} ${path}`,
      ipAddress: getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip'),
      userAgent: getHeader(event, 'user-agent'),
    })
  } catch {}
})
