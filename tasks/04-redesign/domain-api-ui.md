<!-- tasks/04-redesign/domain-api-ui.md — FASE 2 -->

## Domain

N/A — stateless presentasi. Tidak ada entity, relasi, state machine, maupun perubahan skema. Domain RBAC (User→Role→Permission/Guard) tak tersentuh — lihat `docs/database.md`.

## API

N/A — No API change. Semua endpoint, DTO (Zod), auth (`requireAuth`/`requireApiAccess`), dan kontrak response identik. Referensi: `docs/architecture.md` § API Endpoints, `docs/PRD.md` §19.

## UI

> MANDATORY — mereferensikan FASE 1 (`tasks/03-redesign-ui-design/` + `apps/web/stories/redesign/`). Bukan desain ulang.

### Referensi Design

- Design task: `tasks/03-redesign-ui-design/README.md` (DONE + APPROVED)
- Wireframe: `tasks/03-redesign-ui-design/wireframes/` (6 SVG)
- Mockup: `tasks/03-redesign-ui-design/mockups/README.md` → stories sebagai source of truth
- Prototype: **Storybook** `apps/web/stories/redesign/*.stories.ts` (8 files) — `:6006`

### Halaman

| Route | Perubahan FASE 2 | Status Design | Storybook |
|-------|------------------|---------------|-----------|
| `/login`, `/register` | Verifikasi final Auth Card (sudah FASE 1) | Approved | `Redesign/AuthCard` |
| `/dashboard` | Integrasi `DashboardHero` + stat + recent; hapus greeting card lama | Approved | `Redesign/DashboardHero` |
| `/dashboard/users` | BadgePill peran + EmptyStateCard CTA `+ Buat User` | Approved | `Redesign/DataTableNotion`, `BadgePill`, `EmptyStateCard` |
| `/dashboard/roles` | Idem + `.modal-card` RoleFormModal + CTA `+ Buat Role` | Approved | `Redesign/ModalCard` |
| `/dashboard/permissions` | Idem + `.modal-card` PermissionFormModal | Approved | — |
| `/dashboard/guards` | Idem + `.modal-card` GuardFormModal | Approved | — |
| `/dashboard/activity-logs` | BadgePill level + EmptyStateCard | Approved | `Redesign/DataTableNotion`, `LevelBadge` |
| `/dashboard/system-logs` | Idem (file selector tetap) | Approved | — |
| `/dashboard/settings` | Verifikasi final form + upload | Approved | — |
| `/dashboard/profile` | Verifikasi final 2 card | Approved | — |

### Layout

Sesuai FASE 1 (sidebar App-Shell Row, PageShell lg12/24px). Tidak ada struktur layout baru.

### Components

| Component | Lokasi | Perubahan FASE 2 | Mengacu |
|-----------|--------|------------------|---------|
| `DashboardHero` | `app/components/features/dashboard/` | Dipakai `dashboard/index.vue` (sudah ada) | `Redesign/DashboardHero` |
| `BadgePill` | `app/components/common/BadgePill/` | Dipakai UserTable (peran), logs (level) | `Redesign/BadgePill` |
| `EmptyStateCard` | `app/components/common/EmptyStateCard/` | Dipakai slot `#empty` DataTable per list page | `Redesign/EmptyStateCard` |
| `*FormModal` | `app/components/features/users/` | Tambah class `.modal-card` (3 file tersisa) | `Redesign/ModalCard` |
| `DataTable` | `app/components/common/DataTable/` | Verifikasi refine FASE 1 per halaman | `Redesign/DataTableNotion` |

### Interaction

Tak berubah dari FASE 1 (sidebar → halaman, `+ Buat` → modal, submit → toast → re-fetch, hapus → NDialog, breadcrumb balik). Wiring tidak mengubah handler/emits existing.

### Responsive Behavior

Sesuai FASE 1 (desktop 220/tabel penuh, tablet 72/wrap, mobile drawer/scroll-x/modal full-width). Verifikasi per halaman via resize + Storybook viewport.

### States

Sesuai FASE 1 (loading `NSpin`, empty `EmptyStateCard`, error `NAlert`+retry, success toast, validation inline, denied single). Coverage via NT + E2E + stories existing.

### Accessibility

Sesuai FASE 1 (keyboard, ARIA, kontras AA via token, reduced-motion, live region). Audit terotomasi penuh di task ini bila memungkinkan (Chromium tersedia → jalankan; jika tidak, catat seperti preseden Task 02).

### Penyesuaian dari design

_(Diisi saat implementasi bila ada deviasi dari stories approved — beserta alasan.)_

1. **EC-04 `LogLevelBadge` vs `BadgePill` — koeksistensi (decided by /auto-task):** kolom tabel (`activity-logs` action/entity/level, `system-logs` level) memakai `BadgePill`; `LogLevelBadge.vue` dipertahankan dan tetap dipakai `LogDetailDrawer` + story `Redesign/LevelBadge` (tanpa penghapusan file).
2. **Stat dashboard — agregasi client via endpoint existing (decided by /auto-task):** `dashboard/index.vue` memanggil `GET /api/users|roles|permissions|guards` (`limit=1` → `total`) + recent users (`limit=5`) dengan Bearer header; tanpa endpoint/DTO baru (FR-006).
3. **Insidental backend (decided by /auto-task):** `UsersService.findAll` + `findOne` join relasi `roles` — sebelumnya API tak pernah mengembalikan `roles` sehingga kolom peran selalu fallback (AC-002 tak mungkin PASS). Route/DTO/validasi/auth/pagination identik.
4. **Insidental frontend auth headers (decided by /auto-task):** `activity-logs.vue`, `system-logs.vue`, 4 `*DetailDrawer`, `settings` store `fetchSettings` kini mengirim `Authorization: Bearer` (pola sama dengan stores) — sebelumnya selalu 401 karena server hanya honor Bearer header. Plus perbaikan parsing respons (`activity-logs`: `response.data`/`response.total`; `system-logs`: bentuk array langsung + normalisasi `levels`→`byLevel` + `WARN`→`WARNING`, mapping baris string→`LogEntry`).
5. **Sweep:** `activity-logs.vue` dibungkus `PageShell` (konsistensi 11 halaman); mapping level/action case-insensitive (data seed memakai action lowercase).
6. **Auth pages:** verify-only — sudah final FASE 1 (pill CTA round, auth layout, inline error); tanpa perubahan.
