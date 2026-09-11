# Task 30 — Template Editor UX UI Design (Wireframe / Mockup / Prototype)

## Status

TODO

## Objective

Menghasilkan wireframe, mockup hi-fi, dan prototype interaktif untuk redesign UX Template Editor (composition canvas, inspector, BindingTab 5 sources, version timeline) sebagai acuan implementation Task 31.

## Context

Editor template adalah modul paling kompleks dan paling banyak temuan: copy "Task 16/15/09/17" bocor di UI, tombol demo menyuntik konten hardcoded, source `administration` berupa select disabled (dead-end), binding global-table free-text rawan salah, toast `"← Templates"` literal (bukan ikon), load gagal jadi halaman spin kosong, scope insert implisit tidak discoverable, nested node tak bisa reorder, `document.execCommand` deprecated, inspector image URL mentah, kontrol tabel minim, swap component mereset binding tanpa konfirmasi, rollback tanpa konfirmasi. Backend binding/tree/versioning selesai (Tasks 14–16). Fondasi 26/27 diasumsikan selesai.

## Scope

### In Scope

- Wireframe: editor layout (canvas + inspector + tabs + timeline), model penargetan insert yang eksplisit (scope indicator + konfirmasi), BindingTab 5 sources yang semuanya bekerja (administration picker nyata, global-table picker tervalidasi, manual, expression dengan uji, system), inspector (loop/filter/table/image/upload-or-browse, swap dengan konfirmasi), timeline + rollback terkonfirmasi, load-gagal dengan retry
- Mockup hi-fi + prototype (susun template → bind semua sources → publish, termasuk skenario gagal)
- Copy bersih tanpa referensi task/dev; tombol demo dihapus atau dipindah ke mode bantuan
- Deliverables: Figma/HTML + Storybook (CanvasNode, Inspector, BindingRow)

### Out of Scope

- Editor richtext penuh (34/35); fungsi ekspresi baru (36/37)
- Perubahan kontrak tree/binding/version API

## Dependencies

- `docs/design-system.md`, `docs/PRD.md`
- Task 25 (GAP-UI editor), Tasks 26/27 (fondasi)

## User Flow

> MANDATORY — acuan Task 31.

### Diagram

```text
[Entry] → {Template} --(open)--> {Editor} --(insert)--> {Scope confirm} --> {Canvas}
    │--(configure)--> {Inspector} --(bind)--> {BindingTab} --(validate)--> {Publish}
    │--(history)--> {Timeline} --(rollback+confirm)--> {Draft}
    │--(load fail)--> {Retry}
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | Designer | Buka editor | `/dashboard/docs/templates/:id` | Canvas + inspector |
| 2 | Designer | Insert node/component | Canvas toolbar/menu | Scope eksplisit + node |
| 3 | Designer | Konfigurasi loop/filter/table/image | Inspector | Valid |
| 4 | Designer | Bind 5 sources | BindingTab | Unbound = 0 |
| 5 | Designer | Validasi + publish | Editor | vN terbit |
| 6 | Designer | Lihat/rollback versi | Timeline | Draft dari versi + konfirmasi |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Load gagal | Editor → Retry | `NResult` + retry |
| ALT-02 | Slot belum bind | Publish → block | Daftar slot + lompat ke BindingTab |
| ERR-01 | Ekspresi invalid | Inspector/Binding → Inline | Pesan + contoh |
| ERR-02 | Swap component | Inspector → Confirm | Binding lama dijelaskan |
| ERR-03 | Rollback | Timeline → Confirm | Draft tertimpa dengan sadar |

## UI

> MANDATORY — 10 sub-bagian.

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/dashboard/docs/templates/:id` | Template editor | Designer | Canvas + inspector + tabs + timeline | `wireframe/editor.png` |

### Layout

- Grid editor responsif (2024: inspector jadi drawer mobile — dipertahankan/dirapikan)
- Breadcrumb kembali dengan ikon `ArrowLeft`
- Scope insert selalu terlihat (indicator + pilihan)

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| Scope indicator | Canvas toolbar | Target insert eksplisit | container/top-level |
| BindingRow per source | BindingTab | Picker nyata semua sources | bound/unbound/stale |
| Inspector sections | NodeInspector | Loop/filter/table/image/swap | valid/invalid |
| Timeline | Version timeline | View + rollback confirm | loading/empty |

### Interaction

- Insert: pilih scope → konfirmasi implisit via indicator (tanpa mis-tap diam-diam)
- Reorder/wrap nested: dukung di semua level
- Bold/Italic: tanpa `execCommand` (mekanisme canvas-native)
- Prototype link: (diisi saat design)

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Canvas + inspector samping | `wireframe/desktop.png` |
| Tablet/Mobile | Inspector drawer + toolbar scroll | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading/Error/Empty/Success/Validation/403 | Sesuai fondasi 26 | NSpin/NResult/NEmpty/NAlert/NFormItem | `mockup/states.png` |

### Accessibility

- Keyboard: semua aksi canvas ada padanan toolbar; node fokus + label
- ARIA: role untuk node terpilih; live region validasi
- Kontras/font/motion: token

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe | Figma / PNG | `docs/wireframes/template-editor-ux/` | TODO |
| Mockup | Figma / PNG | `docs/mockups/template-editor-ux/` | TODO |
| Prototype | Figma / HTML | `docs/prototypes/template-editor-ux/` atau Storybook | TODO |

### Design Tokens Check

- [ ] theme, Inter, radius, spacing, ikon Carbon

## Acceptance Criteria (Design)

> MANDATORY.

### AC-D01 — Insert eksplisit

Given reviewer insert node saat container terpilih

When target scope tampil

Then tidak ada penempatan diam-diam di scope salah.

### AC-D02 — 5 sources bekerja

Given reviewer bind tiap source

When memilih administration/global-table/manual/expression/system

Then semua punya picker/validasi nyata (tanpa disabled placeholder).

### AC-D03 — Aman dan bersih

Given reviewer swap/rollback

When aksi destruktif

Then konfirmasi; tidak ada copy "Task N" di UI.

## Tasks (Design)

> MANDATORY.

### Discovery

- [ ] Audit editor & states existing
- [ ] Mapping User Flow → area editor

### Wireframe

- [ ] Low-fi semua area + breakpoint + states

### Mockup

- [ ] Hi-fi + tokens + states

### Prototype

- [ ] Interaktif end-to-end + review + iterasi

### Handoff

- [ ] Assets + spec + `Status: DONE` sebelum Task 31

## Verification (Design)

- [ ] Design System, Responsive, Accessibility, User Flow coverage, peer review

## Assumptions

- Kontrak tree/binding/version tidak berubah; `item.*` dan loop-source existing dipakai apa adanya.
- Upload image browser (jika diputuskan) memakai endpoint storage existing.

## Open Questions

- Scope insert: indicator persisten vs dialog konfirmasi per insert?
- Tombol demo: hapus total atau pindah ke guided tour?

## Related Knowledge

- `docs/PRD.md`, `docs/design-system.md`, wiki `template`, `rich-text-template`, `context-menu` (Spec v2 popup), `data-binding`, `data-requirement`, `component-looping`, `template-component-loop`, `administration-runtime` §C–D (nested + popup)
- Tasks 25, 26/27, 31

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First, untuk Task 31).
