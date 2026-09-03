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

  const userCount = await usersRepo.count()
  if (userCount > 0) return

  const guards = await seedGuards(guardsRepo, guardUrlsRepo)
  const permissions = await seedPermissions(permissionsRepo, permissionMethodsRepo, permissionUrlsRepo)
  const roles = await seedRoles(rolesRepo, guards, permissions)
  await seedUsers(usersRepo, roles)
  await seedSettings(settingsRepo)
}

async function seedGuards(guardsRepo: any, guardUrlsRepo: any) {
  const fullAccess = guardsRepo.create({ guardName: 'Full Access', description: 'Izinkan semua URL' })
  await guardsRepo.save(fullAccess)
  await guardUrlsRepo.save(guardUrlsRepo.create({ url: '/*', type: 'allow', guard: fullAccess }))

  const webAccess = guardsRepo.create({ guardName: 'Web Access', description: 'Hanya akses API, tolak admin routes' })
  await guardsRepo.save(webAccess)
  await guardUrlsRepo.save([
    guardUrlsRepo.create({ url: '/api/*', type: 'allow', guard: webAccess }),
    guardUrlsRepo.create({ url: '/api/admin/*', type: 'deny', guard: webAccess }),
  ])

  const apiOnly = guardsRepo.create({ guardName: 'API Only', description: 'Hanya akses API endpoints' })
  await guardsRepo.save(apiOnly)
  await guardUrlsRepo.save(guardUrlsRepo.create({ url: '/api/*', type: 'allow', guard: apiOnly }))

  const adminOnly = guardsRepo.create({ guardName: 'Admin Only', description: 'Hanya akses admin dan user management' })
  await guardsRepo.save(adminOnly)
  await guardUrlsRepo.save([
    guardUrlsRepo.create({ url: '/api/admin/*', type: 'allow', guard: adminOnly }),
    guardUrlsRepo.create({ url: '/api/users/*', type: 'allow', guard: adminOnly }),
    guardUrlsRepo.create({ url: '/api/roles/*', type: 'allow', guard: adminOnly }),
  ])

  const readOnlyGuard = guardsRepo.create({ guardName: 'Read Only Guard', description: 'Akses baca saja, tolak user dan role management' })
  await guardsRepo.save(readOnlyGuard)
  await guardUrlsRepo.save([
    guardUrlsRepo.create({ url: '/api/*', type: 'allow', guard: readOnlyGuard }),
    guardUrlsRepo.create({ url: '/api/users', type: 'deny', guard: readOnlyGuard }),
    guardUrlsRepo.create({ url: '/api/roles', type: 'deny', guard: readOnlyGuard }),
  ])

  const userMgmtGuard = guardsRepo.create({ guardName: 'User Management Guard', description: 'Hanya akses user management' })
  await guardsRepo.save(userMgmtGuard)
  await guardUrlsRepo.save(guardUrlsRepo.create({ url: '/api/users/*', type: 'allow', guard: userMgmtGuard }))

  const roleMgmtGuard = guardsRepo.create({ guardName: 'Role Management Guard', description: 'Hanya akses role management' })
  await guardsRepo.save(roleMgmtGuard)
  await guardUrlsRepo.save(guardUrlsRepo.create({ url: '/api/roles/*', type: 'allow', guard: roleMgmtGuard }))

  const dashboardOnly = guardsRepo.create({ guardName: 'Dashboard Only', description: 'Hanya akses profile, tolak semua management' })
  await guardsRepo.save(dashboardOnly)
  await guardUrlsRepo.save([
    guardUrlsRepo.create({ url: '/api/auth/profile', type: 'allow', guard: dashboardOnly }),
    guardUrlsRepo.create({ url: '/api/users/*', type: 'deny', guard: dashboardOnly }),
    guardUrlsRepo.create({ url: '/api/roles/*', type: 'deny', guard: dashboardOnly }),
    guardUrlsRepo.create({ url: '/api/permissions/*', type: 'deny', guard: dashboardOnly }),
    guardUrlsRepo.create({ url: '/api/guards/*', type: 'deny', guard: dashboardOnly }),
  ])

  return [fullAccess, webAccess, apiOnly, adminOnly, readOnlyGuard, userMgmtGuard, roleMgmtGuard, dashboardOnly]
}

