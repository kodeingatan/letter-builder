# Agent Guide

## Project Overview

**Business Management System (BMS)** — Metadata-driven platform to define data structures (Global Tables), reusable document blocks (Components), document blueprints (Templates), data-collection workflows (Administrations), and generate documents (PDF/HTML). RBAC foundation + Dynamic Administration modules are implemented.

**Core flow**: Global Table → Component → Template → Administration → Document (PDF/HTML)

## Critical Working Directory

**All commands run from `apps/web/`** — not from repo root. The repo root contains only `apps/`, `docs/`, `tasks/`, `AGENTS.md`, and `opencode.json`.

## Tech Stack

- **Framework**: Nuxt 4 (`future.compatibilityVersion: 4`) monolith — frontend + Nitro API in single package
- **Language**: TypeScript 6 + Vue 3.5 (`<script setup lang="ts">`)
- **UI**: Naive UI 2.44 (direct imports, never global) + Tailwind CSS v4 (utility only, no preflight)
- **State**: Pinia 4 (`@pinia/nuxt`)
- **ORM**: TypeORM 1.1 with **EntitySchema pattern** (not class decorators)
- **Database**: SQLite via `better-sqlite3` — `db.sqlite` in `apps/web/`
- **Validation**: Zod 3.24 (DTOs in `server/dto/`)
- **Auth**: JWT (`jsonwebtoken`), 24h expiry, stored in localStorage + cookie
- **Animation**: Anime.js 4.5 via `usePageTransition` composable
- **Icons**: `@vicons/carbon` — render with `h(NIcon, null, { default: () => h(IconName) })`

## Commands (from `apps/web/`)

```bash
npm run dev              # Nuxt dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # All vitest tests (unit + nuxt)
npm run test:unit        # Unit tests only (node env)
npm run test:nuxt        # Component tests only (nuxt env)
npm run test:e2e         # E2E (Playwright, requires dev server)
npm run test:e2e:debug   # E2E debug mode
npm run storybook        # Storybook on :6006
npm run build-storybook  # Static Storybook build
npm run migration:generate  # Generate TypeORM migration
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration
```

**No lint or typecheck scripts exist.** TypeScript is enforced via `nuxt.config.ts` (`typescript.strict: true`) and `vue-tsc`.

## Architecture

### Data Flow
```
Client → Nuxt Middleware (auth.ts, JWT from cookie/header)
  → Nitro Route Handler → Zod DTO validation
  → Service layer (plain object, not class)
  → TypeORM (SQLite) → Response
```

### RBAC Flow
```
Request → JWT validation → User lookup → Role resolution
  → Guard check (deny URLs → allow URLs)
  → Permission check (method + URL pattern match)
  → ALLOW / 403
```

### Entities (23 EntitySchemas, 26 physical tables)

Canonical source: `server/utils/orm-data-source.ts` — imports all schemas and migrations. `server/utils/db.ts` re-exports from here. **Do not duplicate entity lists elsewhere.**

Key entities: User, Role, Permission, PermissionMethod, PermissionUrl, Guard, GuardUrl, ActivityLog, Setting, GlobalTable, GlobalTableColumn, GlobalTableRow, Component (+ ComponentVersion, ComponentDataRequirement), Template (+ TemplateVersion), TemplateBinding, Administration (+ AdministrationStep, AdministrationVersion), AdministrationRun, Document.

Junction tables: `users_roles`, `roles_guards`, `roles_permissions`.

### Database

- Dev: `synchronize: true` (schema auto-syncs, no migrations)
- Production: `synchronize: false`, migrations auto-run on boot (`migrationsRun: true`)
- Seed: Auto-runs on server start via `server/plugins/database.server.ts`
- Reset: Delete `apps/web/db.sqlite`, restart dev server

## Frontend Conventions

### Component Rules
- **Composition API** with `<script setup lang="ts">` — mandatory
- **Naive UI first** — use Naive UI components, Tailwind for utility only (spacing, flexbox)
- **Direct imports per component** — `import { NButton } from 'naive-ui'`, never global
- **No `NDescriptions`/`NDescriptionsItem`** — use `.detail-view` CSS pattern for detail views
- All components auto-imported from `app/components/` (base, common, features, layout dirs)

