# Database Structure

## Overview

- **Database Engine**: SQLite (via `better-sqlite3`)
- **ORM**: TypeORM
- **Database File**: `server/db.sqlite`
- **Migrations**: Auto-sync via `synchronize: true` (development)

---

## Current vs Planned

Dokumen ini membedakan dua kondisi:

- **CURRENT DATABASE** — tabel yang benar-benar ada di kode (RBAC foundation): `users`, `roles`, `permissions`, `guards`, `guard_urls`, `permission_methods`, `permission_urls`, `activity_logs`, `settings`.
- **PLANNED DATABASE** — entitas yang dirancang untuk modul Dynamic Administration (Global Table, Component, Template, Administration, Document, Expression Engine). Belum diimplementasikan; merupakan desain target `docs/dynamic-administration/`.

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

---

# PLANNED DATABASE — Dynamic Administration

> Belum diimplementasikan. Desain target berdasarkan `docs/dynamic-administration/`. Tabel-tabel berikut akan menambah/menyempurnakan schema saat modul Dynamic Administration dibangun.

## 1. global_tables

Metadata definisi struktur data dinamis.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `name` | VARCHAR | NOT NULL, UNIQUE | Nama teknis tabel (e.g. `pegawai`) |
| `displayName` | VARCHAR | NOT NULL | Nama tampilan (e.g. `Pegawai`) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update |

## 2. global_table_columns

Definisi kolom Global Table (schema-driven).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `globalTableId` | INTEGER | FK → global_tables.id | Global Table pemilik |
| `name` | VARCHAR | NOT NULL | Nama teknis kolom |
| `displayName` | VARCHAR | NOT NULL | Nama tampilan kolom |
| `type` | VARCHAR | NOT NULL | Column type: text, richtext, date, select, number, currency, select-table-relation, hidden-operation-text, readonly-operation-text, image, dll. |
| `defaultValue` | TEXT | NULLABLE | Nilai default |
| `required` | BOOLEAN | DEFAULT 0 | Apakah wajib |
| `searchable` | BOOLEAN | DEFAULT 0 | Apakah dapat dicari |
| `orderable` | BOOLEAN | DEFAULT 0 | Apakah dapat diurutkan |
| `options` | TEXT | NULLABLE | JSON options untuk type select |
| `format` | VARCHAR | NULLABLE | Format display (e.g. `m-d-Y` untuk date) |
| `expression` | TEXT | NULLABLE | Ekspresi untuk computed field |
| `relationTableId` | INTEGER | NULLABLE, FK → global_tables.id | Target relasi (select-table-relation) |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update |

## 3. components

Blok dokumen reusable dengan data requirement.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `name` | VARCHAR | NOT NULL, UNIQUE | Nama component |
| `content` | TEXT | NULLABLE | Konten component |
| `looping` | BOOLEAN | DEFAULT 0 | Mode single vs collection |
| `preview` | TEXT | NULLABLE | Preview component |
| `version` | INTEGER | DEFAULT 1 | Versi component |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update |

## 4. component_data_requirements

Contract data yang dibutuhkan component.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `componentId` | INTEGER | FK → components.id | Component pemilik |
| `name` | VARCHAR | NOT NULL | Nama field (e.g. `nama`, `nip`) |
| `type` | VARCHAR | NOT NULL | Tipe data field (text, date, image, dll.) |

## 5. templates

Blueprint dokumen (versi, struktur).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `name` | VARCHAR | NOT NULL | Nama template |
| `content` | TEXT | NULLABLE | Rich text content template |
| `version` | INTEGER | DEFAULT 1 | Versi template |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update |

## 6. template_bindings

Data binding untuk data requirement component dalam template.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `templateId` | INTEGER | FK → templates.id | Template pemilik |
| `componentId` | INTEGER | FK → components.id | Component target |
| `requirementName` | VARCHAR | NOT NULL | Field requirement yang di-bind |
| `source` | VARCHAR | NOT NULL | Sumber data: administration, global_table, manual, expression, system |
| `sourceRef` | VARCHAR | NULLABLE | Reference (e.g. `data.pegawai.nip`) |
| `expression` | TEXT | NULLABLE | Ekspresi jika source=expression |

## 7. administrations

Workflow pengumpulan data.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `name` | VARCHAR | NOT NULL | Nama administration |
| `description` | TEXT | NULLABLE | Deskripsi |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |
| `updatedAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu update |

## 8. administration_steps

Tahap pengumpulan data; setiap step dapat memakai template.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `administrationId` | INTEGER | FK → administrations.id | Administration pemilik |
| `order` | INTEGER | NOT NULL | Urutan step |
| `name` | VARCHAR | NOT NULL | Nama step |
| `templateId` | INTEGER | NULLABLE, FK → templates.id | Template pada step ini |

## 9. documents

Hasil akhir: snapshot data + versi template + output ter-render.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID unik |
| `administrationId` | INTEGER | FK → administrations.id | Administration sumber |
| `templateVersion` | INTEGER | NOT NULL | Versi template saat dibuat |
| `dataSnapshot` | TEXT | NULLABLE | JSON snapshot data |
| `outputHtml` | TEXT | NULLABLE | Output ter-render (HTML) |
| `outputFilePath` | VARCHAR | NULLABLE | Path file PDF/HTML yang dihasilkan |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan |

## Relationships (Planned)

```
global_tables ─< global_table_columns
components ─< component_data_requirements
templates ─< template_bindings >── components (via componentId)
administrations ─< administration_steps >── templates (via templateId)
administrations ─< documents
```

| Relationship | Type | Description |
|-------------|------|-------------|
| Global Table → Column | One-to-Many | Satu tabel punya banyak definisi kolom |
| Component → Data Requirement | One-to-Many | Satu component punya banyak kebutuhan data |
| Template → Template Binding | One-to-Many | Satu template punya banyak binding |
| Template Binding → Component | Many-to-One | Binding menunjuk ke component |
| Administration → Step | One-to-Many | Satu administration punya banyak step |
| Step → Template | Many-to-One | Step memakai satu template |
| Administration → Document | One-to-Many | Satu administration menghasilkan banyak dokumen |

## Perancatatan Desain

- **Data Global Table** — Karena SQLite + TypeORM dan struktur dinamis, data baris Global Table akan disimpan secara fleksibel (mis. sebagai JSON atau tabel generik key-value), bukan sebagai tabel fisik per definisi. Detail teknis perlu ditentukan saat implementasi.
- **Computed Field** — disimpan sebagai kolom `expression`; nilai hasil dapat disimpan (hidden) atau dihitung saat tampil (readonly).
- **Versioned** — Template & Component menyimpan `version`; Document menyimpan `templateVersion` agar output lama tetap valid.
