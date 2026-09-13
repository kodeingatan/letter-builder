<!-- split dari ../01-platform-scope-reduction.md — bagian: Domain, API, UI -->

## Domain

### Entities

| Entity | Deskripsi | Atribut Kunci | Status |
|--------|-----------|---------------|--------|
| User | Akun platform | id, firstName, lastName, username, email, password (bcrypt) | **Dipertahankan** |
| Role | Kumpulan permission + guard | id, roleName, description | Dipertahankan |
| Permission | Aturan method+URL | id, permissionName, description | Dipertahankan |
| PermissionMethod | Method per permission | id, permissionId, method | Dipertahankan |
| PermissionUrl | URL pattern per permission | id, permissionId, url | Dipertahankan |
| Guard | Kumpulan allow/deny URLs (client gating) | id, guardName, description | Dipertahankan |
| GuardUrl | URL rule per guard | id, guardId, url, type | Dipertahankan |
| ActivityLog | Audit trail | id, userId, action, entity, entityId, description, metadata, ipAddress, userAgent, level, createdAt | Dipertahankan |
| Setting | Key-value konfigurasi | id, key, value | Dipertahankan |
| GlobalTable | Definisi tabel dinamis (name, displayName, columns) | id, name, displayName | **Dihapus** |
| GlobalTableColumn | Kolom schema-driven | id, globalTableId, name, type, position | Dihapus |
| GlobalTableRow | Generic row JSON | id, globalTableId, values | Dihapus |
| Component | Reusable document block | id, name, content, status | Dihapus |
| ComponentDataRequirement | Contract data requirement | id, componentId, name, type | Dihapus |
| ComponentVersion | History immutable | id, componentId, version | Dihapus |
| Template | Blueprint dokumen | id, name, content, status | Dihapus |
| TemplateVersion | History | id, templateId, version | Dihapus |
| TemplateBinding | Binding requirement→source | id, templateId, placementId, requirementName, source | Dihapus |
| Administration | Workflow multi-step | id, name, status | Dihapus |
| AdministrationStep | Step per administration | id, administrationId, order, templateId | Dihapus |
| AdministrationVersion | Snapshot publish | id, administrationId, version | Dihapus |
| AdministrationRun | Eksekusi workflow | id, administrationId, status, startedBy | Dihapus |
| Document | Output PDF/HTML | id, administrationId, runId, dataSnapshot | Dihapus |

### Relationships

```text
users ──M:N── roles ──M:N── guards ──1:N── guard_urls          (dipertahankan)
users ──M:N── roles ──M:N── permissions ──1:N── permission_methods (dipertahankan)
                                          └──1:N── permission_urls (dipertahankan)
users ──1:N── activity_logs (FK SET NULL)                        (dipertahankan)

[DIHAPUS] global_tables ─< global_table_columns
[DIHAPUS] global_tables ─< global_table_rows
[DIHAPUS] components ─< component_data_requirements
[DIHAPUS] components ─< component_versions
[DIHAPUS] templates ─< template_versions
[DIHAPUS] templates ─< template_bindings
[DIHAPUS] administrations ─< administration_steps >── templates
[DIHAPUS] administrations ─< administration_runs ─< documents
```

- REL-01: `users_roles` (users M:N roles) ON DELETE CASCADE — dipertahankan.
- REL-02: `roles_guards` (roles M:N guards) ON DELETE CASCADE — dipertahankan.
- REL-03: `roles_permissions` (roles M:N permissions) ON DELETE CASCADE — dipertahankan.
- REL-04: `guard_urls` (guards 1:N GuardUrl) ON DELETE CASCADE — dipertahankan.
- REL-05: `permission_methods` + `permission_urls` (permissions 1:N) ON DELETE CASCADE — dipertahankan.
- REL-06 (DIHAPUS): `global_table_columns` & `global_table_rows` cascade — dihapus bersama entity.
- REL-07 (DIHAPUS): `component_data_requirements`/`versions`, `template_*`, `administration_*`, `documents` — dihapus.

### States

| Entity | State | Deskripsi | Transisi Diizinkan | Status |
|--------|-------|-----------|--------------------|--------|
| Semua retained | N/A — stateless CRUD | CRUD tanpa workflow | — | Dipertahankan (stateless) |
| GlobalTable/Component/Template/Administration (DIHAPUS) | draft/published/archived | Versioned publish lifecycle | draft→published→archived, published→new-version | Dihapus |
| AdministrationRun (DIHAPUS) | pending/running/completed/cancelled | Eksekusi workflow | pending→running→completed\|cancelled | Dihapus |
| Document (DIHAPUS) | draft/issued/reissued | Render lifecycle | draft→issued→reissued | Dihapus |

