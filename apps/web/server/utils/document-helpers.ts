/**
 * Pure document helpers (Task 19). DB-free so they are unit-testable in
 * the `unit` vitest project.
 *
 * Covers: BR-001 snapshot completeness, BR-002 version-drift badge data,
 * BR-003 PDF filename convention, AC-005 HTML sanitization (reuses the
 * Task 15 allowlist-lite sanitizer — same allowlist as Task 15).
 */

import { sanitizeHtmlFragment } from './composition-tree'

export const SNAPSHOT_REQUIRED_KEYS = [
  'runInput',
  'templateContent',
  'componentSnapshots',
  'bindings',
  'resolvedPins',
  'systemContext',
] as const

export interface SnapshotCheck {
  valid: boolean
  missing: string[]
}

export interface DriftInfo {
  pinned: number
  current: number | null
  drifted: boolean
}

export interface SnapshotSummary {
  hasTemplateContent: boolean
  componentCount: number
  bindingCount: number
  stepName: string | null
  administrationVersion: number | null
}

/** BR-001: every snapshot key present; frozen template content non-empty. */
export function validateSnapshot(snapshot: unknown): SnapshotCheck {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return { valid: false, missing: [...SNAPSHOT_REQUIRED_KEYS] }
  }
  const record = snapshot as Record<string, unknown>
  const missing = SNAPSHOT_REQUIRED_KEYS.filter((key) => record[key] === undefined || record[key] === null)
  if (typeof record.templateContent === 'string' && !record.templateContent.trim()) {
    if (!missing.includes('templateContent')) missing.push('templateContent')
  }
  return { valid: missing.length === 0, missing }
}

/** AC-005: strip scripts/blocked tags on store (Task 15 allowlist). */
export function sanitizeDocumentHtml(html: string | null | undefined): string | null {
  if (html === null || html === undefined) return null
  return sanitizeHtmlFragment(html)
}

/** BR-002: badge data — pinned version vs live template version. */
export function driftInfo(pinned: number, current: number | null | undefined): DriftInfo {
  const live = typeof current === 'number' ? current : null
  return { pinned, current: live, drifted: live !== null && live !== pinned }
}

export function driftLabel(info: DriftInfo): string {
  if (info.current === null) return `template v${info.pinned} (source removed)`
  if (info.drifted) return `template v${info.pinned} (current v${info.current})`
  return `template v${info.pinned}`
}

/** BR-003: `{admin-slug}_{doc-id}_{YYYYMMDD-HHmm}.pdf`. */
export function slugifyAdminName(name: string | null | undefined): string {
  const slug = (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'administration'
}

export function formatPdfTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}`
  )
}

export function buildPdfFilename(adminName: string | null | undefined, docId: number, at: Date = new Date()): string {
  return `${slugifyAdminName(adminName)}_${docId}_${formatPdfTimestamp(at)}.pdf`
}

/** Deny directory traversal — join basenames only (Security & Permission). */
export function safeStorageFilename(filename: string): string {
  return filename.split('/').pop()?.split('\\').pop() ?? filename
}

/** Compact audit summary of a stored snapshot (detail `?meta=1`). */
export function summarizeSnapshot(snapshot: unknown): SnapshotSummary {
  const empty: SnapshotSummary = {
    hasTemplateContent: false,
    componentCount: 0,
    bindingCount: 0,
    stepName: null,
    administrationVersion: null,
  }
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return empty
  const record = snapshot as Record<string, any>
  return {
    hasTemplateContent: typeof record.templateContent === 'string' && record.templateContent.trim().length > 0,
    componentCount: Array.isArray(record.componentSnapshots) ? record.componentSnapshots.length : 0,
    bindingCount: Array.isArray(record.bindings) ? record.bindings.length : 0,
    stepName: record.systemContext?.stepName ?? null,
    administrationVersion: record.systemContext?.administrationVersion ?? null,
  }
}

export function parseSnapshot(raw: string | null | undefined): unknown | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
