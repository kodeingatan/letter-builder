# Tasks — Document

## Implementation Plan

### TASK-001: Database Schema

**Description:** Create Drizzle schema for documents, document_versions, document_settings

**Affected files:**
- `app/server/database/schema.ts`
- `app/server/database/migrations/`

**Dependencies:** None

**Verification:** Migration runs

---

### TASK-002: Shared Types & Schemas

**Description:** Create types and Zod schemas for Document, DocumentVersion, DocumentSettings

**Affected files:**
- `app/shared/types/document.ts`
- `app/shared/schemas/document.ts`

**Dependencies:** TASK-001

**Verification:** Types compile

---

### TASK-003: Repository Layer

**Description:** Create DocumentRepository

**Affected files:**
- `app/server/repositories/document.repository.ts`

**Dependencies:** TASK-001, TASK-002

**Verification:** Repository methods work

---

### TASK-004: Service Layer

**Description:** Create DocumentService with generation, search, settings

**Affected files:**
- `app/server/services/document.service.ts`

**Dependencies:** TASK-003

**Verification:** Service enforces business rules

---

### TASK-005: PDF Generation

**Description:** Implement PDF generation from HTML (Puppeteer/Playwright)

**Affected files:**
- `app/server/engines/render/pdf-generator.ts`

**Dependencies:** TASK-004

**Verification:** PDF matches HTML

---

### TASK-006: API Routes

**Description:** Create Document API endpoints

**Affected files:**
- `app/server/api/documents/` (list, detail, PDF, settings)

**Dependencies:** TASK-004

**Verification:** API endpoints respond correctly

---

### TASK-007: Composable

**Description:** Create useDocument composable

**Affected files:**
- `app/app/composables/useDocument.ts`

**Dependencies:** TASK-006

**Verification:** Composable calls API correctly

---

### TASK-008: UI — Document List

**Description:** Create Documents list page with search and filters

**Affected files:**
- `app/app/pages/documents/index.vue`
- `app/app/components/document/DocumentList.vue`
- `app/app/components/document/DocumentFilters.vue`

**Dependencies:** TASK-007

**Verification:** Page renders, search works

---

### TASK-009: UI — Document Viewer

**Description:** Create document viewer with HTML rendering

**Affected files:**
- `app/app/pages/documents/[id].vue`
- `app/app/components/document/DocumentViewer.vue`

**Dependencies:** TASK-008

**Verification:** Document displayed correctly

---

### TASK-010: UI — Document Settings

**Description:** Create document settings page

**Affected files:**
- `app/app/pages/documents/settings.vue`
- `app/app/components/document/DocumentSettings.vue`

**Dependencies:** TASK-008

**Verification:** Settings can be saved

---

### TASK-011: Tests

**Description:** Write unit and integration tests

**Affected files:**
- `app/tests/unit/services/document.service.test.ts`
- `app/tests/integration/api/documents.test.ts`

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
