import type { ResolvedPin, RunStepData, RunStepDataMap } from '../entities/administration-run.entity'

export interface RunnerStepField {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
}

export interface RunnerStep {
  id: number
  name: string
  order: number
  templateId?: number | null
  templateVersion?: string | null
  fields?: RunnerStepField[]
}

/** Parse the frozen `resolvedPins` JSON; corrupt payloads yield []. */
export function parseResolvedPins(raw: unknown): ResolvedPin[] {
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p) =>
        p && typeof p === 'object' && typeof p.stepId === 'number' && typeof p.templateId === 'number',
    ) as ResolvedPin[]
  } catch {
    return []
  }
}

/** Parse the `stepData` JSON map; corrupt payloads yield {}. */
export function parseStepDataMap(raw: unknown): RunStepDataMap {
  if (!raw) return {}
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as RunStepDataMap)
      : {}
  } catch {
    return {}
  }
}

export function emptyStepData(): RunStepData {
  return { fields: {}, rowSelections: {}, manualInputs: {} }
}

/**
 * Build per-step skeletons for a fresh run: every workflow step gets an
 * empty slot. Designer-default row pre-checks (Task 15 loop configs) are
 * not persisted anywhere yet, so skeletons start empty — noted in Task 18
 * Assumptions. `manual` binding slots surface as empty manualInputs keys
 * when `manualSlots` are provided per step id.
 */
export function buildStepSkeletons(
  steps: RunnerStep[],
  manualSlots?: Record<number, string[]>,
): RunStepDataMap {
  const map: RunStepDataMap = {}
  for (const step of steps) {
    const manualInputs: Record<string, unknown> = {}
    for (const slot of manualSlots?.[step.id] ?? []) manualInputs[slot] = null
    map[String(step.id)] = { fields: {}, rowSelections: {}, manualInputs }
  }
  return map
}

/**
 * Resolve `latest` pins against live template versions and freeze them.
 * `liveVersions` maps templateId → current published version (number).
 * Unknown templates keep `latest` so the run still records the intent;
 * step-save/complete validation surfaces the problem deterministically.
 */
export function resolvePins(
  steps: RunnerStep[],
  liveVersions: Record<number, number>,
): ResolvedPin[] {
  const pins: ResolvedPin[] = []
  for (const step of steps) {
    if (step.templateId === undefined || step.templateId === null) continue
    const raw = step.templateVersion != null ? String(step.templateVersion).trim() : 'latest'
    const frozen =
      raw === 'latest' || raw === ''
        ? String(liveVersions[step.templateId] ?? 'latest')
        : raw
    pins.push({ stepId: step.id, templateId: step.templateId, version: frozen })
  }
  return pins
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

/**
 * Validate one step's field values against the Task 17 field schema.
 * Returns human-readable issues; empty means valid. Pure — no DB access.
 * Row-id existence + readability filtering happens in the service (BR-003).
 */
export function validateStepFieldValues(
  step: RunnerStep,
  values: Record<string, unknown>,
): string[] {
  const issues: string[] = []
  const fields = step.fields ?? []
  const stepName = step.name?.trim() || `Step ${step.id}`
  for (const field of fields) {
    const value = values?.[field.name]
    if (field.required && isEmptyValue(value)) {
      issues.push(`Step "${stepName}": field "${field.label || field.name}" is required`)
      continue
    }
    if (isEmptyValue(value)) continue
    switch (field.type) {
      case 'number':
      case 'currency':
        if (typeof value !== 'number' && !(typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value)))) {
          issues.push(`Step "${stepName}": field "${field.label || field.name}" must be a number`)
        }
        break
      case 'date':
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
          issues.push(`Step "${stepName}": field "${field.label || field.name}" must be a valid date`)
        }
        break
      case 'select': {
        const options = Array.isArray(field.options) ? field.options : []
        if (options.length > 0 && !options.includes(String(value))) {
          issues.push(`Step "${stepName}": field "${field.label || field.name}" must be one of: ${options.join(', ')}`)
        }
        break
      }
      default:
        break
    }
  }
  return issues
}

/**
 * Validate every step for completion (REQ-005): all field schemas must
 * pass. Returns per-step issues; empty means completable.
 */
export function validateAllSteps(
  steps: RunnerStep[],
  dataMap: RunStepDataMap,
): Array<{ stepId: number; stepName: string; issues: string[] }> {
  const problems: Array<{ stepId: number; stepName: string; issues: string[] }> = []
  for (const step of steps) {
    const data = dataMap[String(step.id)] ?? emptyStepData()
    const issues = validateStepFieldValues(step, data.fields ?? {})
    if (issues.length > 0) {
      problems.push({ stepId: step.id, stepName: step.name, issues })
    }
  }
  return problems
}

/**
 * Per-step status for the NSteps wizard header (REQ-002):
 * `done` when the step validates, `invalid` when it carries issues,
 * `pending` when untouched. The active step is resolved client-side.
 */
export function stepStatus(
  step: RunnerStep,
  data: RunStepData | undefined,
): 'pending' | 'done' | 'invalid' {
  const fields = Object.keys(data?.fields ?? {})
  const rows = Object.keys(data?.rowSelections ?? {})
  const manuals = Object.values(data?.manualInputs ?? {}).filter((v) => !isEmptyValue(v))
  const touched = fields.length > 0 || rows.length > 0 || manuals.length > 0
  if (!touched) return 'pending'
  const issues = validateStepFieldValues(step, data?.fields ?? {})
  return issues.length > 0 ? 'invalid' : 'done'
}
