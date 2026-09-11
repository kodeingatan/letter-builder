import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('AccessDeniedAlert — FR-003 / AC-003 / BR-003 single pattern', () => {
  it('file contains data-testid and ID locale and 4000ms', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'components/common/AccessDeniedAlert.vue'), 'utf8')
    expect(content).toContain('data-testid="access-denied"')
    expect(content).toContain('Akses Ditolak')
    expect(content).toContain('Anda tidak memiliki izin')
    expect(content).toContain('4000')
    expect(content).toContain('aria-hidden="true"')
    expect(content).toContain('ClientOnly')
    expect(content).toContain('Teleport to="body"')
  })

  it('file uses access-denied animation 300ms and prefers-reduced-motion', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'components/common/AccessDeniedAlert.vue'), 'utf8')
    expect(content).toContain('access-denied-enter-active')
    expect(content).toContain('300ms')
    expect(content).toContain('prefers-reduced-motion')
  })

  it('useApi dispatches rbac-denied with ID message', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'composables/useApi.ts'), 'utf8')
    expect(content).toContain('rbac-denied')
    expect(content).toContain('Anda tidak memiliki izin')
  })
})
