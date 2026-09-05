import type { ComponentRequirement } from '~/shared/types/component'

export const COMPONENT_REQUIREMENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/

export const COMPONENT_REQUIREMENT_TYPES = ['text', 'date', 'image', 'number', 'richtext'] as const

export function isValidRequirementName(name: string): boolean {
  if (!name || name.length > 64) return false
  return COMPONENT_REQUIREMENT_NAME_PATTERN.test(name)
}

export function extractPlaceholders(content: string | null | undefined): string[] {
  if (!content) return []
  const found: string[] = []
  const seen = new Set<string>()
  const re = /\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1])
      found.push(match[1])
    }
  }
  return found
}

/** Unknown placeholders (block save) + unused requirements (warn only). */
export function checkPlaceholderMismatch(
  content: string | null | undefined,
  requirements: Pick<ComponentRequirement, 'name'>[],
): { unknown: string[]; unused: string[] } {
  const placeholders = extractPlaceholders(content)
  const declared = new Set(requirements.map((r) => r.name))
  const used = new Set(placeholders)
  return {
    unknown: placeholders.filter((p) => !declared.has(p)),
    unused: requirements.map((r) => r.name).filter((n) => !used.has(n)),
  }
}

/** Auto-generated sample value per requirement type (mirrors server helper). */
export function sampleValueForType(type: string, name: string): string {
  switch (type) {
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

/** Client-side live preview (same substitution semantics as the server). */
export function renderLocalPreview(
  content: string | null | undefined,
  requirements: Pick<ComponentRequirement, 'name' | 'type'>[],
  looping: boolean,
  samples: Record<string, string> = {},
): { html: string; blockCount: number } {
  const renderOne = (row: Record<string, string>) =>
    (content ?? '').replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g, (_m, name: string) => {
      if (row[name] !== undefined && row[name] !== '') return row[name]
      const req = requirements.find((r) => r.name === name)
      return sampleValueForType(req?.type ?? 'text', name)
    })
  if (!looping) return { html: renderOne(samples), blockCount: 1 }
  return { html: renderOne(samples), blockCount: 1 }
}

/** Placeholder snippet for insertion from the editor dropdown. */
export function placeholderSnippet(name: string): string {
  return `{{${name}}}`
}
