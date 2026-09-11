# Task 27 — Design System Refresh (Foundation Implementation)

## Status

TODO

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
- Penyesuaian dari design: catat di sini jika ada deviasi + alasan

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

- [ ] Tidak ada perubahan backend yang direncanakan; jika ditemui kebutuhan, catat sebagai GAP baru (BR Task 25)

### Frontend

- [ ] `PageShell.vue` baru + pakai di semua halaman list/detail/editor
- [ ] DataTable kanonis: 320px/160px, Refresh (`Restart`), slot error, ikon `NIcon`, hapus dead code
- [ ] Pola 403 tunggal: rapikan `useApi` + `AccessDeniedAlert` + hapus listener ganda per halaman; samakan halaman yang memakai flag lokal
- [ ] `useMessage` SSR-safe konsisten di semua pemanggil
- [ ] Sidebar 220/72 + token + highlight semua route + ikon berbeda per item + `aria-label` refresh
- [ ] `AdministrationDetailDrawer` style `.detail-view` + semua drawer konsisten
- [ ] Dashboard dinamis per peran (sumber `/api/navigation`) + responsif
- [ ] Auth satu locale + link token + `autocomplete` + `aria-hidden` + hapus keyframes tak bertoken (atau tokenisasi)
- [ ] Motion: aktifkan `usePageTransition` di layout ATAU hapus dependensi mati + dokumentasikan keputusan
- [ ] Sapu bersih Task-ref copy leaks yang terdaftar di audit (atau delegasikan ke pemilik modul dengan catatan)
- [ ] Unit tests — `vitest` (`test:unit` / `test:nuxt`)
- [ ] E2E tests — Playwright (`test:e2e`) mengacu User Flow

### Cross-Cutting

- [ ] RBAC matrix tidak berubah (INV-001) — verifikasi permission existing
- [ ] Verifikasi konsistensi dengan `tasks/26-*.md` — tidak ada deviasi tanpa catatan

### Test Plan (QA)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | `tests/unit/foundation/*.test.ts` | Helper (highlight map, shortcut filter) | FR-004, FR-005 |
| NT-01 | Nuxt — Component | `app/components/**/ *.test.ts` | PageShell + DataTable states | Step 1–3, AC-001/002 |
| NT-02 | Nuxt — Page | `tests/nuxt/foundation/*.test.ts` | Dashboard per peran, sidebar | Step 4–5, AC-004/005 |
| E2E-01 | E2E — Happy path | `tests/e2e/foundation.spec.ts` | List → search → refresh; login | Step 1–2/6, AC-001/002 |
| E2E-02 | E2E — Alternate | `tests/e2e/foundation.alt.spec.ts` | Empty/error/403/locale/mobile | ALT-01, ERR-01–03, AC-003 |

- [ ] Unit, Nuxt (semua state), E2E (happy + alternate + permission + responsif)
- [ ] Coverage target: User Flow 100%, AC 100%, Edge Cases 100%

## Verification (QA)

### Automated

- [ ] Typecheck (`vue-tsc`) — 0 error
- [ ] Unit (`npm run test:unit`) — PASS
- [ ] Nuxt (`npm run test:nuxt`) — PASS
- [ ] E2E (`npm run test:e2e`) — PASS
- [ ] Build (`npm run build`) — sukses

### Manual / QA Checklist

- [ ] Permission verification — matrix RBAC tidak berubah (INV-001)
- [ ] States verification — loading/empty/error/success/validation/403 di semua halaman
- [ ] Responsive — desktop/tablet/mobile sesuai wireframe 26
- [ ] Accessibility — keyboard, ARIA, contrast, reduced-motion
- [ ] UI/UX pixel-perfect terhadap mockup 26
- [ ] User Flow + AC traceability penuh

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
