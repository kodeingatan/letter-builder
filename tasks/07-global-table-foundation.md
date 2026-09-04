# Task 07 — Global Table Foundation

## Status

TODO

## Objective

Enable Designers to define dynamic data structures (Global Tables) as metadata — `name` + `displayName` — without developer-written migrations, entities, or controllers.

## Context

Global Table is the Data Engine and foundation of the entire platform chain (`Global Table → Component → Template → Administration → Document`). Every downstream module consumes Global Table metadata. RBAC foundation (tasks 01–06) is DONE; this is the first Dynamic Administration task. Source: `docs/dynamic-administration/wiki/global-table.md`, `docs/dynamic-administration/wiki/final-concept.md`, `docs/database.md` (PLANNED §1).

## Scope

### In Scope

- Global Table metadata CRUD (name, displayName)
- List/browse with DataTable conventions (search, sort, pagination, column visibility)
- Detail view with `.detail-view` pattern
- RBAC protection on all endpoints
- Activity logging for create/update/delete

### Out of Scope

- Column definitions (Task 08)
- Row data storage/entry (Task 12)
- Relations (Task 11), computed fields (Task 10)
- Auto-generated menus (Task 21)

## Actors

- Designer (Admin Platform) — creates/edits/deletes Global Tables
- System Administrator — grants Designer permissions via RBAC

## Dependencies

- RBAC foundation (tasks 01–06): auth, roles, permissions, guards, DataTable, activity-logs — DONE
- No other Dynamic Administration task

## Requirements

- REQ-001: Designer can create a Global Table with technical `name` and `displayName`.
- REQ-002: Designer can list/search/sort/paginate Global Tables via standard DataTable.
- REQ-003: Designer can view detail of a Global Table (including column count, usage references).
- REQ-004: Designer can rename `displayName` without breaking references.
- REQ-005: Designer can delete a Global Table only if unreferenced (columns may cascade; external references block).
- REQ-006: All operations require authentication + RBAC permission; all mutations write activity logs.

## Business Rules

- BR-001: `name` must be unique (case-insensitive), 1–64 chars, `^[a-z][a-z0-9_]*$` (snake_case, must start with letter).
- BR-002: `displayName` required, 1–100 chars.
- BR-003: `name` is immutable after creation (rename = new table + migration path, out of scope); only `displayName` is editable.
- BR-004: A Global Table referenced by any column relation (`relationTableId`), component binding source, template binding, or administration step data cannot be deleted.
- BR-005: Reserved names blocked: `users`, `roles`, `permissions`, `guards`, `settings`, `activity_logs`, `migrations`.

## Domain

```text
GLOBAL TABLE (metadata)
    │
    └── (Tasks 08, 11, 12 attach here)
            ├── COLUMN (Task 08)
            ├── RELATION (Task 11)
            └── ROW DATA (Task 12)
```

## Data Model

### global_tables

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto-increment |
| name | VARCHAR(64) UNIQUE | Yes | Technical name, snake_case, immutable |
| displayName | VARCHAR(100) | Yes | Human-readable name, editable |
| createdAt | DATETIME | — | Auto |
| updatedAt | DATETIME | — | Auto |

Indexes: PK(id), UNIQUE(name). EntitySchema pattern per AGENTS.md; register in `server/utils/db.ts`.

## API

Follows `docs/architecture.md` conventions (Zod DTO, service object, paginated response).

### List

`GET /api/global-tables?page&limit&search&searchField&sortBy&sortOrder` → `{ data, total, page, limit, totalPages }`. Search fields: All, name, displayName.

### Create

`POST /api/global-tables` `{ name, displayName }` → `201 { id, name, displayName, ... }`. 409 on duplicate name. 422 on invalid name pattern.

### Detail

`GET /api/global-tables/:id` → table + `{ columnCount, referencedBy: { relations, bindings } }`.

### Update

`PUT /api/global-tables/:id` `{ displayName }` only → `200`. Reject `name` change with 422.

### Delete

`DELETE /api/global-tables/:id` → `204`. 409 with `referencedBy` detail if blocked by BR-004.

## UI/UX

### Information Architecture

Sidebar group **Data** (new, above User Management) → `Data > Global Tables` → `/dashboard/data/global-tables`. Detail opens in drawer (`.detail-view`).

### User Flow

