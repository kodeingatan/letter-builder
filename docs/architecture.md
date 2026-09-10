# Architecture

## Overview

Single Nuxt 4 package:
- **Frontend**: Nuxt 4 + Vue 3 + TypeScript (file-based routing, auto-imports, SSR/SPA)
- **Backend**: Nitro server routes in `server/api/` (TypeORM + SQLite)

---

## Dynamic Administration Layers (IMPLEMENTED)

> Platform mengimplementasikan fondasi **RBAC** dan seluruh modul Dynamic Administration (Global Table, Component, Template, Administration, Expression Engine, Rendering Engine) — tasks 07–22. Desain layer di bawah ini adalah arsitektur yang berjalan di kode, bukan rencana.

### Layer Stack (Implemented)

```text
┌──────────────────────────────────────────────────────┐
│                    UI GENERATION                       │
│  Generated Menu  •  Schema-driven Forms  •  Browse    │
├──────────────────────────────────────────────────────┤
│                  ADMINISTRATION SYSTEM               │
│  Workflow  •  Steps  •  Data Gathering               │
├──────────────────────────────────────────────────────┤
│                  TEMPLATE SYSTEM                      │
│  RichText  •  Components  •  Binding  •  Loop  • Cond │
│  (Versioned)                                          │
├──────────────────────────────────────────────────────┤
│                  COMPONENT SYSTEM                     │
│  Reusable Blocks  •  Data Requirement (contract)     │
├──────────────────────────────────────────────────────┤
│                 EXPRESSION ENGINE                     │
│  Arithmetic  •  String Concat  •  (IF/SUM/ROUND/dll) │
├──────────────────────────────────────────────────────┤
│                 DATA LAYER (Global Table)             │
│  Definitions  •  Columns  •  Relations  • Computed   │
│  CRUD Generation  •  Data Context                    │
├──────────────────────────────────────────────────────┤
│                   RENDERING ENGINE                    │
│  Resolve Tree (Binding/Loop/Condition) → HTML → PDF  │
└──────────────────────────────────────────────────────┘
```

### Architecture Rules (Enforced)

1. **Metadata-driven** — data & UI didefinisikan lewat metadata, bukan hard-code
2. **Component-driven** — bagian dokumen reusable dijadikan component
3. **Template-driven** — template hanya menentukan struktur dokumen
4. **Data-driven** — data berasal dari Global Table / Administration / manual / system
5. **Schema-driven** — form dibuat dari column/schema definition
6. **Renderer-driven** — satu generic renderer untuk semua template
7. **Versioned** — template & component memiliki versi
8. **Unified data language** — satu bahasa reference & ekspresi (`{{data.*}}`) lintas modul
9. **RBAC sebagai penjaga** — semua operasi metadata & rendering wajib dilindungi otorisasi

### Module Boundaries (Implemented)

| Concern | Responsibility | Example |
|---------|---------------|---------|
| Global Table | Data definition + auto CRUD | `Pegawai` dengan columns |
| Component | Reusable document block | Kop Surat, Identitas Pegawai |
| Template | Document blueprint (structure) | Template Surat Keputusan |
| Administration | Data collection workflow | Surat Keputusan (multi-step) |
| Document | Data snapshot + rendered output | Hasil surat (PDF/HTML) |
| Expression Engine | Expression evaluation | `{{harga}} * {{jumlah}}` |
| Rendering Engine | Resolve tree → HTML → PDF | Generic renderer |

---

## Nuxt 4 Project Structure

