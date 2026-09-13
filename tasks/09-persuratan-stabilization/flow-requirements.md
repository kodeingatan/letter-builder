## User Flow

### Diagram
```text
[Audit tasks 05-07] -> [Fix errors] -> [Tambah E2E Playwright] -> [Implement UI improvements] -> [Resolusi conflict] -> [Re-verify all]
```

### Steps
| Step | Actor | Aksi | Halaman/API | Hasil |
|------|-------|------|-------------|-------|
| 1 | QA/Dev | Audit task 05-07 | Semua task | Audit report |
| 2 | Dev | Fix errors | Kode terkait | Fixes applied |
| 3 | Dev | Tambah Playwright E2E | test/e2e/persuratan/ | E2E PASS |
| 4 | Dev | Implement UI improvements | Pages/components | UI sesuai wireframe |
| 5 | Dev | Resolusi token conflict | AGENTS.md | #0075de |
| 6 | QA | Re-verify semua | Semua test | PASS |

### Alternate & Error Flows
| ID | Skenario | Penanganan |
|----|----------|------------|
| ALT-01 | Bug kritis | Fix prioritas |
| ERR-01 | UI improvements break existing | Regression test, rollback |

## Requirements

### Tujuan Fitur
- REQ-G01: Task 05-07 stabil (0 error build, 0 test gagal)
- REQ-G02: E2E Playwright lengkap untuk persuratan
- REQ-G03: UI konsisten design-system

### Users / Actors
| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Dev | Audit + fix + implement | FASE 2 |
| QA | Verify + E2E | FASE 2 |
| Reviewer | Approve | FASE 2 |

### Functional Requirements
- FR-001: Build task 05-07 = 0 error
- FR-002: E2E Playwright persuratan (CRUD)
- FR-003: UI sesuai wireframe FASE 1
- FR-004: AGENTS.md token = #0075de

### Business Rules
- BR-001: Tidak ada fitur baru di FASE 2 persuratan
- BR-002: E2E standalone (proper config)

### Edge Cases
| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Tidak ada error | Langsung ke Step 3 | Step 1 |
