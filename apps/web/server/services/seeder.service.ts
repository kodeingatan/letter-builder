import { DataSource } from 'typeorm'
import { UserSchema } from '~~/server/entities/user.entity'
import { RoleSchema } from '~~/server/entities/role.entity'
import { PermissionSchema } from '~~/server/entities/permission.entity'
import { PermissionMethodSchema } from '~~/server/entities/permission-method.entity'
import { PermissionUrlSchema } from '~~/server/entities/permission-url.entity'
import { GuardSchema } from '~~/server/entities/guard.entity'
import { GuardUrlSchema } from '~~/server/entities/guard-url.entity'
import { SettingSchema } from '~~/server/entities/setting.entity'
import { hashPassword } from '~~/server/utils/password'

export async function seedDatabase(ds: DataSource) {
  const usersRepo = ds.getRepository(UserSchema)
  const rolesRepo = ds.getRepository(RoleSchema)
  const permissionsRepo = ds.getRepository(PermissionSchema)
  const permissionMethodsRepo = ds.getRepository(PermissionMethodSchema)
  const permissionUrlsRepo = ds.getRepository(PermissionUrlSchema)
  const guardsRepo = ds.getRepository(GuardSchema)
  const guardUrlsRepo = ds.getRepository(GuardUrlSchema)
  const settingsRepo = ds.getRepository(SettingSchema)

  const guards = await seedGuards(guardsRepo, guardUrlsRepo)
  const permissions = await seedPermissions(permissionsRepo, permissionMethodsRepo, permissionUrlsRepo)
  const roles = await seedRoles(rolesRepo, guards, permissions)
  await seedUsers(usersRepo, roles)
  await seedSettings(settingsRepo)
  await seedGlobalTablePermission(ds)
  await seedComponentPermission(ds)
  await seedTemplatePermission(ds)
  await seedAdministrationPermission(ds)
  await seedAdministrationRunPermission(ds)
  await seedDocumentPermission(ds)
  await seedRenderPermission(ds)
}

/**
 * Idempotent seed for the Rendering Preview permission (Task 20).
 * Covers the shared preview endpoint `POST /api/render/preview` used by
 * every editor/runner preview pane. Issuance itself is internal
 * (run-complete hook) and needs no route grant.
 */
async function seedRenderPermission(ds: DataSource) {
  const permissionsRepo = ds.getRepository(PermissionSchema)
  const permissionMethodsRepo = ds.getRepository(PermissionMethodSchema)
  const permissionUrlsRepo = ds.getRepository(PermissionUrlSchema)
  const rolesRepo = ds.getRepository(RoleSchema)

  let permission = await permissionsRepo.findOne({ where: { permissionName: 'Rendering Preview' } })
  if (!permission) {
    permission = permissionsRepo.create({
      permissionName: 'Rendering Preview',
      description: 'Preview rendered documents (shared rendering engine)',
    })
    await permissionsRepo.save(permission)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'POST', permission }),
    ])
    await permissionUrlsRepo.save([
      permissionUrlsRepo.create({ url: '/api/render/*', permission }),
    ])
  }

  for (const roleName of ['Admin', 'Super Admin']) {
    const role = await rolesRepo.findOne({ where: { roleName } })
    if (role && !(role.permissions ?? []).some((p: any) => p.permissionName === 'Rendering Preview')) {
      role.permissions = [...(role.permissions ?? []), permission]
      await rolesRepo.save(role)
    }
  }
}

/**
 * Idempotent seed for the Document Management permission (Task 19).
 * Covers browse/detail/preview/download plus the admin-gated reissue
 * and purge routes. Row-level own-vs-all scoping lives in
 * DocumentsService; non-admin readers pass via their existing GET grants
 * (e.g. Read Only on /*).
 */
