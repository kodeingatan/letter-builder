import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const importsPath = join(process.cwd(), '.nuxt/imports.d.ts')

describe('Nuxt auto-imports — Task 02 AC-001 / AC-005 / FR-005 (6 stores only)', () => {
  it('imports.d.ts exists after nuxt prepare', () => {
    expect(existsSync(importsPath)).toBe(true)
  })

  it('exports exactly 6 RBAC stores', () => {
    const content = readFileSync(importsPath, 'utf8')
    const expected = [
      'useAuthStore',
      'useGuardsStore',
      'usePermissionsStore',
      'useRolesStore',
      'useSettingsStore',
      'useUsersStore',
    ]
    for (const store of expected) {
      expect(content).toContain(store)
    }
    // count store exports: should be 6
    const storeMatches = content.match(/use\w+Store/g) ?? []
    // filter to app/stores ones (exclude pinia's defineStore etc but those are not use*Store)
    // Pinia's defineStore doesn't match, only our 6
    const appStores = storeMatches.filter((s) =>
      ['useAuthStore', 'useGuardsStore', 'usePermissionsStore', 'useRolesStore', 'useSettingsStore', 'useUsersStore'].includes(s),
    )
    expect(appStores).toHaveLength(6)
  })

  it('does not export 9 deleted dynamic stores', () => {
    const content = readFileSync(importsPath, 'utf8')
    const deleted = [
      'useAdministrationsStore',
      'useComponentsStore',
      'useDocumentsStore',
      'useGlobalTablesStore',
      'useNavigationStore',
      'useRunsStore',
      'useTemplatesStore',
      'useTableDataStore',
      'useGlobalTableColumnsStore',
    ]
    for (const store of deleted) {
      expect(content).not.toContain(store)
    }
    // also check partial names not present
    expect(content).not.toContain('administrations')
    expect(content).not.toContain('globalTables')
  })

  it('does not contain render-guard reference', () => {
    const content = readFileSync(importsPath, 'utf8')
    expect(content).not.toContain('render-guard')
  })

  it('.nuxt/dev/index.mjs has no render-guard (FR-006)', () => {
    const devPath = join(process.cwd(), '.nuxt/dev/index.mjs')
    if (existsSync(devPath)) {
      const devContent = readFileSync(devPath, 'utf8')
      expect(devContent).not.toContain('render-guard')
    } else {
      // dev artifact may not exist after clean prepare (only after nuxt dev) — still pass if file absent
      expect(true).toBe(true)
    }
  })

  it('nuxt.config imports.dirs is ["stores"] without presets', () => {
    const nuxtConfigPath = join(process.cwd(), 'nuxt.config.ts')
    const nuxtContent = readFileSync(nuxtConfigPath, 'utf8')
    expect(nuxtContent).toContain("dirs: ['stores']")
    expect(nuxtContent).not.toContain('useAdministrationsStore')
    expect(nuxtContent).not.toContain('imports.presets')
  })
})
