# Tasks — Component

## Implementation Plan

### TASK-001: Database Schema

**Description:** Create Drizzle schema for components, component_requirements, component_versions

**Affected files:**
- `app/server/database/schema.ts`
- `app/server/database/migrations/`

**Dependencies:** None

**Verification:** Migration runs successfully

---

### TASK-002: Shared Types & Schemas

**Description:** Create TypeScript types and Zod schemas for Component, DataRequirement

**Affected files:**
- `app/shared/types/component.ts`
- `app/shared/schemas/component.ts`

**Dependencies:** TASK-001

**Verification:** Types compile

---

### TASK-003: Repository Layer

**Description:** Create ComponentRepository

**Affected files:**
- `app/server/repositories/component.repository.ts`

**Dependencies:** TASK-001, TASK-002

**Verification:** Repository methods work

---

### TASK-004: Service Layer

**Description:** Create ComponentService with CRUD, versioning, publish logic

**Affected files:**
- `app/server/services/component.service.ts`

**Dependencies:** TASK-003

**Verification:** Service enforces business rules

---

### TASK-005: API Routes

**Description:** Create Component API endpoints

**Affected files:**
- `app/server/api/components/` (index, [id], publish, preview)

**Dependencies:** TASK-004

**Verification:** API endpoints respond correctly

---

### TASK-006: Composable

**Description:** Create useComponent composable

**Affected files:**
- `app/app/composables/useComponent.ts`

**Dependencies:** TASK-005

**Verification:** Composable calls API correctly

---

### TASK-007: UI — Component List

**Description:** Create Components list page

**Affected files:**
- `app/app/pages/components/index.vue`
- `app/app/components/component/ComponentList.vue`

**Dependencies:** TASK-006

**Verification:** Page renders, lists components

---

### TASK-008: UI — Component Builder

**Description:** Create three-panel builder with Tiptap canvas

**Affected files:**
- `app/app/pages/components/[id].vue`
- `app/app/components/component/ComponentBuilder.vue`
- `app/app/components/component/ComponentCanvas.vue`
- `app/app/components/component/ComponentProperties.vue`
- `app/app/components/component/ComponentInsert.vue`

**Dependencies:** TASK-007

**Verification:** Builder renders, canvas works, properties work

---

### TASK-009: UI — Dynamic Token System

**Description:** Create Tiptap extension for dynamic tokens

**Affected files:**
- `app/app/components/document/tiptap/DynamicToken.ts`
- `app/app/components/document/tiptap/DynamicTokenNode.vue`

**Dependencies:** TASK-008

**Verification:** Tokens insert, render as chips, are editable

---

### TASK-010: UI — Requirements Panel

**Description:** Create data requirements panel with add/edit/remove

**Affected files:**
- `app/app/components/component/RequirementsPanel.vue`
- `app/app/components/component/RequirementForm.vue`

**Dependencies:** TASK-008

**Verification:** Requirements can be managed, match tokens

---

### TASK-011: Tests

**Description:** Write unit and integration tests

**Affected files:**
- `app/tests/unit/services/component.service.test.ts`
- `app/tests/integration/api/components.test.ts`

**Dependencies:** TASK-010

**Verification:** All tests pass

---

### TASK-012: Verification

**Description:** Run full verification

**Checks:**
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Acceptance criteria met

**Dependencies:** TASK-011

**Verification:** All checks pass
