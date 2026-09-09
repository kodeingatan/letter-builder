# Product Requirements Document (PRD)

## 1. Product Overview

**Nama Project**: BMS — Dynamic Administration & Document Composition Platform

**Tujuan**: Membangun platform manajemen administrasi yang metadata-driven. Inti platform adalah konsep **Data → Component → Template → Administration → Document**, di mana non-developer dapat mendefinisikan struktur data (Global Table), blok dokumen yang dapat digunakan kembali (Component), blueprint dokumen (Template), dan workflow pengumpulan data (Administration) untuk akhirnya menghasilkan dokumen (PDF/HTML).

**Core Concept** (dokumentasi asli: `docs/dynamic-administration/`):

> `Data → Component → Template → Administration → Document`

**Current Implementation State**: Aplikasi mengimplementasikan fondasi **User Management System dengan RBAC** (admin panel untuk mengelola user, role, permission, dan guard) **dan** seluruh modul **Dynamic Administration** — Global Table (+ columns, computed fields, relations, generated CRUD), Expression Engine, Component, Template (+ composition editor, data binding), Administration (+ runner), Document, Rendering Engine, Generated Menu, serta Dynamic RBAC/Audit/Production readiness (tasks 07–22, implemented + verified). Yang belum dikonfigurasi hanya **baseline migrasi produksi** (task 23): development masih memakai `synchronize: true`.

**Tech Stack**:
- Frontend: Nuxt 4 + Vue 3 + TypeScript + Naive UI + Tailwind CSS v4
- Backend: Nitro (Nuxt 4) + TypeORM + SQLite
- Auth: JWT (JSON Web Token)

---

## 2. Product Vision

Menjadi platform pembuat sistem administrasi (persuratan & dokumen) yang dapat dikonfigurasi sepenuhnya melalui metadata, sehingga setiap instansi/departemen dapat mendefinisikan struktur data, formulir, template dokumen, dan workflow mereka sendiri tanpa perlu menulis kode.

---

## 3. Problem Statement

Membuat surat/dokumen administrasi (mis. Surat Keputusan, Surat Tugas) secara konvensional membutuhkan:
- Struktur data yang di-hardcode (`Pegawai`, `Surat Tugas`, dll.)
- Development manual (migration, entity, controller, service) untuk setiap jenis data baru
- Penulisan PDF secara khusus untuk setiap template

Platform ini memecahkan masalah tersebut dengan pendekatan metadata-driven sehingga setiap jenis data dan dokumen baru dapat ditambahkan melalui konfigurasi, bukan kode.

---

## 4. Goals

1. Memungkinkan user membuat struktur data tabel dinamis tanpa development manual (Global Table)
2. Menyediakan CRUD otomatis berdasarkan definisi Global Table
3. Komponen dokumen yang dapat digunakan kembali lintas template (Component)
4. Komposisi dokumen berbasis template dengan rich text + data binding (Template)
5. Workflow pengumpulan data bertahap (Administration + Step)
6. Rendering dokumen generik ke HTML/PDF (Rendering Engine)
7. Menu yang dihasilkan otomatis dari metadata (Generated Menu)
8. Menjaga keamanan akses berbasis RBAC sebagai fondasi platform

---

## 5. Non-Goals

- Bukan editor layout dokumen tingkat print-ready (mis. seperti Adobe) dalam versi awal
- Bukan database migration visual berfitur penuh pada versi awal
- Bukan sistem approval/workflow multi-role yang kompleks pada versi awal
- Fitur Expression Engine lanjutan (IF, SUM, DATE_FORMAT, dll) bersifat pengembangan bertahap

---

## 6. Target Users

- **Admin Platform** — mendefinisikan Global Table, Component, Template, Administration
- **Staff/Operator** — menjalankan Administration (mengisi data, menghasilkan dokumen)
- **Administrator Sistem** — mengelola user, role, permission, guard (RBAC)

---

## 7. User Roles

