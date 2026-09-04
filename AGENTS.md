# Agent Guide

## Project Overview

**Business Management System (BMS)** — Admin panel for user management with RBAC (Role-Based Access Control). Manages users, roles, permissions, guards, activity logs, system logs, and application settings.

**Core Concept**:
```
User → Role → Permission → Guard
  │       │         │          │
  │       │         │          └── URL allow/deny rules
  │       │         └── HTTP method + URL patterns
  │       └── Guards + Permissions assigned
  └── JWT token identifies user
```

## Project Structure

Monorepo root at `bms/`:
```
bms/
├── apps/web/          # Nuxt 4 monolith (frontend + API)
├── docs/              # Architecture & design documentation
├── tasks/             # Implementation task lists
├── opencode.json
└── AGENTS.md
```

## Technology Stack

### Frontend (apps/web/)
- **Framework**: Nuxt 4 (`future.compatibilityVersion: 4`)
- **Language**: TypeScript 6 + Vue 3.5 (`<script setup>`)
- **Package Manager**: npm (lockfile: `package-lock.json`)
- **Build Tool**: Vite (via Nuxt)
- **UI Framework**: Naive UI 2.44
- **CSS**: Tailwind CSS v4 (without preflight, Naive UI compatible)
- **State Management**: Pinia 4 (`@pinia/nuxt` module)
- **Animation**: Anime.js 4.5
- **Icons**: `@vicons/carbon` (Carbon Design System)
- **HTTP Client**: Axios (via `useApi` composable) + `$fetch` (Nuxt built-in)
- **Fonts**: Inter (Google Fonts)

### Backend (Nitro Server)
- **Engine**: Nitro (Nuxt 4 server)
- **ORM**: TypeORM 1.1 with `EntitySchema` pattern
- **Database**: SQLite via `better-sqlite3`
- **Validation**: Zod 3.24 (DTOs in `server/dto/`)
- **Auth**: JWT (`jsonwebtoken`) — 24h expiry
- **Password Hashing**: bcrypt (salt rounds: 10)

### Testing
- **Unit Tests**: Vitest 4 (`test/unit/`)
- **Component Tests**: Vitest + `@nuxt/test-utils` (`test/nuxt/`)
- **E2E Tests**: Playwright (`test/e2e/`)
- **Storybook**: Storybook 10 (`stories/`)

### Infrastructure
- Database: SQLite file at `apps/web/db.sqlite`
- Uploaded files: `apps/web/storage/` (gitignored)
- No Docker, no CI/CD configured

## Repository Structure

