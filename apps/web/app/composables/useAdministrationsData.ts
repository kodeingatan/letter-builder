/**
 * Client-side helpers for Administration Workflow (Task 17).
 * Pure functions mirroring `server/utils/administration-helpers.ts`
 * for instant editor validation before saving steps.
 */
import type { StepField, StepInput, StepFieldType } from '~/shared/types/administration'

/**
 * Runtime copy of the step-field type enum (mirrors `STEP_FIELD_TYPES` in
 * `shared/types/administration.ts`). Kept here — not imported from
 * `shared/` — because Nitro cannot bundle relative imports crossing from
 * `app/` to top-level `shared/` (same reason DTOs stay self-contained).
 */
export const STEP_FIELD_TYPES: StepFieldType[] = ['text', 'richtext', 'date', 'select', 'number', 'currency', 'image']

const SNAKE_CASE_PATTERN = /^[a-z][a-z0-9_]*$/

export function validateClientStepFields(fields: StepField[] | undefined): string[] {
  const issues: string[] = []
  if (!fields || fields.length === 0) return issues
  const seen = new Set<string>()
  for (const field of fields) {
    const name = field?.name ?? ''
    if (!name || !SNAKE_CASE_PATTERN.test(name)) {
      issues.push(`Field "${name || '(empty)'}" must be snake_case`)
      continue
    }
    const lowered = name.toLowerCase()
    if (seen.has(lowered)) {
      issues.push(`Duplicate field name "${name}" in step`)
      continue
    }
    seen.add(lowered)
    if (!(STEP_FIELD_TYPES as readonly string[]).includes(field.type)) {
      issues.push(`Field "${name}" has unsupported type "${field.type}"`)
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

export function stepHasDataPath(step: StepInput): boolean {
  if (step.templateId !== undefined && step.templateId !== null) return true
  return Array.isArray(step.fields) && step.fields.length > 0
}

/** Client-side publish readiness: per-step issues, empty means publishable. */
export function validateClientSteps(steps: StepInput[]): string[] {
  const issues: string[] = []
  if (!steps || steps.length === 0) {
    return ['Administration has no steps: add at least one step before publishing']
  }
  steps.forEach((step, index) => {
    const stepName = step.name?.trim() ? step.name.trim() : `Step ${index + 1}`
    if (!step.name || !step.name.trim()) {
      issues.push(`Step ${index + 1} requires a name`)
    }
    const hasTemplate = step.templateId !== undefined && step.templateId !== null
    if (hasTemplate && (!step.templateVersion || !String(step.templateVersion).trim())) {
      issues.push(`Step "${stepName}" pins a template but has no version`)
    }
    if (!hasTemplate && (!step.fields || step.fields.length === 0)) {
      issues.push(`Step "${stepName}" has neither a template nor fields`)
    }
    for (const problem of validateClientStepFields(step.fields)) {
      issues.push(`Step "${stepName}": ${problem}`)
    }
  })
  return issues
}

export function emptyStep(): StepInput {
  return { name: '', templateId: null, templateVersion: null, fields: [] }
}

export function emptyField(): StepField {
  return { name: '', label: '', type: 'text', required: false }
}

export function moveStep<T>(steps: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= steps.length || to >= steps.length) return steps
  const copy = [...steps]
  const [moved] = copy.splice(from, 1)
  copy.splice(to, 0, moved)
  return copy
}
