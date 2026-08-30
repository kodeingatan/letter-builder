# Tasks — [Feature Name]

## Implementation Plan

### TASK-001: Database Schema

**Description:** Create database tables and migrations

**Affected files:**
- `app/server/database/schema.ts`
- `app/server/database/migrations/`

**Dependencies:** None

**Verification:** Migration runs successfully

---

### TASK-002: Shared Types

**Description:** Create TypeScript types and Zod schemas

**Affected files:**
- `app/shared/types/[feature].ts`
- `app/shared/schemas/[feature].ts`

**Dependencies:** TASK-001

**Verification:** Types compile without errors

---

### TASK-003: Repository

**Description:** Create data access layer

**Affected files:**
- `app/server/repositories/[feature].repository.ts`

**Dependencies:** TASK-001, TASK-002

**Verification:** Repository methods return correct types

---

### TASK-004: Service

**Description:** Create business logic layer

**Affected files:**
- `app/server/services/[feature].service.ts`

**Dependencies:** TASK-003

**Verification:** Service enforces business rules

---

### TASK-005: API Routes

**Description:** Create server API endpoints

**Affected files:**
- `app/server/api/[feature]/index.get.ts`
- `app/server/api/[feature]/index.post.ts`
- `app/server/api/[feature]/[id].get.ts`
- `app/server/api/[feature]/[id].put.ts`
- `app/server/api/[feature]/[id].delete.ts`

**Dependencies:** TASK-004

**Verification:** API endpoints respond correctly

---

### TASK-006: Composable

**Description:** Create frontend data composable

**Affected files:**
- `app/app/composables/use[Feature].ts`

**Dependencies:** TASK-005

**Verification:** Composable calls API correctly

---

### TASK-007: UI Components

**Description:** Create UI components

**Affected files:**
- `app/app/components/[feature]/[Component].vue`

**Dependencies:** TASK-006

**Verification:** Components render correctly

---

### TASK-008: Pages

**Description:** Create page routes

**Affected files:**
- `app/app/pages/[feature]/index.vue`
- `app/app/pages/[feature]/[id].vue`

**Dependencies:** TASK-007

**Verification:** Pages navigate correctly

---

### TASK-009: Tests

**Description:** Write unit and integration tests

**Affected files:**
- `app/tests/unit/[feature]/[test].test.ts`
- `app/tests/integration/[feature]/[test].test.ts`

**Dependencies:** TASK-008

**Verification:** All tests pass

---

### TASK-010: Verification

**Description:** Run full verification

**Checks:**
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Acceptance criteria met

**Dependencies:** TASK-009

**Verification:** All checks pass
