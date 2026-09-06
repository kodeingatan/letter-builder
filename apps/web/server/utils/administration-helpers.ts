import { STEP_FIELD_TYPES, isStepFieldType } from '../dto/administrations.dto'

export interface StepField {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
}

export interface StepDraft {
  id?: number
  name: string
  templateId?: number | null
  templateVersion?: string | null
  fields?: StepField[]
}

export interface StepIssue {
  index: number
  stepName: string
  message: string
}

const SNAKE_CASE_PATTERN = /^[a-z][a-z0-9_]*$/

/**
 * Pure validation for step-local fields (BR-005): names unique per step,
 * snake_case, allowed lite type, `select` carries non-empty options.
 * Returns human-readable issues; empty means valid.
 */
export function validateStepFields(fields: StepField[] | null | undefined): string[] {
  const issues: string[] = []
  if (!fields || fields.length === 0) return issues
  const seen = new Set<string>()
  for (const field of fields) {
    const name = field?.name ?? ''
    if (!name || !SNAKE_CASE_PATTERN.test(name)) {
      issues.push(`Field "${name || '(empty)'}" must be snake_case (lowercase letters, digits, underscores, starting with a letter)`)
      continue
    }
    const lowered = name.toLowerCase()
    if (seen.has(lowered)) {
      issues.push(`Duplicate field name "${name}" in step`)
      continue
    }
    seen.add(lowered)
    if (!isStepFieldType(field.type)) {
      issues.push(`Field "${name}" has unsupported type "${field.type}" (allowed: ${STEP_FIELD_TYPES.join(', ')})`)
    }
    if (!field.label || !String(field.label).trim()) {
      issues.push(`Field "${name}" requires a label`)
    }
    if (field.type === 'select') {
      const options = Array.isArray(field.options) ? field.options.filter((o) => typeof o === 'string' && o.trim()) : []
      if (options.length === 0) {
        issues.push(`Select field "${name}" requires at least one option`)
      }
    }
  }
  return issues
}

/**
 * A step has a data path when it pins a template or carries ≥1 local
 * field (REQ-003). Steps with neither are invalid.
 */
export function stepHasDataPath(step: StepDraft, parsedFields?: StepField[]): boolean {
  if (step.templateId !== undefined && step.templateId !== null) return true
  const fields = parsedFields ?? step.fields ?? []
  return Array.isArray(fields) && fields.length > 0
}

/**
 * Publish validation (REQ-004): ≥1 step, every step with a data path,
 * template pins coherent (templateVersion required iff templateId),
 * field lists valid. Returns per-step issues; empty means publishable.
 */
export function validatePublishSteps(steps: StepDraft[]): StepIssue[] {
  const issues: StepIssue[] = []
  if (!steps || steps.length === 0) {
    issues.push({ index: 0, stepName: '', message: 'Administration has no steps: add at least one step before publishing' })
    return issues
  }
  steps.forEach((step, index) => {
    const stepName = step.name?.trim() ? step.name.trim() : `Step ${index + 1}`
    if (!step.name || !step.name.trim()) {
      issues.push({ index, stepName, message: `Step ${index + 1} requires a name` })
    }
    const hasTemplate = step.templateId !== undefined && step.templateId !== null
    if (hasTemplate && (!step.templateVersion || !String(step.templateVersion).trim())) {
      issues.push({ index, stepName, message: `Step "${stepName}" pins a template but has no version (choose a version or "latest")` })
    }
    if (!hasTemplate && (!step.fields || step.fields.length === 0)) {
      issues.push({ index, stepName, message: `Step "${stepName}" has neither a template nor fields` })
    }
    for (const problem of validateStepFields(step.fields)) {
      issues.push({ index, stepName, message: `Step "${stepName}": ${problem}` })
    }
  })
  return issues
}

/**
 * Normalize client step payload into dense 1..N order (BR-002):
 * array position determines `order`, regardless of any client order.
 */
export function normalizeStepOrder<T extends StepDraft>(steps: T[]): Array<T & { order: number }> {
  return steps.map((step, index) => ({ ...step, order: index + 1 }))
}

export function parseStepFields(raw: unknown): StepField[] {
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? (parsed as StepField[]) : []
  } catch {
    return []
  }
}
