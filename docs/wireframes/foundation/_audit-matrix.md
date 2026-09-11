# Audit Matrix — Foundation (Task 26 Discovery)

> Sumber: `tasks/25-ux-audit-concept-alignment.md` Appendix B.7–B.9 + inspeksi langsung `apps/web/app/*:line`. Severity: critical/major/minor. GAP mapping ke Task 27 atau 26 decision.

## GAP Catalog sinkron Task 25 F.1

| GAP | Modul | Deskripsi | Severity | Bukti `file:line` | Target | Keputusan 26 |
|-----|-------|-----------|----------|-------------------|--------|--------------|
| GAP-UI-01 | Shell | Semua list/detail/editor tanpa `PageShell` header+breadcrumb | major | `app/pages/dashboard/data/global-tables.vue:8` (`definePageMeta` tanpa shell), `app/pages/dashboard/data/[tableName].vue:18`, `app/pages/dashboard/docs/components.vue:8`, `administrations.vue:8`, `templates.vue:8`, `documents/index.vue`, `runs/index.vue`, `users.vue`, `roles.vue`, `permissions.vue`, `guards.vue`, `activity-logs.vue:58` (`detail-view` tapi tanpa shell) | 27 (PageShell baru) | Wireframe `list-shell.png` + spec `PageShell.vue` props `title`, `breadcrumbs[]`, `actions` slot |
| GAP-UI-02 | DataTable | Search `min-width:280px` vs spec `320px` | major | `app/components/common/DataTable/DataTable.vue:154` vs `docs/design-system.md:282` | 27 | Mockup `datatable.png` 320px |
| GAP-UI-03 | DataTable | Select `width:140px` vs spec `160px` | major | `DataTable.vue:168` vs `design-system.md:324` | 27 | Mockup 160px |
| GAP-UI-04 | DataTable | Tanpa tombol Refresh `Restart` | critical | `DataTable.vue:145` no Refresh NButton; spec `Table:Required Features` 276 | 27 | Prototype refresh tanpa reset |
| GAP-UI-05 | DataTable | Tanpa slot error `NAlert type=error + retry` | critical | `DataTable.vue` no `error` prop; spec 344–347 | 27 | Error `NAlert` di atas tabel + `emit('retry')` |
| GAP-UI-06 | DataTable | Icons bare `<Search/>` / `<Settings/>` tanpa `NIcon` wrapper | minor | `DataTable.vue:157`, `:187` vs spec `h(NIcon, null, {default:()=>h(Icon)})` | 27 | Semua icon via `NIcon` |
| GAP-UI-07 | Sidebar | Width `240/64` vs spec `220/72` | major | `app/layouts/default.vue:331` `width:240 collapsed:64` vs `design-system.md:466` | 27 | Wireframe `sidebar.png` 220/72 |
| GAP-UI-08 | Sidebar | Indigo off-token `#6366f1` / `text-indigo-500` | major | `default.vue:341` `text-indigo-500`, `375` `from-indigo-500 to-purple-500`, `app/pages/login.vue:85` `text-indigo-600`, `register.vue:140`, `settings.vue:129/141` `text-indigo-500`, `AuthForm/AuthForm.vue:10` `from-blue-50 to-indigo-100` vs `naiveui-theme.ts:5` `#3B82F6` | 27 | Token `#3B82F6`/`#2563EB` — 0 indigo |
| GAP-UI-09 | Sidebar | Dokumen group semua icon `Document` identik (5×) | minor | `default.vue:169–195` all `Document` | 26 decision | Mockup: Components→ `Grid`, Templates→ `Document`, Administrations→ `Flow`/`Task`, Runs→ `Activity`, Documents→ `Report` (distinct per item) |
| GAP-UI-10 | Locale | Campur ID/EN (`Selamat Datang` vs `Welcome back!`) | major | `login.vue:14` ID vs `dashboard/index.vue:26` EN, `global-tables.vue` EN | 26 decision | **Putusan: ID** — wireframe/auth + dashboard `Selamat Datang Kembali` + `Halo, {{name}}!` + toast/error ID |
| GAP-UI-11 | Auth | Missing `autocomplete` + `aria-hidden` dekoratif | minor | `login.vue:63` NInput no `autocomplete`, prefix `Login` no `aria-hidden` | 27 | Spec `autocomplete="email"/"current-password"` + `aria-hidden="true"` |
| GAP-UI-12 | Feedback | Pola 403 ganda: `useApi` dispatch + `AccessDeniedAlert` floating + per-page listener | major | `app/composables/useApi.ts:25` + `AccessDeniedAlert.vue:18` + `global-tables.vue:58/62`, `components.vue:58/62`, `administrations.vue:62/66`, `templates.vue:62/66`, `middleware/auth.ts:52` | 26 decision | **Putusan: floating global tunggal** (Teleport) — hapus listener per halaman di Task 27 |
| GAP-UI-13 | Auth link | `text-indigo-600` off-token | minor | `login.vue:85`, `register.vue:140` | 27 | `text-primary-500` (`#3B82F6`) hover `#2563EB` |
| GAP-UI-14 | Motion | `usePageTransition`/`animejs` mati + keyframes off-token (`authFormEnter 0.4s`) | minor | `app/composables/usePageTransition.ts:4` never invoked in `default.vue`, `login.vue:94` `0.4s`, `auth.vue:85` `authIconFloat 3s`, `main.css:28` page transition 250ms (token ok) vs `animations.css` 250ms mixed | 26 decision | **Putusan: aktifkan** `usePageTransition` di layout (fadeInUp stagger) + tokenisasi keyframes Fast 150/Normal 250/Slow 350; fallback `prefers-reduced-motion` |
| GAP-UI-15 | Detail | `AdministrationDetailDrawer.vue:104` duplicate inline `.detail-view` tidak import token | minor | `AdministrationDetailDrawer.vue:104` vs `assets/css/animations.css:98` shared `.detail-view` | 27 | Import shared CSS, hapus duplicate |

