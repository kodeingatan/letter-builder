# Tasks — Expression Engine

## Implementation Plan

### TASK-001: Tokenizer

**Description:** Implement expression tokenizer (lexer)

**Affected files:**
- `app/server/engines/expression/tokenizer.ts`

**Dependencies:** None

**Verification:** Tokenizer produces correct tokens

---

### TASK-002: Parser

**Description:** Implement expression parser (AST builder)

**Affected files:**
- `app/server/engines/expression/parser.ts`

**Dependencies:** TASK-001

**Verification:** Parser produces correct AST

---

### TASK-003: Evaluator

**Description:** Implement expression evaluator

**Affected files:**
- `app/server/engines/expression/evaluator.ts`

**Dependencies:** TASK-002

**Verification:** Evaluator produces correct results

---

### TASK-004: Variable Resolver

**Description:** Implement variable resolution from context

**Affected files:**
- `app/server/engines/expression/resolver.ts`

**Dependencies:** TASK-003

**Verification:** Variables resolved correctly

---

### TASK-005: Formatter

**Description:** Implement output formatting (numbers, dates, currency)

**Affected files:**
- `app/server/engines/expression/formatter.ts`

**Dependencies:** TASK-003

**Verification:** Formatting works correctly

---

### TASK-006: API Routes

**Description:** Create expression validation and evaluation API

**Affected files:**
- `app/server/api/expressions/validate.post.ts`
- `app/server/api/expressions/evaluate.post.ts`
- `app/server/api/expressions/resolve.post.ts`

**Dependencies:** TASK-004

**Verification:** API endpoints respond correctly

---

### TASK-007: Tests

**Description:** Write comprehensive unit tests

**Affected files:**
- `app/tests/unit/engines/expression.test.ts`

**Dependencies:** TASK-006

**Verification:** All tests pass

---

### TASK-008: Verification

**Description:** Run full verification

**Checks:**
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Acceptance criteria met

**Dependencies:** TASK-007

**Verification:** All checks pass
