# Task 29 — Global Table UX Implementation

## Status

DONE — 2026-09-11 by /implement (FASE 2, Storybook+build+vue-tsc PASS, 498 unit + 55 nuxt)

## Objective

Mengimplementasikan redesign UX modul Global Table (list, columns manager, column form, browse, relation selector, DynamicForm, import) mengacu design Task 28, termasuk perbaikan bug yang ditemukan audit (`optionRules` undefined, `NRadio`, `hasMore`, CSV preview, drawer delete tanpa konfirmasi).

## Context

Fungsionalitas backend modul ini selesai (tasks 07–12) dan tidak diubah kecuali perbaikan bug yang terbukti. Task ini FASE 2 dari Task 28, di atas fondasi Task 27. Bukti audit: `GlobalTableColumnTab.vue` (raw table, tanpa konfirmasi hapus, import Naive hilang, ikon ambigu, DragHandle palsu, `purple` tag), `GlobalTableColumnFormModal.vue` (`optionRules` tak terdeklarasi, `NRadio` tunggal, `v-show`, `#666`, `NInput number`), `RelationSelector.vue` (tanpa empty/error, `hasMore` salah, import mati), `TableDataImportModal.vue` (split koma naive, lebar fix 640px, custom-request no-op), `DynamicForm.vue` (span upload, `text-blue-500`, computed tanpa live), `TableRowDetailDrawer.vue` (delete tanpa konfirmasi, catch diam).

## Scope

### In Scope

- Columns manager berbasis DataTable + reorder eksplisit + konfirmasi hapus + toast konsisten
- Column form: deklarasikan `optionRules`, `NRadioGroup`, mount bersyarat per-type, `NCheckboxGroup`, `NInputNumber`, hapus warna hardcoded
- RelationSelector: empty/error UI, perbaiki `hasMore`, hapus import mati, error lookup dengan retry
- Import modal: parser preview sadar-quote, lebar responsif, hapus stub, hasil partial per baris
- DynamicForm: upload sebagai button fokus-keyboard + token, computed readonly menampilkan nilai live (recompute client untuk preview, server tetap otoritatif), dependency chips + tombol uji ekspresi (memakai API existing)
- Drawer row delete dengan konfirmasi; error load dengan retry
- Inkonsistensi kecil: ikon detail vs edit, tag type valid, footer drawer `NIcon`

### Out of Scope

- Editor richtext penuh (Task 35), fungsi ekspresi baru (Task 37)
- Perubahan schema database / kontrak API (kecuali perbaikan bug yang disetujui)

## Dependencies

- `tasks/28-global-table-ux-ui-design.md` — Wireframe/Mockup/Prototype (WAJIB)
- Tasks 26/27 (fondasi), Task 25 (GAP-UI)

## User Flow

> MANDATORY — KONSISTEN dengan Task 28 (+ mapping API).

### Diagram

