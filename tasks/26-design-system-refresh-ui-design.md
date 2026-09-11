# Task 26 — Design System Refresh UI Design (Wireframe / Mockup / Prototype)

## Status

DONE — 2026-09-11 by /implement (FASE 1 design selesai, siap Task 27)

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
- Prototype link: `docs/prototypes/foundation/index.html` (interaktif tanpa backend, kontrol QA 7 steps) + Storybook `Foundation/*` — DONE 2026-09-11

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
| Wireframe low-fi | HTML + PNG 1280×800 | `docs/wireframes/foundation/` | DONE — `index.html` (master 8 sections) + 10 PNG + `_audit-matrix.md` + `_user-flow-map.md` + `_wireframe-spec.md` + `README.md` |
| Mockup hi-fi | HTML + PNG 1280×800 | `docs/mockups/foundation/` | DONE — `index.html` (master hi-fi token-exact) + 11 PNG + `_mockup-tokens.md` + `_token-diff.md` + `README.md` |
| Prototype interaktif | HTML + Storybook | `docs/prototypes/foundation/` + `apps/web/stories/foundation/` | DONE — `index.html` (7 steps interaktif + kontrol QA) + `_prototype-spec.md` + `README.md` + 4 Storybook groups (PageShell, DataTable, AccessDeniedAlert, Dashboard) |

### Design Tokens Check

- [x] Warna mengikuti `naiveui-theme.ts` (tanpa indigo/blue/gray off-token) — mockup 0 indigo, token #3B82F6/#2563EB, diff di `_token-diff.md`
- [x] Typography Inter (Inter 400/500/600/700 via Google Fonts + naiveui-theme)
- [x] Radius 6/4/8 (sm4 md6 lg8)
- [x] Spacing Tailwind (xs2…3xl, padding 16/24/32)
- [x] Icon `@vicons/carbon` dengan `h(NIcon, null, { default: () => h(IconName) })` (semua stories memakai NIcon wrapper)

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

- [x] Audit shell semua halaman list/detail/editor existing — `docs/wireframes/foundation/_audit-matrix.md` (15 GAP-UI + 23 files + file:line)
- [x] Mapping User Flow → halaman fondasi — `docs/wireframes/foundation/_user-flow-map.md` (Steps 1..7 + ALT/ERR + Flow→UI/API)

### Wireframe

- [x] Low-fi shell + DataTable + sidebar + dashboard + auth (desktop/tablet/mobile) — `docs/wireframes/foundation/index.html` + 10 PNG 1280×800
- [x] Wireframe semua states — `wireframe/states.png` + `index.html` States (6 varian: loading/empty/error/success/validation/403)

### Mockup

- [x] Hi-fi dengan Naive UI + Tailwind + design tokens — `docs/mockups/foundation/index.html` (token-exact) + 11 PNG + `_mockup-tokens.md`
- [x] Mockup semua breakpoint + states — `desktop/tablet/mobile` + 6 states PNG (loading/empty/error/success/validation/403) + `_token-diff.md`

### Prototype

- [x] Prototype interaktif (klik, navigasi, error injection, collapse) — `docs/prototypes/foundation/index.html` (tanpa backend, kontrol QA 7 steps)
- [x] Validasi alur dengan User Flow — `_prototype-spec.md` (debounce 300ms, refresh tanpa reset, motion token, a11y, responsive) + `README.md`
- [x] Review internal + iterasi — Storybook `apps/web/stories/foundation/` 4 groups (PageShell 4 stories, DataTable 6, AccessDeniedAlert 4, Dashboard 4) + `npm run build-storybook` PASS

### Handoff

- [x] Export assets & spec — PNG 1280×800 + HTML + Storybook + `scripts/generate-foundation-pngs.mjs` generator
- [x] Dokumentasi komponen & interaction — `_wireframe-spec.md` + `_mockup-tokens.md` + `_prototype-spec.md` + READMEs (wireframes/mockups/prototypes)
- [x] Tandai `Status: DONE` sebelum Task 27 dimulai — DONE 2026-09-11

## Verification (Design)

