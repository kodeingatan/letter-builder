# Task 28 — Global Table UX UI Design (Wireframe / Mockup / Prototype)

## Status

TODO

## Objective

Menghasilkan wireframe, mockup hi-fi, dan prototype interaktif untuk redesign UX modul Global Table (list, columns, table-data browse, relations, computed, CSV) sebagai acuan implementation Task 29.

## Context

Modul Global Table fungsional penuh (tasks 07–12) tetapi audit menemukan masalah UX terbanyak di sini: tab columns memakai raw `<table>` (bukan DataTable, overflow mobile), delete kolom tanpa konfirmasi, bug `optionRules` undefined, `NRadio` tunggal, `v-show` validasi bocor, ikon DragHandle palsu, ikon detail/edit ambigu, `RelationSelector` tanpa empty/error + bug `hasMore` + CSV preview naive, drawer row delete tanpa konfirmasi, `DynamicForm` upload berupa span non-button + warna off-token, computed readonly tanpa nilai live. Task ini prasyarat Task 29; fondasi dari Task 26/27 diasumsikan selesai.

## Scope

### In Scope

- Wireframe low-fi: Global Table list (+order/icon inline), columns manager (DataTable-based: search/sort/visibility + reorder eksplisit), column form (per-type sections, relation builder, computed expression + dependency chips + test), table-data browse (filter, import/export, drawer), relation selector (search + empty/error), DynamicForm semua tipe (termasuk computed live + upload button)
- Mockup hi-fi + prototype interaktif (CRUD kolom end-to-end, reorder, import CSV partial, binding preview)
- Deliverables: Figma/HTML + Storybook stories (ColumnRow, RelationSelector, DynamicForm per type)

### Out of Scope

- Editor richtext penuh (Task 34/35); di sini cukup placeholder yang konsisten
- Fungsi ekspresi baru (Task 36/37); di sini cukup uji ekspresi existing
- API/domain/database baru

## Dependencies

- `docs/design-system.md`, `docs/PRD.md`
- Task 25 (GAP-UI columns/data sebagai input)
- Tasks 26/27 (fondasi shell + DataTable kanonis + pola feedback)

## User Flow

> MANDATORY — menjadi ACUAN Task 29.

### Diagram

```text
[Entry] → {Table list} --(open)--> {Columns manager} --(create)--> {Column form} --(save)--> {Columns}
    │--(reorder)--> {Columns}   │--(delete)--> {Confirm}--> {Columns}
[Entry] → {Browse rows} --(create/edit)--> {Row form} --(save)--> {Browse}
    │--(import CSV)--> {Preview + result}   │--(export)--> {CSV}
    │--(relation pick)--> {Selector}--> {Row form}
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | Designer | Buka list, ubah order/icon | `/dashboard/data/global-tables` | Tersimpan + toast |
| 2 | Designer | Buka columns manager | Detail tabel | Kolom tampil (search/sort) |
| 3 | Designer | Tambah kolom select/relation/computed | Column form | Tersimpan + validasi inline |
| 4 | Designer | Reorder + hapus kolom | Manager | Berubah + konfirmasi hapus |
| 5 | Operator | Browse rows, search/sort | `/dashboard/data/:table` | Data tampil |
| 6 | Operator | Isi row (relation/computed/image) | Row form | Tersimpan, computed live |
| 7 | Operator | Import CSV / export | Import modal | Hasil partial + error per baris |

### Alternate & Error Flows

| ID | Skenario | Jalaman | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Tabel kosong kolom | Manager → Empty | `NEmpty` + CTA |
| ALT-02 | Lookup relation kosong | Selector → Empty | `NEmpty` + panduan |
| ERR-01 | Nama kolom duplikat / ekspresi invalid | Form → Inline | `NFormItem` feedback |
| ERR-02 | Hapus kolom dipakai | Confirm → 409 | Pesan + daftar referensi |
| ERR-03 | CSV gagal partial | Import → Result | Tabel error per baris |

## UI

> MANDATORY — 10 sub-bagian.

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/dashboard/data/global-tables` | Table list | Designer | Order/icon inline + aman | `wireframe/table-list.png` |
| Detail tabel | Columns manager | Designer | DataTable kolom + reorder | `wireframe/columns.png` |
| `/dashboard/data/:table` | Browse rows | Data perm | Search/sort/import/export | `wireframe/browse.png` |

### Layout