```
├── app/                          # Nuxt app directory
│   ├── components/
│   │   ├── base/                 # Base components (Button)
│   │   ├── common/               # Common components (AuthForm, FormField, DataTable)
│   │   │   └── DataTable/        # Reusable table browse component
│   │   └── layout/               # Layout components (AppLayout)
│   │
│   ├── composables/              # Vue composables (useAuth, useApi, useCrudTable)
│   │
│   ├── constants/                # Constants & enums
│   │
│   ├── directives/               # Custom Vue directives
│   │
│   ├── features/                 # Feature-based modules
│   │   ├── auth/                 # Auth feature (login, register)
│   │   ├── dashboard/            # Dashboard feature
│   │   └── users/                # User management feature
│   │       ├── components/       # Feature-specific components
│   │       │   ├── UserTable.vue
│   │       │   ├── UserFormModal.vue
│   │       │   └── UserDetailDrawer.vue
│   │       ├── composables/      # Feature composables
│   │       │   └── useUsers.ts
│   │       └── index.ts          # Barrel exports
│   │
│   ├── layouts/                  # Layout components
│   │
│   ├── pages/                    # File-based routing (Nuxt)
│   │   ├── login.vue             → /login
│   │   ├── register.vue          → /register
│   │   ├── dashboard/
│   │   │   ├── index.vue         → /dashboard
│   │   │   ├── users.vue         → /dashboard/users
│   │   │   ├── roles.vue         → /dashboard/roles
│   │   │   ├── permissions.vue   → /dashboard/permissions
│   │   │   ├── guards.vue        → /dashboard/guards
│   │   │   ├── activity-logs.vue → /dashboard/activity-logs
│   │   │   ├── system-logs.vue   → /dashboard/system-logs
│   │   │   └── settings.vue      → /dashboard/settings
│   │   └── [...slug].vue         # Catch-all (optional)
│   │
│   ├── plugins/                  # Nuxt plugins
│   │
│   ├── middleware/                # Route middleware (auth, guest)
│   │
│   ├── services/                 # API services (client-side)
│   │   ├── api.ts                # $fetch wrapper with interceptors
│   │   ├── users.service.ts      # Users CRUD API
│   │   ├── roles.service.ts      # Roles CRUD API
│   │   ├── permissions.service.ts # Permissions CRUD API
│   │   └── guards.service.ts     # Guards CRUD API
│   │
│   ├── stores/                   # State management (Pinia)
│   │   ├── auth.store.ts         # Auth state (token, user)
│   │   ├── users.store.ts        # Users list & CRUD state
│   │   ├── roles.store.ts        # Roles list & CRUD state
│   │   ├── permissions.store.ts  # Permissions list & CRUD state
│   │   └── guards.store.ts       # Guards list & CRUD state
│   │
│   ├── types/                    # TypeScript types & interfaces
│   │   ├── user.ts               # User, CreateUser, UpdateUser, QueryUser
│   │   ├── role.ts               # Role, CreateRole, UpdateRole, QueryRole
│   │   ├── permission.ts         # Permission, CreatePermission, UpdatePermission
│   │   ├── guard.ts              # Guard, CreateGuard, UpdateGuard
│   │   ├── api.ts                # PaginatedResponse, ApiResponse
│   │   └── index.ts              # Barrel exports
│   │
│   ├── utils/                    # Utility functions
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   │       └── main.css          # Global styles (Tailwind + base)
│   │
│   ├── App.vue
│   └── app.vue                   # Nuxt root (optional, app/ takes precedence)
│
├── server/                       # Nitro server directory
│   ├── api/                      # API routes (file-based)
│   │   ├── auth/
│   │   │   ├── register.post.ts  → POST /api/auth/register
│   │   │   ├── login.post.ts     → POST /api/auth/login
│   │   │   └── profile.get.ts    → GET  /api/auth/profile
│   │   ├── users/
│   │   │   ├── index.get.ts      → GET  /api/users
│   │   │   ├── index.post.ts     → POST /api/users
│   │   │   └── [id]/
│   │   │       ├── index.get.ts  → GET  /api/users/:id
│   │   │       ├── index.put.ts  → PUT  /api/users/:id
│   │   │       └── index.delete.ts → DELETE /api/users/:id
│   │   ├── roles/
│   │   │   ├── index.get.ts      → GET  /api/roles
│   │   │   ├── index.post.ts     → POST /api/roles
│   │   │   └── [id]/
│   │   │       ├── index.get.ts  → GET  /api/roles/:id
│   │   │       ├── index.put.ts  → PUT  /api/roles/:id
│   │   │       └── index.delete.ts → DELETE /api/roles/:id
│   │   ├── permissions/
│   │   │   ├── index.get.ts      → GET  /api/permissions
│   │   │   ├── index.post.ts     → POST /api/permissions
│   │   │   └── [id]/
│   │   │       ├── index.get.ts  → GET  /api/permissions/:id
│   │   │       ├── index.put.ts  → PUT  /api/permissions/:id
│   │   │       └── index.delete.ts → DELETE /api/permissions/:id
│   │   ├── guards/
│   │   │   ├── index.get.ts      → GET  /api/guards
│   │   │   ├── index.post.ts     → POST /api/guards
│   │   │   └── [id]/
│   │   │       ├── index.get.ts  → GET  /api/guards/:id
│   │   │       ├── index.put.ts  → PUT  /api/guards/:id
│   │   │       └── index.delete.ts → DELETE /api/guards/:id
│   │   ├── activity-logs/
│   │   │   ├── index.get.ts      → GET  /api/activity-logs
│   │   │   ├── stats.get.ts      → GET  /api/activity-logs/stats
│   │   │   └── [id].get.ts       → GET  /api/activity-logs/:id
│   │   ├── system-logs/
│   │   │   ├── files.get.ts      → GET  /api/system-logs/files
│   │   │   ├── files/[filename].get.ts → GET  /api/system-logs/files/:filename
│   │   │   └── stats/[filename].get.ts → GET  /api/system-logs/stats/:filename
│   │   ├── settings/
│   │   │   ├── index.get.ts      → GET  /api/settings
│   │   │   ├── index.put.ts      → PUT  /api/settings
│   │   │   └── upload.post.ts    → POST /api/settings/upload
│   │   └── storage/
│   │       └── [subfolder]/[filename].get.ts → GET /api/storage/:subfolder/:filename
│   │
│   ├── utils/                    # Server utilities (TypeORM, auth helpers)
│   │   ├── db.ts                 # TypeORM DataSource / connection
│   │   ├── auth.ts               # JWT sign/verify, password hash
│   │   └── rbac.ts               # RBAC guard logic
│   │
│   ├── middleware/                # Server middleware (CORS, logging)
│   │
│   ├── plugins/                  # Nitro plugins
│   │
│   ├── routes/                   # Custom server routes (if needed)
│   │
│   ├── storage/                  # Uploaded files (gitignored)
│   │   ├── settings/             # Settings uploads (favicon, bg image)
│   │   ├── avatars/              # User avatar uploads
│   │   └── general/              # General file uploads
│   │
│   └── tsconfig.json
│
├── public/                       # Static assets
│
├── stories/                      # Storybook stories (if used)
│
├── .env
├── .env.development
├── .env.production
│
├── nuxt.config.ts                # Nuxt configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## Conventions

### Frontend (Nuxt 4)
- Vue 3 `<script setup>` SFCs with TypeScript
- UI: **Naive UI** (priority) + **Tailwind CSS v4** (utility classes)
- Tailwind CSS v4 without preflight (to avoid Naive UI conflicts)
- Auto-imports: composables, components, utilities auto-imported by Nuxt
- File-based routing: pages in `app/pages/` → routes automatically
- Layouts: `app/layouts/` — wrap pages with `<NuxtLayout>`
- Middleware: `app/middleware/` — route guards for auth/guest
- Plugins: `app/plugins/` — Naive UI setup, auth initialization
- Stores: `app/stores/` (Pinia state management)
- Types: `app/types/` (TypeScript interfaces)
- Services: `app/services/` (API service layer using `$fetch`)
- Composables: `app/composables/` (Vue composables)

### Backend (Nitro Server Routes)
- TypeORM with `better-sqlite3` driver
- Route prefix: `/api` (file structure in `server/api/`)
- Validation: Zod schemas in `server/dto/` (single source of truth, validated in route handlers)
- CORS origin: `http://localhost:3000` (Nuxt dev server)
- RBAC: Middleware-based guards using `defineEventHandler` + `getRouterParams`
- Entity definitions: `server/entities/` (TypeORM `EntitySchema`); DataSource singleton in `server/utils/db.ts`
- Auth: JWT sign/verify in `server/utils/jwt.ts`, password hashing in `server/utils/password.ts`
- Shared types: `shared/types/` (20 files) — canonical type definitions imported by both frontend and server
- Server utils import shared types directly (no re-export) to avoid Nuxt auto-import collisions (Task 24)

