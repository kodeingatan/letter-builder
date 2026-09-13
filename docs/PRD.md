# Product Requirements Document (PRD)

## 1. Product Overview

**Nama Project**: LBS — Letter Builder System — RBAC User Management Platform

**Tujuan**: Membangun **Letter Builder System (LBS)** — aplikasi admin panel RBAC untuk mengelola user, role, permission, dan guard dengan dashboard, audit trail, dan pengaturan sistem. Scope saat ini adalah RBAC-Only (login, register, dashboard, user management, sistem).

**Core Concept**: RBAC Foundation — `User → Role → Permission (method+URL) + Guard (allow/deny)` dengan JWT 24 jam.

**Current Implementation State**: Aplikasi mengimplementasikan **RBAC Foundation** (admin panel untuk mengelola user, role, permission, guard) plus **Sistem** (activity logs, system logs, settings) dan dashboard kanonis (PageShell, DataTable, 403 tunggal, locale ID, sidebar 220/72). Development memakai `synchronize: true`, production memakai checked-in baseline migration dengan drift detection. Scope Dynamic Administration **dihapus** di Task 01 — lihat Change Log.

**Tech Stack**:
- Frontend: Nuxt 4 + Vue 3 + TypeScript + Naive UI + Tailwind CSS v4
- Backend: Nitro (Nuxt 4) + TypeORM + SQLite
- Auth: JWT (JSON Web Token)

---

## 2. Product Vision

Menjadi platform admin RBAC yang aman, sederhana, dan konsisten untuk mengelola akses berbasis peran dan permission di lingkungan instansi/perusahaan kecil-menengah.

---

## 3. Problem Statement

Pengelolaan akses manual (user/role/permission hard-coded, guard URL tidak terpusat, audit trail tersebar) menimbulkan:
- Kesulitan menambah role/permission baru tanpa deploy
- Risiko kebocoran akses tanpa permission method+URL yang terstruktur
- Audit dan observability tidak terpusat

Platform RBAC-Only memecahkan ini dengan model permission terstruktur, guard client-side gating, dan audit log terpusat.

---

## 4. Goals

1. Menyediakan login dan registrasi yang aman (bcrypt + JWT)
2. Dashboard ringkasan users/roles/permissions/guards + recent users
3. CRUD User dengan assignment role
4. CRUD Role dengan assignment guard dan permission
5. CRUD Permission dengan method dan URL rules (wildcard)
6. CRUD Guard dengan allow/deny URLs (client gating)
7. Activity Logs filterable sebagai audit trail
8. System Logs viewer + Settings (key-value + upload)

---

## 5. Non-Goals

- Bukan editor layout dokumen atau workflow administrasi persuratan
- Bukan database migration visual berfitur penuh pada versi awal
- Bukan sistem approval/workflow multi-role kompleks

---

## 6. Target Users

- **Administrator Sistem** — mengelola user, role, permission, guard, dan pengaturan
- **Admin** — mengelola user/role terbatas
- **Viewer** — akses baca dashboard/logs

---

## 7. User Roles

RBAC Foundation (diimplementasikan):
- **Super Admin** — akses penuh (Full Access guard + permission)
- **Admin** — Web Access + Read Write
- **User / Viewer** — API Only + Read Only
- Role lain dapat dibuat via UI Role Management.

---

## 8. Core Concepts

- **User** — akun (firstName, lastName, username, email, password hash, roles M:N)
- **Role** — kumpulan guard + permission (roleName unique)
- **Permission** — aturan `methods[] + urls[]` (wildcard `*`, `/*`, `/api/users/*`) — dievaluasi server-side via `requireApiAccess`
- **Guard** — aturan `allowUrls[] / denyUrls[]` — dievaluasi client-side untuk menu/aksi gating
- **Activity Log** — audit trail (action, entity, userId, level INFO/WARNING/ERROR)
- **Setting** — key-value store (app_name, app_favicon, login_bg_gradient, dll)

---

## 9. Major User Workflows

### 9.1 RBAC Administration (Diimplementasikan)

