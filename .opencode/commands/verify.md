---
description: Verify the implementation against the task specification
---

Verify the implementation against the task specification and run all checks.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the task file path or task name.

---

# 1. Objective

Verify that the implementation satisfies the task specification — **bertindak sebagai QA engineer / tester independen**.

The goal is to answer:

> "Apakah semua User Flow telah berjalan dengan benar? Apakah semua logika (FR/BR/DR/INV/EC) berjalan benar? Apakah semua Given/When/Then PASS? Apakah tests unit/nuxt/e2e ada dan lolos serta traceable ke User Flow?"

The output is a verification report with pass/fail status for each criterion, terutama **traceability User Flow ↔ AC ↔ Test (UT/NT/E2E)**. Hasil ini dipakai oleh `/review` dan menjadi gate sebelum `DONE`.

---

# 2. Identify the Task

Determine which task to verify.

If `$ARGUMENTS` is:

- a file path (e.g., `tasks/01-migrate-admin-panel-to-nuxt.md`) → use that file
- a task number (e.g., `01`) → find matching task in `tasks/`
- a task name (e.g., `authentication`) → find matching task in `tasks/`
- empty → list available tasks and ask the user to choose

Read the identified task file completely.

---

# 3. Read Project Knowledge

Before verifying, read and understand:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

These define the standards the implementation must meet.

---

# 4. Understand Anything

If `.ua/` exists, use it to verify:

- module relationships are correct
- entity relationships are correct
- architecture boundaries are respected
- patterns are consistent

---

# 5. Verification Checklist — QA Perspective

Verify against each criterion from the task specification, **bertindak sebagai QA tester yang memverifikasi User Flow dan logika benar**.

### 5.1 Task Phase & User Flow Verification (WAJIB PERTAMA)

Identifikasi Fase:

- **FASE 1 — UI Design** (`*-ui-design.md`): verifikasi adalah **design review**, bukan code tests. Cek:
  - [ ] `## User Flow` ada (diagram, steps, alternate/error flows)
  - [ ] `## UI` 10 sub-bagian lengkap (halaman, layout, component, interaction, responsive, loading, empty, error, success, accessibility)
  - [ ] Wireframe / mockup / prototype deliverables ada (atau direncanakan dengan path jelas)
  - [ ] `## Acceptance Criteria (Design)` Given/When/Then ada dan mapping ke User Flow
  - [ ] Konsistensi dengan `docs/design-system.md` (Naive UI, Tailwind, token, `@vicons/carbon`)
  - Untuk FASE 1: lanjut ke 5.2 (convention) dan 5.7 (design verification), lewati 5.3–5.6 code tests.

- **FASE 2 — Implementation**: lanjut ke 5.2–5.7 lengkap.

Untuk FASE 2, verifikasi:

- [ ] `## User Flow` ada dan KONSISTEN dengan `tasks/NN-ui-design.md` (FASE 1) — tidak ada alur yang diubah tanpa catatan di `Penyesuaian dari design`
- [ ] `## User Flow > Flow → UI Mapping` dan `Flow → API Mapping` ada dan traceable
- [ ] Setiap `## User Flow > Steps` memiliki pasangan AC dan Test ID (lihat `## Tasks > Test Plan`)
- [ ] `## API` 8 field (route, method, request, response, validation, error, auth, authz) sesuai User Flow & UI FASE 1

### 5.2 Code Verification — Traceability ke Task File

Check that all files listed in `## Tasks` + `## Test Plan` exist:

```markdown
## Tasks (FASE 2)

### Backend → [ ] Entity, DTO, Service, API Routes, Auth
### Frontend → [ ] Pages, Components, Composables (sesuai mockup FASE 1)
### Test Plan (QA) → [ ] UT-01/UT-02, NT-01/NT-02, E2E-01/E2E-02
```

For each implemented item:

