# Mockups — Foundation Hi-Fi

> Task 26 — Design System Refresh · Status: **DONE** · 2026-09-11 · Token `docs/design-system.md` + `app/utils/naiveui-theme.ts`

## Isi

| File | Deskripsi | Wireframe Ref | AC |
|------|-----------|---------------|----|
| `index.html` | **Master mockup** — semua sections hi-fi token-exact (PageShell, DataTable, sidebar, dashboard, auth, 6 states, detail-view, motion) | `wireframes/index.html` | — |
| `list-shell.png` | Shell hi-fi (header+actions+breadcrumb+toolbar+table+pagination+empty) | `wireframe/list-shell.png` | AC-D01 |
| `datatable.png` | DataTable hi-fi (happy + states + sizing annotation) | `wireframe/datatable-toolbar.png` | AC-D02 |
| `sidebar.png` | Sidebar hi-fi 220/72 token + distinct icons + highlight | `wireframe/sidebar.png` | AC-D04 |
| `dashboard.png` | Dashboard hi-fi 3 varian designer/operator/empty | `wireframe/dashboard.png` | Step 6 |
| `auth.png` | Auth hi-fi ID + validation + autocomplete + token link | `wireframe/auth.png` | AC-D04 / ERR-03 |
| `403.png` | Pola 403 tunggal (floating global, dipilih) | `wireframe/states.png` | AC-D03 |
| `loading.png` | State loading NSpin overlay | — | States |
| `empty.png` | State empty NEmpty + CTA | — | ALT-01 |
| `error.png` | State error NAlert + retry | — | ERR-01 |
| `validation.png` | State validation NFormItem | — | ERR-03 |
| `success.png` | State success toast via useMessage | — | States |
| `_mockup-tokens.md` | Tabel token exact (warna/typography/spacing/radius/icon) | `design-system.md` | Tokens |
| `_token-diff.md` | Off-token removal list untuk Task 27 (indigo → token) | — | BR-001 |

## Cara Lihat

- Buka `index.html` di browser — mockup hi-fi interaktif statis (tanpa backend), token warna #3B82F6 exact, icons Carbon, radius 6/4/8, Inter.
- PNG 1280×800 adalah ekspor siap-review (card + header accent #3B82F6, metadata Title di tEXt). Fidelity penuh di `index.html`.

## Design Tokens Check

- [x] Warna mengikuti `naiveui-theme.ts` (tanpa indigo/blue/gray off-token) — 0 hits `indigo`/`#6366f1`
- [x] Typography Inter (400/500/600/700)
- [x] Radius 6/4/8
- [x] Spacing Tailwind xs2…3xl
- [x] Icon Carbon via `h(NIcon, null, {default:()=>h(Icon)})`

## Verifikasi

- [x] Semua 11 PNG ada + `index.html` render tanpa error
- [x] PageShell tanpa dead-end
- [x] DataTable 320/160 + Refresh + error slot
- [x] Satu 403 floating global
- [x] 220/72 + token

## Handoff ke Task 27

Mockups menjadi acuan pixel-perfect. Deviasi wajib catat di `## UI > Penyesuaian dari design`. Token diff di `_token-diff.md` — Task 27 menghapus off-token.