## Per-halaman Coverage

| Halaman / Route | Shell? | DataTable issues | Sidebar highlight | Locale | 403 path | State coverage | File bukti |
|-----------------|--------|------------------|-----------------|--------|----------|----------------|------------|
| `/dashboard` | NCard title saja | — | dashboard active ok | EN Welcome back! | — | empty CTA missing | `dashboard/index.vue:24` |
| `/dashboard/data/global-tables` | ❌ no PageShell | 280/140, no Refresh, no error, no NIcon | `global-tables` key ok, regex hiány `data-table-*` ok | mixed | per-page listener `global-tables.vue:58` | loading NSpin ok, empty no CTA, error missing, 403 triple | `global-tables.vue:8` |
| `/dashboard/data/:tableName` | ❌ | sda | `data-table-${table}` regex `default.vue:276` PASS | mixed EN empty `NEmpty` | inline `forbidden` local ` [tableName].vue:96` BE-01 | states partial | `[tableName].vue:18` |
| `/dashboard/docs/components` | ❌ | sda | components | EN | per-page `components.vue:58` | sda | `components.vue:8` |
| `/dashboard/docs/templates` | ❌ | sda | templates | EN | per-page `templates.vue:62` | sda | `templates.vue:8` |
| `/dashboard/docs/administrations` | ❌ + Workflow editor | sda | administrations | EN | per-page `administrations.vue:62` | sda | `administrations.vue:8` |
| `/dashboard/docs/documents` + `documents/[id]` | ❌ | sda | documents (5× Document identik) | EN | — | drift `NAlert` ok | `documents/index.vue`, `[id].vue:112` |
| `/dashboard/docs/runs` + `runs/[runId]` | ❌ | — | runs | EN | — | validation inline ok | `runs/index.vue` |
| `/dashboard/users|roles|permissions|guards` | ❌ (NCard title) | sda (DataTable) | users/guards/roles/permissions | EN | — | sda | `users.vue:8` |
| `/dashboard/activity-logs|system-logs|settings` | ❌ | sda | activity-logs/system-logs/settings | EN | — | `activity-logs.vue:58` |
| `/login` + `/register` (`auth` layout) | Auth layout `auth.vue` | — | — | ID `Selamat Datang` / `Buat Akun` | — | inline error EN mixed `Login gagal` vs `Email wajib diisi` | `login.vue:14`, `register.vue:14` |
| Sidebar layout | — | — | width 240/64 vs 220/72, indigo token fail, Dokumen identik, menu `<a href>` pattern PASS `default.vue:68` | — | global Teleport `AccessDeniedAlert.vue:23` PASS tapi triple | motion dead `usePageTransition.ts:4` | `default.vue:331/341/375` |

## Keputusan Design 26

- **Locale**: ID — auth `Masuk`/`Daftar`, dashboard `Selamat Datang Kembali` / `Halo, {{firstName}}!` / `Berikut ringkasan akun Anda`, error/empty ID, toast ID (`Masuk berhasil`/`Gagal memuat data`).
- **403 tunggal**: floating global `AccessDeniedAlert.vue` (Teleport top-right `alert-slide` 300ms ease-out) — **hapus** `window.addEventListener('rbac-denied')` per halaman di Task 27 (`global-tables.vue:58`, `components.vue:58`, `administrations.vue:62`, `templates.vue:62`). `useApi.ts:25` + `middleware/auth.ts:52` tetap dispatch; hanya satu renderer.
- **Sidebar icons Dokumen**: Components `Grid` (atau `DataTableIcon`), Templates `Document`, Administrations `Flow`/`TaskComplete`, Runs `Activity`/`CheckmarkOutline`, Documents `Report`/`DocumentPdf` — distinct, Carbon only.
- **Motion**: aktifkan `usePageTransition` di `default.vue` (`fadeInUp` untuk page content, `staggerFadeIn` untuk cards/rows) + tokenisasi `authFormEnter` 250ms Normal (bukan 400ms), `authIconFloat` 350ms Slow + `prefers-reduced-motion` guard.
- **Sizing**: sider `220/72`, search `320px min-width flex-1`, select `160px` fixed, heights `32px`, radius `6/4/8`.
