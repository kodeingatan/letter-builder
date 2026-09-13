import { describe, it, expect } from 'vitest'
import { ExpressionService } from '../../../../server/services/expression.service'

const data = {
  letter: { type: 'internal', no: '800/123' },
  employee: { name: 'Afdal', department: { name: 'IT' } },
  count: 3,
}

describe('expression.service — resolvePath (FR-002)', () => {
  it('resolves nested paths', () => {
    expect(ExpressionService.resolvePath('employee.department.name', data)).toBe('IT')
  })

  it('prefers scope over root data (DR-001)', () => {
    expect(ExpressionService.resolvePath('item.name', data, { item: { name: 'Budi' } })).toBe('Budi')
  })

  it('returns undefined for missing paths (BR-002)', () => {
    expect(ExpressionService.resolvePath('employee.missing.deep', data)).toBeUndefined()
  })

  it('resolves {{current_date}} to YYYY-MM-DD', () => {
    expect(ExpressionService.resolvePath('current_date', data)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('expression.service — interpolate (FR-002, BR-002)', () => {
  it('replaces bindings inline', () => {
    expect(ExpressionService.interpolate('No: {{letter.no}}', data)).toBe('No: 800/123')
  })

  it('missing binding becomes empty string, not throw', () => {
    expect(ExpressionService.interpolate('Hi {{ghost.name}}!', data)).toBe('Hi !')
  })

  it('whole-string binding preserves raw value type', () => {
    expect(ExpressionService.interpolate('{{count}}', data)).toBe(3)
  })

  it('non-string input passes through', () => {
    expect(ExpressionService.interpolate(42, data)).toBe(42)
  })
})

describe('expression.service — evalCondition 8 operators (FR-004, AC-002)', () => {
  const cases: Array<[string, unknown, unknown, boolean]> = [
    ['eq', '{{letter.type}}', 'internal', true],
    ['eq', '{{letter.type}}', 'eksternal', false],
    ['neq', '{{letter.type}}', 'eksternal', true],
    ['gt', '{{count}}', 2, true],
    ['gte', '{{count}}', 3, true],
    ['lt', '{{count}}', 5, true],
    ['lte', '{{count}}', 2, false],
    ['contains', '{{employee.name}}', 'da', true],
    ['in', '{{letter.type}}', ['internal', 'dinas'], true],
    ['empty', '{{ghost}}', null, true],
    ['empty', '{{employee.name}}', null, false],
  ]
  for (const [op, field, value, expected] of cases) {
    it(`${op} → ${expected}`, () => {
      expect(ExpressionService.evalCondition(field, op as never, value, data)).toBe(expected)
    })
  }

  it('contains works on arrays', () => {
    expect(ExpressionService.evalCondition('{{trips}}', 'contains', 'Medan', { trips: ['Medan'] })).toBe(true)
  })

  it('unknown operator throws', () => {
    expect(() => ExpressionService.evalCondition('a', 'bogus' as never, 'b', data)).toThrow('Unknown operator')
  })
})

describe('expression.service — text operations (FR-002, BR-004)', () => {
  it('++ concatenates', () => {
    expect(ExpressionService.evalTextOperation('"SK " ++ letter.no', data)).toBe('SK 800/123')
  })

  it('"" is an empty string literal', () => {
    expect(ExpressionService.evalTextOperation('employee.name ++ ""', data)).toBe('Afdal')
  })

  it('arithmetic * / + -', () => {
    expect(ExpressionService.evalTextOperation('count * 2 + 1', data)).toBe(7)
    expect(ExpressionService.evalTextOperation('(count + 1) * 2', data)).toBe(8)
    expect(ExpressionService.evalTextOperation('count - 5', data)).toBe(-2)
  })

  it('div-by-zero yields null, not Infinity (BR-004)', () => {
    expect(ExpressionService.evalTextOperation('count / 0', data)).toBeNull()
  })

  it('rejects code injection (BR-005: no eval)', () => {
    expect(() => ExpressionService.evalTextOperation('process.exit(1)', data)).toThrow()
    expect(() => ExpressionService.evalTextOperation('a; b', data)).toThrow()
  })
})
