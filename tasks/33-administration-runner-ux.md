# Task 33 — Administration & Runner UX Implementation

## Status

TODO

## Objective

Mengimplementasikan redesign UX Administration, Runner, dan Documents mengacu design Task 32: editor aman, wizard operator-terbaca dengan preview render nyata, tautan dokumen pasca-complete, documents jujur — tanpa mengubah kontrak API.

## Context

Kontrak backend selesai (Tasks 17–20: steps, pins, run atomic, issuance, render pipeline, preview API). Audit membuktikan deficit ada di frontend: `AdministrationDetailDrawer` tanpa style, tooltip published hilang, form tanpa rules, pin-fallback diam, dirty-guard mati (`hasChanges` tak dikonsumsi), complete mendarat tanpa tautan (`runs/[runId].vue:160-165` + komentar basi), review JSON mentah (`:274-277`), `NStep` tak aksesibel, `RunPreviewPane` stub (`:15-18,63`) padahal `preview.post.ts` ada, filter tanpa label, PDF disabled tanpa tooltip + toast unreachable, detail CSS menyimpang, link `href="#"`, drift tanpa tooltip, `DocumentPreview` tak dipakai.

**Keputusan alignment K-02/K-04 (2026-09-11, mengikat task ini)**: model **runtime penuh** + konvensi **`step_field`**. Backend perlu endpoint baru `POST /runs/:runId/runtime-steps` (pilih template → step runtime ter-freeze) dan namespace `step.*` di validator/binding; selebihnya kontrak tidak berubah. Lihat `wiki/administration-runtime`.

## Scope

### In Scope

- Style drawer + tooltip published + `NForm` rules + pin-fallback dijelaskan + dirty-guard + konsumsi `hasChanges`
- Wizard: review operator + preview render nyata (`POST /api/render/preview`) + complete bertautan dokumen + hapus komentar basi + `NStep` aksesibel + konteks preview benar
- My Runs: filter berlabel + scope discoverable; starter: peringatan jelas
- Documents: filter berlabel + searchable title/creator + PDF tooltip (hapus toast unreachable) + detail `.detail-view` kanonis + link real-href + drift tooltip + pakai/satukan `DocumentPreview`
- Row picker: batas 100 dijelaskan + label sudah (pertahankan), `image` step konsisten dengan DynamicForm

### Out of Scope

- Perubahan kontrak run/documents/render; richtext penuh (35); fungsi ekspresi (37)

## Dependencies

- `tasks/32-administration-runner-ux-ui-design.md` — (WAJIB)
- Tasks 26/27 (fondasi), Task 25 (GAP-UI)

## User Flow

> MANDATORY — KONSISTEN dengan Task 32.

### Diagram

