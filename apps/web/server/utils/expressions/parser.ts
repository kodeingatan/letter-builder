/**
 * AST node types for the Expression Engine interpreter.
 */

export interface AstNode {
  type: string
}

export interface NumberNode extends AstNode {
  type: 'Number'
  value: number
}

export interface StringNode extends AstNode {
  type: 'String'
  value: string
}

export interface BooleanNode extends AstNode {
  type: 'Boolean'
  value: boolean
}

export interface NullNode extends AstNode {
  type: 'Null'
}

export interface IdentifierNode extends AstNode {
  type: 'Identifier'
  name: string
  parts: string[] // dot-separated path segments: ['data', 'pegawai', 'nip']
}

export interface BinaryOpNode extends AstNode {
  type: 'BinaryOp'
  operator: string
  left: AstNode
  right: AstNode
}

export interface UnaryOpNode extends AstNode {
  type: 'UnaryOp'
  operator: '-' | '!'
  operand: AstNode
}

export interface IfNode extends AstNode {
  type: 'If'
  condition: AstNode
  thenBranch: AstNode
  elseBranch: AstNode
}

export type ExprNode =
  | NumberNode
  | StringNode
  | BooleanNode
  | NullNode
  | IdentifierNode
  | BinaryOpNode
  | UnaryOpNode
  | IfNode

export type Expr = AstNode

/**
 * Parser — recursive descent with precedence climbing.
 * 
 * Grammar:
 *   expr      → comparison
 *   comparison → concat (("==" | "!=" | "<" | ">" | "<=" | ">=") concat)*
 *   concat    → add ("++" add)*
 *   add       → mul (("+" | "-") mul)*
 *   mul       → unary (("*" | "/") unary)*
 *   unary     → ("-" | "!") unary | primary
 *   primary   → NUMBER | STRING | "true" | "false" | "null"
 *            | IDENTIFIER ("." IDENTIFIER)*
 *            | "(" expr ")"
 *            | "IF" "(" expr "," expr "," expr ")"
 */
export class Parser {
  private pos: number = 0
  private tokens: Token[]
  private depth: number = 0
  private maxDepth: number

  constructor(tokens: Token[], maxDepth: number = 20) {
    this.tokens = tokens
    this.maxDepth = maxDepth
  }

  parse(): ExprNode {
    const node = this.parseComparison()
    if (this.current().type !== 'EOF') {
      throw new SyntaxError(`Unexpected token ${this.current().type} at position ${this.current().start}`)
    }
    return node
  }

  getDepth(): number {
    return this.depth
  }

  // comparison → concat (("==" | "!=" | "<" | ">" | "<=" | ">=") concat)*
  private parseComparison(): ExprNode {
    let left = this.parseConcat()

    while (
      this.current().type === 'EQ' ||
      this.current().type === 'NEQ' ||
      this.current().type === 'LT' ||
      this.current().type === 'GT' ||
      this.current().type === 'LTE' ||
      this.current().type === 'GTE'
    ) {
      const op = this.current().value
      this.consume()
      const right = this.parseConcat()
      left = { type: 'BinaryOp', operator: op, left, right }
    }

    return left
  }

  // concat → add ("++" add)*
  private parseConcat(): ExprNode {
    let left = this.parseAdd()

    while (this.current().type === 'PLUS_PLUS') {
      this.consume()
      const right = this.parseAdd()
      left = { type: 'BinaryOp', operator: '++', left, right }
    }

    return left
  }

  // add → mul (("+" | "-") mul)*
  private parseAdd(): ExprNode {
    let left = this.parseMul()

    while (this.current().type === 'PLUS' || this.current().type === 'MINUS') {
      const op = this.current().value
      this.consume()
      const right = this.parseMul()
      left = { type: 'BinaryOp', operator: op, left, right }
    }

    return left
  }