1. Read the file
2. Verify it follows project conventions (AGENTS.md — EntitySchema, plain object Service, Nitro route, Zod DTO, Naive UI direct import, `shared/types/`)
3. Verify it matches the task requirements — mapping ke `User Flow Step` / `AC` / `FR/BR/DR/INV/EC`
4. Verify it works with existing code dan TIDAK menyimpang dari mockup FASE 1 tanpa catatan

### 5.3 Convention Verification (QA Gate)

| Convention | Check | FASE |
|------------|-------|------|
| Naming | Files, functions, variables follow existing patterns | 1 & 2 |
| Structure | Files are in correct directories (`server/entities/`, `app/components/`, `tests/unit/` etc.) | 2 |
| Imports | Import paths use correct aliases `~/`, `@/`, `~~/` | 2 |
| Types | TypeScript types correct, no unnecessary `any` | 2 |
| Error handling | `createError` h3, Zod validation, `getErrorMessage` + NAlert 403 | 2 |
| Validation | Zod DTOs — sync dengan FR/BR/EC | 2 |
| Auth | JWT middleware, cookie/header | 2 |
| RBAC | Guard + Permission (method + URL pattern) | 2 |
| UI | Naive UI direct import, Tailwind utility, no `NDescriptions`, `.detail-view` | 1 & 2 |
| Design System | `naiveui-theme.ts` tokens, primary #3B82F6, Inter | 1 & 2 |

### 5.4 Integration Verification

Check that the implementation integrates (FASE 2):

1. New entities are registered in `server/utils/orm-data-source.ts` (`appEntities`)
2. New services are importable from API routes
3. New API routes are accessible (Nitro)
4. New frontend components render correctly (sesuai mockup FASE 1)
5. New stores/composables work with existing code
6. `## UI > Referensi Design` di FASE 2 benar-benar menunjuk ke `tasks/NN-ui-design.md` yang ada

### 5.5 Test Verification — QA Core (WAJIB — Bertindak sebagai QA)

Jalankan sebagai QA tester — pastikan semua User Flow berjalan benar + semua logika benar:

```bash
# From apps/web/
npm run test:unit      # Unit — UT-01/UT-02: service, DTO, domain, BR/DR/INV
npm run test:nuxt      # Nuxt — NT-01/NT-02: component render semua state
npm run test:e2e       # E2E — E2E-01/E2E-02: happy + alternate/error + permission
npm run test           # All (unit + nuxt) — regression
```

Verifikasi **traceability** (sesuai `## Tasks > Test Plan` di task file):

- [ ] **Unit**: semua UT-01/UT-02 ada, runnable, PASS — setiap FR/BR/DR/INV/EC memiliki test
- [ ] **Nuxt**: semua NT-01/NT-02 ada, PASS — setiap UI State (loading/empty/error/success/validation/permission) ter-render dan ada test
- [ ] **E2E**: semua E2E-01/E2E-02 ada, PASS — setiap User Flow step (happy + alternate + error + edge + permission 401/403) ter-cover end-to-end
- [ ] **Coverage**: User Flow steps 100%, AC Given/When/Then 100%, Business Rules 100%, Edge Cases 100% — mapping `User Flow ↔ AC ↔ Test ID` di `## Tasks > Test Plan` terpenuhi
- [ ] **Existing regression**: `npm run test` — semua test lama tetap PASS (tidak ada breaking change)
- [ ] **Baru vs lama**: file test baru mengikuti pola existing (`apps/web/tests/`), bukan pola baru yang bertentangan

Jika task adalah FASE 1 (design): tidak ada `npm run test:*` untuk design — verifikasi adalah checklist `## Verification (Design)` (design system, responsive, accessibility, user flow coverage, peer review).

### 5.6 Build Verification

```bash
# From apps/web/
npm run build         # Production build
```

Verify:

- [ ] Build completes without errors
- [ ] No TypeScript errors (`vue-tsc`)
- [ ] No import resolution errors

### 5.7 User Flow & Acceptance Verification (QA — Kapan Feature Dianggap Benar)

