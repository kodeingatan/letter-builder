import { describe, it, expect } from 'vitest'
import { tokenize } from '../../../../server/utils/expressions/tokenizer'
import { Parser } from '../../../../server/utils/expressions/parser'
import { evaluate, extractRefs, validate, type EvalContext, parse } from '../../../../server/utils/expressions'
import { MAX_EXPRESSION_LENGTH } from '../../../../server/utils/expressions/grammar'

describe('tokenizer', () => {
  it('tokenizes basic numbers', () => {
    const tokens = tokenize('42')
    expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '42' })
  })

  it('tokenizes decimals', () => {
    const tokens = tokenize('3.14')
    expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '3.14' })
  })

  it('tokenizes strings', () => {
    const tokens = tokenize('"hello world"')
    expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello world' })
  })

  it('tokenizes single-quoted strings', () => {
    const tokens = tokenize("'single'")
    expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'single' })
  })

  it('tokenizes string escapes', () => {
    const tokens = tokenize('"hello\\nworld"')
    expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello\nworld' })
  })

  it('tokenizes identifiers and keywords', () => {
    const tokens = tokenize('nama data true false null IF')
    expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'nama' })
    expect(tokens[1]).toMatchObject({ type: 'IDENTIFIER', value: 'data' })
    expect(tokens[2]).toMatchObject({ type: 'TRUE' })
    expect(tokens[3]).toMatchObject({ type: 'FALSE' })
    expect(tokens[4]).toMatchObject({ type: 'NULL' })
    expect(tokens[5]).toMatchObject({ type: 'IF' })
  })

  it('tokenizes operators', () => {
    const tokens = tokenize('+ - * / ++ == != < > <= >= ( ) , .')
    const types = tokens.map(t => t.type)
    expect(types).toEqual([
      'PLUS', 'MINUS', 'STAR', 'SLASH', 'PLUS_PLUS', 'EQ', 'NEQ',
      'LT', 'GT', 'LTE', 'GTE', 'LPAREN', 'RPAREN', 'COMMA', 'DOT', 'EOF'
    ])
  })

  it('throws on unexpected character', () => {
    expect(() => tokenize('@')).toThrow()
  })

  it('throws on unterminated string', () => {
    expect(() => tokenize('"unterminated')).toThrow()
  })
})

describe('parser', () => {
  const parseAll = (input: string) => {
    const tokens = tokenize(input)
    return new Parser(tokens).parse()
  }

  it('parses a number', () => {
    const ast = parseAll('42')
    expect(ast.type).toBe('Number')
  })

  it('parses a string', () => {
    const ast = parseAll('"hello"')
    expect(ast.type).toBe('String')
  })

  it('parses a boolean true', () => {
    const ast = parseAll('true')
    expect(ast.type).toBe('Boolean')
    expect(ast.value).toBe(true)
  })

  it('parses a boolean false', () => {
    const ast = parseAll('false')
    expect((ast as any).value).toBe(false)
  })

  it('parses null', () => {
    const ast = parseAll('null')
    expect(ast.type).toBe('Null')
  })

  it('parses simple identifier', () => {
    const ast = parseAll('nama')
    expect(ast.type).toBe('Identifier')
  })

  it('parses nested identifier', () => {
    const ast = parseAll('data.pegawai.nip')
    expect(ast.type).toBe('Identifier')
    const parts = (ast as any).parts
    expect(parts).toEqual(['data', 'pegawai', 'nip'])
  })

  it('parses arithmetic with precedence', () => {
    const ast = parseAll('2 + 3 * 4')
    expect(ast.type).toBe('BinaryOp')
    expect(ast.operator).toBe('+')
    expect(ast.left.type).toBe('Number')
    expect(ast.right.type).toBe('BinaryOp')
    expect(ast.right.operator).toBe('*')
  })

  it('parses multiplication and division left-associative', () => {
    const ast = parseAll('10 / 2 * 3')
    expect(ast.type).toBe('BinaryOp')
    expect(ast.operator).toBe('*')
    expect(ast.left.operator).toBe('/')
  })

  it('parses parenthesized expressions', () => {
    const ast = parseAll('(2 + 3) * 4')
    expect(ast.type).toBe('BinaryOp')
    expect(ast.operator).toBe('*')
    expect(ast.left.type).toBe('BinaryOp')
    expect(ast.left.operator).toBe('+')
  })

  it('parses unary minus', () => {
    const ast = parseAll('-5')
    expect(ast.type).toBe('UnaryOp')
    expect(ast.operator).toBe('-')
    expect(ast.operand.type).toBe('Number')
  })

  it('parses logical NOT', () => {
    const ast = parseAll('!true')
    expect(ast.type).toBe('UnaryOp')
    expect(ast.operator).toBe('!')
  })

  it('parses string concat', () => {
    const ast = parseAll('"a" ++ "b"')
    expect(ast.type).toBe('BinaryOp')
    expect(ast.operator).toBe('++')
  })

  it('parses concat with lower precedence than add', () => {
    const ast = parseAll('1 + 2 ++ "x"')
    expect(ast.type).toBe('BinaryOp')
    expect(ast.operator).toBe('++')
    expect(ast.left.type).toBe('BinaryOp')
    expect(ast.left.operator).toBe('+')
  })

  it('parses IF function', () => {
    const ast = parseAll('IF(true, 1, 2)')
    expect(ast.type).toBe('If')
  })

  it('parses comparisons', () => {
    const tokens = tokenize('10 > 5')
    const ast = new Parser(tokens).parse()
    expect(ast.type).toBe('BinaryOp')
    expect(ast.operator).toBe('>')
  })

  it('throws on missing closing paren', () => {
    expect(() => parseAll('(2 + 3')).toThrow()
  })

  it('throws on trailing tokens', () => {
    expect(() => parseAll('1 2')).toThrow()
  })
})