List → [Create] → modal form → success toast + refresh → row [View/Edit/Delete] → drawer/modal/confirm.

### List

DataTable (mandatory features per design-system): global search (min 320px, debounce 300ms), field-specific search, column visibility (localStorage), server-side sorting (default `id DESC`), pagination 10/20/50/100, Refresh button.

### Editor

NModal form: `name` (NInput, disabled on edit, live snake_case hint + uniqueness check), `displayName` (NInput). Inline validation messages.

### Detail

`.detail-view` drawer: Name (mono), Display Name, Columns count, Referenced By list, Created/Updated At. Footer: Edit + Delete buttons.

### Interaction

Delete → NPopconfirm with reference warning. 403 → NAlert "Access Denied" + `rbac-denied` event.

### States

loading (NSpin overlay), empty (NEmpty "No global tables found — Create your first table"), error (NAlert dismissable), validation (inline), permission denied (NAlert).

### Responsive Behavior

Toolbar wraps on mobile (search full-width); table horizontal scroll; drawer full-screen on <640px.

## Validation

- Zod: `name` regex + max, `displayName` required + max. Server re-validates; client mirrors for instant feedback.

## Security & Permission

- All routes Bearer + RBAC. Seed permissions: `Global Table Management` (methods GET/POST/PUT/DELETE, urls `/api/global-tables/*`); assign to Admin role. Designer = Admin-role user (per PRD §7).
- Activity log entity `GlobalTable` on every mutation.

## Acceptance Criteria

### AC-001

Given Designer is on Global Tables page, when clicking Create and submitting valid name/displayName, then the table appears in the list and a success toast shows.

### AC-002

Given a duplicate or malformed `name`, when submitting, then a 409/422 error is shown inline and no record is created.

### AC-003

Given a Global Table referenced by another resource, when deleting, then deletion is blocked with 409 listing the references.

### AC-004

Given a user without the permission, when calling any endpoint or opening the page, then 403 / Access Denied NAlert appears.

### AC-005

Given tables exist, when searching/sorting/paginating, then results are server-side correct and column visibility persists after reload.

## Implementation

### Backend

- [ ] Entity (`server/entities/global-table.entity.ts`, EntitySchema)
- [ ] Register in `server/utils/db.ts`
- [ ] DTO (`server/dto/global-tables.dto.ts`: Create/GlobalTableQuery schemas)
- [ ] Service (`server/services/global-tables.service.ts`: findAll/findOne/create/update/remove + reference check)
- [ ] Controller routes (`server/api/global-tables/index.get/post, [id].get/put/delete`)
- [ ] Authorization (Bearer + permission check + activity logger)
- [ ] Seed permission in database plugin
- [ ] Unit tests (name validation, delete-block logic)
- [ ] Integration/API tests (CRUD + 409 + 403)

### Frontend

- [ ] Types (`shared/types/global-table.ts`)
- [ ] API service + Pinia store (`globalTables`)
- [ ] Page (`app/pages/dashboard/data/global-tables.vue`)
- [ ] Components (`GlobalTableTable`, `GlobalTableFormModal`, `GlobalTableDetailDrawer`)
- [ ] Sidebar menu entry under new **Data** group (Designer-visible)
- [ ] Form validation, loading/empty/error/success states, responsive
- [ ] Unit tests + E2E tests (create → list → delete-block)

## Verification

- [ ] Typecheck, Lint
- [ ] Unit + Integration/API + E2E tests pass
- [ ] Database verification (unique constraint, timestamps)
- [ ] Permission verification (403 for unauthorized, allowed for Designer)
- [ ] UI/UX + Responsive + Design System verification (DataTable features, `.detail-view`, no NDescriptions)

## Assumptions

- SQLite `synchronize: true` dev mode; no migrations needed yet.
- Designer role maps to existing Admin role + new permission.

## Open Questions

- Should `displayName` support i18n keys later, or plain text is enough for v1?
- Do we need soft-delete for audit recovery, or hard delete is acceptable?

## Related Knowledge

- `docs/PRD.md` (§8.1, §10.2, §11)
- `docs/architecture.md` (Dynamic Layers, API Endpoints)
- `docs/database.md` (PLANNED §1)
- `docs/design-system.md` (Table, Detail View)
- `docs/dynamic-administration/wiki/global-table.md`, `final-concept.md`, `core-object-model.md`

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
