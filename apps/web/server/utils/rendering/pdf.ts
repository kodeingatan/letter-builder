/**
 * PDF adapter (Task 20).
 *
 * Decision (logged per task Assumptions): pure-TypeScript deterministic
 * PDF writer instead of headless Chromium. Rationale: no new native
 * dependency alongside `better-sqlite3`/`bcrypt` (zero binary-size cost,
 * works in every deployment), byte-deterministic output for identical
 * input (AC-004), and sufficient for text/table documents v1. Chromium
 * (e.g. puppeteer-class) remains the documented upgrade path when
 * pixel-faithful CSS fidelity is required — the `htmlToPdf(html)`
 * boundary is unchanged.
 *
 * The writer emits a minimal single-family PDF (`%PDF-1.4`) with fixed
 * metadata (no timestamps, fixed document ID) so identical HTML always
 * yields identical bytes. Content is the text extraction of the HTML
 * (tags stripped, entities decoded); layout fidelity is intentionally
 * basic in v1 — the HTML remains the canonical visual output.
 */

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

export function htmlToText(html: string): string {
  const withoutScripts = String(html ?? '')
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style[\s\S]*?<\/style\s*>/gi, '')
  const withBreaks = withoutScripts
    .replace(/<\/(p|div|h[1-6]|tr|li|section|article)\s*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(td|th)\s*>/gi, ' | ')
  const stripped = withBreaks.replace(/<[^>]*>/g, '')
  return decodeEntities(stripped)
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapePdfString(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function toLatin1Safe(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 32
    out += code <= 255 ? ch : '?'
  }
  return out
}

/**
 * Deterministic HTML → PDF conversion. Same input bytes always produce
 * the same output bytes (fixed metadata, fixed document ID, stable
 * line-wrapping at 95 chars, A4 pagination at 45 lines/page).
 */
export function htmlToPdf(html: string): Buffer {
  const text = htmlToText(html)
  const rawLines = text ? text.split('\n') : ['(empty document)']
  const wrapped: string[] = []
  for (const line of rawLines) {
    if (line.length <= 95) {
      wrapped.push(line)
      continue
    }
    let rest = line
    while (rest.length > 95) {
      wrapped.push(rest.slice(0, 95))
      rest = rest.slice(95)
    }
    wrapped.push(rest)
  }

  const LINES_PER_PAGE = 45
  const pages: string[][] = []
  for (let i = 0; i < wrapped.length; i += LINES_PER_PAGE) {
    pages.push(wrapped.slice(i, i + LINES_PER_PAGE))
  }
  if (pages.length === 0) pages.push(['(empty document)'])

  const objects: string[] = []
  // 1: catalog, 2: pages, 3: font; page objects start at 4 (content, page pairs).
  const pageObjectNumbers: number[] = []
  let next = 4
  const contentObjects: string[] = []
  for (const pageLines of pages) {
    const textOps = pageLines
      .map((line, i) => {
        const y = 800 - i * 16
        return `BT /F1 11 Tf 40 ${y} Td (${escapePdfString(toLatin1Safe(line))}) Tj ET`
      })
      .join('\n')
    const stream = `<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream`
    const contentNum = next++
    const pageNum = next++
    contentObjects.push(`${contentNum} 0 obj\n${stream}\nendobj`)
    pageObjectNumbers.push(pageNum)
    objects.push(
      `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj`,
    )
  }

  const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
  const catalog = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj'
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>\nendobj`
  const font = '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj'
  const info = '<< /Producer (LBS Rendering Engine) /Creator (LBS Rendering Engine) /CreationDate (D:20260101000000Z) /ModDate (D:20260101000000Z) >>'
  const infoNum = next++
  const infoObj = `${infoNum} 0 obj\n${info}\nendobj`
  const trailerId = '<0123456789ABCDEF0123456789ABCDEF>'

  const allObjects = [catalog, pagesObj, font, ...([] as string[])]
  // Interleave content + page objects in number order for a stable body.
  const byNumber = new Map<number, string>()
  for (const entry of [...contentObjects, ...objects]) {
    const num = Number(entry.split(' ')[0])
    byNumber.set(num, entry)
  }
  const orderedNums = [...byNumber.keys()].sort((a, b) => a - b)
  const bodyParts = [catalog, pagesObj, font, ...orderedNums.map((n) => byNumber.get(n)!), infoObj]

  let offset = Buffer.byteLength(header, 'latin1')
  const offsets: number[] = []
  const bodyStrings: string[] = []
  for (const part of bodyParts) {
    offsets.push(offset)
    bodyStrings.push(part)
    offset += Buffer.byteLength(part, 'latin1') + 1 // trailing \n
  }
  const body = bodyStrings.join('\n') + '\n'
  const xrefAt = offset
  const totalObjects = infoNum // highest object number
  let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`
  // Object numbers: 1..infoNum — catalog=1, pages=2, font=3, then pairs, info last.
  const offsetByNum = new Map<number, number>()
  bodyParts.forEach((part, i) => {
    const num = i < 3 ? i + 1 : i === bodyParts.length - 1 ? infoNum : orderedNums[i - 3]
    offsetByNum.set(num, offsets[i])
  })
  for (let n = 1; n <= totalObjects; n++) {
    const off = offsetByNum.get(n)
    if (off === undefined) {
      xref += '0000000000 00000 f \n'
    } else {
      xref += `${String(off).padStart(10, '0')} 00000 n \n`
    }
  }
  const trailer =
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R /Info ${infoNum} 0 R /ID [${trailerId} ${trailerId}] >>\n` +
    `startxref\n${xrefAt}\n%%EOF`
  void allObjects
  return Buffer.from(header + body + xref + trailer, 'latin1')
}