describe('extractRefs', () => {
  it('extracts simple identifier', () => {
    expect(extractRefs('nama')).toEqual(['nama'])
  })

  it('extracts nested identifiers', () => {
    expect(extractRefs('data.pegawai.nip')).toEqual(['data.pegawai.nip'])
  })

  it('extracts multiple refs in expression', () => {
    expect(extractRefs('{{harga}} * {{jumlah}}')).toEqual(['harga', 'jumlah'])
  })

  it('extracts refs from concat', () => {
    const refs = extractRefs('{{nama ++ " - " ++ jabatan}}')
    expect(refs.sort()).toEqual(['jabatan', 'nama'])
  })

  it('extracts refs from IF', () => {
    const refs = extractRefs('IF({{active}} == true, {{name}}, "Guest")')
    expect(refs.sort()).toEqual(['active', 'name'])
  })

  it('handles system refs', () => {
    expect(extractRefs('{{current_date}}')).toEqual(['current_date'])
  })
})

describe('validate', () => {
  it('validates a simple arithmetic expression', () => {
    const result = validate('{{harga}} * {{jumlah}}')
    expect(result.valid).toBe(true)
  })

  it('validates with double curly braces', () => {
    expect(validate('{{ harga * jumlah }}').valid).toBe(true)
  })

  it('rejects expression exceeding max length', () => {
    const longExpr = 'x'.repeat(MAX_EXPRESSION_LENGTH + 1)
    expect(validate(longExpr).valid).toBe(false)
    expect(validate(longExpr).error).toContain('LIMIT_EXCEEDED')
  })

  it('rejects empty expression', () => {
    expect(validate('').valid).toBe(false)
  })

  it('rejects syntax error', () => {
    expect(validate('1 +').valid).toBe(false)
    expect(validate('1 +').error).toContain('SYNTAX_ERROR')
  })

  it('validates with sample context returns refs', () => {
    const result = validate('{{nama}} ++ " - "', { nama: 'Afdal' })
    expect(result.valid).toBe(true)
    expect(result.refs).toContain('nama')
  })
})

