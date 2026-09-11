# Task 31 — Template Editor UX Implementation

## Status

TODO

## Objective

Mengimplementasikan redesign UX Template Editor mengacu design Task 30: insert eksplisit, BindingTab 5 sources nyata, inspector lengkap, timeline aman, copy bersih, dan penghapusan `document.execCommand` — tanpa mengubah kontrak tree/binding/version.

## Context

Backend editor selesai (Tasks 14–16: tree 8 kinds, validate-tree, bulk upsert bindings, `item.*`, snapshot publish, rollback-to-draft template). Audit membuktikan frontend-nya yang bermasalah: placeholder `administration` disabled (`BindingTab.vue:315-322`), global-table free-text (`:326-333`), copy Task-ref di 6 lokasi, tombol demo hardcoded (`templates/[id].vue:372-377,501`), halaman spin kosong saat load gagal (`:246-249`), scope implisit (`CompositionCanvas.vue:42-52`), aksi nested terbatas (`CompositionNodeView.vue:86-102`), `execCommand` (`CompositionCanvas.vue:69-71`), inspector URL mentah + kontrol tabel minim, swap tanpa konfirmasi, rollback tanpa konfirmasi, back `←` literal.

## Scope

### In Scope

- Scope insert eksplisit + reorder/wrap nested semua level + hapus `execCommand`
- BindingTab: picker administration nyata (memakai struktur step/template yang sudah ada), picker global-table tervalidasi (table + kolom, bukan free-text), manual/expression/system dirapikan + uji ekspresi inline
- Inspector: loop/filter/table/delete-row-column/image (URL + browse/upload via storage existing), swap component dengan konfirmasi
- Timeline rollback dengan konfirmasi; load-gagal dengan `NResult` + retry; back dengan ikon `ArrowLeft`
- Hapus seluruh copy "Task N" + tombol demo (atau pindahkan sesuai keputusan 30)
- Ikon `Used In` yang terbaca (ganti kode `"2s / 5d"`), konsistensi copy versi draft

### Out of Scope

- Richtext penuh (35), fungsi ekspresi baru (37), perubahan kontrak API/tree

## Dependencies

- `tasks/30-template-editor-ux-ui-design.md` — (WAJIB)
- Tasks 26/27 (fondasi), Task 25 (GAP-UI)

## User Flow

> MANDATORY — KONSISTEN dengan Task 30.

### Diagram

```text
[Entry] → {Editor} --(insert+scope)--> {Canvas} --(configure)--> {Inspector}
  --(bind 5 sources)--> {POST /api/templates/:id/bindings} --(validate-tree)--> {Publish → vN}
  --(rollback+confirm)--> {Draft}   --(load fail)--> {Retry}
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Designer | Buka editor | `GET /api/templates/:id` | Canvas + inspector |
| 2 | Designer | Insert + scope eksplisit | Canvas (client) | Node tepat |
| 3 | Designer | Konfigurasi node | Inspector (client) | Valid |
| 4 | Designer | Bind 5 sources | `PUT bindings` + preview | Unbound 0 |
| 5 | Designer | Validate + publish | `validate-tree`, `publish` | vN |
| 6 | Designer | Rollback | `rollback/:version` + confirm | Draft |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Load gagal | Editor → Retry | NResult + retry |
| ALT-02 | Unbound tersisa | Publish → block | Daftar slot + navigasi |
| ERR-01 | Binding invalid | PUT → 422 | Inline per baris |
| ERR-02 | Swap/rollback | Confirm | Batal aman / draft tertimpa sadar |

### Flow → UI Mapping

| Flow Step | Halaman (30) | Component | State |
|-----------|--------------|-----------|-------|
| Step 1–2 | editor | Canvas + scope | loading/error |
| Step 3 | editor | Inspector | validation |
| Step 4 | editor | BindingTab | bound/unbound/stale |
| Step 5–6 | editor | Timeline | confirm/success |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1 | GET | `/api/templates/:id` | — |
| Step 4 | PUT/GET | `/api/templates/:id/bindings*` | Binding DTO |
| Step 5 | POST | `/api/templates/:id/validate-tree`, `/publish` | ValidateTreeSchema |
| Step 6 | POST | `/api/templates/:id/rollback/:version` | — |

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Designer dapat menyusun + bind + publish template tanpa dead-end, tanpa copy internal, tanpa aksi destruktif diam-diam.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Designer | Menyusun template | Designer+ |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Designer | Insert ke scope benar | Node di scope dimaksud | Step 2 |
| UC-02 | Designer | Bind administration + global-table | Picker nyata, unbound 0 | Step 4 |
| UC-03 | Designer | Swap/rollback | Konfirmasi, tidak ada kehilangan diam-diam | Step 3/6 |

### Functional Requirements

- FR-001: Scope insert selalu eksplisit; nested reorder/wrap didukung — Step 2.
- FR-002: 5 sources punya picker/validasi nyata; tanpa placeholder disabled — Step 4.
- FR-003: Swap component dan rollback selalu konfirmasi — Step 3/6.
- FR-004: Tanpa `document.execCommand`; tanpa copy "Task N"; tanpa tombol demo hardcoded — seluruh flow.
- FR-005: Load gagal menampilkan retry, bukan spin kosong — Step 1.
- FR-006 (K-03): Picker component mendukung requirement bertipe `component` (nested);
  loop terdeteksi → alert + blokir aksi terkait — Step 2–4.

### Business Rules

- BR-001: Kontrak tree/binding/version tidak berubah (publish guard unbound tetap).
- BR-002: Aksi destruktif (swap-reset, rollback) wajib konfirmasi.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Binding stale (component berubah) | Tandai stale + rebind, bukan diam | Step 4 |
| EC-02 | Loop tanpa source valid | Blok publish dengan pesan | Step 5 |
| EC-03 | Session hilang saat edit | Draf kanvas dipertahankan + peringatan | Step 2–4 |

## Domain

> MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| Template (existing) | Blueprint + content tree | content JSON, status |
| TemplateBinding (existing) | Binding per placement | placementId, source, sourceRef |
| TemplateVersion (existing) | Snapshot immutable | version, content |

Tidak ada entity/atribut baru.

### Relationships

```text
Template ──1:N── TemplateBinding (existing)
Template ──1:N── TemplateVersion (existing)
```

### States

| State | Deskripsi | Transisi Diizinkan |
|-------|-----------|--------------------|
| DRAFT | представил | DRAFT → PUBLISHED (guard unbound) |
| PUBLISHED | vN frozen | PUBLISHED → DRAFT (rollback copy) |
| ARCHIVED | terkunci | terminal |

### Domain Rules

- DR-001: Rollback = copy-to-draft, history tidak tersentuh (existing dipertahankan).

### Invariants

- INV-001: Publish hanya saat unbound = 0 dan tree valid.

### Data Model

N/A — tidak ada migration.

## API

> MANDATORY.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/templates/:id` | GET | JWT | Designer | Detail + tree | Step 1 |
| 2 | `/api/templates/:id/bindings` | GET/PUT | JWT | Designer | Slots + bulk upsert | Step 4 |
| 3 | `/api/templates/:id/validate-tree` | POST | JWT | Designer | Validasi | Step 5 |
| 4 | `/api/templates/:id/publish` | POST | JWT | Designer | Terbit vN | Step 5 |
| 5 | `/api/templates/:id/rollback/:version` | POST | JWT | Designer | Rollback | Step 6 |

