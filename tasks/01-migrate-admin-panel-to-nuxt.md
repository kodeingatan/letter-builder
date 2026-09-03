# 01 — Migrate Admin Panel to Nuxt 4

## Overview

Konversi project `admin-panel` (Vue 3 + Vite + NestJS terpisah) menjadi **Nuxt 4 monolith** di `business-managenet-system/app/`.

**Source**: `~/Laboratorium/Bisnis Digital/admin-panel/` (client + server terpisah)
**Target**: `~/Laboratorium/Bisnis Digital/business-managenet-system/app/` (Nuxt 4 monolith)

---

## Mapping Arsitektur

### Nuxt 4 Structure (target)

```
app/
├── app/
│   ├── app.vue                        # Root layout
│   ├── pages/                         # File-based routing (Vue Router → Nuxt pages)
│   │   ├── login.vue                  # /login
│   │   ├── register.vue               # /register
│   │   └── dashboard/
│   │       ├── index.vue              # /dashboard
│   │       ├── profile.vue            # /dashboard/profile
│   │       ├── users.vue              # /dashboard/users
│   │       ├── roles.vue              # /dashboard/roles
│   │       ├── permissions.vue        # /dashboard/permissions
│   │       ├── guards.vue             # /dashboard/guards
│   │       ├── activity-logs.vue      # /dashboard/activity-logs
│   │       ├── system-logs.vue        # /dashboard/system-logs
│   │       └── settings.vue           # /dashboard/settings
│   ├── layouts/
│   │   ├── default.vue                # AppLayout (sidebar + header + footer)
│   │   └── auth.vue                   # AuthLayout (login/register)
│   ├── components/
│   │   ├── base/
│   │   │   └── Button/
│   │   ├── common/
│   │   │   ├── AccessDeniedAlert.vue
│   │   │   ├── AppTransition.vue
│   │   │   ├── AuthForm/
│   │   │   ├── DataTable/
│   │   │   └── FormField/
│   │   ├── layout/
│   │   │   └── AppLayout/
│   │   └── features/
│   │       ├── users/                 # User/Guard/Role/Permission Table/FormModal/DetailDrawer
│   │       └── logging/               # LogDetailDrawer, LogLevelBadge, CodeLinkButton
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useAuthorization.ts
│   │   └── useDataTable.ts
│   ├── plugins/
│   │   └── naiveui.client.ts          # Naive UI theme setup (client-only)
│   ├── middleware/
│   │   ├── auth.global.ts             # Route guard (auth check)
│   │   └── rbac.global.ts             # RBAC check (roles, permissions)
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css               # Tailwind CSS v4
│   │   │   └── animations.css
│   │   └── images/
│   │       └── hero.png
│   ├── stores/
│   │   ├── auth.ts                    # Pinia auth store
│   │   ├── users.ts
│   │   ├── roles.ts
│   │   ├── permissions.ts
│   │   ├── guards.ts
│   │   └── settings.ts
│   └── utils/
│       ├── error.ts
│       ├── icons.ts
│       └── url-matcher.ts
│
├── server/
│   ├── api/                           # API routes (replaces NestJS controllers)
│   │   ├── auth/
│   │   │   ├── login.post.ts          # POST /api/auth/login
│   │   │   ├── register.post.ts       # POST /api/auth/register
│   │   │   ├── profile.get.ts         # GET /api/auth/profile
│   │   │   ├── profile.patch.ts       # PATCH /api/auth/profile
│   │   │   └── password.patch.ts      # PATCH /api/auth/password
│   │   ├── users/
│   │   │   ├── index.get.ts           # GET /api/users
│   │   │   ├── index.post.ts          # POST /api/users
│   │   │   ├── [id].get.ts            # GET /api/users/:id
│   │   │   ├── [id].put.ts            # PUT /api/users/:id
│   │   │   └── [id].delete.ts         # DELETE /api/users/:id
│   │   ├── roles/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].put.ts
│   │   │   └── [id].delete.ts
│   │   ├── permissions/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].put.ts
│   │   │   └── [id].delete.ts
│   │   ├── guards/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].put.ts
│   │   │   └── [id].delete.ts
│   │   ├── activity-logs/
│   │   │   ├── index.get.ts
│   │   │   ├── stats.get.ts
│   │   │   └── [id].get.ts
│   │   ├── system-logs/
│   │   │   ├── files/
│   │   │   │   ├── index.get.ts
│   │   │   │   └── [filename].get.ts
│   │   │   └── stats/
│   │   │       └── [filename].get.ts
│   │   ├── settings/
│   │   │   ├── index.get.ts
│   │   │   ├── index.put.ts
│   │   │   └── upload.post.ts
│   │   └── storage/
│   │       └── [...path].get.ts       # GET /api/storage/:subfolder/:filename
│   ├── middleware/                     # Server middleware
│   │   ├── cors.ts                    # CORS handling
│   │   └── activity-logger.ts         # Auto-log API requests
│   ├── plugins/
│   │   ├── database.server.ts         # TypeORM init + auto-sync + seeder
│   │   └── seed.server.ts             # Seed data on startup
│   ├── utils/
│   │   ├── db.ts                      # TypeORM DataSource singleton
│   │   ├── jwt.ts                     # JWT sign/verify helpers
│   │   ├── password.ts                # bcrypt hash/compare
│   │   ├── rbac.ts                    # RBAC guard logic
│   │   └── url-matcher.ts             # URL pattern matcher
│   ├── entities/                      # TypeORM entities
│   │   ├── user.entity.ts
│   │   ├── role.entity.ts
│   │   ├── permission.entity.ts
│   │   ├── permission-method.entity.ts
│   │   ├── permission-url.entity.ts
│   │   ├── guard.entity.ts
│   │   ├── guard-url.entity.ts
│   │   ├── activity-log.entity.ts
│   │   └── setting.entity.ts
│   ├── services/                      # Business logic
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── roles.service.ts
│   │   ├── permissions.service.ts
│   │   ├── guards.service.ts
│   │   ├── activity-logs.service.ts
│   │   ├── system-logs.service.ts
│   │   ├── settings.service.ts
│   │   ├── storage.service.ts
│   │   └── seeder.service.ts
│   └── dto/                           # Validation DTOs (zod)
│       ├── auth.dto.ts
│       ├── users.dto.ts
│       ├── roles.dto.ts
│       ├── permissions.dto.ts
│       ├── guards.dto.ts
│       ├── activity-logs.dto.ts
│       ├── system-logs.dto.ts
│       └── settings.dto.ts
│
├── shared/                            # Shared types (client + server)
│   └── types/
│       ├── index.ts
│       ├── user.ts
│       ├── role.ts
│       ├── permission.ts
│       ├── guard.ts
│       ├── auth.ts
│       ├── api.ts
│       ├── activity-log.ts
│       └── system-log.ts
│
├── public/                            # Static assets
│   ├── favicon.svg
│   └── images/
│
├── .gitignore
├── nuxt.config.ts
├── package.json
├── tailwind.config.ts                 # Tailwind v4 (or css-first config)
└── tsconfig.json
```

