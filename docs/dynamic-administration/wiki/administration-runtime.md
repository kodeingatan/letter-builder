# Administrasi Runtime — Steps Dinamis, Prefix & Nested Component

> Model runtime hasil administrasi persuratan. **Keputusan alignment (2026-09-11)**:
> runtime **penuh** (operator bebas susun steps dari template saat menjalankan),
> konvensi nama `step_field`, dan requirement bertipe `component` (nested, tanpa batas depth,
> dengan cycle alert). Status: 🎯 TARGET — memodifikasi desain predefined-steps yang implemented.

## A. Runtime Penuh (menggantikan predefined-only)

Hasil administrasi (`hasil dari administrasi persuratan`):

- **A. Menu item baru** sesuai nama persuratan (proyeksi metadata, seperti [[generated-menu]]).
- **B. Create/edit persuratan**:
  1. Lengkapi data yang dibutuhkan surat (data administrasi, ber-prefix — lihat §B).
  2. **Buat step baru dengan memilih template** administrasi persuratan (bebas, saat runtime).
  3. Isi/lengkapi data yang diminta template tersebut (binding: data administrasi, tabel, atau manual).
  4. Ulangi (2)–(3) sesuai kebutuhan pengguna — steps tersusun dinamis per run.
- **C. Delete data persuratan** (dengan konfirmasi + guard dokumen terbit).

Implikasi desain (mengikat implementasi):

- Run menyimpan **urutan steps + template/pin pilihannya** sebagai bagian frozen run (auditable, melengkapi
  `administration_runs` existing yang kini mem-freeze pin template predefined).
- Steps predefined administration tetap ada sebagai **kerangka awal/template awal**; operator boleh
  menambah/menyusun ulang steps dari katalog template yang diizinkan permission-nya.
- Validasi complete tetap atomic: semua steps (predefined + runtime) harus valid sebelum dokumen terbit.
- Dokumen terbit per template-step, terurut, berbagi `runId` (seperti [[multi-template-administration]]).

## B. Konvensi `step_field` (Prefix Nama Step)

Input data administrasi (C.3):

- `C.1` nama + `C.2` deskripsi administrasi persuratan.
- `C.3` daftar data surat (dapat ditambah terus): tiap item = **nama data ber-prefix nama step**
  + tipe (`text` | `richtext`).

Konvensi resmi bahasa data:

```text
{{data.<step>.<field>}}      contoh: {{data.step1.nama}}  ←  step "step1", field "nama"
```

- Binding editor, validator, dan preview wajib mengenali namespace `step.*`.
- Ref lama tanpa prefix tetap diterima (kompatibel mundur) tetapi editor menyarankan bentuk prefix.
- Typo namespace gagal cepat di bind-time (pesan + saran), bukan render kosong.

## C. Requirement bertipe `component` (Nested, Tanpa Batas + Cycle Alert)

Melengkapi [[component]] §B.3.2: tipe data view requirement menjadi `text | image | component`.

- `text`: teks dari nama data, dapat di-style toolbar.
- `image`: gambar, dapat di-style, panjang/lebar dapat diatur.
- `component` (🎯 TARGET): menampilkan component lain yang dipilih, **dengan syarat input requirement
  component tersebut dipenuhi lebih dulu** (rekursif).
- **Tanpa batas depth** (keputusan alignment) — sebagai gantinya, engine wajib **deteksi siklik**:
  bila rantai requirement membentuk loop (A butuh B butuh A), tampilkan **alert infinite loop**
  (nama rantai + lokasi) dan blokir render/preview yang terdampak, tanpa crash.
- Berlaku di: validasi tree, publish guard, preview (`validate-tree` + pipeline), dan live indicator editor.

## D. Popup Klik-Kanan Component (§B.3)

Richtext component (toolbar dasar: inline/block styles, alignment, lists, table, link, image, undo, redo);
klik kanan pada content membuka popup:

1. Minta **nama data**,
2. Minta **tipe data view** (`text` | `image` | `component` — lihat §C),
3. Nilai requirement terisi dari Administrasi / Global Table / manual / expression / system.

## Related Concepts

- [[administration]] — workflow induk
- [[step]] — unit pengumpulan data (kini dapat dibuat saat runtime)
- [[multi-template-administration]] — multi-template per administration (fondasi §A)
- [[runtime-flow]] — aliran runtime yang diperluas §A
- [[data-requirement]] — kontrak yang diperluas §C
- [[component]] — reusable block yang dapat di-nest (§C)
- [[data-binding]] — 5 sumber pengisi requirement
- [[unified-data-language]] — namespace `step.*` sebagai bagian bahasa data
- [[core-concept]] — posisi runtime dalam keseluruhan sistem