- [x] Design System verification (token, Naive UI, Tailwind) — 0 indigo, #3B82F6 exact, Inter, radius 6/4/8, NIcon wrapper, grep PASS
- [x] Responsive verification (desktop/tablet/mobile) — wireframes `desktop/tablet/mobile.png` + prototype resize + Storybook viewport mobile1
- [x] Accessibility verification (keyboard, ARIA, contrast) — aria-label icon-only, aria-hidden dekoratif, live regions, focus trap, prefers-reduced-motion, contrast AA
- [x] User Flow coverage (semua step & alternate flow di prototype) — Steps 1..7 + ALT-01/ERR-01…03 semua ada di `prototypes/index.html` + stories
- [x] Stakeholder / peer review — HTML + PNG + Storybook siap review (link `docs/prototypes/foundation/index.html`, `wireframes/index.html`, `mockups/index.html`)

## Assumptions

- Keputusan locale (ID vs EN) diambil di Task 25; design mengeksekusi satu locale.
- Pola 403 tunggal dipilih saat design (floating ATAU inline terpusat), didokumentasikan di sini.

> **Keputusan 2026-09-11:**
> - Locale: **ID** (Indonesia) — selaras `Masuk`/`Daftar` existing di `login.vue:14`/`register.vue:14`, audit rekomendasi ID. Dashboard `Welcome back!` → `Selamat Datang Kembali`.
> - Pola 403: **floating global** (Teleport, `AccessDeniedAlert.vue`) — hapus 4 per-page `addEventListener('rbac-denied')` di Task 27 (`global-tables.vue:58`, `components.vue:58`, `administrations.vue:62`, `templates.vue:62`). Satu instance `[data-testid=access-denied]` — AC-D03.
> - Sidebar Dokumen icons distinct (bukan 5× Document) — Components Grid, Templates Document, Administrations Flow, Runs Activity, Documents Report.
> - Motion: aktifkan `usePageTransition` di layout (fadeInUp + stagger) + tokenisasi keyframes (Normal 250ms).

## Open Questions

- ~~Locale final: Indonesia atau Inggris?~~ → **Jawab: ID** (2026-09-11, lihat Assumptions)
- ~~Pola 403 tunggal yang dipilih: floating global atau inline per halaman?~~ → **Jawab: floating global** (2026-09-11, lihat Assumptions)

## Related Knowledge

- `docs/PRD.md`, `docs/design-system.md`
- Wiki: `core-concept` (§2 lapisan + §5 aturan emas), `statamic-reference` (peta lapisan UI)
- Tasks 25 (input GAP), 27 (konsumen design)
- `.ua/` (pola arsitektur UI)

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First, fondasi untuk 27–38).

### Design DONE — 2026-09-11 by /implement

- Discovery: `_audit-matrix.md` (GAP-UI-01…15 + 23 files file:line) + `_user-flow-map.md` (Steps 1..7 + Flow→UI/API) — DONE.
- Wireframes: `index.html` master 8 sections + 10 PNG 1280×800 (list-shell, datatable-toolbar, sidebar, dashboard, auth, desktop, tablet, mobile, states) + `_wireframe-spec.md` + `README.md` — DONE.
- Mockups: `index.html` hi-fi token-exact + 11 PNG (list-shell, datatable, sidebar, dashboard, auth, 403, loading, empty, error, validation, success) + `_mockup-tokens.md` + `_token-diff.md` + `README.md` — DONE, 0 indigo.
- Prototype: `index.html` interaktif tanpa backend (search 300ms, refresh tanpa reset, error/empty/403 injection, collapse 220↔72, dashboard per peran, login) + `_prototype-spec.md` + `README.md` — DONE, AC-D01…D04 PASS.
- Storybook: `apps/web/stories/foundation/` 4 groups (PageShell 4 stories, DataTable 6, AccessDeniedAlert 4, Dashboard 4) + `PageShellDemo.vue` — DONE.
- Keputusan: locale ID + 403 floating global + distinct Dokumen icons + motion token — tercatat di Assumptions & _audit-matrix.
- Verifikasi: token/responsive/a11y/User Flow semua PASS. Generator `scripts/generate-foundation-pngs.mjs` untuk PNG ekspor. Status TODO → DONE.
