# Core Concept (Sempurna) — Logika & Fitur Keseluruhan

> Satu artikel untuk memahami **seluruh** implementasi: rantai, lapisan, peran, aliran data,
> dan status tiap bagian (✅ implemented vs 🎯 target). Untuk detail per bagian, ikuti wikilinks.
> Peta arsitektur (referensi Statamic): [[statamic-reference]].

## 1. Rantai Inti (satu kalimat)

```text
DATA (Global Table) → BLOCK (Component) → BLUEPRINT (Template)
  → WORKFLOW (Administration) → RUN (Runtime Steps) → DOCUMENT (PDF/HTML)
```

## 2. Lapisan & Tanggung Jawab

| # | Lapisan | Pertanyaan yang dijawab | Artefak | Status |
|---|---|---|---|---|
| 1 | **Data** ([[global-table]]) | Data apa yang ada? | Tabel + 14 tipe kolom ([[column-type-catalog]]) | ✅ + 🎯 v2 (3 tipe) |
| 2 | **Behavior** ([[column-type]]) | Bagaimana tiap data bersikap? | Input/display/validasi/format/search/order per tipe | ✅ |
| 3 | **Computed** ([[computed-field]], [[expression-engine]]) | Nilai turunan? | `hidden`/`readonly-operation-text` + engine `++` | ✅ |
| 4 | **Relasi** ([[relation-data-provider]], [[multi-relation]]) | Data dari tabel lain? | Single + multiple + display/value | ✅ |
| 5 | **Block** ([[component]]) | Potongan dokumen apa yang reusable? | Content + looping + requirements (+ nested 🎯) | ✅ + 🎯 nested |
| 6 | **Blueprint** ([[template]]) | Dokumen terdiri dari apa? | Tree + binding + loop + condition, versioned | ✅ |
| 7 | **Authoring** ([[rich-text-template]], [[context-menu]]) | Bagaimana menyusunnya? | Canvas + klik-kanan + inspector | ✅ |
| 8 | **Workflow** ([[administration]], [[step]]) | Data dikumpulkan bagaimana? | Steps + pins + versions | ✅ |
| 9 | **Runtime** ([[administration-runtime]], [[runtime-flow]]) | Operator menjalankan apa? | Steps dinamis + `step_field` + complete atomic | 🎯 TARGET |
| 10 | **Render** ([[rendering-engine]]) | Output dihasilkan bagaimana? | Resolve tree → HTML → PDF (satu engine) | ✅ |
| 11 | **Menu** ([[generated-menu]]) | Navigasi dari mana? | Proyeksi metadata (Data + Persuratan) | ✅ |
| 12 | **Bahasa** ([[unified-data-language]], [[expression-engine]]) | Satu bahasa data? | `{{data.*}}` + `{{data.step.*}}` 🎯 + expression | ✅ + 🎯 prefix |

Prinsip pengikat ([[architecture-principles]]): metadata-driven, component-driven, template-driven,
data-driven, schema-driven, renderer-driven, versioned.

## 3. Peran

- **Designer** — mendefinisikan tabel, kolom, component, template, administration (lapisan 1–8).
- **Operator** — menjalankan persuratan: isi data → susun steps dari template → complete → dokumen (lapisan 9).
- **SysAdmin** — RBAC, audit, settings, production (fondasi, di luar rantai).

## 4. Aliran Data End-to-End (golden path)

```text
Designer:  definisikan Tabel (+kolom v2) ─┐
           buat Component (+requirements)  │
           susun Template (+binding)       ├─→ publish (guard: valid + bound)
           buat Administration (+steps)   ─┘
Operator:  buka menu Persuratan → isi data step_field → tambah step (pilih template)
           → isi binding tiap template → preview → COMPLETE (atomic)
Sistem:    freeze pins + data → resolve (data→component→binding→loop→condition, +cycle alert)
           → HTML tersanitasi → PDF frozen → Document (snapshot + versi)
Semua:     menu = proyeksi metadata; audit = activity log per mutasi
```

## 5. Aturan Emas (tidak boleh dilanggar)

1. Component tidak menyimpan data final — hanya requirement (kontrak).
2. Template adalah blueprint — bukan arsip surat.
3. Publish terkunci guard: tree valid + semua slot bound + tanpa loop requirements.
4. Nilai computed selalu recompute server-side; kiriman klien diabaikan.
5. Dokumen immutable: snapshot + versi frozen; perbaikan = reissue baris baru.
6. Menu = proyeksi metadata, bukan hard-code.
7. Satu bahasa data (`{{data.*}}`, `{{data.step.*}}`) + satu expression engine di semua lapisan.
8. Semua mutasi metadata melewati RBAC + tercatat di audit log.

## 6. Peta Status (apa yang tersisa)

| Item | Status | Pelaksana |
|---|---|---|
| 11 tipe kolom + computed + relasi + CRUD + CSV + menu + canvas + binding + workflow + runner + dokumen + render + RBAC/audit | ✅ implemented (tasks 07–24) | — |
| Fondasi UX + redesign modul (shell, DataTable, editor, wizard, documents) | 📋 roadmapped | tasks 25–33 |
| `datetime`, `time`, `select-multiple` | 🎯 target | [[column-type-catalog]] → tasks |
| Rich text editor penuh | 🎯 target | tasks 34–35 |
| Fungsi ekspresi lanjutan | 🎯 target | tasks 36–37 |
| Runtime steps penuh + `step_field` + nested component + cycle alert | 🎯 target | [[administration-runtime]] → tasks |
| Component rollback parity + namespace validation + sweep akhir | 🎯 target | task 38 |

## Related Concepts

- [[statamic-reference]] — peta arsitektur per-lapisan (Statamic → Nuxt)
- [[konsep-utama]] — rantai asli Data → … → Document
- [[overall-flow]] — alur keseluruhan bernomor
- [[final-concept]] — satu diagram untuk developer
- [[core-object-model]] — model objek per lapisan
- [[column-type-catalog]] — katalog 14 tipe (v1+v2)
- [[administration-runtime]] — runtime penuh + prefix + nested
- Semua artikel lapisan (§2) untuk detail masing-masing
