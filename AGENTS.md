# Agent Guide

## Project Structure

Single Nuxt 4 package:
- `app/` — Nuxt 4 monolith (frontend + API)
- `docs/` — Architecture & design documentation
- `tasks/` — Implementation task lists
- `stories/` — Storybook stories & tests (root level)

## Nuxt App (app/)

**Commands** (run from `app/`):
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

**Directory Structure**:
```
app/
├── app/
│   ├── app.vue                     # Root component
│   ├── pages/                      # File-based routing
│   │   ├── login.vue
│   │   ├── register.vue
│   │   └── dashboard/
│   │       ├── index.vue
│   │       ├── profile.vue
│   │       ├── users.vue
│   │       ├── roles.vue
│   │       ├── permissions.vue
│   │       ├── guards.vue
│   │       ├── activity-logs.vue
│   │       ├── system-logs.vue
│   │       └── settings.vue
│   ├── layouts/
│   │   ├── default.vue             # AppLayout (sidebar + header)
│   │   └── auth.vue                # AuthLayout (login/register)
│   ├── components/
│   │   ├── base/                   # Base components (Button)
│   │   ├── common/                 # Common (AuthForm, FormField, DataTable)
│   │   ├── layout/                 # Layout (AppLayout)
│   │   └── features/               # Feature-specific components
│   ├── composables/                # Vue composables
│   ├── plugins/                    # Nuxt plugins (client-only)
│   ├── middleware/                 # Route middleware
│   ├── assets/                     # CSS, images
│   ├── stores/                     # Pinia stores
│   └── utils/                      # Utility functions
│
├── server/
│   ├── api/                        # API routes (Nitro)
│   ├── entities/                   # TypeORM entities
│   ├── services/                   # Business logic
│   ├── dto/                        # Zod validation schemas
│   ├── utils/                      # Server utilities (JWT, bcrypt, RBAC)
│   ├── middleware/                 # Server middleware
│   └── plugins/                    # Server plugins (DB init, seeder)
│
├── shared/
│   └── types/                      # Shared TypeScript types
│
├── public/                         # Static assets
├── test/                           # Test files
│   ├── unit/                       # Unit tests (vitest, node env)
│   │   ├── utils/                  # Utility function tests
│   │   └── composables/            # Pure function tests
│   ├── nuxt/                       # Component tests (vitest, nuxt env)
│   │   └── components/             # mountSuspended tests
│   └── e2e/                        # E2E tests (Playwright)
├── vitest.config.ts                # Vitest config (unit + nuxt)
├── playwright.config.ts            # Playwright config (e2e)
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```

**Key conventions**:
- Nuxt 4 with `future.compatibilityVersion: 4`
- UI: **Naive UI** + **Tailwind CSS v4**
- Tailwind CSS v4 without preflight (Naive UI compatibility)
- State: **Pinia** (import from `pinia`)
- API: Nitro server routes in `server/api/`
- Database: TypeORM + better-sqlite3
- Auth: JWT (stored in localStorage as `accessToken`)
- Types: `shared/types/` (import via `~/shared/types/`)
- Components: auto-imported from `app/components/`
- Composables: auto-imported from `app/composables/`
- Import alias: `~/` → `app/` root

**Routing**: Nuxt file-based routing from `app/pages/`
- `/login` — LoginPage (guest only)
- `/register` — RegisterPage (guest only)
- `/dashboard` — DashboardPage (requires auth)
- `/dashboard/users` — UsersPage (requires auth)
- `/dashboard/roles` — RolesPage (requires auth)
- `/dashboard/permissions` — PermissionsPage (requires auth)
- `/dashboard/guards` — GuardsPage (requires auth)
- `/dashboard/activity-logs` — ActivityLogsPage (requires auth)
- `/dashboard/system-logs` — SystemLogsPage (requires auth)
- `/dashboard/settings` — SettingsPage (requires auth)

**Sidebar Menu** (AppLayout):
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

## Server (Nitro)

**API Routes** in `server/api/`:

| Module | Endpoint Prefix | Description |
|--------|----------------|-------------|
| Auth | `/api/auth` | Register, Login, Profile |
| Users | `/api/users` | User CRUD |
| Roles | `/api/roles` | Role CRUD |
| Permissions | `/api/permissions` | Permission CRUD |
| Guards | `/api/guards` | Guard CRUD |
| Activity Logs | `/api/activity-logs` | Audit trail |
| System Logs | `/api/system-logs` | Log viewer |
| Settings | `/api/settings` | App settings |
| Storage | `/api/storage` | File serving |

**RBAC**: Server middleware validates JWT + checks roles/permissions via `server/utils/rbac.ts`.

**Database**: SQLite via TypeORM — 9 entities, `synchronize: true`
- See `docs/database.md` for full schema

## Storybook

`app/.storybook/` config, stories in `app/stories/`.
Start Storybook first (`npm run storybook` in `app/`) before using MCP features.

## Gotchas

- Single package — always run commands from `app/`
- `better-sqlite3` and `bcrypt` are native addons — may need rebuild after install
- JWT secret: set `JWT_SECRET` env var for production
- Uploaded files stored in `app/storage/` (gitignored)
- To re-seed database: delete `app/db.sqlite` then restart dev server
