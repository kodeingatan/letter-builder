## Acceptance Criteria

### AC-001 — Audit task 05-07 selesai
Given tasks 05-07 berada dalam status DONE, When audit build, UT, NT, E2E, dan manual QA selesai, Then audit report tersedia di verification.md.

### AC-002 — Errors diperbaiki
Given audit findings tersedia, When fixes diterapkan, Then build dan UT/NT PASS dengan 0 error.

### AC-003 — E2E Playwright persuratan ditambah
Given E2E persuratan memiliki test yang dibatalkan karena browser/infra, When Playwright E2E standalone ditambahkan, Then document, master data, dan template CRUD dapat diuji tanpa browser dependency manual.

### AC-004 — UI improvements diimplement
Given wireframe FASE 1 disetujui, When komponen dan halaman produksi diimplement, Then tampilan konsisten dengan design-system Notion-calm.

### AC-005 — Token conflict resolved
Given AGENTS.md memakai #3B82F6 dan design-system.md memakai #0075de, When keputusan resmi ditetapkan, Then sumber token didokumentasikan dan implementasi mengikuti keputusan tersebut.

## Tasks

### Backend
- [ ] Audit services task 05 (expression, renderer, PDF)
- [ ] Audit services task 06 (master DDL/data)
- [ ] Audit services task 07 (converter, template, version, category, permission)

### Frontend
- [ ] Audit pages dan components task 06
- [ ] Audit pages dan components task 07
- [ ] Implement UI improvements dari wireframe FASE 1

### Cross-Cutting
- [ ] Tambah Playwright E2E (`test/e2e/persuratan/`)
- [ ] Pastikan Playwright dapat dijalankan melalui script project
- [ ] Resolve dan dokumentasikan token conflict
- [ ] Dokumentasikan cross-document conflict (PRD vs tasks 05-07)

## Test Plan
| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | existing test files | Audit backend 05-07 | Step 1 |
| UT-02 | Unit | existing test files | Audit frontend 06-07 | Step 1 |
| E2E-01 | E2E | test/e2e/persuratan/document.spec.ts | Document CRUD | Step 3 / AC-003 |
| E2E-02 | E2E | test/e2e/persuratan/master-data.spec.ts | Master Data CRUD | Step 3 / AC-003 |
| E2E-03 | E2E | test/e2e/persuratan/template.spec.ts | Template CRUD | Step 3 / AC-003 |
| VT-01 | Visual | Wireframe vs UI | AC-004 | Step 4 |
| VT-02 | Configuration | AGENTS.md | AC-005 | Step 5 |
