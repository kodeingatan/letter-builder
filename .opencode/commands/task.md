---
description: Generate or update an SDD task specification from a single feature/context parameter
---

Generate or update a task specification using exactly one parameter.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the complete task/feature context.

Follow this workflow strictly.

# 1. Read Project Knowledge

Before generating the task, inspect and understand:

* `AGENTS.md`
* `docs/PRD.md`
* `docs/architecture.md`
* `docs/database.md`
* `docs/design-system.md`
* all existing files inside `tasks/`

Do not generate the task based only on the user input.

The task must be consistent with the project's Permanent Knowledge.

---

# 2. Understand Existing Tasks

Inspect the existing `tasks/` directory.

Determine:

* latest task number
* existing task naming convention
* whether the requested feature already exists
* whether the request is a new feature
* whether it is an enhancement to an existing task
* whether an existing task should be updated instead of creating a duplicate

Never create duplicate tasks.

If an existing task represents the same feature, update that task instead of creating another task.

---

# 3. Determine Task Identity

If creating a new task:

Determine the next sequential number.

Example:

```text
tasks/
├── 01-authentication.md
├── 02-user-management.md
└── 03-global-table.md
```

New task:

```text
tasks/04-component.md
```

Use:

```text
NN-kebab-case-name.md
```

Examples:

```text
04-component.md
05-template.md
06-role-permission.md
07-dashboard.md
```

The task filename must be concise and domain-oriented.

---

# 4. Determine Scope

Analyze the request and determine:

* objective & tujuan feature
* actors / users
* use cases
* functional requirements
* business rules & edge cases
* domain entities, relationships, states, domain rules, invariants
* API requirements (route, method, request, response, validation, error, authentication, authorization)
* database impact
* UI/UX impact (halaman, layout, component, interaction, responsive, loading/empty/error/success, accessibility)
* frontend & backend requirements
* acceptance criteria (Given/When/Then)
* tasks / implementation checklist
* testing & verification requirements

Do not invent requirements that contradict the Permanent Knowledge.

If information is missing, make the smallest reasonable assumption and explicitly document it under `Assumptions`.

---

# 5. Generate Mini-Specification

Every task MUST be a complete mini-specification.

Do not create simple TODO documents.

Gunakan template kanonik berikut. Semua header bertanda **MANDATORY** wajib ada — jangan dihapus, jangan diganti nama, jangan digabung. Jika tidak relevan, isi `N/A` dengan alasan di `Assumptions`.

````md
# Task NN — {Task Name}

## Status

TODO

## Objective

{Jelaskan tujuan feature secara ringkas — apa yang diselesaikan task ini}

## Context

{Mengapa feature ini ada dan bagaimana posisinya dalam produk / roadmap}

## Scope

### In Scope

- ...

### Out of Scope

- ...

## Requirements

> MANDATORY — tidak boleh kosong.

### Tujuan Fitur

- REQ-G01: {tujuan utama — business goal yang ingin dicapai}

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| {Administrator} | {dapat mengelola ...} | {role/permission} |
| {End User} | ... | ... |

### Use Cases

| ID | Actor | Skenario | Hasil |
|----|-------|----------|-------|
| UC-01 | {Administrator} | {membuat Global Table baru} | {tabel tersimpan & dapat digunakan} |
| UC-02 | ... | ... | ... |

### Functional Requirements

- FR-001: {sistem harus ...}
- FR-002: ...
- FR-003: ...

### Business Rules

- BR-001: {aturan bisnis eksplisit}
- BR-002: ...

### Edge Cases

| ID | Kondisi | Penanganan |
|----|---------|------------|
| EC-01 | {input duplikat / kosong / network failure} | {validasi / 409 / retry} |
| EC-02 | ... | ... |

## Domain

> MANDATORY

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| {GlobalTable} | {struktur data dinamis} | id, name, slug |
| ... | ... | ... |

### Relationships

```text
{EntityA} ──1:N── {EntityB}  (contoh: GlobalTable 1:N GlobalTableColumn)
```

- REL-01: {kardinalitas & cascade}
- REL-02: ...

### States

| State | Deskripsi | Transisi Diizinkan |
|-------|-----------|--------------------|
| {DRAFT} | {belum dipublish} | DRAFT → PUBLISHED |
| {PUBLISHED} | ... | ... |

Jika stateless CRUD, tulis `N/A — stateless CRUD` dan jelaskan.

### Domain Rules

