import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = fileURLToPath(new URL('../../../app', import.meta.url))

function collectFiles(dir: string, exts: string[]): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) out.push(...collectFiles(full, exts))
    else if (exts.some((e) => full.endsWith(e))) out.push(full)
  }
  return out
}

describe('GlobalTable UX — token / GAP sweep (Task 29)', () => {
  it('GlobalTableColumnTab has no DragHandle and no purple tag, has Chevron/DataTable/NPopconfirm', () => {
    const p = join(appDir, 'components/features/global-tables/GlobalTableColumnTab.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).not.toContain('DragHandle')
    expect(c).not.toContain('purple')
    expect(c).not.toContain('cursor-move')
    expect(c).toContain('ChevronUp')
    expect(c).toContain('ChevronDown')
    expect(c).toContain('DataTable')
    expect(c).toContain('NPopconfirm')
    expect(c).toContain('View')
    expect(c).toContain('h(NIcon')
    expect(c).toContain('warning') // currency -> warning
  })

  it('GlobalTableColumnFormModal has no #666, no text-blue-500, no v-show, has NRadioGroup/NCheckboxGroup/NInputNumber/optionRules', () => {
    const p = join(appDir, 'components/features/global-tables/GlobalTableColumnFormModal.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).not.toContain('#666')
    expect(c).not.toContain('text-blue-500')
    expect(c).not.toMatch(/\bv-show\b/)
    expect(c).toContain('NCheckboxGroup')
    expect(c).toContain('NRadioGroup')
    expect(c).toContain('NInputNumber')
    expect(c).toContain('optionRules')
    expect(c).toContain('const optionRules = computed')
    expect(c).not.toContain('optionRules.value = {}')
    expect(c).toContain('#94a3b8')
    expect(c).toContain('min(640px, 90vw)')
  })

  it('RelationSelector has correct hasMore and NEmpty/NAlert+retry', () => {
    const p = join(appDir, 'components/features/global-tables/RelationSelector.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).not.toContain('offset.value + options.value.length < total.value')
    expect(c).toContain('options.value.length < total.value')
    expect(c).toContain('NEmpty')
    expect(c).toContain('NAlert')
    expect(c).toContain('Coba lagi')
    expect(c).toContain('Math.floor(options.value.length')
  })

  it('TableDataImportModal has no custom-request stub and no naive split, has quote-aware and responsive width', () => {
    const p = join(appDir, 'components/features/table-data/TableDataImportModal.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).not.toContain('custom-request')
    // naive parser was line.split(',') — now quote-aware uses inQuotes state, not naive split
    expect(c).toContain('inQuotes')
    expect(c).toContain('min(640px, 90vw)')
    expect(c).toContain('max-height="240"')
    expect(c).toContain('preset="card"')
    // ensure the import logic no longer uses naive .split(',').map for preview (allow documentation string contains split in comment but not as `line.split`)
    expect(c).not.toContain("line.split")
  })

  it('DynamicForm has NButton Upload ghost and no text-blue-500 span, has computed live + chips', () => {
    const p = join(appDir, 'components/features/table-data/DynamicForm.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).not.toContain('text-blue-500')
    expect(c).toContain('NButton')
    expect(c).toContain('Upload')
    // Upload button uses <NIcon><Upload /></NIcon> in template (not h() in script)
    expect(c).toContain('NIcon')
    expect(c).toContain('<Upload')
    expect(c).toContain('computedLive')
    expect(c).toContain('NTag')
    expect(c).toContain('Uji ekspresi')
    expect(c).toContain('200')
  })

  it('TableRowDetailDrawer has NPopconfirm delete and NAlert retry, no silent catch', () => {
    const p = join(appDir, 'components/features/table-data/TableRowDetailDrawer.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).toContain('NPopconfirm')
    expect(c).toContain('NAlert')
    expect(c).toContain('Coba lagi')
    expect(c).toContain('TrashCan')
    expect(c).toContain('NIcon')
    // old silent catch was `catch { row.value = null }` — should now set error
    expect(c).toContain('error.value')
  })

  it('no v-show left in global-tables form per GAP-GT-08', () => {
    const p = join(appDir, 'components/features/global-tables/GlobalTableColumnFormModal.vue')
    const c = readFileSync(p, 'utf8')
    const vShowCount = (c.match(/\bv-show\b/g) || []).length
    expect(vShowCount).toBe(0)
  })
})