async function seedDocumentPermission(ds: DataSource) {
  const permissionsRepo = ds.getRepository(PermissionSchema)
  const permissionMethodsRepo = ds.getRepository(PermissionMethodSchema)
  const permissionUrlsRepo = ds.getRepository(PermissionUrlSchema)
  const rolesRepo = ds.getRepository(RoleSchema)

  let permission = await permissionsRepo.findOne({ where: { permissionName: 'Document Management' } })
  if (!permission) {
    permission = permissionsRepo.create({
      permissionName: 'Document Management',
      description: 'Browse issued documents (read, preview, download, admin reissue/purge)',
    })
    await permissionsRepo.save(permission)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission }),
      permissionMethodsRepo.create({ method: 'POST', permission }),
      permissionMethodsRepo.create({ method: 'DELETE', permission }),
    ])
    await permissionUrlsRepo.save([
      permissionUrlsRepo.create({ url: '/api/documents/*', permission }),
    ])
  }

  for (const roleName of ['Admin', 'Super Admin']) {
    const role = await rolesRepo.findOne({ where: { roleName } })
    if (role && !(role.permissions ?? []).some((p: any) => p.permissionName === 'Document Management')) {
      role.permissions = [...(role.permissions ?? []), permission]
      await rolesRepo.save(role)
    }
  }
}

/**
 * Idempotent seed for the Administration Run permission (Task 18).
 * Operators start/save/complete their own runs; designers (Administration
 * Management) keep full workflow access. Covers the nested start route
 * plus the /api/runs/* session routes.
 */
async function seedAdministrationRunPermission(ds: DataSource) {
  const permissionsRepo = ds.getRepository(PermissionSchema)
  const permissionMethodsRepo = ds.getRepository(PermissionMethodSchema)
  const permissionUrlsRepo = ds.getRepository(PermissionUrlSchema)
  const rolesRepo = ds.getRepository(RoleSchema)

  let permission = await permissionsRepo.findOne({ where: { permissionName: 'Administration Run' } })
  if (!permission) {
    permission = permissionsRepo.create({
      permissionName: 'Administration Run',
      description: 'Run published administrations (start, save steps, complete own runs)',
    })
    await permissionsRepo.save(permission)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission }),
      permissionMethodsRepo.create({ method: 'POST', permission }),
      permissionMethodsRepo.create({ method: 'PATCH', permission }),
    ])
    await permissionUrlsRepo.save([
      permissionUrlsRepo.create({ url: '/api/runs/*', permission }),
      permissionUrlsRepo.create({ url: '/api/administrations/*/runs', permission }),
    ])
  }

  for (const roleName of ['Admin', 'Super Admin']) {
    const role = await rolesRepo.findOne({ where: { roleName } })
    if (role && !(role.permissions ?? []).some((p: any) => p.permissionName === 'Administration Run')) {
      role.permissions = [...(role.permissions ?? []), permission]
      await rolesRepo.save(role)
    }
  }
}

/**
 * Idempotent seed for the Administration Management permission (Task 17).
 * Runs on every startup so existing databases also receive the permission,
 * and attaches it to the Admin / Super Admin roles when missing.
 */
async function seedAdministrationPermission(ds: DataSource) {
  const permissionsRepo = ds.getRepository(PermissionSchema)
  const permissionMethodsRepo = ds.getRepository(PermissionMethodSchema)
  const permissionUrlsRepo = ds.getRepository(PermissionUrlSchema)
  const rolesRepo = ds.getRepository(RoleSchema)

  let permission = await permissionsRepo.findOne({ where: { permissionName: 'Administration Management' } })
  if (!permission) {
    permission = permissionsRepo.create({
      permissionName: 'Administration Management',
      description: 'Manage administration workflows (CRUD, steps, publish, archive)',
    })
    await permissionsRepo.save(permission)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission }),
      permissionMethodsRepo.create({ method: 'POST', permission }),
      permissionMethodsRepo.create({ method: 'PUT', permission }),
      permissionMethodsRepo.create({ method: 'DELETE', permission }),
    ])
    await permissionUrlsRepo.save(
      permissionUrlsRepo.create({ url: '/api/administrations/*', permission }),
    )
  }

  for (const roleName of ['Admin', 'Super Admin']) {
    const role = await rolesRepo.findOne({ where: { roleName } })
    if (role && !(role.permissions ?? []).some((p: any) => p.permissionName === 'Administration Management')) {
      role.permissions = [...(role.permissions ?? []), permission]
      await rolesRepo.save(role)
    }
  }
}

/**
 * Idempotent seed for the Template Management permission (Task 14).
 * Runs on every startup so existing databases also receive the permission,
 * and attaches it to the Admin / Super Admin roles when missing.
 */