> Kriteria `Given/When/Then` di `## Acceptance Criteria` adalah DEFINISI "benar" menurut QA.

Untuk setiap AC-XXX:

- [ ] `Given` precondition dapat direproduksi (via test setup / seed / mock)
- [ ] `When` aksi dapat dieksekusi (via unit call / component interaction / E2E step)
- [ ] `Then` hasil dapat diverifikasi (assertion PASS)
- [ ] AC mapping ke `User Flow Step` dan ke `Test ID` (UT/NT/E2E) jelas di `## Tasks > Test Plan`

Jalankan E2E sebagai bukti utama: setiap `Given/When/Then` harus memiliki pasangan E2E step yang PASS. Jika ada AC tanpa test, FAIL.

### 5.8 Runtime Verification (Manual QA Smoke)

```bash
# From apps/web/
npm run dev           # Development server
```

Verify (FASE 2):

- [ ] Server starts without errors — tidak ada warning `orm-data-source` / `better-sqlite3` yang baru
- [ ] API endpoints respond correctly — setiap `## API > Endpoint Overview` dapat di-hit dengan token valid/invalid (401/403)
- [ ] Pages render without errors — sesuai mockup FASE 1, responsive desktop/tablet/mobile, no console error
- [ ] States ter-trigger manual: loading (delay), empty (hapus data), error (matikan API), validation (input salah), permission (role tanpa akses) — sesuai `## UI > States`

Untuk FASE 1: verifikasi adalah membuka wireframe/mockup/prototype — apakah semua User Flow steps dapat diklik tanpa dead-end, apakah semua state ada.

---

# 6. Verification Report — QA Tester Mode

Generate a verification report **seolah QA tester independen** — fokus pada User Flow + logika benar + traceability test:

````md
# Verification Report — Task NN: {Task Name} (FASE X)

## Summary

- **Status**: PASS / FAIL / PARTIAL
- **Fase**: FASE 1 — UI Design / FASE 2 — Implementation
- **Date**: {date}
- **Verified by**: /verify (QA engineer mode)
- **User Flow coverage**: {X/Y steps PASS}
- **Acceptance coverage**: {X/Y AC PASS}

## Checklist

### Phase & User Flow (WAJIB)

| Item | Status | Notes |
|------|--------|-------|
| Fase teridentifikasi | PASS/FAIL | FASE 1 / FASE 2 |
| User Flow diagram + steps ada | PASS/FAIL | {notes} |
| User Flow konsisten dengan FASE 1 (`NN-ui-design.md`) | PASS/FAIL/N/A | {notes} |
| Flow → UI mapping ada (FASE 2) | PASS/FAIL | {notes} |
| Flow → API mapping ada (FASE 2) | PASS/FAIL | {notes} |
| Setiap User Flow step ada AC + Test ID | PASS/FAIL | {coverage} |

### Code Implementation (FASE 2) / Design Deliverables (FASE 1)

| Item | Status | Notes |
|------|--------|-------|
| FASE 1: Wireframe/Mockup/Prototype | PASS/FAIL/N/A | {notes} |
| FASE 2: Entity created | PASS/FAIL/N/A | {notes} |
| Service created | PASS/FAIL/N/A | {notes} |
| API routes created | PASS/FAIL/N/A | {notes} |
| DTO created (Zod) | PASS/FAIL/N/A | {notes} |
| Frontend pages (sesuai mockup FASE 1) | PASS/FAIL/N/A | {notes} |
| Components (semua states) | PASS/FAIL/N/A | {notes} |

### Convention Compliance (QA Gate)

| Convention | Status | Notes |
|------------|--------|-------|
| Naming conventions | PASS/FAIL | {notes} |
| File structure | PASS/FAIL | {notes} |
| Import patterns (`~/`, `@/`, `~~/`) | PASS/FAIL | {notes} |
| Error handling (`createError`, Zod) | PASS/FAIL | {notes} |
| Type safety | PASS/FAIL | {notes} |
| Design System (`naiveui-theme.ts`) | PASS/FAIL | {notes} |