1. Admin mengelola user, role, permission, guard via DataTable (search/sort/pagination)
2. User login → JWT → otorisasi berbasis role/guard/permission (server `requireApiAccess`, client `canAccessUrl`)
3. Admin melihat Activity Logs dan System Logs, mengubah Settings

---

## 10. Functional Requirements

### 10.1 RBAC Modules (Diimplementasikan)

Lihat detail di §17 (Dashboard, User Management, Role Management, Permission Management, Guard Management, Activity Logs, System Logs, Settings).

---

## 11. Business Rules

1. Semua operasi RBAC wajib melalui permission method+URL check server-side
2. Guard hanya untuk client gating (menu visibility), bukan enforcement server-side
3. Username/email unik, password minimal 8 dengan uppercase+lowercase+angka
4. Role/permission/guard yang masih digunakan tidak dapat dihapus tanpa konfirmasi dan cek referensi
5. Activity log userId nullable (SET NULL saat user dihapus)
6. Settings key unik

---

## 12. Constraints

- Database: SQLite (better-sqlite3) — cocok untuk skala kecil hingga sedang
- `synchronize: true` untuk development; production memakai checked-in baseline migration (`server/migrations/1788914913928-Baseline.ts`) dengan drift detection
- Auth JWT 24 jam, password bcrypt

---

## 13. Important Edge Cases

- Duplicate username/email → 409
- Permission tanpa methods/urls → deny-all (tidak efektif)
- Guard deny dievaluasi sebelum allow untuk menu gating
- Activity log tetap tersimpan bila user dihapus (userId SET NULL)

---

## 14. Product Principles

- Security foundation: RBAC melindungi seluruh operasi platform
- Konsistensi UI: PageShell + DataTable kanonis + 403 tunggal
- Auditability: semua mutasi tercatat di Activity Logs
- Paper-calm: kanvas warm `#f6f5f4`, satu aksen Notion blue, chrome monokrom + hairline (detail: `docs/design-system.md`)

---

## 15. Glossary

- **User**: akun dengan kredensial dan roles
- **Role**: kumpulan permission + guard
- **Permission**: izin method+URL (server enforcement)
- **Guard**: aturan URL allow/deny (client gating)
- **Activity Log**: catatan audit
- **Setting**: konfigurasi key-value

---

## 16. Tujuan Aplikasi (Current)

Admin panel untuk **User Management System** yang menyediakan:

1. **Dashboard** — Ringkasan data user, role, permission, guard
2. **User Management** — CRUD user dengan assignment role
3. **Role Management** — CRUD role dengan assignment guard dan permission
4. **Permission Management** — CRUD permission dengan method dan URL rules
5. **Guard Management** — CRUD guard dengan URL allow/deny rules
6. **Authorization System** — Sistem otorisasi berbasis JWT → User → Role → Permission → Guard

---

## 17. Daftar Fitur

### 17.1 Dashboard

**Halaman utama admin panel** yang menampilkan:

#### Sidebar Menu

```
Dashboard
User Management
    ├── User
    ├── Guard
    ├── Role
    └── Permissions
Sistem
    ├── Activity Logs
    ├── System Logs
    └── Settings
```

| Menu Item | Route | Deskripsi |
|-----------|-------|-----------|
| Dashboard | `/dashboard` | Ringkasan data |
| User Management > User | `/dashboard/users` | Kelola user |
| User Management > Guard | `/dashboard/guards` | Kelola guard |
| User Management > Role | `/dashboard/roles` | Kelola role |
| User Management > Permissions | `/dashboard/permissions` | Kelola permission |
| Sistem > Activity Logs | `/dashboard/activity-logs` | Audit trail |
| Sistem > System Logs | `/dashboard/system-logs` | System logs |
| Sistem > Settings | `/dashboard/settings` | Pengaturan |

#### Widget

| Widget | Deskripsi |
|--------|-----------|
| Total Users | Jumlah user terdaftar |
| Total Roles | Jumlah role yang dibuat |
| Total Permissions | Jumlah permission yang dibuat |
| Total Guards | Jumlah guard yang dibuat |
| Recent Users | 5 user terbaru |

