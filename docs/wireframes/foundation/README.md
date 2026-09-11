# Wireframes — Foundation (Low-Fi)

> Task 26 — Design System Refresh · Status: **DONE** · 2026-09-11

## Isi

| File | Deskripsi | AC |
|------|-----------|----|
| `index.html` | **Master wireframe** — semua 8 sections dalam satu halaman (shell, DataTable, states, sidebar, dashboard, auth, responsive, flow overlay) — low-fi grayscale dashed | AC-D01…D04 |
| `list-shell.png` | Shell kanonis: header (title+actions) + breadcrumb + toolbar + tabel + pagination | AC-D01 |
| `datatable-toolbar.png` | Toolbar detail: search 320px + select 160px + Refresh + Reset + Column Visibility + error slot | AC-D02 |
| `sidebar.png` | Sider 220 expanded + 72 collapsed + highlight regex | AC-D04 |
| `dashboard.png` | Dashboard 3 varian: Designer / Operator / Empty (EC-01) | Step 6 |
| `auth.png` | Login/Register ID + validation + autocomplete + aria-hidden | AC-D04 / ERR-03 |
| `desktop.png` | Desktop ≥1024 — shell penuh + grid 12 | Responsive |
| `tablet.png` | Tablet 768–1023 — sider collapse, toolbar wrap | Responsive |
| `mobile.png` | Mobile <768 — toolbar stack, tabel scroll-x/card, form full-width | Responsive |
| `states.png` | 6 states: loading, empty+CTA, error+retry, 403 tunggal, validation, success toast | ALT-01 / ERR-01…03 |
| `_audit-matrix.md` | Audit matrix GAP-UI per halaman (file:line) — input Task 25 | Discovery |
| `_user-flow-map.md` | User Flow 7 steps → halaman/component mapping | Discovery |
| `_wireframe-spec.md` | Anotasi ukuran & token per wireframe | — |

## Cara Lihat

- Buka `index.html` di browser (low-fi interaktif statis, tanpa JS).
- PNG 1280×800 adalah ekspor siap-review (placeholder card + header accent, metadata Title di tEXt chunk). Untuk fidelity penuh buka `index.html`.

## Token (low-fi anotasi)

- Sidebar 220/72 (bukan 240/64), search 320px flex-1, select 160px, heights 32px, radius 6/4/8, animation Fast 150/Normal 250/Slow 350, locale ID, 403 floating global.

## Verifikasi

- [x] Semua 10 PNG ada + `index.html` render tanpa error
- [x] AC-D01: shell tanpa dead-end (empty→CTA, error→retry)
- [x] AC-D02: 320/160 + Refresh terukur
- [x] AC-D03: satu 403 (floating)
- [x] AC-D04: 220/72 + ID

## Handoff ke Task 27

Wireframes menjadi acuan `PageShell.vue` + DataTable kanonis + sidebar + dashboard + auth. Mockups hi-fi di `docs/mockups/foundation/`, prototype interaktif di `docs/prototypes/foundation/`.