---

## Routing

### File-Based Routing (Nuxt Pages)

| File | Route | Auth | Description |
|------|-------|------|-------------|
| `app/pages/login.vue` | `/login` | Guest only | Login form |
| `app/pages/register.vue` | `/register` | Guest only | Registration form |
| `app/pages/dashboard/index.vue` | `/dashboard` | Required | Dashboard with sidebar |
| `app/pages/dashboard/users.vue` | `/dashboard/users` | Required | User management |
| `app/pages/dashboard/roles.vue` | `/dashboard/roles` | Required | Role management |
| `app/pages/dashboard/permissions.vue` | `/dashboard/permissions` | Required | Permission management |
| `app/pages/dashboard/guards.vue` | `/dashboard/guards` | Required | Guard management |
| `app/pages/dashboard/activity-logs.vue` | `/dashboard/activity-logs` | Required | Activity logs viewer |
| `app/pages/dashboard/system-logs.vue` | `/dashboard/system-logs` | Required | System logs viewer |
| `app/pages/dashboard/settings.vue` | `/dashboard/settings` | Required | Application settings |

### Route Middleware

- `auth` — Requires valid JWT token, redirects to `/login` if missing
- `guest` — Redirects to `/dashboard` if already authenticated

### Sidebar Menu (AppLayout)

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

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/profile` | Get profile with roles, permissions, guards | Bearer |
| PATCH | `/api/auth/profile` | Update profile (firstName, lastName, email, username) | Bearer |
| PATCH | `/api/auth/password` | Change password (currentPassword, newPassword, confirmPassword) | Bearer |

**Profile Response** includes full user data with nested relations:
```json
{
  "id": 1,
  "firstName": "Super",
  "lastName": "Admin",
  "username": "admin",
  "email": "admin@admin.com",
  "roles": [
    {
      "id": 1,
      "roleName": "Super Admin",
      "guards": [{ "guardName": "Full Access", "urls": [{ "url": "/*", "type": "allow" }] }],
      "permissions": [{ "permissionName": "Full Access", "methods": [{ "method": "*" }], "urls": [{ "url": "/*" }] }]
    }
  ]
}
```

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List users (paginated) | Bearer |
| GET | `/api/users/:id` | Get user | Bearer |
| POST | `/api/users` | Create user | Bearer |
| PUT | `/api/users/:id` | Update user | Bearer |
| DELETE | `/api/users/:id` | Delete user | Bearer |

**Query Parameters** (GET `/api/users`):
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string) — global search across firstName, lastName, username, email
- `searchField` (string) — search specific field only (e.g., `email`, `username`)
- `sortBy` (string, default: 'id') — sort column (whitelisted: id, firstName, lastName, username, email, createdAt, updatedAt)
- `sortOrder` (string, default: 'DESC') — sort direction: `ASC` or `DESC`

**Response Format**:
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

**Create/Update DTO**:
- `firstName` (string, required for create)
- `lastName` (string, required for create)
- `username` (string, required for create, unique)
- `email` (string, email format, required for create, unique)
- `password` (string, required for create)
- `confirmPassword` (string, must match password)
- `roleIds` (number[], optional) — assign roles to user

### Roles

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/roles` | List roles (paginated) | Bearer |
| GET | `/api/roles/:id` | Get role with guards & permissions | Bearer |
| POST | `/api/roles` | Create role | Bearer |
| PUT | `/api/roles/:id` | Update role | Bearer |
| DELETE | `/api/roles/:id` | Delete role | Bearer |