Kontrak existing (Tasks 14–16); detail mengikuti spec tersebut.

## UI

> MANDATORY. Mereferensikan Task 30.

### Referensi Design

- Design task: `tasks/30-template-editor-ux-ui-design.md`
- Wireframe/Mockup/Prototype: `docs/{wireframes,mockups,prototypes}/template-editor-ux/` / Storybook

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design |
|-------|---------|-------|-----------|---------------|
| `/dashboard/docs/templates/:id` | Editor | Designer | Canvas + inspector + tabs + timeline | Approved (30) |

### Layout / Components / Interaction / Responsive / States / Accessibility

Sesuai design 30 (scope indicator, BindingRow per source, inspector sections, timeline confirm, keyboard, ARIA, token). Deviasi dicatat dengan alasan.

## Acceptance Criteria

> MANDATORY.

### AC-001 — Insert tepat

Given container terpilih

When insert node

Then node di scope yang ditunjukkan indicator.

### AC-002 — 5 sources nyata

Given slot administration dan global-table

When bind

Then picker nyata + validasi; tidak ada disabled placeholder.

### AC-003 — Destruktif aman

Given swap/rollback

When dieksekusi

Then konfirmasi muncul; pembatalan aman.

### AC-004 — Bersih dan hidup

Given load gagal / halaman dibuka

When diamati

Then retry tersedia; tanpa copy internal; tanpa `execCommand`.

## Tasks

> MANDATORY.

### Backend

- [ ] Tidak ada perubahan kontrak; perbaiki hanya bug yang terbukti dari audit langsung
- [ ] Unit tests (`test:unit`) untuk perbaikan

### Frontend

- [ ] Scope indicator + insert eksplisit + nested reorder/wrap
- [ ] Hapus `execCommand`; toolbar canvas-native
- [ ] BindingTab pickers nyata (administration + global-table tervalidasi) + uji ekspresi
- [ ] Inspector lengkap (filter/table/image/swap-confirm)
- [ ] Timeline rollback confirm; load-gagal retry; back ikon
- [ ] Bersihkan copy Task-ref + demo; rapikan `Used In` + copy versi
- [ ] Unit (`test:unit`/`test:nuxt`) + E2E (`test:e2e`) mengacu User Flow

### Cross-Cutting

- [ ] RBAC tidak berubah; konsistensi dengan `tasks/30-*.md`

### Test Plan (QA)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | `tests/unit/composition/*.test.ts` | Tree ops, scope | FR-001, AC-001 |
| NT-01 | Nuxt — Component | `app/components/**/*.test.ts` | Canvas/inspector/binding states | Step 2–4, AC-001/002 |
| E2E-01 | E2E — Happy path | `tests/e2e/template-editor-ux.spec.ts` | Susun→bind→publish | Step 1–5, AC-001/002 |
| E2E-02 | E2E — Alternate | `tests/e2e/template-editor-ux.alt.spec.ts` | Swap/rollback confirm, retry, stale | ERR-02, ALT-01/02, AC-003/004 |

- [ ] Coverage Flow/AC/BR/EC 100%

## Verification (QA)

### Automated

- [ ] `vue-tsc`, `test:unit`, `test:nuxt`, `test:e2e`, `build` PASS

### Manual / QA Checklist

- [ ] Permission 401/403; BR/EC bertest; states/responsive/a11y sesuai 30; pixel-perfect 30; traceability penuh

## Assumptions

- Struktur step/template untuk picker administration tersedia dari API existing.
- Upload/browse image memakai storage existing bila diputuskan di 30.

## Open Questions

- (Diwarisi 30; ditutup saat design DONE.)

## Related Knowledge

- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`
- `tasks/30-template-editor-ux-ui-design.md` (WAJIB), Tasks 14–16 (kontrak), 26/27
- Wiki: template (Spec v2 C.1–C.5), rich-text-template, context-menu (Spec v2 popup), data-binding, component-looping, template-component-loop, administration-runtime §C–D

## Change Log

### Initial

- Task generated from Core Concept (FASE 2 — mengacu Task 30).
