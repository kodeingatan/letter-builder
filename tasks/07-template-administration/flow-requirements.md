## User Flow

### Diagram

```text
[Admin] → /dashboard/components → Create (Tiptap + right-click binding) → Preview → Save (v1)
 → /dashboard/templates → Create (embed component + isi requirement + looping picker) → Auto-form → Preview PDF → Publish
 → /dashboard/administrations → Create (data step.field + steps pilih template + mapping) → Save
 → Menu [Nama Surat] → /dashboard/documents/[slug] → wizard (data → +step → mapping → +step) → Render gabungan → PDF → Save run
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Admin | Buat Component Kop (logo image + nama text) via right-click | `/dashboard/components` → `POST /api/doc-components` | Component v1 |
| 2 | Admin | Buat Component Daftar Pegawai (`is_looping`, binding `item.*`) | `POST /api/doc-components` | Component loop |
| 3 | Admin | Buat Template SK: embed Kop + Daftar (pilih `mst_pegawai`, kolom, pilih semua) | `/dashboard/templates` → `POST /api/doc-templates` | Template draft + auto-form |
| 4 | Admin | Isi auto-form + Preview PDF | `POST /api/documents/preview`, `/pdf` | PDF SK benar |
| 5 | Admin | Buat Administrasi "SK Pengangkatan" + data `step1.nomor` + step→Template SK | `/dashboard/administrations` → `POST /api/administrations` | Administrasi + steps |
| 6 | Operator | Buka menu SK → wizard isi data + tambah step kedua (Tanda tangan) | `/dashboard/documents/sk-pengangkatan` → `POST /api/administrations/:id/runs` | Dokumen gabungan + PDF tersimpan |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Component dipakai template | Delete → 409 | Daftar pemakai |
| ALT-02 | Looping 0 baris dipilih | Preview | Repeater kosong + peringatan |
| ALT-03 | Tambah step ke-N | Wizard | Step append, mapping independen |
| ERR-01 | Requirement belum terisi | Publish/Render → 400 | Sorot field, blokir |
| ERR-02 | Binding ke kolom terhapus | Buka template | Badge invalid + pilih ulang |
| ERR-03 | PDF gagal | Preview → 500 | Pesan + retry, draft tetap tersimpan |
| ERR-04 | 401/403 | Any | Login / NAlert + `rbac-denied` |

## Requirements

### Tujuan Fitur

- REQ-G01: Admin membuat semua jenis surat (tugas, keputusan, undangan, keterangan, perjalanan dinas, BAP, nota dinas, sertifikat) tanpa dev membuat template baru.
- REQ-G02: Loop + Condition + Binding + Component Tree sebagai 4 fondasi engine terekspos via UI.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Super Admin/Admin | Component + Template + Administrasi | Write ketiganya |
| Operator | Jalankan wizard hasil | `Document Write` |
| Viewer | Lihat hasil | `Document Read` |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Admin | Kop + Daftar loop via right-click | 2 component | Step 1–2 |
| UC-02 | Admin | SK + looping pegawai pilih semua | Template + auto-form | Step 3 |
| UC-03 | Admin | Preview PDF SK | PDF valid | Step 4 |
| UC-04 | Admin | Administrasi 2 step | Tersimpan | Step 5 |
| UC-05 | Operator | Wizard SK + tanda tangan | PDF gabungan | Step 6 |

### Functional Requirements

- FR-001: CRUD component + Tiptap toolbar dasar + right-click binding 3 view — Step 1–2.
- FR-002: Component bersarang (EmployeeCard: avatar+nama+NIP) + dipakai dalam repeater — Step 2.
- FR-003: Template embed component + requirement terisi dari Master/manual/system — Step 3.
- FR-004: Looping picker (tabel + kolom + pilih semua) → repeater node — Step 3.
- FR-005: Auto-form dari requirement + validasi required — Step 3–4.
- FR-006: Preview PDF per template (reuse 05) — Step 4.
- FR-007: Administrasi data `step.field` dinamis + steps mapping — Step 5.
- FR-008: Wizard hasil + tambah step N + dokumen gabungan + PDF + menu per administrasi — Step 6.

### Business Rules

- BR-001: Nama component/template/administrasi unik; `code/slug` `[a-z0-9-_]`.
- BR-002: Publish template wajib semua requirement terpetakan + minimal 1 blok konten.
- BR-003: Component `is_looping` hanya valid bila mengandung ≥1 binding `item.*`.
- BR-004: Hapus component/template dipakai → 409 + daftar.
- BR-005: Versioning: setiap publish naikkan `version`; render run mengunci `template_version`.
- BR-006: `document_number` unik bila diisi.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Nested component 3 level | Render maks 1 level + peringatan (aturan 05) | Step 3 |
| EC-02 | 500 baris loop di preview | Cap + paginasi preview (ikuti 05) | Step 4 |
| EC-03 | Gambar logo hilang | Placeholder + warning, tidak gagal render | Step 4 |
| EC-04 | Wizard dibatalkan tengah jalan | Draft run tersimpan sebagai `DRAFT` | Step 6 |
