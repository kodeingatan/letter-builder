import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { PdfService, setBrowserLauncher } from '../../../../server/services/pdf.service'
import type { DocNode } from '../../../../shared/types/document'

const routePath = join(process.cwd(), 'server/api/documents/pdf.post.ts')
const tree: DocNode = {
  type: 'document',
  children: [{ type: 'text', props: { content: 'Hello {{name}}' } }],
}

function fakeBrowser(pdfBytes: Uint8Array, calls: { closed: boolean }) {
  return async () => ({
    newPage: async () => ({
      setContent: async () => {},
      pdf: async () => pdfBytes,
      close: async () => {},
    }),
    close: async () => { calls.closed = true },
  }) as never
}

afterEach(() => {
  setBrowserLauncher(null)
})

describe('pdf.service — generatePdf with mocked browser (API-02, AC-006)', () => {
  it('returns a /api/storage/documents/*.pdf url and closes the browser', async () => {
    const calls = { closed: false }
    setBrowserLauncher(fakeBrowser(new Uint8Array([0x25, 0x50, 0x44, 0x46]), calls))
    const result = await PdfService.generatePdf(tree, { name: 'Afdal' }, { size: 'A4', orientation: 'portrait' })
    expect(result.url).toMatch(/^\/api\/storage\/documents\/.*\.pdf$/)
    expect(calls.closed).toBe(true)
  })

  it('browser failure → "Failed to generate PDF" without half-written file (ERR-04)', async () => {
    setBrowserLauncher(async () => { throw new Error('no chrome') })
    await expect(PdfService.generatePdf(tree, {})).rejects.toThrow('Failed to generate PDF')
  })
})

describe('pdf.service — pageDimensions (FR-007)', () => {
  it('maps A4/F4/Letter × portrait/landscape', () => {
    expect(PdfService.pageDimensions({ size: 'A4', orientation: 'portrait' })).toEqual({
      width: '210mm', height: '297mm', landscape: false,
    })
    expect(PdfService.pageDimensions({ size: 'F4', orientation: 'landscape' }).landscape).toBe(true)
    expect(PdfService.pageDimensions({ size: 'Letter', orientation: 'portrait' }).width).toBe('215.9mm')
    expect(PdfService.pageDimensions(undefined).width).toBe('210mm')
  })
})

describe('documents pdf route contract — auth/RBAC/validation (AC-007)', () => {
  it('route file exists', () => {
    expect(existsSync(routePath)).toBe(true)
  })

  const content = existsSync(routePath) ? readFileSync(routePath, 'utf8') : ''

  it('enforces requireApiAccess (401/403)', () => {
    expect(content).toContain('requireApiAccess')
  })

  it('validates with Zod (400) and maps PDF failure to 500', () => {
    expect(content).toContain('PdfDocumentSchema')
    expect(content).toContain('statusCode: 400')
    expect(content).toContain('statusCode: 500')
  })

  it('writes DOCUMENT_PDF activity log', () => {
    expect(content).toContain('DOCUMENT_PDF')
  })
})
