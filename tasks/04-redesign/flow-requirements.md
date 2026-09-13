<!-- tasks/04-redesign/flow-requirements.md — FASE 2 -->

## User Flow

> MANDATORY — sama dengan FASE 1 (`tasks/03-redesign-ui-design/flow-requirements.md`), plus mapping ke implementasi. Tidak ada perubahan alur.

### Diagram

```text
[Entry: /login] --(kredensial valid)--> [/dashboard hero] --(sidebar)--> [List: users|roles|permissions|guards]
        |                                     |                                    |
        +--(invalid)--> [Inline error]         +--(sidebar)--> [Sistem: activity-logs|system-logs|settings|profile]
        |                                     |
[Entry: /register] --(valid)--> [/login]       +--(CRUD)--> [Modal Card] --(submit)--> [Toast Berhasil] + re-fetch
                                                      |                    |
                                                      +--(403)--> [AccessDeniedAlert single]
                                                      +--(empty)--> [EmptyStateCard + CTA]
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Guest | Buka `/login` | Auth Card | Card + pill CTA (sudah FASE 1; verifikasi final) |
| 2 | Guest | Submit invalid/valid | `POST /api/auth/login` | Inline error / JWT + redirect (tak berubah) |
| 3 | Guest | Register valid | `POST /api/auth/register` | 201 + redirect `/login` (tak berubah) |
| 4 | Auth user | Buka `/dashboard` | **DashboardHero terintegrasi** | Hero + stat + recent |
| 5 | Auth user | Navigasi sidebar | App-Shell Row aktif | Indikator + tint (sudah FASE 1; verifikasi) |
| 6 | Auth user | Buka list | DataTable + **BadgePill peran** | Tabel eyebrow + pill |
| 7 | Auth user | Create/Edit | **ModalCard di semua FormModal** | Radius xl16 + Level-2 |
| 8 | Auth user | Submit sukses/gagal | Toast / NAlert+retry | `Berhasil` + re-fetch |
| 9 | Auth user | Aksi tanpa permission | 403 → NAlert single | Tak berubah (logika) |
| 10 | Auth user | Logs | **BadgePill level** + drawer | Pill semantic |
| 11 | Auth user | Settings/Profile | Form + upload + 2 card | Tak berubah (visual final) |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Tabel kosong | List → **EmptyStateCard + CTA** | Per-entity CTA (`+ Buat User` dkk) |
| ALT-02 | Menu tanpa akses | Sidebar | Hidden (logika tak berubah) |
| ERR-01 | Validasi gagal | Form → inline | Tak berubah |
| ERR-02 | 403 | Any → NAlert single | Tak berubah |
| ERR-03 | Fetch gagal | List → NAlert + retry | Tak berubah |
| ERR-04 | 401 | Any → `/login` | Tak berubah |

### Flow → UI Mapping

| Flow Step | Halaman (dari FASE 1) | Component | State |
|-----------|--------------------------|-----------|-------|
| Step 1–3 | `/login`, `/register` | Auth Card (`auth.vue`) | default, validation, loading |
| Step 4 | `/dashboard` | `DashboardHero` + stat cards | loading → success |
| Step 5 | sidebar | App-Shell Row (`default.vue`) | default, active |
| Step 6 | list pages | DataTable + `BadgePill` | loading, empty, error, success |
| Step 7 | modals | `*FormModal` + `.modal-card` | default, validation |
| Step 8 | toast/alert | `useMessage` + NAlert | success, error |
| Step 10 | logs | `BadgePill` + drawer | loading → success |
| ALT-01 | empty | `EmptyStateCard` | empty + CTA |

### Flow → API Mapping

Tidak ada perubahan API — semua endpoint tetap (`/api/auth/*`, `/api/users|roles|permissions|guards`, `/api/activity-logs`, `/api/system-logs/*`, `/api/settings`, `/api/storage/*`, `/api/health`). Detail: `docs/architecture.md` § API Endpoints. Task ini tidak menambah/mengubah route, method, validasi, maupun auth.

## Requirements

### Tujuan Fitur

- REQ-G01: 11 halaman tampil sesuai prototype approved (lebih baik/bagus/cantik) tanpa mengubah perilaku.
- REQ-G02: Pola Notion teraplikasi merata (hero, pill, empty, modal, shell-row) — nol halaman tertinggal.
- REQ-G03: Regresi nol — 118 tests + builds tetap hijau; stories `foundation/` + `redesign/` PASS.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Guest | Login/register | Public routes |
| Authenticated | Semua halaman sesuai role | JWT + permission (tak berubah) |
| Developer | Wiring + tests | Kode |
| QA/Reviewer | Verifikasi pixel-perfect + regresi | Build/tests/storybook |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Auth user | Membuka dashboard baru | Hero + stat + recent tampil | Step 4 |
| UC-02 | Auth user | Melihat tabel dengan pill | Kolom peran/level berupa BadgePill | Step 6/10 |
| UC-03 | Auth user | Membuka modal form | Modal xl16 Level-2 di semua FormModal | Step 7 |
| UC-04 | Auth user | Melihat tabel kosong | EmptyStateCard + CTA per entity | ALT-01 |
| UC-05 | QA | Menjalankan regresi penuh | Semua suite hijau + stories PASS | — |

### Functional Requirements

- FR-001: `/dashboard` **harus** me-render `DashboardHero` (band, headline, stat dari API/settings, recent users) menggantikan greeting card lama — mengcover Step 4.
- FR-002: Kolom peran di tabel users dan kolom level di tabel logs **harus** memakai `BadgePill` (primer/semantic) — mengcover Step 6/10.
- FR-003: `RoleFormModal`, `PermissionFormModal`, `GuardFormModal` **harus** memakai class `.modal-card` seperti exemplar `UserFormModal` — mengcover Step 7.
- FR-004: Slot `#empty` DataTable di semua list pages **harus** me-render `EmptyStateCard` dengan CTA spesifik entity — mengcover ALT-01.
- FR-005: Halaman auth **harus** final visual Auth Card (pill CTA, card xl16, panel hero gradient Notion) — mengcover Step 1–3.
- FR-006: Tidak ada perubahan kontrak API/DB/RBAC — semua endpoint, query params, response, permission checks identik — mengcover semua Steps.

### Business Rules

- BR-001: Pixel-perfect terhadap stories approved; deviasi dicatat di `domain-api-ui.md` § Penyesuaian dari design.
- BR-002: Refine visual tidak boleh mengubah logika (validasi, emit, permission gating, pagination).
- BR-003: `foundation/` + `redesign/` stories tetap PASS setelah perubahan (regresi visual).

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | `DashboardHero` stat API lambat/gagal | Skeleton/spin parsial; hero tetap render | Step 4 |
| EC-02 | Role tanpa nama (null) di BadgePill | Fallback `—`, tidak crash | Step 6 |
| EC-03 | Modal di mobile <768px | Full-width sheet (pola ModalCard responsif) | Step 7 |
| EC-04 | `LogLevelBadge` existing vs `BadgePill` konflik | Jika LogLevelBadge dipertahankan, catat deviasi + alasan | Step 10 |
