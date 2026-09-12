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

  if (path.includes('/api/users')) { entity = 'user'; entityId = firstId(/\/(\d+)/) }
  else if (path.includes('/api/roles')) { entity = 'role'; entityId = firstId(/\/(\d+)/) }
  else if (path.includes('/api/permissions')) { entity = 'permission'; entityId = firstId(/\/(\d+)/) }
  else if (path.includes('/api/guards')) { entity = 'guard'; entityId = firstId(/\/(\d+)/) }
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
