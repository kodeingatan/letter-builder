import { describe, it, expect } from 'vitest'
import {
  PERMISSION_CATALOG,
  ROLE_MATRIX,
  EXPECTED_AUDIT_ENTITIES,
  permissionCatalogNames,
  rolePermissions,
  matrixIsConsistent,
} from '../../../server/utils/permission-matrix'

describe('permission-matrix (Task 22, REQ-001 / AC-001)', () => {
  it('covers every module prefix from the task data model', () => {
    const urls = PERMISSION_CATALOG.flatMap((p) => p.urls)
    for (const prefix of [
      '/api/global-tables/*',
      '/api/data/*',
      '/api/components/*',
      '/api/templates/*',
      '/api/administrations/*',
      '/api/runs/*',
      '/api/documents/*',
      '/api/expressions/*',
      '/api/render/*',
      '/api/navigation',
    ]) {
      expect(urls, prefix).toContain(prefix)
    }
  })

  it('permission names are unique (BR-002 immutability premise)', () => {
    const names = permissionCatalogNames()
    expect(new Set(names).size).toBe(names.length)
  })

  it('matrix is consistent: every role grant exists in the catalog', () => {
    expect(matrixIsConsistent()).toBe(true)
  })

  it('Designer can define + run + read docs; Operator is strictly narrower', () => {
    const designer = new Set(rolePermissions('Designer'))
    const operator = new Set(rolePermissions('Operator'))
    for (const p of ['Global Table Management', 'Component Management', 'Template Management', 'Administration Management']) {
      expect(designer.has(p)).toBe(true)
      expect(operator.has(p)).toBe(false)
    }
    for (const p of ['Table Data Read', 'Table Data Write', 'Administration Run', 'Document Management']) {
      expect(operator.has(p)).toBe(true)
    }
    // Least privilege: Operator never holds Designer-only or admin grants.
    expect(operator.has('Document Reissue')).toBe(false)
  })

  it('Admin holds everything incl. reissue/purge (BR-005)', () => {
    const admin = new Set(rolePermissions('Admin'))
    for (const name of permissionCatalogNames()) {
      expect(admin.has(name), name).toBe(true)
    }
  })

  it('audit entity list covers all modules (REQ-002)', () => {
    for (const e of ['GlobalTable', 'Component', 'Template', 'Administration', 'AdministrationRun', 'Document', 'Expression', 'Render']) {
      expect(EXPECTED_AUDIT_ENTITIES, e).toContain(e)
    }
  })
})
