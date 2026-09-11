# Task 26 — Design System Refresh UI Design (Wireframe / Mockup / Prototype)

## Status

TODO

## Objective

Menghasilkan wireframe, mockup hi-fi, dan prototype interaktif untuk penyeragaman fondasi UI/UX lintas aplikasi (shell halaman, DataTable kanonis, feedback 403 tunggal, locale, motion) sebagai acuan implementation Task 27.

## Context

Audit menemukan inkonsistensi fondasi di banyak modul: halaman list tanpa header/breadcrumb, DataTable menyimpang dari spesifikasinya sendiri (search 280px vs 320px, tanpa tombol Refresh, tanpa slot error), pola 403 ganda (floating + inline), locale campur ID/EN, motion ad-hoc tanpa token, sidebar menyimpang (240/64 vs 220/72, indigo off-token). Task ini prasyarat Task 27 dan menjadi bahasa visual yang dirujuk tasks 28–38.

## Scope

### In Scope

- Wireframe low-fi: page shell kanonis (header + breadcrumb + actions), DataTable kanonis (toolbar, search 320px, refresh, error slot), pola feedback tunggal (toast vs inline vs 403), auth screens (satu locale), sidebar (220/72, token), dashboard home baru (shortcuts dinamis), states (loading/empty/error/validation/403)
- Mockup hi-fi (Naive UI + Tailwind, token `docs/design-system.md`)
- Prototype interaktif (navigasi, filter, error injection, collapse sidebar, locale)
- Deliverables: Figma/HTML prototype + Storybook stories untuk shell + DataTable

### Out of Scope

- Redesign spesifik per modul (di 28/30/32/34/36)
- Implementasi API / domain / database
- Perubahan locale konten dinamis pengguna

## Dependencies

- `docs/design-system.md` (diperbarui oleh Task 27 sebagai implementasi, tetapi token acuan tetap)
- `docs/PRD.md`
- Task 25 (backlog GAP-UI fondasi sebagai input audit)

## User Flow

> MANDATORY — diagram + langkah + mapping ke halaman. Flow ini menjadi ACUAN untuk Task 27.

### Diagram