```text
apps/web/
├── app/                          # Nuxt app directory
│   ├── app.vue                   # Root component (NMessageProvider wrapper)
│   ├── pages/                    # File-based routing
│   │   ├── index.vue             # Redirects to /dashboard or /login
│   │   ├── login.vue             # /login (guest only)
│   │   ├── register.vue          # /register (guest only)
│   │   └── dashboard/
│   │       ├── index.vue         # /dashboard
│   │       ├── profile.vue       # /dashboard/profile
│   │       ├── users.vue         # /dashboard/users
│   │       ├── roles.vue         # /dashboard/roles
│   │       ├── permissions.vue   # /dashboard/permissions
│   │       ├── guards.vue        # /dashboard/guards
│   │       ├── activity-logs.vue # /dashboard/activity-logs
│   │       ├── system-logs.vue   # /dashboard/system-logs
│   │       └── settings.vue      # /dashboard/settings
│   ├── layouts/
│   │   ├── default.vue           # AppLayout (sidebar + header + footer)
│   │   └── auth.vue              # AuthLayout (login/register)
│   ├── components/
│   │   ├── base/                 # Base components (Button)
│   │   ├── common/               # Reusable (AuthForm, FormField, DataTable, AccessDeniedAlert, AppTransition)
│   │   ├── features/             # Feature-specific
│   │   │   ├── users/            # User/Role/Permission/Guard Table/FormModal/DetailDrawer
│   │   │   └── logging/          # LogLevelBadge, LogDetailDrawer, CodeLinkButton
│   │   └── layout/               # Layout components
│   ├── composables/              # Vue composables (useApi, useAuthorization, useDataTable, etc.)
│   ├── stores/                   # Pinia stores (auth, users, roles, permissions, guards, settings)
│   ├── plugins/                  # Nuxt plugins (naiveui.client, naiveui-components, animejs.client)
│   ├── middleware/                # Route middleware (auth.ts)
│   ├── utils/                    # Utilities (error, icons, naiveui-theme, url-matcher)
│   └── assets/css/               # Global styles (main.css, animations.css)
│
├── server/
│   ├── api/                      # Nitro API routes
│   │   ├── auth/                 # register.post, login.post, profile.get, profile.patch, password.patch
│   │   ├── users/                # CRUD: index.get/post, [id].get/put/delete
│   │   ├── roles/                # CRUD: index.get/post, [id].get/put/delete
│   │   ├── permissions/          # CRUD: index.get/post, [id].get/put/delete
│   │   ├── guards/               # CRUD: index.get/post, [id].get/put/delete
│   │   ├── activity-logs/        # index.get, [id].get, stats.get
│   │   ├── system-logs/          # files/index.get, files/[filename].get, stats/[filename].get
│   │   ├── settings/             # index.get/put, upload.post
│   │   └── storage/              # [...path].get (serve uploaded files)
│   ├── entities/                 # TypeORM EntitySchema definitions (9 entities)
│   ├── services/                 # Business logic (10 services)
│   ├── dto/                      # Zod validation schemas (8 dto files)
│   ├── utils/                    # Server utilities (db, jwt, password, url-matcher)
│   ├── middleware/                # Server middleware (auth, activity-logger)
│   └── plugins/                  # Nitro plugins (database.server.ts — init + seed)
│
├── shared/types/                 # Shared TypeScript types (user, auth, role, permission, guard, etc.)
├── stories/                      # Storybook stories & tests
├── test/                         # Test files
│   ├── unit/                     # Unit tests (vitest, node env)
│   ├── nuxt/                     # Component tests (vitest, nuxt env)
│   └── e2e/                      # E2E tests (Playwright)
├── public/                       # Static assets
├── nuxt.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Architecture

### Key Architecture Decisions
1. **Nuxt 4 monolith** — Frontend and API in single package under `apps/web/`
2. **Nitro server routes** — File-based API in `server/api/`, no separate NestJS/Express
3. **TypeORM EntitySchema** — Schema-based entities (not decorators), defined in `server/entities/`
4. **SQLite** — Lightweight database, `synchronize: true` for dev (no migrations)
5. **JWT auth** — Token stored in localStorage + cookie, verified by server middleware
6. **RBAC** — Role-based access: User → Roles → Guards (URL rules) + Permissions (method+URL rules)

### Data Flow
```
Client Request
  → Nuxt Middleware (auth.ts — checks JWT from cookie/header)
  → Nitro Route Handler
  → Zod DTO Validation
  → Service Layer (business logic)
  → TypeORM (SQLite)
  → Response
```

### RBAC Flow
```
Request → JWT validation → User lookup → Role resolution
  → Guard check (deny URLs → allow URLs)
  → Permission check (method match → URL pattern match)
  → ALLOW / 403