---

## Phase 1: Project Setup & Configuration

### 1.1 Install Dependencies

Tambahkan dependencies ke `app/package.json`:

```bash
# Core
npm install nuxt@^4.5.0 vue@^3.5.40 vue-router@^5.2.0

# UI & Styling
npm install naive-ui @vicons/carbon

# State Management
npm install pinia

# Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite

# Animation
npm install animejs

# HTTP Client (untuk client-side API calls)
npm install axios

# Database
npm install typeorm better-sqlite3

# Auth
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt

# Validation
npm install class-validator class-transformer zod

# DevDependencies
npm install -D @nuxt/devtools typescript vue-tsc
```

### 1.2 Update nuxt.config.ts

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  future: { compatibilityVersion: 4 },

  modules: [
    'nuxt-naive-ui',      # or manual plugin
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    externals: {
      inline: ['typeorm', 'better-sqlite3'],
    },
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    public: {
      apiBase: '/api',
    },
  },

  app: {
    head: {
      title: 'Business Management System',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
```

### 1.3 Copy & Adapt .opencode/

```bash
cp -r ~/Laboratorium/Bisnis\ Digital/admin-panel/.opencode \
      ~/Laboratorium/Bisnis\ Digital/business-managenet-system/
```

**Hapus skills yang tidak relevan** (NestJS → sudah tidak dipakai):
- Hapus `.opencode/skills/nestjs/` (NestJS tidak dipakai di Nuxt)
- Rename/sesuaikan skill `vue-best-practices` → tetap (masih Vue 3)
- Tambah skill Nuxt.js jika ada

**Update opencode.json** di root:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@dietrichgebert/ponytail"],
  "mcp": {
    "storybook": {
      "enabled": true,
      "type": "url",
      "url": "http://localhost:6006/mcp"
    }
  }
}
```

### 1.4 Copy & Adapt docs/

```bash
cp -r ~/Laboratorium/Bisnis\ Digital/admin-panel/docs/ \
      ~/Laboratorium/Bisnis\ Digital/business-managenet-system/docs/
```

**Update docs:**
- `docs/architecture.md` — Ubah dari "Two packages" → "Nuxt 4 monolith". Update semua deskripsi struktur.
- `docs/database.md` — Tidak berubah (entity & schema tetap sama)
- `docs/PRD.md` — Update tech stack: "NestJS" → "Nitro server (Nuxt)", hapus referensi package terpisah
- `docs/design-system.md` — Tidak berubah (Naive UI + Tailwind tetap sama)

### 1.5 Copy & Update AGENTS.md

```bash
cp ~/Laboratorium/Bisnis\ Digital/admin-panel/AGENTS.md \
   ~/Laboratorium/Bisnis\ Digital/business-managenet-system/
```

**Perubahan utama AGENTS.md:**
- Hapus section "Two independent packages"
- Update menjadi satu package Nuxt 4
- Client commands → `npm run dev/build/preview` (Nuxt)
- Server tidak ada paket terpisah — API routes di `server/api/`
- Update directory structure ke format Nuxt
- Hapus referensi Vite proxy (Nitro handle API secara internal)
- Update import alias (Nuxt auto `~/` → root)

---

## Phase 2: Server — Database & Entities

### 2.1 Create TypeORM DataSource

**File**: `app/server/utils/db.ts`

```typescript
import { DataSource } from 'typeorm'
import { User } from '~/server/entities/user.entity'
import { Role } from '~/server/entities/role.entity'
// ... semua entities

let dataSource: DataSource | null = null

export async function getDataSource(): Promise<DataSource> {
  if (!dataSource) {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: 'db.sqlite',
      entities: [
        User, Role, Permission, PermissionMethod, PermissionUrl,
        Guard, GuardUrl, ActivityLog, Setting,
      ],
      synchronize: true,
    })
    await dataSource.initialize()
  }
  return dataSource
}
```

### 2.2 Copy Entities (9 files)

Copy dari `admin-panel/server/src/modules/*/entities/` → `app/server/entities/`:

| Source | Target |
|--------|--------|
| `modules/users/entities/user.entity.ts` | `server/entities/user.entity.ts` |
| `modules/roles/entities/role.entity.ts` | `server/entities/role.entity.ts` |
| `modules/permissions/entities/permission.entity.ts` | `server/entities/permission.entity.ts` |
| `modules/permissions/entities/permission-method.entity.ts` | `server/entities/permission-method.entity.ts` |
| `modules/permissions/entities/permission-url.entity.ts` | `server/entities/permission-url.entity.ts` |
| `modules/guards/entities/guard.entity.ts` | `server/entities/guard.entity.ts` |
| `modules/guards/entities/guard-url.entity.ts` | `server/entities/guard-url.entity.ts` |
| `modules/activity-logs/entities/activity-log.entity.ts` | `server/entities/activity-log.entity.ts` |
| `modules/settings/entities/setting.entity.ts` | `server/entities/setting.entity.ts` |

**Adaptasi**:
- Import path: `@/modules/X/entities/Y` → `~/server/entities/Y`
- Entity decorators tetap sama (TypeORM)

### 2.3 Create JWT Helpers

**File**: `app/server/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'default-secret-change-me'

export function signToken(payload: { sub: number; email: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as { sub: number; email: string }
}
```

### 2.4 Create Password Helpers

**File**: `app/server/utils/password.ts`

```typescript
import bcrypt from 'bcrypt'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
```

### 2.5 Create RBAC Guard

**File**: `app/server/utils/rbac.ts`

Port `rbac.guard.ts` → pure function:
```typescript
import { getDataSource } from './db'
import { matchUrlPattern } from './url-matcher'

interface RbacUser {
  sub: number
}

export async function checkRbac(
  user: RbacUser,
  requiredRoles?: string[],
  requiredPermissions?: string[],
  httpMethod?: string,
  requestUrl?: string,
): Promise<{ allowed: boolean; reason?: string }> {
  // Port logic dari server/src/common/guards/rbac.guard.ts
  // Load user with roles → guards → permissions
  // Check roles, permissions, guard URLs
}
```

### 2.6 Port Services (10 files)

Copy dari `admin-panel/server/src/modules/*/services/` → `app/server/services/`:

| Source | Target |
|--------|--------|
| `modules/auth/services/auth.service.ts` | `server/services/auth.service.ts` |
| `modules/users/services/users.service.ts` | `server/services/users.service.ts` |
| `modules/roles/services/roles.service.ts` | `server/services/roles.service.ts` |
| `modules/permissions/services/permissions.service.ts` | `server/services/permissions.service.ts` |
| `modules/guards/services/guards.service.ts` | `server/services/guards.service.ts` |
| `modules/activity-logs/services/activity-logs.service.ts` | `server/services/activity-logs.service.ts` |
| `modules/system-logs/services/system-logs.service.ts` | `server/services/system-logs.service.ts` |
| `modules/settings/services/settings.service.ts` | `server/services/settings.service.ts` |
| `modules/storage/services/storage.service.ts` | `server/services/storage.service.ts` |
| `common/services/seeder.service.ts` | `server/services/seeder.service.ts` |

**Adaptasi per service**:
- Hapus NestJS decorators (`@Injectable`, `@InjectRepository`)
- Ubah constructor → function params atau singleton pattern
- Repository pattern: `getDataSource().getRepository(Entity)` alih-alih `@InjectRepository`
- Activity logging: panggil `activityLogsService.log()` langsung (bukan via DI)

### 2.7 Create DTOs (validation)

Port `class-validator` DTOs → **zod** schemas:

| Source | Target |
|--------|--------|
| `modules/auth/dto/register.dto.ts` | `server/dto/auth.dto.ts` |
| `modules/auth/dto/login.dto.ts` | `server/dto/auth.dto.ts` |
| `modules/users/dto/create-user.dto.ts` | `server/dto/users.dto.ts` |
| `modules/roles/dto/create-role.dto.ts` | `server/dto/roles.dto.ts` |
| `modules/permissions/dto/create-permission.dto.ts` | `server/dto/permissions.dto.ts` |
| `modules/guards/dto/create-guard.dto.ts` | `server/dto/guards.dto.ts` |
| `common/dto/query.dto.ts` | `server/dto/query.dto.ts` |

**Format zod**:
```typescript
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const RegisterSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
})

export const QuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})
```

---

## Phase 3: Server — API Routes

### 3.1 Auth Routes

| File | Method | Endpoint | Handler |
|------|--------|----------|---------|
| `server/api/auth/login.post.ts` | POST | `/api/auth/login` | Login + return JWT |
| `server/api/auth/register.post.ts` | POST | `/api/auth/register` | Register + return JWT |
| `server/api/auth/profile.get.ts` | GET | `/api/auth/profile` | Get profile with relations |
| `server/api/auth/profile.patch.ts` | PATCH | `/api/auth/profile` | Update profile |
| `server/api/auth/password.patch.ts` | PATCH | `/api/auth/password` | Change password |

**Pattern per route**:
```typescript
import { defineEventHandler, readBody, getHeader, createError } from 'h3'
import { verifyToken } from '~/server/utils/jwt'
import { AuthService } from '~/server/services/auth.service'

export default defineEventHandler(async (event) => {
  // 1. Auth check
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  
  // 2. Parse body/params
  const body = await readBody(event)
  
  // 3. Call service
  const result = await AuthService.updateProfile(payload.sub, body)
  
  // 4. Return
  return result
})
```

### 3.2 CRUD Routes (Users, Roles, Permissions, Guards)

Setiap entity punya 5 routes:

| Pattern | Example (Users) |
|---------|-----------------|
| `server/api/{entity}/index.get.ts` | GET list (paginated, search, sort) |
| `server/api/{entity}/index.post.ts` | POST create |
| `server/api/{entity}/[id].get.ts` | GET detail |
| `server/api/{entity}/[id].put.ts` | PUT update |
| `server/api/{entity}/[id].delete.ts` | DELETE |

**Total**: 4 entities × 5 routes = 20 files

### 3.3 Special Routes

| File | Method | Endpoint |
|------|--------|----------|
| `server/api/activity-logs/index.get.ts` | GET | `/api/activity-logs` |
| `server/api/activity-logs/stats.get.ts` | GET | `/api/activity-logs/stats` |
| `server/api/activity-logs/[id].get.ts` | GET | `/api/activity-logs/:id` |
| `server/api/system-logs/files/index.get.ts` | GET | `/api/system-logs/files` |
| `server/api/system-logs/files/[filename].get.ts` | GET | `/api/system-logs/files/:filename` |
| `server/api/system-logs/stats/[filename].get.ts` | GET | `/api/system-logs/stats/:filename` |
| `server/api/settings/index.get.ts` | GET | `/api/settings` (public) |
| `server/api/settings/index.put.ts` | PUT | `/api/settings` (auth) |
| `server/api/settings/upload.post.ts` | POST | `/api/settings/upload` (auth) |
| `server/api/storage/[...path].get.ts` | GET | `/api/storage/*` (public) |

### 3.4 Server Middleware

**Auth middleware** — Extract user dari JWT, attach ke event context:

```typescript
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(authHeader.slice(7))
      event.context.user = payload
    } catch {
      // invalid token, don't set user
    }
  }
})
```

**Activity logger middleware** — Log semua API write requests:

```typescript
// server/middleware/activity-logger.ts
export default defineEventHandler(async (event) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.method)) {
    // Log after response
    // Use event.context.user for userId
  }
})
```

### 3.5 Database Plugin

```typescript
// server/plugins/database.server.ts
import { getDataSource } from '~/server/utils/db'
import { seedDatabase } from '~/server/services/seeder.service'

export default defineNitroPlugin(async () => {
  const ds = await getDataSource()
  await seedDatabase(ds)
})
```

---

## Phase 4: Client — Layouts & Pages

### 4.1 Layouts

| Source | Target | Notes |
|--------|--------|-------|
| `components/layout/AppLayout/AppLayout.vue` | `app/layouts/default.vue` | Wrap with `<slot />` |
| `components/common/AuthLayout/AuthLayout.vue` | `app/layouts/auth.vue` | Login/Register layout |

**AppLayout Adaptasi**:
- Hapus `useRouter()` → gunakan `navigateTo()` (Nuxt)
- `useRoute()` tetap sama
- `localStorage` → tetap (client-only via `<script setup>`)

### 4.2 Pages (file-based routing)

| Source (views/) | Target (pages/) | Route |
|-----------------|-----------------|-------|
| `LoginPage.vue` | `pages/login.vue` | `/login` |
| `RegisterPage.vue` | `pages/register.vue` | `/register` |
| `DashboardPage.vue` | `pages/dashboard/index.vue` | `/dashboard` |
| `ProfilePage.vue` | `pages/dashboard/profile.vue` | `/dashboard/profile` |
| `UsersPage.vue` | `pages/dashboard/users.vue` | `/dashboard/users` |
| `RolesPage.vue` | `pages/dashboard/roles.vue` | `/dashboard/roles` |
| `PermissionsPage.vue` | `pages/dashboard/permissions.vue` | `/dashboard/permissions` |
| `GuardsPage.vue` | `pages/dashboard/guards.vue` | `/dashboard/guards` |
| `ActivityLogsPage.vue` | `pages/dashboard/activity-logs.vue` | `/dashboard/activity-logs` |
| `SystemLogsPage.vue` | `pages/dashboard/system-logs.vue` | `/dashboard/system-logs` |
| `SettingsPage.vue` | `pages/dashboard/settings.vue` | `/dashboard/settings` |

**Page Adaptasi**:
- Tambah `definePageMeta({ layout: 'default', middleware: 'auth' })` di protected pages
- Tambah `definePageMeta({ layout: 'auth', middleware: 'guest' })` di login/register
- `useRouter()` → `useRouter()` (tetap) atau `navigateTo()`
- `useRoute()` → `useRoute()` (tetap)

### 4.3 App.vue

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

---

## Phase 5: Client — Components, Composables, Stores

### 5.1 Components (copy & adapt)

| Source | Target |
|--------|--------|
| `components/base/Button/` | `app/components/base/Button/` |
| `components/common/AccessDeniedAlert.vue` | `app/components/common/AccessDeniedAlert.vue` |
| `components/common/AppTransition.vue` | `app/components/common/AppTransition.vue` |
| `components/common/AuthForm/` | `app/components/common/AuthForm/` |
| `components/common/DataTable/` | `app/components/common/DataTable/` |
| `components/common/FormField/` | `app/components/common/FormField/` |
| `components/features/users/` | `app/components/features/users/` |
| `components/features/logging/` | `app/components/features/logging/` |

**Adaptasi**:
- Hapus semua explicit import `vue-router` → gunakan Nuxt auto-imports
- `router.push()` → `navigateTo()` atau tetap `useRouter().push()`
- Tidak ada perubahan signifikan (Naive UI + Tailwind tetap)

### 5.2 Composables (copy & adapt)

| Source | Target |
|--------|--------|
| `composables/useAuthorization.ts` | `app/composables/useAuthorization.ts` |
| `composables/useDataTable.ts` | `app/composables/useDataTable.ts` |

Tambah baru:
- `app/composables/useApi.ts` — Axios wrapper dengan auth interceptor (replaces `services/api.ts`)

**useApi pattern**:
```typescript
export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  
  const api = axios.create({
    baseURL: config.public.apiBase,
  })
  
  api.interceptors.request.use((config) => {
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  })
  
  return api
}
```

### 5.3 Stores (copy & adapt)

| Source | Target |
|--------|--------|
| `stores/auth.store.ts` | `app/stores/auth.ts` |
| `stores/users.store.ts` | `app/stores/users.ts` |
| `stores/roles.store.ts` | `app/stores/roles.ts` |
| `stores/permissions.store.ts` | `app/stores/permissions.ts` |
| `stores/guards.store.ts` | `app/stores/guards.ts` |
| `stores/settings.store.ts` | `app/stores/settings.ts` |

**Adaptasi**:
- Import path: `@/services/api` → `@/composables/useApi`
- `localStorage` → tetap (client-only, accessible di Pinia stores)

### 5.4 Plugins

| Source | Target |
|--------|--------|
| `plugins/naiveui.ts` | `app/plugins/naiveui.client.ts` |

**Naive UI plugin** — Client-only (SSR incompatible):
```typescript
// app/plugins/naiveui.client.ts
import { create, NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider } from 'naive-ui'
import { themeOverrides } from '~/assets/styles/naiveui-theme'

export default defineNuxtPlugin((nuxtApp) => {
  // Provide Naive UI theme globally
  nuxtApp.provide('naiveuiTheme', themeOverrides)
})
```

### 5.5 Middleware

| Source | Target |
|--------|--------|
| `router/index.ts` (beforeEach) | `app/middleware/auth.global.ts` |
| `router/index.ts` (RBAC check) | `app/middleware/rbac.global.ts` |

**auth.global.ts**:
```typescript
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return navigateTo('/login')
  }
  
  if (to.meta.guest && authStore.isAuthenticated) {
    return navigateTo('/dashboard')
  }
})
```

**rbac.global.ts**:
```typescript
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiredRoles && authStore.user) {
    const userRoles = authStore.user.roles?.map(r => r.roleName) || []
    const hasRole = (to.meta.requiredRoles as string[]).some(r => userRoles.includes(r))
    if (!hasRole) {
      throw navigateTo('/dashboard')
    }
  }
})
```

### 5.6 Types (shared)

| Source | Target |
|--------|--------|
| `types/index.ts` | `shared/types/index.ts` |
| `types/user.ts` | `shared/types/user.ts` |
| `types/role.ts` | `shared/types/role.ts` |
| `types/permission.ts` | `shared/types/permission.ts` |
| `types/guard.ts` | `shared/types/guard.ts` |
| `types/auth.ts` | `shared/types/auth.ts` |
| `types/api.ts` | `shared/types/api.ts` |
| `types/activity-log.ts` | `shared/types/activity-log.ts` |
| `types/system-log.ts` | `shared/types/system-log.ts` |

### 5.7 Utils

| Source | Target |
|--------|--------|
| `utils/error.ts` | `app/utils/error.ts` |
| `utils/icons.ts` | `app/utils/icons.ts` |
| `utils/url-matcher.ts` | `app/utils/url-matcher.ts` |
| (server) `common/utils/url-matcher.ts` | `server/utils/url-matcher.ts` |

### 5.8 Assets

| Source | Target |
|--------|--------|
| `assets/styles/main.css` | `app/assets/css/main.css` |
| `assets/styles/animations.css` | `app/assets/css/animations.css` |
| `plugins/naiveui.ts` (theme) | `app/assets/styles/naiveui-theme.ts` |
| `assets/hero.png` | `app/public/images/hero.png` |

---

## Phase 6: Storybook

### 6.1 Setup

Storybook tidak bawaan di Nuxt. Setup sebagai dev dependency terpisah:

```bash
npm install -D @storybook/vue3-vite @storybook/addon-vitest @storybook/addon-a11y @storybook/addon-docs
```

**Storybook config** tetap di root-level `app/.storybook/` atau project-level `app/storybook/`.

### 6.2 Copy Stories

```bash
cp -r ~/Laboratorium/Bisnis\ Digital/admin-panel/client/stories/ \
      ~/Laboratorium/Bisnis\ Digital/business-managenet-system/app/stories/
```

Stories import path: `../src/...` → `~/components/...` (Nuxt alias)

---

## Phase 7: Documentation Updates

### 7.1 AGENTS.md

Complete rewrite untuk Nuxt 4 structure:

```markdown
# Agent Guide

## Project Structure

Single Nuxt 4 package:
- `app/` — Nuxt 4 monolith (frontend + API)
- `docs/` — Architecture & design documentation
- `tasks/` — Implementation task lists
- `stories/` — Storybook stories & tests (root level)

## Nuxt App Structure

**Commands** (run from `app/`):
```bash
npm run dev              # Nuxt dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run storybook        # Storybook on http://localhost:6006
npm run build-storybook  # Static Storybook build
```

**Key conventions**:
- Nuxt 4 with `future.compatibilityVersion: 4`
- UI: **Naive UI** + **Tailwind CSS v4**
- State: **Pinia** (via `@pinia/nuxt`)
- API: Nitro server routes in `server/api/`
- Database: TypeORM + better-sqlite3
- Auth: JWT (stored in localStorage)
- Types: `shared/types/` (client + server)
```

### 7.2 docs/architecture.md

Update section "Two independent packages" → "Nuxt 4 monolith". Update all directory references.

### 7.3 docs/PRD.md

Update tech stack section:
```
- Frontend: Nuxt 4 + Vue 3 + TypeScript + Naive UI + Tailwind CSS v4
- Backend: Nitro server (Nuxt) + TypeORM + SQLite
- Auth: JWT
```

---

## Phase 8: Testing & Verification

### 8.1 Checklist

- [ ] `npm run dev` — Server starts, no errors
- [ ] `GET /api/auth/login` — Works with seeded user
- [ ] `GET /api/users` — Returns paginated users
- [ ] `/login` — Page renders, form works
- [ ] `/dashboard` — Protected, shows after login
- [ ] Sidebar menu renders with correct items
- [ ] RBAC: unauthorized user sees access denied
- [ ] DataTable: search, sort, pagination works
- [ ] CRUD: create/edit/delete works for all entities
- [ ] Settings: upload, update works
- [ ] Activity logs: records appear
- [ ] System logs: log viewer works
- [ ] Profile: edit & change password works
- [ ] `npm run build` — Production build succeeds

---

## File Count Summary

| Category | Files |
|----------|-------|
| Server API routes | ~30 |
| Server entities | 9 |
| Server services | 10 |
| Server DTOs | 8 |
| Server utils | 5 |
| Server middleware | 2 |
| Server plugins | 2 |
| Client pages | 11 |
| Client layouts | 2 |
| Client components | ~20 |
| Client composables | 3 |
| Client stores | 6 |
| Client plugins | 1 |
| Client middleware | 2 |
| Client utils | 3 |
| Client assets | 3 |
| Shared types | 9 |
| Config files | 5 |
| **Total** | **~130** |

---

## Execution Order

1. **Phase 1**: Setup (deps, config, copy .opencode, docs, AGENTS.md)
2. **Phase 2**: Server entities, utils, services, DTOs
3. **Phase 3**: Server API routes + middleware
4. **Phase 4**: Client layouts + pages
5. **Phase 5**: Client components, composables, stores, plugins
6. **Phase 6**: Storybook
7. **Phase 7**: Documentation updates
8. **Phase 8**: Testing & verification

**Total estimated files to create/modify**: ~130+
**Estimated time**: Multi-session (phases 1-3, 4-5, 6-8)
