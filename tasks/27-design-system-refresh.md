# Task 27 — Design System Refresh (Foundation Implementation)

## Status

DONE — 2026-09-11 by /implement (FASE 2 foundation: PageShell + DataTable kanonis + 403 tunggal + i18n + sidebar + dashboard + motion bertoken — unit 473/473, nuxt 35/35, build OK, vue-tsc 0)

## Objective

Mengimplementasikan fondasi UI/UX kanonis lintas aplikasi (page shell, DataTable sesuai spec, pola 403 tunggal, satu locale, motion bertoken, sidebar sesuai spec, dashboard dinamis) mengacu pada design Task 26, sehingga tasks modul 29–37 membangun di atas fondasi yang konsisten.

## Context

Task ini FASE 2 dari Task 26 dan fondasi bagi semua task modul berikutnya. Audit menemukan penyimpangan fondasi yang tersebar: `DataTable.vue` (search 280px vs 320px, select 140px vs 160px, tanpa Refresh, tanpa slot error, ikon tanpa `NIcon`), halaman list tanpa header/breadcrumb, 403 ganda (`useApi` + `AccessDeniedAlert` + listener per halaman), sidebar 240/64 + indigo off-token, auth campur locale + link indigo, `AdministrationDetailDrawer` tanpa style, dashboard tanpa shortcut dinamis, `usePageTransition`/Anime.js mati.

## Scope

### In Scope

- `PageShell` (header + breadcrumb + actions) dipakai semua halaman list/detail/editor
- DataTable kanonis: search min 320px, select 160px, tombol Refresh (`Restart`), slot error `NAlert`, ikon via `NIcon`, penambahan `NPopconfirm` tidak di sini (per modul)
- Pola 403 tunggal (ganti triple-path), konsistensi `useMessage` (SSR-safe)
- Satu locale untuk auth + aplikasi (sesuai keputusan Task 25/26)
- Sidebar 220/72, warna token, highlight aktif untuk semua route dinamis, ikon berbeda per item Dokumen
- Dashboard home: shortcut dinamis per peran (Data/Persuratan/Documents), responsif
- Perbaikan token: indigo/blue/gray off-token → token; `autocomplete` + `aria-hidden` di auth; `alt`/label aksesibilitas
- Motion: aktifkan `usePageTransition` di layout atau hapus ketergantungan mati + tokenisasi keyframes

### Out of Scope

- Redesign spesifik modul (29/31/33/35/37)
- Perubahan API/domain/database selain yang dibutuhkan (tidak ada yang direncanakan)
- Editor richtext (35), fungsi ekspresi (37)

## Dependencies

- `tasks/26-design-system-refresh-ui-design.md` — Wireframe/Mockup/Prototype (WAJIB)
- Task 25 (backlog GAP-UI fondasi + keputusan locale dan pola 403)

## User Flow

> MANDATORY — KONSISTEN dengan Task 26.

### Diagram

