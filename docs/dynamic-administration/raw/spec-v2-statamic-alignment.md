# Spesifikasi v2 — Statamic Alignment & Konsep Lengkap Persuratan Dinamis

> Sumber mentah (raw source, immutable) untuk wiki `docs/dynamic-administration`.
> Ditulis 2026-09-11 dari permintaan pemilik produk: selaraskan konsep dengan referensi
> arsitektur Statamic CMS (diadaptasi ke Nuxt 4 + Nitro + TypeORM + SQLite + Naive UI)
> dan tuangkan seluruh detail konsep modul. Status implementasi ditandai
> ✅ implemented / 🎯 target / 📋 roadmapped (tasks 25–38).

## 1. Referensi Arsitektur (Statamic → BMS)

Statamic: Laravel package → providers → web.php → Entry/Contracts/Stache/Repository →
Blueprint/Fieldtypes(Bard) → CP Inertia/Vue + SavePipeline → Antlers Engine → static cache →
REST/GraphQL, addons/events, search index, filesystem/Glide.

Adaptasi BMS: Nuxt config + `database.server.ts` → Nitro plugin + DataSource →
`server/api/*` + `app/pages/*` → EntitySchema + Zod DTO + services →
kolom + step fields → 14 column types → dashboard Naive UI + wizard autosave/complete →
pipeline resolve-tree → HTML→PDF → proyeksi navigasi + PDF frozen →
REST saja (tanpa GraphQL) → activity-log + search/lookup + storage allowlist.
Detail peta: wiki `statamic-reference`, `core-concept`.

## 2. Generated Global Tabel

### A. Browse hasil generated ✅

### B. Delete dari browse ✅ (konfirmasi; 409 bila masih direferensikan)

### C. Create/update ✅

- C.1 `name` tabel (snake_case, immutable, unik) ✅
- C.2 `displayName` ✅
- C.3 columns (tambah sesuai kebutuhan) ✅, tiap kolom:
  - C.3.1 `name` ✅ | C.3.2 `displayName` ✅ | C.3.3 `type` (lihat §3)
  - C.3.4 `defaultValue` ✅ | C.3.5 `required` ✅ | C.3.6 `orderable` ✅ | C.3.7 `searchable` ✅

### §3. Katalog type (14)

1. `text` ✅ | 2. `richtext` ✅ (editor penuh 🎯 tasks 34–35)
3. `date` + option format display default `m-d-Y` ✅
4. `datetime` + option format default `m-d-Y H:i:s` 🎯 v2
5. `time` + option format default `H:i:s` 🎯 v2
6. `image` ✅ (upload + preview)
7. `select` + options `{value,label}` ✅
8. `select-multiple` + options `{value,label}` 🎯 v2
9. `select-table-relation` + (tabel relasi, multi-field display, field value) ✅
10. `select-table-relation-multiple` + opsi sama, multi-check ✅
11. `number` + checkbox `currency` → label format IDR realtime saat mengetik ✅
12. `hidden-operation-text` ✅ — auto-terisi, operator `* / + -`, `++` (sambung string), `""` (literal);
    contoh `"hasil dari "++c1++" * "++c2++" = "++ c1 * c2` dengan c1=1,c2=2 → `1 * 2 = 2`
    (analog `/` → `1 / 2 = 0.5`, `+` → `1 + 2 = 3`, `-` → `1 - 2 = -1`)
13. `readonly-operation-text` ✅ — tampil saat input/edit tetapi read-only + auto-terisi + live preview,
    operator dan contoh sama dengan §12.
    Nilai kiriman klien untuk 12–13 diabaikan; server recompute (topological + cycle check).

## 3. Hasil Generated Global Tabel

- A. Menu item baru per tabel ✅ (grup Data, proyeksi metadata)
- B. Menu mengarah ke browse ✅ dengan: searching (hanya kolom ter-check),
  options (visibilitas kolom), orders (hanya kolom ter-check orderable)
- C. Create/delete per mapping type ✅:
  text→input teks; richtext→richtext; date/datetime/time→picker;
  image→upload; select→options; select-multiple→multi options;
  relation→tabel data relasi (search all + order per kolom + check awal);
  relation-multiple→sama + multi-check; number→input (+IDR bila currency);
  hidden→tanpa input + operasi; readonly→input terlihat + operasi + read-only
- D. Hapus data tabel ✅ (konfirmasi)

## 4. Component Persuratan

- A. Browse ✅ | B. Create/update: B.1 nama ✅, B.2 `is_looping` (single/collection) ✅,
  B.3 richtext toolbar dasar (inline/block styles, alignment, lists, table, link, image, undo, redo) ✅;
  klik kanan → popup: B.3.1 input nama data + B.3.2 select tipe view:
  B.3.2.1 `text` (teks + style toolbar) ✅,
  B.3.2.2 `image` (gambar + style + atur panjang/lebar) ✅,
  B.3.2.3 `component` (component pilihan; requirement-nya wajib dipenuhi dulu) 🎯 nested + cycle alert
- B.4 Preview ✅ (single + collection) | C. Delete ✅ (409 bila dipakai template)

## 5. Template Administrasi Persuratan

- A. Browse ✅ | B. Delete ✅ (409 bila dipakai step/dokumen)
- C. Create/update: C.1 nama ✅, C.2 description ✅,
  C.3 richtext toolbar dasar ✅ + klik kanan:
  C.3.1 pilih component ✅, C.3.2 penuhi requirement-nya ✅,
  C.3.3 isi dari data administrasi / tabel / manual (+ expression / system) ✅,
  C.3.4 bila looping → pilih tabel + pilih rows + tombol pilih-semua ✅
- C.4 Form generated hasil C.3 ✅ (BindingTab + preview)
- C.5 Preview surat PDF ✅ (`render/preview` + issuance engine)

## 6. Administrasi Persuratan

- A. Browse hasil generated ✅ | B. Delete hasil generated ✅ (arsip vs hapus + guard)
- C. Create/update: C.1 nama ✅, C.2 deskripsi ✅,
  C.3 data surat (tambah terus): C.3.1 nama data **ber-prefix nama step** 🎯 (`step_field`,
  bahasa `{{data.<step>.<field>}}`), C.3.2–C.3.4 tipe `text` (biasa) / `richtext` ✅

## 7. Hasil Administrasi Persuratan (runtime penuh 🎯)

- A. Menu item baru sesuai nama persuratan ✅
- B. Create/edit: lengkapi data surat → **buat step baru dengan memilih template** →
  isi data yang diminta template → buat step lagi sesuai kebutuhan → complete atomic → dokumen
- C. Delete data persuratan ✅ (konfirmasi + kebijakan run selesai/dokumen terbit)

## 8. Keputusan Alignment 2026-09-11 (mengikat)

- K-01: Tambah `datetime`, `time`, `select-multiple` (katalog v2).
- K-02: Runtime penuh — operator susun steps dari template saat menjalankan; run mem-freeze
  pilihan (auditable); steps predefined tetap sebagai kerangka awal.
- K-03: Requirement `component` nested tanpa batas depth + alert infinite loop (deteksi siklik,
  blokir render terdampak, tanpa crash).
- K-04: Konvensi `step_field` resmi (`{{data.<step>.<field>}}`); ref lama kompatibel mundur.
