/**
 * PII discipline for audit trails (Task 22, BR-003).
 *
 * Rule: row VALUES never enter system logs; activity metadata stores
 * column-names + ids, redacting configured PII columns (email/phone/
 * address-like names). The redaction list is documented in
 * `docs/production-runbook.md`.
 *
 * Pure and dependency-free so it can be unit-tested.
 */

/** Column-name fragments treated as PII (case-insensitive substring match). */
export const PII_COLUMN_PATTERNS = [
  'email',
  'phone',
  'telp',
  'telepon',
  'hp',
  'address',
  'alamat',
  'nik',
  'ktp',
  'npwp',
  'password',
  'token',
  'secret',
] as const

export const PII_REDACTED = '[REDACTED]'

export function isPiiColumn(columnName: string): boolean {
  const lower = String(columnName ?? '').toLowerCase()
  return PII_COLUMN_PATTERNS.some((p) => lower.includes(p))
}

/** Redact a single value when its column is PII; otherwise pass through. */
export function redactValueByColumn(columnName: string, value: unknown): unknown {
  if (isPiiColumn(columnName)) return PII_REDACTED
  return value
}

/**
 * Build audit-safe metadata for a row write: keeps column names + row id,
 * redacts PII column values. Never leaks full row VALUES for PII columns.
 */
export function redactRowMetadata(
  columns: Array<{ name: string } | string>,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const names = columns.map((c) => (typeof c === 'string' ? c : c.name))
  const out: Record<string, unknown> = {}
  for (const name of names) {
    if (!(name in values)) continue
    out[name] = redactValueByColumn(name, values[name])
  }
  return out
}

/** Serialize redacted metadata for the activity-log `metadata` column. */
export function toAuditMetadata(
  columns: Array<{ name: string } | string>,
  values: Record<string, unknown>,
): string {
  return JSON.stringify(redactRowMetadata(columns, values))
}
