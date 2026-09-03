# Product Requirements Document (PRD)

## 1. Overview

**Nama Project**: Component Stories — Admin Panel User Management System

**Tujuan**: Membangun admin panel untuk manajemen user dengan sistem role-based access control (RBAC) yang memungkinkan admin mengelola user, role, permission, dan guard secara terpusat.

**Tech Stack**:
- Frontend: Nuxt 4 + Vue 3 + TypeScript + Naive UI + Tailwind CSS v4
- Backend: Nitro (Nuxt 4) + TypeORM + SQLite
- Auth: JWT (JSON Web Token)

---

## 2. Tujuan Aplikasi

Admin panel untuk **User Management System** yang menyediakan:

1. **Dashboard** — Ringkasan data user, role, permission, guard
2. **User Management** — CRUD user dengan assignment role
3. **Role Management** — CRUD role dengan assignment guard dan permission
4. **Permission Management** — CRUD permission dengan method dan URL rules
5. **Guard Management** — CRUD guard dengan URL allow/deny rules
6. **Authorization System** — Sistem otorisasi berbasis JWT → User → Role → Permission → Guard

---

## 3. Daftar Fitur

### 3.1 Dashboard

**Halaman utama admin panel** yang menampilkan:

#### Sidebar Menu

```
Dashboard
User Management
    ├── User
    ├── Guard
    ├── Role
    └── Permissions
```

| Menu Item | Route | Deskripsi |
|-----------|-------|-----------|
| Dashboard | `/dashboard` | Ringkasan data |
| User Management > User | `/dashboard/users` | Kelola user |
| User Management > Guard | `/dashboard/guards` | Kelola guard |
| User Management > Role | `/dashboard/roles` | Kelola role |
| User Management > Permissions | `/dashboard/permissions` | Kelola permission |

#### Widget

| Widget | Deskripsi |
|--------|-----------|
| Total Users | Jumlah user terdaftar |
| Total Roles | Jumlah role yang dibuat |
| Total Permissions | Jumlah permission yang dibuat |
| Total Guards | Jumlah guard yang dibuat |
| Recent Users | 5 user terbaru |

---

### 3.2 User Management

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

### 3.3 Role Management

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

### 3.4 Permission Management

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

### 3.5 Guard Management

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

### 3.6 Table Browse Features

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

## 4. Alur Authorization

```
Request masuk
    ↓
JWT Token valid?
    ↓ (Ya)
Ambil User dari Token
    ↓
Ambil Roles User
    ↓
Untuk setiap Role:
    ↓
    Ambil Guards & Permissions
    ↓
    Method cocok? (dari Permission)
        ↓ (Ya)
    URL cocok? (dari Guard Allow URLs)
        ↓ (Ya)
    URL tidak di-deny? (dari Guard Deny URLs)
        ↓ (Ya)
    → ALLOW
        ↓
Response dikirim
```

### Detail Alur

1. **Request** → Client mengirim request dengan header `Authorization: Bearer <token>`
2. **JWT Validation** → Server validasi token JWT
3. **User Lookup** → Ambil data user dari token (sub = user.id)
4. **Role Resolution** → Ambil semua role yang dimiliki user
5. **Permission Check** → Untuk setiap role, ambil permission-nya:
   - Cek apakah HTTP method ada di `allow_methods`
   - Cek apakah request URL match dengan `allow_urls` (support wildcard)
6. **Guard Check** → Untuk setiap role, ambil guard-nya:
   - Cek apakah request URL match dengan `allow_urls`
   - Cek apakah request URL tidak match dengan `deny_urls`
7. **Authorization Decision** → Jika semua check pass, izinkan akses. Jika tidak, return 403 Forbidden.

---

## 5. API Endpoints (Existing + Planned)

### Auth API (Sudah Ada)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user baru | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/profile` | Get profile user | Bearer |

### User Management API (Planned)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List semua user (paginated) | Bearer + Permission |
| GET | `/api/users/:id` | Detail user | Bearer + Permission |
| POST | `/api/users` | Create user baru | Bearer + Permission |
| PUT | `/api/users/:id` | Update user | Bearer + Permission |
| DELETE | `/api/users/:id` | Hapus user | Bearer + Permission |

### Role Management API (Planned)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/roles` | List semua role | Bearer + Permission |
| GET | `/api/roles/:id` | Detail role | Bearer + Permission |
| POST | `/api/roles` | Create role baru | Bearer + Permission |
| PUT | `/api/roles/:id` | Update role | Bearer + Permission |
| DELETE | `/api/roles/:id` | Hapus role | Bearer + Permission |

### Permission Management API (Planned)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/permissions` | List semua permission | Bearer + Permission |
| GET | `/api/permissions/:id` | Detail permission | Bearer + Permission |
| POST | `/api/permissions` | Create permission baru | Bearer + Permission |
| PUT | `/api/permissions/:id` | Update permission | Bearer + Permission |
| DELETE | `/api/permissions/:id` | Hapus permission | Bearer + Permission |

### Guard Management API (Planned)

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

---

## 6. Client Routes

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
    └── System Logs          → /dashboard/system-logs
```

---

## 7. Non-Functional Requirements

### Security
- Password di-hash dengan bcrypt (salt rounds: 10)
- JWT token expiry: 24 jam
- Endpoint sensitif memerlukan autentikasi + otorisasi
- Input validation menggunakan manual validation utilities
- Whitelist DTO properties (tidak ada extra properties)

### Performance
- Database: SQLite (cocok untuk admin panel skala kecil)
- Pagination pada list data (default: 20 item/halaman)

### UX
- Responsive design (mobile-first)
- Loading states pada semua aksi
- Error handling dengan pesan yang jelas
- Konfirmasi sebelum delete
- Form validation real-time
- Access denied alert dengan animasi slide-in dari kanan (CSS Transition)

---

## 8. Seed Data Summary

### Users
| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@admin.com | P455w0rd!!! | Super Admin |
| editor | editor@example.com | P455w0rd!!! | Editor |
| viewer | viewer@example.com | P455w0rd!!! | Viewer |
| manager | manager@example.com | P455w0rd!!! | Manager |

### Roles
| Role Name | Guards | Permissions |
|-----------|--------|-------------|
| Super Admin | Full Access | Full Access |
| Admin | Web Access | Read Write |
| Editor | API Only | Read Write |
| Viewer | API Only | Read Only |
| Manager | Web Access | Read Write |

### Guards
| Guard Name | Allow URLs | Deny URLs |
|------------|-----------|-----------|
| Full Access | /* | (none) |
| Web Access | /api/* | /api/admin/* |
| API Only | /api/* | (none) |
| Admin Only | /api/admin/* | (none) |
| Read Only | /api/* | /api/users, /api/roles |

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
| Activity Logs | GET | /api/activity-logs/* |
| System Logs | GET | /api/system-logs/* |

---

## 9. Client-Side Authorization

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
