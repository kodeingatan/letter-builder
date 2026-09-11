import { describe, it, expect } from 'vitest'

/**
 * Pure replica of default.vue:resolveActiveKey — kept in sync with layout.
 * If this diverges, the sidebar highlight will break for dynamic routes.
 */
function resolveActiveKey(path: string): string {
  const routeKeyMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/dashboard/data/global-tables': 'global-tables',
    '/dashboard/docs/components': 'components',
    '/dashboard/docs/templates': 'templates',
    '/dashboard/docs/administrations': 'administrations',
    '/dashboard/docs/runs': 'runs',
    '/dashboard/docs/documents': 'documents',
    '/dashboard/users': 'users',
    '/dashboard/guards': 'guards',
    '/dashboard/roles': 'roles',
    '/dashboard/permissions': 'permissions',
    '/dashboard/activity-logs': 'activity-logs',
    '/dashboard/system-logs': 'system-logs',
    '/dashboard/settings': 'settings',
  }
  if (routeKeyMap[path]) return routeKeyMap[path]
  const dataMatch = path.match(/^\/dashboard\/data\/([^/]+)$/)
  if (dataMatch) return `data-table-${dataMatch[1]}`
  const runMatch = path.match(/^\/dashboard\/docs\/run\/(\d+)$/)
  if (runMatch) return `persuratan-${runMatch[1]}`
  if (path.startsWith('/dashboard/docs/runs/')) return 'runs'
  if (path.match(/^\/dashboard\/docs\/templates\/\d+$/)) return 'templates'
  if (path.match(/^\/dashboard\/docs\/administrations\/\d+$/)) return 'administrations'
  if (path.match(/^\/dashboard\/docs\/documents\/\d+$/)) return 'documents'
  if (path.startsWith('/dashboard/data/')) {
    const seg = path.split('/')[3]
    if (seg) return `data-table-${seg}`
  }
  return 'dashboard'
}

describe('resolveActiveKey — FR-004 / AC-004 sidebar highlight', () => {
  it('maps static routes via map', () => {
    expect(resolveActiveKey('/dashboard')).toBe('dashboard')
    expect(resolveActiveKey('/dashboard/data/global-tables')).toBe('global-tables')
    expect(resolveActiveKey('/dashboard/docs/components')).toBe('components')
    expect(resolveActiveKey('/dashboard/users')).toBe('users')
  })

  it('maps generated Data entries per-table (Step 4)', () => {
    expect(resolveActiveKey('/dashboard/data/pegawai')).toBe('data-table-pegawai')
    expect(resolveActiveKey('/dashboard/data/unit_kerja')).toBe('data-table-unit_kerja')
  })

  it('maps persuratan run starter (per-administration)', () => {
    expect(resolveActiveKey('/dashboard/docs/run/7')).toBe('persuratan-7')
    expect(resolveActiveKey('/dashboard/docs/run/123')).toBe('persuratan-123')
  })

  it('maps dynamic detail routes to parent group', () => {
    expect(resolveActiveKey('/dashboard/docs/templates/5')).toBe('templates')
    expect(resolveActiveKey('/dashboard/docs/administrations/9')).toBe('administrations')
    expect(resolveActiveKey('/dashboard/docs/documents/42')).toBe('documents')
    expect(resolveActiveKey('/dashboard/docs/runs/99')).toBe('runs')
  })

  it('falls back to dashboard for unknown paths', () => {
    expect(resolveActiveKey('/dashboard/unknown')).toBe('dashboard')
    expect(resolveActiveKey('/')).toBe('dashboard')
  })
})