- DR-01: {contoh: Component tidak dapat dihapus jika masih dipakai Template}
- DR-02: ...

### Invariants

- INV-01: {kondisi yang harus selalu benar — contoh: Setiap GlobalTable minimal 1 kolom}
- INV-02: ...

### Data Model

#### {Entity}

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | number | Y | Y | auto | PK |
| ... | ... | ... | ... | ... | ... |

- Index: ...
- Constraint: ...

## API

> MANDATORY. Jika murni tanpa backend, tulis `N/A — No API` + alasan di Assumptions.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi |
|---|--------------|-------------|------|------------|-----------|
| 1 | `/api/global-tables` | GET | JWT | `global-table:list` | List + pagination |
| 2 | `/api/global-tables` | POST | JWT | `global-table:create` | Create |
| 3 | `/api/global-tables/:id` | GET | JWT | `global-table:read` | Detail |
| 4 | `/api/global-tables/:id` | PATCH | JWT | `global-table:update` | Update |
| 5 | `/api/global-tables/:id` | DELETE | JWT | `global-table:delete` | Delete |

### Detail per Endpoint

#### List — GET /api/...

- **Request**
  - Query: `page`, `limit`, `search`, `searchField`, `sortBy`, `sortOrder`
  - Headers: `Authorization: Bearer <JWT>`
- **Response**
  ```json
  { "data": [...], "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
  ```
- **Validation (Zod)**
  - `QuerySchema`: page min 1, limit 1–100, sortBy whitelist, ...
- **Error**
  | Status | Kondisi | Body |
  |--------|---------|------|
  | 400 | query tidak valid | `{ "message": "Validation failed", "errors": [...] }` |
  | 401 | tanpa token | `{ "message": "Unauthorized" }` |
  | 403 | permission tidak cukup | `{ "message": "Forbidden" }` |
  | 404 | data tidak ditemukan | `{ "message": "Not found" }` |
- **Authentication**: JWT via cookie/header, `auth` middleware
- **Authorization**: Guard + Permission check (`method + URL pattern`)

_(Ulangi blok ini untuk Create / Detail / Update / Delete sesuai kebutuhan)_

## UI

> MANDATORY untuk feature dengan antarmuka. Jika murni backend, tulis `N/A — No UI` + alasan.

### Halaman

| Route | Halaman | Akses | Deskripsi |
|-------|---------|-------|-----------|
| `/global-tables` | Global Table List | Admin | Daftar + search + pagination |
| `/global-tables/create` | Global Table Create | Admin | Form pembuatan |
| `/global-tables/:id` | Global Table Detail | Admin | Read-only + actions |

### Layout

- Navigasi: {sidebar / workspace / breadcrumb}
- Struktur halaman: {header + filter bar + data table + pagination}
- Penempatan: {di bawah menu "Master Data" → "Global Table"}

### Components

| Component | Lokasi | Deskripsi |
|-----------|--------|-----------|
| `GlobalTableDataTable.vue` | `app/components/features/global-table/` | Tabel dengan search, sort, visibility |
| `GlobalTableForm.vue` | `app/components/features/global-table/` | Form create/edit Naive UI |
| `GlobalTableDetail.vue` | `app/components/features/global-table/` | Detail `.detail-view` pattern |

### Interaction

- Trigger: {klik "Create" → buka editor}
- Flow: {validate → submit → toast → redirect}
- Konfirmasi: {hapus → NPopconfirm / NDialog}
- Navigasi balik: {breadcrumbs / back button}

### Responsive Behavior

| Breakpoint | Perilaku |
|------------|----------|
| Desktop (≥1024px) | Tabel penuh + sidebar terbuka |
| Tablet (768–1023px) | Kolom disembunyikan via visibility toggle |
| Mobile (<768px) | Card list / drawer, form full-width |

### States

| State | Tampilan | Komponen Naive UI |
|-------|----------|-------------------|
| Loading | Skeleton / NSpin | `NSpin`, `NSkeleton` |
| Empty | Illustration + CTA | `NEmpty` |
| Error | NAlert + retry | `NAlert` |
| Success | NMessage / NNotification | `useMessage()` |
| Validation | Inline error di field | `NFormItem` feedback |
| Permission Denied | NAlert 403 + event `rbac-denied` | `NAlert` |

### Accessibility

