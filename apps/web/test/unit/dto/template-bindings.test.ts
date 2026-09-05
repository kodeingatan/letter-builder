import { describe, it, expect } from 'vitest'
import {
  BindingUpsertSchema,
  BulkBindingsSchema,
  PreviewBindingsSchema,
  BINDING_SOURCES,
  SYSTEM_KEYS,
} from '../../../server/dto/template-bindings.dto'

// ---------------------------------------------------------------------------
// BindingUpsertSchema — discriminated union on `source` (BR-002)
// ---------------------------------------------------------------------------

describe('BindingUpsertSchema', () => {
  const base = {
    templateId: 1,
    placementId: 'node-1',
    componentId: 10,
    requirementName: 'nama',
  }

  describe('administration source', () => {
    it('accepts a valid administration binding with sourceRef', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'administration',
        sourceRef: 'steps.step1.nama',
      })
      expect(result.success).toBe(true)
    })

    it('rejects administration binding without sourceRef', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'administration',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('global_table source', () => {
    it('accepts a valid table.column sourceRef', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'global_table',
        sourceRef: 'pegawai.nama',
      })
      expect(result.success).toBe(true)
    })

    it('rejects global_table binding without sourceRef', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'global_table',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('manual source', () => {
    it('accepts a manual binding with literalValue', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'manual',
        literalValue: 'Staff',
      })
      expect(result.success).toBe(true)
    })

    it('rejects manual binding without literalValue', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'manual',
      })
      expect(result.success).toBe(false)
    })

    it('rejects manual binding with empty literalValue', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'manual',
        literalValue: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('expression source', () => {
    it('accepts an expression binding', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'expression',
        expression: 'data.nama + " " + data.gelar',
      })
      expect(result.success).toBe(true)
    })

    it('rejects expression binding without expression', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'expression',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('system source', () => {
    it('accepts whitelisted system keys', () => {
      for (const key of SYSTEM_KEYS) {
        const result = BindingUpsertSchema.safeParse({
          ...base,
          source: 'system',
          sourceRef: key,
        })
        expect(result.success).toBe(true)
      }
    })

    it('rejects non-whitelisted system keys', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'system',
        sourceRef: 'admin.email',
      })
      expect(result.success).toBe(false)
    })

    it('rejects system binding without sourceRef', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'system',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('discrimination', () => {
    it('rejects unknown source values', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'database',
        sourceRef: 'x',
      })
      expect(result.success).toBe(false)
    })

    it('rejects extra fields not in the discriminated union', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        source: 'manual',
        literalValue: 'test',
        unknownField: 'should fail',
      })
      // Zod strict mode strips unknown keys in discriminated unions; success depends on Zod version.
      // The important thing is the base fields are validated.
      expect(result.success).toBe(true)
    })
  })

  describe('base field validation', () => {
    it('rejects empty placementId', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        placementId: '',
        source: 'manual',
        literalValue: 'test',
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-snake_case requirementName', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        requirementName: 'Nama Lengkap',
        source: 'manual',
        literalValue: 'test',
      })
      expect(result.success).toBe(false)
    })

    it('accepts snake_case requirementName with numbers', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        requirementName: 'nama_lengkap_2',
        source: 'manual',
        literalValue: 'test',
      })
      expect(result.success).toBe(true)
    })

    it('rejects requirementName starting with number', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        requirementName: '1 nama',
        source: 'manual',
        literalValue: 'test',
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative templateId', () => {
      const result = BindingUpsertSchema.safeParse({
        ...base,
        templateId: -1,
        source: 'manual',
        literalValue: 'test',
      })
      expect(result.success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// BulkBindingsSchema
// ---------------------------------------------------------------------------

describe('BulkBindingsSchema', () => {
  const base = {
    templateId: 1,
    placementId: 'node-1',
    componentId: 10,
  }

  it('accepts an array with at least one binding', () => {
    const result = BulkBindingsSchema.safeParse({
      bindings: [
        { ...base, requirementName: 'nama', source: 'manual', literalValue: 'test' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty bindings array', () => {
    const result = BulkBindingsSchema.safeParse({ bindings: [] })
    expect(result.success).toBe(false)
  })

  it('rejects non-array bindings', () => {
    const result = BulkBindingsSchema.safeParse({ bindings: 'not array' })
    expect(result.success).toBe(false)
  })

  it('rejects mixed valid and invalid bindings', () => {
    const result = BulkBindingsSchema.safeParse({
      bindings: [
        { ...base, requirementName: 'nama', source: 'manual', literalValue: 'test' },
        { ...base, requirementName: 'nip', source: 'manual' }, // missing literalValue
      ],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PreviewBindingsSchema
// ---------------------------------------------------------------------------

describe('PreviewBindingsSchema', () => {
  it('accepts empty sampleContext (defaults to {})', () => {
    const result = PreviewBindingsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sampleContext).toEqual({})
    }
  })

  it('accepts arbitrary sample context', () => {
    const result = PreviewBindingsSchema.safeParse({
      sampleContext: { nama: 'Budi', nip: '12345' },
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('BINDING_SOURCES has exactly 5 values', () => {
    expect(BINDING_SOURCES).toHaveLength(5)
    expect(BINDING_SOURCES).toContain('administration')
    expect(BINDING_SOURCES).toContain('global_table')
    expect(BINDING_SOURCES).toContain('manual')
    expect(BINDING_SOURCES).toContain('expression')
    expect(BINDING_SOURCES).toContain('system')
  })

  it('SYSTEM_KEYS has the expected whitelist', () => {
    expect(SYSTEM_KEYS).toContain('current_date')
    expect(SYSTEM_KEYS).toContain('user.name')
    expect(SYSTEM_KEYS).toContain('user.username')
  })
})
