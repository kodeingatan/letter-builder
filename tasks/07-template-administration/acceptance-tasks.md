## Acceptance Criteria

### AC-001 — Component via right-click

Given editor Tiptap + klik kanan → `nama=item.name, view=text`

When save → preview

Then placeholder tampil sebagai teks terikat dan ter-render di preview template.

### AC-002 — Component loop + nested

Given `is_looping` + binding `item.name/nip` (+ nested card)

When dipakai dalam repeater Template

Then N baris ter-render; non-`item.*` ditolak publish (BR-003).

### AC-003 — Template embed + looping pilih semua

Given Template SK embed Kop + Daftar → pilih `mst_pegawai` + pilih semua kolom

When isi auto-form → preview

Then repeater terisi data Master; auto-form mencakup semua requirement.

### AC-004 — Preview PDF template

Given template valid + data

When `preview-pdf`

Then PDF terbuka dengan kop, judul, daftar, tanda tangan.

### AC-005 — Administrasi + wizard gabungan

Given Administrasi 2 step (SK + Tanda tangan)

When wizard isi → tambah step → render → save run

Then dokumen gabungan + PDF tersimpan; menu `[Nama Surat]` ada.

### AC-006 — Proteksi & versioning

Given component/template dipakai

When hapus / publish ulang

Then 409 + daftar; version naik; run lama tetap render versi lama.

### AC-007 — RBAC + Storybook

Given roles berbeda + Storybook

When akses builder/wizard + `npm run storybook`

Then 401/403 benar; stories template-admin tampil; `build-storybook` sukses.

## Tasks

### Backend

- [x] Entities 5 tabel + registrasi `orm-data-source.ts` + migration additive (post-baseline Task 23).
- [x] DTO Zod: component (tiptap+binding), template (schema reuse 05 + requirement), admin/steps, run.
- [x] Services: `doc-components` (CRUD+preview+ref-check), `doc-templates` (CRUD+form-schema+publish/version), `administrations` (CRUD+steps), `documents` (run gabungan → panggil renderer/pdf 05, kunci versi).
- [x] API 10 endpoint (`requireApiAccess`, `createError`, pagination).
- [x] Converter Tiptap↔DocNode + validasi binding (master via schema 06 / manual / system).
- [x] Deps: `tiptap` (`@tiptap/vue-3, starter-kit, table, image, link`), sanitizer reuse 05.
- [x] Seeder contoh (Kop, SK, Administrasi demo) + permission/guards + ActivityLog.

### Frontend

- [x] Types/composables/stores: `useComponentsData, useTemplatesData, useAdministrationsData, useBuilderStore(blocks, selectedId, update/move/add)`.
- [x] Pages 4 rute + 8 komponen builder/wizard sesuai mockup inline (Naive UI direct import + Tailwind + token `#0075de`).
- [x] Tiptap editor + BindingPopup (right-click) + Relation/looping picker (reuse 06) + auto-form + PreviewDrawer.
- [x] Wizard tambah-step-N + draft DRAFT + render gabungan + unduh PDF.
- [x] Sidebar: grup `Persuratan` (Component/Template/Administrasi) + menu dinamis per administrasi.
- [x] Storybook `stories/template-admin/{Component,Builder,Wizard}.stories.ts` (semua state).

### Cross-Cutting

- [x] RBAC matrix + guards `/api/doc-*`, `/api/administrations/*`, `/api/documents/*`.
- [x] Cap upload Tiptap image 5MB; sanitasi semua richtext.

### Test Plan

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit converter | `test/unit/server/services/tiptap-converter.test.ts` | binding/loop/condition map | FR-001/004, AC-001/003 |
| UT-02 | Unit publish/version | `test/unit/server/services/doc-templates.service.test.ts` | requirement, version, 409 | BR-002/004/005, AC-006 |
| UT-03 | Unit wizard | `test/unit/server/services/administrations.service.test.ts` | mapping, gabungan | FR-007/008, AC-005 |
| NT-01 | Nuxt builder | `test/nuxt/template-builder.test.ts` | canvas/panel/states | Step 3, AC-003 |
| NT-02 | Nuxt tiptap | `test/nuxt/component-editor.test.ts` | toolbar, popup, preview | Step 1, AC-001 |
| E2E-01 | E2E surat | `test/e2e/persuratan.spec.ts` | Step 1→4 happy + PDF | AC-001..004 |
| E2E-02 | E2E wizard | `test/e2e/administration-wizard.spec.ts` | Step 5→6 + draft + 409 | AC-005/006 |
