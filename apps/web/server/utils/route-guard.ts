import { getHeader, createError, type H3Event } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { getDataSource } from '~~/server/utils/db'
import { UserSchema } from '~~/server/entities/user.entity'
import { matchUrlPattern } from '~~/server/utils/url-matcher'

/**
 * Verify Bearer token and return the user id (401 on missing/invalid token).
 */
export async function requireAuth(event: H3Event): Promise<number> {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try {
    return verifyToken(auth.slice(7)).sub
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }
}

/**
 * Enforce permission method+URL rules (403 when no permission matches).
 *
 * Loads the user with the full RBAC chain (roles → permissions → methods/urls,
 * all eager) and grants access when at least one permission matches both the
 * request method and the request URL pattern. Reuses the shared
 * `matchUrlPattern` utility so behavior matches client-side `canAccessUrl`.
 */
export async function requireApiAccess(event: H3Event): Promise<number> {
  const userId = await requireAuth(event)

  const ds = await getDataSource()
  const user = await ds.getRepository(UserSchema).findOne({ where: { id: userId } })
  if (!user) throw createError({ statusCode: 401, message: 'Invalid token' })

  const path = (event.path || '').split('?')[0]
  const roles: any[] = (user as any).roles ?? []

  const allowed = roles.some((role) =>
    (role.permissions ?? []).some((permission: any) => {
      const methods: string[] = (permission.methods ?? []).map((m: any) => m.method)
      const urls: string[] = (permission.urls ?? []).map((u: any) => u.url)
      const methodOk = methods.includes('*') || methods.includes(event.method)
      const urlOk = urls.some((pattern: string) => matchUrlPattern(pattern, path))
      return methodOk && urlOk
    }),
  )

  if (!allowed) throw createError({ statusCode: 403, message: 'Access denied' })
  return userId
}
