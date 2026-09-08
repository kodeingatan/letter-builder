/**
 * Least-privilege permission catalog + default role mapping (Task 22, REQ-001).
 *
 * The RBAC foundation (tasks 01–06) knows nothing of the 15 dynamic modules
 * (tasks 07–21). This module is the single source of truth for:
 * - every named permission covering the new endpoints (BR-002: names are
 *   immutable once seeded — new permissions only via additive seeding),
 * - the Designer / Operator / Admin default grants,
 * - the audit-coverage entity list (REQ-002).
 *
 * Pure and dependency-free so the matrix can be unit-tested (AC-001)
 * without a database.
 */

export interface PermissionCatalogEntry {
  permissionName: string
  description: string
  methods: string[]
  urls: string[]
}

export const PERMISSION_CATALOG: PermissionCatalogEntry[] = [
  {
    permissionName: 'Global Table Management',
    description: 'Manage Global Table metadata (CRUD)',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    urls: ['/api/global-tables/*'],
  },
  {
    permissionName: 'Table Data Read',
    description: 'Read rows of generated tables (+ lookup provider)',
    methods: ['GET'],
    urls: ['/api/data/*', '/api/global-tables/*/rows/*', '/api/navigation'],
  },
  {
    permissionName: 'Table Data Write',
    description: 'Write rows of generated tables (CRUD + import/export)',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    urls: ['/api/data/*'],
  },
  {
    permissionName: 'Component Management',
    description: 'Manage reusable document components (CRUD, publish, preview)',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    urls: ['/api/components/*'],
  },
  {
    permissionName: 'Template Management',
    description: 'Manage document templates (CRUD, publish, rollback, bindings)',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    urls: ['/api/templates/*'],
  },
  {
    permissionName: 'Administration Management',
    description: 'Manage administration workflows (CRUD, steps, publish, archive)',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    urls: ['/api/administrations/*'],
  },
  {
    permissionName: 'Administration Run',
    description: 'Run published administrations (start, save steps, complete own runs)',
    methods: ['GET', 'POST', 'PATCH'],
    urls: ['/api/runs/*', '/api/administrations/*/runs'],
  },
  {
    permissionName: 'Document Management',
    description: 'Browse issued documents (read, preview, download)',
    methods: ['GET'],
    urls: ['/api/documents/*'],
  },
  {
    permissionName: 'Document Reissue',
    description: 'Reissue and purge issued documents (admin-gated, BR-005)',
    methods: ['POST', 'DELETE'],
    urls: ['/api/documents/*'],
  },
  {
    permissionName: 'Expression Use',
    description: 'Validate and evaluate unified-data-language expressions',
    methods: ['POST'],
    urls: ['/api/expressions/*'],
  },
  {
    permissionName: 'Rendering Preview',
    description: 'Preview rendered documents (shared rendering engine)',
    methods: ['POST'],
    urls: ['/api/render/*'],
  },
  {
    permissionName: 'Navigation Read',
    description: 'Read generated menu projection (Data/Persuratan)',
    methods: ['GET'],
    urls: ['/api/navigation'],
  },
]

export type DefaultRoleName = 'Designer' | 'Operator' | 'Admin'

/**
 * Least-privilege defaults (REQ-001):
 * - Designer: define tables/columns/components/templates/administrations +
 *   run + read docs + use expressions/render preview.
 * - Operator: run + rows write + read docs (own-scoped at service layer) +
 *   read-only metadata for tables/columns (to resolve pickers).
 * - Admin: everything + reissue/purge + settings (settings stay covered by
 *   the pre-existing Read Write grant on /*).
 *
 * BR-001: new users get Operator-equivalent or nothing (never
 * Designer/Admin) unless explicitly granted — enforced by only assigning
 * the Operator role by default at registration/admin UI level.
 */
export const ROLE_MATRIX: Record<DefaultRoleName, string[]> = {
  Designer: [
    'Global Table Management',
    'Table Data Read',
    'Table Data Write',
    'Component Management',
    'Template Management',
    'Administration Management',
    'Administration Run',
    'Document Management',
    'Expression Use',
    'Rendering Preview',
    'Navigation Read',
  ],
  Operator: [
    'Table Data Read',
    'Table Data Write',
    'Administration Run',
    'Document Management',
    'Expression Use',
    'Navigation Read',
  ],
  Admin: [
    'Global Table Management',
    'Table Data Read',
    'Table Data Write',
    'Component Management',
    'Template Management',
    'Administration Management',
    'Administration Run',
    'Document Management',
    'Document Reissue',
    'Expression Use',
    'Rendering Preview',
    'Navigation Read',
  ],
}

/** Every mutation/lifecycle entity that must appear in activity logs (REQ-002). */
export const EXPECTED_AUDIT_ENTITIES = [
  'GlobalTable',
  'GlobalTableColumn',
  'Component',
  'Template',
  'TemplateBinding',
  'Administration',
  'AdministrationRun',
  'Document',
  'Render',
  'Expression',
] as const

export type AuditEntity = (typeof EXPECTED_AUDIT_ENTITIES)[number]

export function permissionCatalogNames(): string[] {
  return PERMISSION_CATALOG.map((p) => p.permissionName)
}

export function rolePermissions(role: DefaultRoleName): string[] {
  return [...(ROLE_MATRIX[role] ?? [])]
}

/** True when every permission assigned to the role exists in the catalog. */
export function matrixIsConsistent(): boolean {
  const names = new Set(permissionCatalogNames())
  return Object.values(ROLE_MATRIX).every((perms) => perms.every((p) => names.has(p)))
}