  // mul → unary (("*" | "/") unary)*
  private parseMul(): ExprNode {
    let left = this.parseUnary()

    while (this.current().type === 'STAR' || this.current().type === 'SLASH') {
      const op = this.current().value
      this.consume()
      const right = this.parseUnary()
      left = { type: 'BinaryOp', operator: op, left, right }
    }

    return left
  }

  // unary → ("-" | "!") unary | primary
  private parseUnary(): ExprNode {
    if (this.current().type === 'MINUS' || this.current().type === 'BANG') {
      const op = this.current().type === 'BANG' ? '!' : '-'
      this.consume()
      const operand = this.parseUnary()
      return { type: 'UnaryOp', operator: op, operand }
    }
    return this.parsePrimary()
  }

  // primary → NUMBER | STRING | true/false/null | IDENTIFIER ("." IDENTIFIER)* | "(" expr ")" | IF "(" expr "," expr "," expr ")"
  private parsePrimary(): ExprNode {
    const tok = this.current()

    switch (tok.type) {
      case 'NUMBER':
        this.consume()
        return { type: 'Number', value: parseFloat(tok.value) }

      case 'STRING':
        this.consume()
        return { type: 'String', value: tok.value }

      case 'TRUE':
        this.consume()
        return { type: 'Boolean', value: true }

      case 'FALSE':
        this.consume()
        return { type: 'Boolean', value: false }

      case 'NULL':
        this.consume()
        return { type: 'Null' }

      case 'IDENTIFIER':
        return this.parseIdentifier()

      // Field reference {{ expr }}
      case 'LPAREN': {
        if (tok.value === '{{') {
          // This is a field reference delimiter, parse the inner expression
          this.consume() // consume {{
          const node = this.parseComparison()
          if (this.current().type === 'RPAREN' && this.current().value === '}}') {
            this.consume() // consume }}
            return node
          }
          throw new SyntaxError("Expected '}}' after field reference")
        }
        // Regular parentheses for grouping
        this.depth++
        if (this.depth > this.maxDepth) {
          throw new Error('MAX_DEPTH')
        }
        this.consume() // consume '('
        const node = this.parseComparison()
        if (this.current().type !== 'RPAREN') {
          throw new SyntaxError(`Expected ')' but got ${this.current().type}`)
        }
        this.consume() // consume ')'
        this.depth--
        return node
      }

      case 'IF': {
        this.consume() // consume IF
        if (this.current().type !== 'LPAREN') {
          throw new SyntaxError("Expected '(' after IF")
        }
        this.consume() // consume '('
        const condition = this.parseComparison()
        if (this.current().type !== 'COMMA') {
          throw new SyntaxError("Expected ',' after IF condition")
        }
        this.consume() // consume ','
        const thenBranch = this.parseComparison()
        if (this.current().type !== 'COMMA') {
          throw new SyntaxError("Expected ',' after IF then-branch")
        }
        this.consume() // consume ','
        const elseBranch = this.parseComparison()
        if (this.current().type !== 'RPAREN') {
          throw new SyntaxError("Expected ')' after IF else-branch")
        }
        this.consume() // consume ')'
        return { type: 'If', condition, thenBranch, elseBranch }
      }

      default:
        throw new SyntaxError(`Unexpected token ${tok.type} at position ${tok.start}`)
    }
  }

  private parseIdentifier(): IdentifierNode {
    const first = this.consume()
    const parts: string[] = [first.value]

    while (this.current().type === 'DOT') {
      this.consume() // consume '.'
      const next = this.consume()
      if (next.type !== 'IDENTIFIER') {
        throw new SyntaxError(`Expected identifier after '.', got ${next.type}`)
      }
      parts.push(next.value)
    }

    return { type: 'Identifier', name: parts[0], parts }
  }

  private current(): Token {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    const tok = this.tokens[this.pos]
    if (tok.type === 'EOF') {
      throw new SyntaxError(`Unexpected end of expression`)
    }
    this.pos++
    return tok
  }
}