### Domain Rules

- DR-01: Setiap `Permission` harus memiliki minimal 1 `PermissionMethod` dan 1 `PermissionUrl` agar efektif (vacuous permission = deny-all).
- DR-02: `GuardUrl` bertipe `deny` dievaluasi client-side sebelum `allow` untuk menu gating; server tidak mengevaluasi guard.
- DR-03: `ActivityLog.userId` nullable — log tetap tersimpan bila user dihapus (SET NULL).
- DR-04 (DIHAPUS): `Component` tidak dapat dihapus bila masih dipakai `Template` — aturan ini hilang bersama modul.
- DR-05 (DIHAPUS): `Global Table` relation `restrict` vs `detach` — hilang.

### Invariants

- INV-01: `users.username` & `users.email` UNIQUE — tidak boleh duplikat (enforced DB + Zod).
- INV-02: `roles.roleName`, `permissions.permissionName`, `guards.guardName`, `settings.key` UNIQUE.
- INV-03: `appEntities` di `orm-data-source.ts` harus tepat 9 schemas dan `synchronize: true` dev tidak membuat tabel dynamic.
- INV-04: `GET /api/navigation`, `GET /api/data/:tableName`, `POST /api/expressions/*`, `POST /api/render/preview` tidak ada — `matchUrlPattern` tidak dipakai untuk route tersebut lagi.
- INV-05: Sidebar menu length = 1 (Dashboard) + 4 (User Management) + 3 (Sistem) (+ Profile) — tidak ada entry dynamic.

### Data Model

#### users (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| firstName | varchar(100) | Y | N | — | Nama depan |
| lastName | varchar(100) | Y | N | — | Nama belakang |
| username | varchar(30) | Y | Y | — | Username 3–30 alfanum+_ |
| email | varchar(255) | Y | Y | — | Email |
| password | varchar(255) | Y | N | — | bcrypt hash |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

- Index: PK `id`, UNIQUE `username`, UNIQUE `email`.

#### roles (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| roleName | varchar(100) | Y | Y | — | Nama role |
| description | text | N | N | null | — |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

#### permissions (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| permissionName | varchar(100) | Y | Y | — | Nama permission |
| description | text | N | N | null | — |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

#### guards (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| guardName | varchar(100) | Y | Y | — | Nama guard |
| description | text | N | N | null | — |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

#### activity_logs (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| userId | integer | N | N | null | FK users.id SET NULL |
| action | varchar | Y | N | — | CREATE/UPDATE/DELETE/LOGIN/LOGOUT |
| entity | varchar | Y | N | — | User/Role/Permission/Guard/Auth/System |
| entityId | integer | N | N | null | ID entity |
| description | text | N | N | null | — |
| metadata | text | N | N | null | JSON |
| ipAddress | varchar | N | N | null | — |
| userAgent | varchar | N | N | null | — |
| level | varchar(20) | Y | N | INFO | INFO/WARNING/ERROR |
| createdAt | datetime | Y | N | now | — |

#### settings (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| key | varchar(100) | Y | Y | — | Key unik |
| value | text | Y | N | — | Value |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

- Junction `users_roles`, `roles_guards`, `roles_permissions` (PK komposit, FK CASCADE) dipertahankan tanpa perubahan.

#### [DIHAPUS] global_tables, global_table_columns, global_table_rows, components, component_data_requirements, component_versions, templates, template_versions, template_bindings, administrations, administration_steps, administration_versions, administration_runs, documents

- Status: **Dihapus** — tidak ada tabel, tidak ada EntitySchema, migrasi drop atau `synchronize` reset. Detail kolom lihat `docs/database.md` sebelum Task 01 (git history) untuk referensi arsip.

