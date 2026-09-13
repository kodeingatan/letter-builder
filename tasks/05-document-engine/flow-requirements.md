## User Flow

### Diagram

```text
[Admin/dev] → POST /api/documents/preview {schema_json, data} → HTML (cek loop/condition)
   → POST /api/documents/pdf {schema_json, data, page} → {url} → GET /api/storage/documents/*.pdf
   → error 400 (schema invalid) / 401 / 403
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Developer/Admin | Kirim tree + data SK (employees 2 orang) | `POST /api/documents/preview` | HTML berisi 2 blok repeater ter-render |
| 2 | Developer/Admin | Kirim condition `letter.type=internal` | `POST /api/documents/preview` | Cabang benar tampil, else disembunyikan |
| 3 | Developer/Admin | Kirim nested `employees[].trips[]` | `POST /api/documents/preview` | Nested loop ter-render tanpa duplikasi |
| 4 | Developer/Admin | Minta PDF A4 portrait | `POST /api/documents/pdf` | `{url}` PDF tersimpan |
| 5 | Developer/Admin | Buka URL PDF | `GET /api/storage/documents/*.pdf` | Binary PDF Content-Type benar |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | `source` kosong/tidak array | Renderer | Repeater render kosong + komentar `<!-- empty repeater -->` |
| ALT-02 | Field binding hilang | Renderer | String kosong (tidak throw), kecuali mode strict test |
| ERR-01 | schema_json invalid (type tak dikenal/depth>10) | Preview/PDF → 400 | Zod error message pertama |
| ERR-02 | Tanpa token | Any → 401 | `Unauthorized` |
| ERR-03 | Tanpa permission | Any → 403 | `Access denied` + `rbac-denied` di klien nanti |
| ERR-04 | Puppeteer gagal | PDF → 500 | `Failed to generate PDF` + log, tanpa path setengah-jadi |

## Requirements

### Tujuan Fitur

- REQ-G01: Satu engine generik me-render semua jenis surat tanpa file controller/service per surat.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Super Admin/Admin | Preview & generate PDF, uji binding/loop/condition | Permission `Document Preview`, `Document PDF` |
| System (Task 07) | Panggil renderer sebagai library | Internal import, tanpa HTTP |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Admin | Preview SK 2 pegawai | HTML berisi "1. Afdal… 2. Budi…" | Step 1 |
| UC-02 | Admin | Preview surat internal vs eksternal | Cabang condition benar | Step 2 |
| UC-03 | Admin | Preview perjalanan dinas nested | Tiap pegawai + daftar trips | Step 3 |
| UC-04 | Admin | Unduh PDF | File PDF tersimpan & dapat dibuka | Step 4–5 |

### Functional Requirements

- FR-001: Mendukung node `document/header/content/section/footer` + blok teks/gambar/tabel/tanda-tangan/tanggal/qr/divider/pagebreak — Step 1.
- FR-002: Binding `{{scope.field}}` + path nested (`employee.department.name`) + `{{current_date}}` — Step 1.
- FR-003: Repeater `props {source, item}` atas array apa pun + nested repeater (`item.trips`) — Step 1,3.
- FR-004: Condition `props {field, operator, value}` + `elseChildren` — Step 2.
- FR-005: `component-ref {componentId, propsOverride}` resolve 1 level + deteksi siklus — fondasi Task 07.
- FR-006: Escape HTML semua binding kecuali richtext tersanitasi — keamanan.
- FR-007: PDF A4/F4/Letter × portrait/landscape via Puppeteer + header/footer halaman — Step 4.

### Business Rules

- BR-001: Depth tree ≤ 10, total node ≤ 200 — tolak 400 bila lebih.
- BR-002: Binding tak dikenal → string kosong, tidak throw (preview tidak mati).
- BR-003: Repeater atas non-array → render kosong + komentar, tidak throw.
- BR-004: Div-by-zero pada operasi-teks → `null` + pesan validasi (tidak `Infinity`).
- BR-005: Tidak ada `eval`/HTTP fetch di expression; hanya path + operator whitelist.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Loop 0 item | Komentar kosong | ALT-01 |
| EC-02 | Nested 2 level × 50 item | Cap item per level 500, lebihnya dipotong + warning header | Step 3 |
| EC-03 | HTML injeksi di `{{name}}` | Di-escape | FR-006 |
| EC-04 | Puppeteer timeout 30s | 500 + cleanup file | ERR-04 |