### Key Composables
- `useApi()` — Axios with auth interceptor + 401/403 handling
- `useAuthorization()` — `hasRole()`, `hasPermission()`, `canAccessUrl()`
- `useDataTable()` — search, sort, column visibility, server-side pagination
- `usePageTransition()` — Anime.js helpers (fadeInUp, staggerFadeIn, etc.)
- Feature composables: `useUsersData`, `useRolesData`, `useGlobalTablesData`, `useTemplatesData`, `useComponentsData`, `useAdministrationsData`, `useRunsData`, etc.

### Import Aliases
- `~/` → `app/` root (e.g., `~/stores/auth`, `~/utils/error`)
- `@/` → `shared/types/` (e.g., `@/shared/types/user`)
- `~~/` → server root (e.g., `~~/server/utils/db`, `~~/server/services/auth.service`)

### State Persistence
- JWT: `localStorage` + cookie (`accessToken`)
- User data: `localStorage` (key: `user`)
- Column visibility: `localStorage` (per DataTable)

## Backend Conventions

### Service Pattern
Services are **plain objects with async methods**, not classes:
```typescript
export const {Module}Service = {
  async findAll(query: QueryInput) { /* ... */ },
  async findOne(id: number) { /* ... */ },
  async create(data: CreateInput) { /* ... */ },
  async update(id: number, data: UpdateInput) { /* ... */ },
  async remove(id: number) { /* ... */ },
}
```

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

### Error Handling
- Server: `createError({ statusCode, message })` from `h3`
- Client: `getErrorMessage(e)` utility + NAlert for 403

### Common Query Parameters (list endpoints)
- `page` (default: 1), `limit` (default: 20, max: 100)
- `search` (global), `searchField` (specific field)
- `sortBy` (default: 'id'), `sortOrder` (ASC/DESC, default: 'DESC')

Response format: `{ data: [...], total, page, limit, totalPages }`

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Entity file | `{name}.entity.ts` | `user.entity.ts` |
| Service file | `{name}.service.ts` | `users.service.ts` |
| Service export | `{Name}Service` (object) | `UsersService` |
| DTO file | `{name}.dto.ts` | `users.dto.ts` |
| DTO schema | `{Verb}{Name}Schema` | `CreateUserSchema`, `QuerySchema` |
| API route | `{method}.post.ts`, `[id].get.ts` | `login.post.ts` |
| Composable | `use{Name}.ts` | `useApi.ts` |
| Store | `{name}.ts` | `auth.ts` |
| Component | `{Name}.vue` | `DataTable.vue` |
| Shared type | `{name}.ts` in `shared/types/` | `user.ts` |
| File naming | kebab-case for non-component files | `use-page-transition.ts` |

## E2E Testing (Playwright)

- Runs **headed by default** (browser visible). Set `HEADLESS=1` or `CI=true` for headless.
- Slow motion: `SLOWMO_MS=0` for full speed (default: 100ms in headed mode).
- Auto-starts dev server on port 3000 (`reuseExistingServer: true`).
- Video: `retain-on-failure`. Chromium only.

## Adding a New Entity

1. Create entity: `server/entities/{name}.entity.ts`
2. Register in `server/utils/orm-data-source.ts` (`appEntities` array)
3. Create DTO: `server/dto/{name}.dto.ts`
4. Create service: `server/services/{name}.service.ts`
5. Create API routes: `server/api/{name}/`
6. Create shared type: `shared/types/{name}.ts`
7. Create frontend: page, store, composables, components

## Important Gotchas

- **Native addons**: `better-sqlite3` and `bcrypt` may need rebuild after `npm install`
- **JWT secret**: Set `JWT_SECRET` env var for production (default: `default-secret-change-me`)
- **Password security**: Always hash with bcrypt, never return in API responses
- **Naive UI theming**: Defined in `app/utils/naiveui-theme.ts` via `GlobalThemeOverrides`
- **Primary color**: `#3B82F6` (Blue 500), font: Inter, border-radius: 6px/4px/8px
- **Animations**: Respect `prefers-reduced-motion`
- **Access denied**: 403 → NAlert + dispatch `rbac-denied` custom event
- **DB synced entities**: 23 EntitySchemas, 26 physical tables — check `orm-data-source.ts` for canonical list

## Documentation

- `docs/PRD.md` — Product requirements
- `docs/architecture.md` — System architecture, API endpoints
- `docs/database.md` — Entity schema, relationships, seed data
- `docs/design-system.md` — Design tokens, component specs
- `docs/dynamic-administration/` — Wiki and knowledge graph for Dynamic Administration design
- `tasks/` — Current implementation task lists
- `.ua/` — Knowledge graph (754 nodes, 1036 edges mapping project structure)
