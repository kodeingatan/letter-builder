# Katalog Tipe Kolom v2 (14 Types)

> Katalog lengkap behavior data Global Table. v1 = 11 tipe (implemented).
> **v2 = +3 tipe baru (TARGET)**: `datetime`, `time`, `select-multiple`.
> Setiap tipe menentukan: penyimpanan, input, tampilan, validasi, format, search, order.

## Ringkasan Status

| # | Type | Status | Input | Display |
|---|---|---|---|---|
| 1 | `text` | ✅ implemented | `NInput` teks | Teks |
| 2 | `richtext` | ✅ implemented (editor penuh: [[statamic-reference]] D-target / Task 34–35) | Rich text editor | HTML tersanitasi |
| 3 | `date` | ✅ implemented | `NDatePicker` | Format display, default `m-d-Y` |
| 4 | `datetime` | 🎯 **v2 TARGET** | `NDatePicker` + time | Format display, default `m-d-Y H:i:s` |
| 5 | `time` | 🎯 **v2 TARGET** | Time picker | Format display, default `H:i:s` |
| 6 | `image` | ✅ implemented | Upload + preview | `NImage` |
| 7 | `select` | ✅ implemented | `NSelect` dari options | Label option |
| 8 | `select-multiple` | 🎯 **v2 TARGET** | `NSelect` multiple dari options | Label-label gabungan |
| 9 | `select-table-relation` | ✅ implemented | Tabel pilih + search + order + check | Label `display` (`001 - Nama`) |
| 10 | `select-table-relation-multiple` | ✅ implemented | Sama, multi-check | Label gabungan |
| 11 | `number` | ✅ implemented | `NInputNumber` | Number / IDR bila `currency` dicentang |
| 12 | `currency` | ✅ implemented | `NInputNumber` | Format IDR realtime |
| 13 | `hidden-operation-text` | ✅ implemented | (tidak ditampilkan; server recompute) | hidden |
| 14 | `readonly-operation-text` | ✅ implemented | readonly `NInput` (live preview) | Teks hasil |

## Spesifikasi per Tipe Baru (v2)

### `datetime`

- Option: `format` display datetime, default `m-d-Y H:i:s`.
- Input: date+time picker; simpan ISO string; validasi tanggal valid; searchable/orderable mengikuti flag kolom.

### `time`

- Option: `format` display time, default `H:i:s`.
- Input: time picker; simpan `HH:mm:ss`; validasi format waktu.

### `select-multiple`

- Option: `options[]` berupa `{ value, label }`, dapat ditambah sesuai kebutuhan user.
- Input: multi-select; simpan array value; display gabungan label; validasi tiap value ada di options.

## Aturan Umum (berlaku semua tipe)

- `C.3.4 default value` — prefill form + proyeksi browse.
- `C.3.5 required` — validasi server (422) + inline client.
- `C.3.6 order` — hanya kolom ter-check yang sortable (selainnya 422 `NOT_ORDERABLE`).
- `C.3.7 searching` — hanya kolom ter-check yang searchable (selainnya 422 `NOT_SEARCHABLE`).

## Kolom Operasi (`hidden` & `readonly`)

> Sintaks operator: `*` `/` `+` `-` (aritmetika), `++` (sambung string), `""` (literal string).
> Referensi kolom lain ditulis `++nama_column++`. Nilai kiriman klien **diabaikan** — server recompute.

Contoh (`nama_column_1=1`, `nama_column_2=2`):

| Operator | Ekspresi | Hasil |
|---|---|---|
| `*` | `"hasil dari "++nama_column_1++" * "++nama_column_2++" = "++ nama_column_1 * nama_column_2` | `1 * 2 = 2` |
| `/` | `"hasil dari "++nama_column_1++" / "++nama_column_2++" = "++ nama_column_1 / nama_column_2` | `1 / 2 = 0.5` |
| `+` | `"hasil dari "++nama_column_1++" + "++nama_column_2++" = "++ nama_column_1 + nama_column_2` | `1 + 2 = 3` |
| `-` | `"hasil dari "++nama_column_1++" - "++nama_column_2++" = "++ nama_column_1 - nama_column_2` | `1 - 2 = -1` |
| `++` | penyambung string | — |
| `""` | literal string | — |

- `hidden-operation-text`: tidak menampilkan input; operasi tetap berjalan (hasil tersimpan).
- `readonly-operation-text`: input tampil saat create/edit tetapi read-only; terisi otomatis + live preview.

## `number` + Currency

- Checkbox `currency`: bila dicentang, label menampilkan format `IDR` **realtime saat mengetik** number.

## Related Concepts

- [[global-table]] — data engine pemilik kolom
- [[column-type]] — konsep behavior-per-type
- [[computed-field]] — operasi sebagai computed field
- [[expression-engine]] — evaluator `++` dan aritmetika
- [[relation-data-provider]] / [[multi-relation]] — relasi single & multiple
- [[crud-generated-table]] — UI yang digenerate dari katalog ini
