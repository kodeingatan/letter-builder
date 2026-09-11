# Wireframe Spec — Anotasi Ukuran & Token

> Low-fi anotasi — hi-fi exact di `docs/mockups/foundation/_mockup-tokens.md`.

## PageShell

- `PageShell.vue` rencana `app/components/layout/` — props `title: string`, `breadcrumbs: {label, href?}[]`, slots `actions` + `default`.
- Header: title 20px Semibold (#1F2937), subtitle 12px #6B7280, breadcrumb 13px #6B7280, active #1F2937 semibold.
- Padding: head 16px 20px, body 20px, border 1px #E5E7EB radius 8.
- Breadcrumb leaf non-link, others `<a href>` + `preventDefault` + `router.push` (native right-click preserved).

## DataTable

- Toolbar: `display:flex; gap:12px; flex-wrap:wrap`.
- Search `NInput`: `min-width:320px; flex:1; height:32px; border-radius:6px; border:1px #E5E7EB`, focus `border #3B82F6 + shadow 0 0 0 2px #DBEAFE`, prefix `Search` via `h(NIcon)`, clearable, debounce 300ms, placeholder `Cari {entity}...`.
- Select `NSelect`: `width:160px; height:32px; border-radius:6px`, placeholder `Semua Kolom`.
- Buttons: `NButton` + `NIcon` (`Restart` Refresh, `Reset`, `Settings`), height 32px, radius 6, hover `scale(1.02)` 150ms, active `scale(.98)`, `aria-label` untuk icon-only.
- Error slot: `NAlert type="error"` full-width di atas `NDataTable`, closable, + `NButton` Retry (`emit('retry')`).
- Table: `NDataTable` remote, row 36px, cell 8px, header 40px, sorter ASC/DESC via Carbon ArrowUp/Down 14px #3B82F6, pagination `Menampilkan X–Y dari Z` + pageSizes 10/20/50/100.

## Sidebar

- `NLayoutSider :width=220 :collapsed-width=72`, item 36px, collapsed-icon-size 22, bg #F9FAFB, border #E5E7EB.
- Active: bg #EFF6FF, border #BFDBFE, text #1D4ED8 semibold.
- Icons distinct Dokumen: Components Grid, Templates Document, Administrations Flow/Task, Runs Activity, Documents Report — via `h(NIcon)` + `@vicons/carbon`.
- Highlight: `resolveActiveKey` regex `^/dashboard/data/([^/]+)$` → `data-table-*`, `^/dashboard/docs/run/(\\d+)$` → `persuratan-*`, `startsWith('/dashboard/docs/runs/')` → runs, else dashboard.

## Dashboard

- Card `Selamat Datang Kembali` + `Halo, {{name}}!` (ID).
- Shortcuts grid: Data (per table), Persuratan (per administration), Dokumen (statis jika isAdmin) — sumber `GET /api/navigation` (`navigationStore.dataEntries/persuratanEntries`), cache 30s.
- Variants: designer (semua), operator (terbatas via permission), empty (NEmpty + `Minta Akses` mailto) — EC-01.
- Responsive: NGrid 3→2→1, padding 32→24→16.

## Auth

- Layout `auth.vue`: flex row (image 1 + form 1), reversed `imagePosition==='left'`, mobile `flex-direction:column` + image 200px.
- Form: labels 12px semibold, inputs 32px, autocomplete `email`/`current-password`/`new-password`/`given-name`/`family-name`/`username`, prefix icons `aria-hidden="true"`, `NFormItem` validation `Email wajib diisi` red #EF4444, `NAlert` error di atas form, link `Daftar`/`Masuk` color #3B82F6 hover #2563EB (bukan indigo-600).

## States

- Loading: `NSpin show` overlay `rgba(255,255,255,.6)` + `NGrid` skeleton shimmer 1.4s.
- Empty: `NEmpty` + CTA `NButton type="primary"` (`+ Buat Global Table Pertama`).
- Error: `NAlert type="error"` + Retry, keep data if retry succeeds.
- Success: `useMessage()` toast — `import.meta.client ? useMessage() : null`, role status live region, 3s auto-dismiss, slideIn 300ms.
- Validation: `NFormItem` feedback `12px #DC2626`, focus first invalid.
- 403: floating global `NAlert` Teleport body top 16 right 16 max 448px, slideIn 300ms, closable, auto 4s — single instance.

## Responsive

- Desktop ≥1024: sider 220 terbuka, toolbar row, table 12 cols, NGrid 2.
- Tablet 768–1023: sider collapse 72, toolbar wrap (search full-row), table scroll-x, NGrid 2→1.
- Mobile <768: sider overlay collapsed→translateX(-100%) until toggle, toolbar stack (search full-width, field+buttons row 2), table card per row or scroll-x, form full-width, padding 16.

## Motion & A11y

- Tokens: Fast 150 ease-out, Normal 250 ease, Slow 350 ease-in-out, Bounce 400 cubic-bezier(0.68,-0.55,0.265,1.55).
- prefers-reduced-motion: `* {animation-duration:.01ms !important; transition-duration:.01ms !important}`.
- Keyboard: Tab order toolbar→table→pagination→CTA, focus visible, focus trap modal.
- ARIA: icon-only `aria-label`, decorative `aria-hidden`, live regions for toast/alert.