---

### 17.2 User Management

**Halaman kelola user** dengan fitur:

#### Tabel User
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID | Number | Auto-increment |
| First Name | String | 1-100 karakter |
| Last Name | String | 1-100 karakter |
| Email | String | Unique, valid email |
| Username | String | Unique, 3-30 karakter, alphanumeric + underscore |
| Roles | Relation | Multiple select dari daftar role |
| Created At | Date | Timestamp otomatis |
| Updated At | Date | Timestamp otomatis |

#### Form Create/Edit User
- First Name (text input, required)
- Last Name (text input, required)
- Email (email input, required, unique)
- Username (text input, required, unique, 3-30 chars, alphanumeric + underscore)
- Password (password input, required saat create, optional saat edit)
  - Minimal 8 karakter
  - Harus ada uppercase, lowercase, dan angka
- Confirm Password (password input, required saat create)
- Role (multi-select, optional)

#### Aksi
- **Create** — Tambah user baru
- **Edit** — Ubah data user (kecuali password kecuali diisi)
- **Delete** — Hapus user (dengan konfirmasi)
- **View** — Lihat detail user

#### Default Seeder
```
Username: admin
Email: admin@admin.com
Password: P455w0rd!!!
Roles: [Super Admin]
```

---

### 17.3 Role Management

**Halaman kelola role** dengan fitur:

#### Tabel Role
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID | Number | Auto-increment |
| Role Name | String | Unique |
| Description | String | Deskripsi role |
| Guards | Relation | Multiple select dari daftar guard |
| Permissions | Relation | Multiple select dari daftar permission |
| Created At | Date | Timestamp otomatis |
| Updated At | Date | Timestamp otomatis |

#### Form Create/Edit Role
- Role Name (text input, required, unique)
- Description (textarea, optional)
- Guard (multi-select dari daftar guard, optional)
- Permission (multi-select dari daftar permission, optional)

#### Aksi
- **Create** — Tambah role baru
- **Edit** — Ubah data role
- **Delete** — Hapus role (dengan konfirmasi, cek apakah masih digunakan)
- **View** — Lihat detail role beserta guard dan permission

#### Default Seeder
```
1. Super Admin
   - Guard: [Full Access]
   - Permission: [Full Access]

2. Admin
   - Guard: [Web Access]
   - Permission: [Read, Write]

3. User
   - Guard: [Web Access]
   - Permission: [Read]
```

---

### 17.4 Permission Management

**Halaman kelola permission** dengan fitur:

#### Tabel Permission
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID | Number | Auto-increment |
| Permission Name | String | Unique |
| Description | String | Deskripsi permission |
| Allow Methods | Array | GET, POST, PUT, DELETE, PATCH, OPTIONS, atau * |
| Allow URLs | Array | URL patterns (exact atau wildcard) |
| Created At | Date | Timestamp otomatis |
| Updated At | Date | Timestamp otomatis |

#### Form Create/Edit Permission
- Permission Name (text input, required, unique)
- Description (textarea, optional)
- Allow Methods (multi-select, options: GET, POST, PUT, DELETE, PATCH, OPTIONS)
  - Pilihan `*` = izinkan semua method
  - Bisa menambahkan custom method
- Allow URLs (multi-select search berdasarkan list route URL server)
  - Bisa menambahkan manual URL pattern
  - Support wildcard: `/example/*` untuk sub-path
  - Contoh: `/api/users/*`, `/api/auth/*`, `/api/dashboard`

#### Aksi
- **Create** — Tambah permission baru
- **Edit** — Ubah data permission
- **Delete** — Hapus permission (dengan konfirmasi, cek apakah masih digunakan)
- **View** — Lihat detail permission

#### Default Seeder
```
1. Full Access
   - Allow Methods: [*]
   - Allow URLs: [/*]

2. Read Only
   - Allow Methods: [GET, OPTIONS]
   - Allow URLs: [/*]

3. Read Write
   - Allow Methods: [GET, POST, PUT, DELETE, PATCH, OPTIONS]
   - Allow URLs: [/*]
```