### Integration (FASE 2)

| Integration | Status | Notes |
|-------------|--------|-------|
| Entity registered in `orm-data-source.ts` | PASS/FAIL | {notes} |
| Service importable | PASS/FAIL | {notes} |
| API routes accessible (Nitro) | PASS/FAIL | {notes} |
| Frontend renders (sesuai mockup FASE 1) | PASS/FAIL | {notes} |
| UI referensi FASE 1 valid | PASS/FAIL | {notes} |

### Tests — QA Core (Bertindak sebagai QA Tester)

| Test Type | Status | File | Coverage | Notes |
|-----------|--------|------|----------|-------|
| Unit (UT-01/UT-02) | PASS/FAIL/SKIPPED | `tests/unit/{feature}/*.test.ts` | FR/BR/DR/INV/EC | {pass/total, coverage} |
| Nuxt (NT-01/NT-02) | PASS/FAIL/SKIPPED | `tests/nuxt/...` | UI States (loading/empty/error/success/validation/permission) | {pass/total} |
| E2E happy (E2E-01) | PASS/FAIL/SKIPPED | `tests/e2e/{feature}.spec.ts` | User Flow happy steps | {pass/total} |
| E2E alternate (E2E-02) | PASS/FAIL/SKIPPED | `tests/e2e/{feature}.alt.spec.ts` | Alternate/error/edge/permission | {pass/total} |
| Existing regression | PASS/FAIL | `npm run test` | All old tests | {pass/total} |

> Traceability WAJIB: setiap AC Given/When/Then ↔ User Flow Step ↔ Test ID harus PASS. Jika ada User Flow step tanpa E2E, FAIL.

### Acceptance — Kapan Feature Dianggap Benar (Given/When/Then)

| AC | User Flow Step | Test ID | Status | Notes |
|----|----------------|---------|--------|-------|
| AC-001 | Step 1 | E2E-01 | PASS/FAIL | {Given/When/Then lolos?} |
| AC-002 | Step 2 | NT-01/E2E-02 | PASS/FAIL | {notes} |
| AC-003 | Step ERR-01 | UT-01/E2E-02 | PASS/FAIL | {notes} |

### Build & Runtime

| Check | Status | Notes |
|-------|--------|-------|
| Typecheck (`vue-tsc`) | PASS/FAIL | {notes} |
| Production build (`npm run build`) | PASS/FAIL | {notes} |
| Dev server starts | PASS/FAIL | {notes} |
| API endpoints work (auth 401/403 + 200) | PASS/FAIL | {notes} |
| Pages render (pixel-perfect vs mockup FASE 1) | PASS/FAIL | {notes} |
| Manual QA: states, responsive, accessibility | PASS/FAIL | {notes} |

## Issues Found

### Critical (Wajib Fix — Blocker untuk DONE)

- {issue — contoh: User Flow step tanpa E2E, AC tanpa test, logic BR-001 gagal, build fail, existing test fail}

### Minor (Should Fix)

- {issue — convention, missing error handling, missing validation}

### Suggestions (Consider)

- {optional improvement — test coverage, docs}

## Verification Commands Run (QA)

```bash
npm run test:unit      # {result: X/Y PASS, coverage}
npm run test:nuxt      # {result}
npm run test:e2e       # {result: semua User Flow steps PASS?}
npm run test           # {result: regression PASS?}
npm run build          # {result}
# manual: server starts, E2E happy path playback
```

## Traceability Matrix (QA — User Flow ↔ AC ↔ Test)

| User Flow Step | AC | BR/FR/EC | Test ID | Test File | Result |
|----------------|----|----------|---------|-----------|--------|
| Step 1: Buka list | AC-001 | FR-001 | E2E-01 | `tests/e2e/...` | PASS |
| Step ERR-01: Validasi gagal | AC-004 | BR-002, EC-01 | UT-01, E2E-02 | `tests/unit/...`, `tests/e2e/...` | PASS |

