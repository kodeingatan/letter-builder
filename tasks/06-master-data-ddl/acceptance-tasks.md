## Acceptance Criteria

### AC-001 — Buat tabel Pegawai

Given form definisi valid (5 kolom incl. number+IDR, hidden-operation)

When `POST /api/master-data`

Then `mst_pegawai` ada + menu `Pegawai` muncul + definisi tersimpan.

### AC-002 — Browse search/sort/visibility

Given 3 baris Pegawai

When search "afd" (kolom searchable) + sort gaji (orderable) + hide kolom

Then hasil tersaring/terurut; kolom non-orderable tak bisa di-sort; visibility persist.

### AC-003 — Form 13 tipe + relation

Given tabel Jabatan + Pegawai.relation→Jabatan

When buka form baris → picker modal (search+sort+checkbox) → pilih 1

Then tersimpan; multiple memilih N.

### AC-004 — Operasi-teks identik klien/server

Given `gaji=2jt,bonus=500rb`, rumus `"Total: "++gaji+bonus`

When ketik (preview) lalu save → baca ulang

Then preview = nilai tersimpan (`"Total: 2500000"`); div-by-zero → pesan.

### AC-005 — Proteksi referensi & DDL aman

Given Pegawai dipakai relation Template

When hapus tabel/kolom itu

Then 409 + daftar referensi; alter destruktif meminta konfirmasi + backup.

### AC-006 — Schema untuk builder

Given `mst_pegawai` aktif

When `GET /api/master-data/pegawai/schema`

Then daftar kolom + tipe tersedia untuk Task 07.

### AC-007 — RBAC + Storybook

Given Viewer vs Admin / tanpa token

When akses definisi/rows + buka Storybook

Then 401/403 benar; `npm run storybook` stories master-data tampil; `build-storybook` sukses.

## Tasks

### Backend

- [x] Entity `server/entities/master-table.entity.ts`, `master-table-column.entity.ts` + registrasi `orm-data-source.ts`.
- [x] DTO `server/dto/master-data.dto.ts` (Create/Update Table discriminated 13 tipe + Row dinamis + Query).
- [x] `master-ddl.service` (sanitize, CREATE/alter-rebuild, backup, blacklist, ignore-drift hook).
- [x] `master-data.service` (CRUD definisi + rows via QueryBuilder + komputasi operasi server + cek referensi).
- [x] API 7 endpoint di atas (`requireApiAccess`, `createError`, pagination standar).
- [x] `migration-status.ts` ignore `mst_*`; seed contoh bila kosong; ActivityLog.
- [x] Storage whitelist untuk `image` kolom (reuse `general`/`avatars` atau tambah `master`).

### Frontend

- [x] Types `shared/types/master-data.ts` + composable `useMasterData.ts` + store bila perlu.
- [x] Pages `/dashboard/master-data/*` + Components (DataTable/Form/Row/RelationPicker) sesuai mockup inline.
- [x] 13 input + IDR realtime + operasi preview + validasi sinkron Zod.
- [x] Visibility per slug (localStorage), search debounce 300ms, sort whitelist.
- [x] Storybook `stories/master-data/{List,Form,RelationPicker}.stories.ts` (default/loading/empty/error/validation).

### Cross-Cutting

- [x] Permission `Master Data Read/Write` + guard + sidebar dinamis per tabel.
- [x] Backup pre-alter + batas upload 5MB + cap kolom/baris.

### Test Plan

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit DDL sanitize | `test/unit/server/services/master-ddl.service.test.ts` | slug/kolom, blacklist, SQL map | BR-001/006, AC-001 |
| UT-02 | Unit operasi | `test/unit/server/services/master-operation.test.ts` | 13 tipe, operasi, div-zero | FR-006, AC-004 |
| UT-03 | Unit DTO | `test/unit/server/dto/master-data.dto.test.ts` | discriminated union | FR-001, AC-001 |
| NT-01 | Nuxt form | `test/nuxt/master-data.form.test.ts` | 13 input, IDR, picker, states | Step 4, AC-003/004 |
| E2E-01 | E2E definisi→browse | `test/e2e/master-data.spec.ts` | Step 1→4 happy | AC-001..004 |
| E2E-02 | E2E proteksi | `test/e2e/master-data-protect.spec.ts` | 409, 403, empty | AC-005/007 |
