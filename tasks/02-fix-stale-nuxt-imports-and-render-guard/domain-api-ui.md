<!-- split dari ../02-fix-stale-nuxt-imports-and-render-guard.md — bagian: Domain, API, UI -->

## Domain

### Entities

| Entity | Deskripsi | Atribut Kunci | Status |
|--------|-----------|---------------|--------|
| User | Akun platform | id, username, email | Dipertahankan (9 schemas) |
| Role | Kumpulan permission+guard | id, roleName | Dipertahankan |
| Permission | Aturan method+URL | id, permissionName | Dipertahankan |
| Guard | Allow/deny URLs client gating | id, guardName | Dipertahankan |
| Health Probe | Status ops `db/storage/version` | status, db, storage | Dipertahankan — tanpa `renderer` (removed Task 01) |
| Nuxt Import Preset | Auto-import `use*Store` dari `app/stores/` | from, name | Fix — hanya 6 store tersisa |
| Render Guard | Semaphore render preview (dynamic) | activeRenderCount, concurrency | **Dihapus Task 01** — tidak ada |

### Relationships

```text
health --depends-on--> db (SELECT 1) + storage (access W_OK)   (tanpa renderer)
nuxt.config imports.dirs:['stores'] --scans--> app/stores/{auth,guards,permissions,roles,settings,users}.ts
.nuxt/imports.d.ts --generated-from--> app/stores/*.ts (6 exports)
server/utils/security-limits.ts --comments-only--> (render-guard.ts removed)
[REMOVED] server/utils/render-guard.ts --was-imported-by--> server/api/health/index.get.ts (sebelum Task 01)
```

- REL-01: `health` 1:1 `db` + 1:1 `storage` — RBAC-Only invariant.
- REL-02: `imports.dirs` 1:N `app/stores/*.ts` — auto-discovery folder, tidak eksplisit preset listing.
- REL-03: `[REMOVED]` `render-guard` — tidak ada relasi aktif setelah Task 01.

### States

| Entity | State | Deskripsi | Transisi Diizinkan | Status |
|--------|-------|-----------|--------------------|--------|
| Health | healthy/degraded | db+storage healthy => healthy | healthy ↔ degraded | Dipertahankan |
| Build | success/warning/error | B6005/ENOENT state | error → success via cache clean | Fix target |
| Deleted Store import | N/A | Tidak ada — auto-import skip | — | Dihapus |

### Domain Rules

- DR-01: `app/stores/` adalah source of truth untuk auto-import — setiap `export const use*Store` di file tersebut otomatis diekspor via `imports.dirs`; file yang tidak ada tidak boleh direferensikan.
- DR-02: `server/api/health` adalah public ops probe tanpa auth, tanpa PII, tanpa `renderer` dependency (RBAC-Only).
- DR-03: Komentar yang mereferensikan file terhapus harus ditandai `removed in Task XX` — bukan path aktif.

### Invariants

- INV-01: `ls app/stores/` tepat 6 file; `ls server/utils/` tidak mengandung `render-guard.ts`.
- INV-02: `appEntities` di `orm-data-source.ts` tetap 9 schemas (12 tabel fisik).
- INV-03: `GET /api/health` tidak pernah mengimpor modul di luar `server/utils/db` (+ node built-ins).
- INV-04: `grep -R "render-guard" apps/web/server --include="*.ts"` 0 hit setelah fix (kecuali komentar terperbaiki dengan `removed`).

### Data Model

N/A — stateless infra/build fix. Tidak ada perubahan tabel. Data model DB tetap 9 EntitySchemas / 12 tabel fisik Task 01 (users, roles, permissions, permission_methods, permission_urls, guards, guard_urls, activity_logs, settings + junctions users_roles, roles_guards, roles_permissions) — lihat `docs/database.md` § Entity Details.

- Index: tidak ada perubahan.
- Constraint: tidak ada migrasi baru; `1700000000001-DropDynamicTables.ts` tetap baseline drop dynamic.

