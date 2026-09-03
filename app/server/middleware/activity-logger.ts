import { defineEventHandler, getHeader, getRouterParam } from 'h3'
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

  if (path.includes('/api/users')) { entity = 'user'; const m = path.match(/\/(\d+)/); if (m) entityId = Number(m[1]) }
  else if (path.includes('/api/roles')) { entity = 'role'; const m = path.match(/\/(\d+)/); if (m) entityId = Number(m[1]) }
  else if (path.includes('/api/permissions')) { entity = 'permission'; const m = path.match(/\/(\d+)/); if (m) entityId = Number(m[1]) }
  else if (path.includes('/api/guards')) { entity = 'guard'; const m = path.match(/\/(\d+)/); if (m) entityId = Number(m[1]) }
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