async function seedTemplatePermission(ds: DataSource) {
  const permissionsRepo = ds.getRepository(PermissionSchema)
  const permissionMethodsRepo = ds.getRepository(PermissionMethodSchema)
  const permissionUrlsRepo = ds.getRepository(PermissionUrlSchema)
  const rolesRepo = ds.getRepository(RoleSchema)

  let permission = await permissionsRepo.findOne({ where: { permissionName: 'Template Management' } })
  if (!permission) {
    permission = permissionsRepo.create({
      permissionName: 'Template Management',
      description: 'Manage document templates (CRUD, publish, rollback)',
    })
    await permissionsRepo.save(permission)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission }),
      permissionMethodsRepo.create({ method: 'POST', permission }),
      permissionMethodsRepo.create({ method: 'PUT', permission }),
      permissionMethodsRepo.create({ method: 'DELETE', permission }),
    ])
    await permissionUrlsRepo.save(
      permissionUrlsRepo.create({ url: '/api/templates/*', permission }),
    )
  }

  for (const roleName of ['Admin', 'Super Admin']) {
    const role = await rolesRepo.findOne({ where: { roleName } })
    if (role && !(role.permissions ?? []).some((p: any) => p.permissionName === 'Template Management')) {
      role.permissions = [...(role.permissions ?? []), permission]
      await rolesRepo.save(role)
    }
  }
}

/**
 * Idempotent seed for the Component Management permission (Task 13).
 * Runs on every startup so existing databases also receive the permission,
 * and attaches it to the Admin / Super Admin roles when missing.
 */
async function seedComponentPermission(ds: DataSource) {
  const permissionsRepo = ds.getRepository(PermissionSchema)
  const permissionMethodsRepo = ds.getRepository(PermissionMethodSchema)
  const permissionUrlsRepo = ds.getRepository(PermissionUrlSchema)
  const rolesRepo = ds.getRepository(RoleSchema)

  let permission = await permissionsRepo.findOne({ where: { permissionName: 'Component Management' } })
  if (!permission) {
    permission = permissionsRepo.create({
      permissionName: 'Component Management',
      description: 'Manage reusable document components (CRUD, publish, preview)',
    })
    await permissionsRepo.save(permission)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission }),
      permissionMethodsRepo.create({ method: 'POST', permission }),
      permissionMethodsRepo.create({ method: 'PUT', permission }),
      permissionMethodsRepo.create({ method: 'DELETE', permission }),
    ])
    await permissionUrlsRepo.save(
      permissionUrlsRepo.create({ url: '/api/components/*', permission }),
    )
  }

  for (const roleName of ['Admin', 'Super Admin']) {
    const role = await rolesRepo.findOne({ where: { roleName } })
    if (role && !(role.permissions ?? []).some((p: any) => p.permissionName === 'Component Management')) {
      role.permissions = [...(role.permissions ?? []), permission]
      await rolesRepo.save(role)
    }
  }
}

/**
 * Idempotent seed for the Global Table Management permission (Task 07).
 * Runs on every startup so existing databases also receive the permission,
 * and attaches it to the Admin role when missing.
 */
async function seedGlobalTablePermission(ds: DataSource) {
  const permissionsRepo = ds.getRepository(PermissionSchema)
  const permissionMethodsRepo = ds.getRepository(PermissionMethodSchema)
  const permissionUrlsRepo = ds.getRepository(PermissionUrlSchema)
  const rolesRepo = ds.getRepository(RoleSchema)

  let permission = await permissionsRepo.findOne({ where: { permissionName: 'Global Table Management' } })
  if (!permission) {
    permission = permissionsRepo.create({
      permissionName: 'Global Table Management',
      description: 'Manage Global Table metadata (CRUD)',
    })
    await permissionsRepo.save(permission)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission }),
      permissionMethodsRepo.create({ method: 'POST', permission }),
      permissionMethodsRepo.create({ method: 'PUT', permission }),
      permissionMethodsRepo.create({ method: 'DELETE', permission }),
    ])
    await permissionUrlsRepo.save(
      permissionUrlsRepo.create({ url: '/api/global-tables/*', permission }),
    )
    // Task 12: generated row CRUD lives under /api/data/* (+ legacy lookup
    // provider path). Existing databases receive coverage via this upsert.
    const existingUrls = (permission as any).urls ?? []
    const covered = new Set(existingUrls.map((u: any) => u.url))
    const extraUrls = ['/api/data/*', '/api/global-tables/*/rows/*'].filter((u) => !covered.has(u))
    if (extraUrls.length) {
      await permissionUrlsRepo.save(
        extraUrls.map((url) => permissionUrlsRepo.create({ url, permission })),
      )
    }
  }

  // Attach Global Table Management permission to Admin role
  const admin = await rolesRepo.findOne({ where: { roleName: 'Admin' } })
  if (admin && !(admin.permissions ?? []).some((p: any) => p.permissionName === 'Global Table Management')) {
    admin.permissions = [...(admin.permissions ?? []), permission]
    await rolesRepo.save(admin)
  }

  // Also attach to Super Admin role if missing
  const superAdmin = await rolesRepo.findOne({ where: { roleName: 'Super Admin' } })
  if (superAdmin && !(superAdmin.permissions ?? []).some((p: any) => p.permissionName === 'Global Table Management')) {
    superAdmin.permissions = [...(superAdmin.permissions ?? []), permission]
    await rolesRepo.save(superAdmin)
  }
}

