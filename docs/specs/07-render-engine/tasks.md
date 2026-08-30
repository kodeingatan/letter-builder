# Tasks — Render Engine

## Implementation Plan

### TASK-001: Content Parser

**Description:** Parse Tiptap document model into renderable nodes

**Affected files:**
- `app/server/engines/render/parser.ts`

**Dependencies:** None

**Verification:** Parser produces correct node tree

---

### TASK-002: Token Resolver

**Description:** Resolve dynamic tokens in content

**Affected files:**
- `app/server/engines/render/token-resolver.ts`

**Dependencies:** TASK-001

**Verification:** Tokens resolved correctly

---

### TASK-003: Component Renderer

**Description:** Render Component blocks with bound data

**Affected files:**
- `app/server/engines/render/component-renderer.ts`

**Dependencies:** TASK-002

**Verification:** Components rendered correctly

---

### TASK-004: Loop Expander

**Description:** Expand loop blocks with data iteration

**Affected files:**
- `app/server/engines/render/loop-expander.ts`

**Dependencies:** TASK-003

**Verification:** Loops expanded correctly

---

### TASK-005: Condition Evaluator

**Description:** Evaluate condition blocks

**Affected files:**
- `app/server/engines/render/condition-evaluator.ts`

**Dependencies:** TASK-002

**Verification:** Conditions evaluated correctly

---

### TASK-006: HTML Assembler

**Description:** Assemble final HTML output

**Affected files:**
- `app/server/engines/render/html-assembler.ts`

**Dependencies:** TASK-003, TASK-004, TASK-005

**Verification:** HTML output is valid

---

### TASK-007: PDF Generator

**Description:** Generate PDF from HTML using Puppeteer/Playwright

**Affected files:**
- `app/server/engines/render/pdf-generator.ts`

**Dependencies:** TASK-006

**Verification:** PDF matches HTML

---

### TASK-008: Render Service

**Description:** Create high-level render service

**Affected files:**
- `app/server/services/render.service.ts`

**Dependencies:** TASK-006, TASK-007

**Verification:** Service orchestrates rendering

---

### TASK-009: API Routes

**Description:** Create render preview and generate API

**Affected files:**
- `app/server/api/render/preview.post.ts`
- `app/server/api/render/generate.post.ts`

**Dependencies:** TASK-008

**Verification:** API endpoints respond correctly

---

### TASK-010: Tests

**Description:** Write comprehensive unit and integration tests

**Affected files:**
- `app/tests/unit/engines/render.test.ts`
- `app/tests/integration/api/render.test.ts`

**Dependencies:** TASK-009

**Verification:** All tests pass

---

### TASK-011: Verification

**Description:** Run full verification

**Checks:**
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Acceptance criteria met

**Dependencies:** TASK-010

**Verification:** All checks pass