## API

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step | Status |
|---|--------------|-------------|------|------------|-----------|-----------|--------|
| 1 | `/api/auth/register` | POST | Public | — | Register | Step 4 | **Retain** |
| 2 | `/api/auth/login` | POST | Public | — | Login | Step 3 | Retain |
| 3 | `/api/auth/profile` | GET | JWT | — | Get profile | Step 5 | Retain |
| 4 | `/api/auth/profile` | PATCH | JWT | — | Update profile | — | Retain |
| 5 | `/api/auth/password` | PATCH | JWT | — | Change password | — | Retain |
| 6 | `/api/users` | GET | JWT | users:list | List paginated | Step 6 | Retain |
| 7 | `/api/users` | POST | JWT | users:create | Create | Step 6 | Retain |
| 8 | `/api/users/:id` | GET | JWT | users:read | Detail | Step 6 | Retain |
| 9 | `/api/users/:id` | PUT | JWT | users:update | Update | Step 6 | Retain |
| 10 | `/api/users/:id` | DELETE | JWT | users:delete | Delete | Step 6 | Retain |
| 11 | `/api/roles` | GET/POST | JWT | roles:* | CRUD | Step 6 | Retain |
| 12 | `/api/roles/:id` | GET/PUT/DELETE | JWT | roles:* | CRUD | Step 6 | Retain |
| 13 | `/api/permissions` | GET/POST | JWT | permissions:* | CRUD | Step 6 | Retain |
| 14 | `/api/permissions/:id` | GET/PUT/DELETE | JWT | permissions:* | CRUD | Step 6 | Retain |
| 15 | `/api/guards` | GET/POST | JWT | guards:* | CRUD | Step 6 | Retain |
| 16 | `/api/guards/:id` | GET/PUT/DELETE | JWT | guards:* | CRUD | Step 6 | Retain |
| 17 | `/api/activity-logs` | GET | JWT | activity-logs:read | List filterable | Step 7 | Retain |
| 18 | `/api/activity-logs/stats` | GET | JWT | activity-logs:read | Stats | Step 7 | Retain |
| 19 | `/api/activity-logs/:id` | GET | JWT | activity-logs:read | Detail | Step 7 | Retain |
| 20 | `/api/activity-logs/coverage` | GET | JWT | — | Coverage matrix | — | **Hapus** (jika terkait dynamic audit) |
| 21 | `/api/system-logs/files` | GET | JWT | system-logs:read | List files | Step 7 | Retain |
| 22 | `/api/system-logs/files/:filename` | GET | JWT | system-logs:read | Read file | Step 7 | Retain |
| 23 | `/api/system-logs/stats/:filename` | GET | JWT | system-logs:read | Stats | Step 7 | Retain |
| 24 | `/api/settings` | GET | Public | — | Get all | Step 7 | Retain |
| 25 | `/api/settings/:key` | GET | Public | — | Get by key | — | Retain |
| 26 | `/api/settings` | PUT | JWT | settings:update | Update | Step 7 | Retain |
| 27 | `/api/settings/upload` | POST | JWT | settings:update | Upload file | Step 7 | Retain |
| 28 | `/api/storage/:subfolder/:filename` | GET | Public | — | Serve file | Step 7 | Retain |
| 29 | `/api/health` | GET | Public | — | Health check | — | Retain |
| 30 | `/api/global-tables` | * | — | — | CRUD global tables | Step 9 | **Hapus → 404** |
| 31 | `/api/global-tables/:id/*` | * | — | — | Columns/rows/menu | Step 9 | Hapus → 404 |
| 32 | `/api/data/:tableName` | * | — | — | Row CRUD import/export | Step 9 | Hapus → 404 |
| 33 | `/api/components` | * | — | — | Components CRUD | Step 9 | Hapus → 404 |
| 34 | `/api/templates` | * | — | — | Templates CRUD | Step 9 | Hapus → 404 |
| 35 | `/api/administrations` | * | — | — | Administrations CRUD | Step 9 | Hapus → 404 |
| 36 | `/api/documents` | * | — | — | Documents | Step 9 | Hapus → 404 |
| 37 | `/api/runs` | * | — | — | Runs | Step 9 | Hapus → 404 |
| 38 | `/api/navigation` | GET | JWT | — | Menu projection | Step 9 | Hapus → 404 |
| 39 | `/api/expressions/*` | POST | JWT | — | Validate/evaluate | Step 9 | Hapus → 404 |
| 40 | `/api/render/*` | POST | JWT | — | Preview render | Step 9 | Hapus → 404 |

> Jumlah akhir retained: 29 - 11 hapus = ~18 endpoint groups (auth 5, users 5, roles 5, permissions 5, guards 5, activity-logs 3, system-logs 3, settings 4, storage 1, health 1 — dikelompokkan).

### Detail per Endpoint (Retained — contoh)

#### List — GET /api/users