RBAC Foundation (sudah diimplementasikan): Super Admin, Admin, User, dsb. — dikelola via modul User/Role/Permission/Guard.

Dynamic Administration roles (sudah diimplementasikan & di-seed):
- **Designer** — membuat/mengedit Global Table, Component, Template, Administration metadata
- **Operator** — menjalankan Administration untuk menghasilkan dokumen

---

## 8. Core Concepts

### 8.1 Core Concept Utama

```text
GLOBAL TABLE (data) → COMPONENT (konten reusable) → TEMPLATE (blueprint dokumen) → ADMINISTRATION (workflow) → DOCUMENT (output PDF/HTML)
```

1. **Global Table** — Metadata yang mendefinisikan struktur data dinamis (nama, display name, columns). Setiap Global Table otomatis menghasilkan CRUD, form, dan UI browse.
2. **Component** — Potongan dokumen reusable (Kop Surat, Identitas Pegawai, Tanda Tangan) yang mendeklarasikan "data requirement" (contract) sebagai sumber datanya.
3. **Template** — Blueprint dokumen yang menyusun static content + components + data binding + conditions + looping.
4. **Administration** — Proses/workflow pengumpulan data bertahap (Step) untuk menghasilkan dokumen. Satu Administration bisa memakai banyak Template.
5. **Document** — Hasil akhir: snapshot data + versi template + output ter-render (PDF/HTML).

### 8.2 Prinsip Arsitektur

- **Metadata-driven** — data & UI didefinisikan lewat metadata, bukan hard-code
- **Component-driven** — bagian dokumen reusable dijadikan component
- **Template-driven** — template hanya menentukan struktur dokumen
- **Data-driven** — data dari Global Table, Administration, manual input, system data
- **Schema-driven** — form dibuat dari schema column definition
- **Renderer-driven** — satu generic renderer untuk semua template
- **Versioned** — template & component punya versi; dokumen lama tetap pakai versi saat dibuat

---

## 9. Major User Workflows

### 9.1 RBAC Administration (Sudah Diimplementasikan)

1. Admin mengelola user, role, permission, guard
2. User login → JWT → otorisasi berbasis role/guard/permission

### 9.2 Dynamic Administration (Sudah Diimplementasikan)

1. **Designer** mendefinisikan Global Table (columns, types, relations, computed fields)
2. Sistem menghasilkan CRUD + menu otomatis
3. **Designer** membuat Component dengan data requirement
4. **Designer** membuat Template (rich text + binding + loop + condition)
5. **Designer** membuat Administration dengan Step-step
6. **Operator** menjalankan Administration → isi data per step → pilih template
7. Sistem resolve data → component → binding → loop → condition → render dokumen → PDF

---

## 10. Functional Requirements

### 10.1 RBAC Modules (Sudah Diimplementasikan)

Lihat detail di bawah (Dashboard, User Management, Role Management, Permission Management, Guard Management, Activity Logs, System Logs, Settings).

### 10.2 Dynamic Administration Modules (Sudah Diimplementasikan)

| Modul | Deskripsi |
|-------|-----------|
| Global Table Management | Definisikan tabel dinamis: name, display name, columns (name, type, default, required, searchable, orderable, computed) |
| Component Management | Definisikan reusable document block + data requirement |
| Template Management | Komposisi dokumen: rich text, insert component, data binding, loop, condition, versioning |
| Administration Management | Definisikan workflow: step-step, template per step, field data per step, multi-template |
| Document Management | Snapshot data + versi template + output ter-render; tampilkan/download PDF & HTML |
| Expression Engine | Evaluasi ekspresi: arithmetic, string concat, nanti IF/SUM/ROUND/DATE_FORMAT |
| Rendering Engine | Resolve tree (binding/loop/condition) → HTML DOM → PDF |

---

## 11. Business Rules