- Navigasi: PageShell + breadcrumb (Data → Table → Columns/Browse)
- Struktur: header + toolbar DataTable + konten; form di modal/drawer responsif
- Grid & spacing: token design-system

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| Columns manager | `features/global-table-columns/` | DataTable + reorder eksplisit | loading, empty, error |
| Column form | `features/global-table-columns/` | Sections per-type + chips + test | default, validation |
| `RelationSelector` | `features/global-table-columns/` | Search + pagination benar | loading, empty, error |
| `DynamicForm` | `features/table-data/` | Semua tipe + computed live + upload | default, validation, disabled |
| Import modal | `features/table-data/` | Preview quoted-CSV + hasil | preview, partial, error |

### Interaction

- Trigger: inline edit → debounce + indikasi saving (ganti toast-per-klik)
- Reorder: kontrol eksplisit (bukan drag palsu) + persist
- Delete: `NPopconfirm` di semua aksi destruktif
- Prototype link: (diisi saat design)

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Tabel penuh + modal standar | `wireframe/desktop.png` |
| Tablet (768–1023px) | Kolom disembunyikan via visibility | `wireframe/tablet.png` |
| Mobile (<768px) | Horizontal scroll terkendali / drawer full | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading | NSpin | `NSpin` | `mockup/loading.png` |
| Empty | NEmpty + CTA | `NEmpty` | `mockup/empty.png` |
| Error | NAlert + retry | `NAlert` | `mockup/error.png` |
| Success | Toast | `useMessage()` | `mockup/success.png` |
| Validation | Inline | `NFormItem` | `mockup/validation.png` |
| Permission Denied | Pola 26 | `NAlert` | `mockup/403.png` |

### Accessibility

- Keyboard: semua aksi baris via keyboard; grup checkbox relation dengan `NCheckboxGroup`
- ARIA: label untuk icon-only + input tanpa label visual
- Kontras & font: token; no warna hardcoded
- Reduced motion: hormati preferensi
- Screen reader: umumkan hasil reorder/import

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi | Figma / PNG | `docs/wireframes/global-table-ux/` | TODO |
| Mockup hi-fi | Figma / PNG | `docs/mockups/global-table-ux/` | TODO |
| Prototype interaktif | Figma / HTML | `docs/prototypes/global-table-ux/` atau Storybook | TODO |

### Design Tokens Check

- [ ] `naiveui-theme.ts`, Inter, radius 6/4/8, spacing Tailwind, ikon Carbon `h(NIcon…)`

## Acceptance Criteria (Design)

> MANDATORY.

### AC-D01 — Columns tanpa raw table

Given reviewer membuka prototype columns

When memeriksa layout

Then DataTable + reorder eksplisit, tanpa drag palsu, responsif.

### AC-D02 — Form valid dan aman

Given reviewer mengisi column form

When ganti type / hapus

Then tidak ada runtime error, validasi inline, hapus selalu konfirmasi.

### AC-D03 — Selector dan form jujur

Given reviewer memakai relation selector dan row form

When lookup kosong/gagal atau computed

Then empty/error jelas; computed menampilkan nilai live; upload berupa button.

## Tasks (Design)

> MANDATORY.

### Discovery

- [ ] Audit halaman & states existing modul
- [ ] Mapping User Flow → halaman

### Wireframe

- [ ] Low-fi semua halaman (desktop/tablet/mobile) + semua states

### Mockup

- [ ] Hi-fi + tokens + semua breakpoint + states

### Prototype

- [ ] Interaktif + validasi alur + review + iterasi

### Handoff

- [ ] Export assets & spec + dokumentasi + `Status: DONE` sebelum Task 29

## Verification (Design)

- [ ] Design System, Responsive, Accessibility, User Flow coverage, peer review

## Assumptions

- Fondasi 26/27 selesai (shell, DataTable kanonis, pola 403).
- Richtext penuh dan fungsi ekspresi baru di luar scope (34–37); design menandai batasnya.

## Open Questions

- Reorder kolom: kontrol up/down vs drag-and-drop sungguhan?
- Batas preview CSV (baris/ukuran) yang ditampilkan di modal?

## Related Knowledge

- `docs/PRD.md`, `docs/design-system.md`, wiki `global-table`, `column-type`, `column-type-catalog` (14 type v1+v2), `computed-field`, `relation-data-provider`, `multi-relation`, `crud-generated-table` (Spec v2)
- Tasks 25 (input), 26/27 (fondasi), 29 (konsumen)

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First, untuk Task 29).
