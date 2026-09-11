/**
 * Print CSS for rendered documents (Task 20, UI/UX contract).
 *
 * Self-contained (inlined into every render) so sandboxed iframes render
 * identically everywhere: A4 `@page`, `.page-break` support, Kop-friendly
 * repeating `<thead>`, base font Inter 11pt.
 */

export const PRINT_CSS = [
  '@page { size: A4; margin: 20mm 15mm; }',
  '.lbs-doc { font-family: Inter, -apple-system, "Segoe UI", sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; }',
  '.lbs-doc table { width: 100%; border-collapse: collapse; margin: 12px 0; }',
  '.lbs-doc th, .lbs-doc td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }',
  '.lbs-doc thead { display: table-header-group; }',
  '.lbs-doc tr { page-break-inside: avoid; }',
  '.lbs-doc img { max-width: 100%; height: auto; }',
  '.lbs-doc .page-break { break-after: page; }',
  '.lbs-doc .render-image-missing { border: 1px dashed #f59e0b; background: #fffbeb; color: #92400e; padding: 12px; margin: 8px 0; font-size: 10pt; }',
  '.lbs-doc .loop-truncation { border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 10pt; padding-top: 8px; margin-top: 8px; }',
  '.lbs-doc .kop { text-align: center; border-bottom: 3px double #111827; padding-bottom: 12px; margin-bottom: 16px; }',
].join('\n')

/** Wrap sanitized body HTML in a standalone document shell. */
export function wrapDocument(title: string, bodyHtml: string): string {
  const safeTitle = String(title ?? 'Document')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<title>${safeTitle}</title><style>${PRINT_CSS}</style></head>` +
    `<body><div class="lbs-doc">${bodyHtml}</div></body></html>`
  )
}
