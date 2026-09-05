import type { ComponentRequirementType } from '~~/server/dto/components.dto'

/**
 * Pure helpers for Component Management (Task 13).
 * Kept DB-free so they are unit-testable in the `unit` vitest project.
 * Full binding/loop/condition resolution lives in Task 20 — preview here
 * is a simple `{{name}}` substitution (Assumptions).
 */

export const PLACEHOLDER_PATTERN = /\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g

export interface RequirementLike {
  name: string
  type: string
}

export type SampleMap = Record<string, string | number>

/** Extract unique placeholder names from content, in order of appearance. */
export function extractPlaceholders(content: string | null | undefined): string[] {
  if (!content) return []
  const found: string[] = []
  const seen = new Set<string>()
  const re = new RegExp(PLACEHOLDER_PATTERN.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    const name = match[1]
    if (!seen.has(name)) {
      seen.add(name)
      found.push(name)
    }
  }
  return found
}

/**
 * Cross-check placeholders against declared requirements (BR-003).
 * Unknown placeholders block the save; declared-but-unused requirements
 * only produce warnings.
 */
export function validatePlaceholders(
  content: string | null | undefined,
  requirements: RequirementLike[],
): { unknown: string[]; unused: string[] } {
  const placeholders = extractPlaceholders(content)
  const declared = new Set(requirements.map((r) => r.name))
  const used = new Set(placeholders)
  return {
    unknown: placeholders.filter((p) => !declared.has(p)),
    unused: requirements.map((r) => r.name).filter((n) => !used.has(n)),
  }
}

/** Auto-generated sample value per requirement type (REQ-004). */
export function sampleValueForType(type: string, name: string): string {
  switch (type as ComponentRequirementType) {
    case 'number':
      return '123'
    case 'date':
      return '2026-01-01'
    case 'image':
      return `<img src="https://via.placeholder.com/320x180?text=${encodeURIComponent(name)}" alt="${name}" />`
    case 'richtext':
      return `<p>Contoh <strong>${name}</strong></p>`
    case 'text':
    default:
      return `Contoh ${name}`
  }
}

/** Substitute `{{name}}` placeholders with sample values. */
export function renderContent(
  content: string | null | undefined,
  requirements: RequirementLike[],
  samples: SampleMap = {},
): string {
  if (!content) return ''
  const typeByName = new Map(requirements.map((r) => [r.name, r.type]))
  return content.replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g, (_m, name: string) => {
    if (samples[name] !== undefined) return String(samples[name])
    return sampleValueForType(typeByName.get(name) ?? 'text', name)
  })
}

/**
 * Render preview HTML (REQ-004, AC-001, AC-005).
 * Single mode → one substituted block. Collection mode → one block per
 * item (each item supplies the full single-item contract, REQ-003); when
 * no items are given, a single auto-sampled block is rendered.
 */
export function renderPreview(
  content: string | null | undefined,
  requirements: RequirementLike[],
  looping: boolean,
  samples: SampleMap = {},
  items?: SampleMap[],
): { html: string; blockCount: number } {
  if (!looping) {
    return { html: renderContent(content, requirements, samples), blockCount: 1 }
  }
  const rows = items?.length ? items : [samples]
  const blocks = rows.map((row) => renderContent(content, requirements, row))
  return { html: blocks.join('\n'), blockCount: blocks.length }
}
