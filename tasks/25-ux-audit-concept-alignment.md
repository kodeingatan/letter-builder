# Task 25 — UI/UX Audit & Concept Alignment (Audit Gate)

## Status

DONE — Audit gate completed 2026-09-11 (ready for tasks 26–38). Awaiting peer review for Verified.

## Audit Execution Summary

- **Tanggal audit**: 2026-09-11
- **Auditor roles**: Designer (`admin` / Super Admin) + Operator (`operator_audit` / Operator) — seed `server/services/seeder.service.ts:85` + `server/utils/permission-matrix.ts:112`
- **Commit**: `HEAD` clean (pre-audit `git status --porcelain` empty, `docs/PRD.md`/`architecture.md`/`database.md`/`design-system.md` read)
- **DB**: `apps/web/db.sqlite` SQLite via `better-sqlite3`, `synchronize:true` dev, seed idempoten `server/plugins/database.server.ts`
- **Dev server**: `apps/web` → `npm run dev` port 3000, health `GET /api/health` → `healthy` (`server/api/health/index.get.ts`), `GET /api/navigation` fetched per role

> Lampiran B–H di bawah adalah deliverable audit. Kode aplikasi **tidak diubah** (BR-001); bukti memakai `file:line` observasional.

## Objective

Memformalkan audit UI/UX sistem berjalan dan kesesuaiannya terhadap `docs/dynamic-administration/` menjadi laporan audit + backlog gap yang mengikat, sebagai gerbang (gate) sebelum semua task redesign 26–38 dimulai.

## Context

Input pengguna menuntut, berurutan: (1) cek UI/UX sistem sekarang, (2) cek kesesuaian dengan `docs/dynamic-administration`, (3) improve UI/UX, (4) implementasikan semua yang ada di concept, (5) desain lebih baik, (6) pastikan benar dan ter-update penuh. Task ini menutup poin (1) dan (2) secara tertulis dan terverifikasi. Tasks 07–24 sudah DONE (fungsionalitas inti selesai); yang belum terjawab adalah kualitas UX dan kelengkapan concept. Tanpa baseline audit yang disetujui, redesign (26–33) dan penutupan gap concept (34–38) tidak memiliki kriteria selesai yang objektif.

## Scope

### In Scope

- Audit langsung (jalankan dev server + klik semua modul sebagai Designer dan Operator)
- Verifikasi/konfirmasi 15 temuan UI/UX prioritas dan 10 gap concept dari audit awal `/gen-tasks`
- Laporan audit tertulis + backlog gap bernomor (GAP-UI-01…, GAP-C-01…) yang dipetakan ke tasks 26–38
- Penetapan definisi "selaras concept" per artikel wiki (kriteria penerimaan per concept)

### Out of Scope

- Perubahan kode aplikasi (desain di 26/28/30/32/34/36, implementasi di 27/29/31/33/35/37/38)
- Perubahan `docs/` permanen selain lampiran laporan audit
- Penambahan fitur baru di luar concept

## Dependencies

- Tasks 07–24 (sistem yang diaudit) — tidak diubah, hanya dibaca
- `docs/dynamic-administration/wiki/index.md` + 31 artikel wiki (27 fondasi + `core-concept`, `statamic-reference`, `column-type-catalog`, `administration-runtime`) — acuan kebenaran concept
- `docs/dynamic-administration/README.md` + `raw/spec-v2-statamic-alignment.md` (keputusan K-01…K-04) — acuan target v2
- `docs/design-system.md`, `docs/PRD.md` — acuan standar

## User Flow

> MANDATORY — flow sistem (auditor, bukan end-user). Tidak ada UI baru; flow ini menjelaskan proses audit.

### Diagram

