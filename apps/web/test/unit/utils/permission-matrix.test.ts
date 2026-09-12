import { describe, it, expect } from 'vitest'
import {
  PERMISSION_CATALOG,
  ROLE_MATRIX,
  EXPECTED_AUDIT_ENTITIES,
  permissionCatalogNames,
  rolePermissions,
  matrixIsConsistent,
} from '../../../server/utils/permission-matrix'

describe('permission-matrix (RBAC-Only after Task 01)', () => {
  it('catalog is empty after Dynamic Administration removal (Task 01)', () => {
    expect(PERMISSION_CATALOG).toEqual([])
  })

  it('permission names are unique', () => {
    const names = permissionCatalogNames()
    expect(new Set(names).size).toBe(names.length)
  })

  it('matrix is consistent: every role grant exists in the catalog', () => {
    expect(matrixIsConsistent()).toBe(true)
  })

  it('RBAC-only roles have no dynamic grants', () => {
    expect(rolePermissions('Designer')).toEqual([])
    expect(rolePermissions('Operator')).toEqual([])
    expect(rolePermissions('Admin')).toEqual([])
  })

  it('audit entity list covers RBAC entities', () => {
    for (const e of ['User', 'Role', 'Permission', 'Guard']) {
      expect(EXPECTED_AUDIT_ENTITIES, e).toContain(e)
    }
    // Ensure dynamic entities are gone
    for (const e of ['GlobalTable', 'Component', 'Template', 'Administration']) {
      expect(EXPECTED_AUDIT_ENTITIES).not.toContain(e)
    }
  })
})
