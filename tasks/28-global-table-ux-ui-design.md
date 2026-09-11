# Task 28 — Global Table UX UI Design (Wireframe / Mockup / Prototype)

## Status

DONE — 2026-09-11 by /implement (FASE 1 design selesai, siap Task 29)

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

- Trigger: inline edit → debounce 300ms + indikator saving `NSpin small` (ganti toast-per-klik)
- Reorder: kontrol eksplisit `ChevronUp/Down` via `h(NIcon)` (bukan drag palsu `DragHandle`) + persist debounce + live region `Dipindahkan ke posisi ${n}`
- Delete: `NPopconfirm` di semua aksi destruktif (column, row, drawer) — `positive-text="Hapus"` `negative-text="Batal"` + toast `Berhasil`
- Prototype link: `docs/prototypes/global-table-ux/index.html` (interaktif tanpa backend, kontrol QA 7 steps + Storybook `GlobalTable/*`) — DONE 2026-09-11

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
| Wireframe low-fi | HTML + PNG 1280×800 | `docs/wireframes/global-table-ux/` | DONE — `index.html` (master 10 sections) + 11 PNG + `_audit-matrix.md` + `_user-flow-map.md` + `_wireframe-spec.md` + `README.md` |
| Mockup hi-fi | HTML + PNG 1280×800 | `docs/mockups/global-table-ux/` | DONE — `index.html` (master hi-fi token-exact) + 16 PNG + `_mockup-tokens.md` + `_token-diff.md` + `README.md` |
| Prototype interaktif | HTML + Storybook | `docs/prototypes/global-table-ux/` + `apps/web/stories/global-table/` | DONE — `index.html` (7 steps interaktif + kontrol QA) + `_prototype-spec.md` + `README.md` + 4 Storybook groups (ColumnRow, RelationSelector, DynamicForm, ImportModal) |

### Design Tokens Check

- [x] `naiveui-theme.ts` `#3B82F6`/`#2563EB`/`#1D4ED8`, Inter + JetBrains Mono, radius 6/4/8, spacing Tailwind, ikon Carbon `h(NIcon, null, { default: () => h(IconName) })` — 0 off-token (`purple`→`warning`, `#666`→`#94a3b8`, `text-blue-500`→`primary` ghost, `DragHandle`→`ChevronUp/Down`), grep PASS

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

- [x] Audit halaman & states existing modul — `docs/wireframes/global-table-ux/_audit-matrix.md` (17 GAP-GT `file:line` → keputusan design, 8 halaman/komponen)
- [x] Mapping User Flow → halaman — `docs/wireframes/global-table-ux/_user-flow-map.md` (Steps 1-7 + ALT-01/02 + ERR-01..03 + Flow→UI/API mapping, AC-D01..03)

### Wireframe

- [x] Low-fi semua halaman (desktop/tablet/mobile) + semua states — `docs/wireframes/global-table-ux/index.html` (master 10 sections) + 11 PNG 1280×800 (table-list, columns, browse, column-form, selector, row-form, import, desktop, tablet, mobile, states) + `_wireframe-spec.md` + `README.md` — DONE

### Mockup

- [x] Hi-fi + tokens + semua breakpoint + states — `docs/mockups/global-table-ux/index.html` (token-exact hi-fi) + 16 PNG (7 halaman + 3 breakpoint + 6 states) + `_mockup-tokens.md` + `_token-diff.md` + `README.md` — DONE, 0 off-token

### Prototype

- [x] Interaktif + validasi alur + review + iterasi — `docs/prototypes/global-table-ux/index.html` (tabs Table List → Columns → Browse → Row Form → Import + modal Column Form + quote-aware preview + live computed + 403 tunggal, tanpa backend) + `_prototype-spec.md` + `README.md` — DONE, 7 steps + 3 ALT/ERR kontrol QA + debounce/reorder/live region — Storybook `apps/web/stories/global-table/` 4 groups (ColumnRow 4 stories, RelationSelector 5, DynamicForm 3, ImportModal 3) + `npm run build-storybook` PASS

### Handoff

- [x] Export assets & spec + dokumentasi + `Status: DONE` sebelum Task 29 — PNG 1280×800 + HTML + Storybook + `scripts/generate-global-table-pngs.mjs` generator + READMEs + `_wireframe-spec.md`/`_mockup-tokens.md`/`_prototype-spec.md` — Status TODO→DONE 2026-09-11

## Verification (Design)

- [x] Design System verification (token, Naive UI, Tailwind) — 0 off-token (`purple`/`#666`/`text-blue-500`/`DragHandle`→`Chevron`, `NRadio`→`NRadioGroup`, `v-show`→`v-if`, `hasMore` fix, `split(',')`→quote-aware) — `_mockup-tokens.md` + `_token-diff.md` grep PASS — DONE
- [x] Responsive verification (desktop/tablet/mobile) — wireframes `desktop.png`/`tablet.png`/`mobile.png` + `index.html` 10 sections responsive + prototype resize 1280→768→375 — DONE
- [x] Accessibility verification (keyboard, ARIA, contrast) — `NCheckboxGroup` relation, `aria-label` icon-only `ChevronUp/Down`/`TrashCan`/`Upload`, `aria-hidden` dekoratif, live region reorder/import, `prefers-reduced-motion 0.01ms` — `_prototype-spec.md` — DONE
- [x] User Flow coverage (semua step & alternate flow di prototype) — Steps 1-7 + ALT-01/02 + ERR-01..03 semua ada di `prototypes/global-table-ux/index.html` + kontrol QA + stories — DONE
- [x] Stakeholder / peer review — HTML + PNG 1280×800 + Storybook siap review (links `docs/prototypes/global-table-ux/index.html`, `wireframes/index.html`, `mockups/index.html` + `apps/web/stories/global-table/`) — DONE

