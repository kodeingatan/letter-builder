/**
 * Interpreter for the Expression Engine.
 * 
 * Resolves field references against a provided data context and evaluates
 * the expression in a sandboxed manner.
 */

import { MAX_EXPRESSION_LENGTH, MAX_AST_DEPTH, EVAL_TIMEOUT_MS } from './grammar'
import type { ExprNode, NumberNode, StringNode, BooleanNode, NullNode, IdentifierNode, BinaryOpNode, UnaryOpNode, IfNode } from './parser'

export interface EvalContext {
  [key: string]: any
  data?: Record<string, any>
  component?: Record<string, any>
  system?: Record<string, any>
  administration?: Record<string, any>
  user?: {
    name?: string
    username?: string
    id?: number
  }
}

export interface EvalResult {
  value: unknown
  error?: string
}

const EVAL_TIMEOUT_MS_VALUE = EVAL_TIMEOUT_MS

export function evaluate(ast: ExprNode, context: EvalContext, startAt = 0): EvalResult {
  const startTime = Date.now()
  const result = evaluateNode(ast, context, 0, startTime)
  if (Date.now() - startTime > EVAL_TIMEOUT_MS_VALUE) {
    return { value: null, error: 'TIMEOUT: Evaluation exceeded time limit' }
  }
  return result
}

function checkTimeout(startTime: number): boolean {
  return Date.now() - startTime > EVAL_TIMEOUT_MS_VALUE
}

function evaluateNode(
  node: ExprNode,
  context: EvalContext,
  depth: number,
  startTime: number
): EvalResult {
  if (depth > MAX_AST_DEPTH) {
    return { value: null, error: 'LIMIT_EXCEEDED: AST depth exceeded' }
  }
  if (checkTimeout(startTime)) {
    return { value: null, error: 'TIMEOUT: Evaluation exceeded time limit' }
  }
  if (!node) {
    return { value: null, error: 'SYNTAX_ERROR: Empty AST' }
  }

  switch (node.type) {
    case 'Number':
      return { value: (node as NumberNode).value }

    case 'String':
      return { value: (node as StringNode).value }

    case 'Boolean':
      return { value: (node as BooleanNode).value }

    case 'Null':
      return { value: null }

    case 'Identifier':
      return resolveIdentifier(node as IdentifierNode, context)

    case 'BinaryOp':
      return evaluateBinaryOp(node as BinaryOpNode, context, depth, startTime)

    case 'UnaryOp':
      return evaluateUnaryOp(node as UnaryOpNode, context, depth, startTime)

    case 'If':
      return evaluateIf(node as IfNode, context, depth, startTime)

    default:
      return { value: null, error: `SYNTAX_ERROR: Unknown node type ${(node as any).type}` }
  }
}

function resolveIdentifier(node: IdentifierNode, context: EvalContext): EvalResult {
  const path = node.parts
  let val: any = context
  let pathStr = ''

  for (let i = 0; i < path.length; i++) {
    const part = path[i]
    pathStr += i > 0 ? '.' + part : part

    if (val === null || val === undefined) {
      return { value: null, error: `UNKNOWN_REF: '${pathStr}' not found` }
    }

    // Standard property access (context contains data, component, user, etc.)
    val = val[part]
    if (val === undefined) {
      return { value: null, error: `UNKNOWN_REF: '${pathStr}' not found` }
    }
  }

  return { value: val }
}

function evaluateBinaryOp(node: BinaryOpNode, context: EvalContext, depth: number, startTime: number): EvalResult {
  const left = evaluateNode(node.left, context, depth + 1, startTime)
  if (left.error) return left

  const right = evaluateNode(node.right, context, depth + 1, startTime)
  if (right.error) return right

  const op = node.operator

  if (op === '++') {
    return { value: String(left.value) + String(right.value) }
  }

  if (op === '+') {
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      return { value: left.value + right.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: + requires numeric operands' }
  }

  if (op === '-') {
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      return { value: left.value - right.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: - requires numeric operands' }
  }

  if (op === '*') {
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      return { value: left.value * right.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: * requires numeric operands' }
  }

  if (op === '/') {
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      if (right.value === 0) {
        return { value: null, error: 'DIV_BY_ZERO: Division by zero' }
      }
      return { value: left.value / right.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: / requires numeric operands' }
  }

  if (op === '==') {
    if (left.value === null && right.value === null) return { value: true }
    if (left.value === null || right.value === null) return { value: false }
    return { value: left.value === right.value }
  }

  if (op === '!=') {
    if (left.value === null && right.value === null) return { value: false }
    if (left.value === null || right.value === null) return { value: true }
    return { value: left.value !== right.value }
  }

  if (op === '<') {
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      return { value: left.value < right.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: < requires numeric operands' }
  }

  if (op === '>') {
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      return { value: left.value > right.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: > requires numeric operands' }
  }

  if (op === '<=') {
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      return { value: left.value <= right.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: <= requires numeric operands' }
  }

  if (op === '>=') {
    if (typeof left.value === 'number' && typeof right.value === 'number') {
      return { value: left.value >= right.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: >= requires numeric operands' }
  }

  return { value: null, error: `UNKNOWN_OPERATOR: ${op}` }
}

function evaluateUnaryOp(node: UnaryOpNode, context: EvalContext, depth: number, startTime: number): EvalResult {
  const operand = evaluateNode(node.operand, context, depth + 1, startTime)
  if (operand.error) return operand

  if (node.operator === '-') {
    if (typeof operand.value === 'number') {
      return { value: -operand.value }
    }
    return { value: null, error: 'TYPE_MISMATCH: unary - requires numeric operand' }
  }

  if (node.operator === '!') {
    return { value: !operand.value }
  }

  return { value: null, error: `UNKNOWN_UNARY: ${node.operator}` }
}

function evaluateIf(node: IfNode, context: EvalContext, depth: number, startTime: number): EvalResult {
  const cond = evaluateNode(node.condition, context, depth + 1, startTime)
  if (cond.error) return cond

  if (cond.value === true || cond.value === 'true') {
    return evaluateNode(node.thenBranch, context, depth + 1, startTime)
  }
  return evaluateNode(node.elseBranch, context, depth + 1, startTime)
}
