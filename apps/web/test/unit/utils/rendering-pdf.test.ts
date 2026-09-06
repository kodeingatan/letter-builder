import { describe, it, expect } from 'vitest'
import { htmlToPdf, htmlToText } from '../../../server/utils/rendering/pdf'

describe('htmlToPdf — deterministic adapter (REQ-004/AC-004)', () => {
  it('emits a valid PDF header for identical input', () => {
    const html = '<!DOCTYPE html><html><body><p>Surat Tugas 001</p></body></html>'
    const first = htmlToPdf(html)
    const second = htmlToPdf(html)
    expect(first.subarray(0, 8).toString('latin1')).toBe('%PDF-1.4')
    expect(first.equals(second)).toBe(true)
  })

  it('differs for different input', () => {
    expect(htmlToPdf('<p>A</p>').equals(htmlToPdf('<p>B</p>'))).toBe(false)
  })

  it('handles empty input without throwing', () => {
    const pdf = htmlToPdf('')
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })
})

describe('htmlToText', () => {
  it('strips tags and decodes entities', () => {
    expect(htmlToText('<p>A &amp; B</p><script>evil()</script>')).toBe('A & B')
  })
})