```text
[Entry] → {List page} --(search/filter/sort)--> {List filtered} --(error)--> {Error alert + retry}
    │                         │
    │--(empty)--> {Empty + CTA}│--(403)--> {Single 403 pattern}
    │
[Entry] → {Sidebar} --(collapse)--> {Collapsed} --(navigate)--> {Active highlight}
    │
[Entry] → {Dashboard} --(shortcut)--> {Module}
    │
[Entry] → {Login} --(fail)--> {Inline error} --(success)--> {Dashboard}
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | Designer | Buka halaman list | `/dashboard/*` | Header + breadcrumb + tabel tampil |
| 2 | Designer | Ketik search / ubah filter / sort | Toolbar DataTable | Hasil terfilter, debounce 300ms |
| 3 | Designer | Klik Refresh | Toolbar | Data refetch tanpa reset state |
| 4 | Designer | Lihat state error/empty/403 | List page | NAlert + retry / NEmpty + CTA / pola 403 tunggal |
| 5 | Operator | Collapse sidebar, navigasi | Sidebar | Highlight benar, label `<a href>` |
| 6 | Operator | Buka dashboard | `/dashboard` | Shortcut Data/Persuratan/Documents tampil |
| 7 | Guest | Login gagal lalu berhasil | `/login` | Inline error lalu redirect |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Data kosong | List → Empty state | `NEmpty` + CTA |
| ERR-01 | Fetch gagal | List → Error | `NAlert` + retry |
| ERR-02 | 403 Forbidden | Any → 403 tunggal | Satu pola (dipilih di design, bukan ganda) |
| ERR-03 | Validasi gagal | Form/auth → Inline | `NFormItem` feedback |

## UI

> MANDATORY — 10 sub-bagian wajib untuk design task.

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/dashboard/*` | List shell kanonis | Auth | Header + breadcrumb + toolbar + tabel | `wireframe/list-shell.png` |
| `/dashboard` | Dashboard home baru | Auth | Shortcut dinamis per peran | `wireframe/dashboard.png` |
| `/login`, `/register` | Auth (satu locale) | Guest | Validasi + error + autocomplete | `wireframe/auth.png` |
| Sidebar | Navigasi kanonis | Auth | 220/72, highlight, ikon token | `wireframe/sidebar.png` |

### Layout

- Navigasi: sidebar 220px / collapse 72px (per spec), breadcrumb di setiap halaman list/detail/editor
- Struktur halaman: header (title + actions) + toolbar + konten + pagination
- Grid & spacing: token `docs/design-system.md`

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| `PageShell.vue` | `app/components/layout/` | Header + breadcrumb + actions slot | default |
| `DataTable.vue` (kanonis) | `app/components/common/DataTable/` | Search 320px + select 160px + refresh + error slot | loading, empty, error |
| `AccessDeniedAlert.vue` (tunggal) | `app/components/common/` | Satu pola 403 | visible/dismissed |
| Dashboard shortcuts | `app/pages/dashboard/index.vue` | Shortcut dinamis per peran | designer/operator/empty |

### Interaction

- Trigger: search debounce 300ms → fetch; refresh → refetch tanpa reset
- Konfirmasi: pola destruktif tetap di modul (bukan fondasi)
- Transisi/animasi: token Fast 150ms / Normal 250ms / Slow 350ms, hormati prefers-reduced-motion
- Prototype link: Figma/HTML (diisi saat design)

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Shell penuh + sidebar terbuka | `wireframe/desktop.png` |
| Tablet (768–1023px) | Sidebar collapse, toolbar wrap | `wireframe/tablet.png` |
| Mobile (<768px) | Toolbar stack, tabel scroll-x / card, form full-width | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading | Skeleton / NSpin overlay | `NSpin`, `NSkeleton` | `mockup/loading.png` |
| Empty | Illustration + CTA | `NEmpty` | `mockup/empty.png` |
| Error | NAlert + retry | `NAlert` | `mockup/error.png` |
| Success | NMessage toast | `useMessage()` | `mockup/success.png` |
| Validation | Inline error | `NFormItem` feedback | `mockup/validation.png` |
| Permission Denied | Pola 403 tunggal (hasil design) | `NAlert` | `mockup/403.png` |

### Accessibility

- Keyboard: toolbar, sidebar, shortcut terjangkau keyboard; focus trap di modal
- ARIA: `aria-label` untuk icon-only button; `aria-hidden` untuk SVG dekoratif
- Kontras & font: Inter, primary #3B82F6, radius 6/4/8
- Reduced motion: hormati `prefers-reduced-motion`
- Screen reader: live region untuk toast/feedback

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi | Figma / PNG | `docs/wireframes/foundation/` | TODO |
| Mockup hi-fi | Figma / PNG | `docs/mockups/foundation/` | TODO |
| Prototype interaktif | Figma prototype / HTML | `docs/prototypes/foundation/` atau Storybook | TODO |

### Design Tokens Check

- [ ] Warna mengikuti `naiveui-theme.ts` (tanpa indigo/blue/gray off-token)
- [ ] Typography Inter
- [ ] Radius 6/4/8
- [ ] Spacing Tailwind
- [ ] Icon `@vicons/carbon` dengan `h(NIcon, null, { default: () => h(IconName) })`

## Acceptance Criteria (Design)

> MANDATORY.

### AC-D01 — Shell kanonis tanpa dead-end

Given reviewer membuka prototype

When menavigasi list → error → retry dan empty → CTA

Then tidak ada halaman kosong tanpa pesan/aksi.

### AC-D02 — DataTable kanonis sesuai spec

Given reviewer membuka toolbar tabel

When memeriksa search/refresh/error

Then search min 320px, ada Refresh, ada slot error.

### AC-D03 — Satu pola 403

Given reviewer memicu 403

When alert muncul

Then hanya satu pola (tidak ganda floating+inline).

### AC-D04 — Locale tunggal + sidebar token

Given reviewer membuka auth dan sidebar

When memeriksa copy dan ukuran

Then satu locale, sidebar 220/72 dengan warna token.

## Tasks (Design)

> MANDATORY.

### Discovery

- [ ] Audit shell semua halaman list/detail/editor existing
- [ ] Mapping User Flow → halaman fondasi

### Wireframe

- [ ] Low-fi shell + DataTable + sidebar + dashboard + auth (desktop/tablet/mobile)
- [ ] Wireframe semua states

### Mockup

- [ ] Hi-fi dengan Naive UI + Tailwind + design tokens
- [ ] Mockup semua breakpoint + states

### Prototype

- [ ] Prototype interaktif (klik, navigasi, error injection, collapse)
- [ ] Validasi alur dengan User Flow
- [ ] Review internal + iterasi

### Handoff

- [ ] Export assets & spec
- [ ] Dokumentasi komponen & interaction
- [ ] Tandai `Status: DONE` sebelum Task 27 dimulai

## Verification (Design)

- [ ] Design System verification (token, Naive UI, Tailwind)
- [ ] Responsive verification (desktop/tablet/mobile)
- [ ] Accessibility verification (keyboard, ARIA, contrast)
- [ ] User Flow coverage (semua step & alternate flow di prototype)
- [ ] Stakeholder / peer review

## Assumptions

- Keputusan locale (ID vs EN) diambil di Task 25; design mengeksekusi satu locale.
- Pola 403 tunggal dipilih saat design (floating ATAU inline terpusat), didokumentasikan di sini.

## Open Questions

- Locale final: Indonesia atau Inggris?
- Pola 403 tunggal yang dipilih: floating global atau inline per halaman?

## Related Knowledge

- `docs/PRD.md`, `docs/design-system.md`
- Wiki: `core-concept` (§2 lapisan + §5 aturan emas), `statamic-reference` (peta lapisan UI)
- Tasks 25 (input GAP), 27 (konsumen design)
- `.ua/` (pola arsitektur UI)

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First, fondasi untuk 27–38).