```

## Commands

All commands run from `apps/web/`:
```bash
npm run dev              # Nuxt dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run storybook        # Storybook on http://localhost:6006
npm run build-storybook  # Static Storybook build
npm run test             # Run all tests (vitest)
npm run test:unit        # Unit tests only
npm run test:nuxt        # Nuxt component tests only
npm run test:e2e         # E2E tests (Playwright, requires dev server)
npm run test:e2e:debug   # E2E tests in debug mode
```

## API Endpoints

| Module | Prefix | Methods | Description |
|--------|--------|---------|-------------|
| Auth | `/api/auth` | POST, GET, PATCH | Register, Login, Profile, Change Password |
| Users | `/api/users` | GET, POST, PUT, DELETE | User CRUD with pagination |
| Roles | `/api/roles` | GET, POST, PUT, DELETE | Role CRUD with pagination |
| Permissions | `/api/permissions` | GET, POST, PUT, DELETE | Permission CRUD with pagination |
| Guards | `/api/guards` | GET, POST, PUT, DELETE | Guard CRUD with pagination |
| Activity Logs | `/api/activity-logs` | GET | Audit trail (read-only) |
| System Logs | `/api/system-logs` | GET | Log file viewer (read-only) |
| Settings | `/api/settings` | GET, PUT, POST | App settings + file upload |
| Storage | `/api/storage` | GET | Serve uploaded files |

**Common Query Parameters** (list endpoints):
- `page` (default: 1), `limit` (default: 20, max: 100)
- `search` (global), `searchField` (specific field)
- `sortBy` (default: 'id'), `sortOrder` (ASC/DESC, default: 'DESC')

**Response Format**:
```json
{ "data": [...], "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
```

## Domain Model

### Entities (9 total)
| Entity | Table | Key Fields |
|--------|-------|------------|
| User | `users` | id, firstName, lastName, username, email, password |
| Role | `roles` | id, roleName, description |
| Permission | `permissions` | id, permissionName, description |
| Guard | `guards` | id, guardName, description |
| PermissionMethod | `permission_methods` | id, method, permissionId |
| PermissionUrl | `permission_urls` | id, url, permissionId |
| GuardUrl | `guard_urls` | id, url, type(allow/deny), guardId |
| ActivityLog | `activity_logs` | id, userId, action, entity, entityId, level |
| Setting | `settings` | id, key, value |

### Relationships
```
User ─M:N─ Role ─M:N─ Guard ─1:N─ GuardUrl
                  └─M:N─ Permission ─1:N─ PermissionMethod
                                    └─1:N─ PermissionUrl
User ─1:N─ ActivityLog (nullable FK)
```

### Junction Tables
- `users_roles` (userId, roleId)
- `roles_guards` (roleId, guardId)
- `roles_permissions` (roleId, permissionId)

## Frontend Guidelines

### Component Architecture
- **Composition API** with `<script setup lang="ts">` — mandatory
- **Naive UI** = primary component library (Button, Input, Form, DataTable, Modal, Drawer, etc.)
- **Tailwind CSS** = utility classes only (spacing, flexbox, display) — not for components
- All components auto-imported from `app/components/`
- Direct import per Naive UI component, never global import

### Component Organization
```
components/
├── base/           # Primitive components (Button)
├── common/         # Reusable across features (DataTable, AuthForm, FormField)
├── features/       # Feature-specific
│   ├── users/      # UserTable, UserFormModal, UserDetailDrawer, etc.
│   └── logging/    # LogLevelBadge, LogDetailDrawer, CodeLinkButton
└── layout/         # Layout components
```

### Composables
- `useApi()` — Axios instance with auth interceptor + 401/403 handling
- `useAuthorization()` — Role/permission checking (hasRole, hasPermission, canAccessUrl)
- `useDataTable()` — Table state management (search, sort, column visibility)
- `usePageTransition()` — Anime.js animation helpers (fadeInUp, staggerFadeIn, etc.)
- Feature composables: `useUsersData`, `useRolesData`, `usePermissionsData`, `useGuardsData`

### Stores (Pinia)
- `auth` — Token, user, login/register/logout/fetchProfile
- `users`, `roles`, `permissions`, `guards` — CRUD state
- `settings` — App settings (name, favicon, gradient)

### State Persistence
- JWT token: `localStorage` + cookie (`accessToken`)
- User data: `localStorage` (key: `user`)
- Column visibility: `localStorage` (per DataTable)

### Route Middleware
- `auth.ts` — Checks `meta.requiresAuth` and `meta.guest`, validates JWT
- Role-based menu visibility via `useAuthorization().hasAnyRole()`

## Backend Guidelines

### Server Structure
- **Services** — Business logic (pure functions, not classes): `UsersService`, `RolesService`, etc.
- **DTOs** — Zod schemas for validation: `{Entity}Schema`, `QuerySchema`
- **Entities** — TypeORM `EntitySchema` definitions (not class decorators)
- **Utils** — `db.ts` (DataSource singleton), `jwt.ts`, `password.ts`, `url-matcher.ts`

### API Route Pattern
```typescript
// server/api/{module}/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { QuerySchema } from '~~/server/dto/{module}.dto'
import { {Module}Service } from '~~/server/services/{module}.service'

export default defineEventHandler(async (event) => {
  const query = QuerySchema.parse(getQuery(event))
  return {Module}Service.findAll(query)
})
```

### Service Pattern
```typescript
export const {Module}Service = {
  async findAll(query: QueryInput) { /* ... */ },
  async findOne(id: number) { /* ... */ },
  async create(data: CreateInput) { /* ... */ },
  async update(id: number, data: UpdateInput) { /* ... */ },
  async remove(id: number) { /* ... */ },
}
```

### DTO Pattern (Zod)
```typescript
export const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})
export type QueryInput = z.infer<typeof QuerySchema>
```

### Error Handling
- Server: `createError({ statusCode, message })` from `h3`
- Client: `getErrorMessage(e)` utility + NAlert for 403

## Coding Conventions

### Naming
| Type | Convention | Example |
|------|-----------|---------|
| Entity file | `{name}.entity.ts` | `user.entity.ts` |
| Entity schema | `{Name}Schema` | `UserSchema` |
| Entity interface | `{Name}` | `User` |
| Service file | `{name}.service.ts` | `users.service.ts` |
| Service export | `{Name}Service` (object) | `UsersService` |
| DTO file | `{name}.dto.ts` | `users.dto.ts` |
| DTO schema | `{Verb}{Name}Schema` | `CreateUserSchema`, `QuerySchema` |
| DTO type | `{Verb}{Name}Input` | `CreateUserInput` |
| API route | `{method}.post.ts`, `[id].get.ts` | `login.post.ts` |
| Composable | `use{Name}.ts` | `useApi.ts`, `useAuthorization.ts` |
| Store | `{name}.ts` | `auth.ts`, `users.ts` |
| Component | `{Name}.vue` | `DataTable.vue`, `UserFormModal.vue` |
| Shared type | `{name}.ts` in `shared/types/` | `user.ts`, `auth.ts` |

### Import Conventions
- **Frontend**: `~/` → `app/` root (e.g., `~/stores/auth`, `~/utils/error`)
- **Shared types**: `@/shared/types/{name}` (e.g., `@/shared/types/user`)
- **Server**: `~~/server/` (e.g., `~~/server/utils/db`, `~~/server/services/auth.service`)
- **Naive UI**: Direct component imports (e.g., `import { NButton } from 'naive-ui'`)

### File Naming
- Kebab-case for files: `use-page-transition.ts`, `naive-ui-theme.ts`
- PascalCase for components: `DataTable.vue`, `UserFormModal.vue`
- camelCase for services/composables/stores: `users.service.ts`, `useApi.ts`

## UI/UX Guidelines

### Design System
- **Naive UI GlobalThemeOverrides** for theming (defined in `app/utils/naiveui-theme.ts`)
- **Primary color**: `#3B82F6` (Blue 500)
- **Font**: Inter
- **Border radius**: 6px (default), 4px (small), 8px (large)

