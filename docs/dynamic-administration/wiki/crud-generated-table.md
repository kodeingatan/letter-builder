# CRUD Generated Table

Global Table secara otomatis menghasilkan behavior:

```text
Browse
   │
   ├── Search
   ├── Column visibility
   ├── Sorting
   └── Pagination

Create
   │
   └── Generate form dari Column Definition

Edit
   │
   └── Generate form dari Column Definition

Delete
```

Misalnya column:

```text
name = "tanggal_lahir"
type = "date"
format = "m-d-Y"
required = true
searchable = true
orderable = true
```

UI otomatis mengetahui:

```text
Input     → Date Picker
Display   → 08-30-2026
Required  → Yes
Search    → Enabled
Sort      → Enabled
```

## Spec v2 — Hasil Generated (mengikat)

- **Menu**: tiap tabel menjadi menu item baru (grup Data) yang mengarah ke browse tabel tersebut.
  Lihat [[generated-menu]].
- **Browse menyediakan**: searching (hanya kolom ter-check `searchable`),
  options visibilitas (kolom apa saja yang tampil), orders per kolom
  (aksi urutkan hanya bila kolom ter-check `orderable`).
- **Create/delete memetakan tiap type** (detail: [[column-type-catalog]]):
  text, richtext, date, datetime, time, image, select, select-multiple,
  select-table-relation (tabel + search all + order + check awal),
  select-table-relation-multiple (sama + multi-check), number (+IDR bila currency),
  hidden-operation-text (tanpa input + operasi), readonly-operation-text (terlihat + operasi + read-only).
- **Delete data tabel** selalu konfirmasi; 409 bila masih direferensikan.

## Related Concepts

- [[global-table]] — global table menghasilkan CRUD
- [[column-type]] — type menentukan UI component
- [[column-type-catalog]] — katalog 14 type + perilaku per type
- [[generated-menu]] — menu item hasil proyeksi