- **Request**
  - Query: `page` (1..100, default 1), `limit` (1..100, default 20), `search` (string), `searchField` (whitelist: id,firstName,lastName,username,email), `sortBy` (whitelist), `sortOrder` (ASC/DESC)
  - Headers: `Authorization: Bearer <JWT>` (kecuali public routes)
- **Response**
  ```json
  { "data": [{ "id": 1, "firstName": "Super", "lastName": "Admin", "username": "admin", "email": "admin@admin.com", "roles": [...] }], "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
  ```
- **Validation (Zod)**
  - `QuerySchema`: `page` coerced number min 1, `limit` 1–100, `sortBy` whitelist, `sortOrder` enum.
- **Error**
  | Status | Kondisi | Body |
  |--------|---------|------|
  | 400 | query tidak valid | `{ "message": "Validation failed", "errors": [...] }` |
  | 401 | tanpa/invalid token | `{ "message": "Unauthorized" }` |
  | 403 | permission tidak cukup | `{ "message": "Forbidden" }` |
- **Authentication**: JWT via `Authorization: Bearer` atau cookie `accessToken` (`server/middleware/auth.ts`, `server/utils/route-guard.ts`).
- **Authorization**: `requireApiAccess` — method+URL match terhadap `permissions` dari `roles` user.

#### Create — POST /api/users

- **Request** Body: `{ firstName, lastName, email, username, password, confirmPassword, roleIds? }` (Zod `CreateUserSchema`).
- **Validation**: firstName 1–100, lastName 1–100, email valid & unique, username 3–30 alfanum+_, password 8+ dengan uppercase+lowercase+angka, confirmPassword match.
- **Response**: `201 { id, ... }` (tanpa password).
- **Error**: 400 validation, 409 duplicate email/username, 401/403.

_(Pola identik berlaku untuk Roles/Guards/Permissions — DTO di `server/dto/*.dto.ts` — tidak diubah oleh task ini.)_

#### Detail per Endpoint (Dihapus — harus 404)

- **Request**: `GET /api/global-tables`, `GET /api/components`, `GET /api/templates`, `GET /api/administrations`, `GET /api/documents`, `GET /api/runs/mine`, `GET /api/navigation`, `POST /api/expressions/validate`, `POST /api/render/preview`, `GET /api/data/:tableName` dengan JWT valid.
- **Response**: `404 { "message": "Not Found" atau "Cannot find route" }` — Nitro tidak menemukan handler karena file `server/api/*` telah dihapus.
- **Validasi**: Tidak ada — route tidak ada.
- **Catatan**: Playwright & curl harus assert 404 bukan 500.

## UI

### Referensi Design

- Design task: N/A — tidak ada UI baru; cleanup mempertahankan UI existing yang telah diimplementasikan (RBAC foundation tasks 01–27). Referensi token & pola tetap `docs/design-system.md` (versi RBAC-Only setelah Task 01).
- Wireframe: `docs/wireframes/` — **dihapus** (aset `foundation` yang generik dimerge ke `docs/design-system.md` sebelum penghapusan).
- Mockup: `docs/mockups/` — **dihapus** (idem).
- Prototype: `docs/prototypes/` — **dihapus**.
- Storybook: `apps/web/stories/foundation/*` (PageShell, DataTable, AccessDeniedAlert, DashboardShortcuts) — **dipertahankan hanya jika tidak mereferensikan dynamic**; `stories/global-table/*` **dihapus**. Verifikasi `npm run storybook` :6006 & `npm run build-storybook` tetap sukses.

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design | Storybook |
|-------|---------|-------|-----------|---------------|-----------|
| `/login` | Login | Guest | Form email/username + password | Retain | `stories/LoginPage.stories.ts` |
| `/register` | Register | Guest | Form firstName/lastName/email/username/password | Retain | `stories/RegisterPage.stories.ts` |
| `/dashboard` | Dashboard | Auth | Ringkasan users/roles/permissions/guards + recent users + activity shortcut | Retain — hapus widget dynamic (global-tables/administrations counts) | `stories/DashboardPage.stories.ts` |
| `/dashboard/users` | User List | Auth + permission | Daftar + search + pagination + CRUD modal/drawer | Retain | — |
| `/dashboard/roles` | Role List | Auth | Daftar + assignment guard/permission | Retain | — |
| `/dashboard/permissions` | Permission List | Auth | Daftar + methods/URLs | Retain | — |
| `/dashboard/guards` | Guard List | Auth | Daftar + allow/deny URLs | Retain | — |
| `/dashboard/activity-logs` | Activity Logs | Auth | List filterable + stats + detail drawer | Retain | — |
| `/dashboard/system-logs` | System Logs | Auth | File selector + table + detail + code link | Retain | — |
| `/dashboard/settings` | Settings | Auth | Form key-value + upload favicon/bg | Retain | — |
| `/dashboard/profile` | Profile | Auth (self) | Update info + change password | Retain | — |
| `/dashboard/data/global-tables` | Global Tables | — | Daftar tabel dinamis | **Hapus** | `stories/global-table/*` hapus |
| `/dashboard/data/:tableName` | Table Data Browse | — | Browse row per table | Hapus | — |
| `/dashboard/docs/components` | Components | — | Reusable blocks | Hapus | — |
| `/dashboard/docs/templates` | Templates | — | Blueprint editor | Hapus | — |
| `/dashboard/docs/administrations` | Administrations | — | Workflow list | Hapus | — |
| `/dashboard/docs/runs` | My Runs | — | Runs list | Hapus | — |
| `/dashboard/docs/documents` | Documents | — | Documents list | Hapus | — |
| `/dashboard/docs/run/:adminId` | Run Wizard | — | Step wizard | Hapus | — |
| `/dashboard/docs/templates/:id` | Template Editor | — | Canvas + bindings | Hapus | — |
| `/dashboard/docs/administrations/:id` | Administration Detail | — | Steps editor | Hapus | — |