## API

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step | Status |
|---|--------------|-------------|------|------------|-----------|-----------|--------|
| 1 | `/api/health` | GET | Public | — | Ops probe `{status, db, storage, version}` tanpa `renderer` | Step 7 | **Verify — harus 200 healthy** |
| 2 | `/api/auth/login` | POST | Public | — | Login (RBAC regression) | Step 9 | Retain — verify |
| 3 | `/api/auth/register` | POST | Public | — | Register | Step 9 | Retain |
| 4 | `/api/users` | GET | JWT | `requireApiAccess` | List paginated | Step 9 | Retain |
| 5 | `/api/roles` | GET | JWT | `requireApiAccess` | List | Step 9 | Retain |
| 6 | `/api/permissions` | GET | JWT | `requireApiAccess` | List | Step 9 | Retain |
| 7 | `/api/guards` | GET | JWT | `requireApiAccess` | List | Step 9 | Retain |
| 8 | `/api/activity-logs` | GET | JWT | `requireApiAccess` | List | Step 9 | Retain |
| 9 | `/api/system-logs/files` | GET | JWT | `requireApiAccess` | List files | Step 9 | Retain |
| 10 | `/api/settings` | GET | Public | — | Get all | Step 9 | Retain |
| 11 | `/api/global-tables`, `/api/components`, `/api/templates`, `/api/administrations`, `/api/documents`, `/api/runs`, `/api/navigation`, `/api/expressions/*`, `/api/render/*` | * | — | — | Harus 404 (invariant Task 01) | — | Removed — tetap 404 |

### Detail per Endpoint

#### Health — GET /api/health

- **Request**
  - Query: none
  - Headers: none (public)
- **Response**
  ```json
  { "status": "healthy", "db": "healthy", "storage": "healthy", "version": "1.0.0" }
  ```
  - `status: "healthy" | "degraded"` — `healthy` jika `db === "healthy" && storage === "healthy"` (tanpa `renderer`).
  - `status: "degraded"` jika salah satu `degraded`.
- **Validation (Zod)**: N/A — no input.
- **Error**
  | Status | Kondisi | Body |
  |--------|---------|------|
  | 500 | `getDataSource().query('SELECT 1')` throw atau `access(storage, W_OK)` throw tidak tertangani (di-catch jadi `degraded` bukan 500) | `{ status: "degraded", db: "degraded" | "healthy", storage: "degraded" | "healthy" }` |
- **Authentication**: Public — no JWT.
- **Authorization**: N/A.

#### RBAC CRUD (contoh GET /api/users)

- **Request**
  - Query: `page` (default 1), `limit` (default 20), `search`, `searchField`, `sortBy` (whitelist), `sortOrder` (ASC/DESC)
  - Headers: `Authorization: Bearer <JWT>`
- **Response**
  ```json
  { "data": [...], "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
  ```
- **Validation**: `QuerySchema` Zod (page min 1, limit 1–100) — tidak berubah.
- **Error**: 401 tanpa token, 403 permission mismatch, 400 validation.
- **Authentication/Authorization**: `requireAuth` → `requireApiAccess` (method+URL match via `matchUrlPattern`).

## UI

### Referensi Design

- Design task: N/A — tidak ada UI baru; mempertahankan UI RBAC-Only Task 01 / `docs/design-system.md` (PageShell, DataTable kanonis, AccessDeniedAlert single, sidebar 220/72, token `#3B82F6`).
- Wireframe: `docs/wireframes/*` — **dihapus Task 01** (aset foundation dimerge ke `docs/design-system.md`).
- Mockup: `docs/mockups/*` — dihapus Task 01.
- Prototype: `docs/prototypes/*` — dihapus Task 01.
- Storybook: `apps/web/stories/foundation/` (`PageShell`, `DataTable`, `AccessDeniedAlert`) — dipertahankan; `stories/global-table/*` sudah dihapus Task 01. Verifikasi `npm run build-storybook` tetap sukses sebagai regresi.

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design | Storybook |
|-------|---------|-------|-----------|---------------|-----------|
| `/login` | Login | Guest | Form username/email + password | Retain | `stories/LoginPage.stories.ts` |
| `/register` | Register | Guest | Form firstName/lastName/email/username/password | Retain | `stories/RegisterPage.stories.ts` |
| `/dashboard` | Dashboard | Auth | Stats users/roles/permissions/guards + recent users | Retain (RBAC-Only) | — |
| `/dashboard/users` | User List | Auth + permission | DataTable + CRUD modal/drawer | Retain | — |
| `/dashboard/roles` | Role List | Auth | DataTable + guard/permission assignment | Retain | — |
| `/dashboard/permissions` | Permission List | Auth | DataTable + methods/URLs | Retain | — |
| `/dashboard/guards` | Guard List | Auth | DataTable + allow/deny URLs | Retain | — |
| `/dashboard/activity-logs` | Activity Logs | Auth | List filterable + detail | Retain | — |
| `/dashboard/system-logs` | System Logs | Auth | File selector + table | Retain | — |
| `/dashboard/settings` | Settings | Auth | Form key-value + upload | Retain | — |
| `/dashboard/profile` | Profile | Auth self | Update info + password | Retain | — |

