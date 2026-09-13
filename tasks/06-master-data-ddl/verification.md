## Verification

### Automated

- [ ] Typecheck 0 error; `test:unit` UT-01..03 PASS ≥80%; `test:nuxt` NT-01 PASS semua state.
- [ ] E2E-01/02 PASS (search/sort/visibility, picker, operasi, 409/403).
- [ ] `npm run storybook` + `build-storybook` sukses (stories master-data).
- [ ] `npm run build` sukses; `mst_*` tidak masuk migration drift (cek `migration-status`).

### Manual / QA Checklist

- [ ] Buat Pegawai → `mst_pegawai` + menu muncul (AC-001).
- [ ] Search/sort/visibility sesuai flag (AC-002).
- [ ] Relation single/multiple via modal (AC-003).
- [ ] Preview operasi = tersimpan (AC-004).
- [ ] Hapus terproteksi + backup (AC-005).
- [ ] Schema API dibaca builder (AC-006).
- [ ] 401/403 + Storybook viewport/a11y (AC-007).

## Assumptions

- SQLite `better-sqlite3` cukup untuk ≤50k baris/tabel; bila lebih, tambah index dinamis per kolom searchable.
- Upload image reuse storage existing; penambahan folder `master/` opsional.
- UI-First digabung inline (tanpa folder `-ui-design`) atas permintaan 3 folder; Storybook tetap wajib sebelum DONE.

## Open Questions

- Perlu import/export CSV Master Data di task ini atau tunda?
- Soft-delete baris vs hard-delete?
- Index otomatis untuk semua `is_searchable` (LIKE) — cukup atau perlu FTS5?

## Related Knowledge

- `docs/architecture.md` (service/DTO/API), `docs/database.md` (tambah 2 meta + `mst_*`), `tasks/05-document-engine/*` (expression reuse).
- `.ua/` bila ada.

## Change Log

### Initial

- Task specification created (Master Data DDL — 06 dari roadmap 05→06→07).
