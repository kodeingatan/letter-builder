## Objective

Membangun Master Data: admin mendefinisikan tabel (`name/display_name/slug/columns`) yang terwujud sebagai tabel fisik `mst_<slug>` via DDL aman, lalu setiap tabel menjadi menu browse + form dinamis (13 tipe kolom) + Data Source bagi Document Engine Task 05/07.

## Context

Task kedua dari roadmap `05 → 06 → 07`. Bergantung pada Task 05 (expression operasi-teks + renderer dipakai untuk preview/template). Menggantikan konsep "Global Tabel" lama yang dihapus Task 01 — kini dengan nama Master Data, prefix `mst_`, dan aturan drift-ignore. Pola existing: `EntitySchema + Zod + Service object + DataTable + PageShell + requireApiAccess`.

## Scope

### In Scope

- Meta: `master_tables`, `master_table_columns` (EntitySchema + registrasi `orm-data-source.ts`).
- `master-ddl.service`: sanitize slug/kolom, `CREATE TABLE mst_*`, alter aman (tambah kolom; hapus/rename via rebuild `CREATE baru → COPY → DROP` + backup), tolak keyword/blacklist.
- 13 tipe: `text, richtext, date(fmt default m-d-Y), datetime(m-d-Y H:i:s), time(H:i:s), image(storage/), select(options), select_multiple(JSON), relation_single(modal tabel+search+sort+checkbox 1), relation_multiple(checkbox N), number(+IDR realtime), hidden_operation_text, readonly_operation_text`.
- Operasi-teks grammar: `expr := concat("++"concat)*`, string `"..."`, `col_ref/number/(expr)`, `* / + -` — evaluasi klien realtime + server saat save (reuse Task 05).
- Browse hasil per tabel: menu item baru `Master Data → [display_name]`, search hanya kolom `is_searchable`, sort hanya `is_orderable`, visibility kolom (localStorage), pagination standar.
- Form dinamis per tipe + relation picker modal + upload image + validasi required.
- `GET /api/master-data/:slug/schema` untuk builder Task 07 (daftar tabel+kolom).
- Permission `Master Data Read/Write` + guard `/api/master-data/*`; drift detection ignore `mst_*`; seed contoh (Pegawai/Jabatan bila kosong).
- Storybook `stories/master-data/` (List/Form/RelationPicker states).

### Out of Scope

- Engine renderer/PDF (Task 05, hanya dipakai).
- Component Tiptap + Template + Administrasi wizard (Task 07, hanya sediakan schema API).
- Import/export CSV, audit per-baris (cukup ActivityLog per aksi), workflow approval.

## Dependencies

- `tasks/05-document-engine/README.md` — TODO (expression + renderer; bila belum DONE, duplikasi minimal evaluator operasi-teks sementara + catat deviasi).
- `tasks/04-redesign/README.md` — DONE (PageShell/DataTable/Notion-calm).
- `server/utils/orm-data-source.ts`, `migration-status.ts`, `permission-matrix.ts`, `storage.service.ts`.
