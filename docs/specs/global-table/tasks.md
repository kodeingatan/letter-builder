# Tasks — Global Table

## Implementation Plan

### TASK-001: Database Schema

**Description:** Create Drizzle schema for global_tables, global_table_columns, global_table_records

**Affected files:**
- `app/server/database/schema.ts`
- `app/server/database/migrations/`

**Dependencies:** None

**Verification:** Migration runs successfully, tables created

---

### TASK-002: Shared Types & Schemas

**Description:** Create TypeScript types and Zod validation schemas for Global Table, Column, Record

**Affected files:**
- `app/shared/types/global-table.ts`
- `app/shared/schemas/global-table.ts`

**Dependencies:** TASK-001

**Verification:** Types compile, Zod schemas validate correctly

---

### TASK-003: Repository Layer

**Description:** Create GlobalTableRepository, ColumnRepository, RecordRepository

**Affected files:**
- `app/server/repositories/global-table.repository.ts`
- `app/server/repositories/column.repository.ts`
- `app/server/repositories/record.repository.ts`

**Dependencies:** TASK-001, TASK-002

**Verification:** Repository methods return correct types, queries execute

---

### TASK-004: Service Layer

**Description:** Create GlobalTableService with business logic for CRUD, publishing, column management

**Affected files:**
- `app/server/services/global-table.service.ts`

**Dependencies:** TASK-003

**Verification:** Service enforces business rules (uniqueness, required columns, publish constraints)

---

### TASK-005: API Routes — Collection CRUD

**Description:** Create API routes for collection management

**Affected files:**
- `app/server/api/collections/index.get.ts`
- `app/server/api/collections/index.post.ts`
- `app/server/api/collections/[id].get.ts`
- `app/server/api/collections/[id].put.ts`
- `app/server/api/collections/[id].delete.ts`
- `app/server/api/collections/[id].publish.post.ts`
- `app/server/api/collections/[id].archive.post.ts`

**Dependencies:** TASK-004

**Verification:** API endpoints respond with correct status codes and data

---

### TASK-006: API Routes — Column Management

**Description:** Create API routes for column CRUD and reorder

**Affected files:**
- `app/server/api/collections/[id]/columns/index.post.ts`
- `app/server/api/collections/[id]/columns/[columnId].put.ts`
- `app/server/api/collections/[id]/columns/[columnId].delete.ts`
- `app/server/api/collections/[id]/columns/reorder.put.ts`

**Dependencies:** TASK-005

**Verification:** Column endpoints respond correctly

---

### TASK-007: API Routes — Record Management

**Description:** Create API routes for record CRUD with search, sort, pagination

**Affected files:**
- `app/server/api/collections/[id]/records/index.get.ts`
- `app/server/api/collections/[id]/records/index.post.ts`
- `app/server/api/collections/[id]/records/[recordId].put.ts`
- `app/server/api/collections/[id]/records/[recordId].delete.ts`

**Dependencies:** TASK-005

**Verification:** Record endpoints respond correctly, search/sort/pagination work

---

### TASK-008: Composable

**Description:** Create useCollection composable for frontend data management

**Affected files:**
- `app/app/composables/useCollection.ts`

**Dependencies:** TASK-005, TASK-006, TASK-007

**Verification:** Composable calls API correctly, manages state

---

### TASK-009: UI — Collection List Page

**Description:** Create Collections list page with table, search, empty state

**Affected files:**
- `app/app/pages/collections/index.vue`
- `app/app/components/collection/CollectionList.vue`

**Dependencies:** TASK-008

**Verification:** Page renders, shows empty state, lists collections

---

### TASK-010: UI — Collection Workspace

**Description:** Create Collection workspace page with tabs (Records, Columns, Settings)

**Affected files:**
- `app/app/pages/collections/[id].vue`
- `app/app/components/collection/CollectionWorkspace.vue`
- `app/app/components/collection/RecordsTab.vue`
- `app/app/components/collection/ColumnsTab.vue`
- `app/app/components/collection/SettingsTab.vue`

**Dependencies:** TASK-009

**Verification:** Tabs work, records table renders, column list renders

---

### TASK-011: UI — Column Builder

**Description:** Create column add/edit form with progressive disclosure per type

**Affected files:**
- `app/app/components/collection/ColumnBuilder.vue`
- `app/app/components/collection/ColumnForm.vue`
- `app/app/components/collection/type-config/`

**Dependencies:** TASK-010

**Verification:** Column form renders, type-specific config appears, validation works

---

### TASK-012: UI — Record Form

**Description:** Create dynamic record form generated from column definitions

**Affected files:**
- `app/app/components/collection/RecordForm.vue`
- `app/app/components/collection/RecordDrawer.vue`

**Dependencies:** TASK-010

**Verification:** Form renders per column type, validation works, save works

---

### TASK-013: Tests

**Description:** Write unit and integration tests for services, repositories, API

**Affected files:**
- `app/tests/unit/services/global-table.service.test.ts`
- `app/tests/integration/api/collections.test.ts`

**Dependencies:** TASK-012

**Verification:** All tests pass

---

### TASK-014: Verification

**Description:** Run full verification pipeline

**Checks:**
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Acceptance criteria met

**Dependencies:** TASK-013

**Verification:** All checks pass