**Query Parameters** (GET `/api/roles`):
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string) — global search across roleName, description
- `searchField` (string) — search specific field only (e.g., `roleName`)
- `sortBy` (string, default: 'id') — sort column (whitelisted: id, roleName, description, createdAt, updatedAt)
- `sortOrder` (string, default: 'DESC') — sort direction: `ASC` or `DESC`

**Create/Update DTO**:
- `roleName` (string, required for create, unique)
- `description` (string, optional)
- `guardIds` (number[], optional) — assign guards to role
- `permissionIds` (number[], optional) — assign permissions to role

### Permissions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/permissions` | List permissions (paginated) | Bearer |
| GET | `/api/permissions/:id` | Get permission with methods & urls | Bearer |
| POST | `/api/permissions` | Create permission | Bearer |
| PUT | `/api/permissions/:id` | Update permission | Bearer |
| DELETE | `/api/permissions/:id` | Delete permission | Bearer |

**Query Parameters** (GET `/api/permissions`):
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string) — global search across permissionName, description
- `searchField` (string) — search specific field only (e.g., `permissionName`)
- `sortBy` (string, default: 'id') — sort column (whitelisted: id, permissionName, description, createdAt, updatedAt)
- `sortOrder` (string, default: 'DESC') — sort direction: `ASC` or `DESC`

