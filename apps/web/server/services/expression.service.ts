import type { ConditionOperator } from '../../shared/types/document'

/**
 * Expression / binding evaluator (Task 05 — reused by Task 06).
 *
 * No `eval`, no `new Function`, no HTTP fetch. Only:
 * - path resolution (`scope.field`, nested `employee.department.name`,
 *   `{{current_date}}`)
 * - condition operators: eq/neq/gt/gte/lt/lte/contains/in/empty
 * - text operations: `++` (concat), `""` (empty string), `*` `/` `+` `-`
 *   arithmetic over a safe tokenizer
 */

const BINDING_RE = /\{\{\s*([^{}]+?)\s*\}\}/g

export const ExpressionService = {
  /**
   * Resolve a dotted path against scope first, then root data.
   * Unknown paths return `undefined` (renderer maps to empty string, BR-002).
   */
  resolvePath(path: string, data: Record<string, unknown>, scope: Record<string, unknown> = {}): unknown {
    const trimmed = path.trim()
    if (trimmed === '') return undefined
    if (trimmed === 'current_date') return new Date().toISOString().slice(0, 10)
    const segments = trimmed.split('.')
    const first = segments[0]
    const root: unknown = first in scope ? scope[first] : (data as Record<string, unknown>)[first]
    let current = root
    for (let i = 1; i < segments.length; i++) {
      if (current === null || current === undefined) return undefined
      if (typeof current !== 'object') return undefined
      current = (current as Record<string, unknown>)[segments[i]]
    }
    return current
  },

  /**
   * Evaluate `{{...}}` bindings inside a string. Non-string input is
   * returned as-is. Missing bindings become empty string (BR-002).
   */
  interpolate(template: unknown, data: Record<string, unknown>, scope: Record<string, unknown> = {}): unknown {
    if (typeof template !== 'string') return template
    // Whole-string single binding: preserve the raw value type
    // (needed for condition/table values, not only text output).
    const whole = template.match(/^\{\{\s*([^{}]+?)\s*\}\}$/)
    if (whole) {
      const value = ExpressionService.resolvePath(whole[1], data, scope)
      return value === undefined || value === null ? '' : value
    }
    return template.replace(BINDING_RE, (_m, expr: string) => {
      const value = ExpressionService.resolvePath(expr, data, scope)
      if (value === undefined || value === null) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    })
  },

  /** Evaluate the text-operation mini language (`++`, `""`, `*` `/` `+` `-`). */
  evalTextOperation(expr: string, data: Record<string, unknown>, scope: Record<string, unknown> = {}): unknown {
    const tokens = tokenize(expr.trim())
    if (tokens.length === 0) return ''
    const result = parseConcat(tokens, data, scope)
    if (result.rest.length > 0) throw new Error(`Unexpected token "${result.rest[0]}"`)
    return result.value
  },

  /**
   * Evaluate a condition `{ field, operator, value }`.
   * `field` may itself contain `{{...}}` bindings.
   */
  evalCondition(
    field: unknown,
    operator: ConditionOperator,
    value: unknown,
    data: Record<string, unknown>,
    scope: Record<string, unknown> = {},
  ): boolean {
    const left = typeof field === 'string' ? ExpressionService.interpolate(field, data, scope) : field
    const right = typeof value === 'string' ? ExpressionService.interpolate(value, data, scope) : value
    switch (operator) {
      case 'eq': return looseEqual(left, right)
      case 'neq': return !looseEqual(left, right)
      case 'gt': return compare(left, right) > 0
      case 'gte': return compare(left, right) >= 0
      case 'lt': return compare(left, right) < 0
      case 'lte': return compare(left, right) <= 0
      case 'contains':
        if (Array.isArray(left)) return left.some((item) => looseEqual(item, right))
        return String(left ?? '').includes(String(right ?? ''))
      case 'in':
        if (Array.isArray(right)) return right.some((item) => looseEqual(item, left))
        return false
      case 'empty':
        if (left === undefined || left === null || left === '') return true
        if (Array.isArray(left)) return left.length === 0
        if (typeof left === 'object') return Object.keys(left).length === 0
        return false
      default:
        throw new Error(`Unknown operator "${operator}"`)
    }
  },
}

function looseEqual(a: unknown, b: unknown): boolean {
  // eslint-disable-next-line eqeqeq
  return a == b
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function compare(a: unknown, b: unknown): number {
  const na = toNumber(a)
  const nb = toNumber(b)
  if (na !== null && nb !== null) return na < nb ? -1 : na > nb ? 1 : 0
  const sa = String(a ?? '')
  const sb = String(b ?? '')
  return sa < sb ? -1 : sa > sb ? 1 : 0
}

type Token =
  | { kind: 'path'; text: string }
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'op'; op: '++' | '+' | '-' | '*' | '/' | '(' | ')' }

