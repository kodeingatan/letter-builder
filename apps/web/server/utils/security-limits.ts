/**
 * Upload allowlists + expression rate limits (Task 22, REQ-004 sweep).
 *
 * Centralizes the limits deferred from Tasks 09/12/20 so this task can
 * verify/enforce them in one place:
 * - upload allowlists (extension + size) enforced by StorageService,
 * - CSV row cap (5000 rows) enforced for CSV imports (Task 12 limit: MAX_CSV_IMPORT_ROWS),
 * - expression validate/evaluate rate limit enforced by the expression routes (60/min via checkExpressionRateLimit — sliding-window),
 * - render preview limits — removed in Task 01 (dynamic rendering deleted; no semaphore file).
 */

/** Max upload size: 5 MB (settings images/avatars/general). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/**
 * File extensions accepted by StorageService. Images/ico cover settings +
 * avatar uploads; `pdf` covers internal document issuance (rendering
 * service persists issued PDFs via the same StorageService.saveFile path).
 */
export const ALLOWED_UPLOAD_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'svg',
  'webp',
  'ico',
  'gif',
  'pdf',
] as const

/** Max rows accepted by a single CSV import (Task 12 limit, verified here). */
export const MAX_CSV_IMPORT_ROWS = 5000

/** Expression endpoints: 60 requests/min/user (heavier than render preview
 *  allowance because editor validation fires on keystroke debounce). */
export const EXPRESSION_RATE_LIMIT = 60
export const EXPRESSION_RATE_WINDOW_MS = 60_000

function limitError(statusCode: number, message: string, retryAfter?: number): Error {
  return Object.assign(new Error(message), {
    statusCode,
    ...(retryAfter !== undefined ? { data: { retryAfter } } : {}),
  })
}

export function validateUpload(filename: string, byteLength: number): void {
  const ext = (filename.split('.').pop() ?? '').toLowerCase()
  if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
    throw limitError(
      400,
      `File type .${ext || 'unknown'} not allowed (allowed: ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')})`,
    )
  }
  if (byteLength > MAX_UPLOAD_BYTES) {
    throw limitError(400, `File exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024} MB limit`)
  }
}

const expressionHits = new Map<number | string, number[]>()

/** Sliding-window check: throws 429 when the user exceeded 60/min. */
export function checkExpressionRateLimit(userId: number | string, now: number = Date.now()): void {
  const cutoff = now - EXPRESSION_RATE_WINDOW_MS
  const hits = (expressionHits.get(userId) ?? []).filter((t) => t > cutoff)
  if (hits.length >= EXPRESSION_RATE_LIMIT) {
    const oldest = hits[0] ?? now
    const retryAfter = Math.max(1, Math.ceil((oldest + EXPRESSION_RATE_WINDOW_MS - now) / 1000))
    throw limitError(429, 'Expression rate limit exceeded (60/min).', retryAfter)
  }
  hits.push(now)
  expressionHits.set(userId, hits)
}

/** Test-only reset. */
export function resetExpressionRateLimit(): void {
  expressionHits.clear()
}
