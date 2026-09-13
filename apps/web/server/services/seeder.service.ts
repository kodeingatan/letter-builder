import { DataSource } from 'typeorm'
import { UserSchema } from '~~/server/entities/user.entity'
import { RoleSchema } from '~~/server/entities/role.entity'
import { PermissionSchema } from '~~/server/entities/permission.entity'
import { PermissionMethodSchema } from '~~/server/entities/permission-method.entity'
import { PermissionUrlSchema } from '~~/server/entities/permission-url.entity'
import { GuardSchema } from '~~/server/entities/guard.entity'
import { GuardUrlSchema } from '~~/server/entities/guard-url.entity'
import { SettingSchema } from '~~/server/entities/setting.entity'
import { MasterTableSchema } from '~~/server/entities/master-table.entity'
import { DocTemplateSchema } from '~~/server/entities/doc-template.entity'
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
  const mdPermissions = await seedMasterDataPermissions(permissionsRepo, permissionMethodsRepo, permissionUrlsRepo)
  const psPermissions = await seedPersuratanPermissions(permissionsRepo, permissionMethodsRepo, permissionUrlsRepo)
  const roles = await seedRoles(rolesRepo, guards, permissions)
  await backfillDocumentGrants(rolesRepo, [...permissions, ...mdPermissions, ...psPermissions])
  await seedSampleMasterTables(ds)
  await seedDemoPersuratan(ds)
  await seedUsers(usersRepo, roles)
  await seedSettings(settingsRepo)
}

/**
 * Task 22 (REQ-001): least-privilege catalog for all dynamic modules.
 * Additive only (BR-002 — permission names immutable once seeded):
 * creates missing permissions from the catalog, backfills missing
 * method/URL rows on existing ones, creates Designer/Operator roles when
 * absent, and attaches missing grants to Designer/Operator/Admin roles.
 * Safe to re-run (REQ-004 idempotent seed).
 */
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

  // Document Engine permissions (Task 05): least-privilege grants for
  // POST /api/documents/preview and POST /api/documents/pdf.
  let docPreview = await permissionsRepo.findOne({ where: { permissionName: 'Document Preview' } })
  if (!docPreview) {
    docPreview = permissionsRepo.create({ permissionName: 'Document Preview', description: 'Preview dokumen via Document Engine' })
    await permissionsRepo.save(docPreview)
    await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'POST', permission: docPreview }))
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/documents/preview', permission: docPreview }))
  }

  let docPdf = await permissionsRepo.findOne({ where: { permissionName: 'Document PDF' } })
  if (!docPdf) {
    docPdf = permissionsRepo.create({ permissionName: 'Document PDF', description: 'Generate PDF via Document Engine' })
    await permissionsRepo.save(docPdf)
    await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'POST', permission: docPdf }))
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/documents/pdf', permission: docPdf }))
  }

  return [fullAccess, readOnly, readWrite, userMgmt, roleMgmt, guardMgmt, permMgmt, dashRead, activityLogs, systemLogs, docPreview, docPdf]
}