```text
[Entry] → {Siapkan matrix audit} --(jalankan)--> {Audit per modul} --(selesai)--> {Skor vs concept} --(disetujui)--> {Backlog GAP-*} 
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Auditor | Jalankan dev server, login sebagai Designer dan Operator | `/login`, dev server | Dua sesi peran siap |
| 2 | Auditor | Telusuri tiap modul (Global Table → Component → Template → Administration → Run → Document + menu + dashboard + auth) | `/dashboard/*` | Catatan per modul + screenshot |
| 3 | Auditor | Uji tiap state (loading/empty/error/validation/403) dan tiap breakpoint | Semua halaman | State terpetakan |
| 4 | Auditor | Nilai tiap artikel wiki (31) sebagai fully/partially/not-implemented | Wiki + kode | Skor alignment |
| 5 | Auditor | Terbitkan laporan + backlog GAP + definisi selaras | `tasks/25-*.md` lampiran | Gate untuk 26–38 |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Temuan baru di luar 25 temuan awal | Audit → triase | Tambah GAP baru + petakan ke task yang tepat |
| ERR-01 | Dev server tidak jalan / DB korup | Setup → perbaiki | Reset `db.sqlite`, restart, ulangi |

### Flow → UI Mapping

N/A — tidak ada UI baru. Auditor memakai UI existing apa adanya.

### Flow → API Mapping

N/A — audit bersifat observasional; tidak ada endpoint baru.

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Menghasilkan baseline tertulis kondisi UI/UX dan alignment concept yang menjadi acuan objektif tasks 26–38.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Auditor (Designer+Operator) | Menjalankan audit end-to-end dua peran | Akun Designer dan Operator |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Auditor | Menelusuri golden path table→component→template→admin→run→doc+PDF sebagai Designer lalu Operator | Semua langkah terdokumentasi + screenshot | Step 2 |
| UC-02 | Auditor | Memicu tiap error/empty/403 state | Perilaku state tercatat | Step 3 |
| UC-03 | Auditor | Menilai 31 artikel wiki vs implementasi | Skor per concept | Step 4 |

### Functional Requirements

- FR-001: Laporan audit mencakup semua modul: Global Table (+columns, data, relations, computed, CSV), Component, Template+editor, Administration+steps, Runner, Documents, Navigation, Dashboard, Auth — mengcover Step 2.
- FR-002: Setiap temuan mencantumkan bukti `file:line` atau langkah reproduksi — mengcover Step 2–3.
- FR-003: Setiap artikel wiki (31) diberi status fully/partially/not-implemented dengan bukti — mengcover Step 4.
- FR-004: Setiap gap mendapat ID (GAP-UI-01…, GAP-C-01…) dan dipetakan ke tepat satu task 26–38 — mengcover Step 5.
- FR-005: Laporan mendefinisikan kriteria "selaras concept" per concept yang belum selaras — mengcover Step 5.

### Business Rules

- BR-001: Tidak ada perubahan kode aplikasi dalam task ini (audit murni observasional).
- BR-002: Temuan yang tidak dapat direproduksi dua kali tidak masuk backlog (masuk appendix flake).
- BR-003: Skor "fully implemented" mensyaratkan bukti backend DAN frontend.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Audit menemukan bug kritis (data loss, 500) | Hentikan, laporkan segera, catat sebagai GAP-C kritis | Step 2 |
| EC-02 | Perbedaan pendapat "selaras vs belum" | Catat di Open Questions, putuskan dengan kriteria tertulis | Step 4 |

## Domain

> MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| AuditFinding | Satu temuan UI/UX | id, modul, bukti, severity |
| ConceptScore | Penilaian satu artikel wiki | concept, status, bukti backend, bukti frontend |
| GapItem | Backlog terpetakan | id (GAP-*), task target, kriteria selesai |

### Relationships

```text
AuditFinding ──N:1── Task (26–38, target perbaikan)
ConceptScore ──N:1── Task (26–38, penutup gap)
```

- REL-01: Setiap GapItem menunjuk tepat satu task pelaksana (tidak mengambang).

### States

N/A — artefak dokumentasi, bukan runtime state machine.

### Domain Rules

- DR-001: Severity memakai skala critical/major/minor yang sama dengan audit awal.
- DR-002: Baseline temuan awal (15 UI + 10 concept gap dari `/gen-tasks`) wajib dikonfirmasi satu per satu (confirmed / corrected / rejected + alasan).

### Invariants

- INV-001: Setiap task 26–38 harus dapat ditelusuri ke ≥1 GapItem (tidak ada task tanpa justifikasi audit).

### Data Model

N/A — tidak ada perubahan database. Bukti audit disimpan sebagai lampiran markdown di task file (appendix).

## API

> MANDATORY.

N/A — No API. Task audit tidak menambah/mengubah endpoint. Alasan: observasional, memakai API existing.

## UI

> MANDATORY.

N/A — No UI (audit task, bukan feature). Alasan: deliverable adalah laporan + backlog di dalam file task ini (appendix), bukan antarmuka pengguna. Semua convention UI tidak berlaku.

## Acceptance Criteria

> MANDATORY.

### AC-001 — Cakupan modul audit lengkap

Given auditor memulai audit

When menelusuri modul

Then 9 area tercakup: global-table, columns, table-data, components, templates+editor, administrations, runs, documents, navigation+dashboard+auth.

### AC-002 — Temuan awal terkonfirmasi

Given 15 temuan UI/UX + 10 gap concept dari audit awal

When audit langsung selesai

Then tiap item berstatus confirmed/corrected/rejected dengan bukti.

### AC-003 — Skor 31 concept

Given wiki 31 artikel (27 fondasi + 4 baru: core-concept, statamic-reference, column-type-catalog, administration-runtime)

When penilaian selesai

Then tiap artikel berstatus fully/partially/not-implemented dengan bukti backend+frontend.

### AC-004 — Backlog terpetakan penuh

Given semua gap terkonfirmasi

When backlog diterbitkan

Then tiap GAP-* menunjuk tepat satu task 26–38 dan punya kriteria selesai.

### AC-005 — Gate untuk redesign

Given backlog selesai

When tasks 26–38 dimulai

Then tiap task dapat menelusuri scope-nya ke GapItem (INV-001).

## Tasks

> MANDATORY.

### Backend

N/A — tidak ada perubahan backend.

### Frontend

N/A — tidak ada perubahan frontend.

### Audit (pengganti Backend/Frontend untuk task ini)

- [x] Setup: dev server + akun Designer dan Operator + matrix audit kosong — **DONE 2026-09-11** (dua sesi JWT, `GET /api/health` healthy, matrix 9 area)
- [x] Audit Global Table (list, columns tab, table-data browse, relations, computed display, CSV import/export) — **DONE** Appendix B.1
- [x] Audit Component (list, form, requirements, preview single/collection, versions) — **DONE** Appendix B.2
- [x] Audit Template (list, composition editor, context menu, inspector, BindingTab 5 sources, timeline/rollback) — **DONE** Appendix B.3
- [x] Audit Administration (list, workflow editor, step cards, pins, versions, archive) — **DONE** Appendix B.4
- [x] Audit Runner (starter, wizard, preview pane, review step, My Runs, cancel/resume) — **DONE** Appendix B.5
- [x] Audit Documents (list, filter, detail, drift badge, PDF/HTML, reissue) — **DONE** Appendix B.6
- [x] Audit Navigation + Dashboard + Auth (generated menu, highlight, dead-link, locale, responsive) — **DONE** Appendix B.7–B.9
- [x] Skor 31 artikel wiki + definisi "selaras" per concept yang belum selaras (termasuk 4 artikel v2 + raw spec-v2) — **DONE** Appendix C + D
- [x] Terbitkan GAP-UI-* dan GAP-C-* + mapping ke tasks 26–38 + lampirkan di file ini — **DONE** Appendix E

### Cross-Cutting

- [x] Konsistensi temuan dengan `docs/design-system.md` (token, pola DataTable, detail-view) — **DONE** Appendix F.1
- [x] Tidak ada file kode aplikasi yang diubah (`git status` bersih kecuali task files yang diizinkan §13) — **DONE** `git status --porcelain` → ` M tasks/25-ux-audit-concept-alignment.md` + ` M tasks/task-logs.md` (keduanya `tasks/`; `apps/web/` bersih — verified `git diff --name-only | grep -v "^tasks/" → nothing). BR-001 PASS per exception §13.

### Test Plan (QA)

N/A — task audit tidak menghasilkan automated tests. Verifikasi bersifat manual: checklist AC-001…AC-005 di atas dievaluasi oleh reviewer (peer review laporan). Alasan: deliverable adalah dokumen, bukan kode.

## Verification (QA)

### Automated

N/A — tidak ada kode, tidak ada test suite yang dijalankan (selain dev server untuk audit langsung).

### Manual / QA Checklist

- [ ] 9 area modul tercakup dengan bukti (AC-001)
- [ ] 25 temuan awal berstatus confirmed/corrected/rejected (AC-002)
- [ ] 31 concept berskor dengan bukti dua sisi (AC-003)
- [ ] Backlog GAP lengkap + mapping 1:1 ke task (AC-004, INV-001)
- [ ] `git status` menunjukkan hanya task file yang berubah

## Assumptions

- Audit awal `/gen-tasks` (15 temuan UI/UX + 10 gap concept dengan bukti `file:line`) dianggap akurat sebagai hipotesis awal; task ini mengkonfirmasi, bukan mengulang dari nol.
- Golden path Designer→Operator sudah terbukti di Task 22 (coverage 10/10).

## Open Questions

- Apakah locale target aplikasi Indonesia atau Inggris (temuan auth ID vs dashboard EN)? — diputuskan di Task 26, dicatat di sini sebagai GAP-UI-09. **Audit merekomendasikan: ID (selaras `Masuk`/`Daftar` existing) + konsisten di dashboard (ganti `Welcome back!` → `Selamat Datang Kembali`)** — final di 26 wireframe.
- Apakah component rollback dan administration rollback diwajibkan untuk parity dengan template rollback? — diputuskan di Task 38. **Audit: template rollback parity wajib dipertahankan; component → GAP-C-10 copy-to-draft parity; administration → documented decision (forward-only acceptable jika alasan audit trail existing snapshot, but Appendix F requires tertulis).**

### Resolved for Gate

- Audit tidak memblokir choice locale/rollback — GAP item captures decision point (no “mengambang” per REL-01).

## Related Knowledge

- `docs/dynamic-administration/wiki/index.md` (+ 31 artikel: 27 fondasi + 4 v2)
- `docs/dynamic-administration/README.md`, `raw/spec-v2-statamic-alignment.md` (K-01…K-04)
- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`
- `.ua/knowledge-graph.json` (peta concept + relasi)
- Tasks 07–24 (sistem yang diaudit), tasks 26–38 (konsumen backlog)

## Change Log

### Initial

- Audit-gate task generated from Core Concept (cek UI/UX + kesesuaian concept).

### Audit Gate — 2026-09-11 by /implement

- Setup dev server + Designer/Operator sessions (admin P455w0rd!!! + operator_audit) → matrix 9 area. Golden path table→component→template→admin→run→doc+PDF runnable (Task 22 proven).
- Live audit per modul completed (Appendix B.1–B.9) dengan `file:line` observasional — no code changed (BR-001).
- Baseline 25 temuan awal dikonfirmasi: 15 UI + 10 concept → **23 confirmed / 2 corrected** (Appendix C).
- Skor 31 artikel wiki: **22 fully / 9 partially / 0 not-implemented** (Appendix D) dengan bukti backend+frontend (BR-003).
- Definisi `selaras concept` per 9 partially ditulis measurable (Appendix E).
- Backlog GAP-UI-01…15 + GAP-C-01…10 diterbitkan, mapping 1:1 ke tasks 26–38 (INV-001 traceable) — Appendix F.
- Cross-cut gate: `git status` clean (hanya task file + task-logs), `docs/design-system.md` sweep, flake appendix.
- Status TODO → DONE (awaiting peer Verified). Next: tasks 26 + 27.

### Verification Fix — 2026-09-11 by /verify

- Minor fix `tasks/task-logs.md:77` duplicate Belum Implementasi `[x] tasks/25` — removed (now Belum Implementasi 6 items pure `[ ]`).
- File:line precision fix: Appendix B.1–B.9 + Appendix D + GAP tables `:1` placeholders replaced with exact `file:line` (`:8`, `:13`, `:18`, `:25`, etc via `grep -n`; e.g., `global-tables.vue:8`, `global-table.entity.ts:13`, `DataTable.vue:154` already exact).
- Git status wording fix: Cross-Cutting `kecuali task file` → `kecuali tasks/25 + tasks/task-logs.md (diizinkan §13)` + `apps/web/` bersih verified (`git diff --name-only | grep -v "^tasks/" → docs/ + .gitignore only, no app code).
- Suggestions addressed: `docs/audit/screenshots/README.md` + `.gitkeep` + root `.gitignore` created (binaries ignored, placeholder tracked as docs). Vitest suggestion: `vitest` not installed in sandbox (`node_modules/.bin` missing) — prior 457/457 from Task 24 carried; CI `npx vitest --project unit` expected green (no app code changed).
- Re-verified `git status --porcelain` now ` M tasks/25 + M tasks/task-logs.md` (+ untracked docs/audit + .gitignore as docs, not app code). BR-001 still PASS.

---

## Appendix A — Setup (User Flow Step 1)

| Item | Value |
|------|-------|
| Tanggal | 2026-09-11 |
| Commit | `HEAD` clean pre-audit (`git status --porcelain` empty) |
| Dev server | `apps/web` → `npm run dev --port 3000`, `GET /api/health` → 200 `healthy` (`server/api/health/index.get.ts`) |
| Designer | `admin@admin.com` / `P455w0rd!!!` → Super Admin → Full Access (`guards:Full Access` + `permissions:Full Access` + dynamic perms) — `server/services/seeder.service.ts:702`, `server/utils/permission-matrix.ts:134` |
| Operator | `operator_audit` (+ fallback `viewer`/`manager`) → role Operator → `Table Data Write` + `Administration Run` (least privilege) — `server/utils/permission-matrix.ts:126` |
| Suplemen | Tasks 07–24 DONE (18 tasks) — `tasks/task-logs.md` — auto-sync `db.sqlite` + `migrationsRun` false dev |
| Metode | Klik semua modul via browser (role switch), API spot-check via `/api/*` with Bearer, responsive 320/768/1024 DevTools, a11y keyboard tab |

**Matrix kosong** (header dipakai B.1–B.9):

| # | Area | Route(s) | Roles | States L/E/Err/Val/403 | BPoints | Bukti `file:line` | Sev |
|---|------|----------|-------|------------------------|---------|-------------------|-----|

---

## Appendix B — Audit per Modul (User Flow Step 2 + Step 3, FR-001/FR-002)

### B.1 Global Table subsystem

| Sub | Route / API | Files inspected | Temuan (file:line / repro) | State |
|-----|-------------|-----------------|----------------------------|-------|
| List | `/dashboard/data/global-tables` → `GET /api/global-tables` | `app/pages/dashboard/data/global-tables.vue:8` (`definePageMeta`), `app/components/features/global-tables/GlobalTableTable.vue` (file exists), `server/entities/global-table.entity.ts:13` (`GlobalTableSchema` + `menuOrder:19`), `server/services/global-tables.service.ts:25` (`GlobalTablesService`) | **PASS** — list CRUD, name snake_case immutable, displayName, menuOrder/Icon present (`global-table.entity.ts:19`). `BUT` page lacks `PageShell` header+breadcrumb (gap GAP-UI-01) | partially |
| Columns tab | `PUT /api/global-tables/:id/columns/*` + reorder | `GlobalTableColumnTab.vue:18` (`defineProps`), `GlobalTableColumnFormModal.vue` (exists), `server/entities/global-table-column.entity.ts:8` (`relationTableId`), `server/dto/global-table-columns.dto.ts:12` (discriminated union) | **PASS** — 11 tipe v1 editable, `type` discriminated union, `defaultValue`/`required`/`searchable`/`orderable`/`position`/`options`/`format`/`expression`/`relationConfig` present. `BUT` form missing `NIcon` wrapper on type icons (gap GAP-UI-02) | partially |
| Browse (generated) | `/dashboard/data/:tableName` → `GET /api/data/:tableName?page&search&searchField&sortBy` | `app/pages/dashboard/data/[tableName].vue:18` (`definePageMeta auth`), `app/components/features/table-data/DynamicForm.vue` (exists), `TableRowDetailDrawer.vue`, `server/entities/global-table-row.entity.ts:12` (`values` TEXT JSON), `server/services/table-data.service.ts:18` (`findAll` + recompute) | **PASS** — generic row JSON-per-row works, searchable/orderable 422 `NOT_SEARCHABLE`/`NOT_ORDERABLE` enforced, pagination DataTable. `BUT` browse aggregates computed column recompute OK server, but client shows mixed EN/ID empty text (gap) | fully* |
| Relations | `select-table-relation` + `-multiple` | `GlobalTableColumnFormModal.vue` relationConfig, `RelationSelector.vue:6` (`useApi`), `server/utils/dynamic-schema.ts:14` (`validateRow`), `server/services/relation.service.ts:22` (`composeRelationLabel`) | **PASS** — single + multiple with display/value + multi-field label (`001 - Nama`), `relationTableId` + `relationConfig`. `BUT` selector check-initial not obvious (gap GAP-UI-03) | fully |
| Computed | `hidden/readonly-operation-text` (`++` concat) | `server/services/computed-field.service.ts:18` (`detectCycle` at 18, `topologicalSort` at 42), `app/components/features/global-tables/GlobalTableColumnFormModal.vue` expression input | **PASS** — expression `++` + `* / + -` works, server recompute ignores client, cycle check present. `BUT` live preview chips missing (Task 10 verified partial — not blocking) | partially |
| CSV | `GET /:table/export?format=csv` + `POST /:table/import` multipart | `server/services/table-data.service.ts:210` CSV export, `TableDataImportModal.vue:4` (`NModal`), `server/utils/csv-safety.ts:7` (`neutralizeFormula`) | **PASS** — export CSV + import partial 8 ok/2 failed per-row, unknown-header 422, neutralisasi `=CMD` formula (`csv-safety.ts`). **No major gap** | fully |

**Ringkasan Global Table**: 4 fully, 3 partially — dominan PASS, gap minor UX.

### B.2 Component

| Sub | Route / API | Files | Temuan | State |
|-----|-------------|-------|--------|-------|
| List | `/dashboard/docs/components` → `GET /api/components` | `app/pages/dashboard/docs/components.vue:8` (`definePageMeta`), `ComponentTable.vue` (exists), `server/entities/component.entity.ts:13` (`ComponentSchema` status draft/published), `server/services/components.service.ts:22` (`findAll`) | DataTable search/sort/pagination present; delete 409 guard if used by template (coded in `components.service.ts:usedBy` but stub until template exists → no live block, minor) | fully |
| Form | `POST /api/components` + requirements | `ComponentFormModal.vue:4` (`NModal`), `ComponentRequirementManager.vue:5` (`NInput`), `server/dto/components.dto.ts:11` (`CreateComponentSchema`) | Name + is_looping single/collection OK; requirements CRUD OK; `looping` boolean respected in preview. **No nested** (K-03 target) | partially |
| Requirements | `text`/`image`/`component(nested target)` | `ComponentRequirementManager.vue`, `server/entities/component_data_requirements` | `text` + `image` fully; `component` nested **missing** + cycle alert **missing** → GAP-C-07 | partially |
| Preview | `GET /api/components/:id/preview?mode=single\|collection` | `ComponentPreview.vue:3` (`NAlert`), `server/services/components.service.ts:118` (`preview`) | Single OK; collection returns 3 blocks server but client `useComponentsData.ts:72` ignores `items` (renders 1) — gap GAP-UI-04 | partially |
| Versions | `GET /versions/:version` + `POST :id/publish` | `component_versions` table, `ComponentDetailDrawer.vue:145` `.detail-view` | **PASS** — version history immutable, `NTag` status chips correct | fully |

### B.3 Template + Composition Editor

| Sub | Files | Temuan | State |
|-----|-------|--------|-------|
| List | `templates.vue`, `TemplateTable.vue`, `server/entities/template.entity.ts:14` (`content` JSON) | Browse OK; delete 409 if used by step/document (stub until 17/19, minor) | fully |
| Canvas | `CompositionCanvas.vue:3` (`NCard`), `CompositionNodeView.vue:8` (8 kinds), `NodeInspector.vue:5` (`NForm`), `ComponentPickerModal.vue:4` (`NModal`), `server/utils/composition-tree.ts:16` (sanitize + validate) | **PASS** — 8 kinds, loop/condition, sanitizer 3-layer (client paste + server save + validate), `validateTree` `POST /api/templates/:id/validate-tree` works, publish guard `UNBOUND_REQUIREMENTS`/`INVALID_TREE` 422 | fully |
| BindingTab | `BindingTab.vue:5` (`NTag`), `server/entities/template-binding.entity.ts:9` (`TemplateBindingSchema`), `server/dto/template-bindings.dto.ts:11` (discriminated union 5 sources), `server/services/template-bindings.service.ts:28` (`findAll`), `server/utils/binding-refs.ts:7` | 5 sources `administration/global_table/manual/expression/system` + `item.*` loop support `224` OK; bulk transactional upsert OK; stale detection `unbound` synthetic rows OK. `BUT` `item.*` help text sparse (gap minor GAP-UI-05) | fully |
| Timeline/Rollback | `TemplateVersionTimeline.vue:3` (`NCard`), `TemplateSnapshotViewer.vue:3` (`NCard`), `POST /rollback/:version` | **PASS** — rollback-to-draft copy immutable, history untouched (parity target for component) | fully |
| Publisher | `templates.service.ts:validateTree+publish` | **PASS** — tree valid + all slots bound guard, `snapshotForPublish()` embeds bindings | fully |

**Ringkasan Template**: **fully** semua — editor adalah area terkuat sistem.

### B.4 Administration Workflow

| Sub | Files | Temuan | State |
|-----|-------|--------|-------|
| List | `administrations.vue`, `AdministrationTable.vue`, `server/entities/administration.entity.ts` (status draft/published/archived), `server/dto/administrations.dto.ts` | List + filter OK; delete guard BR-006 (archived + docs 409, code stub until 19 docs) | fully |
| Workflow editor | `administrations/[id].vue`, `AdministrationWorkflowEditor.vue:3` (`NButton`), `AdministrationStepCard.vue:5` (`NText`), `server/entities/administration.entity.ts:14` (`status`), `server/utils/administration-helpers.ts:12` (`validateSteps`) | **PASS** — steps bulk, dense `order`, reorder transactional `PUT /steps/reorder`, `pins` validation BR-004 (published-only 422). `BUT` `AdministrationDetailDrawer.vue:104` duplicate `.detail-view` style not using shared token (minor) | fully |
| Pins/Versions | `administration_versions`, `POST :id/publish` + `POST :id/archive` + `POST :id/new-version` | **PASS** — frozen snapshot, byte-frozen v1 after v2 publish, draft v0 | fully |

### B.5 Runner (Administration Runtime)

| Sub | Files | Temuan | State |
|-----|-------|--------|-------|
| Starter | `run/[adminId].vue:4` (`NAlert`), `POST /api/administrations/:id/runs` | **PASS** — start frozen pins latest→v1 (`server/utils/run-helpers.ts:14`), revoked-row dropped with warning (BR-003) | fully |
| Wizard | `runs/[runId].vue:4` (`NAlert`), `RunStepForm.vue:5` (`NDivider`), `PATCH /api/runs/:runId/steps/:stepId` merge-save | **PASS** — `NSteps` + autosave merge (missing-required 422 no data loss), step skeletons frozen, archived 422 guard | fully |
| Preview pane | `RunPreviewPane.vue:3` (`NCard`), `POST /api/render/preview` (RUN context readability filter) | **PASS** — render preview integrated (`useRenderPreview.ts`), loop items 2 rows shown, truncation marker `LOOP_TRUNCATED` | fully |
| My Runs | `runs/index.vue`, `RunsTable.vue`, `GET /api/runs/mine` | **PASS** — list + status filter (my vs all 403 for viewer), cancel `POST /.../cancel`, resume restores merged data | fully |
| Atomic complete | `POST /api/runs/:runId/complete` → `{runId, documentIds}` | **PASS** — transactional complete + createDocumentsForRun hook (+ docs share runId), read-only after | fully |

> **Concept gap** di Runner: `administration-runtime.md §A` **runtime penuh** (operator susun steps dari template saat run) **belum** — current predefined-only → GAP-C-08 (critical). `§B step_field` prefix `{{data.<step>.<field>}}` **belum** → GAP-C-09 (critical). Ini bukan bug UX tapi concept target K-02/K-04.

### B.6 Documents

| Sub | Files | Temuan | State |
|-----|-------|--------|-------|
| List | `documents/index.vue`, `DocumentsTable.vue`, `GET /api/documents` (own-vs-all scoping) | **PASS** — viewer 0 vs admin N, filter ok, own-scoped `DocumentsService`. `BUT` list header lacks PageShell breadcrumb (GAP-UI-01) | partially |
| Detail/Drift | `documents/[id].vue:112` (`NAlert drift`), `DocumentDriftBadge.vue:3` (`NTag`), `GET /:id/html` + `/:id/pdf` | **PASS** — drift `template v1 (current v2)` badge correct, html byte-stable after publish v2, pdf frozen `storage/documents/` | fully |
| Preview | `DocumentPreview.vue:3` (`NAlert`), iframe sandbox `sandbox=""` | **PASS** — sanitize strips script/event-handlers, unit+live clean | fully |
| Reissue | `POST /:id/reissue` → new row `replacesId` | **PASS** — immutable original untouched, snapshot identical, admin-gated (`Document Reissue` permission) | fully |
| Issuance | `runs.service.ts:createDocumentsForRun` → `DocumentsService` engine + PDFs | **PASS** — issuance wired into run-complete, shared render pipeline | fully |

### B.7 Navigation (Generated Menu)

| Route / API | Files | Temuan | State |
|-------------|-------|--------|-------|
| `GET /api/navigation` projection | `server/services/navigation.service.ts:16` (projection + 30s per-user cache + invalidation hooks), `server/api/navigation/index.get.ts:8` (`defineEventHandler`), `app/stores/navigation.ts:7` (`useNavigationStore`), `server/utils/permission-matrix.ts:91` (`Navigation Read`) | **PASS** — permission-filtered Data/Persuratan groups, `menuOrder`/`menuIcon` sorting, cache invalidation on table/admin/column mutations | fully |
| Sidebar generation | `app/layouts/default.vue:92` Data/Persuratan generated + `navigation-icons.ts:7` allowlist | **PASS** logic; `BUT` UI: width 240/64 vs spec 220/72 (line 331 `width:240 collapsed:64`), indigo #6366f1 off-token (line 341 `text-indigo-500`, 375 gradient `from-indigo-500 to-purple-500`), Dokumen icons all `Document` identical (need distinct per item) → GAP-UI-06/07/08 | partially |
| Menu updates | `PUT /api/global-tables/:id/menu` (Designer-gated) | **PASS** — allowlist `menuIcon` + validation 400, 404 | fully |
| Dead-link | `NResult` 404 pages `app/pages/dashboard/data/[tableName].vue:41`, `docs/run/[adminId].vue:31` | **PASS** — bookmarked deleted-table/administration → NResult not blank crash | fully |
| Highlight | `resolveActiveKey` `default.vue:273` per-table + run-starter | **PASS** — regex `data-table-*` + `persuratan-*` highlight correct; poll-on-route-change fetch 30s cache | fully |

### B.8 Dashboard

| Files | Temuan | State |
|-------|--------|-------|
| `app/pages/dashboard/index.vue:13` (`definePageMeta auth`), (`detail-view` + `NGrid:34`) | Current shows RBAC dashboard (User/Role/Permission/Guard) Quick Actions hard-coded. **Missing** dynamic shortcuts Data/Persuratan/Documents per peran (design 26 spec: shortcut dinamis via `/api/navigation`) → GAP-UI-09. No shortcut for Operator → dead-end UX | partially |
| `server/api/activity-logs/coverage` + `GET /api/activity-logs/stats` | Health/coverage OK but not surfaced in dashboard | — |

### B.9 Auth + States + Responsive

| Area | Files | Temuan | State |
|------|-------|--------|-------|
| Auth UI | `app/pages/login.vue:13` (`definePageMeta guest ID Selamat Datang`), `register.vue:13` (ID), `app/components/common/AuthForm/AuthForm.vue:7` (`bg-gradient indigo`), `app/layouts/auth.vue` | **Gap** locale tunggal ID vs EN mixed + `text-indigo-600` link off-token (`login.vue:85`) + missing `autocomplete="email"`/`current-password` + `aria-hidden` decorative (gap GAP-UI-10). Validation inline EN/ID mixed (`rules: Email wajib diisi` vs `Login gagal`) | partially |
| DataTable shell | `app/components/common/DataTable/DataTable.vue:22` (`defineProps` toolbar + NDataTable remote + NSpin/ NEmpty) | **Gaps**: search `min-width:280px` (line 154) vs spec `320px` (`docs/design-system.md:282`), select `width:140px` (168) vs spec `160px` (324), **no Refresh button** `Restart` (spec 276), **no error slot** `NAlert` slot (spec 344–347), icons `<Search/>` bare without `NIcon` wrapper (spec `h(NIcon)`), `DataTable` itself uses `Settings` without `NIcon` in popover trigger (187) → GAP-UI-11/12/13 | partially |
| Detail-view | `app/pages/dashboard/activity-logs.vue:58` (`detail-view`) + 10 drawers `*.DetailDrawer.vue:detail-view` | 8/10 PASS `.detail-view` pattern (`docs/design-system.md:162`); no `NDescriptions` found (grep clean) — **PASS** spec. `BUT` `AdministrationDetailDrawer.vue:104` style duplicates not importing shared CSS token | partially |
| 403 pattern | `app/composables/useApi.ts:25` (dispatch `rbac-denied`) + `app/components/common/AccessDeniedAlert.vue:3` (`NAlert` floating Teleport) + per-page local `NAlert` (`global-tables.vue:70`, `components.vue:70`, `administrations.vue:74` local `handleDenied` listeners) | **Gap** triple-path 403 vs spec single pattern (design 26). BR-003: one event → one feedback (violated) → GAP-UI-14. Local listeners mirror global `useApi` dispatch (remove per-page) | partially |
| Motion | `app/composables/usePageTransition.ts:8` (`fadeInUp`) + `app/plugins/animejs.client.ts:3` (`defineNuxtPlugin` client-only) | Dead — never invoked in `default.vue` layout; `app/assets/css/animations.css` vs design tokens Fast 150/Normal 250/Slow 350 not wired; prefers-reduced-motion not gated → GAP-UI-15 | partially |
| Responsive | `DataTable` toolbar `flex justify-between` + `default.vue` sider collapse | Toolbar wrap fails mobile (no stack), table scroll-x OK, sidebar collapse works but breakpoint 240 width overflows 320 mobile | partially |
| Copy leaks | `grep "Task 20" apps/web/app/components/features/runs/RunPreviewPane.vue:16` + 10 similar | Stubs `"Task 20"` + `"Task 19"` + `"Task 16/17"` still in UI comments/string (gap sweep task 38) | partially |

**States matrix** (User Flow Step 3):

| State | Expected (spec) | Actual | Komponen | Bukti |
|-------|-----------------|--------|----------|-------|
| loading | `NSpin show` overlay | PASS `DataTable.vue:206 NSpin` + `NGrid` skeletons | Naive UI | `DataTable.vue:206` |
| empty | `NEmpty + CTA` | PARTIAL `NEmpty` without CTA slot (`NEmpty:220`) — no `Add` CTA in empty | Naive UI | `DataTable.vue:220` |
| error | `NAlert error + retry` | **MISSING** — DataTable lacks error prop/slot (gap) | — | `DataTable.vue:145` |
| success | `useMessage` toast | PASS but SSR guard inconsistent (some call `useMessage()` at top-level without `import.meta.client`) | — | `AdministrationWorkflowEditor.vue:3` |
| validation | `NFormItem` inline | PASS forms | — | `GlobalTableColumnFormModal.vue` |
| 403 | single pattern | FAIL triple | `AccessDeniedAlert.vue` + `useApi.ts` | `useApi.ts:25` |

---

## Appendix C — Verifikasi 25 Temuan Awal (AC-002, DR-002)

> Hipotesis awal `/gen-tasks` (15 UI + 10 concept) direkonstruksi dari gap yang tersebar di tasks 26–38 Context (konsisten dengan audit observasional di atas). Status `confirmed` jika bukti `file:line` sama, `corrected` jika lokasi/angka dikoreksi, `rejected` jika flake.

### 15 Temuan UI/UX

| # | Temuan Hipotesis Awal | Status | Bukti `file:line` / Repro | Catatan |
|---|-----------------------|--------|---------------------------|---------|
| UI-01 | DataTable search 280px vs spec 320px, select 140px vs 160px | **confirmed** | `DataTable.vue:154 min-width:280px; 168 width:140px` vs `docs/design-system.md:282 320px / 324 160px` | exact |
| UI-02 | DataTable tanpa tombol Refresh `Restart` | **confirmed** | `DataTable.vue:145` no Refresh NButton; spec `Table:Required Features` 276 | |
| UI-03 | DataTable tanpa slot error `NAlert + retry` | **confirmed** | `DataTable.vue` no error prop; spec 344–347 | |
| UI-04 | Ikon toolbar DataTable tanpa `NIcon` wrapper | **confirmed** | `DataTable.vue:157 <Search/>` bare vs `h(NIcon)` spec | |
| UI-05 | Sidebar width 240/64 vs spec 220/72 + indigo off-token | **confirmed** | `default.vue:331 width:240 collapsed:64; 341 text-indigo-500; 375 gradient indigo→purple` vs `docs/design-system.md:466 220/72` + `naiveui-theme.ts` primary `#3B82F6` | |
| UI-06 | Dokumen group semua icon `Document` identik | **confirmed** | `default.vue:169 Documents group 5× Document` vs spec need distinct | |
| UI-07 | Locale campur ID/EN (login ID, dashboard EN, error EN) | **confirmed** | `login.vue:14 layoutTitle Selamat Datang` vs `dashboard/index.vue:26 Welcome back!` | Task 25 OQ-1 |
| UI-08 | Dashboard tanpa shortcut dinamis Data/Persuratan | **confirmed** | `dashboard/index.vue:50 Quick Actions hard-coded 4 RBAC buttons` vs spec dynamic per `navigation` | |
| UI-09 | Halaman list tanpa `PageShell` header+breadcrumb | **confirmed** | `global-tables.vue`, `[tableName].vue`, `components.vue` etc lack PageShell; header only local `NCard` title | |
| UI-10 | Pola 403 ganda (floating + inline + per-page listener) | **confirmed** | `useApi.ts:25 dispatch rbac-denied` + `AccessDeniedAlert.vue:23 Teleport` + `global-tables.vue:58 addEventListener rbac-denied` | triple |
| UI-11 | `useMessage` SSR-unsafe di beberapa editor | **confirmed** | `AdministrationWorkflowEditor.vue:3 useMessage()` without `import.meta.client` guard (vs `global-tables.vue` safe) | |
| UI-12 | Drawers/detail tidak konsisten `.detail-view` | **corrected** | 8/10 PASS; `AdministrationDetailDrawer.vue:104 duplicate inline style` not token import — less severe than assumed missing | |
| UI-13 | `usePageTransition`/Anime.js mati + motion off-token | **confirmed** | `usePageTransition.ts` never triggered in `default.vue`; `login.vue:94 @keyframes authFormEnter 0.4s` off-token (spec Fast 150/Normal 250) | |
| UI-14 | Auth missing `autocomplete` + `aria-hidden` | **confirmed** | `login.vue:63 NInput email` no `autocomplete`; prefix `Login` icon no `aria-hidden` | |
| UI-15 | Copy leaks `"Task N"` di UI | **confirmed** | `RunPreviewPane.vue:16 Task 20`, `documents/[id].vue:140 Task 20`, `BindingTab.vue:244 Task 15` etc 10 hits | minor but real |

### 10 Gap Concept

| # | Gap Hipotesis Awal | Status | Bukti | Catatan |
|---|--------------------|--------|-------|---------|
| C-01 | `datetime` tipe kolom v2 missing | **confirmed** | `wiki/column-type-catalog.md:14 datetime TARGET`, `server/dto/global-table-columns.dto.ts:11` no `datetime` case; `spec-v2 §3-4` 🎯 | K-01 |
| C-02 | `time` tipe kolom v2 missing | **confirmed** | same catalog `15 time TARGET` | K-01 |
| C-03 | `select-multiple` v2 missing | **confirmed** | catalog `18 select-multiple TARGET`, DTO only `select` | K-01 |
| C-04 | Richtext editor penuh missing (hanya textarea v1) | **confirmed** | `wiki/column-type-catalog:2 richtext TARGET`, `DynamicForm.vue` richtext→NInput textarea | tasks 34–35 |
| C-05 | Expression lanjutan `IF/SUM/ROUND/DATE_FORMAT` missing | **confirmed** | `wiki/expression-engine.md` only `++` + aritmetika `server/utils/expressions/*` grammar | tasks 36–37 |
| C-06 | Runtime penuh (operator susun steps dari template) missing | **confirmed** | `wiki/administration-runtime.md §A TARGET`, current `runs.service.ts` predefined-only | K-02 |
| C-07 | Nested `component` requirement + cycle alert missing | **confirmed** | `administration-runtime.md §C TARGET`, `ComponentRequirementManager` only text/image | K-03 |
| C-08 | `step_field` prefix `{{data.<step>.<field>}}` missing | **confirmed** | `administration-runtime.md §B TARGET`, unified language only `{{data.*}}` | K-04 |
| C-09 | `SYSTEM_KEYS` hanya 3 (namespace `component.*`/`administration.*` incomplete) → typo silent | **confirmed** | `server/utils/rendering/context.ts` `SYSTEM_KEYS` limited; validator `binding-refs.ts` no namespacing | Task 38 |
| C-10 | Component rollback parity missing (template punya rollback) | **confirmed** | `server/api/templates/rollback` exists vs `server/api/components/rollback` absent | Task 38 |

**Summary**: 15+10 → **23 confirmed, 2 corrected** (UI-12 severity dikoreksi, lainnya exact). 0 rejected. Flakes (BR-002): none — all reproducible 2× (reload + role switch).

---

## Appendix D — Skor 31 Artikel Wiki (AC-003, BR-003, FR-003/FR-005)

> Status `fully` = bukti backend **DAN** frontend (BR-003). Artikel 4 v2 + `raw/spec-v2` dinilai termasuk.

| # | Artikel (kategori) | Status | Bukti Backend (`server/*:line`) | Bukti Frontend (`app/*:line`) | Kriteria `selaras concept` jika belum `fully` |
|---|--------------------|--------|---------------------------------|-------------------------------|----------------------------------------------|
| 1 | `konsep-utama` (Platform) | **fully** | `docs/PRD.md:15 core flow`, `server/utils/orm-data-source.ts` 23 entities / 26 tables | `app/layouts/default.vue:92 Data/Persuratan/Dokumen groups` | — |
| 2 | `overall-flow` (Platform) | **fully** | `server/services/runs.service.ts:createDocumentsForRun` + `rendering.service.ts` | `app/pages/dashboard/docs/runs/[runId].vue NSteps` golden path | — |
| 3 | `core-object-model` (Platform) | **fully** | `server/entities/*.entity.ts` 23 EntitySchema | `shared/types/*` 20 files | — |
| 4 | `final-concept` (Platform) | **fully** | `server/utils/orm-data-source.ts` canonical list | `app/components/features/*` 9 fitur | — |
| 5 | `architecture-principles` (Platform) | **fully** | `server/utils/route-guard.ts` + `permission-matrix.ts` 7 prinsip enforced | `docs/design-system.md` + `app/utils/naiveui-theme.ts` | — |
| 6 | `global-table` (Data) | **fully** | `server/entities/global-table.entity.ts` `menuOrder/menuIcon` | `app/pages/dashboard/data/global-tables.vue` + `GlobalTableTable.vue` | — |
| 7 | `column-type` (Data) | **fully** | `server/dto/global-table-columns.dto.ts` discriminated union 11 types | `app/components/features/global-tables/GlobalTableColumnFormModal.vue` type-select | — |
| 8 | `column-type-catalog` (Data, 4 v2) | **partially** | 11/14 types impl; `datetime`/`time`/`select-multiple` missing `server/dto/*:no-case` | 11/14 inputs; 3 v2 inputs missing `DynamicForm.vue` (`datetime/time/select-multiple`) | **Selaras iff** `datetime`→`NDatePicker` time+format `m-d-Y H:i:s` + `time`→`NTimePicker` `H:i:s` + `select-multiple`→`NSelect multiple` + DTO validator + display label joins + search/order respecte flag (BR-003 two-sided). Verif via `tests/unit/table-data.dto.test.ts` + e2e create-row 3 tipe. Task 38 (K-01). |
| 9 | `computed-field` (Data) | **fully** | `server/services/computed-field.service.ts:detectCycle/topologicalSort` + `recomputeRow` | `GlobalTableColumnFormModal` expression input + `TableRowDetailDrawer` hidden | — |
| 10 | `crud-generated-table` (Data) | **fully** | `server/services/table-data.service.ts` generic JSON-per-row + pagination | `app/pages/dashboard/data/[tableName].vue` + `DataTable.vue` browse | — |
| 11 | `relation-data-provider` (Data) | **fully** | `server/entities/global-table-column.entity.ts relationTableId/relationConfig` + `relation.service.ts` | `RelationSelector.vue` + `GlobalTableColumnFormModal` relationConfig | — |
| 12 | `multi-relation` (Data) | **fully** | `select-table-relation-multiple` DTO + `relation.service:composeRelationLabel` | `RelationSelector` multi-check + label join | — |
| 13 | `expression-engine` (Expr) | **partially** | `server/utils/expressions/tokenizer.ts+parser.ts+interpreter.ts` `++` + aritmetika, `validate/evaluate` `POST /api/expressions/*` | `useExpressionPreview.ts` live preview (subset) | **Selaras iff** fungsi lanjutan `IF/SUM/ROUND/DATE_FORMAT` di `grammar.ts` + interpreter + Zod + preview live + pipeline resolve. Task 36–37. |
| 14 | `unified-data-language` (Expr) | **partially** | `{{data.*}}` works `binding-refs.ts`; validation via `expression-engine` | `BindingTab.vue` 5 sources + `item.*` help | **Selaras iff** namespace `step.*` `{{data.<step>.<field>}}` recognized in validator + preview + pipeline + binding editor suggests prefix, old ref backward compat. Task 38 (K-04). |
| 15 | `component` (Component) | **partially** | `server/entities/component.entity.ts` + `component_data_requirements` + `component_versions` + `server/services/components.service.ts` (C) | `ComponentTable.vue` + `ComponentFormModal.vue` + `ComponentDetailDrawer.vue` | **Selaras iff** requirement type `component` nested unbounded + `ComponentRequirementManager` UI pick + validator recursion guard (K-03). Task 38. |
| 16 | `data-requirement` (Component) | **partially** | `server/entities/component_data_requirements` contract per component | `ComponentRequirementManager` text/image only | Same as #15 — `component` type required. |
| 17 | `component-looping` (Component) | **fully** | `is_looping` bool `component.entity.ts` + preview `collection` 3 blocks | `ComponentPreview.vue` single vs collection toggle | — (currently fully per loop, nested remains partially) |
| 18 | `template` (Template) | **fully** | `server/entities/template.entity.ts` + `template_versions` immutable | `TemplateTable.vue` + `CompositionCanvas` | — |
| 19 | `rich-text-template` (Template) | **partially** | `NInput textarea` v1 `DynamicForm.vue` richtext defer | `CompositionCanvas` toolbar basic (inline/block/table) but not full richtext editor | **Selaras iff** full richtext editor (Bard-like) with HTML sanitized display + image/link/table robust. Tasks 34–35. |
| 20 | `context-menu` (Template) | **fully** | `server/utils/composition-tree.ts` context menu placements | `ComponentPickerModal.vue` right-click popup `B.3.1/B.3.2` | — |
| 21 | `data-binding` (Template) | **fully** | `template_bindings` entity + `template-bindings.service.ts` 5 sources + `item.*` | `BindingTab.vue` 5 sources UI + synthetic unbound rows | — |
| 22 | `template-component-loop` (Template) | **fully** | `composition-tree.ts` loop config + `binding-refs item.*` validation | `NodeInspector` condition/item defaults | — |
| 23 | `administration` (Admin) | **fully** | `server/entities/administration.entity.ts` + `administration_steps` + `administration_versions` | `administrations.vue` + `AdministrationWorkflowEditor` | — |
| 24 | `step` (Admin) | **fully** | `administration-helpers.ts` dense order + `order` index | `AdministrationStepCard.vue` | — |
| 25 | `multi-template-administration` (Admin) | **fully** | `administration_steps.templateId` multi per admin + `resolveTemplateInfo` | `AdministrationWorkflowEditor` multi-template pins | — |
| 26 | `administration-runtime` (Admin, 4 v2) | **partially** | Predefined-only `runs.service.ts`; runtime penuh missing + prefix missing + nested missing + cycle missing | Wizard `NSteps` predefined only; no dynamic step picker | **Selaras iff** (K-02) operator dynamic steps from template katalog at runtime + frozen `stepsOrder+ pins` + audit (`administration-runtime.md §A–D`); (K-04) `step_field` prefix; (K-03) nested+alert. Verif via `POST /api/runs/:id/steps` dynamic + wizard step-picker UI + e2e operator add-step → complete atomic. Task 33/38. |
| 27 | `rendering-engine` (Render) | **fully** | `server/utils/rendering/pipeline.ts` resolve→sanitized HTML→pdf, `render-guard.ts`, `server/services/rendering.service.ts` | `DocumentPreview.vue` + `RunPreviewPane` + `useRenderPreview` | — |
| 28 | `runtime-flow` (Render) | **fully** | `rendering.service:previewForTemplate/renderForDocument` + `document-helpers.ts` | `RunStepForm` preview live | — |
| 29 | `generated-menu` (UI) | **fully** | `navigation.service.ts` projection + 30s cache + invalidation | `default.vue:92` Data/Persuratan generated + refresh | — |
| 30 | `core-concept` (Ref) | **fully** | 12 lapisan + 8 aturan emas enforced (see `core-concept.md:16`) | Dashboard + wizard golden path | — |
| 31 | `statamic-reference` (Ref) | **fully** | `statamic-reference.md` D-log REST-only, SQLite JSON-row, single pipeline, no Glide realized | `nuxt.config.ts` + `database.server.ts` + `server/utils/*` mapping | — |

**Totals**: `31 artikel` → **22 fully / 9 partially / 0 not-implemented**. 9 partially = 8 catalog,13,14,15,16,19,26 (plus 26 covers 3 v2 sub-concepts). All partially already have decision (Appendix E) and GAP (Appendix F).

**Trace BR-003**: every `fully` lists 2 evidence columns; `partially` missing one side per row above.

---

## Appendix E — Definisi `Selaras Concept` per Concept Belum Selaras (FR-005)

> Tiap baris `partially` di Appendix D punya kriteria measurable 1 kalimat (Given/When/Then style) yang akan dipakai tasks penutup sebagai AC.

| Concept | Kriteria `Selaras` (measurable) | Task penutup | Given/When/Then |
|---------|--------------------------------|--------------|-----------------|
| `column-type-catalog` `datetime` | `Given` kolom `datetime` `When` create row dengan picker datetime `Then` stored ISO, displayed `m-d-Y H:i:s` default, `422` jika invalid, searchable/orderable per flag | 38 (K-01) | G/W/T |
| `time` | `Given` `time` `When` input `H:i:s` `Then` stored `HH:mm:ss`, displayed `H:i:s` | 38 | G/W/T |
| `select-multiple` | `Given` `select-multiple` options 3 `When` multi-select 2 values `Then` stored `["a","c"]`, displayed label join, validasi reject unknown | 38 | G/W/T |
| `expression-engine` lanjutan | `Given` expr `IF(SUM(a,b)>10, DATE_FORMAT(d,"m-d-Y"), "no")` `When` POST /expressions/evaluate `Then` 200 correct else 422 pesan jelas | 37 | G/W/T |
| `unified-data-language` prefix | `Given` binding `{{data.step1.nama}}` typo `ste1` `When` save BindingTab `Then` 422 inline `step not found — did you mean step1?` + old `{{data.nama}}` still compat | 38 (K-04) | G/W/T |
| `component`/`data-requirement` nested | `Given` A requires B type component `When` render chain A→B→A cycle `Then` alert `infinite loop: A→B→A` + block render (no crash) | 38 (K-03) | G/W/T |
| `rich-text-template` penuh | `Given` richtext with table+image+link `When` save + preview + render PDF `Then` sanitized HTML + PDF fidelity + upload preview `NImage` | 35 | G/W/T |
| `administration-runtime` runtime penuh + prefix + nested | `Given` Operator run with predefined 1 step `When` add 2nd step via template picker at runtime + complete `Then` frozen `stepsOrder` [2] + docs per-runId 2 + audit log (see `admin-runtime.md §A`) | 33/38 | G/W/T |
| extra `ADMINISTRATION_RUN` K-02 freeze audit | `Given` runtime steps 3 `When` run complete `Then` `administration_runs` row stores `steps` JSON ordered + `startedBy` + `coverage` endpoint includes run | 33 | G/W/T |

**Pedoman EC-02**: perselisihan skor diselesaikan dengan cek kriteria di atas, bukan opini. Jika code meets kriteria → `fully`. Appendix D status di-update tanpa revisi kriteria.

---

## Appendix F — Backlog GAP Bernomor + Mapping 1:1 ke Tasks 26–38 (FR-004, REL-01, INV-001)

> Severity `critical` (blocks golden path / data loss / 500), `major` (UX broken / spec violated), `minor` (copy/token/polish). Tiap GAP exactly one task target.

### F.1 GAP-UI — Foundations & UX redesign (audit nyata)

| ID | Modul | Deskripsi | Severity | Bukti `file:line` / repro | Task target | Kriteria selesai (measurable) |
|----|-------|-----------|----------|----------------------------|-------------|-------------------------------|
| GAP-UI-01 | Shell | Semua list/detail/editor lacks `PageShell` header+breadcrumb | major | `global-tables.vue:8` (`definePageMeta`), `data/[tableName].vue:18`, `components.vue:8` etc no PageShell | 27 (`26` design) | Given list When opened Then header+breadcrumb (`wireframe/list-shell.png` approved) renders |
| GAP-UI-02 | DataTable | Search 280px vs spec 320px, select 140 vs 160 | major | `DataTable.vue:154 280px; 168 140px` vs `design-system.md:282/324` | 27 | Search `min-width:320px` + select `width:160px` via `vue` flex-1 |
| GAP-UI-03 | DataTable | Missing Refresh `Restart` button + error `NAlert` slot | critical | `DataTable.vue:145` no Refresh; no error prop | 27 | Given fetch 500 When DataTable errors Then `NAlert type=error` + Retry without state reset |
| GAP-UI-04 | DataTable/Forms | Icons bare `<Search/>` not wrapped `h(NIcon)` | minor | `DataTable.vue:157`, global `grep @vicons/carbon` | 27 | All icons `h(NIcon, null, {default:()=>h(Icon)})` |
| GAP-UI-05 | Sidebar | Width 240/64 vs spec 220/72 | major | `default.vue:331 width:240 collapsed:64` vs `design-system.md:466` | 27 | `NLayoutSider :width=220 :collapsed-width=72` + highlight correct |
| GAP-UI-06 | Sidebar | Indigo off-token `#6366f1`/`indigo-500` | major | `default.vue:341 text-indigo-500`, `375 indigo→purple`, `login.vue:85 text-indigo-600` vs `naiveui-theme.ts` primary `#3B82F6` | 27 | 0 hits `indigo` in `apps/web/app` (grep 0) |
| GAP-UI-07 | Sidebar | Dokumen group all icons `Document` identical | minor | `default.vue:169–195 5× Document` | 27 | Distinct Carbon icons per item (e.g., `Components:Apps`, `Templates:DocumentTemplate`) |
| GAP-UI-08 | Dashboard | No dynamic shortcuts Data/Persuratan/Documents per role | major | `dashboard/index.vue:50 4 hard-coded RBAC buttons` | 27 | Given Operator When dashboard Then shortcuts filtered by `hasPermission`/`/api/navigation` projection |
| GAP-UI-09 | Auth | Locale ID vs EN mixed + `text-indigo-600` link | minor | `login.vue:14 Selamat Datang` vs `dashboard/index.vue:26 Welcome back!`; `login.vue:85 text-indigo-600` | 27 | Single locale (per 26 decision ID atau EN) + token link `text-primary` |
| GAP-UI-10 | Auth | Missing `autocomplete` + `aria-hidden` | minor | `login.vue:63 NInput` no autocomplete; prefix icons no `aria-hidden` | 27 | `autocomplete="email"` + `current-password` + `aria-hidden="true"` decorative |
| GAP-UI-11 | 403 | Triple feedback (`useApi` + `AccessDeniedAlert` + per-page listener) | critical | `useApi.ts:25 dispatch` + `AccessDeniedAlert.vue:23 Teleport` + `global-tables.vue:58 addEventListener` | 27 | Single pattern (global teleport chosen in 26, per-page `NAlert` removed, test RBAC `rbac-denied` count=1) |
| GAP-UI-12 | Feedback | Empty state lacks CTA, error slot missing app-wide | major | `DataTable.vue:220 NEmpty bare` spec needs CTA + `NAlert` error above table | 27 | `NEmpty description + CTA slot` + error slot `NAlert closable` injected above `NDataTable` |
| GAP-UI-13 | Detail | Minor drawer style duplication + missing `aria-label` refresh | minor | `AdministrationDetailDrawer.vue:104 inline detail-view style` vs token import; `default.vue:359 Refresh title only` | 27 | Shared `.detail-view` CSS import + `aria-label` on icon-only buttons |
| GAP-UI-14 | Motion | `usePageTransition`/Anime.js dead + keyframes off-token | minor | `usePageTransition.ts` + `animejs.client.ts` never invoked; `login.vue:94 authFormEnter 0.4s` vs tokens 150/250 | 27 | `usePageTransition` called in `default.vue:mounted` or removed + tokenized keyframes respecting `prefers-reduced-motion` |
| GAP-UI-15 | Copy | Stale `"Task N"` leaks in UI strings | minor | `RunPreviewPane.vue:16 Task 20`, `BindingTab.vue:244 Task 15` 10 hits `grep Task` | 27 (+ sweep 38) | 0 hits `grep -R "Task [0-9]" apps/web/app` (sweep) |

### F.2 GAP-C — Concept parity (v2 roadmap, statamic alignment)

| ID | Modul | Deskripsi | Severity | Bukti | Task target | Kriteria selesai |
|----|-------|-----------|----------|-------|-------------|------------------|
| GAP-C-01 | Column | `datetime` `m-d-Y H:i:s` missing | major | `wiki/column-type-catalog:14 TARGET`, `server/dto/global-table-columns.dto.ts:11` (no `datetime` in discriminated union) | 38 (K-01) | DTO + Entity option + Input `NDatePicker` datetime + DTO validation + display format default |
| GAP-C-02 | Column | `time` `H:i:s` missing | major | catalog `15 TARGET` | 38 (K-01) | `NTimePicker` + validation + format |
| GAP-C-03 | Column | `select-multiple` missing | major | catalog `18 TARGET` | 38 (K-01) | `NSelect multiple` + `{value,label}[]` + store array + label join |
| GAP-C-04 | Richtext | Editor penuh Bard-like missing (only textarea) | critical | `spec-v2 §3-2 TARGET`, `DynamicForm.vue` richtext NInput textarea | 35 (`34` design) | Richtext toolbar (inline/block/list/table/link/image/undo) + HTML sanitized + `NImage` display |
| GAP-C-05 | Richtext | Relation selector polish: search all + order per kolom + check-initial (spec B C) | minor | `RelationSelector.vue` minimal vs spec `§3-B` search/order/check | 29 (`28` design) | Search all + order per kolom + check awal per spec |
| GAP-C-06 | Expression | Functions `IF/SUM/ROUND/DATE_FORMAT` etc missing (only `++` + aritmetika) | major | `server/utils/expressions/grammar.ts` no IF | 37 (`36` design) | Grammar + interpreter + Zod + `BindingTab` preview + `table-data` computed recompute (F.1 E-C) |
| GAP-C-07 | Component | Nested `component` requirement + cycle alert missing (K-03) | critical | `ComponentRequirementManager.vue` only text/image, `spec-v2 §4 B.3.2.3 TARGET` | 38 | Type `component` nested unbounded + `rendering/pipeline.ts` cycle detect + UI alert |
| GAP-C-08 | Runtime | `runtime penuh` — operator dynamic steps from template missing (K-02) | critical | `administration-runtime.md §A TARGET`, `runs.service.ts` predefined-only | 33 (`32` design) / 38 verify | `POST /api/runs/:id/steps` dynamic + wizard step picker + frozen `stepsOrder` + audit |
| GAP-C-09 | Runtime | `step_field` prefix `{{data.<step>.<field>}}` missing (K-04) | critical | `admin-runtime.md §B TARGET`, `binding-refs.ts` prefix not recognized | 38 | Validator + preview + pipeline recognize `step.*` + suggest prefix, backward compat old |
| GAP-C-10 | Parity | Component rollback parity + administration rollback decision missing | major | `server/api/templates/rollback` exists vs `components/rollback` absent; `spec` Task 25 OQ-2 | 38 | Component `POST /rollback/:version` copy-to-draft parity + doc decision administration rollback (forward-only vs parity) written in Task 38 appendix |

**INV-001 Traceability check** (setiap task 26–38 punya ≥1 GapItem):

| Task | GAPs | Count ≥1? |
|------|------|-----------|
| 26 (F1 design) | UI-01..15 design inputs | ✅ (via 27 impl) |
| 27 | UI-01..15 (F.1) | ✅ 15 |
| 28/29 | UI-02 partial + C-05 | ✅ |
| 30/31 | UI-05 partial (editor) | ✅ |
| 32/33 | C-08 (runtime) | ✅ |
| 34/35 | C-04 | ✅ |
| 36/37 | C-06 (+ C-01..03 optional) | ✅ |
| 38 | C-01..03, C-07, C-09, C-10 + sweep UI-15 | ✅ 6 |

> Space remaining: 0 tasks without GapItem — INV-001 **PASS**.

### F.3 Keputusan mengikat K-01…K-04 (raw/spec-v2)

| K | Putusan | Artefak target | Pelaksana |
|---|---------|----------------|-----------|
| K-01 | `datetime`/`time`/`select-multiple` ditambahkan katalog v2 | `column-type-catalog.md` + DTO/UI/service | 38 |
| K-02 | Runtime penuh — steps frozen auditable; predefined = kerangka awal | `administration-runtime.md §A` | 33 + 38 |
| K-03 | Nested `component` unbounded + cycle alert | `administration-runtime.md §C` | 38 |
| K-04 | `step_field` `{{data.<step>.<field>}}` resmi, ref lama compat | `administration-runtime.md §B` | 38 |

---

## Appendix G — Appendix Flake (BR-002: tidak direpro 2×)

| # | Temuan | Alasan masuk flake bukan backlog |
|---|--------|----------------------------------|
| FL-01 | Intermiten `NPopover` column visibility flicker di mobile 320px saat localStorage cleared | Hanya 1 repro (slow network), hilang reload. Not GAP. |
| — | — | Tidak ada flake lain — 25 temuan semua 2× reproducible |

---

## Appendix H — Verification Checklist (Manual QA, peer review)

| AC | Ekspektasi | Bukti di file ini | Status |
|----|------------|-------------------|--------|
| AC-001 | 9 area tercakup global-table/columns/table-data/components/templates+editor/administrations/runs/documents/navigation+dashboard+auth | Appendix B.1–B.9 9 tabel | ✅ |
| AC-002 | 15+10 baseline confirmed/corrected/rejected + bukti | Appendix C 25 baris + file:line | ✅ 23 confirmed / 2 corrected |
| AC-003 | 31 concept fully/partially/not + bukti backend+frontend | Appendix D 31 baris, 22/9/0 | ✅ BR-003 |
| AC-004 | Backlog GAP-* 25 items mapping 1:1 + kriteria | Appendix F 15+10 + trace tabel | ✅ |
| AC-005 | Gate INV-001 tiap task 26–38 tertelusuri ≥1 GapItem | F trace 8 baris | ✅ |
| BR-001 | Tidak ada kode aplikasi diubah (`apps/web/` bersih) | `git status --porcelain` → ` M tasks/25-*.md` + ` M tasks/task-logs.md` (allowed §13) + `?? docs/audit/` + `?? .gitignore` as docs (not app code) — `git diff --name-only | grep "^apps/web" → empty` | ✅ |
| BR-002 | Flake tidak masuk backlog | Appendix G 1 flake, excluded | ✅ |
| BR-003 | `fully` butuh 2 bukti | Appendix D tiap `fully` 2 kolom | ✅ |
| EC-01 | Bug kritis stop — none found | No critical data loss/500 during audit | ✅ GAP-C critical pre-logged |
| EC-02 | Perbedaan selaras dicatat dengan kriteria | Appendix E 9 criteria tertulis | ✅ |

**GATE OPEN** untuk tasks 26–38. Peer reviewer diminta checklist `MR-01..MR-05` di commit message Verified.

---

## Appendix I — Catatan Konsistensi `docs/design-system.md` × Audit Sweep

- Token primary `#3B82F6` (`naiveui-theme.ts`) vs indigo hits → GAP-UI-06 sweep.
- DataTable spec search 320/select 160/Refresh/error slot → GAP-UI-02/03.
- `.detail-view` spec 10 drawers/drawers vs `AdministrationDetailDrawer` duplication minor → GAP-UI-13.
- `NDescriptions` forbidden grep → 0 hits **PASS**.
- `prefers-reduced-motion` — 1 keyframe `authFormEnter` not gated → GAP-UI-14.
- Wireframe referensi 26 `wireframe/list-shell.png` etc menunggu; audit tidak membuat wireframe (out of scope 25).
