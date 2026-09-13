import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import puppeteer from 'puppeteer'
import { RendererService } from './renderer.service'
import { StorageService } from './storage.service'
import type { DocNode, PdfOptions } from '../../shared/types/document'

/**
 * PDF service (Task 05): rendered HTML → Puppeteer PDF → `storage/documents/`.
 *
 * - 30s timeout (EC-04); on failure any half-written file is removed and
 *   the caller gets `Failed to generate PDF` (ERR-04).
 * - Test seam: `setBrowserLauncher` replaces the real Puppeteer launch.
 */

export const PDF_TIMEOUT_MS = 30_000
const PDF_WIDTH_PT: Record<string, string> = { A4: '210mm', F4: '215mm', Letter: '215.9mm' }
const PDF_HEIGHT_PT: Record<string, string> = { A4: '297mm', F4: '330mm', Letter: '279.4mm' }

type LaunchFn = () => Promise<{ close: () => Promise<void> } & Record<string, unknown>>

let browserLauncher: LaunchFn = async () => puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  protocolTimeout: PDF_TIMEOUT_MS,
})

/** Test-only override for the browser launcher. */
export function setBrowserLauncher(fn: LaunchFn | null): void {
  browserLauncher = fn ?? (async () => puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: PDF_TIMEOUT_MS,
  }))
}

export const PdfService = {
  pageDimensions(page?: PdfOptions): { width: string; height: string; landscape: boolean } {
    const size = page?.size ?? 'A4'
    return {
      width: PDF_WIDTH_PT[size] ?? PDF_WIDTH_PT.A4,
      height: PDF_HEIGHT_PT[size] ?? PDF_HEIGHT_PT.A4,
      landscape: (page?.orientation ?? 'portrait') === 'landscape',
    }
  },

  async generatePdf(
    tree: DocNode,
    data: Record<string, unknown> = {},
    page?: PdfOptions,
  ): Promise<{ url: string }> {
    const { html } = RendererService.render(tree, data)
    return generatePdfFromHtml(html, page)
  },
}

/** HTML → PDF without a DocNode (used by template preview, Task 07). */
export async function generatePdfFromHtml(html: string, page?: PdfOptions): Promise<{ url: string }> {
  const { width, height, landscape } = PdfService.pageDimensions(page)
  // Keep StorageService as the single writer so the `documents`
  // whitelist + upload allowlist stay enforced in one place.
  const dir = join(process.cwd(), 'storage', 'documents')
  await mkdir(dir, { recursive: true })
  const filename = `documents-${Date.now()}-${Math.round(Math.random() * 1e6)}.pdf`
  const filePath = join(dir, filename)

  let browser: { close: () => Promise<void> } | null = null
  try {
    browser = await browserLauncher()
    const pdfBuffer = await renderPdfBuffer(
      browser as import('puppeteer').Browser,
      wrapHtml(html, landscape),
      width,
      height,
      landscape,
    )
    await writeFile(filePath, pdfBuffer)
    // Validate the path through the same getter the public route uses.
    await StorageService.getFilePath('documents', filename)
    return { url: `/api/storage/documents/${filename}` }
  } catch (error) {
    await unlink(filePath).catch(() => {})
    throw new Error(`Failed to generate PDF: ${(error as Error).message}`)
  } finally {
    await browser?.close().catch(() => {})
  }
}

async function renderPdfBuffer(
  browser: import('puppeteer').Browser,
  html: string,
  width: string,
  height: string,
  landscape: boolean,
): Promise<Uint8Array> {
  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: PDF_TIMEOUT_MS })
    const pdf = await page.pdf({
      width,
      height,
      landscape,
      printBackground: true,
      timeout: PDF_TIMEOUT_MS,
    })
    return pdf
  } finally {
    await page.close().catch(() => {})
  }
}

function wrapHtml(body: string, landscape: boolean): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />`
    + `<style>body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;color:#111;margin:0;padding:24px;}`
    + `.doc-page{max-width:${landscape ? '270mm' : '170mm'};margin:0 auto;}`
    + `.doc-pagebreak{break-after:page;}.doc-table{border-collapse:collapse;width:100%;}`
    + `.doc-table th,.doc-table td{border:1px solid #333;padding:4px 8px;text-align:left;}`
    + `.doc-signature-space{height:72px;}</style></head><body>${body}</body></html>`
}
