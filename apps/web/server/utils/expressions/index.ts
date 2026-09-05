/**
 * Expression Engine — public API.
 * 
 * Provides three core functions:
 *   - extractRefs(expression) → string[]  (extract referenced field paths)
 *   - validate(expression, sampleContext) → { valid, refs, error? }
 *   - evaluate(expression, context) → { value, error? }
 */

import { tokenize } from './tokenizer'
import { Parser, type ExprNode } from './parser'
import { evaluateAst } from './interpreter'
import type { EvalContext, EvalResult } from './interpreter'
import { MAX_EXPRESSION_LENGTH, MAX_AST_DEPTH } from './grammar'

/**
 * Parse an expression string into an AST.
 */
export function parse(expression: string): ExprNode {
  const inner = expression.trim()
  const tokens = tokenize(inner)
  const parser = new Parser(tokens, MAX_AST_DEPTH)
  return parser.parse()
}

/**
 * Strip all `{{` and `}}` field reference delimiters from an expression.
 * Returns the inner body with delimiters removed.
 * Example: "{{harga}} * {{jumlah}}" → "harga * jumlah"
 */
function unwrapExpression(expression: string): string {
  return expression.replace(/\{\{/g, '').replace(/\}\}/g, '').trim()
}

/**
 * Extract all referenced field paths from an expression.
 * Returns dot-separated paths as they appear in the expression.
 */
export function extractRefs(expression: string): string[] {
  const inner = unwrapExpression(expression)
  const refs = new Set<string>()

  try {
    const tokens = tokenize(inner)
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i]
      if (tok.type === 'IDENTIFIER') {
        // Walk forward to collect dot-separated path
        const parts = [tok.value]
        let j = i + 1
        while (j < tokens.length - 1 && tokens[j].type === 'DOT' && tokens[j + 1].type === 'IDENTIFIER') {
          parts.push(tokens[j + 1].value)
          j += 2
        }
        // Only add if this is the start of a path (not preceded by DOT)
        if (i === 0 || tokens[i - 1].type !== 'DOT') {
          refs.add(parts.join('.'))
        }
      }
    }
  } catch {
    // Syntax error → return whatever refs we collected so far
  }

  return Array.from(refs)
}

/**
 * Validate an expression against an optional sample context.
 * Returns refs even on error so editors can show what's referenced.
 */
export function validate(
  expression: string,
  sampleContext?: EvalContext
): { valid: boolean; refs: string[]; error?: string; astDepth?: number } {
  const refs = extractRefs(expression)

  if (expression.length > MAX_EXPRESSION_LENGTH) {
    return {
      valid: false,
      refs,
      error: `LIMIT_EXCEEDED: Expression exceeds maximum length of ${MAX_EXPRESSION_LENGTH} characters`,
    }
  }

  const inner = unwrapExpression(expression)
  if (!inner) {
    return { valid: false, refs, error: 'SYNTAX_ERROR: Empty expression' }
  }

  let tokens
  try {
    tokens = tokenize(inner)
  } catch (e: any) {
    return { valid: false, refs, error: `SYNTAX_ERROR: ${e?.message || 'Tokenization failed'}` }
  }

  let ast
  try {
    const parser = new Parser(tokens, MAX_AST_DEPTH)
    ast = parser.parse()
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg === 'MAX_DEPTH') {
      return {
        valid: false,
        refs,
        error: `LIMIT_EXCEEDED: Expression nesting exceeds maximum depth of ${MAX_AST_DEPTH}`,
      }
    }
    return { valid: false, refs, error: `SYNTAX_ERROR: ${msg}` }
  }

  if (sampleContext) {
    const result = evaluateAst(ast, sampleContext)
    if (result.error && result.error.startsWith('UNKNOWN_REF:')) {
      return { valid: false, refs, error: result.error }
    }
  }

  return { valid: true, refs }
}

/**
 * Evaluate an expression against the given context.
 * Returns structured result `{ value, error? }` — never throws.
 */
export function evaluate(expression: string, context: EvalContext): EvalResult {
  if (expression.length > MAX_EXPRESSION_LENGTH) {
    return { value: null, error: `LIMIT_EXCEEDED: Expression exceeds maximum length of ${MAX_EXPRESSION_LENGTH} characters` }
  }

  const inner = unwrapExpression(expression)
  if (!inner) {
    return { value: null, error: 'SYNTAX_ERROR: Empty expression' }
  }

  let tokens
  try {
    tokens = tokenize(inner)
  } catch (e: any) {
    return { value: null, error: `SYNTAX_ERROR: ${e?.message || 'Tokenization failed'}` }
  }

  let ast
  try {
    const parser = new Parser(tokens, MAX_AST_DEPTH)
    ast = parser.parse()
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg === 'MAX_DEPTH') {
      return { value: null, error: `LIMIT_EXCEEDED: Expression nesting exceeds maximum depth of ${MAX_AST_DEPTH}` }
    }
    return { value: null, error: `SYNTAX_ERROR: ${msg}` }
  }

  return evaluateAst(ast, context)
}