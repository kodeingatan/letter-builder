import { describe, it, expect } from 'vitest'
import {
  validateUpload,
  checkExpressionRateLimit,
  resetExpressionRateLimit,
  MAX_UPLOAD_BYTES,
  EXPRESSION_RATE_LIMIT,
} from '../../../server/utils/security-limits'
import { runStartupChecks } from '../../../server/utils/startup-check'

describe('security-limits (Task 22)', () => {
  it('validateUpload allows images + internal PDFs, rejects exe/size', () => {
    expect(() => validateUpload('logo.png', 1024)).not.toThrow()
    expect(() => validateUpload('doc.pdf', 1024)).not.toThrow()
    expect(() => validateUpload('evil.exe', 10)).toThrowError()
    expect(() => validateUpload('big.png', MAX_UPLOAD_BYTES + 1)).toThrowError()
  })

  it('expression rate limit trips at 60/min with 429 + Retry-After', () => {
    resetExpressionRateLimit()
    for (let i = 0; i < EXPRESSION_RATE_LIMIT; i++) {
      checkExpressionRateLimit('u1', 1_000_000 + i)
    }
    try {
      checkExpressionRateLimit('u1', 1_000_000 + EXPRESSION_RATE_LIMIT)
      expect.unreachable()
    } catch (e: any) {
      expect(e.statusCode).toBe(429)
      expect(e.data.retryAfter).toBeGreaterThan(0)
    }
  })
})

describe('startup-check (Task 22, Validation)', () => {
  it('flags default JWT secret as fatal in production, warn in dev', () => {
    const prod = runStartupChecks({
      jwtSecret: 'default-secret-change-me',
      nodeEnv: 'production',
      storageWritable: true,
      migrationInSync: true,
    })
    expect(prod.find((i) => i.code === 'JWT_SECRET_DEFAULT')?.level).toBe('fatal')

    const dev = runStartupChecks({
      jwtSecret: 'default-secret-change-me',
      nodeEnv: 'development',
      storageWritable: true,
      migrationInSync: true,
    })
    expect(dev.find((i) => i.code === 'JWT_SECRET_DEFAULT')?.level).toBe('warn')
  })

  it('clean production env yields no issues; unwritable storage is fatal', () => {
    expect(runStartupChecks({
      jwtSecret: 'strong-secret',
      nodeEnv: 'production',
      storageWritable: true,
      migrationInSync: true,
    })).toEqual([])
    const bad = runStartupChecks({
      jwtSecret: 'strong-secret',
      nodeEnv: 'production',
      storageWritable: false,
      migrationInSync: true,
    })
    expect(bad.find((i) => i.code === 'STORAGE_UNWRITABLE')?.level).toBe('fatal')
  })
})
