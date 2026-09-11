import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('GlobalTable UX — Column form v-if + groups (AC-001, GAP-06..11)', () => {
  const p = join(process.cwd(), 'app/components/features/global-tables/GlobalTableColumnFormModal.vue')
  const c = readFileSync(p, 'utf8')

  it('optionRules computed exists and no bug assignment', () => {
    expect(c).toContain('const optionRules = computed')
    expect(c).not.toContain('optionRules.value = {}')
    expect(c).toContain('value opsi harus unik')
  })

  it('uses NRadioGroup + NCheckboxGroup correctly', () => {
    expect(c).toContain('NRadioGroup')
    expect(c).toContain('NCheckboxGroup')
    expect(c).toContain('relationDisplayColumns')
    expect(c).not.toContain('<NRadio :options=')
    expect(c).not.toContain('<NCheckbox :value="relationDisplayColumns.includes')
  })

  it('uses NInputNumber for position and v-if per type', () => {
    expect(c).toContain('NInputNumber')
    expect(c).toContain('v-model:value="form.position"')
    expect(c).toContain('v-if="isRelationalType(form.type)"')
    expect(c).toContain('v-if="form.type === \'select\'"')
    expect(c).not.toContain('v-show')
  })

  it('token #666 → #94a3b8 and chip Uji ekspresi', () => {
    expect(c).not.toContain('#666')
    expect(c).toContain('#94a3b8')
    expect(c).toContain('Uji ekspresi')
    expect(c).toContain('expressionDeps')
    expect(c).toContain('NTag')
    expect(c).toContain('NAlert')
  })

  it('modal width min(640px,90vw) and preset card', () => {
    expect(c).toContain('min(640px, 90vw)')
    expect(c).toContain('preset="card"')
    expect(c).toContain('max-w-2xl')
  })
})
