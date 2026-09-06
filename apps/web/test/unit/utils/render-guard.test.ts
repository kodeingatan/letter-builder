import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkPreviewRateLimit,
  withRenderSlot,
  activeRenderCount,
  resetRenderGuard,
  PREVIEW_RATE_LIMIT,
  MAX_CONCURRENT_RENDERS,
} from '../../../server/utils/render-guard'

describe('checkPreviewRateLimit (30/min/user)', () => {
  beforeEach(() => resetRenderGuard())

  it(`allows ${PREVIEW_RATE_LIMIT} previews then rejects with 429`, () => {
    for (let i = 0; i < PREVIEW_RATE_LIMIT; i++) {
      expect(() => checkPreviewRateLimit(42)).not.toThrow()
    }
    try {
      checkPreviewRateLimit(42)
      expect.unreachable('expected 429')
    } catch (e: any) {
      expect(e.statusCode).toBe(429)
      expect(e.data?.retryAfter).toBeGreaterThan(0)
    }
  })

  it('scopes limits per user', () => {
    for (let i = 0; i < PREVIEW_RATE_LIMIT; i++) checkPreviewRateLimit('alice')
    expect(() => checkPreviewRateLimit('bob')).not.toThrow()
  })
})

describe('withRenderSlot (AC-007 semaphore)', () => {
  beforeEach(() => resetRenderGuard())

  it(`holds ${MAX_CONCURRENT_RENDERS} slots and 503s the overflow with Retry-After`, async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const holders = Array.from({ length: MAX_CONCURRENT_RENDERS }, () => withRenderSlot(() => gate))
    // Let the holders acquire before probing.
    await Promise.resolve()
    expect(activeRenderCount()).toBe(MAX_CONCURRENT_RENDERS)
    await expect(withRenderSlot(() => 'overflow')).rejects.toMatchObject({ statusCode: 503 })
    try {
      await withRenderSlot(() => 'overflow')
      expect.unreachable('expected 503')
    } catch (e: any) {
      expect(e.statusCode).toBe(503)
      expect(e.data?.retryAfter).toBeGreaterThan(0)
    }
    release()
    await Promise.all(holders)
    expect(activeRenderCount()).toBe(0)
    await expect(withRenderSlot(() => 'ok')).resolves.toBe('ok')
  })

  it('releases the slot when the render throws', async () => {
    await expect(
      withRenderSlot(() => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
    expect(activeRenderCount()).toBe(0)
  })
})
