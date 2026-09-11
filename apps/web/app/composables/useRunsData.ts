/**
 * Client-side helpers for the Administration Runner wizard .
 * Pure functions for instant step validation + status before saving.
 * Server remains authoritative (re-validates on every save + complete).
 */
import type { RunStep, RunStepData, RunStepDataMap } from '~/shared/types/run'
import type { StepField } from '~/shared/types/administration'

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

export function validateClientStepValues(step: RunStep, values: Record<string, unknown>): string[] {
  const issues: string[] = []
  const fields: StepField[] = step.fields ?? []
  const stepName = step.name?.trim() || `Step ${step.id}`
  for (const field of fields) {
    const value = values?.[field.name]
    if (field.required && isEmptyValue(value)) {
      issues.push(`Field "${field.label || field.name}" is required`)
      continue
    }
    if (isEmptyValue(value)) continue
    if ((field.type === 'number' || field.type === 'currency') && Number.isNaN(Number(value))) {
      issues.push(`Field "${field.label || field.name}" must be a number`)
    }
    if (field.type === 'date' && (typeof value !== 'string' || Number.isNaN(Date.parse(value)))) {
      issues.push(`Field "${field.label || field.name}" must be a valid date`)
    }
    if (field.type === 'select' && Array.isArray(field.options) && field.options.length > 0) {
      if (!field.options.includes(String(value))) {
        issues.push(`Field "${field.label || field.name}" must be one of: ${field.options.join(', ')}`)
      }
    }
  }
  return issues
}

export type ClientStepStatus = 'pending' | 'done' | 'invalid'

export function clientStepStatus(step: RunStep, data: RunStepData | undefined): ClientStepStatus {
  const fields = Object.keys(data?.fields ?? {})
  const rows = Object.keys(data?.rowSelections ?? {})
  const manuals = Object.values(data?.manualInputs ?? {}).filter((v) => !isEmptyValue(v))
  if (fields.length === 0 && rows.length === 0 && manuals.length === 0) return 'pending'
  return validateClientStepValues(step, data?.fields ?? {}).length > 0 ? 'invalid' : 'done'
}

/** Steps blocked from completion: every non-valid step listed with reasons. */
export function clientCompletionBlockers(
  steps: RunStep[],
  dataMap: RunStepDataMap,
): Array<{ stepId: number; stepName: string; issues: string[] }> {
  const blockers: Array<{ stepId: number; stepName: string; issues: string[] }> = []
  for (const step of steps) {
    const data = dataMap[String(step.id)]
    const issues = validateClientStepValues(step, data?.fields ?? {})
    if (issues.length > 0) blockers.push({ stepId: step.id, stepName: step.name, issues })
  }
  return blockers
}

/** Simple debounce for wizard autosave (300ms convention, DataTable search). */
export function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }) as T
}
