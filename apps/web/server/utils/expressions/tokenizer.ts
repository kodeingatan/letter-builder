/**
 * Tokenizer for the Expression Engine.
 * 
 * Produces a flat token stream from an expression string.
 * Tokens carry position info for error reporting.
 */

export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'IDENTIFIER'
  | 'TRUE'
  | 'FALSE'
  | 'NULL'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'PLUS_PLUS'
  | 'EQ'
  | 'NEQ'
  | 'LT'
  | 'GT'
  | 'LTE'
  | 'GTE'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'DOT'
  | 'BANG'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  start: number
  end: number
}

const KEYWORDS: Record<string, TokenType> = {
  true: 'TRUE',
  false: 'FALSE',
  null: 'NULL',
  IF: 'IF',
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let pos = 0

  while (pos < input.length) {
    const ch = input[pos]

    // Whitespace
    if (/\s/.test(ch)) {
      pos++
      continue
    }

    // Number
    if (/\d/.test(ch)) {
      const start = pos
      let numStr = ''
      while (pos < input.length && /\d/.test(input[pos])) {
        numStr += input[pos]
        pos++
      }
      if (pos < input.length && input[pos] === '.') {
        numStr += '.'
        pos++
        while (pos < input.length && /\d/.test(input[pos])) {
          numStr += input[pos]
          pos++
        }
      }
      tokens.push({ type: 'NUMBER', value: numStr, start, end: pos })
      continue
    }

    // String
    if (ch === '"' || ch === "'") {
      const start = pos
      const quote = ch
      pos++
      let str = ''
      while (pos < input.length && input[pos] !== quote) {
        if (input[pos] === '\\' && pos + 1 < input.length) {
          pos++
          const esc = input[pos]
          switch (esc) {
            case 'n': str += '\n'; break
            case 't': str += '\t'; break
            case 'r': str += '\r'; break
            case '\\': str += '\\'; break
            case '"': str += '"'; break
            case "'": str += "'"; break
            default: str += esc
          }
          pos++
        } else {
          str += input[pos]
          pos++
        }
      }
      if (pos >= input.length) {
        throw new Error(`Unterminated string at position ${start}`)
      }
      pos++ // closing quote
      tokens.push({ type: 'STRING', value: str, start, end: pos })
      continue
    }

    // Identifier / keyword
    if (/[A-Za-z_$]/.test(ch)) {
      const start = pos
      let ident = ''
      while (pos < input.length && /[A-Za-z0-9_$]/.test(input[pos])) {
        ident += input[pos]
        pos++
      }
      const kwType = KEYWORDS[ident]
      if (kwType) {
        tokens.push({ type: kwType, value: ident, start, end: pos })
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident, start, end: pos })
      }
      continue
    }

    // Operators
    const twoChar = input.slice(pos, pos + 2)
    if (twoChar === '++') {
      tokens.push({ type: 'PLUS_PLUS', value: '++', start: pos, end: pos + 2 })
      pos += 2
      continue
    }
    if (twoChar === '==') {
      tokens.push({ type: 'EQ', value: '==', start: pos, end: pos + 2 })
      pos += 2
      continue
    }
    if (twoChar === '!=') {
      tokens.push({ type: 'NEQ', value: '!=', start: pos, end: pos + 2 })
      pos += 2
      continue
    }
    if (twoChar === '<=') {
      tokens.push({ type: 'LTE', value: '<=', start: pos, end: pos + 2 })
      pos += 2
      continue
    }
    if (twoChar === '>=') {
      tokens.push({ type: 'GTE', value: '>=', start: pos, end: pos + 2 })
      pos += 2
      continue
    }

    // Field reference delimiters {{ }}
    if (twoChar === '{{') {
      tokens.push({ type: 'LPAREN', value: '{{', start: pos, end: pos + 2 })
      pos += 2
      continue
    }
    if (twoChar === '}}') {
      tokens.push({ type: 'RPAREN', value: '}}', start: pos, end: pos + 2 })
      pos += 2
      continue
    }

    // Single-char operators
    switch (ch) {
      case '+':
        tokens.push({ type: 'PLUS', value: '+', start: pos, end: pos + 1 })
        pos++
        break
      case '-':
        tokens.push({ type: 'MINUS', value: '-', start: pos, end: pos + 1 })
        pos++
        break
      case '*':
        tokens.push({ type: 'STAR', value: '*', start: pos, end: pos + 1 })
        pos++
        break
      case '/':
        tokens.push({ type: 'SLASH', value: '/', start: pos, end: pos + 1 })
        pos++
        break
      case '<':
        tokens.push({ type: 'LT', value: '<', start: pos, end: pos + 1 })
        pos++
        break
      case '>':
        tokens.push({ type: 'GT', value: '>', start: pos, end: pos + 1 })
        pos++
        break
      case '(':
        tokens.push({ type: 'LPAREN', value: '(', start: pos, end: pos + 1 })
        pos++
        break
      case ')':
        tokens.push({ type: 'RPAREN', value: ')', start: pos, end: pos + 1 })
        pos++
        break
      case ',':
        tokens.push({ type: 'COMMA', value: ',', start: pos, end: pos + 1 })
        pos++
        break
      case '.':
        tokens.push({ type: 'DOT', value: '.', start: pos, end: pos + 1 })
        pos++
        break
      case '!':
        tokens.push({ type: 'BANG', value: '!', start: pos, end: pos + 1 })
        pos++
        break
      default:
        throw new Error(`Unexpected character '${ch}' at position ${pos}`)
    }
  }

  tokens.push({ type: 'EOF', value: '', start: pos, end: pos })
  return tokens
}