### Layout

- Navigasi: sidebar `NLayoutSider :width 220 :collapsed-width 72` (token `#3B82F6`/`#2563EB`, `AppLayout.vue:220/72`), menu via `h(NIcon, {default:()=>h(Icon)})`. **Sebelum**: 5 groups (`Dashboard`, `Data` generated, `Persuratan` generated, `Dokumen` 5 items, `User Management` 4, `Sistem` 3). **Sesudah**: 3 groups (`Dashboard`, `User Management → User|Guard|Role|Permissions`, `Sistem → Activity Logs|System Logs|Settings`) + `Profile` di header dropdown. Diproyeksikan statis (tidak via `GET /api/navigation` lagi).
- Struktur halaman: `PageShell` (`title 20px Semibold #1F2937` + `breadcrumb href + preventDefault + router.push` + `actions`) → `toolbar (DataTable: search 320px + field 160px + Restart + Settings + column visibility)` → `konten (NDataTable 36px row, header 40px)` → `pagination "Menampilkan {from}-{to} dari {total}"` → `NEmpty`/`NAlert error + retry`/`NSpin`.
- Penempatan: di bawah `/dashboard` layout `default.vue` dengan middleware `auth`.
- Penyesuaian dari design: tidak ada desain baru; hanya penghapusan menu items dynamic. Jika `wireframes/foundation` sebelumnya mendokumentasikan menu dynamic, catat deviasi di Change Log.

### Components

| Component | Lokasi | Deskripsi | Mengacu Mockup | Status |
|-----------|--------|-----------|----------------|--------|
| `PageShell.vue` | `app/components/layout/PageShell.vue` | Shell kanonis list/detail/editor | `docs/design-system.md` PageShell | Retain |
| `DataTable.vue` | `app/components/common/DataTable/DataTable.vue` | Tabel + search/sort/visibility/pagination + error slot | Kanonis 320/160 + `NAlert` + `Restart` | Retain |
| `AccessDeniedAlert.vue` | `app/components/common/AccessDeniedAlert.vue` | Floating global `NAlert` 403 tunggal `data-testid=access-denied` | `docs/design-system.md` Authorization UI | Retain |
| `AuthForm.vue` | `app/components/common/AuthForm/AuthForm.vue` | Form login/register | `mockups/foundation/auth.png` (dimigrasi) | Retain |
| `UserTable.vue` + `UserFormModal.vue` + `UserDetailDrawer.vue` | `app/components/features/users/` | CRUD user | Detail-view `.detail-view` pattern | Retain |
| `RoleTable.vue` + `RoleFormModal.vue` + `RoleDetailDrawer.vue` | `app/components/features/users/` | CRUD role + guard/permission assignment | — | Retain |
| `PermissionTable.vue` + `PermissionFormModal.vue` + `PermissionDetailDrawer.vue` | `app/components/features/users/` | CRUD permission + methods/URLs | — | Retain |
| `GuardTable.vue` + `GuardFormModal.vue` + `GuardDetailDrawer.vue` | `app/components/features/users/` | CRUD guard + allow/deny URLs | — | Retain |
| `LogDetailDrawer.vue` + `LogLevelBadge.vue` + `CodeLinkButton.vue` | `app/components/features/logging/` | System/Activity log detail | — | Retain |
| `GlobalTableTable.vue`, `ComponentTable.vue`, `TemplateTable.vue`, `AdministrationTable.vue`, `DocumentsTable.vue`, `RunsTable.vue`, `RelationSelector.vue`, `DynamicForm.vue`, `CompositionCanvas.vue`, `BindingTab.vue`, dll | `app/components/features/global-tables|components|templates|administrations|documents|runs|table-data/` | Semua komponen dynamic | **Hapus** |