> Jika ada baris dengan Test ID kosong atau Result FAIL → Status tidak boleh PASS.

## Conclusion (QA Verdict)

{ringkasan: apakah semua User Flow berjalan benar? Semua logika benar? Semua Given/When/Then PASS? Apakah siap `/review`?}

## Recommended Action

- [ ] Fix critical issues before review (User Flow tanpa test, AC gagal, logic salah, build fail)
- [ ] Proceed to /review (jika PASS)
- [ ] Task is complete (FASE 1 design DONE atau FASE 2 verified PASS)
````

---

# 7. Issue Classification

### Critical

Issues that MUST be fixed before proceeding:

- Code does not compile
- Existing tests fail
- Security vulnerabilities
- Data loss risks
- Breaking changes to existing functionality

### Minor

Issues that SHOULD be fixed but are not blocking:

- Convention violations
- Missing error handling
- Missing validation
- Missing types

### Suggestions

Optional improvements:

- Code optimization
- Additional tests
- Documentation updates

---

# 8. Auto-Fix Critical Issues

If critical issues are found:

1. Report the issue
2. Ask the user if they want to fix it
3. If yes, fix the issue
4. Re-verify

Do NOT auto-fix minor issues or suggestions.

---

# 9. Do Not

Do NOT:

- skip verification steps
- ignore failing tests
- approve code with critical issues
- modify code (except auto-fix critical issues)
- commit changes

Exception: updating `tasks/task-logs.md` per #11 IS required and allowed.

---

# 10. Final Response

After verification, return:

```text
Verification Complete

Task: tasks/NN-task-name.md
Status: PASS / FAIL / PARTIAL

Critical Issues: N
Minor Issues: N
Suggestions: N

Tests: {pass}/{total} passing
Build: PASS/FAIL

Task Logs:
- tasks/task-logs.md updated — Verified checked for this task if Status PASS, otherwise left unchecked (see #11)

Next Step:

# If PASS:
/review tasks/NN-task-name.md

# If FAIL:
Fix issues, then:
/verify tasks/NN-task-name.md
```

---

# 11. Update Task Logs (Mandatory Final Step)

After `/verify` finishes, you MUST update `tasks/task-logs.md` by checking off what has been verified.

This step is mandatory — do NOT skip it.

### 11.1 Rules

1. Read `tasks/task-logs.md`. If it does not exist → CREATE it using the template in `/gen-tasks` #23.2, then apply rule 2.
2. Update ONLY the verification tracking for the current task (`tasks/NN-task-name.md`):
   - If Status is **PASS**:
     - Overview table: set `Verified` column to `[x]` for this task row.
     - Move entry from `## Belum Diverifikasi` (`- [ ] tasks/NN-...`) to `## Sudah Diverifikasi` (`- [x] tasks/NN-... — {Task Name} — {date} by /verify — PASS`).
     - Detail per Task: set `Verified: [x] {date} by /verify — {summary: tests/build results}`.
   - If Status is **FAIL / PARTIAL**:
     - Do NOT check `[x]`. Keep `[ ]` in Overview and `Belum Diverifikasi`.
     - Detail per Task: set `Verified: [ ] {date} by /verify — FAIL/PARTIAL: {N critical, N minor — see report}`.
   - Update `## Last Updated` (`Date`, `By: /verify`, task file name).
3. Do NOT touch `Implemented` or `Reviewed` checklists — those belong to `/implement` and `/review`.
4. Do NOT reset any existing `[x]` to `[ ]`.
5. Only mark `Verified [x]` when verification genuinely PASSED (build + tests + checklist per #5).

### 11.2 Verification

Before finishing `/verify`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task `Verified` state matches verification Status (PASS → `[x]`, FAIL/PARTIAL → `[ ]`)
- [ ] Current task in correct section (Sudah vs Belum Diverifikasi)
- [ ] Implemented / Reviewed states untouched