**Create/Update DTO**:
- `permissionName` (string, required for create, unique)
- `description` (string, optional)
- `methods` (string[], optional) — HTTP methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, or * for all
- `urls` (string[], optional) — URL patterns: `/api/users/*`, `/*`, etc.

### Guards

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/guards` | List guards (paginated) | Bearer |
| GET | `/api/guards/:id` | Get guard with URLs | Bearer |
| POST | `/api/guards` | Create guard | Bearer |
| PUT | `/api/guards/:id` | Update guard | Bearer |
| DELETE | `/api/guards/:id` | Delete guard | Bearer |

**Query Parameters** (GET `/api/guards`):
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string) — global search across guardName, description
- `searchField` (string) — search specific field only (e.g., `guardName`)
- `sortBy` (string, default: 'id') — sort column (whitelisted: id, guardName, description, createdAt, updatedAt)
- `sortOrder` (string, default: 'DESC') — sort direction: `ASC` or `DESC`

**Create/Update DTO**:
- `guardName` (string, required for create, unique)
- `description` (string, optional)
- `allowUrls` (string[], optional) — allowed URL patterns
- `denyUrls` (string[], optional) — denied URL patterns

### Activity Logs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/activity-logs` | List activity logs (paginated, filterable) | Bearer |
| GET | `/api/activity-logs/stats` | Get statistics (by action, entity, level) | Bearer |
| GET | `/api/activity-logs/:id` | Get activity log detail | Bearer |

**Query Parameters** (GET `/api/activity-logs`):
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string) — global search across description, user.username, user.firstName, user.lastName
- `action` (string) — filter by action: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
- `entity` (string) — filter by entity: User, Role, Permission, Guard, Auth
- `userId` (number) — filter by user ID
- `level` (string) — filter by level: INFO, WARNING, ERROR
- `startDate` (string, ISO date) — filter from date
- `endDate` (string, ISO date) — filter to date
- `sortBy` (string, default: 'createdAt') — sort column
- `sortOrder` (string, default: 'DESC') — sort direction

**Response Format**:
```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "user": { "id": 1, "firstName": "Super", "lastName": "Admin", "username": "admin" },
      "action": "CREATE",
      "entity": "User",
      "entityId": 5,
      "description": "Created user john",
      "metadata": "{\"username\":\"john\",\"email\":\"john@example.com\"}",
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "level": "INFO",
      "createdAt": "2026-08-15T10:30:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### System Logs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/system-logs/files` | List available log files | Bearer |
| GET | `/api/system-logs/files/:filename` | Read log file content | Bearer |
| GET | `/api/system-logs/stats/:filename` | Get log file statistics | Bearer |

### Settings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/settings` | Get all settings | Public |
| GET | `/api/settings/:key` | Get setting by key | Public |
| PUT | `/api/settings` | Update multiple settings | Bearer + Roles + Permissions |
| POST | `/api/settings/upload` | Upload file (favicon, bg image) | Bearer + Roles + Permissions |

