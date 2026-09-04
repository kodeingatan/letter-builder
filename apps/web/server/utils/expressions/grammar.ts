/**
 * Expression Engine — Grammar Specification
 * 
 * Version 1 — Arithmetic, String Concat, Comparisons, and IF-function
 * 
 * =============================================================================
 * LEXICAL STRUCTURE
 * =============================================================================
 * 
 * Literals:
 *   - Number:  123, 3.14, -42, 0.5
 *   - String:  "hello world", 'single quotes'
 *   - Boolean: true, false
 *   - Null:    null
 * 
 * Identifiers (field references):
 *   - Simple:    nama, harga, jumlah
 *   - Nested:    data.nama, component.identitas, user.name, current_date
 * 
 * Operators (precedence low → high):
 *   1. ||         Comparison: ==, !=, <, >, <=, >=
 *   2. +          Arithmetic add / string concat (see rules)
 *   3. -          Arithmetic subtract
 *   4. *          Arithmetic multiply
 *   5. /          Arithmetic divide
 *   6. ++         String concat (coerces operands to strings)
 * 
 * =============================================================================
 * SYNTAX
 * =============================================================================
 * 
 * expr      → comparison
 * comparison → concat (("==" | "!=" | "<" | ">" | "<=" | ">=") concat)*
 * concat    → add ("++" add)*
 * add       → mul (("+" | "-") mul)*
 * mul       → unary (("*" | "/") unary)*
 * unary     → ("-" | "!") unary | primary
 * primary   → NUMBER | STRING | "true" | "false" | "null"
 *            | IDENTIFIER ("." IDENTIFIER)*
 *            | "(" expr ")"
 *            | "IF" "(" expr "," expr "," expr ")"
 * 
 * =============================================================================
 * SEMANTIC RULES
 * =============================================================================
 * 
 * BR-001: Server-side evaluation ONLY. No eval/Function constructor.
 * 
 * BR-002: Limits
 *   - Max expression length: 2000 chars
 *   - Max AST depth: 20
 *   - Evaluation timeout: 100ms
 * 
 * BR-003: + vs ++ semantics
 *   - ++  String concat: coerces both operands to string, never errors
 *   - +   Arithmetic add: both operands MUST be numbers, else TYPE_MISMATCH
 * 
 * BR-004: Division by zero → DIV_BY_ZERO structured error (not Infinity)
 * 
 * BR-005: Whitelisted context paths
 *   - current_date
 *   - user.name, user.username
 *   - administration.* (future)
 *   - data.* (user-defined data)
 *   - component.* (future)
 * 
 * BR-006: Deterministic evaluation
 *   - Same context + expression = same result
 *   - No randomness; current_date injected via context
 * 
 * =============================================================================
 * EXAMPLES
 * =============================================================================
 * 
 * Arithmetic:
 *   {{harga}} * {{jumlah}}
 *   (harga + ongkir) * 1.1
 * 
 * String concat:
 *   {{nama}} ++ " - " ++ {{jabatan}}
 *   "Prefix: " ++ {{field}}
 * 
 * Comparison:
 *   {{harga}} > 1000
 *   {{status}} == "active"
 *   {{count}} != 0
 * 
 * IF function:
 *   IF({{harga}} > 1000, "expensive", "cheap")
 *   IF({{active}} == true, {{name}}, "Guest")
 * 
 * Nested field refs:
 *   {{data.pegawai.nip}}
 *   {{component.identitas_pegawai}}
 *   {{user.name}}
 * 
 * =============================================================================
 * ERROR CODES
 * =============================================================================
 * 
 * UNKNOWN_REF     — field reference not in context or not whitelisted
 * TYPE_MISMATCH   — operator applied to incompatible types
 * DIV_BY_ZERO     — division by zero
 * SYNTAX_ERROR    — malformed expression
 * LIMIT_EXCEEDED  — expression too long or AST too deep
 * TIMEOUT         — evaluation exceeded time limit
 * 
 * =============================================================================
 * VALUE CONTRACT
 * =============================================================================
 * 
 * { value: string|number|boolean|null, error?: string }
 * 
 * If error is present, value is undefined/ignored.
 */

export const MAX_EXPRESSION_LENGTH = 2000
export const MAX_AST_DEPTH = 20
export const EVAL_TIMEOUT_MS = 100