---

### 17.5 Guard Management

**Halaman kelola guard** dengan fitur:

#### Tabel Guard
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID | Number | Auto-increment |
| Guard Name | String | Unique |
| Description | String | Deskripsi guard |
| Allow URLs | Array | URL patterns yang diizinkan |
| Deny URLs | Array | URL patterns yang ditolak |
| Created At | Date | Timestamp otomatis |
| Updated At | Date | Timestamp otomatis |

#### Form Create/Edit Guard
- Guard Name (text input, required, unique)
- Description (textarea, optional)
- Allow URLs (multi-select search berdasarkan list route URL server)
  - Bisa menambahkan manual URL pattern
  - Support wildcard: `/example/*`
  - Contoh: `/api/users/*`, `/api/roles/*`
- Deny URLs (multi-select search berdasarkan list route URL server)
  - Bisa menambahkan manual URL pattern
  - Support wildcard: `/example/*`
  - Contoh: `/api/auth/delete-all`

#### Aksi
- **Create** — Tambah guard baru
- **Edit** — Ubah data guard
- **Delete** — Hapus guard (dengan konfirmasi, cek apakah masih digunakan)
- **View** — Lihat detail guard

#### Default Seeder
```
1. Full Access
   - Allow URLs: [/*]
   - Deny URLs: []

2. Web Access
   - Allow URLs: [/api/*]
   - Deny URLs: [/api/admin/*]

3. API Only
   - Allow URLs: [/api/*]
   - Deny URLs: []
```

---

### 17.6 Table Browse Features

> Spesifikasi komponen: `docs/architecture.md` § Table Browse Component, `docs/design-system.md` § Table.

Semua halaman tabel (Users, Roles, Permissions, Guards) menggunakan komponen **DataTable** yang reusable dengan fitur:

#### Column Visibility Toggle
- NDropdown dengan checkbox untuk show/hide kolom
- User dapat memilih kolom mana yang ditampilkan
- Default: semua kolom visible
- State tersimpan di localStorage per halaman

#### Server-Side Sorting
- Klik header kolom untuk sort (ASC → DESC → none)
- Hanya kolom yang ditandai `sortable` yang bisa di-sort
- Sorting dilakukan di server (bukan client-side)
- Default sort: `id DESC`

#### Search Features
- **Global Search**: NInput dengan debounce 300ms, mencari di semua field
- **Field-Specific Search**: NSelect untuk memilih field tertentu (e.g., search only in email)
- **Search Field Options** per entity:

| Entity | Search Fields |
|--------|---------------|
| User | All, First Name, Last Name, Username, Email |
| Role | All, Role Name, Description |
| Permission | All, Permission Name, Description |
| Guard | All, Guard Name, Description |

#### Pagination
- Server-side pagination
- Page size options: 10, 20, 50, 100
- "Showing X-Y of Z" text
- Page change & size change via API params

#### API Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `search` | string | — | Global search text |
| `searchField` | string | — | Search specific field only |
| `sortBy` | string | 'id' | Sort column name |
| `sortOrder` | string | 'DESC' | Sort direction (ASC/DESC) |

#### Response Format

```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## 18. Alur Authorization

> Referensi teknis: `docs/architecture.md` § RBAC System (`requireAuth` / `requireApiAccess`, access control flow).

### Server-Side Enforcement

```
Request masuk
    ↓
JWT Token valid?
    ↓ (Ya)
Ambil User dari Token
    ↓
Ambil Roles User → Permissions (eager-loaded)
    ↓
Untuk setiap Role → Permission:
    ↓
    Method cocok? (allow_methods atau *)
        ↓ (Ya)
    URL cocok? (allow_urls pattern, support wildcard)
        ↓ (Ya)
    → ALLOW
        ↓
