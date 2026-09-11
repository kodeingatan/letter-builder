# Task 34 — Rich Text Editor UI Design (Wireframe / Mockup / Prototype)

## Status

TODO

## Objective

Menghasilkan wireframe, mockup hi-fi, dan prototype interaktif untuk editor rich text sungguhan (kolom `richtext`, teks template, requirement `richtext`) sebagai acuan implementation Task 35 — menutup gap kritis "tanpa editor HTML".

## Context

Audit memastikan tidak ada editor HTML di mana pun: `richtext` hanya `textarea` (`DynamicForm.vue:127-129`), canvas hanya Bold/Italic `execCommand`, display mentah (`v-html`/pipeline raw). Sementara itu sisi output sudah siap (raw HTML + sanitasi). Concept (`rich-text-template`, `column-type`) mensyaratkan Rich Text Editor sebagai behavior bawaan type `richtext`. Ini gap kritis #1 penutup concept; prasyarat taktis untuk kredibilitas platform dokumen.

## Scope

### In Scope

- Wireframe: toolbar editor (format, list, link, image, table dasar, undo/redo, source-HTML toggle), mode baca (render tersanitasi), perilaku paste (sanitasi), upload/browse image via storage existing, perilaku mobile (toolbar ringkas)
- Mockup hi-fi + prototype (ketik → format → sisip gambar → simpan → render identik)
- Keputusan teknologi terdokumentasi (library vs TipTap/Quill vs native `contenteditable` yang diperkeras) + alasan keamanan (sanitasi 3 lapis preserved)
- Deliverables: Figma/HTML + Storybook (`RichTextEditor`, toolbar, viewer)

### Out of Scope

- Layout print-ready ala Adobe (non-goal PRD)
- Fungsi ekspresi baru (36/37); perubahan pipeline render selain yang dibutuhkan viewer

## Dependencies

- `docs/design-system.md`, `docs/PRD.md`
- Task 25 (GAP-C richtext kritis), Tasks 26/27 (fondasi), Task 28 (konteks DynamicForm)

## User Flow

> MANDATORY — acuan Task 35.

### Diagram

```text
[Entry] → {Row form richtext} --(format/insert)--> {WYSIWYG} --(save)--> {HTML tersimpan}
    │--(paste)--> {Sanitized}   │--(view)--> {Render identik}
[Entry] → {Canvas text node} --(edit rich)--> {Inline rich} --> {Draft}
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | Operator | Isi field richtext | Row form | WYSIWYG + toolbar |
| 2 | Operator | Paste dari luar | Editor | HTML tersanitasi |
| 3 | Operator | Sisip gambar | Editor | Upload/browse tersimpan |
| 4 | Operator | Simpan + lihat | Browse/detail/dokumen | Render identik tersanitasi |
| 5 | Designer | Edit teks template | Canvas | Inline rich konsisten |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Mode source | Editor → HTML | Toggle + validasi |
| ERR-01 | Paste berbahaya | Paste → strip | Notifikasi + konten aman |
| ERR-02 | Upload gagal | Insert → error | Retry + URL manual |

## UI

> MANDATORY — 10 sub-bagian.

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/dashboard/data/:table` | Row form richtext | Data perm | Editor penuh | `wireframe/row-rich.png` |
| `/dashboard/docs/templates/:id` | Canvas text | Designer | Inline rich | `wireframe/canvas-rich.png` |

### Layout

- Toolbar sticky + area konten + status sanitasi; mobile toolbar ringkas (overflow menu)

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| `RichTextEditor.vue` | `app/components/common/` | Editor + toolbar + paste-guard | editing, source, loading, error |
| `RichTextViewer.vue` | `app/components/common/` | Render tersanitasi | default, empty |
| Image dialog | editor | Upload/browse | uploading, error |

### Interaction

- Bold/Italic/list/link/image/table/undo + source toggle; paste selalu disanitasi
- Prototype link: (diisi saat design)

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop | Toolbar penuh | `wireframe/desktop.png` |
| Mobile | Toolbar ringkas + full-width | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Editing/Source/Uploading/Error/Empty | Sesuai fondasi | NSpin/NAlert/NEmpty/NModal | `mockup/states.png` |

### Accessibility

- Toolbar keyboard + `aria-label` per tombol; konten `role=textbox` + label; kontras token; reduced-motion

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe | Figma / PNG | `docs/wireframes/richtext-editor/` | TODO |
| Mockup | Figma / PNG | `docs/mockups/richtext-editor/` | TODO |
| Prototype | Figma / HTML | `docs/prototypes/richtext-editor/` atau Storybook | TODO |

### Design Tokens Check

- [ ] theme, Inter, radius, spacing, ikon Carbon

## Acceptance Criteria (Design)

> MANDATORY.

### AC-D01 — WYSIWYG jujur

Given reviewer mengetik + format + sisip gambar

When melihat hasil simpan

Then render identik dan aman.

### AC-D02 — Paste aman

Given reviewer paste HTML berbahaya

When ditempel

Then script/event-handler hilang + notifikasi.

### AC-D03 — Mobile dan aksesibel

Given reviewer di mobile + keyboard-only

When memakai toolbar

Then semua fungsi terjangkau dan berlabel.

## Tasks (Design)

> MANDATORY.

### Discovery

- [ ] Audit textarea existing + titik render HTML
- [ ] Mapping User Flow → komponen

### Wireframe

- [ ] Low-fi editor + viewer + mobile + states

### Mockup

- [ ] Hi-fi + tokens + states

### Prototype

- [ ] Interaktif + uji paste/upload + review + iterasi

### Handoff

- [ ] Keputusan teknologi + assets + spec + `Status: DONE` sebelum Task 35

## Verification (Design)

- [ ] Design System, Responsive, Accessibility, User Flow coverage, peer review (+ review keamanan sanitasi)

## Assumptions

- Output pipeline (raw + sanitasi) dipakai apa adanya; viewer memakai sanitizer yang sama.
- Upload memakai endpoint storage existing.

## Open Questions

- Library editor vs bangun di atas `contenteditable` existing? (diputuskan di design dengan trade-off keamanan/ukuran)
- Cakupan fitur v1 (tabel? video? hanya format dasar + image + link)?

## Related Knowledge

- `docs/PRD.md` (non-goals), `docs/design-system.md`
- Wiki: `rich-text-template`, `column-type-catalog` (richtext v2), `rendering-engine`, `core-concept` (lapisan 7)
- Tasks 25, 26/27, 28, 35

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First, untuk Task 35, gap kritis #1).
