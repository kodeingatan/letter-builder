# Database Structure

## Overview

- **Database Engine**: SQLite (via `better-sqlite3`)
- **ORM**: TypeORM
- **Database File**: `server/db.sqlite`
- **Migrations**: Auto-sync via `synchronize: true` (development)

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

### Users

| id | firstName | lastName | username | email | password (bcrypt) |
|----|-----------|----------|----------|-------|-------------------|
| 1 | Super | Admin | admin | admin@admin.com | `$2b$10$...` (P455w0rd!!!) |

### Roles

| id | roleName | description |
|----|----------|-------------|
| 1 | Super Admin | Akses penuh ke semua fitur |
| 2 | Admin | Akses admin terbatas |
| 3 | User | Akses dasar untuk user biasa |

### Guards

| id | guardName | description |
|----|-----------|-------------|
| 1 | Full Access | Izinkan semua URL |
| 2 | Web Access | Hanya akses API, tolak admin routes |
| 3 | API Only | Hanya akses API endpoints |

### Permissions

| id | permissionName | description |
|----|----------------|-------------|
| 1 | Full Access | Izinkan semua method dan URL |
| 2 | Read Only | Hanya izinkan GET dan OPTIONS |
| 3 | Read Write | Izinkan semua method CRUD |

### Junction: users_roles

| userId | roleId |
|--------|--------|
| 1 | 1 |

### Junction: roles_guards

| roleId | guardId |
|--------|---------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |

### Junction: roles_permissions

| roleId | permissionId |
|--------|-------------|
| 1 | 1 |
| 2 | 3 |
| 3 | 2 |

### Junction: guard_urls

| guardId | url | type |
|---------|-----|------|
| 1 | /* | allow |
| 2 | /api/* | allow |
| 2 | /api/admin/* | deny |
| 3 | /api/* | allow |

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

### Junction: permission_urls

| permissionId | url |
|-------------|-----|
| 1 | /* |
| 2 | /* |
| 3 | /* |

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

**Seed Data**:

| key | value | description |
|-----|-------|-------------|
| `app_name` | `MyApp` | Nama aplikasi |
| `app_favicon` | `/favicon.svg` | Favicon URL |
| `login_bg_gradient` | `#1e40af,#3b82f6,#6366f1` | Gradient colors untuk login background |