1. Global Table adalah sumber data yang dapat dikonsumsi oleh Component/Template
2. Component TIDAK memiliki data final — ia mendeklarasikan data requirement yang disuplai oleh Template
3. Template menentukan binding untuk setiap data requirement component
4. Satu Administration dapat memiliki banyak Template (satu per step)
5. Dokumen menyimpan data snapshot + versi template agar output lama tetap valid
6. Menu merupakan projection dari metadata, bukan hard-coded
7. Sumber data binding: Administration Data, Global Table, Manual Input, Expression, System Data
8. Semua operasi metadata wajib diziarahkan melalui RBAC (keamanan platform)
9. Unifikasi data reference & expression melalui satu "bahasa data" (`{{data.*}}`) untuk seluruh sistem

---

## 12. Constraints

- Database: SQLite (better-sqlite3) — cocok untuk skala kecil hingga sedang
- Metadata-driven: menyiratkan kebutuhan schema fleksibel untuk data Global Table
- `synchronize: true` untuk development; migrasi produksi belum dikonfigurasi
- Ekspresi dievaluasi server-side (keamanan)

---

## 13. Important Edge Cases

- Global Table dengan relasi antar tabel (select-table-relation)
- Computed field yang bergantung pada field lain (dependencies) — nilai dihitung ulang saat dependency berubah
- Looping component terhadap collection data (daftar pegawai)
- Conditional rendering bagian dokumen berdasarkan data
- Dokumen lama vs versi template baru — dokumen memakai versi saat dibuat
- Multi-template dalam satu Administration

---

## 14. Product Principles

- Metadata-first: konfigurasi diutamakan daripada kode untuk struktur data & dokumen
- Reusability: semua bagian dokumen reusable menjadi component
- Consistent data language: satu bahasa data & ekspresi di seluruh modul
- Security foundation: RBAC melindungi seluruh operasi platform

---

## 15. Glossary

- **Global Table**: definisi data dinamis yang menghasilkan CRUD
- **Column Type**: menentukan behavior simpan/input/tampil/validasi/format/cari/urut
- **Computed Field**: field hasil kalkulasi (hidden atau readonly) via expression
- **Component**: blok dokumen reusable dengan data requirement
- **Data Requirement**: contract antara component dan template (field apa yang dibutuhkan)
- **Template**: blueprint dokumen (struktur, binding, loop, condition)
- **Administration**: workflow pengumpulan data (step-step)
- **Step**: satu tahap pengumpulan data dalam administration
- **Document**: output akhir (data snapshot + template version + rendered output)
- **Expression Engine**: engine evaluasi ekspresi
- **Rendering Engine**: engine resolve tree → HTML → PDF
- **Generated Menu**: menu yang dihasilkan dari metadata

---

---

# Bagian II — Current Implementation Detail (RBAC Foundation)

> Berikut adalah detail spesifikasi tahap saat ini yang sudah diimplementasikan. Bagian ini merupakan dokumentasi **current state** RBAC foundation, di atasnya akan dibangun modul Dynamic Administration (Bagian I).

## A. Tujuan Aplikasi (Current)

Admin panel untuk **User Management System** yang menyediakan:

1. **Dashboard** — Ringkasan data user, role, permission, guard
2. **User Management** — CRUD user dengan assignment role
3. **Role Management** — CRUD role dengan assignment guard dan permission
4. **Permission Management** — CRUD permission dengan method dan URL rules
5. **Guard Management** — CRUD guard dengan URL allow/deny rules
6. **Authorization System** — Sistem otorisasi berbasis JWT → User → Role → Permission → Guard

---

## B. Daftar Fitur

### B.1 Dashboard

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

### B.2 User Management

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

### B.3 Role Management

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

### B.4 Permission Management

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

### B.5 Guard Management

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

### B.6 Table Browse Features

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

## C. Alur Authorization

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

## D. API Endpoints (Existing + Planned)

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

## E. Client Routes

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

## F. Non-Functional Requirements

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

## G. Seed Data Summary

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

## H. Client-Side Authorization

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