```text
[Entry] → {Admin detail} --(PUT steps)--> {Saved} --(publish/archive)--> {State}
[Entry] → {Starter} --(POST runs)--> {Wizard} --(PATCH steps)--> {Review+preview} --(POST complete)--> {Documents}
    │--(POST runtime-steps: pilih template)--> {Step runtime} --(isi step_field)--> {Review}
[Entry] → {My Runs / Documents} --(GET + filter)--> {List} --(reissue)--> {New doc}
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Designer | Edit steps/pin | `PUT /api/administrations/:id/steps` | Valid tersimpan |
| 2 | Operator | Start | `POST /api/administrations/:id/runs` | Wizard |
| 3 | Operator | Isi steps (`step_field`) | `PATCH /api/runs/steps/:stepId` | Draf |
| 3b | Operator | Tambah step runtime | `POST /api/runs/:runId/runtime-steps` | Step ter-freeze di run |
| 4 | Operator | Review + preview | `POST /api/render/preview` | Render nyata |
| 5 | Operator | Complete | `POST /api/runs/:runId/complete` | Tautan dokumen |
| 6 | Operator | Browse/reissue | `GET /api/documents*`, `POST reissue` | Dokumen baru |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Cancel/resume | Wizard | Confirm + data pulih |
| ALT-02 | Drift | Detail | Tooltip + snapshot stabil |
| ERR-01 | Blocker complete | Wizard → step | Lompat + pesan |
| ERR-02 | PDF pending | Detail | Info + tooltip |
| ERR-03 | Reissue | Confirm → POST | Baris baru `replacesId` |

### Flow → UI Mapping

| Flow Step | Halaman (32) | Component | State |
|-----------|--------------|-----------|-------|
| Step 1 | admin detail | WorkflowEditor + StepCard | dirty/valid |
| Step 2–5 | starter + wizard | Wizard + Review + Preview | blocker/ready/done |
| Step 6 | my runs + documents | Tables + detail | filter/drift |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1 | PUT/POST | `/api/administrations/:id/steps`, `/publish`, `/archive` | Admin DTO |
| Step 2 | POST | `/api/administrations/:id/runs` | Run DTO |
| Step 3 | PATCH/GET | `/api/runs/steps/:stepId`, `/api/runs/:runId` | StepSave |
| Step 4 | POST | `/api/render/preview` | Render DTO |
| Step 5 | POST | `/api/runs/:runId/complete` | validate-all |
| Step 6 | GET/POST | `/api/documents*`, `/:id/reissue` | Query DTO |

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Operator dapat menjalankan administration sampai dokumen terbit dengan percaya diri (preview nyata, review terbaca, tautan hasil).

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Designer | Kelola workflow | Designer+ |
| Operator | Menjalankan + melihat dokumen | Operator+ (own-vs-all) |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Designer | Edit steps multi-template + pin | Tersimpan + dirty aman | Step 1 |
| UC-02 | Operator | Wizard sampai complete | Preview nyata + tautan dokumen | Step 2–5 |
| UC-03 | Operator | Reissue dokumen drift | Baris baru, original utuh | Step 6 |

### Functional Requirements

- FR-001: Editor bert-validasi + dirty-guard + pin dijelaskan — Step 1.
- FR-002: Review terbaca-operator (tanpa JSON mentah) — Step 4.
- FR-003: Preview pane memanggil render API nyata — Step 4.
- FR-004: Complete menampilkan tautan dokumen hasil — Step 5.
- FR-005: Documents jujur (label, tooltip, href, drift) — Step 6.
- FR-006 (K-02): Operator dapat menambah step runtime (pilih template ber-permission);
  pilihan ter-freeze di run dan tercakup validasi complete — Step 3b.
- FR-007 (K-04): Field step tampil namespaced `step.field`; typo namespace gagal bind-time
  dengan pesan + saran — Step 3–4.

### Business Rules

- BR-001: Kontrak run/complete/issuance tidak berubah (atomic, frozen pins).
- BR-002: Reissue tetap admin-gated; original tidak tersentuh.
- BR-003: HTML preview tetap sandbox; sanitasi server tidak berubah.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Preview gagal saat run | Pesan + lanjutkan pengisian (non-blocking) | Step 4 |
| EC-02 | Dokumen banyak per run | Daftar tautan terurut step | Step 5 |
| EC-03 | Run dibatalkan | Read-only + alasan | ALT-01 |

## Domain

> MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| Administration/Step (existing) | Workflow + steps | order, templateId, pin |
| AdministrationRun (existing) | Eksekusi | status, frozen pins, step data |
| Document (existing) | Hasil frozen | dataSnapshot, templateVersion, replacesId |

Tidak ada entity baru; tidak ada perubahan atribut.

### Relationships

```text
Administration ──1:N── Step / Version / Run ──1:N── Document (existing)
```

### States

| State | Deskripsi | Transisi Diizinkan |
|-------|-----------|--------------------|
| draft/published/archived (admin) | existing | sesuai Tasks 17 |
| active/completed/cancelled (run) | existing | sesuai Task 18 |

### Domain Rules

- DR-001: Complete atomic + read-only setelahnya (dipertahankan).

### Invariants

- INV-001: Dokumen selalu menunjuk snapshot + versi frozen (drift badge jujur).

### Data Model

N/A — tidak ada migration.

## API

> MANDATORY.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/administrations/:id/steps` | PUT | JWT | Designer | Simpan steps | Step 1 |
| 2 | `/api/administrations/:id/runs` | POST | JWT | Operator | Start | Step 2 |
| 3 | `/api/runs/steps/:stepId` | PATCH | JWT | Operator | Simpan step | Step 3 |
| 3b | `/api/runs/:runId/runtime-steps` | POST | JWT | Operator | Tambah step runtime (baru K-02) | Step 3b |
| 4 | `/api/render/preview` | POST | JWT | Preview perm | Preview nyata | Step 4 |
| 5 | `/api/runs/:runId/complete` | POST | JWT | Operator | Complete | Step 5 |
| 6 | `/api/documents`, `/:id/reissue` | GET/POST | JWT | own-vs-all/admin | Browse/reissue | Step 6 |