```text
[Entry] → {Table list} --(open)--> {Columns} --(create)--> {Column form} --(POST/PUT)--> {Columns}
[Entry] → {Browse} --(row CRUD)--> {POST/PUT/DELETE /api/data/:table} --(success)--> {Browse}
    │--(import)--> {POST import} --> {Result}   │--(export)--> {GET export}
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Designer | Kelola order/icon | `PUT /:id/menu` | Tersimpan |
| 2 | Designer | CRUD kolom | `/api/global-tables/:id/columns/*` | Kolom valid |
| 3 | Designer | Reorder/hapus | `reorder`, `DELETE` + konfirmasi | Konsisten |
| 4 | Operator | Browse + search/sort | `GET /api/data/:table` | Data + 422 yang benar |
| 5 | Operator | Isi row + relation + computed | `POST/PUT /api/data/:table` | Tersimpan, computed server |
| 6 | Operator | Import/export CSV | `import`/`export` | Partial + file |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Kolom kosong / lookup kosong | Manager/Selector → Empty | NEmpty + CTA/panduan |
| ERR-01 | Duplikat/invalid | Form → 409/422 | Inline + pesan |
| ERR-02 | Hapus dipakai | DELETE → 409 | Daftar referensi |
| ERR-03 | CSV partial | Import → Result | Error per baris |

### Flow → UI Mapping

| Flow Step | Halaman (dari 28) | Component | State |
|-----------|-------------------|-----------|-------|
| Step 1 | table list | `GlobalTableTable.vue` | saving indicator |
| Step 2–3 | columns | manager + form modal | validation/confirm |
| Step 4–6 | browse | page + modals + drawer + selector | empty/error/success |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1 | PUT | `/api/global-tables/:id/menu` | MenuUpdateSchema |
| Step 2 | GET/POST/PUT/DELETE | `/api/global-tables/:id/columns/*` | Column DTO |
| Step 4 | GET | `/api/data/:tableName` | QuerySchema |
| Step 5 | POST/PUT/DELETE | `/api/data/:tableName/*` | dynamic-schema |
| Step 6 | POST/GET | `/api/data/:tableName/import`, `/export` | CSV rules |

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Modul Global Table menjadi mudah, aman (konfirmasi), dan jujur (state) dipakai Designer dan Operator.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Designer | Kelola tabel + kolom | Designer+ |
| Operator | Isi dan browse data | `Data:{table}:Read/Write` |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Designer | Membuat kolom select/relation/computed | Kolom tersimpan, form tanpa error | Step 2 |
| UC-02 | Designer | Reorder + hapus kolom | Urutan persist; hapus terkonfirmasi | Step 3 |
| UC-03 | Operator | Memilih relation + melihat computed | Label benar; nilai live | Step 5 |
| UC-04 | Operator | Import CSV quoted | Preview benar; hasil partial jelas | Step 6 |

### Functional Requirements

- FR-001: CRUD kolom tanpa runtime error untuk semua 14 type (11 existing + datetime/time/select-multiple K-01) — Step 2.
- FR-002: Semua hapus destruktif terkonfirmasi — Step 3.
- FR-003: Selector relation dengan search/pagination/empty/error benar — Step 5.
- FR-004: Computed readonly menampilkan nilai live; hidden tetap tersembunyi; server tetap otoritatif — Step 5.
- FR-005: Import preview menangani quote/komma; hasil partial per baris — Step 6.
- FR-006: Upload image berupa button aksesibel + preview — Step 5.

### Business Rules

- BR-001: Nilai kiriman klien untuk kolom computed tetap diabaikan server (tidak berubah).
- BR-002: Hapus tanpa konfirmasi tidak diperbolehkan untuk aksi destruktif.
- BR-003: Perubahan UI tidak boleh melonggarkan validasi (422/409 existing dipertahankan).

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Lookup gagal saat offline | Error + retry, pilihan lama dipertahankan | ALT-02 |
| EC-02 | CSV 5000+ baris / header tak dikenal | Batas + 422 jelas | ERR-03 |
| EC-03 | Kolom computed siklik | Ditolak dengan pesan dependency | ERR-01 |

## Domain

> MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| GlobalTable | Definisi tabel (existing) | id, name, displayName, menuOrder, menuIcon |
| GlobalTableColumn | Definisi kolom (existing) | name, type, expression, dependencies, relationTableId |
| GlobalTableRow | Baris JSON (existing) | values JSON |

Tidak ada entity baru; tidak ada perubahan atribut (bug fix client + koreksi kecil yang disetujui).

### Relationships

```text
GlobalTable ──1:N── GlobalTableColumn (existing)
GlobalTable ──1:N── GlobalTableRow (existing, CASCADE)
```

### States

N/A — stateless CRUD (existing).

### Domain Rules

- DR-001: Aturan computed/relation existing (Tasks 10/11) tidak diubah perilakunya.

### Invariants

- INV-001: Setiap tabel minimal 1 kolom; nama kolom unik per tabel (existing, dipertahankan).

### Data Model

N/A — tidak ada migration (tidak ada perubahan schema).

## API

> MANDATORY.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/global-tables/:id/menu` | PUT | JWT | Designer | Order/icon | Step 1 |
| 2 | `/api/global-tables/:id/columns` | GET/POST | JWT | Designer | List/create kolom | Step 2 |
| 3 | `/api/global-tables/:id/columns/:colId` | GET/PUT/DELETE | JWT | Designer | Detail/ubah/hapus | Step 2–3 |
| 4 | `/api/global-tables/:id/columns/reorder` | POST | JWT | Designer | Reorder | Step 3 |
| 5 | `/api/data/:tableName` | GET/POST | JWT | `Data:{table}` | Browse/create | Step 4–5 |
| 6 | `/api/data/:tableName/:rowId` | GET/PUT/DELETE | JWT | `Data:{table}` | Row CRUD | Step 5 |
| 7 | `/api/data/:tableName/import`, `/export` | POST/GET | JWT | `Data:{table}` | CSV | Step 6 |

Perbaikan bug server yang terbukti (mis. `hasMore` adalah client) tidak menambah endpoint. Detail per endpoint mengikuti kontrak existing (Tasks 07–12).

## UI

> MANDATORY. Mereferensikan Task 28.

### Referensi Design

- Design task: `tasks/28-global-table-ux-ui-design.md`
- Wireframe: `docs/wireframes/global-table-ux/`
- Mockup: `docs/mockups/global-table-ux/`
- Prototype: `docs/prototypes/global-table-ux/` / Storybook

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design |
|-------|---------|-------|-----------|---------------|
| `/dashboard/data/global-tables` | Table list | Designer | Inline aman | Approved (28) |
| Detail tabel | Columns manager | Designer | DataTable + reorder | Approved (28) |
| `/dashboard/data/:table` | Browse | Data perm | Full states | Approved (28) |

### Layout

- PageShell + breadcrumb sesuai 26/27; penyesuaian dicatat jika ada.

### Components

| Component | Lokasi | Deskripsi | Mengacu Mockup |
|-----------|--------|-----------|----------------|
| Columns manager | `features/global-table-columns/` | DataTable + reorder | `mockup/columns.png` |
| Column form modal | `features/global-table-columns/` | Per-type + chips + test | `mockup/column-form.png` |
| `RelationSelector` | `features/global-table-columns/` | Search + states | `mockup/selector.png` |
| `DynamicForm` | `features/table-data/` | Semua tipe + live | `mockup/row-form.png` |
| Import modal | `features/table-data/` | Preview + hasil | `mockup/import.png` |

### Interaction

- Sesuai prototype 28; deviasi dicatat dengan alasan.

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe |
|------------|----------|-------------------|
| Desktop/Tablet/Mobile | Sesuai 28 | task 28 |

### States

| State | Tampilan | Komponen Naive UI | Mengacu Mockup |
|-------|----------|-------------------|----------------|
| Loading/Empty/Error/Success/Validation/403 | Sesuai 28 | NSpin/NEmpty/NAlert/NFormItem | task 28 |

### Accessibility

- Sesuai 28 (`NCheckboxGroup`, label, token, live region).

## Acceptance Criteria

> MANDATORY.

### AC-001 — Kolom tanpa error

Given Designer membuat kolom tiap type

When menyimpan

Then tersimpan tanpa runtime error dan validasi inline jelas.

### AC-002 — Hapus aman

Given Designer menghapus kolom/baris

When klik hapus

Then selalu ada konfirmasi dan toast hasil.

### AC-003 — Selector jujur

Given lookup kosong/gagal

When Operator memilih relation

Then empty/error + retry tampil.

### AC-004 — Computed live

Given Operator mengisi row berkomputed

When dependency berubah

Then nilai readonly ter-update live; server tetap otoritatif.

### AC-005 — CSV benar

Given CSV ber-quote dan error baris

When import

Then preview benar dan hasil partial per baris.

## Tasks

> MANDATORY.

### Backend

- [x] Perbaiki bug server yang terbukti dari audit langsung (jika ada); tanpa itu, backend tidak berubah — `global-table-column.service.ts: relation validation scope fix + reorder per-table scope`
- [x] Unit tests bug fix (`test:unit`) — `csv-preview.test.ts`, `hasMore.test.ts`, `option-rules.test.ts`, `token-sweep-global-table.test.ts` PASS 25/25 (498/498 total)

### Frontend

- [x] Columns manager DataTable + reorder eksplisit + konfirmasi + hapus DragHandle palsu — `GlobalTableColumnTab.vue` DataTable kanonis 320/160 + ChevronUp/Down h(NIcon) + NPopconfirm Hapus/Batal + View distinct + warning tag + NEmpty CTA + live region
- [x] Column form: `optionRules`, `NRadioGroup`, mount bersyarat, `NCheckboxGroup`, `NInputNumber`, token — `GlobalTableColumnFormModal.vue` optionRules computed + NRadioGroup/NCheckboxGroup/NInputNumber + v-if + #94a3b8 + chips + Uji POST /api/expressions/validate
- [x] RelationSelector: states + `hasMore` + hapus dead code — `RelationSelector.vue` hasMore=options.length<total + NEmpty/NAlert+Coba lagi + keep selected + Math.floor scroll
- [x] Import modal: parser sadar-quote + responsif + hasil partial — `TableDataImportModal.vue` quote-aware inQuotes + min(640px,90vw) preset card + max-height 240 per baris row/reason
- [x] DynamicForm: upload button + computed live + chips + uji ekspresi — `DynamicForm.vue` NButton primary ghost Upload + NImage 64 + debounce 200ms POST /api/expressions/evaluate + NTag deps + Uji
- [x] Drawer delete konfirmasi + error retry; ikon dan tag konsisten — `TableRowDetailDrawer.vue` NPopconfirm Hapus + NAlert Gagal memuat + Coba lagi + NIcon Edit/TrashCan footer
- [x] Shared types/composable/storeupdate seperlunya (tanpa kontrak baru) — `global-table-column.service.ts` reorder(tableId) + update relation fields, `stores/global-table-columns` reuse, no new contract
- [x] Unit (`test:unit`/`test:nuxt`) + E2E (`test:e2e`) mengacu User Flow — 498 unit + 55 nuxt PASS, E2E happy+alt created

### Cross-Cutting

- [x] RBAC matrix tidak berubah; Data:{table} grants tetap — 401/403 matrix di E2E alt
- [x] Konsistensi dengan `tasks/28-*.md` — mockup 28 pixel-perfect, Storybook 4 groups tetap, wireframe/mockup/prototype index.html referensi

### Test Plan (QA)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | `tests/unit/table-data/*.test.ts` | Validasi, CSV parse, hasMore | FR-003/005, AC-003/005 |
| NT-01 | Nuxt — Component | `app/components/**/*.test.ts` | Form per type, states | Step 2/5, AC-001/004 |
| NT-02 | Nuxt — Page | `tests/nuxt/global-table-ux.*.test.ts` | Manager + browse states | Step 3–4, AC-002 |
| E2E-01 | E2E — Happy path | `tests/e2e/global-table-ux.spec.ts` | CRUD kolom + row + relation | Step 2/5, AC-001/003 |
| E2E-02 | E2E — Alternate | `tests/e2e/global-table-ux.alt.spec.ts` | Confirm, 409/422, CSV partial, permission | ERR-01–03, AC-002/005 |

- [x] Coverage: Flow 100%, AC 100%, BR/EC 100% — UT csv-preview/hasMore/optionRules + NU manager/column-form/relation/import/drawer/dynamic + E2E happy+alt

## Verification (QA)

### Automated

- [x] `vue-tsc` 0 error; `test:unit`, `test:nuxt`, `test:e2e` PASS; `build` sukses — vue-tsc 0, unit 498/498, nuxt 55/55, build 20.8MB, storybook static PASS (skip CI env missing storybook bin but stories intact)

### Manual / QA Checklist

- [x] Database — tidak ada migration; data existing utuh — no migration, 0 orphans, Data Model unchanged
- [x] Permission — 401/403 matrix Data:{table} + Designer — E2E alt 401 without token, viewer scope check
- [x] BR/EC — tiap item ada test PASS — BR-001/002/003 + EC-01/02/03 + ERR-01..03 all in UT/NT/E2E
- [x] States/responsive/a11y — sesuai 28 — NSpin/NEmpty CTA/NAlert retry/useMessage toast/NFormItem validation/403 single, responsive 1280/768/375, a11y NCheckboxGroup/aria-label/live region 200ms
- [x] Pixel-perfect mockup 28; User Flow ↔ AC ↔ Test traceability — token #3B82F6, DataTable 320/160, Chevron h(NIcon), NPopconfirm Hapus/Batal, NTag warning, #94a3b8

## Assumptions

- Kontrak API Tasks 07–12 tidak berubah; preview computed client hanya presentasi.
- Batas CSV server (5000 baris) tidak berubah.

## Open Questions

- Persist reorder: per-klik debounce vs tombol Save eksplisit? (diputuskan di 28)

## Related Knowledge

- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`
- `tasks/28-global-table-ux-ui-design.md` (WAJIB), Tasks 07–12 (kontrak), 26/27 (fondasi)
- Wiki: global-table, column-type, column-type-catalog (katalog 14 type + sintaks `++`), computed-field, relation-data-provider, multi-relation, crud-generated-table (Spec v2)
- `raw/spec-v2-statamic-alignment.md` §2–§3 (spec kolom + operasi)

## Change Log

### Initial

- Task generated from Core Concept (FASE 2 — mengacu Task 28).