Response dikirim
```

### Client-Side Gating (Menu/UX)

Guard allow/deny URL lists dievaluasi client-side (`useAuthorization().canAccessUrl`) untuk:
- Menu visibility (sidebar item ditampilkan/hide)
- Aksi gating (tombol Create/Edit/Delete)

Guard TIDAK dievaluasi server-side — server hanya mengecek permission method+URL.

### Detail Alur

1. **Request** → Client mengirim request dengan header `Authorization: Bearer <token>`
2. **JWT Validation** → Server validasi token JWT
3. **User Lookup** → Ambil data user dari token (sub = user.id)
4. **Role Resolution** → Ambil semua role yang dimiliki user
5. **Permission Check** → Untuk setiap role → permission:
   - Cek apakah HTTP method ada di `allow_methods` (atau `*` wildcard)
   - Cek apakah request URL match dengan `allow_urls` pattern (support wildcard)
   - Jika cocok → ALLOW
6. **Authorization Decision** → Jika tidak ada permission yang match, return 403 Forbidden.
7. **Client-Side** → Guard allow/deny URLs dievaluasi untuk menu visibility dan aksi gating (bukan enforcement server-side).

---

## 19. API Endpoints

> Tabel di bawah adalah ringkasan sudut pandang produk. Referensi teknis (DTO, query params, response format): `docs/architecture.md` § API Endpoints.

### Auth API (Sudah Ada)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user baru | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/profile` | Get profile user | Bearer |
| PATCH | `/api/auth/profile` | Update profile | Bearer |
| PATCH | `/api/auth/password` | Change password | Bearer |

### User Management API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List semua user (paginated) | Bearer + Permission |
| GET | `/api/users/:id` | Detail user | Bearer + Permission |
| POST | `/api/users` | Create user baru | Bearer + Permission |
| PUT | `/api/users/:id` | Update user | Bearer + Permission |
| DELETE | `/api/users/:id` | Hapus user | Bearer + Permission |

### Role Management API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/roles` | List semua role | Bearer + Permission |
| GET | `/api/roles/:id` | Detail role | Bearer + Permission |
| POST | `/api/roles` | Create role baru | Bearer + Permission |
| PUT | `/api/roles/:id` | Update role | Bearer + Permission |
| DELETE | `/api/roles/:id` | Hapus role | Bearer + Permission |

### Permission Management API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/permissions` | List semua permission | Bearer + Permission |
| GET | `/api/permissions/:id` | Detail permission | Bearer + Permission |
| POST | `/api/permissions` | Create permission baru | Bearer + Permission |
| PUT | `/api/permissions/:id` | Update permission | Bearer + Permission |
| DELETE | `/api/permissions/:id` | Hapus permission | Bearer + Permission |

### Guard Management API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/guards` | List semua guard | Bearer + Permission |
| GET | `/api/guards/:id` | Detail guard | Bearer + Permission |
| POST | `/api/guards` | Create guard baru | Bearer + Permission |
| PUT | `/api/guards/:id` | Update guard | Bearer + Permission |
| DELETE | `/api/guards/:id` | Hapus guard | Bearer + Permission |

### Activity Logs API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/activity-logs` | List semua activity logs (paginated, filterable) | Bearer + Permission |
| GET | `/api/activity-logs/stats` | Statistik activity logs | Bearer + Permission |
| GET | `/api/activity-logs/:id` | Detail activity log | Bearer + Permission |

### System Logs API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/system-logs/files` | List semua file log | Bearer + Permission |
| GET | `/api/system-logs/files/:filename` | Baca isi file log | Bearer + Permission |
| GET | `/api/system-logs/stats/:filename` | Statistik file log | Bearer + Permission |

### Settings API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/settings` | Get all settings | Public |
| GET | `/api/settings/:key` | Get setting by key | Public |
| PUT | `/api/settings` | Update multiple settings | Bearer + Permission |
| POST | `/api/settings/upload` | Upload file (favicon, bg) | Bearer + Permission |
| GET | `/api/storage/:subfolder/:filename` | Serve file | Public |
| GET | `/api/health` | Health check | Public |

---

## 20. Client Routes

> Referensi teknis (file routing, middleware, sidebar): `docs/architecture.md` § Routing.

