## Domain

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| MasterTable | Definisi tabel | id, name, display_name, slug, description |
| MasterColumn | Definisi kolom | id, table_id, name, display_name, type(13), config_json, default_value, is_required/orderable/searchable, sort_order |
| MasterRow | Baris fisik di `mst_*` (bukan EntitySchema; akses via QueryBuilder) | id, kolom dinamis, created_at, updated_at |

### Relationships

```text
MasterTable ──1:N── MasterColumn (CASCADE delete; tolak bila direferensi → BR-004)
MasterTable ──1:N── MasterRow (fisik mst_*; hapus tabel → DROP setelah backup)
MasterColumn ──N:1── MasterTable (relation_single/multiple merujuk MasterTable lain — relasi logis)
```

### States

| Entity | State | Deskripsi | Transisi Diizinkan |
|--------|-------|-----------|--------------------|
| MasterTable | DRAFT → ACTIVE → ARCHIVED | Definisi → dipakai → disembunyikan | DRAFT→ACTIVE, ACTIVE→ARCHIVED |
| N/A rows | — | Stateless CRUD | — |

### Domain Rules

- DR-001: Slug/kolom disanitasi server; klien tidak dipercaya.
- DR-002: `config_json` divalidasi per tipe (options/relation/fmt/operasi) via Zod discriminated union.
- DR-003: Nilai operasi-teks selalu dikomputasi ulang server (klien hanya preview).

### Invariants

- INV-001: Setiap ACTIVE table ≥1 kolom dan ≥1 kolom searchable tidak wajib tetapi browse tanpa search bila 0.
- INV-002: Tipe kolom tak dikenal → tolak definisi (tidak ada fallback).

### Data Model

#### master_tables

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | number | Y | Y | auto | PK |
| name | varchar(60) | Y | N | — | Nama internal `[a-z0-9_]` |
| display_name | varchar(120) | Y | N | — | Label menu |
| slug | varchar(64) | Y | Y | auto dari name | Identitas fisik `mst_<slug>` |
| description | text | N | N | null | Keterangan |

- Index: UNIQUE(slug).

#### master_table_columns

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | number | Y | Y | auto | PK |
| table_id | number | Y | N | — | FK → master_tables.id CASCADE |
| name | varchar(60) | Y | per-tabel | — | Nama kolom fisik |
| display_name | varchar(120) | Y | N | — | Label form/tabel |
| type | enum(13) | Y | N | — | Lihat Scope |
| config_json | text | N | N | null | options/relation/fmt/operation |
| default_value | text | N | N | null | Default |
| is_required/orderable/searchable | boolean | Y | N | false | Flag |
| sort_order | number | Y | N | 0 | Urutan |

Fisik `mst_<slug>`: `id INTEGER PK, created_at/updated_at DATETIME` + kolom peta tipe (`TEXT`/`DATETIME`/`REAL`/`INTEGER`/JSON TEXT/image path TEXT).

## API

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/master-data` | GET | JWT | read | List definisi paginated | Step 1 |
| 2 | `/api/master-data` | POST | JWT | write | Create definisi + DDL | Step 2 |
| 3 | `/api/master-data/:slug` | GET/PUT/DELETE | JWT | read/write | Detail/alter/drop | Step 2/6 |
| 4 | `/api/master-data/:slug/rows` | GET | JWT | read | Browse baris (search/sort/page) | Step 3 |
| 5 | `/api/master-data/:slug/rows` | POST | JWT | write | Create baris (komputasi operasi) | Step 4 |
| 6 | `/api/master-data/:slug/rows/:id` | GET/PUT/DELETE | JWT | read/write | Detail/ubah/hapus | Step 4/6 |
| 7 | `/api/master-data/:slug/schema` | GET | JWT | read | Schema untuk builder Task 07 | Step 5 |

- Query rows: `page/limit/search(all searchable)/sortBy(whitelist orderable)/sortOrder` → `{data,total,page,limit,totalPages}`.
- Zod: `CreateTableSchema` (name/display/columns[discriminated 13]) + `RowSchema` dinamis dari definisi.
- Error: 400 validasi, 404 slug tak ada, 409 slug duplikat/referensi, 401/403.
- Auth: `requireApiAccess` method+URL.

## UI

### Referensi Design

- Inline di task ini (tanpa folder `-ui-design` terpisah): wireframe `docs/wireframes/master-data/` + Storybook `stories/master-data/` (dibuat saat implementasi; pola Task 03).

### Halaman

| Route | Halaman | Akses | Deskripsi |
|-------|---------|-------|-----------|
| `/dashboard/master-data` | Definisi List | Write/Read | Tabel definisi + Create |
| `/dashboard/master-data/create` | Definisi Builder | Write | Nama + editor kolom dinamis |
| `/dashboard/master-data/:slug` | Browse Hasil | Read | DataTable dinamis per tabel |
| `modal` | Relation Picker | Read | Modal tabel relasi + checkbox |

- Layout: PageShell + DataTable kanonis + FormModal; builder kolom = daftar baris dinamis (tambah/hapus) + config panel per tipe.
- Components: `MasterTableDataTable.vue`, `MasterTableForm.vue` (definisi), `MasterRowTable.vue`, `MasterRowForm.vue` (13 input), `RelationPickerModal.vue`.
- States: loading/empty/error/validation/403 (NEmpty+NAlert+retry), IDR realtime, operasi preview.
- Responsive: desktop tabel penuh; tablet visibility toggle; mobile drawer/form full-width. A11y: keyboard, aria-label icon, reduced-motion.
