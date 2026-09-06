import { describe, it, expect } from 'vitest'
import {
  validateSnapshot,
  sanitizeDocumentHtml,
  driftInfo,
  driftLabel,
  buildPdfFilename,
  slugifyAdminName,
  safeStorageFilename,
  summarizeSnapshot,
  parseSnapshot,
} from '../../../server/utils/document-helpers'

function fullSnapshot() {
  return {
    runInput: { fields: { tujuan: 'Jakarta' } },
    templateContent: JSON.stringify({ nodes: [] }),
    componentSnapshots: [{ componentId: 1, version: 2 }],
    bindings: [{ placementId: 'n1', requirementName: 'nama' }],
    resolvedPins: [{ stepId: 1, templateId: 3, version: '2' }],
    systemContext: { administrationId: 1, stepName: 'Data' },
  }
}

describe('validateSnapshot (BR-001)', () => {
  it('accepts a complete snapshot', () => {
    const check = validateSnapshot(fullSnapshot())
    expect(check.valid).toBe(true)
    expect(check.missing).toEqual([])
  })

  it('rejects snapshots missing frozen template content + bindings', () => {
    const { templateContent, bindings, ...rest } = fullSnapshot()
    const check = validateSnapshot(rest)
    expect(check.valid).toBe(false)
    expect(check.missing).toContain('templateContent')
    expect(check.missing).toContain('bindings')
  })

  it('rejects blank template content', () => {
    const check = validateSnapshot({ ...fullSnapshot(), templateContent: '   ' })
    expect(check.valid).toBe(false)
    expect(check.missing).toContain('templateContent')
  })

  it('rejects non-object snapshots', () => {
    for (const bad of [null, undefined, 'json', 42, []]) {
      expect(validateSnapshot(bad).valid).toBe(false)
    }
  })
})

describe('sanitizeDocumentHtml (AC-005)', () => {
  it('strips scripts but keeps safe markup', () => {
    const out = sanitizeDocumentHtml('<p>Hello</p><script>alert(1)</script>')
    expect(out).toContain('<p>Hello</p>')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('alert(1)')
  })

  it('strips event handlers and javascript: urls', () => {
    const out = sanitizeDocumentHtml('<p onclick="evil()">x</p><a href="javascript:evil()">y</a>')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('javascript:')
  })

  it('passes null through', () => {
    expect(sanitizeDocumentHtml(null)).toBeNull()
  })
})

describe('driftInfo / driftLabel (BR-002)', () => {
  it('flags drift when live version moved on', () => {
    const info = driftInfo(3, 5)
    expect(info).toEqual({ pinned: 3, current: 5, drifted: true })
    expect(driftLabel(info)).toBe('template v3 (current v5)')
  })

  it('reports clean when versions match', () => {
    const info = driftInfo(2, 2)
    expect(info.drifted).toBe(false)
    expect(driftLabel(info)).toBe('template v2')
  })

  it('handles removed source templates', () => {
    const info = driftInfo(1, null)
    expect(info.drifted).toBe(false)
    expect(driftLabel(info)).toContain('source removed')
  })
})

describe('buildPdfFilename (BR-003)', () => {
  it('follows {admin-slug}_{doc-id}_{YYYYMMDD-HHmm}.pdf', () => {
    const at = new Date(2026, 8, 6, 9, 5)
    expect(buildPdfFilename('Surat Tugas', 42, at)).toBe('surat-tugas_42_20260906-0905.pdf')
  })

  it('slugifies names and falls back for blanks', () => {
    expect(slugifyAdminName('SK  Dinas #1!')).toBe('sk-dinas-1')
    expect(slugifyAdminName('')).toBe('administration')
    expect(buildPdfFilename(null, 7, new Date(2026, 0, 2, 3, 4))).toBe('administration_7_20260102-0304.pdf')
  })
})

describe('safeStorageFilename', () => {
  it('strips directory traversal segments', () => {
    expect(safeStorageFilename('../../etc/passwd')).toBe('passwd')
    expect(safeStorageFilename('a/b/c.pdf')).toBe('c.pdf')
    expect(safeStorageFilename('doc.pdf')).toBe('doc.pdf')
  })
})

describe('summarizeSnapshot / parseSnapshot', () => {
  it('summarizes counts for audit without re-querying live tables', () => {
    const summary = summarizeSnapshot(fullSnapshot())
    expect(summary).toEqual({
      hasTemplateContent: true,
      componentCount: 1,
      bindingCount: 1,
      stepName: 'Data',
      administrationVersion: null,
    })
  })

  it('reads step context when present', () => {
    const snap: any = fullSnapshot()
    snap.systemContext = { stepName: 'Data', administrationVersion: 2 }
    const summary = summarizeSnapshot(snap)
    expect(summary.stepName).toBe('Data')
    expect(summary.administrationVersion).toBe(2)
  })

  it('tolerates unparseable stored JSON', () => {
    expect(parseSnapshot('{broken')).toBeNull()
    expect(parseSnapshot(null)).toBeNull()
    expect(summarizeSnapshot(null).hasTemplateContent).toBe(false)
  })
})
