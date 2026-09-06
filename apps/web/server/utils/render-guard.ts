/**
 * Preview rate limiter + issuance semaphore (Task 20, Security & Permission).
 *
 * - Preview endpoint: 30 requests/min/user (429 + Retry-After when exceeded).
 * - Issuance/concurrent renders: at most 4 in-process slots; when
 *   saturated the caller receives 503 + Retry-After instead of a crash
 *   (AC-007).
 *
 * In-memory and dependency-free so unit tests can drive it directly.
 * Nitro may run multiple workers in production — this is the documented
 * v1 "simple in-process semaphore" per the task spec.
 */

export const PREVIEW_RATE_LIMIT = 30
export const PREVIEW_RATE_WINDOW_MS = 60_000
export const MAX_CONCURRENT_RENDERS = 4

function rateError(message: string, retryAfterSeconds: number): Error {
  return Object.assign(new Error(message), { statusCode: 429, data: { retryAfter: retryAfterSeconds } })
}

function saturatedError(message: string, retryAfterSeconds: number): Error {
  return Object.assign(new Error(message), { statusCode: 503, data: { retryAfter: retryAfterSeconds } })
}

const hitsByUser = new Map<number | string, number[]>()

/** Sliding-window check: throws 429 when the user exceeded 30/min. */
export function checkPreviewRateLimit(userId: number | string, now: number = Date.now()): void {
  const cutoff = now - PREVIEW_RATE_WINDOW_MS
  const hits = (hitsByUser.get(userId) ?? []).filter((t) => t > cutoff)
  if (hits.length >= PREVIEW_RATE_LIMIT) {
    const oldest = hits[0] ?? now
    const retryAfter = Math.max(1, Math.ceil((oldest + PREVIEW_RATE_WINDOW_MS - now) / 1000))
    throw rateError('Preview rate limit exceeded (30/min). Slow down or rely on caller debounce.', retryAfter)
  }
  hits.push(now)
  hitsByUser.set(userId, hits)
}

let activeRenders = 0

/** Current semaphore depth (observability for tests/health). */
export function activeRenderCount(): number {
  return activeRenders
}

/**
 * Run `fn` inside the render semaphore. Throws 503 + Retry-After when
 * more than 4 renders are already in flight (AC-007).
 */
export async function withRenderSlot<T>(fn: () => Promise<T> | T): Promise<T> {
  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    throw saturatedError('Render engine saturated — retry shortly.', 5)
  }
  activeRenders += 1
  try {
    return await fn()
  } finally {
    activeRenders -= 1
  }
}

/** Test-only reset (rate windows + semaphore). */
export function resetRenderGuard(): void {
  hitsByUser.clear()
  activeRenders = 0
}