async function seedGuards(guardsRepo: any, guardUrlsRepo: any) {
  // Full Access Guard
  let fullAccess = await guardsRepo.findOne({ where: { guardName: 'Full Access' } })
  if (!fullAccess) {
    fullAccess = guardsRepo.create({ guardName: 'Full Access', description: 'Izinkan semua URL' })
    await guardsRepo.save(fullAccess)
    await guardUrlsRepo.save(guardUrlsRepo.create({ url: '/*', type: 'allow', guard: fullAccess }))
  }

  // Web Access Guard
  let webAccess = await guardsRepo.findOne({ where: { guardName: 'Web Access' } })
  if (!webAccess) {
    webAccess = guardsRepo.create({ guardName: 'Web Access', description: 'Hanya akses API, tolak admin routes' })
    await guardsRepo.save(webAccess)
    await guardUrlsRepo.save([
      guardUrlsRepo.create({ url: '/api/*', type: 'allow', guard: webAccess }),
      guardUrlsRepo.create({ url: '/api/admin/*', type: 'deny', guard: webAccess }),
    ])
  }

  // API Only Guard
  let apiOnly = await guardsRepo.findOne({ where: { guardName: 'API Only' } })
  if (!apiOnly) {
    apiOnly = guardsRepo.create({ guardName: 'API Only', description: 'Hanya akses API endpoints' })
    await guardsRepo.save(apiOnly)
    await guardUrlsRepo.save(guardUrlsRepo.create({ url: '/api/*', type: 'allow', guard: apiOnly }))
  }

  // Admin Only Guard
  let adminOnly = await guardsRepo.findOne({ where: { guardName: 'Admin Only' } })
  if (!adminOnly) {
    adminOnly = guardsRepo.create({ guardName: 'Admin Only', description: 'Hanya akses admin dan user management' })
    await guardsRepo.save(adminOnly)
    await guardUrlsRepo.save([
      guardUrlsRepo.create({ url: '/api/admin/*', type: 'allow', guard: adminOnly }),
      guardUrlsRepo.create({ url: '/api/users/*', type: 'allow', guard: adminOnly }),
      guardUrlsRepo.create({ url: '/api/roles/*', type: 'allow', guard: adminOnly }),
    ])
  }

  // Read Only Guard
  let readOnlyGuard = await guardsRepo.findOne({ where: { guardName: 'Read Only Guard' } })
  if (!readOnlyGuard) {
    readOnlyGuard = guardsRepo.create({ guardName: 'Read Only Guard', description: 'Akses baca saja, tolak user dan role management' })
    await guardsRepo.save(readOnlyGuard)
    await guardUrlsRepo.save([
      guardUrlsRepo.create({ url: '/api/*', type: 'allow', guard: readOnlyGuard }),
      guardUrlsRepo.create({ url: '/api/users', type: 'deny', guard: readOnlyGuard }),
      guardUrlsRepo.create({ url: '/api/roles', type: 'deny', guard: readOnlyGuard }),
    ])
  }

  // User Management Guard
  let userMgmtGuard = await guardsRepo.findOne({ where: { guardName: 'User Management Guard' } })
  if (!userMgmtGuard) {
    userMgmtGuard = guardsRepo.create({ guardName: 'User Management Guard', description: 'Hanya akses user management' })
    await guardsRepo.save(userMgmtGuard)
    await guardUrlsRepo.save(guardUrlsRepo.create({ url: '/api/users/*', type: 'allow', guard: userMgmtGuard }))
  }

  // Role Management Guard
  let roleMgmtGuard = await guardsRepo.findOne({ where: { guardName: 'Role Management Guard' } })
  if (!roleMgmtGuard) {
    roleMgmtGuard = guardsRepo.create({ guardName: 'Role Management Guard', description: 'Hanya akses role management' })
    await guardsRepo.save(roleMgmtGuard)
    await guardUrlsRepo.save(guardUrlsRepo.create({ url: '/api/roles/*', type: 'allow', guard: roleMgmtGuard }))
  }

  // Dashboard Only Guard
  let dashboardOnly = await guardsRepo.findOne({ where: { guardName: 'Dashboard Only' } })
  if (!dashboardOnly) {
    dashboardOnly = guardsRepo.create({ guardName: 'Dashboard Only', description: 'Hanya akses profile, tolak semua management' })
    await guardsRepo.save(dashboardOnly)
    await guardUrlsRepo.save([
      guardUrlsRepo.create({ url: '/api/auth/profile', type: 'allow', guard: dashboardOnly }),
      guardUrlsRepo.create({ url: '/api/users/*', type: 'deny', guard: dashboardOnly }),
      guardUrlsRepo.create({ url: '/api/roles/*', type: 'deny', guard: dashboardOnly }),
      guardUrlsRepo.create({ url: '/api/permissions/*', type: 'deny', guard: dashboardOnly }),
      guardUrlsRepo.create({ url: '/api/guards/*', type: 'deny', guard: dashboardOnly }),
    ])
  }

  return [fullAccess, webAccess, apiOnly, adminOnly, readOnlyGuard, userMgmtGuard, roleMgmtGuard, dashboardOnly]
}

