import { ExpressionService } from '../../server/services/expression.service'

/**
 * Client-side Master Data helpers (Task 06).
 *
 * Operation preview reuses the Task 05 `ExpressionService` module directly
 * (pure, no node imports) so client preview and server computation are
 * byte-identical by construction (FR-006, DR-003).
 */

export function previewOperation(expression: string, row: Record<string, unknown>): { value: string; error: string | null } {
  try {
    const computed = ExpressionService.evalTextOperation(expression, {}, row)
    if (computed === null || computed === undefined) return { value: '', error: 'Pembagian dengan nol' }
    if (typeof computed === 'object') return { value: JSON.stringify(computed), error: null }
    return { value: String(computed), error: null }
  } catch (e) {
    return { value: '', error: (e as Error).message }
  }
}

/** Realtime IDR formatting for number inputs (`currency: true`). */
export function formatIDR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9-]/g, ''))
  if (!Number.isFinite(num)) return String(value)
  return `Rp ${num.toLocaleString('id-ID')}`
}

/** Parse an IDR-formatted (or plain) input back to a number. */
export function parseIDRInput(input: string): number | null {
  if (input.trim() === '') return null
  const num = Number(input.replace(/[^0-9-]/g, ''))
  return Number.isFinite(num) ? num : null
}

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Display-format a stored date/datetime/time value (`m-d-Y` family). */
export function formatDateDisplay(value: unknown, type: string, format?: string): string {
  if (value === null || value === undefined || value === '') return ''
  const raw = String(value)
  const date = new Date(raw.includes('T') || raw.includes(' ') ? raw : `${raw}T00:00:00`)
  if (Number.isNaN(date.getTime())) return raw
  const pad = (n: number) => String(n).padStart(2, '0')
  const tokens: Record<string, string> = {
    d: pad(date.getDate()),
    m: MONTHS_ID[date.getMonth()],
    Y: String(date.getFullYear()),
    H: pad(date.getHours()),
    i: pad(date.getMinutes()),
    s: pad(date.getSeconds()),
  }
  const fmt = format ?? (type === 'datetime' ? 'm-d-Y H:i:s' : type === 'time' ? 'H:i:s' : 'm-d-Y')
  if (type === 'time' && /^\d{2}:\d{2}(:\d{2})?$/.test(raw)) return raw
  return fmt.replace(/[dmYHis]/g, (ch) => tokens[ch] ?? ch)
}