- Keyboard: semua aksi via keyboard, focus trap di modal
- ARIA: `aria-label` untuk icon-only button
- Kontras & font: ikuti `docs/design-system.md` (primary #3B82F6, Inter)
- Reduced motion: hormati `prefers-reduced-motion` untuk Anime.js

## Acceptance Criteria

> MANDATORY — minimal cover happy path + validation + business rules + error + empty + permission + edge case. Format Given / When / Then.

### AC-001 — {Judul kriteria}

Given {konteks / pre-condition}

When {aksi user / sistem}

Then {hasil yang dapat diverifikasi}

### AC-002 — {Judul kriteria}

Given ...

When ...

Then ...

## Tasks

> MANDATORY — daftar pekerjaan implementasi dengan checkbox. Dipakai oleh `/plan`, `/implement`, `/verify`, `/review`.

### Backend

- [ ] Entity — `server/entities/{name}.entity.ts` + registrasi di `server/utils/orm-data-source.ts`
- [ ] DTO — `server/dto/{name}.dto.ts` (Zod: Create/Update/Query)
- [ ] Service — `server/services/{name}.service.ts` (plain object)
- [ ] API Routes — `server/api/{name}/index.get.ts`, `index.post.ts`, `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`
- [ ] Auth & Authorization — middleware + guard/permission
- [ ] Validation & Error handling — Zod + `createError` h3
- [ ] Migration/Seed — jika `synchronize: false` / data awal
- [ ] Unit tests — service & DTO
- [ ] Integration/API tests — endpoint + RBAC

### Frontend

- [ ] Shared Types — `shared/types/{name}.ts`
- [ ] API Service / Composable — `app/composables/use{Name}Data.ts`
- [ ] Store (jika perlu) — `app/stores/{name}.ts`
- [ ] Pages — `app/pages/{route}/index.vue`, `create.vue`, `[id].vue`
- [ ] Components — `DataTable.vue`, `Form.vue`, `Detail.vue`
- [ ] Validation — Naive UI `NForm` + rules sinkron dengan Zod
- [ ] States — loading / empty / error / success / permission
- [ ] Responsive & Accessibility — breakpoint + ARIA + keyboard
- [ ] Unit tests — `vitest` (`test:unit` / `test:nuxt`)
- [ ] E2E tests — Playwright (`test:e2e`)

### Cross-Cutting

- [ ] RBAC matrix diperbarui
- [ ] ActivityLog / Audit jika diperlukan

## Verification

- [ ] Typecheck (`vue-tsc` / `nuxt typecheck`)
- [ ] Unit test (`npm run test:unit`)
- [ ] Component test (`npm run test:nuxt`)
- [ ] API test / Integration test
- [ ] E2E test (`npm run test:e2e`)
- [ ] Database verification (entity, constraint, migration)
- [ ] Permission verification (401/403 matrix)
- [ ] UI/UX verification (Naive UI + Tailwind, no `NDescriptions`)
- [ ] Responsive verification (desktop/tablet/mobile)
- [ ] Design System verification (`naiveui-theme.ts`, token)
- [ ] Accessibility verification (keyboard + ARIA + contrast)

## Assumptions

- ...

## Open Questions

- ...

## Related Knowledge

- `docs/PRD.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/design-system.md`

## Change Log

### Initial

- Task specification created.

````

7 bagian berikut MANDATORY dan tidak boleh dihapus (jika tidak relevan isi `N/A` + alasan di `Assumptions`):

```text
Requirements   (tujuan, users, use cases, functional, business rules, edge cases)
Domain         (entity, relationship, state, domain rules, invariant + data model)
API            (server route, HTTP method, request, response, validation, error, authentication, authorization)
UI             (halaman, layout, component, interaction, responsive, loading/empty/error/success, accessibility)
Acceptance     (Given / When / Then — kapan feature dianggap benar)
Tasks          (daftar pekerjaan implementasi — checkbox)
Verification   (checklist verifikasi kualitas)
```

---

# 6. Acceptance Criteria

Acceptance Criteria MUST be testable dan berada di `## Acceptance Criteria`.

Use:

```text
Given
When
Then
````

Avoid vague criteria such as:

```text
- Feature works correctly.
- UI looks good.
- CRUD works.
```

Instead:

```md
### AC-001 — Menampilkan editor Global Table

Given the user is on the Global Table list

When the user clicks "Create"

Then the Global Table editor is displayed.
```

Create enough acceptance criteria to cover:

* happy path
* validation
* error handling
* empty state
* permissions
* important business rules
* destructive actions
* edge cases

Setiap AC harus dapat dipetakan ke minimal satu item di `## Tasks`.

---

# 7. UI Specification

UI/UX adalah bagian dari task specification, bukan afterthought. Isi `## UI` dengan 7 sub-bagian wajib:

* halaman — route & daftar halaman
* layout — navigasi & struktur halaman
* component — daftar component Vue + lokasi file
* interaction — trigger, flow, konfirmasi, navigasi balik
* responsive behavior — desktop/tablet/mobile
* states — loading / empty / error / success / validation / permission denied
* accessibility — keyboard, ARIA, kontras, reduced-motion

Jika feature murni backend, tulis:

```md
## UI

N/A — No UI (backend only). Alasan: ...
```

dan jelaskan di `## Assumptions`.

The UI must follow the project's existing Design System (`docs/design-system.md`).

The application should not regress into a generic admin dashboard if the project's design direction specifies a modern desktop/workspace-oriented experience.

---

# 8. Cross-Document Consistency

After generating the task, verify consistency against:

```text
PRD
Architecture
Database
Design System
Existing Tasks
```

Check for:

* conflicting terminology
* conflicting entity names
* conflicting API conventions
* conflicting database rules
* conflicting UI patterns
* duplicated functionality
* dependency problems
* missing requirements
* kelengkapan 7 bagian mandatory (Requirements, Domain, API, UI, Acceptance, Tasks, Verification)

If a conflict is found:

DO NOT silently overwrite Permanent Knowledge.

Document it under:

```md
## Open Questions
```

and explain the conflict.

---

# 9. Do Not Implement

This command ONLY generates or updates the task specification plus `tasks/task-logs.md` (see #11).

Do NOT:

* modify application source code
* create entities
* create controllers
* create services
* create Vue/Nuxt components
* create migrations
* install packages
* run implementation

The output of this command is the SDD task specification + `tasks/task-logs.md` update only.

---

# 10. Final Response

After generating/updating the task, report:

```text
Task: tasks/NN-task-name.md

Action:
- CREATED
or
- UPDATED

Objective:
...

Affected Areas:
- Backend
- Frontend
- Database
- UI/UX

Dependencies:
...

Consistency:
- PRD: OK/CONFLICT
- Architecture: OK/CONFLICT
- Database: OK/CONFLICT
- Design System: OK/CONFLICT

Mandatory Sections:
- Requirements (tujuan/users/use cases/functional/business rules/edge cases): OK
- Domain (entity/relationship/state/domain rules/invariant): OK
- API (route/method/request/response/validation/error/auth/authz): OK
- UI (halaman/layout/component/interaction/responsive/loading/empty/error/success/accessibility): OK
- Acceptance (Given/When/Then): OK
- Tasks (daftar implementasi): OK
- Verification: OK

Task Logs:
- tasks/task-logs.md created/updated (see #11)

Next recommended step:

/plan tasks/NN-task-name.md
```

Do not provide implementation code unless explicitly requested.

---

# 11. Task Logs (Mandatory Final Step)

After the task specification is generated/updated, you MUST create or update `tasks/task-logs.md` to record what has NOT yet been implemented, verified, and reviewed.

This step is mandatory and is part of `/task` execution — do NOT skip it.

### 11.1 Rules

1. If `tasks/task-logs.md` does not exist → CREATE it using the same template as `/gen-tasks` #23.2, listing all `tasks/NN-*.md` (excluding `task-logs.md` itself).
2. If it already exists → UPDATE it:
   - add the current task (`tasks/NN-task-name.md`) if not yet listed,
   - preserve existing `[x]` states for already implemented/verified/reviewed items — never reset `[x]` to `[ ]`,
   - update `Last Updated` (`Date`, `By: /task`, `Source: $ARGUMENTS` summary),
   - update the `Overview` row and `Detail per Task` section for the current task,
   - ensure the current task appears under `Belum Implementasi` / `Belum Diverifikasi` / `Belum Direview` with `[ ]` unless it was already marked `[x]` by `/implement`, `/verify`, `/review`.
3. A newly created task via `/task` defaults to `[ ]` (belum) for Implemented, Verified, and Reviewed.
4. An updated task via `/task` (existing file edited) MUST NOT reset its existing `[x]` states.
5. Do NOT modify application source code in this step — only `tasks/task-logs.md`.

### 11.2 Verification

Before finishing `/task`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Current task is listed in Overview and Detail per Task
- [ ] Current task status in `tasks/task-logs.md` matches its `## Status` in `tasks/NN-*.md`
- [ ] No existing `[x]` was reset
