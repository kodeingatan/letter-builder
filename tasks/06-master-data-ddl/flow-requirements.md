## User Flow

### Diagram

```text
[Admin] → /dashboard/master-data → Create definisi (nama + kolom) → DDL mst_pegawai tercipta
 → Master Data → Pegawai → browse (search/sort/visibility) → Create baris (form dinamis)
 → relation picker / operasi-teks realtime → Save → toast → list refresh
 → Task 07: GET /api/master-data/pegawai/schema sebagai Data Source
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Admin | Buka Master Data, klik Create | `/dashboard/master-data` | Form definisi kosong |
| 2 | Admin | Isi `Pegawai` + kolom (nama text required/search, tgl date, gaji number+IDR, total hidden-operation) | `POST /api/master-data` | `mst_pegawai` tercipta + menu baru |
| 3 | Admin | Buka hasil `Pegawai` | `/dashboard/master-data/pegawai` → `GET /api/master-data/pegawai/rows` | Tabel + search/sort/pagination |
| 4 | Admin | Create baris (isi operasi `gaji*2`), pilih relasi Jabatan via modal | `POST /api/master-data/pegawai/rows` | Baris tersimpan, operasi terkomputasi server |
| 5 | Admin/Builder | Ambil schema | `GET /api/master-data/pegawai/schema` | Daftar kolom untuk binding Task 07 |
| 6 | Admin | Hapus baris/tabel tak terpakai | `DELETE …/rows/:id`, `DELETE /api/master-data/:slug` | Terhapus + confirm; tabel dipakai → 409 |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Tabel kosong | List → Empty | `NEmpty` + CTA "Tambah data pertama" |
| ALT-02 | Kolom disembunyikan | Visibility toggle | Persist localStorage per slug |
| ERR-01 | Slug duplikat/ilegal | Submit → 400/409 | Inline error + pesan |
| ERR-02 | Hapus tabel masih direferensi relation/template | Delete → 409 | Daftar referensi, tolak |
| ERR-03 | Operasi-teks div-by-zero / kolom hilang | Form/save → validasi | `null` + pesan, blokir save bila required |
| ERR-04 | 401/403 | Any | Redirect login / `NAlert` + `rbac-denied` |

## Requirements

### Tujuan Fitur

- REQ-G01: Admin non-dev dapat membuat tabel + CRUD data + menyediakan Data Source surat.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Super Admin | Definisi tabel + DDL + hapus | `Master Data Write` |
| Admin | CRUD baris, definisi terbatas | `Master Data Write` |
| Viewer | Lihat browse | `Master Data Read` |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Super Admin | Buat tabel Pegawai 5 kolom | `mst_pegawai` + menu | Step 2 |
| UC-02 | Admin | Cari "afd" + sort gaji | Hasil tersaring/terurut | Step 3 |
| UC-03 | Admin | Isi form relation + operasi | Baris valid tersimpan | Step 4 |
| UC-04 | Builder | Baca schema untuk binding | Kolom tersedia | Step 5 |

### Functional Requirements

- FR-001: CRUD definisi (nama unik, slug auto `[a-z0-9_]` + validasi) — Step 2.
- FR-002: DDL create/alter aman + backup sebelum destruktif — Step 2/6.
- FR-003: Browse: search kolom `is_searchable`, sort `is_orderable`, visibility, pagination `page/limit/search/sortBy/sortOrder` — Step 3.
- FR-004: Form per 13 tipe + date/datetime/time format display + IDR realtime + image upload — Step 4.
- FR-005: Relation picker: modal tabel relasi + search all + sort tiap kolom + checkbox (1/N) — Step 4.
- FR-006: Operasi-teks hidden (tak dirender) vs readonly (disabled) + komputasi klien+server identik — Step 4.
- FR-007: Schema API untuk Task 07 — Step 5.

### Business Rules

- BR-001: `slug` unik, format `[a-z][a-z0-9_]{1,60}`, blacklist (`users, roles, mst_, sqlite_, master_`).
- BR-002: Nama kolom unik per tabel, format sama; minimal 1 kolom.
- BR-003: Hanya kolom `is_searchable` → search; `is_orderable` → sort (header non-orderable tak bisa diklik).
- BR-004: Hapus tabel/kolom yang masih direferensi `relation_*`/template → 409 + daftar.
- BR-005: Alter destruktif wajib backup `db.sqlite` + konfirmasi dua langkah.
- BR-006: `mst_*` di-ignore drift detection + `synchronize` tidak boleh drop.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | 100 kolom / 50k baris | Pagination server + cap kolom form, virtual scroll bila perlu | Step 3 |
| EC-02 | Rename kolom relation target | Lookup runtime longgar (peringatan, bukan FK kaku) | Step 4 |
| EC-03 | Upload image >5MB/tipe salah | Tolak 400 + pesan | Step 4 |
| EC-04 | Operasi referensi kolom terhapus | Tandai invalid, blokir save | ERR-03 |