Kontrak existing (Tasks 17–20); detail mengikuti spec tersebut.

## UI

> MANDATORY. Mereferensikan Task 32.

### Referensi Design

- Design task: `tasks/32-administration-runner-ux-ui-design.md`
- Wireframe/Mockup/Prototype: `docs/{wireframes,mockups,prototypes}/admin-runner-ux/` / Storybook

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design |
|-------|---------|-------|-----------|---------------|
| admins/:id, run/:id, runs/:id, runs, documents* | Lihat 32 | Sesuai peran | Sesuai 32 | Approved (32) |

### Layout / Components / Interaction / Responsive / States / Accessibility

Sesuai design 32. Deviasi dicatat dengan alasan.

## Acceptance Criteria

> MANDATORY.

### AC-001 — Editor aman

Given steps kotor/divalidasi/pin gagal

When Designer bekerja

Then inline + dirty-guard + fallback dijelaskan.

### AC-002 — Preview nyata

Given Operator di wizard/review

When preview diminta

Then render dokumen nyata tampil (bukan stub teks).

### AC-003 — Complete bertautan

Given complete berhasil

When hasil tampil

Then tautan ke tiap dokumen hasil tersedia.

### AC-004 — Documents jujur

Given filter/drift/PDF/reissue

When dipakai

Then label/tooltip/href/konfirmasi benar.

## Tasks

> MANDATORY.

### Backend

- [ ] Endpoint baru `POST /api/runs/:runId/runtime-steps` (K-02) + freeze pilihan + permission check
- [ ] Namespace `step.*` di validator/binding (K-04) + pesan bind-time
- [ ] Tidak ada perubahan kontrak lain; perbaiki hanya bug terbukti
- [ ] Unit tests (`test:unit`) untuk perbaikan

### Frontend

- [ ] Editor: style, tooltip, rules, fallback, dirty-guard
- [ ] Wizard: review terbaca + preview nyata + tautan complete + NStep aksesibel
- [ ] My Runs/starter: label + scope + peringatan
- [ ] Documents: label + search + tooltip + href + drift + preview tunggal
- [ ] Hapus komentar/stub basi (`RunPreviewPane`, complete)
- [ ] Unit (`test:unit`/`test:nuxt`) + E2E (`test:e2e`) mengacu User Flow

### Cross-Cutting

- [ ] RBAC own-vs-all + admin-gated reissue tidak berubah; konsistensi 32

### Test Plan (QA)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | `tests/unit/runs/*.test.ts` | Helper wizard/review | FR-002, AC-002 |
| NT-01 | Nuxt — Component | `app/components/**/*.test.ts` | StepCard/review/drift states | Step 1/4/6, AC-001/004 |
| E2E-01 | E2E — Happy path | `tests/e2e/admin-runner-ux.spec.ts` | Start→isi→review→preview→complete→dokumen | Step 2–5, AC-002/003 |
| E2E-02 | E2E — Alternate | `tests/e2e/admin-runner-ux.alt.spec.ts` | Blocker/cancel/resume/drift/reissue/403 | ALT-01/02, ERR-01–03, AC-001/004 |

- [ ] Coverage Flow/AC/BR/EC 100%

## Verification (QA)

### Automated

- [ ] `vue-tsc`, `test:unit`, `test:nuxt`, `test:e2e`, `build` PASS

### Manual / QA Checklist

- [ ] Permission (own-vs-all, admin reissue); BR/EC bertest; states/responsive/a11y sesuai 32; pixel-perfect 32; traceability penuh

## Assumptions

- Frekuensi preview render diputuskan di 32 (otomatis vs eksplisit).
- Batas 100 baris row-picker tidak berubah (hanya dijelaskan).

## Open Questions

- (Diwarisi 32; ditutup saat design DONE.)

## Related Knowledge

- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`
- `tasks/32-administration-runner-ux-ui-design.md` (WAJIB), Tasks 17–20 (kontrak), 26/27
- Wiki: administration, step, multi-template-administration, administration-runtime (K-02/K-04 mengikat), runtime-flow, rendering-engine, core-concept
- `raw/spec-v2-statamic-alignment.md` §6–§7 (administrasi + hasil runtime)

## Change Log

### Initial

- Task generated from Core Concept (FASE 2 — mengacu Task 32).