/** Safe tokenizer: identifiers, numbers, quoted strings, operators only. */
function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const fail = (): never => { throw new Error(`Invalid expression near "${input.slice(i, i + 12)}"`) }
  while (i < input.length) {
    const ch = input[i]
    if (ch === ' ' || ch === '\t' || ch === '\n') { i++; continue }
    if (ch === '(' || ch === ')' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'op', op: ch as '+' | '-' | '*' | '/' | '(' | ')' })
      i++
      continue
    }
    if (ch === '+') {
      if (input[i + 1] === '+') { tokens.push({ kind: 'op', op: '++' }); i += 2 } else { tokens.push({ kind: 'op', op: '+' }); i++ }
      continue
    }
    if (ch === '-') { tokens.push({ kind: 'op', op: '-' }); i++; continue }
    if (ch === '"' || ch === "'") {
      const end = input.indexOf(ch, i + 1)
      if (end === -1) fail()
      tokens.push({ kind: 'string', value: input.slice(i + 1, end) })
      i = end + 1
      continue
    }
    if (/[0-9.]/.test(ch)) {
      const m = /^[0-9]+(?:\.[0-9]+)?/.exec(input.slice(i))
      if (!m) fail()
      tokens.push({ kind: 'number', value: Number(m[0]) })
      i += m[0].length
      continue
    }
    if (/[A-Za-z_$]/.test(ch)) {
      const m = /^[A-Za-z_$][A-Za-z0-9_$.]*/.exec(input.slice(i))
      if (!m) fail()
      tokens.push({ kind: 'path', text: m[0] })
      i += m[0].length
      continue
    }
    fail()
  }
  return tokens
}

interface ParseResult {
  value: unknown
  rest: Token[]
}

/** `++` has the lowest precedence (string concatenation). */
function parseConcat(tokens: Token[], data: Record<string, unknown>, scope: Record<string, unknown>): ParseResult {
  let left = parseAddSub(tokens, data, scope)
  while (left.rest[0]?.kind === 'op' && (left.rest[0] as { op: string }).op === '++') {
    const right = parseAddSub(left.rest.slice(1), data, scope)
    left = { value: `${left.value ?? ''}${right.value ?? ''}`, rest: right.rest }
  }
  return left
}

function parseAddSub(tokens: Token[], data: Record<string, unknown>, scope: Record<string, unknown>): ParseResult {
  let left = parseMulDiv(tokens, data, scope)
  for (;;) {
    const op = left.rest[0]
    if (op?.kind !== 'op' || ((op as { op: string }).op !== '+' && (op as { op: string }).op !== '-')) break
    const right = parseMulDiv(left.rest.slice(1), data, scope)
    left = { value: applyArithmetic((op as { op: string }).op as '+' | '-', left.value, right.value), rest: right.rest }
  }
  return left
}

function parseMulDiv(tokens: Token[], data: Record<string, unknown>, scope: Record<string, unknown>): ParseResult {
  let left = parsePrimary(tokens, data, scope)
  for (;;) {
    const op = left.rest[0]
    if (op?.kind !== 'op' || ((op as { op: string }).op !== '*' && (op as { op: string }).op !== '/')) break
    const right = parsePrimary(left.rest.slice(1), data, scope)
    left = { value: applyArithmetic((op as { op: string }).op as '*' | '/', left.value, right.value), rest: right.rest }
  }
  return left
}

function parsePrimary(tokens: Token[], data: Record<string, unknown>, scope: Record<string, unknown>): ParseResult {
  const [head, ...rest] = tokens
  if (!head) throw new Error('Unexpected end of expression')
  if (head.kind === 'number' || head.kind === 'string') return { value: head.value, rest }
  if (head.kind === 'path') {
    if (head.text === 'null') return { value: null, rest }
    const value = ExpressionService.resolvePath(head.text, data, scope)
    return { value: value ?? '', rest }
  }
  if (head.kind === 'op' && (head as { op: string }).op === '(') {
    const inner = parseConcat(rest, data, scope)
    const closer = inner.rest[0]
    if (closer?.kind !== 'op' || (closer as { op: string }).op !== ')') throw new Error('Missing closing parenthesis')
    return { value: inner.value, rest: inner.rest.slice(1) }
  }
  throw new Error(`Unexpected token "${JSON.stringify(head)}"`)
}

/**
 * Arithmetic with safe coercion. Div-by-zero yields `null`
 * (BR-004 — never `Infinity`).
 */
function applyArithmetic(op: '+' | '-' | '*' | '/', a: unknown, b: unknown): number | string | null {
  if (op === '+' && (typeof a === 'string' || typeof b === 'string')) {
    return `${a ?? ''}${b ?? ''}`
  }
  const na = toNumber(a) ?? 0
  const nb = toNumber(b) ?? 0
  switch (op) {
    case '+': return na + nb
    case '-': return na - nb
    case '*': return na * nb
    case '/': return nb === 0 ? null : na / nb
  }
}