async function seedPermissions(permissionsRepo: any, permissionMethodsRepo: any, permissionUrlsRepo: any) {
  const fullAccess = permissionsRepo.create({ permissionName: 'Full Access', description: 'Izinkan semua method dan URL' })
  await permissionsRepo.save(fullAccess)
  await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: '*', permission: fullAccess }))
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/*', permission: fullAccess }))

  const readOnly = permissionsRepo.create({ permissionName: 'Read Only', description: 'Hanya izinkan GET dan OPTIONS' })
  await permissionsRepo.save(readOnly)
  await permissionMethodsRepo.save([
    permissionMethodsRepo.create({ method: 'GET', permission: readOnly }),
    permissionMethodsRepo.create({ method: 'OPTIONS', permission: readOnly }),
  ])
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/*', permission: readOnly }))

  const readWrite = permissionsRepo.create({ permissionName: 'Read Write', description: 'Izinkan semua method CRUD' })
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

  const userMgmt = permissionsRepo.create({ permissionName: 'User Management', description: 'Izinkan CRUD user' })
  await permissionsRepo.save(userMgmt)
  await permissionMethodsRepo.save([
    permissionMethodsRepo.create({ method: 'GET', permission: userMgmt }),
    permissionMethodsRepo.create({ method: 'POST', permission: userMgmt }),
    permissionMethodsRepo.create({ method: 'PUT', permission: userMgmt }),
    permissionMethodsRepo.create({ method: 'DELETE', permission: userMgmt }),
  ])
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/users/*', permission: userMgmt }))

  const roleMgmt = permissionsRepo.create({ permissionName: 'Role Management', description: 'Izinkan CRUD role' })
  await permissionsRepo.save(roleMgmt)
  await permissionMethodsRepo.save([
    permissionMethodsRepo.create({ method: 'GET', permission: roleMgmt }),
    permissionMethodsRepo.create({ method: 'POST', permission: roleMgmt }),
    permissionMethodsRepo.create({ method: 'PUT', permission: roleMgmt }),
    permissionMethodsRepo.create({ method: 'DELETE', permission: roleMgmt }),
  ])
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/roles/*', permission: roleMgmt }))

  const guardMgmt = permissionsRepo.create({ permissionName: 'Guard Management', description: 'Izinkan CRUD guard' })
  await permissionsRepo.save(guardMgmt)
  await permissionMethodsRepo.save([
    permissionMethodsRepo.create({ method: 'GET', permission: guardMgmt }),
    permissionMethodsRepo.create({ method: 'POST', permission: guardMgmt }),
    permissionMethodsRepo.create({ method: 'PUT', permission: guardMgmt }),
    permissionMethodsRepo.create({ method: 'DELETE', permission: guardMgmt }),
  ])
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/guards/*', permission: guardMgmt }))

  const permMgmt = permissionsRepo.create({ permissionName: 'Permission Management', description: 'Izinkan CRUD permission' })
  await permissionsRepo.save(permMgmt)
  await permissionMethodsRepo.save([
    permissionMethodsRepo.create({ method: 'GET', permission: permMgmt }),
    permissionMethodsRepo.create({ method: 'POST', permission: permMgmt }),
    permissionMethodsRepo.create({ method: 'PUT', permission: permMgmt }),
    permissionMethodsRepo.create({ method: 'DELETE', permission: permMgmt }),
  ])
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/permissions/*', permission: permMgmt }))

  const dashRead = permissionsRepo.create({ permissionName: 'Dashboard Read', description: 'Hanya baca profile' })
  await permissionsRepo.save(dashRead)
  await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'GET', permission: dashRead }))
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/auth/profile', permission: dashRead }))

  const activityLogs = permissionsRepo.create({ permissionName: 'Activity Logs', description: 'Akses melihat activity logs' })
  await permissionsRepo.save(activityLogs)
  await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'GET', permission: activityLogs }))
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/activity-logs/*', permission: activityLogs }))

  const systemLogs = permissionsRepo.create({ permissionName: 'System Logs', description: 'Akses melihat system logs' })
  await permissionsRepo.save(systemLogs)
  await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'GET', permission: systemLogs }))
  await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/system-logs/*', permission: systemLogs }))

  return [fullAccess, readOnly, readWrite, userMgmt, roleMgmt, guardMgmt, permMgmt, dashRead, activityLogs, systemLogs]
}

async function seedRoles(rolesRepo: any, guards: any[], permissions: any[]) {
  const superAdmin = rolesRepo.create({
    roleName: 'Super Admin',
    description: 'Akses penuh ke semua fitur',
    guards: [guards[0]],
    permissions: [permissions[0], permissions[8], permissions[9]],
  })
  await rolesRepo.save(superAdmin)

  const admin = rolesRepo.create({
    roleName: 'Admin',
    description: 'Akses admin terbatas',
    guards: [guards[1]],
    permissions: [permissions[2]],
  })
  await rolesRepo.save(admin)

  const user = rolesRepo.create({
    roleName: 'User',
    description: 'Akses dasar untuk user biasa',
    guards: [guards[2]],
    permissions: [permissions[1]],
  })
  await rolesRepo.save(user)

  const editor = rolesRepo.create({
    roleName: 'Editor',
    description: 'Akses edit user dan content',
    guards: [guards[2]],
    permissions: [permissions[2], permissions[3]],
  })
  await rolesRepo.save(editor)

  const viewer = rolesRepo.create({
    roleName: 'Viewer',
    description: 'Hanya melihat data',
    guards: [guards[4]],
    permissions: [permissions[1], permissions[7]],
  })
  await rolesRepo.save(viewer)

  const manager = rolesRepo.create({
    roleName: 'Manager',
    description: 'Akses management user dan role',
    guards: [guards[1], guards[5]],
    permissions: [permissions[2], permissions[3], permissions[4]],
  })
  await rolesRepo.save(manager)

  const guest = rolesRepo.create({
    roleName: 'Guest',
    description: 'Akses terbatas hanya dashboard',
    guards: [guards[7]],
    permissions: [permissions[7]],
  })
  await rolesRepo.save(guest)

  return [superAdmin, admin, user, editor, viewer, manager, guest]
}

async function seedUsers(usersRepo: any, roles: any[]) {
  const hashedPassword = await hashPassword('P455w0rd!!!')

  const admin = usersRepo.create({
    firstName: 'Super',
    lastName: 'Admin',
    username: 'admin',
    email: 'admin@admin.com',
    password: hashedPassword,
    roles: [roles[0]],
  })
  await usersRepo.save(admin)

  const editor = usersRepo.create({
    firstName: 'John',
    lastName: 'Editor',
    username: 'editor',
    email: 'editor@example.com',
    password: hashedPassword,
    roles: [roles[3]],
  })
  await usersRepo.save(editor)

  const viewer = usersRepo.create({
    firstName: 'Jane',
    lastName: 'Viewer',
    username: 'viewer',
    email: 'viewer@example.com',
    password: hashedPassword,
    roles: [roles[4]],
  })
  await usersRepo.save(viewer)

  const manager = usersRepo.create({
    firstName: 'Bob',
    lastName: 'Manager',
    username: 'manager',
    email: 'manager@example.com',
    password: hashedPassword,
    roles: [roles[5]],
  })
  await usersRepo.save(manager)

  const guest = usersRepo.create({
    firstName: 'Alice',
    lastName: 'Guest',
    username: 'guest',
    email: 'guest@example.com',
    password: hashedPassword,
    roles: [roles[6]],
  })
  await usersRepo.save(guest)
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