async function seedPermissions(permissionsRepo: any, permissionMethodsRepo: any, permissionUrlsRepo: any) {
  // Full Access Permission
  let fullAccess = await permissionsRepo.findOne({ where: { permissionName: 'Full Access' } })
  if (!fullAccess) {
    fullAccess = permissionsRepo.create({ permissionName: 'Full Access', description: 'Izinkan semua method dan URL' })
    await permissionsRepo.save(fullAccess)
    await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: '*', permission: fullAccess }))
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/*', permission: fullAccess }))
  }

  // Read Only Permission
  let readOnly = await permissionsRepo.findOne({ where: { permissionName: 'Read Only' } })
  if (!readOnly) {
    readOnly = permissionsRepo.create({ permissionName: 'Read Only', description: 'Hanya izinkan GET dan OPTIONS' })
    await permissionsRepo.save(readOnly)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission: readOnly }),
      permissionMethodsRepo.create({ method: 'OPTIONS', permission: readOnly }),
    ])
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/*', permission: readOnly }))
  }

  // Read Write Permission
  let readWrite = await permissionsRepo.findOne({ where: { permissionName: 'Read Write' } })
  if (!readWrite) {
    readWrite = permissionsRepo.create({ permissionName: 'Read Write', description: 'Izinkan semua method CRUD' })
    await permissionsRepo.save(readWrite)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission: readWrite }),
      permissionMethodsRepo.create({ method: 'POST', permission: readWrite }),
      permissionMethodsRepo.create({ method: 'PUT', permission: readWrite }),
      permissionMethodsRepo.create({ method: 'DELETE', permission: readWrite }),
      permissionMethodsRepo.create({ method: 'PATCH', permission: readWrite }),
      permissionMethodsRepo.create({ method: 'OPTIONS', permission: readWrite }),
    ])
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/*', permission: readWrite }))
  }

  // User Management Permission
  let userMgmt = await permissionsRepo.findOne({ where: { permissionName: 'User Management' } })
  if (!userMgmt) {
    userMgmt = permissionsRepo.create({ permissionName: 'User Management', description: 'Izinkan CRUD user' })
    await permissionsRepo.save(userMgmt)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission: userMgmt }),
      permissionMethodsRepo.create({ method: 'POST', permission: userMgmt }),
      permissionMethodsRepo.create({ method: 'PUT', permission: userMgmt }),
      permissionMethodsRepo.create({ method: 'DELETE', permission: userMgmt }),
    ])
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/users/*', permission: userMgmt }))
  }

  // Role Management Permission
  let roleMgmt = await permissionsRepo.findOne({ where: { permissionName: 'Role Management' } })
  if (!roleMgmt) {
    roleMgmt = permissionsRepo.create({ permissionName: 'Role Management', description: 'Izinkan CRUD role' })
    await permissionsRepo.save(roleMgmt)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission: roleMgmt }),
      permissionMethodsRepo.create({ method: 'POST', permission: roleMgmt }),
      permissionMethodsRepo.create({ method: 'PUT', permission: roleMgmt }),
      permissionMethodsRepo.create({ method: 'DELETE', permission: roleMgmt }),
    ])
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/roles/*', permission: roleMgmt }))
  }

  // Guard Management Permission
  let guardMgmt = await permissionsRepo.findOne({ where: { permissionName: 'Guard Management' } })
  if (!guardMgmt) {
    guardMgmt = permissionsRepo.create({ permissionName: 'Guard Management', description: 'Izinkan CRUD guard' })
    await permissionsRepo.save(guardMgmt)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission: guardMgmt }),
      permissionMethodsRepo.create({ method: 'POST', permission: guardMgmt }),
      permissionMethodsRepo.create({ method: 'PUT', permission: guardMgmt }),
      permissionMethodsRepo.create({ method: 'DELETE', permission: guardMgmt }),
    ])
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/guards/*', permission: guardMgmt }))
  }

  // Permission Management Permission
  let permMgmt = await permissionsRepo.findOne({ where: { permissionName: 'Permission Management' } })
  if (!permMgmt) {
    permMgmt = permissionsRepo.create({ permissionName: 'Permission Management', description: 'Izinkan CRUD permission' })
    await permissionsRepo.save(permMgmt)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission: permMgmt }),
      permissionMethodsRepo.create({ method: 'POST', permission: permMgmt }),
      permissionMethodsRepo.create({ method: 'PUT', permission: permMgmt }),
      permissionMethodsRepo.create({ method: 'DELETE', permission: permMgmt }),
    ])
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/permissions/*', permission: permMgmt }))
  }

  // Dashboard Read Permission
  let dashRead = await permissionsRepo.findOne({ where: { permissionName: 'Dashboard Read' } })
  if (!dashRead) {
    dashRead = permissionsRepo.create({ permissionName: 'Dashboard Read', description: 'Hanya baca profile' })
    await permissionsRepo.save(dashRead)
    await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'GET', permission: dashRead }))
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/auth/profile', permission: dashRead }))
  }

  // Activity Logs Permission
  let activityLogs = await permissionsRepo.findOne({ where: { permissionName: 'Activity Logs' } })
  if (!activityLogs) {
    activityLogs = permissionsRepo.create({ permissionName: 'Activity Logs', description: 'Akses melihat activity logs' })
    await permissionsRepo.save(activityLogs)
    await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'GET', permission: activityLogs }))
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/activity-logs/*', permission: activityLogs }))
  }

  // System Logs Permission
  let systemLogs = await permissionsRepo.findOne({ where: { permissionName: 'System Logs' } })
  if (!systemLogs) {
    systemLogs = permissionsRepo.create({ permissionName: 'System Logs', description: 'Akses melihat system logs' })
    await permissionsRepo.save(systemLogs)
    await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'GET', permission: systemLogs }))
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/system-logs/*', permission: systemLogs }))
  }

  return [fullAccess, readOnly, readWrite, userMgmt, roleMgmt, guardMgmt, permMgmt, dashRead, activityLogs, systemLogs]
}

async function seedRoles(rolesRepo: any, guards: any[], permissions: any[]) {
  // Super Admin Role
  let superAdmin = await rolesRepo.findOne({ where: { roleName: 'Super Admin' } })
  if (!superAdmin) {
    superAdmin = rolesRepo.create({
      roleName: 'Super Admin',
      description: 'Akses penuh ke semua fitur',
      guards: [guards[0]],
      permissions: [permissions[0], permissions[8], permissions[9]],
    })
    await rolesRepo.save(superAdmin)
  }

  // Admin Role
  let admin = await rolesRepo.findOne({ where: { roleName: 'Admin' } })
  if (!admin) {
    admin = rolesRepo.create({
      roleName: 'Admin',
      description: 'Akses admin terbatas',
      guards: [guards[1]],
      permissions: [permissions[2]],
    })
    await rolesRepo.save(admin)
  }

  // User Role
  let user = await rolesRepo.findOne({ where: { roleName: 'User' } })
  if (!user) {
    user = rolesRepo.create({
      roleName: 'User',
      description: 'Akses dasar untuk user biasa',
      guards: [guards[2]],
      permissions: [permissions[1]],
    })
    await rolesRepo.save(user)
  }

  // Editor Role
  let editor = await rolesRepo.findOne({ where: { roleName: 'Editor' } })
  if (!editor) {
    editor = rolesRepo.create({
      roleName: 'Editor',
      description: 'Akses edit user dan content',
      guards: [guards[2]],
      permissions: [permissions[2], permissions[3]],
    })
    await rolesRepo.save(editor)
  }

  // Viewer Role
  let viewer = await rolesRepo.findOne({ where: { roleName: 'Viewer' } })
  if (!viewer) {
    viewer = rolesRepo.create({
      roleName: 'Viewer',
      description: 'Hanya melihat data',
      guards: [guards[4]],
      permissions: [permissions[1], permissions[7]],
    })
    await rolesRepo.save(viewer)
  }

  // Manager Role
  let manager = await rolesRepo.findOne({ where: { roleName: 'Manager' } })
  if (!manager) {
    manager = rolesRepo.create({
      roleName: 'Manager',
      description: 'Akses management user dan role',
      guards: [guards[1], guards[5]],
      permissions: [permissions[2], permissions[3], permissions[4]],
    })
    await rolesRepo.save(manager)
  }

  // Guest Role
  let guest = await rolesRepo.findOne({ where: { roleName: 'Guest' } })
  if (!guest) {
    guest = rolesRepo.create({
      roleName: 'Guest',
      description: 'Akses terbatas hanya dashboard',
      guards: [guards[7]],
      permissions: [permissions[7]],
    })
    await rolesRepo.save(guest)
  }

  return [superAdmin, admin, user, editor, viewer, manager, guest]
}

async function seedUsers(usersRepo: any, roles: any[]) {
  const hashedPassword = await hashPassword('P455w0rd!!!')

  const admin = await usersRepo.findOne({ where: { email: 'admin@admin.com' } })
  if (!admin) {
    await usersRepo.save(usersRepo.create({
      firstName: 'Super',
      lastName: 'Admin',
      username: 'admin',
      email: 'admin@admin.com',
      password: hashedPassword,
      roles: [roles[0]],
    }))
  }

  const editor = await usersRepo.findOne({ where: { email: 'editor@example.com' } })
  if (!editor) {
    await usersRepo.save(usersRepo.create({
      firstName: 'John',
      lastName: 'Editor',
      username: 'editor',
      email: 'editor@example.com',
      password: hashedPassword,
      roles: [roles[3]],
    }))
  }

  const viewer = await usersRepo.findOne({ where: { email: 'viewer@example.com' } })
  if (!viewer) {
    await usersRepo.save(usersRepo.create({
      firstName: 'Jane',
      lastName: 'Viewer',
      username: 'viewer',
      email: 'viewer@example.com',
      password: hashedPassword,
      roles: [roles[4]],
    }))
  }

  const manager = await usersRepo.findOne({ where: { email: 'manager@example.com' } })
  if (!manager) {
    await usersRepo.save(usersRepo.create({
      firstName: 'Bob',
      lastName: 'Manager',
      username: 'manager',
      email: 'manager@example.com',
      password: hashedPassword,
      roles: [roles[5]],
    }))
  }

  const guest = await usersRepo.findOne({ where: { email: 'guest@example.com' } })
  if (!guest) {
    await usersRepo.save(usersRepo.create({
      firstName: 'Alice',
      lastName: 'Guest',
      username: 'guest',
      email: 'guest@example.com',
      password: hashedPassword,
      roles: [roles[6]],
    }))
  }
}

async function seedSettings(settingsRepo: any) {
  const defaultSettings = [
    { key: 'app_name', value: 'MyApp' },
    { key: 'app_favicon', value: '/favicon.svg' },
    { key: 'login_bg_gradient', value: '#1e40af,#3b82f6,#6366f1' },
    { key: 'app_description', value: 'Sistem manajemen bisnis digital' },
  ]

  for (const { key, value } of defaultSettings) {
    const exists = await settingsRepo.findOne({ where: { key } })
    if (!exists) {
      await settingsRepo.save(settingsRepo.create({ key, value }))
    }
  }
}
