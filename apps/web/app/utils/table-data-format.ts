import type { TableDataColumn } from '~/shared/types/table-data'

/**
 * Per-type cell display formatter for generated browse/detail views
 *  formatted dates/currency, relation labels, NImage handled
 * by callers for `image` type.
 */
export function formatCellValue(column: TableDataColumn, value: unknown, display?: string): string {
  if (value === null || value === undefined || value === '') return '—'
  if (column.type === 'select-table-relation' || column.type === 'select-table-relation-multiple') {
    return display || (Array.isArray(value) ? value.map((v) => `#${v}`).join(', ') : `#${value}`)
  }
  if (column.type === 'number' || column.type === 'currency') {
    const n = Number(value)
    if (!Number.isFinite(n)) return String(value)
    if (column.type === 'currency') {
      try {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: column.format || 'IDR', maximumFractionDigits: 0 }).format(n)
      } catch {
        return `${column.format || 'Rp'} ${n.toLocaleString('id-ID')}`
      }
    }
    return n.toLocaleString('id-ID')
  }
  if (column.type === 'date') {
    const d = new Date(String(value))
    if (Number.isNaN(d.getTime())) return String(value)
    try {
      return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: column.format ? 'short' : undefined }).format(d)
    } catch {
      return d.toLocaleDateString('id-ID')
    }
  }
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