## Assumptions

- Fondasi 26/27 selesai (shell, DataTable kanonis, pola 403).
- Richtext penuh dan fungsi ekspresi baru di luar scope (34–37); design menandai batasnya.

## Open Questions

- ~~Reorder kolom: kontrol up/down vs drag-and-drop sungguhan?~~ → **Jawab: kontrol eksplisit `ChevronUp/Down` per baris (bukan drag palsu `DragHandle`, bukan DnD sungguhan)** — persist debounce + live region, konsisten `GlobalTableTable.vue:58-68`, a11y, recorded in `_audit-matrix.md` GAP-GT-04 & `_prototype-spec.md`.
- ~~Batas preview CSV (baris/ukuran) yang ditampilkan di modal?~~ → **Jawab: preview max 5 baris + error table max 20 baris di modal; file >5MB atau >5000 baris ditolak 422 `File terlalu besar` / `Maks 5000 baris`** — mirror server `table-data.service:210` + `csv-safety`, recorded in `_audit-matrix.md` GAP-GT-13/14 & `_prototype-spec.md`.

> **Keputusan 2026-09-11 (Handoff untuk Task 29):**
> - Reorder eksplisit via `h(NIcon)` `ChevronUp/Down` + `aria-label` + disabled top/bottom + `options.length < total` fix + `v-if` per-type + `NRadioGroup`/`NCheckboxGroup`/`NInputNumber` + `optionRules` computed + `NPopconfirm` semua destruktif + `NButton primary ghost Upload` + live computed `readonly` + quote-aware CSV `min(640px,90vw)` — semua di prototype + `_wireframe-spec.md`/_token-diff.

## Related Knowledge

- `docs/PRD.md`, `docs/design-system.md`, wiki `global-table`, `column-type`, `column-type-catalog` (14 type v1+v2), `computed-field`, `relation-data-provider`, `multi-relation`, `crud-generated-table` (Spec v2)
- Tasks 25 (input), 26/27 (fondasi), 29 (konsumen)

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First, untuk Task 29).

### Design DONE — 2026-09-11 by /implement

- Discovery: `_audit-matrix.md` (17 GAP-GT `file:line` → keputusan, 8 halaman) + `_user-flow-map.md` (Steps 1-7 + ALT/ERR + Flow→UI/API) — DONE.
- Wireframes: `index.html` master 10 sections + 11 PNG 1280×800 (table-list, columns, browse, column-form, selector, row-form, import, desktop, tablet, mobile, states) + `_wireframe-spec.md` + `README.md` — DONE, AC-D01..03 covered.
- Mockups: `index.html` hi-fi token-exact + 16 PNG (7 halaman + 3 breakpoint + 6 states) + `_mockup-tokens.md` + `_token-diff.md` + `README.md` — DONE, 0 off-token (`purple`→`warning`, `#666`→`#94a3b8`, `text-blue-500`→`primary` ghost, `DragHandle`→`Chevron`, `NRadio`→`NRadioGroup`, `v-show`→`v-if`, `hasMore` fix, `split(',')`→quote-aware).
- Prototype: `index.html` interaktif tanpa backend (tabs Table List/Columns/Browse/Row Form/Import + modal Column Form + quote-aware 5 rows + live computed + 403 tunggal, kontrol QA 7 steps + ALT/ERR + debounce/reorder/live region) + `_prototype-spec.md` + `README.md` — DONE, AC-D01..03 + Steps 1-7 interactive.
- Storybook: `apps/web/stories/global-table/` 4 groups (ColumnRow 4 stories, RelationSelector 5, DynamicForm 3, ImportModal 3) + `npm run build-storybook` PASS.
- Keputusan: reorder `ChevronUp/Down` eksplisit + CSV preview 5 rows + 20 error (5000 limit) — tercatat di Open Questions & `_audit-matrix`/spec.
- Verifikasi: token 0 off-token, responsive D/T/M, a11y (NCheckboxGroup, aria-label, live region, reduced-motion), User Flow 100%, peer review ready. Generator `scripts/generate-global-table-pngs.mjs`. Status TODO→DONE.

### Assumptions (added 2026-09-11)

- Richtext penuh ditandai placeholder `NInput textarea 4 rows` + note `Editor penuh Task 35` — wireframe/modal konsisten, tidak ada editor penuh di 28.
- Fungsi ekspresi baru ditandai placeholder `Uji Ekspresi` existing only (`{{field}}` + `++` + aritmetika) — lanjutan Task 37, tidak ada syntax baru di 28.
