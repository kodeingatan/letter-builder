# Tasks — Template

## Implementation Plan

### TASK-001: Database Schema

**Description:** Create Drizzle schema for templates, template_bindings, template_conditions

**Affected files:**
- `app/server/database/schema.ts`
- `app/server/database/migrations/`

**Dependencies:** None

**Verification:** Migration runs

---

### TASK-002: Shared Types & Schemas

**Description:** Create types and Zod schemas for Template, DataBinding, Condition

**Affected files:**
- `app/shared/types/template.ts`
- `app/shared/schemas/template.ts`

**Dependencies:** TASK-001

**Verification:** Types compile

---

### TASK-003: Repository Layer

**Description:** Create TemplateRepository

**Affected files:**
- `app/server/repositories/template.repository.ts`

**Dependencies:** TASK-001, TASK-002

**Verification:** Repository methods work

---

### TASK-004: Service Layer

**Description:** Create TemplateService with CRUD, binding management, versioning

**Affected files:**
- `app/server/services/template.service.ts`

**Dependencies:** TASK-003

**Verification:** Service enforces business rules

---

### TASK-005: API Routes

**Description:** Create Template API endpoints

**Affected files:**
- `app/server/api/templates/` (full CRUD + publish + preview + bindings)

**Dependencies:** TASK-004

**Verification:** API endpoints respond correctly

---

### TASK-006: Composable

**Description:** Create useTemplate composable

**Affected files:**
- `app/app/composables/useTemplate.ts`

**Dependencies:** TASK-005

**Verification:** Composable calls API correctly

---

### TASK-007: UI — Template List

**Description:** Create Templates list page

**Affected files:**
- `app/app/pages/templates/index.vue`
- `app/app/components/template/TemplateList.vue`

**Dependencies:** TASK-006

**Verification:** Page renders

---

### TASK-008: UI — Template Builder

**Description:** Create three-panel Template builder

**Affected files:**
- `app/app/pages/templates/[id].vue`
- `app/app/components/template/TemplateBuilder.vue`
- `app/app/components/template/TemplateCanvas.vue`
- `app/app/components/template/TemplateDataPanel.vue`
- `app/app/components/template/TemplateInsert.vue`

**Dependencies:** TASK-007

**Verification:** Builder renders, all panels work

---

### TASK-009: UI — Component Picker

**Description:** Create command palette-style component picker

**Affected files:**
- `app/app/components/template/ComponentPicker.vue`

**Dependencies:** TASK-008

**Verification:** Picker shows components, search works

---

### TASK-010: UI — Data Binding UI

**Description:** Create binding interface for component requirements

**Affected files:**
- `app/app/components/template/DataBindingPanel.vue`
- `app/app/components/template/BindingField.vue`

**Dependencies:** TASK-008

**Verification:** Bindings can be created, edited, removed

---

### TASK-011: UI — Preview Panel

**Description:** Create split-screen preview

**Affected files:**
- `app/app/components/template/TemplatePreview.vue`

**Dependencies:** TASK-008

**Verification:** Preview resolves components, shows output

---

### TASK-012: Tests

**Description:** Write unit and integration tests

**Affected files:**
- `app/tests/unit/services/template.service.test.ts`
- `app/tests/integration/api/templates.test.ts`

**Dependencies:** TASK-011

**Verification:** All tests pass

---

### TASK-013: Verification

**Description:** Run full verification

**Checks:**
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Acceptance criteria met

**Dependencies:** TASK-012

**Verification:** All checks pass
