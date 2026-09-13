# Database Structure

## Overview

- **Database Engine**: SQLite (via `better-sqlite3`)
- **ORM**: TypeORM 1.1 (`EntitySchema` pattern; 9 entity files defining 9 EntitySchemas / 12 physical tables including 3 M:N junctions) — RBAC-Only after Task 01
- **Database File**: `apps/web/db.sqlite`
- **Migrations**: `synchronize: true` in development (default; override with `DB_SYNCHRONIZE` env var, `false` in production). Production boots apply the checked-in baseline `server/migrations/1788914913928-Baseline.ts` (RBAC subset after Task 01: 9 schemas) automatically (`migrationsRun` in `getDataSource()`); drift refuses boot with `MIGRATION_DRIFT` (real check in `server/utils/migration-status.ts`). CLI-loadable config: `server/utils/orm-data-source.ts`. Workflow: `npm run migration:generate -- <Name>` / `migration:run` / `migration:revert` (see `docs/production-runbook.md` §1). BR-001: never edit an applied migration.
- **Startup gating**: Dev boots with `synchronize:true` suppress `JWT_SECRET_DEFAULT` and `MIGRATION_DRIFT` warnings (Task 24); prod fatals unchanged.

---

## Current vs Planned

Dokumen ini membedakan dua kondisi (RBAC-Only after Task 01):

- **CURRENT DATABASE** — 9 schemas / 12 tabel fisik: RBAC foundation (`users`, `roles`, `permissions`, `guards`, `guard_urls`, `permission_methods`, `permission_urls`, `activity_logs`, `settings` + junctions `users_roles`, `roles_guards`, `roles_permissions`).
- **PLANNED DATABASE** — no new tables; future schema changes ship as new (additive) migration files after the Task 23 baseline. Dynamic Administration tables dihapus Task 01 — lihat Change Log.

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │   users_roles    │       │    roles     │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ user_id (FK)     │    ┌──│ id (PK)      │
│ firstName    │  └───>│ role_id (FK)     │<───┘  │ roleName     │
│ lastName     │       └──────────────────┘       │ description  │
│ username     │                                  │ createdAt    │
│ email        │       ┌──────────────────┐       │ updatedAt    │
│ password     │       │  roles_guards    │       └──────────────┘
│ createdAt    │       ├──────────────────┤            │    │
│ updatedAt    │       │ role_id (FK)     │       ┌────┘    └────┐
└──────────────┘       │ guard_id (FK)    │       │              │
                       └──────────────────┘       │              │
                              │    │              │              │
┌──────────────┐              │    │         ┌────┴────┐   ┌────┴────────┐
│   guards     │<─────────────┘    └────────>│guards_  │   │roles_       │
├──────────────┤                             │urls     │   │permissions  │
│ id (PK)      │       ┌──────────────────┐  ├─────────┤   ├─────────────┤
│ guardName    │       │ guard_urls       │  │guard_id │   │role_id (FK) │
│ description  │       ├──────────────────┤  │(FK)     │   │permission_id│
│ createdAt    │       │ id (PK)          │  │url      │   │(FK)         │
│ updatedAt    │       │ guard_id (FK)    │  │type     │   └─────────────┘
└──────────────┘       │ url              │  └─────────┘        │    │
                       │ type (allow/deny)│                      │    │
                       │ createdAt        │                      │    │
                       └──────────────────┘               ┌──────┘    └──────┐
                                                          │                 │
┌──────────────┐       ┌──────────────────┐          ┌────┴─────┐    ┌──────┴────────┐
│ permissions  │       │permission_methods│          │permission│    │               │
├──────────────┤       ├──────────────────┤          │_methods  │    │permission_urls│
│ id (PK)      │──┐    │ id (PK)          │          ├──────────┤    ├───────────────┤
│ permissionNam│  └───>│ permission_id    │          │id (PK)   │    │id (PK)        │
│ description  │       │ method           │          │perm_id   │    │permission_id  │
│ createdAt    │       │ createdAt        │          │(FK)      │    │(FK)           │
│ updatedAt    │       └──────────────────┘          │method    │    │url            │
└──────────────┘                                    │createdAt │    │createdAt      │
                                                    └──────────┘    └───────────────┘