async function seedMasterDataPermissions(permissionsRepo: any, permissionMethodsRepo: any, permissionUrlsRepo: any) {
  // Master Data permissions (Task 06): read for GET, write for mutations.
  let mdRead = await permissionsRepo.findOne({ where: { permissionName: 'Master Data Read' } })
  if (!mdRead) {
    mdRead = permissionsRepo.create({ permissionName: 'Master Data Read', description: 'Lihat Master Data' })
    await permissionsRepo.save(mdRead)
    await permissionMethodsRepo.save(permissionMethodsRepo.create({ method: 'GET', permission: mdRead }))
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/master-data/*', permission: mdRead }))
  }

  let mdWrite = await permissionsRepo.findOne({ where: { permissionName: 'Master Data Write' } })
  if (!mdWrite) {
    mdWrite = permissionsRepo.create({ permissionName: 'Master Data Write', description: 'Kelola Master Data' })
    await permissionsRepo.save(mdWrite)
    await permissionMethodsRepo.save([
      permissionMethodsRepo.create({ method: 'GET', permission: mdWrite }),
      permissionMethodsRepo.create({ method: 'POST', permission: mdWrite }),
      permissionMethodsRepo.create({ method: 'PUT', permission: mdWrite }),
      permissionMethodsRepo.create({ method: 'DELETE', permission: mdWrite }),
    ])
    await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: '/api/master-data/*', permission: mdWrite }))
  }

  return [mdRead, mdWrite]
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

/**
 * Task 05+06: grant Document + Master Data permissions to Super Admin
 * (idempotent backfill — existing databases get the grants on next boot).
 */
async function backfillDocumentGrants(rolesRepo: any, permissions: any[]) {
  const docGrants = permissions.filter((p) =>
    p?.permissionName === 'Document Preview' || p?.permissionName === 'Document PDF' ||
    p?.permissionName === 'Master Data Read' || p?.permissionName === 'Master Data Write' ||
    p?.permissionName === 'Component Read' || p?.permissionName === 'Component Write' ||
    p?.permissionName === 'Template Read' || p?.permissionName === 'Template Write' ||
    p?.permissionName === 'Administration Read' || p?.permissionName === 'Administration Write' ||
    p?.permissionName === 'Document Read' || p?.permissionName === 'Document Write',
  )
  if (docGrants.length === 0) return
  const superAdmin = await rolesRepo.findOne({ where: { roleName: 'Super Admin' }, relations: { permissions: true } })
  if (!superAdmin) return
  const existing = new Set((superAdmin.permissions ?? []).map((p: any) => p.permissionName))
  const missing = docGrants.filter((p: any) => !existing.has(p.permissionName))
  if (missing.length > 0) {
    superAdmin.permissions = [...(superAdmin.permissions ?? []), ...missing]
    await rolesRepo.save(superAdmin)
  }
}

async function seedSettings(settingsRepo: any) {
  const defaultSettings = [
    { key: 'app_name', value: 'MyApp' },
    { key: 'app_favicon', value: '/favicon.svg' },
    { key: 'login_bg_gradient', value: '#0075de,#005bab,#213183' },
    { key: 'app_description', value: 'Sistem manajemen bisnis digital' },
  ]

  for (const { key, value } of defaultSettings) {
    const exists = await settingsRepo.findOne({ where: { key } })
    if (!exists) {
      await settingsRepo.save(settingsRepo.create({ key, value }))
    }
  }
}

/**
 * Task 06: seed example Master Data (Jabatan + Pegawai) when no tables exist.
 * Imported lazily so RBAC-only unit tests never boot the DDL path.
 */
async function seedSampleMasterTables(ds: DataSource) {

  const { MasterDataService } = await import('./master-data.service')
  const tablesRepo = ds.getRepository(MasterTableSchema)
  if (await tablesRepo.count() > 0) return

  await MasterDataService.createTable({
    name: 'jabatan',
    display_name: 'Jabatan',
    description: 'Contoh Master Data jabatan',
    columns: [
      { name: 'nama', display_name: 'Nama Jabatan', type: 'text', is_required: true, is_searchable: true, is_orderable: true },
      { name: 'eselon', display_name: 'Eselon', type: 'select', config: { options: ['I', 'II', 'III', 'IV', 'Non-Eselon'] } },
    ],
  })
  await MasterDataService.createTable({
    name: 'pegawai',
    display_name: 'Pegawai',
    description: 'Contoh Master Data pegawai',
    columns: [
      { name: 'nama', display_name: 'Nama', type: 'text', is_required: true, is_searchable: true, is_orderable: true },
      { name: 'nip', display_name: 'NIP', type: 'text', is_searchable: true },
      { name: 'tanggal_lahir', display_name: 'Tanggal Lahir', type: 'date', config: { format: 'm-d-Y' } },
      { name: 'gaji', display_name: 'Gaji', type: 'number', config: { currency: true }, is_orderable: true },
      { name: 'jabatan_id', display_name: 'Jabatan', type: 'relation_single', config: { target_slug: 'jabatan', display_column: 'nama' } },
      { name: 'total_info', display_name: 'Info Total', type: 'readonly_operation_text', config: { expression: '"Gaji: "++gaji' } },
    ],
  })
}

async function seedPersuratanPermissions(permissionsRepo: any, permissionMethodsRepo: any, permissionUrlsRepo: any) {
  // Task 07 least-privilege grants (additive, idempotent).
  const defs = [
    { name: 'Component Read', methods: ['GET'], url: '/api/doc-components/*' },
    { name: 'Component Write', methods: ['GET', 'POST', 'PUT', 'DELETE'], url: '/api/doc-components/*' },
    { name: 'Template Read', methods: ['GET'], url: '/api/doc-templates/*' },
    { name: 'Template Write', methods: ['GET', 'POST', 'PUT', 'DELETE'], url: '/api/doc-templates/*' },
    { name: 'Administration Read', methods: ['GET'], url: '/api/administrations/*' },
    { name: 'Administration Write', methods: ['GET', 'POST', 'PUT', 'DELETE'], url: '/api/administrations/*' },
    { name: 'Document Read', methods: ['GET'], url: '/api/documents/*' },
    { name: 'Document Write', methods: ['GET', 'POST', 'PUT', 'DELETE'], url: '/api/documents/*' },
  ]
  const created: any[] = []
  for (const def of defs) {
    let permission = await permissionsRepo.findOne({ where: { permissionName: def.name } })
    if (!permission) {
      permission = permissionsRepo.create({ permissionName: def.name, description: `Task 07 — ${def.name}` })
      await permissionsRepo.save(permission)
      await permissionMethodsRepo.save(def.methods.map((method) => permissionMethodsRepo.create({ method, permission })))
      await permissionUrlsRepo.save(permissionUrlsRepo.create({ url: def.url, permission }))
    }
    created.push(permission)
  }
  return created
}

/**
 * Task 07 demo content (Kop + Daftar Pegawai + SK template + demo
 * administration) — created only when no templates exist.
 */
async function seedDemoPersuratan(ds: DataSource) {
  const { DocComponentsService } = await import('./doc-components.service')
  const { DocTemplatesService } = await import('./doc-templates.service')
  const { AdministrationsService } = await import('./administrations.service')
  const templateRepo = ds.getRepository(DocTemplateSchema)
  if (await templateRepo.count() > 0) return

  await DocComponentsService.create({
    name: 'Kop Surat',
    tiptap_json: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'PEMERINTAH KOTA CONTOH' }] },
        {
          type: 'paragraph',
          content: [{ type: 'docBinding', attrs: { name: 'kantor', target: 'office.app_name', view: 'text' } }],
        },
      ],
    },
  })
  await DocComponentsService.create({
    name: 'Daftar Pegawai',
    is_looping: true,
    tiptap_json: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'docBinding', attrs: { name: 'nama', target: 'item.nama', view: 'text' } },
            { type: 'text', text: ' / ' },
            { type: 'docBinding', attrs: { name: 'nip', target: 'item.nip', view: 'text' } },
          ],
        },
      ],
    },
  })
  const template = await DocTemplatesService.create({
    name: 'SK Contoh',
    code: 'sk-contoh',
    description: 'Template SK demo (Kop + repeater pegawai + tanda tangan)',
    schema_json: {
      type: 'document',
      children: [
        { type: 'component-ref', props: { componentId: 'Kop Surat', propsOverride: {} } },
        { type: 'heading', props: { content: 'SURAT KEPUTUSAN {{letter.number}}', level: 1 } },
        {
          type: 'repeater',
          props: { source: 'employees', item: 'item' },
          children: [{ type: 'component-ref', props: { componentId: 'Daftar Pegawai', propsOverride: {} } }],
        },
        { type: 'signature', props: { name: '{{signer.name}}', title: 'Kepala Dinas', city: 'Banda Aceh' } },
      ],
    },
  } as never)
  const templateId = (template as unknown as { id: number }).id
  await AdministrationsService.create({
    name: 'SK Pengangkatan Demo',
    slug: 'sk-pengangkatan-demo',
    description: 'Administrasi demo 1 step',
    steps: [{
      template_id: templateId,
      step_order: 0,
      mapping: {
        employees: { kind: 'master-list', ref: 'pegawai' },
        'letter.number': { kind: 'value', ref: '800/001/2026' },
        'office.app_name': { kind: 'system', ref: 'office.app_name' },
        'signer.name': { kind: 'value', ref: 'H. Contoh' },
      },
    }],
  })
}