### File-Based Routing (Nuxt Pages)

| File | Route | Auth | Description |
|------|-------|------|-------------|
| `app/pages/login.vue` | `/login` | Guest only | Login form |
| `app/pages/register.vue` | `/register` | Guest only | Registration form |
| `app/pages/dashboard/index.vue` | `/dashboard` | Required | Dashboard utama |
| `app/pages/dashboard/users.vue` | `/dashboard/users` | Required | Manajemen user |
| `app/pages/dashboard/roles.vue` | `/dashboard/roles` | Required | Manajemen role |
| `app/pages/dashboard/permissions.vue` | `/dashboard/permissions` | Required | Manajemen permission |
| `app/pages/dashboard/guards.vue` | `/dashboard/guards` | Required | Manajemen guard |
| `app/pages/dashboard/activity-logs.vue` | `/dashboard/activity-logs` | Required | Activity logs |
| `app/pages/dashboard/system-logs.vue` | `/dashboard/system-logs` | Required | System logs |
| `app/pages/dashboard/settings.vue` | `/dashboard/settings` | Required | Settings |
| `app/pages/dashboard/profile.vue` | `/dashboard/profile` | Required | Profile |

### Sidebar Menu Structure

```
Dashboard                    → /dashboard
User Management (group)
    ├── User                 → /dashboard/users
    ├── Guard                → /dashboard/guards
    ├── Role                 → /dashboard/roles
    └── Permissions          → /dashboard/permissions
Sistem (group)
    ├── Activity Logs        → /dashboard/activity-logs
    ├── System Logs          → /dashboard/system-logs
    └── Settings             → /dashboard/settings
```

---

## 21. Non-Functional Requirements

### Security
- Password di-hash dengan bcrypt (salt rounds: 10)
- JWT token expiry: 24 jam
- Endpoint sensitif memerlukan autentikasi + otorisasi
- Input validation menggunakan Zod/manual validation utilities
- Whitelist DTO properties (tidak ada extra properties)

### Performance
- Database: SQLite (cocok untuk admin panel skala kecil)
- Pagination pada list data (default: 20 item/halaman)

### UX
- Responsive design (mobile-first)
- Warm paper canvas `#f6f5f4` + kartu putih hairline (bukan putih klinis penuh)
- Primary CTA pill Notion blue `#0075de`; input tetap tight 4px
- Loading states pada semua aksi
- Error handling dengan pesan yang jelas
- Konfirmasi sebelum delete
- Form validation real-time
- Access denied alert dengan animasi slide-in dari kanan (CSS Transition)

---

## 22. Seed Data Summary

> Sumber kebenaran: `apps/web/server/services/seeder.service.ts` (idempotent — hanya seed bila belum ada). Detail relasi: `docs/database.md` § Seed Data.

### Users
| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@admin.com | P455w0rd!!! | Super Admin |
| editor | editor@example.com | P455w0rd!!! | Editor |
| viewer | viewer@example.com | P455w0rd!!! | Viewer |
| manager | manager@example.com | P455w0rd!!! | Manager |
| guest | guest@example.com | P455w0rd!!! | Guest |

### Roles
| Role Name | Guards | Permissions |
|-----------|--------|-------------|
| Super Admin | Full Access | Full Access, Activity Logs, System Logs |
| Admin | Web Access | Read Write |
| User | API Only | Read Only |
| Editor | API Only | Read Write, User Management |
| Viewer | Read Only Guard | Read Only, Dashboard Read |
| Manager | Web Access, User Management Guard | Read Write, User Management, Role Management |
| Guest | Dashboard Only | Dashboard Read |