### Layout

- Navigasi: sidebar `NLayoutSider :width 220 :collapsed-width 72` token `#3B82F6`/`#2563EB`, menu statis RBAC-Only: `Dashboard`, `User Management (User, Guard, Role, Permissions)`, `Sistem (Activity Logs, System Logs, Settings)` + header `Profile` — tidak ada group `Data`/`Persuratan`/`Dokumen`.
- Struktur halaman: `PageShell` (title 20px Semibold #1F2937 + breadcrumb `<a href>` + `preventDefault` + `router.push` + actions) → `toolbar DataTable (search 320px + field 160px + Restart aria-label Segarkan data + Settings + visibility)` → `konten NDataTable row 36 header 40` → `pagination Menampilkan {from}-{to} dari {total}` → states.
- Penyesuaian dari design: tidak ada — hanya memastikan tidak ada halaman yang mengimpor store terhapus sehingga tidak ada render error.

### Components

| Component | Lokasi | Deskripsi | Mengacu Mockup | Status |
|-----------|--------|-----------|----------------|--------|
| `PageShell.vue` | `app/components/layout/PageShell.vue` | Shell kanonis | `docs/design-system.md` PageShell | Retain |
| `DataTable.vue` | `app/components/common/DataTable/DataTable.vue` | Tabel + search/sort/visibility/pagination + error slot | Kanonis 320/160 | Retain |
| `AccessDeniedAlert.vue` | `app/components/common/AccessDeniedAlert.vue` | Floating global NAlert 403 single | Authorization UI | Retain |
| `AuthForm.vue` | `app/components/common/AuthForm/` | Login/register form | — | Retain |
| `*Table.vue`, `*FormModal.vue`, `*DetailDrawer.vue` (users/roles/permissions/guards) | `app/components/features/users/` & `logging/` | CRUD RBAC | `.detail-view` pattern | Retain |

### Interaction

- Trigger: `npm run dev` → Vite + Nitro bootstrap — harus tanpa B6005/ENOENT.
- Flow: `GET /api/health` → 200 healthy; `POST /api/auth/login` → JWT → redirect `/dashboard`; CRUD DataTable → validate → submit → toast → re-fetch.
- Konfirmasi: hapus via `NPopconfirm`/`NDialog` — tetap.
- Navigasi balik: breadcrumb `<a href>` + `preventDefault` + `router.push`.
- Deviasi dari prototype: N/A.

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe |
|------------|----------|-------------------|
| Desktop (≥1024px) | Sidebar 220, tabel penuh, PageShell toolbar flex-row, NGrid 3 dashboard | `docs/design-system.md` responsive |
| Tablet (768–1023px) | Sidebar 72, kolom hide via visibility toggle, toolbar wrap | — |
| Mobile (<768px) | Sidebar drawer, toolbar flex-wrap column, DataTable scroll | — |

### States

| State | Tampilan | Komponen Naive UI | Mengacu Mockup | Status |
|-------|----------|-------------------|----------------|--------|
| Loading | NSpin overlay | `NSpin` | — | Retain |
| Empty | NEmpty Belum ada data + CTA | `NEmpty` | — | Retain |
| Error | NAlert Gagal memuat data + Coba lagi | `NAlert` | — | Retain |
| Success | useMessage Berhasil | `useMessage()` | — | Retain |
| Permission Denied | Floating global NAlert Akses Ditolak data-testid=access-denied 4s | `NAlert`+Teleport | — | Retain |
| Build Error | Nitro ENOENT / NUXT_B6005 di terminal | — | — | **Fix — harus hilang** |

### Accessibility

- Keyboard: aksi CRUD via keyboard, focus trap di NModal/NDrawer — tetap.
- ARIA: `aria-label="Segarkan data"` Refresh, `aria-current="page"` breadcrumb leaf, `aria-hidden` NIcon dekoratif.
- Kontras & font: `naiveui-theme.ts` primary `#3B82F6`, hover `#2563EB`, radius `6px/4px/8px`, Inter.
- Reduced motion: `prefers-reduced-motion` 0.01ms.

