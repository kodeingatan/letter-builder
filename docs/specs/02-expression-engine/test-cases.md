# Test Cases — Expression Engine

## Unit Tests

### ExpressionParser

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-EX-001 | Parse number | "123" | Literal(123) | REQ-EX-001 |
| UT-EX-002 | Parse string | `"hello"` | Literal("hello") | REQ-EX-002 |
| UT-EX-003 | Parse variable | "nama" | Variable("nama") | REQ-EX-004 |
| UT-EX-004 | Parse binary op | "a + b" | BinaryOp(+, a, b) | REQ-EX-001 |
| UT-EX-005 | Parse precedence | "a + b * c" | Correct tree | REQ-EX-001 |
| UT-EX-006 | Parse parentheses | "(a + b) * c" | Correct tree | REQ-EX-001 |

### ExpressionEvaluator

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-EX-007 | Evaluate addition | 5 + 3 | 8 | REQ-EX-001 |
| UT-EX-008 | Evaluate multiplication | 5 * 3 | 15 | REQ-EX-001 |
| UT-EX-009 | Evaluate division | 10 / 3 | 3.333... | REQ-EX-001 |
| UT-EX-010 | Evaluate division by zero | 10 / 0 | null | BC-EX-002 |
| UT-EX-011 | Evaluate string concat | "a" + "b" | "ab" | REQ-EX-002 |
| UT-EX-012 | Evaluate comparison | 5 > 3 | true | REQ-EX-003 |
| UT-EX-013 | Evaluate logical and | true && false | false | REQ-EX-003 |
| UT-EX-014 | Evaluate undefined var | undefined_var | null | BC-EX-003 |

### VariableResolver

| ID | Test | Input | Expected | Mapped To |
|----|------|-------|----------|-----------|
| UT-VR-001 | Resolve simple variable | "nama", {nama: "Afdal"} | "Afdal" | REQ-EX-004 |
| UT-VR-002 | Resolve nested variable | "pegawai.nama", {pegawai: {nama: "Afdal"}} | "Afdal" | REQ-EX-004 |
| UT-VR-003 | Resolve undefined | "unknown", {} | null | BC-EX-003 |

## Integration Tests

| ID | Test | Steps | Expected | Mapped To |
|----|------|-------|----------|-----------|
| IT-EX-001 | Full evaluation | Parse → Resolve → Evaluate | Correct result | US-001 to US-003 |

## API Tests

| ID | Method | Path | Input | Expected Status |
|----|--------|------|-------|-----------------|
| AT-EX-001 | POST | /api/expressions/validate | Valid expression | 200 |
| AT-EX-002 | POST | /api/expressions/validate | Invalid expression | 400 |
| AT-EX-003 | POST | /api/expressions/evaluate | Valid + context | 200 |
| AT-EX-004 | POST | /api/expressions/evaluate | Missing variable | 400 |

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-EX-001 | Division by zero | Returns null |
| EC-EX-002 | Deeply nested expression | Evaluates correctly |
| EC-EX-003 | Very large numbers | Handles without overflow |
| EC-EX-004 | Special characters in strings | Escaped correctly |
