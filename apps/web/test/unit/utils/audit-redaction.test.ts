import { describe, it, expect } from 'vitest'
import {
  isPiiColumn,
  redactValueByColumn,
  redactRowMetadata,
  toAuditMetadata,
  PII_REDACTED,
} from '../../../server/utils/audit-redaction'

describe('audit-redaction (Task 22, BR-003)', () => {
  it('detects PII columns case-insensitively', () => {
    for (const name of ['email', 'Email_Pribadi', 'no_telp', 'Telepon', 'alamat', 'NIK', 'password']) {
      expect(isPiiColumn(name), name).toBe(true)
    }
    expect(isPiiColumn('nama')).toBe(false)
    expect(isPiiColumn('jabatan')).toBe(false)
    expect(isPiiColumn('tanggal_lahir')).toBe(false)
  })

  it('redacts PII values, passes ordinary values through', () => {
    expect(redactValueByColumn('email', 'a@b.co')).toBe(PII_REDACTED)
    expect(redactValueByColumn('nama', 'Budi')).toBe('Budi')
  })

  it('redactRowMetadata keeps column names, redacts PII values only', () => {
    const out = redactRowMetadata(
      [{ name: 'nama' }, { name: 'email' }, { name: 'jabatan' }],
      { nama: 'Budi', email: 'budi@x.co', jabatan: 'Staff' },
    )
    expect(out).toEqual({ nama: 'Budi', email: PII_REDACTED, jabatan: 'Staff' })
  })

  it('toAuditMetadata serializes without leaking PII values', () => {
    const meta = toAuditMetadata([{ name: 'email' }], { email: 'secret@x.co' })
    expect(meta).not.toContain('secret@x.co')
    expect(meta).toContain(PII_REDACTED)
  })
})
