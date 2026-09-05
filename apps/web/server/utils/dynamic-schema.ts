import type { GlobalTableColumn } from '~~/server/entities/global-table-column.entity'

export interface RowValidationResult {
  valid: boolean
  errors: Record<string, string>
  values: Record<string, any>
}

const COMPUTED_TYPES = ['hidden-computed', 'readonly-computed']

export function isComputedType(type: string): boolean {
  return COMPUTED_TYPES.includes(type)
}

/**
 * Remove readonly/hidden computed values from write payloads (BR-004).
 * Server recomputes them; client tampering has no effect.
 */
export function stripComputedInputs(
  columns: GlobalTableColumn[],
  input: Record<string, any>,
): Record<string, any> {
  const computedNames = new Set(columns.filter((c) => isComputedType(c.type)).map((c) => c.name))
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(input ?? {})) {
    if (!computedNames.has(k)) out[k] = v
  }
  return out
}

function parseOptions(options: string | null): Array<{ label: string; value: unknown }> | null {
  if (!options) return null
  try {
    const parsed = JSON.parse(options)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Validate a row payload against column definitions (single source of truth).
 * Checks required (BR-003), type coercion, select options membership.
 * Relation-target-exists and computed recompute are handled by the service
 * (needs DB + expression engine); this builder covers the sync subset.
 */
export function validateRowValues(
  columns: GlobalTableColumn[],
  rawInput: Record<string, any>,
): RowValidationResult {
  const errors: Record<string, string> = {}
  const values: Record<string, any> = {}
  const input = stripComputedInputs(columns, rawInput)

  for (const col of columns) {
    if (isComputedType(col.type)) continue

    let value = input[col.name]
    if (value === '' && !col.required) value = null
    if (value === undefined) value = col.defaultValue ?? null

    if (col.required && (value === null || value === undefined || value === '')) {
      errors[col.name] = `${col.displayName || col.name} is required`
      continue
    }
    if (value === null || value === undefined) {
      values[col.name] = null
      continue
    }

    switch (col.type) {
      case 'text':
      case 'richtext':
      case 'image':
        if (typeof value !== 'string') {
          errors[col.name] = `${col.name} must be a string`
        } else {
          values[col.name] = value
        }
        break
      case 'date': {
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) {
          errors[col.name] = `${col.name} must be a valid date (ISO)`
        } else {
          values[col.name] = d.toISOString()
        }
        break
      }
      case 'number':
      case 'currency': {
        const n = typeof value === 'number' ? value : Number(value)
        if (!Number.isFinite(n)) {
          errors[col.name] = `${col.name} must be a number`
        } else {
          values[col.name] = n
        }
        break
      }
      case 'select': {
        const opts = parseOptions(col.options)
        const allowed = opts?.map((o) => String(o.value)) ?? []
        if (opts && !allowed.includes(String(value))) {
          errors[col.name] = `${col.name} must be one of: ${allowed.join(', ')}`
        } else {
          values[col.name] = value
        }
        break
      }
      case 'select-table-relation': {
        const n = typeof value === 'number' ? value : Number(value)
        if (!Number.isInteger(n)) {
          errors[col.name] = `${col.name} must reference a row id`
        } else {
          values[col.name] = n
        }
        break
      }
      case 'select-table-relation-multiple': {
        const arr = Array.isArray(value) ? value : null
        if (!arr || !arr.every((v) => Number.isInteger(typeof v === 'number' ? v : Number(v)))) {
          errors[col.name] = `${col.name} must be an array of row ids`
        } else {
          values[col.name] = arr.map((v) => Number(v))
        }
        break
      }
      default:
        values[col.name] = value
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, values }
}

/**
 * CSV cell → typed value coercion shared by import path.
 * Numbers/relations parse numerics; multi-relations accept `;`-separated ids.
 */
export function coerceCsvCell(type: string, cell: string | null | undefined): unknown {
  if (cell === null || cell === undefined || cell === '') return null
  if (type === 'number' || type === 'currency') {
    const n = Number(cell)
    return Number.isFinite(n) ? n : cell
  }
  if (type === 'select-table-relation') {
    const n = Number(cell)
    return Number.isInteger(n) ? n : cell
  }
  if (type === 'select-table-relation-multiple') {
    return cell
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
  }
  return cell
}