**Upload Response**:
```json
{ "url": "/api/storage/settings/settings-1234567890-123456.png" }
```

### Storage

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/storage/:subfolder/:filename` | Serve uploaded file | Public |

**Subfolder whitelist**: `settings`, `avatars`, `general`

**Response**: Binary file with correct `Content-Type` header

**Note**: Files are stored in `apps/web/storage/{subfolder}/` (`STORAGE_DIR`, see `server/services/storage.service.ts`). The directory is currently NOT gitignored — runtime uploads will show as untracked files; consider adding `storage/` to `apps/web/.gitignore`.

**Query Parameters** (GET `/api/system-logs/files/:filename`):
- `level` (string) — filter by log level: INFO, WARN, ERROR, DEBUG, TRACE
- `search` (string) — search in message and context
- `startDate` (string, ISO date) — filter from timestamp
- `endDate` (string, ISO date) — filter to timestamp
- `limit` (number, default: 100) — max entries to return
- `offset` (number, default: 0) — offset for pagination

**Log File Format** (`.log` files in `server/logs/`):
```
[2026-08-15T10:30:00.000Z] [INFO] [Auth] User logged in: admin
[2026-08-15T10:31:00.000Z] [ERROR] [UsersService] Failed to create user
```

### Dynamic Administration

All routes require Bearer auth + matching permission (`requireApiAccess`), unless noted.

| Module | Prefix | Key endpoints |
|--------|--------|---------------|
| Global Tables | `/api/global-tables` | CRUD + `PUT /:id/menu`, `/:id/columns/*` (CRUD + reorder), `/:id/rows/lookup` |
| Table Data | `/api/data/:tableName` | Row CRUD + `/export?format=csv` + `/import` (multipart CSV) |
| Expressions | `/api/expressions` | `POST /validate`, `POST /evaluate` |
| Components | `/api/components` | CRUD + `/:id/preview`, `/:id/publish`, `/versions/:version` |
| Templates | `/api/templates` | CRUD + `/:id/publish`, `/rollback/:version`, `/validate-tree`, `/versions/:version`, `/bindings/*` |
| Administrations | `/api/administrations` | CRUD + `/:id/publish`, `/archive`, `/new-version`, `/steps`, `/versions/:version`, `/:id/runs` |
| Runs | `/api/runs` | `GET /mine`, `/:runId` detail, `/steps/:stepId` patch, `/complete`, `/cancel` |
| Documents | `/api/documents` | List/detail + `/:id/html`, `/:id/pdf`, `/:id/reissue` |
| Rendering | `/api/render` | `POST /preview` |
| Navigation | `/api/navigation` | `GET /` (auth-only, permission-filtered menu projection) |
| Health | `/api/health` | `GET /` (public) |
| Activity-log coverage | `/api/activity-logs/coverage` | RBAC/audit coverage matrix (Task 22) |

---

## RBAC System

### Server-Side Guards (Nitro Middleware)

RBAC is enforced via Nitro route middleware and utility functions:

1. **JWT Validation** — `server/utils/jwt.ts` validates token for all `/api/*` routes
2. **Route guard** — `server/utils/route-guard.ts` (`requireAuth` / `requireApiAccess`) checks permission method+URL rules

### Server Utilities

| Utility | File | Usage |
|---------|------|-------|
| `verifyToken()` / `signToken()` | `server/utils/jwt.ts` | Validate/sign JWT token |
| `hashPassword()` | `server/utils/password.ts` | Hash password with bcrypt |
| `requireAuth()` / `requireApiAccess()` | `server/utils/route-guard.ts` | Bearer check + permission method+URL enforcement |
| `getDataSource()` | `server/utils/db.ts` | TypeORM DataSource singleton (synchronize + migrationsRun) |
| `isSynchronizeEnabled()` | `server/utils/startup-check.ts` | Single source of truth for dev/prod synchronize condition |
| `shouldEmitStartupWarn()` | `server/utils/startup-check.ts` | Dev-silence gate: suppresses JWT/drift warns in dev synchronize mode |
| `runStartupChecks()` | `server/utils/startup-check.ts` | Pure startup self-checks (JWT, storage, migration drift) |
| `checkMigrationStatus()` | `server/utils/migration-status.ts` | Compares applied migrations against checked-in classes |
| `computeMigrationSync()` | `server/utils/migration-status.ts` | Pure migration drift computation |
| `matchUrlPattern()` | `server/utils/url-matcher.ts` | URL pattern matching for RBAC |
| `permissionMatrix` | `server/utils/permission-matrix.ts` | Module permission catalog for RBAC seeding |

### RBAC Guard Logic (`server/utils/route-guard.ts`)

1. `requireAuth` — Bearer token must be present and verify via `verifyToken()` → returns `userId`, else 401.
2. `requireApiAccess` — loads the user with the full RBAC chain (roles → permissions → methods/urls, all eager) and grants access when at least one permission matches **both** the request method and the request URL pattern (via shared `matchUrlPattern`), else 403.
3. **Permission method+URL enforcement** — for each role's permissions:
   - Check if HTTP method matches permission's `methods` (or `*` wildcard)
   - Check if request URL matches permission's `urls` patterns
4. Guard allow/deny URL lists are evaluated client-side (`useAuthorization().canAccessUrl`) for menu/UX gating; server-side enforcement is permission method+URL based.

### Access Control Flow

```
Request → Nitro route handler → requireAuth → requireApiAccess
  │
  ├─ /api/auth/*, /api/health, GET /api/settings, /api/storage/* → Public (no auth)
  │
  ├─ Bearer token missing/invalid or user not found → 401
  │
  └─ Permission-Based Enforcement:
       For each role → For each permission:
         Method matches (or *)? → URL matches permission urls (matchUrlPattern)?
           → ALLOW
       → Fail: 403 "Access denied"
```

### Startup Checks (Task 22–24)

The Nitro plugin (`server/plugins/database.server.ts`) runs startup self-checks on boot:

1. **Database initialization** — `getDataSource()` initializes SQLite with `synchronize` (dev) or `migrationsRun` (prod)
2. **Migration drift detection** — `checkMigrationStatus()` compares applied migrations against checked-in classes; prod fatals on drift, dev silent with `synchronize:true`
3. **Seed** — `seedDatabase()` runs idempotent seed (RBAC + Dynamic Administration permissions)
4. **Startup checks** — `runStartupChecks()` validates JWT_SECRET, storage writability, migration sync
5. **Dev-silence gate** — `shouldEmitStartupWarn()` suppresses JWT_SECRET_DEFAULT and MIGRATION_DRIFT warns in dev `synchronize:true` mode; prod fatals unchanged (`console.error` + `process.exit(1)`)

### Client-Side Authorization

The client implements complementary access control:

1. **Route Middleware** — Nuxt middleware checks `meta.requiresAuth` and `meta.guest`
2. **Menu Visibility** — Sidebar menu items conditionally rendered based on user roles/permissions
3. **API Error Handling** — `$fetch` interceptor catches 401/403 responses:
   - 401 → Clear token, redirect to `/login`
   - 403 → Show NAlert "Access Denied" message
4. **Composable `useAuthorization`** — Centralized role/permission checking:
   - `hasRole(roleName)` — Check if user has specific role
   - `hasPermission(permissionName)` — Check if user has specific permission
   - `hasAnyRole(roles[])` — Check if user has any of the listed roles
   - `hasAnyPermission(perms[])` — Check if user has any of the listed permissions

---

## Entity Relationships

```
users ──────< users_roles >────── roles
  │                                   │
  │                   ┌───────────────┼───────────────┐
  │                   │               │               │
  │                   v               v               v
  │             roles_guards    roles_permissions     │
  │                   │               │               │
  │                   v               v               v
  │               guards         permissions
  │                   │               │
  │                   v               v
  │             guard_urls    permission_methods
  │                           permission_urls
  │
  └─────────────< activity_logs
```

| Relationship | Type | Description |
|-------------|------|-------------|
| User → Role | Many-to-Many | User can have multiple roles |
| Role → Guard | Many-to-Many | Role can have multiple guards |
| Role → Permission | Many-to-Many | Role can have multiple permissions |
| Guard → GuardUrl | One-to-Many | Guard has many URL rules (allow/deny) |
| Permission → PermissionMethod | One-to-Many | Permission has many method rules |
| Permission → PermissionUrl | One-to-Many | Permission has many URL rules |
| User → ActivityLog | One-to-Many | User has many activity logs (nullable FK) |

---

## Tech Stack

### Frontend
- Nuxt 4 (Vue 3.5 + Nitro)
- TypeScript 6
- Naive UI 2.44
- Tailwind CSS 4
- Pinia (state management)
- Storybook 10
- Vitest 4

### Backend (Nitro Server)
- Nitro (Nuxt 4 server engine)
- TypeORM 1.1 (EntitySchema pattern)
- better-sqlite3
- bcrypt
- Zod (DTO validation in `server/dto/`; `class-validator` remains an installed but unused dependency)
- jsonwebtoken (JWT auth)

### Database
- SQLite via `better-sqlite3`
- `synchronize: true` in development (override with `DB_SYNCHRONIZE` env var)
- Production: checked-in baseline migration (`server/migrations/1788914913928-Baseline.ts`) applied automatically via `migrationsRun`
- Drift detection: `server/utils/migration-status.ts` compares applied migrations against checked-in classes
- CLI: `npm run migration:generate/run/revert` (via `server/utils/migration-cli.ts`)

---

## Design System

Lihat `docs/design-system.md` untuk dokumentasi lengkap design tokens, color palette, typography, spacing, dan komponen.

**Prinsip**:
- **Naive UI** = komponen utama (Button, Input, Form, DataTable, dll)
- **Tailwind CSS** = utility classes (spacing, flexbox, display)
- Customisasi tema via `GlobalThemeOverrides` pada `NConfigProvider`
- Semua komponen harus dibungkus dengan `NConfigProvider`

---

## Table Browse Component

Reusable component untuk semua halaman tabel (Users, Roles, Permissions, Guards).

### Component: `DataTable.vue`

**Path**: `app/components/common/DataTable/DataTable.vue`

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `columns` | `ColumnDef[]` | Column definitions with key, title, sortable, searchable, render |
| `data` | `T[]` | Table data |
| `loading` | `boolean` | Loading state |
| `page` | `number` | Current page (default: 1) |
| `limit` | `number` | Page size (default: 20) |
| `total` | `number` | Total items |
| `sortBy` | `string` | Current sort field (default: 'id') |
| `sortOrder` | `'ASC' \| 'DESC'` | Current sort order (default: 'DESC') |
| `searchPlaceholder` | `string` | Search input placeholder |
| `searchableFields` | `{ label: string; value: string }[]` | Available search field options |

**Emits**:
| Event | Payload | Description |
|-------|---------|-------------|
| `update:page` | `number` | Page changed |
| `update:limit` | `number` | Page size changed |
| `search` | `string` | Search text changed (debounced 300ms) |
| `search-field-change` | `string` | Search field changed |
| `sort-change` | `{ columnKey: string; order: 'ascend' \| 'descend' \| false }` | Sort changed |

**Slots**:
| Slot | Description |
|------|-------------|
| `toolbar` | Custom toolbar content (e.g., Add button) |

### Features
1. **Column Visibility Toggle** — NPopover with checkboxes to show/hide columns
2. **Server-Side Sorting** — Click column header to toggle ASC → DESC → none
3. **Field-Specific Search** — NSelect to choose which field to search, or "All Fields"
4. **Global Search** — NInput with debounce (300ms)
5. **Pagination** — NPagination with page size selector (10, 20, 50, 100)
6. **Loading State** — NSpin overlay
7. **Empty State** — NEmpty with message
8. **Reset Filters** — Button to clear all filters

### Composable: `useDataTable`

**Path**: `app/composables/useDataTable.ts`

Manages table state (search, sort, column visibility). Used by DataTable component internally.