```

---

## Entity Details

### 1. users

Tabel utama untuk data user.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik user |
| `firstName` | VARCHAR(100) | NOT NULL | Nama depan |
| `lastName` | VARCHAR(100) | NOT NULL | Nama belakang |
| `username` | VARCHAR(30) | NOT NULL, UNIQUE | Username unik |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email unik |
| `password` | VARCHAR(255) | NOT NULL | Password terhash (bcrypt) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update terakhir |

**Indexes**:
- `PRIMARY KEY` on `id`
- `UNIQUE` on `username`
- `UNIQUE` on `email`

---

### 2. roles

Tabel untuk role/level akses.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik role |
| `roleName` | VARCHAR(100) | NOT NULL, UNIQUE | Nama role unik |
| `description` | TEXT | NULLABLE | Deskripsi role |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update terakhir |

**Indexes**:
- `PRIMARY KEY` on `id`
- `UNIQUE` on `roleName`

---

### 3. permissions

Tabel untuk permission/izin akses.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik permission |
| `permissionName` | VARCHAR(100) | NOT NULL, UNIQUE | Nama permission unik |
| `description` | TEXT | NULLABLE | Deskripsi permission |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update terakhir |

**Indexes**:
- `PRIMARY KEY` on `id`
- `UNIQUE` on `permissionName`

---

### 4. guards

Tabel untuk guard/pengaman URL.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik guard |
| `guardName` | VARCHAR(100) | NOT NULL, UNIQUE | Nama guard unik |
| `description` | TEXT | NULLABLE | Deskripsi guard |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update terakhir |

**Indexes**:
- `PRIMARY KEY` on `id`
- `UNIQUE` on `guardName`

---

### 5. users_roles (Junction Table)

Tabel penghubung antara `users` dan `roles` (many-to-many).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `userId` | INTEGER | FK → users.id, PK | ID user |
| `roleId` | INTEGER | FK → roles.id, PK | ID role |

**Constraints**:
- `PRIMARY KEY (userId, roleId)`
- `FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE`

---

### 6. roles_guards (Junction Table)

Tabel penghubung antara `roles` dan `guards` (many-to-many).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `roleId` | INTEGER | FK → roles.id, PK | ID role |
| `guardId` | INTEGER | FK → guards.id, PK | ID guard |

**Constraints**:
- `PRIMARY KEY (roleId, guardId)`
- `FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE`
- `FOREIGN KEY (guardId) REFERENCES guards(id) ON DELETE CASCADE`

---

### 7. roles_permissions (Junction Table)

Tabel penghubung antara `roles` dan `permissions` (many-to-many).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `roleId` | INTEGER | FK → roles.id, PK | ID role |
| `permissionId` | INTEGER | FK → permissions.id, PK | ID permission |

**Constraints**:
- `PRIMARY KEY (roleId, permissionId)`
- `FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE`
- `FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE`

---

### 8. guard_urls (Junction Table)

Tabel untuk menyimpan URL patterns yang diizinkan/ditolak oleh guard.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `guardId` | INTEGER | FK → guards.id | ID guard |
| `url` | VARCHAR(500) | NOT NULL | URL pattern (contoh: `/api/users/*`) |
| `type` | ENUM('allow', 'deny') | NOT NULL | Tipe URL (allow/deny) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

**Constraints**:
- `FOREIGN KEY (guardId) REFERENCES guards(id) ON DELETE CASCADE`

**Indexes**:
- `PRIMARY KEY` on `id`
- `INDEX` on `guardId`

---

### 9. permission_methods (Junction Table)

Tabel untuk menyimpan HTTP methods yang diizinkan oleh permission.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `permissionId` | INTEGER | FK → permissions.id | ID permission |
| `method` | VARCHAR(10) | NOT NULL | HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, *) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

**Constraints**:
- `FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE`

**Indexes**:
- `PRIMARY KEY` on `id`
- `INDEX` on `permissionId`

---

### 10. permission_urls (Junction Table)

Tabel untuk menyimpan URL patterns yang diizinkan oleh permission.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `permissionId` | INTEGER | FK → permissions.id | ID permission |
| `url` | VARCHAR(500) | NOT NULL | URL pattern (contoh: `/api/users/*`) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

**Constraints**:
- `FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE`

**Indexes**:
- `PRIMARY KEY` on `id`
- `INDEX` on `permissionId`

---

## Seed Data

> Sumber kebenaran: `apps/web/server/services/seeder.service.ts` (idempotent — hanya seed bila belum ada). Ringkasan produk: `docs/PRD.md` §22.

### Users

| id | firstName | lastName | username | email | password (bcrypt) | roles |
|----|-----------|----------|----------|-------|-------------------|-------|
| 1 | Super | Admin | admin | admin@admin.com | `$2b$10$...` (P455w0rd!!!) | Super Admin |
| 2 | John | Editor | editor | editor@example.com | `$2b$10$...` (P455w0rd!!!) | Editor |
| 3 | Jane | Viewer | viewer | viewer@example.com | `$2b$10$...` (P455w0rd!!!) | Viewer |
| 4 | Bob | Manager | manager | manager@example.com | `$2b$10$...` (P455w0rd!!!) | Manager |
| 5 | Alice | Guest | guest | guest@example.com | `$2b$10$...` (P455w0rd!!!) | Guest |

### Roles

| id | roleName | description | guards | permissions |
|----|----------|-------------|--------|-------------|
| 1 | Super Admin | Akses penuh ke semua fitur | Full Access | Full Access, Activity Logs, System Logs |
| 2 | Admin | Akses admin terbatas | Web Access | Read Write |
| 3 | User | Akses dasar untuk user biasa | API Only | Read Only |
| 4 | Editor | Akses edit user dan content | API Only | Read Write, User Management |
| 5 | Viewer | Hanya melihat data | Read Only Guard | Read Only, Dashboard Read |
| 6 | Manager | Akses management user dan role | Web Access, User Management Guard | Read Write, User Management, Role Management |
| 7 | Guest | Akses terbatas hanya dashboard | Dashboard Only | Dashboard Read |

### Guards

| id | guardName | description |
|----|-----------|-------------|
| 1 | Full Access | Izinkan semua URL |
| 2 | Web Access | Hanya akses API, tolak admin routes |
| 3 | API Only | Hanya akses API endpoints |
| 4 | Admin Only | Hanya akses admin dan user management |
| 5 | Read Only Guard | Akses baca saja, tolak user dan role management |
| 6 | User Management Guard | Hanya akses user management |
| 7 | Role Management Guard | Hanya akses role management |
| 8 | Dashboard Only | Hanya akses profile, tolak semua management |

### Permissions

| id | permissionName | description | methods | urls |
|----|----------------|-------------|---------|------|
| 1 | Full Access | Izinkan semua method dan URL | * | /* |
| 2 | Read Only | Hanya izinkan GET dan OPTIONS | GET, OPTIONS | /* |
| 3 | Read Write | Izinkan semua method CRUD | GET, POST, PUT, DELETE, PATCH, OPTIONS | /* |
| 4 | User Management | Izinkan CRUD user | GET, POST, PUT, DELETE | /api/users/* |
| 5 | Role Management | Izinkan CRUD role | GET, POST, PUT, DELETE | /api/roles/* |
| 6 | Guard Management | Izinkan CRUD guard | GET, POST, PUT, DELETE | /api/guards/* |
| 7 | Permission Management | Izinkan CRUD permission | GET, POST, PUT, DELETE | /api/permissions/* |
| 8 | Dashboard Read | Hanya baca profile | GET | /api/auth/profile |
| 9 | Activity Logs | Akses melihat activity logs | GET | /api/activity-logs/* |
| 10 | System Logs | Akses melihat system logs | GET | /api/system-logs/* |

### Junction: users_roles

| userId | roleId |
|--------|--------|
| 1 | 1 |
| 2 | 4 |
| 3 | 5 |
| 4 | 6 |
| 5 | 7 |

### Junction: roles_guards

| roleId | guardId |
|--------|---------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 3 |
| 5 | 5 |
| 6 | 2 |
| 6 | 6 |
| 7 | 8 |

### Junction: roles_permissions

| roleId | permissionId |
|--------|-------------|
| 1 | 1 |
| 1 | 9 |
| 1 | 10 |
| 2 | 3 |
| 3 | 2 |
| 4 | 3 |
| 4 | 4 |
| 5 | 2 |
| 5 | 8 |
| 6 | 3 |
| 6 | 4 |
| 6 | 5 |
| 7 | 8 |

### Junction: guard_urls

| guardId | url | type |
|---------|-----|------|
| 1 | /* | allow |
| 2 | /api/* | allow |
| 2 | /api/admin/* | deny |
| 3 | /api/* | allow |
| 4 | /api/admin/* | allow |
| 4 | /api/users/* | allow |
| 4 | /api/roles/* | allow |
| 5 | /api/* | allow |
| 5 | /api/users | deny |
| 5 | /api/roles | deny |
| 6 | /api/users/* | allow |
| 7 | /api/roles/* | allow |
| 8 | /api/auth/profile | allow |
| 8 | /api/users/* | deny |
| 8 | /api/roles/* | deny |
| 8 | /api/permissions/* | deny |
| 8 | /api/guards/* | deny |

### Junction: permission_methods

| permissionId | method |
|-------------|--------|
| 1 | * |
| 2 | GET |
| 2 | OPTIONS |
| 3 | GET |
| 3 | POST |
| 3 | PUT |
| 3 | DELETE |
| 3 | PATCH |
| 3 | OPTIONS |
| 4 | GET |
| 4 | POST |
| 4 | PUT |
| 4 | DELETE |
| 5 | GET |
| 5 | POST |
| 5 | PUT |
| 5 | DELETE |
| 6 | GET |
| 6 | POST |
| 6 | PUT |
| 6 | DELETE |
| 7 | GET |
| 7 | POST |
| 7 | PUT |
| 7 | DELETE |
| 8 | GET |
| 9 | GET |
| 10 | GET |

### Junction: permission_urls

| permissionId | url |
|-------------|-----|
| 1 | /* |
| 2 | /* |
| 3 | /* |
| 4 | /api/users/* |
| 5 | /api/roles/* |
| 6 | /api/guards/* |
| 7 | /api/permissions/* |
| 8 | /api/auth/profile |
| 9 | /api/activity-logs/* |
| 10 | /api/system-logs/* |

> Note (Task 01): `Designer`/`Operator` and `Data:{table}:Read/Write` tidak ada di seeder — lihat `server/utils/permission-matrix.ts` (RBAC subset) dan `server/services/seeder.service.ts`.

---

## Relationships Summary

```
users ──────< users_roles >────── roles
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    v               v               v
              roles_guards    roles_permissions     │
                    │               │               │
                    v               v               v
                guards         permissions
                    │               │
                    v               v
              guard_urls    permission_methods
                            permission_urls
```

### Cardinality

| Relationship | Type | Description |
|-------------|------|-------------|
| User → Role | Many-to-Many | User bisa punya banyak role |
| Role → Guard | Many-to-Many | Role bisa punya banyak guard |
| Role → Permission | Many-to-Many | Role bisa punya banyak permission |
| Guard → GuardUrl | One-to-Many | Guard punya banyak URL rules |
| Permission → PermissionMethod | One-to-Many | Permission punya banyak method rules |
| Permission → PermissionUrl | One-to-Many | Permission punya banyak URL rules |
| User → ActivityLog | One-to-Many | User bisa punya banyak activity log (nullable) |

---

## Activity Logs Entity

### 11. activity_logs

Tabel untuk mencatat semua aktivitas user (audit trail).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik log |
| `userId` | INTEGER | NULLABLE, FK → users.id ON DELETE SET NULL | ID user yang melakukan aksi |
| `action` | VARCHAR | NOT NULL | Jenis aksi (CREATE, UPDATE, DELETE, LOGIN, LOGOUT) |
| `entity` | VARCHAR | NOT NULL | Entity yang terpengaruh (User, Role, Permission, Guard, Auth) |
| `entityId` | INTEGER | NULLABLE | ID entity yang terpengaruh |
| `description` | TEXT | NULLABLE | Deskripsi aktivitas |
| `metadata` | TEXT | NULLABLE | JSON data tambahan (before/after snapshots) |
| `ipAddress` | VARCHAR | NULLABLE | IP address user |
| `userAgent` | VARCHAR | NULLABLE | User agent browser |
| `level` | VARCHAR(20) | DEFAULT 'INFO' | Level log (INFO, WARNING, ERROR) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pencatatan log |

**Indexes**:
- `PRIMARY KEY` on `id`
- `INDEX` on `userId`
- `INDEX` on `action`
- `INDEX` on `entity`
- `INDEX` on `createdAt`

---

### 12. settings

Tabel untuk menyimpan pengaturan aplikasi (key-value store).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik setting |
| `key` | VARCHAR(100) | NOT NULL, UNIQUE | Key unik setting |
| `value` | TEXT | NOT NULL | Value setting |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update terakhir |

**Indexes**:
- `PRIMARY KEY` on `id`
- `UNIQUE` on `key`

**Seed Data** (sumber kebenaran: `server/services/seeder.service.ts`):

| key | value | description |
|-----|-------|-------------|
| `app_name` | `MyApp` | Nama aplikasi |
| `app_favicon` | `/favicon.svg` | Favicon URL (static file at `public/favicon.svg`, brand-consistent SVG) |
| `login_bg_gradient` | `#0075de,#005bab,#213183` | Gradient Notion blue untuk login background (diadopsi 2026-09-13) |
| `app_description` | `Sistem manajemen bisnis digital` | Deskripsi aplikasi |

---

## Change Log

### Docs Tidy — Adopsi Notion Design (2026-09-13)

- Settings seed `login_bg_gradient` → Notion blue (`#0075de,#005bab,#213183`); sinkron dengan `server/services/seeder.service.ts`.

### Docs Tidy — Seed Data selaras seeder (2026-09-13)

- § Seed Data dilengkapi agar sama dengan `server/services/seeder.service.ts`: 5 users, 7 roles, 8 guards, 10 permissions + junction rows lengkap (`users_roles`, `roles_guards`, `roles_permissions`, `guard_urls`, `permission_methods`, `permission_urls`). Settings seed: + `app_description`, gradient sesuai seeder.

### Task 01 — Platform Scope Reduction (2026-09-12)

- Removed Dynamic Administration tables (14 tabel: `global_tables`, `global_table_columns`, `global_table_rows`, `components`, `component_data_requirements`, `component_versions`, `templates`, `template_versions`, `template_bindings`, `administrations`, `administration_steps`, `administration_versions`, `administration_runs`, `documents`). RBAC-Only kini 9 EntitySchemas / 12 tabel fisik.
- Dokumentasi dynamic diarsipkan di git history pre-Task 01. Perancatatan desain dynamic (JSON-per-row, computed field, versioned, column types) dihapus dari dokumen ini.
