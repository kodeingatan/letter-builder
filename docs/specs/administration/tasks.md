# Tasks — Administration

## Implementation Plan

### TASK-001: Database Schema

**Description:** Create Drizzle schema for administrations, steps, instances, instance_steps

**Affected files:**
- `app/server/database/schema.ts`
- `app/server/database/migrations/`

**Dependencies:** None

**Verification:** Migration runs

---

### TASK-002: Shared Types & Schemas

**Description:** Create types and Zod schemas for Administration, Step, Instance, InstanceStep

**Affected files:**
- `app/shared/types/administration.ts`
- `app/shared/schemas/administration.ts`

**Dependencies:** TASK-001

**Verification:** Types compile

---

### TASK-003: Repository Layer

**Description:** Create AdministrationRepository

**Affected files:**
- `app/server/repositories/administration.repository.ts`

**Dependencies:** TASK-001, TASK-002

**Verification:** Repository methods work

---

### TASK-004: Service Layer

**Description:** Create AdministrationService with CRUD, step management, instance lifecycle

**Affected files:**
- `app/server/services/administration.service.ts`

**Dependencies:** TASK-003

**Verification:** Service enforces business rules

---

### TASK-005: API Routes

**Description:** Create Administration API endpoints (full CRUD + execute + approve + reject + instances)

**Affected files:**
- `app/server/api/administrations/` (full CRUD + publish + execute)
- `app/server/api/instances/` (approve + reject + details)

**Dependencies:** TASK-004

**Verification:** API endpoints respond correctly

---

### TASK-006: Composable

**Description:** Create useAdministration composable

**Affected files:**
- `app/app/composables/useAdministration.ts`

**Dependencies:** TASK-005

**Verification:** Composable calls API correctly

---

### TASK-007: UI — Administration List

**Description:** Create Administrations list page

**Affected files:**
- `app/app/pages/administrations/index.vue`
- `app/app/components/administration/AdministrationList.vue`

**Dependencies:** TASK-006

**Verification:** Page renders

---

### TASK-008: UI — Administration Builder

**Description:** Create three-panel Administration builder with flow diagram

**Affected files:**
- `app/app/pages/administrations/[id].vue`
- `app/app/components/administration/AdministrationBuilder.vue`
- `app/app/components/administration/ProcessFlow.vue`
- `app/app/components/administration/StepList.vue`
- `app/app/components/administration/StepProperties.vue`

**Dependencies:** TASK-007

**Verification:** Builder renders, flow shows

---

### TASK-009: UI — Instance Tracking

**Description:** Create instance list and detail pages

**Affected files:**
- `app/app/pages/instances/index.vue`
- `app/app/pages/instances/[id].vue`
- `app/app/components/instance/InstanceList.vue`
- `app/app/components/instance/InstanceDetail.vue`
- `app/app/components/instance/StepProgress.vue`

**Dependencies:** TASK-008

**Verification:** Instance tracking works

---

### TASK-010: UI — Execution Form

**Description:** Create data input form for workflow execution

**Affected files:**
- `app/app/components/instance/ExecutionForm.vue`
- `app/app/components/instance/DataInput.vue`

**Dependencies:** TASK-009

**Verification:** Data input works, validation enforced

---

### TASK-011: Tests

**Description:** Write unit and integration tests

**Affected files:**
- `app/tests/unit/services/administration.service.test.ts`
- `app/tests/integration/api/administrations.test.ts`

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
