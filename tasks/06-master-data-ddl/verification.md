## Verification

### Automated

- [x] Typecheck 0 error; `test:unit` UT-01..03 + util PASS (full suite 198/198, 2026-09-13); `test:nuxt` NT-01 PASS (5/5; full 57/57).
- [x] E2E-01/02 PASS 10/10 (search/sort/visibility-key, picker triggers + relation API single/multiple + 400 ref, operasi, 409/403/401/400).
- [x] `npm run storybook` + `build-storybook` sukses (MasterData/List, Form, RelationPicker di index.json; paket core `storybook` di-install — gap infra pre-existing).
- [x] `npm run build` sukses; `mst_*` tidak masuk migration drift (drift = bookkeeping migrasi; helper `isMasterPhysicalTable` + test).

### Manual / QA Checklist

- [x] Buat Pegawai → `mst_pegawai` + menu muncul (AC-001, E2E + UI).
- [x] Search/sort/visibility sesuai flag (AC-002, E2E + storageKey per slug).
- [x] Relation single/multiple via modal (AC-003, NT triggers + API + Storybook interaktif).
- [x] Preview operasi = tersimpan (AC-004, modul server sama + E2E).
- [x] Hapus terproteksi + backup (AC-005, 409 live + `storage/backups/`).
- [x] Schema API dibaca builder (AC-006, E2E).
- [x] 401/403 + Storybook viewport/a11y (AC-007, E2E + build).

## Assumptions

- SQLite `better-sqlite3` cukup untuk ≤50k baris/tabel; bila lebih, tambah index dinamis per kolom searchable.
- Upload image reuse storage existing; penambahan folder `master/` opsional.
- UI-First digabung inline (tanpa folder `-ui-design`) atas permintaan 3 folder; Storybook tetap wajib sebelum DONE.
- [decided by /auto-all-tasks 2026-09-13] Task 05 DONE → reuse langsung `ExpressionService` (tanpa fallback duplikasi). Preview operasi klien mengimpor modul server yang sama (murni, tanpa node import) sehingga identik by-construction (FR-006).
- [decided by /auto-all-tasks 2026-09-13] Kolom image reuse subfolder `general` (upload via `/api/settings/upload`); tanpa folder `master/` baru.
- [decided by /auto-all-tasks 2026-09-13] Sidebar statis: parent `Master Data → Definisi Tabel`; per-tabel browse via link dalam halaman (tanpa fetch definisi di layout — menjaga layout stabil).
- [decided by /auto-all-tasks 2026-09-13] Drift detection (`migration-status.ts`) bersifat bookkeeping-migrasi (table-agnostic) → BR-006 dipenuhi via helper eksplisit `isMasterPhysicalTable`/`filterManagedTables` + test, tanpa perubahan logika drift.
- [decided by /auto-all-tasks 2026-09-13] `permission-matrix.ts` stub TIDAK diubah (di-pin test Task 02); permission `Master Data Read/Write` di-seed + backfill ke Super Admin. Guard URL tak diubah (pola Task 05).
- [decided by /auto-all-tasks 2026-09-13] Create tabel default `ACTIVE` (DRAFT hanya lewat update mundur yang ditolak); transisi valid ACTIVE→ARCHIVED ditegakkan; hard-delete baris (soft-delete tetap Open Question).
- [decided by /auto-all-tasks 2026-09-13] Wireframe di `tasks/06-master-data-ddl/wireframes/` (mengikuti praktik Task 03), bukan `docs/` (tak ada dir wireframes di `docs/`).
- [decided by /auto-all-tasks 2026-09-13] `server/utils/orm-data-source.ts` memakai import relatif; file service/DTO Task 06 memakai relatif agar vitest-safe (pola Task 05). Ditemukan: TypeORM better-sqlite3 `query(INSERT)` resolve ke angka `lastInsertRowid` (bukan objek) — ditangani dua bentuk.
- [decided by /auto-all-tasks 2026-09-13] Storybook: paket inti `storybook` belum ter-install (hanya addons) sehingga `npm run build-storybook` gagal `not found` — di-install (`storybook` core) lalu build sukses incl. 3 grup MasterData. Ini gap infra pre-existing, bukan kode.
- [decided by /review Task 06 2026-09-13] Rename kolom = drop + add (data kolom lama tidak terbawa; backup `storage/backups/` tersedia). DDL validation error membawa `statusCode: 400` (bukan 500). URL image dibatasi allowlist renderer (anti `javascript:`). Count definisi tanpa join (anti inflasi total). Halaman `[slug]`/`edit` refetch saat param berubah (reuse instance).

## Open Questions (dijawab saat implementasi)

- Import/export CSV Master Data → TUNDA (Out of Scope, tak diimplementasikan).
- Soft-delete vs hard-delete → HARD-delete untuk task ini (tetap Open Question untuk follow-up).
- Index otomatis `is_searchable` → TIDAK (LIKE + pagination cukup untuk ≤50k; FTS5 follow-up bila perlu).

## Open Questions

- Perlu import/export CSV Master Data di task ini atau tunda?
- Soft-delete baris vs hard-delete?
- Index otomatis untuk semua `is_searchable` (LIKE) — cukup atau perlu FTS5?

## Related Knowledge

- `docs/architecture.md` (service/DTO/API), `docs/database.md` (tambah 2 meta + `mst_*`), `tasks/05-document-engine/*` (expression reuse).
- `.ua/` bila ada.

### Ringkasan implementasi (2026-09-13, tanpa ubah `docs/` permanen)

- Meta: `master_tables` + `master_table_columns` (EntitySchema, CASCADE, UNIQUE(tableId,name)); migrasi `1789300000000-CreateMasterTables`; registrasi `orm-data-source.ts` (11 schemas).
- `master-ddl.service`: sanitize slug/kolom, blacklist + prefix + keyword, peta 13 tipe→SQL, CREATE/ADD, rebuild (backup `storage/backups/`), DROP, PRAGMA inspect.
- `master-data.service`: CRUD definisi + rows SQL berparameter, komputasi operasi server (DR-003), validasi per tipe, search(sort)-whitelist (BR-003), cek referensi relation (BR-004 → 409), transisi status.
- API 11 route files (7 endpoint): definitions CRUD, rows CRUD, schema. `requireApiAccess` + Zod + `createError(statusCode)` + ActivityLog (MASTER_TABLE_*/MASTER_ROW_*).
- Frontend: store `master-data.ts` ($fetch + Bearer), 5 komponen, 4 halaman, menu sidebar, util `master-operation.ts` (preview/IDR/date-display), stories `master-data/` (List/Form/RelationPicker + withProviders $fetch-stub), wireframes SVG di folder task.

## Change Log

### Initial

- Task specification created (Master Data DDL — 06 dari roadmap 05→06→07).
