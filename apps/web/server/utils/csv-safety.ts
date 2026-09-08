/**
 * CSV formula-injection neutralization (Task 22, AC-006).
 *
 * Cells starting with `=`, `+`, `-`, or `@` (after optional whitespace)
 * are executed as formulas when the CSV is opened in spreadsheet apps.
 * Prefixing with a single quote neutralizes execution while keeping the
 * visible value intact. Guidance is documented in
 * `docs/production-runbook.md`.
 *
 * Pure and dependency-free so it can be unit-tested.
 */

const FORMULA_LEAD = /^[ \t]*[=+\-@]/

export function isFormulaCell(value: unknown): boolean {
  if (value === null || value === undefined) return false
  return FORMULA_LEAD.test(String(value))
}

/** Prefix formula cells with `'` so spreadsheet apps treat them as text. */
export function neutralizeFormulaCell(value: unknown): unknown {
  if (!isFormulaCell(value)) return value
  return `'${String(value)}`
}