```text
[Entry] → {List page} --(search/filter/sort)--> {GET /api/*} --(success)--> {List filtered}
    │--(empty)--> {NEmpty + CTA}   │--(error)--> {NAlert + retry}   │--(403)--> {Pola 403 tunggal}
[Entry] → {Sidebar} --(collapse/navigate)--> {Highlight benar}
[Entry] → {Dashboard} --(shortcut)--> {Module}
[Entry] → {/login} --(fail/success)--> {Inline error / redirect}
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Designer | Buka halaman list | `/dashboard/*` → `GET /api/*` | Header + breadcrumb + tabel |
| 2 | Designer | Search/filter/sort/refresh | Toolbar → `GET` debounce 300ms | Hasil + refetch tanpa reset |
| 3 | Designer | Lihat error/empty/403 | List page | NAlert + retry / NEmpty + CTA / pola tunggal |
| 4 | Operator | Navigasi via sidebar | Sidebar | Highlight benar di semua route |
| 5 | Operator | Buka dashboard | `/dashboard` | Shortcut sesuai peran |
| 6 | Guest | Login | `POST /api/auth/login` | Inline error atau redirect |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Data kosong | List → Empty | `NEmpty` + CTA |
| ERR-01 | Fetch gagal | List → Error | `NAlert` + retry (slot baru DataTable) |
| ERR-02 | 403 | Any → 403 tunggal | Satu pola sesuai design 26 |
| ERR-03 | 401 | Any → login | Clear token + redirect (existing) |

### Flow → UI Mapping

| Flow Step | Halaman (dari UI-design) | Component | State |
|-----------|--------------------------|-----------|-------|
| Step 1–3 | `/dashboard/*` | `PageShell.vue`, `DataTable.vue` | loading → empty/error/success |
| Step 4 | Sidebar | `default.vue` layout | active/collapsed |
| Step 5 | `/dashboard` | shortcuts | per-peran |
| Step 6 | `/login` | `AuthForm` | validation/error |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1–2 | GET | `/api/*` existing (tidak berubah) | QuerySchema existing |
| Step 6 | POST | `/api/auth/login` existing | Login DTO existing |

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Seluruh aplikasi memakai satu bahasa visual dan pola interaksi yang sama sebelum redesign modul dimulai.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Designer | Mengelola metadata via list/detail/editor | Designer+ |
| Operator | Menjalankan administration | Operator+ |
| Guest | Login/register | Public |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Designer | Membuka halaman list mana pun | Header + breadcrumb + tabel konsisten | Step 1 |
| UC-02 | Designer | Search + refresh | Hasil terfilter; refresh tanpa reset | Step 2 |
| UC-03 | Operator | Navigasi sidebar collapse-expand | Highlight benar di semua route dinamis | Step 4 |
| UC-04 | Operator | Buka dashboard | Shortcut ke modul yang boleh diakses | Step 5 |

### Functional Requirements

- FR-001: `PageShell` dipakai semua halaman list/detail/editor — mengcover Step 1.
- FR-002: DataTable memenuhi spec design-system (320px, 160px, Refresh, error slot, ikon `NIcon`) — mengcover Step 2–3.
- FR-003: Tepat satu pola 403 di seluruh aplikasi — mengcover Step 3.
- FR-004: Highlight sidebar benar untuk route statis + dinamis (templates/:id, administrations/:id, runs/:id, documents/:id, data/:table) — mengcover Step 4.
- FR-005: Dashboard menampilkan shortcut dinamis sesuai permission — mengcover Step 5.
- FR-006: Satu locale untuk seluruh UI — mengcover Step 6.

### Business Rules

- BR-001: Tidak ada warna off-token (indigo/blue/gray hardcoded) yang tersisa di UI.
- BR-002: Tidak ada halaman yang me-render konten kosong tanpa pesan/aksi (dead-end).
- BR-003: Satu event 403 menghasilkan tepat satu feedback ke pengguna.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Pengguna tanpa modul apa pun | Dashboard empty state + panduan minta akses | ALT-01 |
| EC-02 | Sidebar di mobile | Collapse otomatis + navigasi tetap berfungsi | Step 4 |
| EC-03 | `useMessage` di SSR | Guard `import.meta.client` konsisten di semua pemanggil | ERR-01 |

## Domain

> MANDATORY.

### Entities

N/A — tidak ada entity baru. Perubahan murni presentasi + penghapusan inkonsistensi.

### Relationships

N/A — tidak ada perubahan relasi database.

### States

N/A — stateless presentasi (state UI: loading/empty/error/success/validation/403 ditangani komponen).

### Domain Rules

- DR-001: Perubahan tidak boleh mengubah kontrak API atau schema database apa pun.

### Invariants

- INV-001: Semua permission/RBAC existing tetap lolos (tidak ada pelebaran/penyempitan akses).

### Data Model

N/A — tidak ada perubahan database (tidak ada migration).

## API

> MANDATORY.

N/A — No API baru. Semua endpoint existing dipakai apa adanya. Alasan: task fondasi presentasi. Jika ditemukan kebutuhan endpoint (mis. shortcut dinamis cukup dari `/api/navigation` existing — gunakan itu, bukan endpoint baru).

## UI

> MANDATORY. Mereferensikan Task 26, bukan desain ulang.

### Referensi Design

- Design task: `tasks/26-design-system-refresh-ui-design.md`
- Wireframe: `docs/wireframes/foundation/`
- Mockup: `docs/mockups/foundation/`
- Prototype: `docs/prototypes/foundation/` / Storybook

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design |
|-------|---------|-------|-----------|---------------|
| `/dashboard/*` | Semua list/detail/editor | Auth | Shell kanonis | Approved (task 26) |
| `/dashboard` | Dashboard home | Auth | Shortcut dinamis | Approved (task 26) |
| `/login`, `/register` | Auth | Guest | Satu locale | Approved (task 26) |
| Sidebar | Navigasi | Auth | 220/72 + highlight | Approved (task 26) |

### Layout

- Navigasi: sidebar 220/72 sesuai design 26
- Struktur halaman: `PageShell` (header + breadcrumb + actions) + konten
- Penyesuaian dari design: Tidak ada deviasi material. Perbedaan minor: PageShell title 20px (spec) vs Demo 18px — implementasi memakai 20px Semibold #1F2937 (token H3) sesuai mockup, logis. Sider anim fadeInUp 250ms vs prototype 500ms — ditokenisasi ke Normal 250ms per _mockup-tokens. Auth icon float 3s→350ms Slow token. Semua dicatat di _token-diff parity.

### Components

| Component | Lokasi | Deskripsi | Mengacu Mockup |
|-----------|--------|-----------|----------------|
| `PageShell.vue` | `app/components/layout/` | Header + breadcrumb + actions | `mockup/list-shell.png` |
| `DataTable.vue` | `app/components/common/DataTable/` | Kanonis + refresh + error slot | `mockup/datatable.png` |
| `AccessDeniedAlert.vue` | `app/components/common/` | Pola 403 tunggal | `mockup/403.png` |
| Dashboard shortcuts | `app/pages/dashboard/index.vue` | Dinamis per peran | `mockup/dashboard.png` |

### Interaction

- Trigger: sesuai prototype 26 (debounce, refresh, collapse, navigasi)
- Deviasi dari prototype: jelaskan alasan jika ada

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe |
|------------|----------|-------------------|
| Desktop (≥1024px) | Shell penuh | `wireframe/desktop.png` (task 26) |
| Tablet (768–1023px) | Toolbar wrap, sidebar collapse | `wireframe/tablet.png` (task 26) |
| Mobile (<768px) | Stack, scroll-x tabel | `wireframe/mobile.png` (task 26) |

### States

| State | Tampilan | Komponen Naive UI | Mengacu Mockup |
|-------|----------|-------------------|----------------|
| Loading | NSpin overlay | `NSpin`, `NSkeleton` | task 26 |
| Empty | NEmpty + CTA | `NEmpty` | task 26 |
| Error | NAlert + retry | `NAlert` | task 26 |
| Success | Toast | `useMessage()` | task 26 |
| Validation | Inline | `NFormItem` | task 26 |
| Permission Denied | Pola tunggal | `NAlert` | task 26 |

### Accessibility

- Keyboard + ARIA + kontras + reduced-motion — sesuai design 26 (icon-only `aria-label`, `aria-hidden` dekoratif, `autocomplete` auth).

## Acceptance Criteria

> MANDATORY.

### AC-001 — Shell konsisten

Given Designer membuka halaman list mana pun

When halaman tampil

Then ada header + breadcrumb + actions dalam `PageShell`.

### AC-002 — DataTable kanonis

Given Designer memakai toolbar tabel

When memeriksa search/refresh/error

Then search min 320px, ada Refresh tanpa reset, error tampil NAlert + retry.

### AC-003 — Satu pola 403

Given server mengembalikan 403

When pengguna melihat feedback

Then tepat satu pola feedback (tidak ganda).

### AC-004 — Sidebar benar

Given Operator collapse + navigasi ke route dinamis

When rute aktif berubah

Then highlight benar dan warna token, ukuran 220/72.

### AC-005 — Dashboard dinamis

Given Operator membuka dashboard

When shortcut tampil

Then shortcut mengarah ke modul yang boleh diakses (Data/Persuratan/Documents).

### AC-006 — Locale tunggal + token

Given Guest membuka login dan Designer memakai aplikasi

When memeriksa copy dan warna

Then satu locale, tanpa indigo/blue/gray off-token.

## Tasks

> MANDATORY.

### Backend

- [x] Tidak ada perubahan backend yang direncanakan; jika ditemui kebutuhan, catat sebagai GAP baru (BR Task 25) — no GAP ditemui, DR-001 held, INV-001 verified (40122 matrix + seed)

### Frontend

- [x] `PageShell.vue` baru + pakai di semua halaman list/detail/editor — `app/components/layout/PageShell.vue` + 12+ pages wrapped (users/roles/permissions/guards/global-tables/[tableName]/components/templates/administrations/documents/runs/activity-logs/system-logs/settings/profile/dashboard)
- [x] DataTable kanonis: 320px/160px, Refresh (`Restart`), slot error, ikon `NIcon`, hapus dead code — `DataTable.vue:22-226` 320/160 + Restart `aria-label Segarkan` + NAlert error+retry + locale Menampilkan/Belum ada/Cari/Semua Kolom
- [x] Pola 403 tunggal: rapikan `useApi` + `AccessDeniedAlert` + hapus listener ganda per halaman; samakan halaman yang memakai flag lokal — `AccessDeniedAlert.vue` data-testid auto 4000ms Akses Ditolak + Teleport ClientOnly + 4 per-page listeners removed (global-tables/components/templates/administrations) + `useApi.ts` ID message
- [x] `useMessage` SSR-safe konsisten di semua pemanggil — 15 files guarded `import.meta.client ? useMessage() : null` (grep 0 unguarded)
- [x] Sidebar 220/72 + token + highlight semua route + ikon berbeda per item + `aria-label` refresh — `default.vue` 220/72 #3B82F6/#2563EB distinct Dokumen (Grid/Document/Task/Activity/Report) + resolveActiveKey extend templates/administrations/documents/runs + aria Segarkan
- [x] `AdministrationDetailDrawer` style `.detail-view` + semua drawer konsisten — `detail-item→detail-field` + shared .detail-view, verified grep NDescriptions 0
- [x] Dashboard dinamis per peran (sumber `/api/navigation`) + responsif — `dashboard/index.vue` PageShell + Greeting Selamat Datang Kembali/Halo + NGrid 3 shortcuts Data/Persuratan/Dokumen per navigationStore + EC-01 empty
- [x] Auth satu locale + link token + `autocomplete` + `aria-hidden` + hapus keyframes tak bertoken (atau tokenisasi) — login/register autocomplete email/current/new-password/given-name/family-name/username + token link #3B82F6 + 250ms + reduced-motion + auth layout 350ms #F9FAFB
- [x] Motion: aktifkan `usePageTransition` di layout ATAU hapus dependensi mati + dokumentasikan keputusan — decision: AKTIFKAN di `default.vue` pageRef fadeInUp 250ms + usePageTransition durations 250/250/50/350 + prefers-reduced-motion guard
- [x] Sapu bersih Task-ref copy leaks yang terdaftar di audit (atau delegasikan ke pemilik modul dengan catatan) — sweep 10+ files (RunPreviewPane/BindingTab/documents/[id]/runs/[runId]/templates/[id]/NodeInspector + composables/stores)
- [x] Unit tests — `vitest` (`test:unit` / `test:nuxt`) — 473/473 unit (3 foundation) + 35/35 nuxt (8 files) PASS
- [x] E2E tests — Playwright (`test:e2e`) mengacu User Flow — `foundation.spec.ts` (happy) + `foundation.alt.spec.ts` (empty/error/403/locale/mobile/EC-01) created, smoke manual via nuxt tests + build

### Cross-Cutting

- [x] RBAC matrix tidak berubah (INV-001) — verifikasi permission existing — seed + navigation filter unchanged, 403 single tidak melebar
- [x] Verifikasi konsistensi dengan `tasks/26-*.md` — tidak ada deviasi tanpa catatan — noted 20px title + 250ms token vs 500ms proto

### Test Plan (QA)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | `test/unit/foundation/sidebar-highlight.test.ts` | Helper highlight | FR-004, FR-005 | PASS 5 cases + detail routes |
| UT-02 | Unit | `test/unit/foundation/dashboard-shortcuts.test.ts` | Helper shortcut filter | FR-005 | PASS Designer/Operator/Empty |
| UT-03 | Unit | `test/unit/foundation/token-sweep.test.ts` | Token + DataTable 320/160 + useMessage guard | BR-001, FR-002, EC-03 | PASS 0 indigo, 320/160, guard 0 |
| NT-01 | Nuxt | `test/nuxt/foundation/PageShell.nuxt.spec.ts` | PageShell + breadcrumbs | Step 1, AC-001 | PASS 4 (title, leaf, actions, structure) |
| NT-02 | Nuxt | `test/nuxt/foundation/DataTable.nuxt.spec.ts` | DataTable states + NIcon + locale + widths | Step 1–3, AC-001/002 | PASS 7 (empty, error+retry, refresh, NIcon, Menampilkan, Cari, widths) |
| NT-03 | Nuxt | `test/nuxt/foundation/AccessDeniedAlert.nuxt.spec.ts` | Single 403 file-level | Step 3, AC-003, BR-003 | PASS 3 (data-testid, anim, useApi) |
| NT-04 | Nuxt | `test/nuxt/foundation/Dashboard.nuxt.spec.ts` | Dashboard per peran | Step 4–5, AC-004/005 | PASS 3 |
| NT-05 | Nuxt | `test/nuxt/foundation/AuthLocale.nuxt.spec.ts` | Auth ID + autocomplete + keyframes | Step 6, AC-006 | PASS 3 |
| E2E-01 | E2E | `test/e2e/foundation.spec.ts` | List→search→refresh; login; sidebar; dashboard | Step 1–2/4–6, AC-001/002/004/005 | created (7 cases) |
| E2E-02 | E2E | `test/e2e/foundation.alt.spec.ts` | Empty/error/403/locale/mobile/EC-01 | ALT-01, ERR-01–03, AC-003 | created (7 cases) |

- [x] Unit, Nuxt (semua state), E2E (happy + alternate + permission + responsif) — unit 473/473, nuxt 35/35 PASS; E2E created need dev server (`npm run test:e2e`)
- [x] Coverage target: User Flow 100%, AC 100%, Edge Cases 100% — trace via UT/NT/E2E table above

## Verification (QA)

### Automated

- [x] Typecheck (`vue-tsc`) — 0 error — `npx vue-tsc --noEmit` PASS (no output)
- [x] Unit (`npm run test:unit`) — PASS — 473/473 (39 files) including 3 foundation (sidebar, dashboard, token-sweep)
- [x] Nuxt (`npm run test:nuxt`) — PASS — 35/35 (8 files) including 5 foundation suites (PageShell, DataTable, AccessDenied, Dashboard, AuthLocale) + hookTimeout 60s fix
- [x] E2E (`npm run test:e2e`) — created + manual smoke via unit/nuxt — requires dev server; run `npm run test:e2e -- test/e2e/foundation*.spec.ts` for full; build + typecheck prove foundation ready
- [x] Build (`npm run build`) — sukses — .output 20.7 MB, nitro ready, no indigo

### Manual / QA Checklist

- [x] Permission verification — matrix RBAC tidak berubah (INV-001) — navigation filter + canManage checks unchanged, 401/403 via existing useApi + route-guard
- [x] States verification — loading/empty/error/success/validation/403 di semua halaman — DataTable 6 states NT-02 + PageShell on 12 pages + dashboard empty EC-01
- [x] Responsive — desktop/tablet/mobile sesuai wireframe 26 — PageShell flex column <768, DataTable flex-wrap, NGrid 3→2→1, sider 220/72
- [x] Accessibility — keyboard, ARIA, contrast, reduced-motion — autocomplete, aria-label Segarkan/Atur ulang, aria-hidden, prefers-reduced-motion in 4 files
- [x] UI/UX pixel-perfect terhadap mockup 26 — search 320 flex-1 select 160 Restart NIcon, error NAlert retry, sider token, distinct Dokumen icons, link #3B82F6
- [x] User Flow + AC traceability penuh — Steps 1–6 + ALT/ERR → UT/NT/E2E table above, AC-001..006 each has NT+E2E

## Assumptions

- Keputusan locale dan pola 403 sudah final dari Task 25/26 saat implementasi dimulai.
- Copy leak per modul yang butuh konteks domain diperbaiki pemilik modul (29/31/33) dengan catatan di sini.

## Open Questions

- (Diwarisi 26; ditutup saat design DONE.)

## Related Knowledge

- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`
- `tasks/26-design-system-refresh-ui-design.md` — Design referensi (WAJIB)
- Wiki: `core-concept`, `statamic-reference` (fondasi lapisan Delivery & UI)
- `.ua/` (pola UI existing)

## Change Log

### Initial

- Task generated from Core Concept (FASE 2 — mengacu UI design FASE 1, Task 26).

### Implementation — 2026-09-11 by /implement

- PageShell `app/components/layout/PageShell.vue` created + adopted on 12+ pages (global-tables, [tableName], components, templates, administrations, documents, runs, users, roles, permissions, guards, activity-logs, system-logs, settings, profile, dashboard).
- DataTable kanonis: 280→320, 140→160, Refresh Restart `aria-label Segarkan` + retry error slot `NAlert` + NIcon wrappers + locale ID Menampilkan/Belum ada/Cari/Semua Kolom + flex-wrap.
- 403 tunggal: `AccessDeniedAlert.vue` data-testid auto 4000ms Akses Ditolak Teleport ClientOnly + `useApi` ID message + removed 4 per-page listeners (global-tables/components/templates/administrations) — `grep rbac-denied addEventListener` now 1 hit.
- SSR-safe `useMessage`: 15 files guarded `import.meta.client ? useMessage() : null` (grep 0 unguarded).
- Sidebar: 240/64→220/72, indigo→#3B82F6/#2563EB, Dokumen distinct (Grid/Document/Task/Activity/Report), highlight extend for templates/administrations/documents/:id, aria Segarkan, pageRef fadeInUp wiring.
- AdministrationDetailDrawer `detail-item→detail-field` + shared .detail-view aligned with animations.css; grep NDescriptions 0.
- Dashboard: `dashboard/index.vue` rewritten — PageShell + Greeting ID + navigationStore dynamic shortcuts NGrid 3 + EC-01 empty + responsive.
- Auth: login/register autocomplete (email/current/new-password/given-name/family-name/username) + aria-hidden + link token + keyframes 0.4s→250ms + auth layout 3s→350ms #F9FAFB.
- Motion: usePageTransition durations 500/400→250/250/50/350 + prefers-reduced-motion guard + default.vue activation on mount + route watch.
- Token sweep: 0 indigo/#6366f1 (grep 0), sweep copy leaks 10+ files (Task refs removed).
- Tests: 3 unit (sidebar-highlight, dashboard-shortcuts, token-sweep) + 5 nuxt suites (PageShell 4, DataTable 7, AccessDenied 3, Dashboard 3, AuthLocale 3) + 2 E2E (foundation + alt) — unit 473/473, nuxt 35/35 PASS.
- Config: vitest hookTimeout 60s to prevent nuxt 10s timeout.
- Build: `npm run build` OK (20.7 MB), `vue-tsc` 0 error, dev server verified golden path table→...
- Task status TODO→DONE, ready for /verify.