describe('evaluate', () => {
  const context: EvalContext = {
    harga: 20000,
    jumlah: 3,
    nama: 'Afdal',
    jabatan: 'Programmer',
    user: { name: 'Afdal', username: 'afdal' },
  }

  it('AC-001: arithmetic multiplication', () => {
    const result = evaluate('{{harga}} * {{jumlah}}', context)
    expect(result.value).toBe(60000)
    expect(result.error).toBeUndefined()
  })

  it('AC-002: string concat with ++', () => {
    const result = evaluate('{{nama ++ " - " ++ jabatan}}', context)
    expect(result.value).toBe('Afdal - Programmer')
  })

  it('evaluates addition', () => {
    const result = evaluate('{{10 + 5}}', context)
    expect(result.value).toBe(15)
  })

  it('evaluates subtraction', () => {
    const result = evaluate('{{10 - 3}}', context)
    expect(result.value).toBe(7)
  })

  it('evaluates division', () => {
    const result = evaluate('{{10 / 2}}', context)
    expect(result.value).toBe(5)
  })

  it('evaluates unary minus', () => {
    const result = evaluate('{{-5}}', context)
    expect(result.value).toBe(-5)
  })

  it('evaluates negation of number', () => {
    const result = evaluate('{{-(3 + 2)}}', context)
    expect(result.value).toBe(-5)
  })

  it('evaluates NOT', () => {
    const result = evaluate('{{!true}}', context)
    expect(result.value).toBe(false)
  })

  it('evaluates comparison ==', () => {
    expect(evaluate('{{3 == 3}}', context).value).toBe(true)
    expect(evaluate('{{3 == 4}}', context).value).toBe(false)
  })

  it('evaluates comparison !=', () => {
    expect(evaluate('{{3 != 4}}', context).value).toBe(true)
    expect(evaluate('{{3 != 3}}', context).value).toBe(false)
  })

  it('evaluates comparison <', () => {
    expect(evaluate('{{2 < 3}}', context).value).toBe(true)
    expect(evaluate('{{3 < 2}}', context).value).toBe(false)
  })

  it('evaluates comparison >', () => {
    expect(evaluate('{{3 > 2}}', context).value).toBe(true)
  })

  it('evaluates comparison <=', () => {
    expect(evaluate('{{2 <= 2}}', context).value).toBe(true)
    expect(evaluate('{{1 <= 2}}', context).value).toBe(true)
    expect(evaluate('{{3 <= 2}}', context).value).toBe(false)
  })

  it('evaluates comparison >=', () => {
    expect(evaluate('{{2 >= 2}}', context).value).toBe(true)
    expect(evaluate('{{3 >= 2}}', context).value).toBe(true)
    expect(evaluate('{{1 >= 2}}', context).value).toBe(false)
  })

  it('evaluates IF function true branch', () => {
    expect(evaluate('{{IF(3 > 2, "yes", "no")}}', context).value).toBe('yes')
  })

  it('evaluates IF function false branch', () => {
    expect(evaluate('{{IF(1 > 2, "yes", "no")}}', context).value).toBe('no')
  })

  it('evaluates with nested field refs', () => {
    const ctx: EvalContext = { data: { pegawai: { nip: '123' } } }
    expect(evaluate('{{data.pegawai.nip}}', ctx).value).toBe('123')
  })

  it('AC-003: unknown ref returns UNKNOWN_REF error', () => {
    const result = evaluate('{{nonexistent}}', { other: 1 })
    expect(result.error).toContain('UNKNOWN_REF')
  })

  it('AC-004: division by zero returns DIV_BY_ZERO', () => {
    const result = evaluate('{{1 / 0}}', context)
    expect(result.error).toContain('DIV_BY_ZERO')
  })

  it('AC-005: expression too long returns LIMIT_EXCEEDED', () => {
    const result = evaluate('x'.repeat(MAX_EXPRESSION_LENGTH + 1), context)
    expect(result.error).toContain('LIMIT_EXCEEDED')
  })

  it('++ always coerces to string', () => {
    const result = evaluate('{{1 ++ 2}}', context)
    expect(result.value).toBe('12')
  })

  it('+ with non-number returns TYPE_MISMATCH', () => {
    const result = evaluate('{{"a" + 1}}', context)
    expect(result.error).toContain('TYPE_MISMATCH')
  })

  it('handles string literals with curly braces syntax', () => {
    const result = evaluate('{{"hello"}}', context)
    expect(result.value).toBe('hello')
  })

  it('handles IF in full expression', () => {
    const result = evaluate('{{IF(true, 1, 2)}}', { harga: 0, jumlah: 0 })
    expect(result.value).toBe(1)
  })
})

describe('parse', () => {
  it('can parse a simple expression', () => {
    const ast = parse('1 + 2')
    expect(ast.type).toBe('BinaryOp')
    expect(ast.operator).toBe('+')
  })
})

describe('validate', () => {
  it('rejects expressions with constructor payload', () => {
    const result = validate('new Function("alert(1)")')
    expect(result.valid).toBe(false)
  })
})