### Guards
| Guard Name | Allow URLs | Deny URLs |
|------------|-----------|-----------|
| Full Access | /* | (none) |
| Web Access | /api/* | /api/admin/* |
| API Only | /api/* | (none) |
| Admin Only | /api/admin/*, /api/users/*, /api/roles/* | (none) |
| Read Only Guard | /api/* | /api/users, /api/roles |
| User Management Guard | /api/users/* | (none) |
| Role Management Guard | /api/roles/* | (none) |
| Dashboard Only | /api/auth/profile | /api/users/*, /api/roles/*, /api/permissions/*, /api/guards/* |

### Permissions
| Permission Name | Allow Methods | Allow URLs |
|-----------------|--------------|-----------|
| Full Access | * | /* |
| Read Only | GET, OPTIONS | /* |
| Read Write | GET, POST, PUT, DELETE, PATCH, OPTIONS | /* |
| User Management | GET, POST, PUT, DELETE | /api/users/* |
| Role Management | GET, POST, PUT, DELETE | /api/roles/* |
| Guard Management | GET, POST, PUT, DELETE | /api/guards/* |
| Permission Management | GET, POST, PUT, DELETE | /api/permissions/* |
| Dashboard Read | GET | /api/auth/profile |
| Activity Logs | GET | /api/activity-logs/* |
| System Logs | GET | /api/system-logs/* |

---

## 23. Client-Side Authorization

> Referensi teknis: `docs/architecture.md` § RBAC System → Client-Side Authorization.

### Access Denied Handling

When server returns 403 Forbidden:

1. **$fetch Interceptor** — Catches 403 response, shows global NAlert
2. **Route Middleware** — Checks user roles/permissions before rendering protected components
3. **Menu Visibility** — Sidebar menu items hidden if user lacks required role/permission

### Authorization Composable

```typescript
// app/composables/useAuthorization.ts
export function useAuthorization() {
  const authStore = useAuthStore()
  
  function hasRole(roleName: string): boolean
  function hasAnyRole(roles: string[]): boolean
  function hasPermission(permissionName: string): boolean
  function hasAnyPermission(perms: string[]): boolean
  function canAccessUrl(url: string, method: string): boolean
  
  return { hasRole, hasAnyRole, hasPermission, hasAnyPermission, canAccessUrl }
}
```

### Menu Visibility Rules

| Menu Item | Required Role | Required Guard URL Match |
|-----------|---------------|--------------------------|
| Dashboard | Any authenticated | — |
| User Management | Admin, Super Admin | /api/users/* |
| Role Management | Admin, Super Admin | /api/roles/* |
| Permission Management | Admin, Super Admin | /api/permissions/* |
| Guard Management | Admin, Super Admin | /api/guards/* |

---

## Change Log

### Docs Tidy — Adopsi Notion Design (2026-09-13)

- §14 + §21 UX: prinsip paper-calm (warm canvas, satu aksen `#0075de`, CTA pill). Detail token: `docs/design-system.md`.

### Docs Tidy — Penomoran & Penyelarasan (2026-09-13)

- Penomoran tunggal 1–23 (sebelumnya 1–15 + A–H + H1 "Bagian II" di tengah dokumen). §16 Tujuan Aplikasi, §17 Daftar Fitur (17.1–17.6), §18 Alur Authorization, §19 API Endpoints, §20 Client Routes, §21 Non-Functional Requirements, §22 Seed Data Summary, §23 Client-Side Authorization.
- §22 Seed Data Summary diselaraskan dengan `apps/web/server/services/seeder.service.ts`: + user `guest`, + role `User`/`Guest`, + guard `Read Only Guard`/`User Management Guard`/`Role Management Guard`/`Dashboard Only`, + permission `Dashboard Read`, mapping role→guard/permission per seeder.
- Cross-reference dua arah PRD ↔ `docs/architecture.md` (§17.6, §18, §19, §20, §22, §23) agar ringkasan produk vs detail teknis tidak drift.

### Task 01 — Platform Scope Reduction (2026-09-12)

- Removed Dynamic Administration scope: Global Table, Component, Template, Administration, Document, Expression Engine, Rendering Engine, Generated Menu.
- Deleted `docs/dynamic-administration/*`, `docs/audit`, `docs/mockups`, `docs/prototypes`, `docs/wireframes`.
- PRD now RBAC-Only (login, register, dashboard, user management, activity logs, system logs, settings). Previous dynamic sections archived in git history pre-Task 01.