### Detail Views
- Use `.detail-view` CSS pattern (label→value vertical layout)
- Do NOT use `NDescriptions` / `NDescriptionsItem`
- See `docs/design-system.md` for full spec

### DataTable
- Reusable `DataTable.vue` component for all list pages
- Required features: global search (debounce 300ms), field-specific search, column visibility toggle, server-side sorting, pagination (10/20/50/100)
- Search input min-width: 320px

### Animations
- Page transitions: CSS (fade + translateY)
- Micro-interactions: Anime.js via `usePageTransition` composable
- Respect `prefers-reduced-motion`

### Icons
- Library: `@vicons/carbon`
- Render: `h(NIcon, null, { default: () => h(IconName) })`

### Access Denied
- 403 → NAlert with "Access Denied" message
- Dispatch `rbac-denied` custom event for global handling

## Database Guidelines

- **Engine**: SQLite via `better-sqlite3`
- **ORM**: TypeORM with `EntitySchema` pattern (not decorators)
- **Schema sync**: `synchronize: true` (dev only — no migrations)
- **Seed**: Auto-runs on server start via `database.server.ts` plugin
- **Reset**: Delete `apps/web/db.sqlite`, restart dev server
- **Timestamps**: `createDate: true` / `updateDate: true` on entities
- **Unique constraints**: `username`, `email`, `roleName`, `permissionName`, `guardName`, `key`
- **Password**: Always hash with bcrypt before storing, never return in responses