### Interaction

- Trigger: klik sidebar `User Management → User` → `PageShell` + `DataTable` fetch `GET /api/users?page=1&limit=20`; klik `+ Buat User` → `NModal` `UserFormModal` → validasi Naive UI `NForm` sinkron Zod → `POST /api/users` → `useMessage success` + `NAlert` / re-fetch table → tetap sesuai pola existing.
- Flow: validate → submit → toast → redirect (login/register) atau re-fetch (CRUD) — tidak berubah.
- Konfirmasi: hapus via `NPopconfirm` / `NDialog` — tetap.
- Navigasi balik: `breadcrumb` `<a href>` + `preventDefault` + `router.push`, native right-click/Ctrl+click preserved.
- Deviasi dari prototype: tidak ada prototype baru; semua interaksi dynamic hilang (wizard `NSteps`, canvas `CompositionCanvas`, import CSV modal, relation selector). Jika E2E sebelumnya menguji dynamic, hapus test tersebut.

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe |
|------------|----------|-------------------|
| Desktop (≥1024px) | Sidebar 220 terbuka, tabel penuh, PageShell toolbar flex-row, 3 kolom dashboard `NGrid 3` | `wireframes/foundation/desktop.png` (sebelum dihapus — dimigrasi ke `docs/design-system.md` jika relevan) |
| Tablet (768–1023px) | Sidebar collapsible 72, kolom table hide via visibility toggle, toolbar wrap | `wireframes/foundation/tablet.png` |
| Mobile (<768px) | Sidebar drawer, toolbar `flex-wrap column`, DataTable scroll horizontal, form modal full-width | `wireframes/foundation/mobile.png` |
| — | Halaman dynamic (`/dashboard/data/*`, `/dashboard/docs/*`) tidak ada — akses mobile juga 404 | N/A |

### States

| State | Tampilan | Komponen Naive UI | Mengacu Mockup | Status |
|-------|----------|-------------------|----------------|--------|
| Loading | `NSpin` overlay semi-transparan di table/page | `NSpin` + `NSkeleton` | `loading.png` | Retain |
| Empty | `NEmpty` "Belum ada data" + CTA `+ Buat ...` | `NEmpty` | `empty.png` | Retain |
| Error | `NAlert type="error"` `Gagal memuat data` + `Coba lagi` → `emit retry` | `NAlert` closable | `error.png` | Retain |
| Success | `useMessage success` "Berhasil" | `useMessage()` | `success.png` | Retain |
| Validation | Inline error di `NFormItem` (`feedback`) sinkron Zod | `NFormItem` | `validation.png` | Retain |
| Permission Denied | Floating global `NAlert` "Akses Ditolak" `data-testid=access-denied` auto-dismiss 4s via `rbac-denied` event | `NAlert` + `Teleport` | `403.png` | Retain (tunggal) |
| 404 Not Found | Halaman `[...slug].vue` atau redirect ke `/dashboard` untuk route dynamic terhapus | `NResult` / `NEmpty` | — | **Baru — untuk route terhapus** |

### Accessibility

- Keyboard: semua aksi CRUD via keyboard, focus trap di `NModal`/`NDrawer`, tab order dipertahankan.
- ARIA: `aria-label="Segarkan data"` untuk Refresh, `aria-label="Atur ulang"` untuk Reset, `aria-current="page"` di breadcrumb leaf, `aria-hidden` di `NIcon` dekoratif.
- Kontras & font: tetap `app/utils/naiveui-theme.ts` primary `#3B82F6`, `primaryColorHover` `#2563EB`, radius `6px/4px/8px`, font `Inter`.
- Reduced motion: hormati `prefers-reduced-motion` (`usePageTransition` 250ms + CSS `animation-duration 0.01ms`).
- Screen reader: `NAlert` live region untuk 403, `NEmpty` deskripsi.