## Testing

### Test Structure
```text
test/
├── unit/                    # Pure function tests (node env)
│   ├── utils/               # url-matcher, error, icons
│   └── composables/         # useUsersData, useRolesData, etc.
├── nuxt/                    # Component tests (nuxt env)
│   └── components/          # mountSuspended tests
└── e2e/                     # E2E tests (Playwright)
    ├── auth.spec.ts
    └── crud.spec.ts
```

### Test Commands
```bash
npm run test:unit    # Unit tests only
npm run test:nuxt    # Component tests only
npm run test:e2e     # E2E (requires dev server running)
npm run test         # All tests
```

### Storybook
- Config: `apps/web/.storybook/`
- Stories: `apps/web/stories/`
- Run: `npm run storybook` (port 6006)
- Addons: a11y, docs

## Development Workflow

### SDD (Spec-Driven Development)
```
Permanent Knowledge → Task → Plan → Implement → Verify → Review
```

1. Read relevant docs (`docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`)
2. Check tasks (`tasks/`)
3. Implement smallest consistent change
4. Run tests: `npm run test`
5. Verify lint/typecheck if available

### Database Reset
```bash
rm apps/web/db.sqlite && npm run dev  # from apps/web/
```

### Adding New Entity
1. Create entity: `server/entities/{name}.entity.ts`
2. Register in `server/utils/db.ts` entities array
3. Create DTO: `server/dto/{name}.dto.ts`
4. Create service: `server/services/{name}.service.ts`
5. Create API routes: `server/api/{name}/`
6. Create shared type: `shared/types/{name}.ts`
7. Create frontend: page, store, composables, components

## Documentation

Always consult before implementation:
- `docs/PRD.md` — Product requirements and feature specs
- `docs/architecture.md` — System architecture, API endpoints, RBAC flow
- `docs/database.md` — Entity schema, relationships, seed data
- `docs/design-system.md` — Design tokens, component specs, UI patterns
- `tasks/` — Current implementation task lists
- `.ua/` when available and relevant for project relationships and knowledge graph context

## Important Rules

- **Single package** — Always run commands from `apps/web/`
- **Naive UI first** — Use Naive UI components, Tailwind for utility only
- **No NDescriptions** — Use `.detail-view` pattern for detail views
- **Zod validation** — All API inputs validated via Zod DTOs
- **Service pattern** — Services are plain objects with async methods, not classes
- **EntitySchema** — Use TypeORM EntitySchema, not class decorators
- **Import aliases** — `~/` for app root, `~~/` for server root, `@/` for shared types
- **Password security** — Always hash with bcrypt, strip from API responses
- **JWT secret** — Set `JWT_SECRET` env var for production
- **Native addons** — `better-sqlite3` and `bcrypt` may need rebuild after install
- **`.ua/` knowledge graph** — Available at project root, contains 754 nodes and 1036 edges mapping project structure, relationships, and architecture

## Verification

After implementation:
1. Run unit tests: `npm run test:unit` (from `apps/web/`)
2. Run component tests: `npm run test:nuxt`
3. Run E2E tests: `npm run test:e2e` (requires dev server)
4. Check TypeScript: Review for type errors
5. Test API endpoints manually or via E2E
