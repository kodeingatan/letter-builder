---
description: Generate the complete SDD task roadmap from one Core Concept and project context
---

# Generate Complete Tasks

Generate the complete `tasks/` specification roadmap from exactly ONE parameter containing the project's general information and Core Concept.

The user input is:

$ARGUMENTS

Treat `$ARGUMENTS` as the high-level product and Core Concept definition.

This command generates the FEATURE ROADMAP and MINI-SPECIFICATIONS.

It does NOT implement application code.

---

# 1. Objective

Transform one high-level Core Concept into a complete, logically ordered set of SDD task specifications.

The goal is to answer:

> "What features must be built to turn this Core Concept into a production-ready application?"

The output is:

```text
tasks/
├── 01-xxx.md
├── 02-xxx.md
├── 03-xxx.md
├── ...
└── NN-xxx.md
```

Every task must be a complete mini-specification.

Do NOT generate simple TODO lists.

---

# 2. Project Understanding

Before generating tasks, inspect the existing project.

Read:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
```

Also inspect:

```text
tasks/
```

if it already exists.

---

# 3. Understand Anything

If the project contains Understand Anything knowledge, use it as supplementary codebase context.

Check whether:

```text
.ua/
```

exists.

If available, use it to understand:

* existing modules
* existing entities
* existing relationships
* architecture
* dependencies
* existing features
* project boundaries
* implementation patterns

Priority:

```text
Current Source Code
        ↓
Tests / Configuration
        ↓
Understand Anything
        ↓
AGENTS.md
        ↓
Permanent Knowledge
        ↓
User Core Concept
```

When generating tasks for an existing project, do not generate tasks for functionality that already exists unless the user explicitly requests a rebuild or enhancement.

Do NOT modify `.ua/`.

---

# 4. Input

The entire input is:

```text
$ARGUMENTS
```

Example:

```text
/gen-tasks "Platform aplikasi bisnis dinamis dengan Core Concept Global Table → Component → Template → Administration. Administrator dapat mendefinisikan struktur data, membangun component, menyusun template, dan mengelola aplikasi secara dinamis."
```

The input may contain:

* product idea
* Core Concept
* business domain
* target users
* technology information
* major capabilities
* constraints
* high-level workflows

Do not require the user to provide a task list.

The command must derive the task list.

---

# 5. Core Concept Analysis

Extract:

### Product

What is being built?

### Users

Who uses the system?

### Business Domain

What business problem does it solve?

### Core Entities

What are the central entities?

### Relationships

How do the entities interact?

### Lifecycle

How does the system operate from beginning to production?

Represent the Core Concept as a model.

Example:

```text
Global Table
      │
      ▼
Component
      │
      ▼
Template
      │
      ▼
Administration
      │
      ▼
Generated Application
```

Do not assume this exact model.

Derive it from `$ARGUMENTS` and project knowledge.

---

# 6. Feature Decomposition

Break the Core Concept into functional capabilities.

Consider, where relevant:

```text
Foundation
Authentication
Authorization
User Management
Role & Permission
Core Domain
Configuration
Master Data
Transactions
Workflow
Search
Filtering
Import
Export
Notifications
Audit Log
Dashboard
Reporting
Settings
Administration
Integration
Security
Testing
Production Readiness
```

Do not blindly create every category.

Only generate capabilities relevant to the product.

---

# 7. Dependency Analysis

Determine the correct dependency order.

Example:

```text
Authentication
      ↓
User Management
      ↓
Role & Permission
      ↓
Global Table
      ↓
Component
      ↓
Template
      ↓
Administration
```

Tasks must be ordered based on actual dependencies.

Do NOT order tasks merely by UI navigation order.

---

# 8. Task Granularity

Each task should represent one meaningful feature capability.

GOOD:

```text
01-authentication.md
02-user-management.md
03-role-permission.md
04-global-table.md
05-global-table-column.md
06-component.md
07-component-property.md
08-template.md
09-administration.md
```

BAD:

```text
01-create-button.md
02-create-input.md
03-create-modal.md
04-create-table.md
```

UI elements should normally belong to the feature task that owns them.

Avoid both:

### Too Large

```text
01-build-entire-application.md
```

### Too Small

```text
01-add-button.md
02-add-input.md
```

The target is:

```text
Business Capability
        ↓
Feature Task
        ↓
Implementation Plan
```

---

# 9. Existing Tasks

If `tasks/` already contains tasks:

1. inspect all existing tasks
2. identify completed functionality
3. identify TODO functionality
4. identify overlapping tasks
5. identify missing capabilities
6. preserve existing valid tasks
7. update tasks only when necessary
8. never create duplicates

Do not renumber existing tasks casually.

If the existing task structure already represents the correct roadmap, extend it rather than rebuilding it.

---

# 10. Determine Task Number

For new tasks:

```text
NN-feature-name.md
```

Use sequential numbering.

Example:

```text
tasks/
├── 01-authentication.md
├── 02-user-management.md
├── 03-global-table.md
└── 04-component.md
```

If existing numbering contains gaps, preserve the existing numbering unless there is a strong reason to reorganize it.

Do not rename existing task files merely for cosmetic consistency.

---

# 11. Task Specification

Every generated task MUST be a mini-specification.

Gunakan template kanonik berikut. Semua header bertanda **MANDATORY** wajib ada — jangan dihapus, jangan diganti nama, jangan digabung. Jika tidak relevan, isi dengan `N/A` dan jelaskan alasan di `Assumptions`.

````md
# Task NN — {Task Name}

## Status

TODO | IN_PROGRESS | DONE

## Objective

{Jelaskan tujuan feature secara ringkas — apa yang diselesaikan task ini dalam konteks Core Concept}

## Context

{Mengapa feature ini ada, bagaimana posisinya dalam roadmap, dan ketergantungan terhadap task lain}

## Scope

### In Scope

- ...

### Out of Scope

- ...

## Requirements

> Bagian ini MANDATORY. Tidak boleh kosong.

### Tujuan Fitur

- REQ-G01: {tujuan utama feature — business goal yang ingin dicapai}

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| {Contoh: Administrator} | {dapat mengelola ...} | {role/permission} |
| {End User} | {mengisi ...} | ... |

### Use Cases

| ID | Actor | Skenario | Hasil |
|----|-------|----------|-------|
| UC-01 | {Administrator} | {membuat Global Table baru} | {tabel tersimpan & dapat digunakan di Component} |
| UC-02 | ... | ... | ... |

### Functional Requirements

- FR-001: {sistem harus ...}
- FR-002: {sistem harus ...}
- FR-003: ...

### Business Rules

- BR-001: {aturan bisnis eksplisit — contoh: Nama tabel harus unik}
- BR-002: ...
- BR-003: ...

### Edge Cases

| ID | Kondisi | Penanganan |
|----|---------|------------|
| EC-01 | {input kosong / duplikat / network failure} | {validasi / error message / retry} |
| EC-02 | ... | ... |

## Domain

> Bagian ini MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| {GlobalTable} | {struktur data dinamis} | id, name, slug, ... |
| ... | ... | ... |

### Relationships

```text
{EntityA} ──1:N── {EntityB}  (contoh: GlobalTable 1:N GlobalTableColumn)
{EntityB} ──N:1── {EntityC}
```

- REL-01: {penjelasan kardinalitas & cascade rule}
- REL-02: ...

### States

| State | Deskripsi | Transisi Diizinkan |
|-------|-----------|--------------------|
| {DRAFT} | {belum dipublish} | DRAFT → PUBLISHED |
| {PUBLISHED} | ... | PUBLISHED → ARCHIVED |

Jika tidak ada state machine, tulis `N/A — stateless CRUD` dan jelaskan.

### Domain Rules

- DR-01: {aturan domain — contoh: Component tidak dapat dihapus jika masih dipakai Template}
- DR-02: ...

### Invariants

- INV-01: {kondisi yang harus selalu benar — contoh: Setiap GlobalTable minimal memiliki 1 kolom}
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

> Bagian ini MANDATORY. Jika feature tanpa backend, tulis `N/A — No API` dan jelaskan di Assumptions.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi |
|---|--------------|-------------|------|------------|-----------|
| 1 | `/api/global-tables` | GET | JWT | `global-table:list` | List dengan pagination |
| 2 | `/api/global-tables` | POST | JWT | `global-table:create` | Create baru |
| 3 | `/api/global-tables/:id` | GET | JWT | `global-table:read` | Detail |
| 4 | `/api/global-tables/:id` | PATCH | JWT | `global-table:update` | Update |
| 5 | `/api/global-tables/:id` | DELETE | JWT | `global-table:delete` | Delete |

### Detail per Endpoint

#### List — GET /api/...

- **Request**
  - Query: `page`, `limit`, `search`, `searchField`, `sortBy`, `sortOrder` (ikuti konvensi AGENTS.md)
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
- **Authentication**: JWT via cookie/header, `auth` middleware
- **Authorization**: Guard + Permission check (`method + URL pattern`)

_(Ulangi blok ini untuk Create / Detail / Update / Delete)_

## UI

> Bagian ini MANDATORY untuk setiap feature yang memiliki antarmuka. Jika murni backend, tulis `N/A — No UI` dan jelaskan.

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
| `GlobalTableForm.vue` | `app/components/features/global-table/` | Form create/edit dengan Naive UI |
| `GlobalTableDetail.vue` | `app/components/features/global-table/` | Detail view `.detail-view` pattern |

### Interaction

- Trigger: {klik "Create" → buka editor}
- Flow: {validate → submit → optimistic / redirect → toast}
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
| Empty | Illustration + CTA "Create pertama" | `NEmpty` |
| Error | NAlert + retry button | `NAlert` |
| Success | NMessage / NNotification | `useMessage()` |
| Validation | Inline error di field | `NFormItem` feedback |
| Permission Denied | NAlert 403 + event `rbac-denied` | `NAlert` |

### Accessibility

- Keyboard: semua aksi via keyboard, focus trap di modal
- ARIA: `aria-label` untuk icon-only button
- Kontras & font: ikuti `docs/design-system.md` (primary #3B82F6, Inter, radius 6/4/8)
- Reduced motion: hormati `prefers-reduced-motion` untuk animasi Anime.js

## Acceptance Criteria

> MANDATORY. Minimal cover happy path + validation + business rules + error + empty + permission + edge case. Gunakan format Given / When / Then.

### AC-001 — {Judul kriteria}

Given {konteks / pre-condition}

When {aksi user / sistem}

Then {hasil yang dapat diverifikasi}

### AC-002 — {Judul kriteria}

Given ...

When ...

Then ...

_(tambahkan AC-003 dst. sesuai kebutuhan)_

## Tasks

> MANDATORY. Daftar pekerjaan implementasi yang dapat di-CENTANG (checkbox). Dipakai oleh `/plan`, `/implement`, `/verify`, `/review`.

### Backend

- [ ] Entity — `server/entities/{name}.entity.ts` + registrasi di `server/utils/orm-data-source.ts`
- [ ] DTO — `server/dto/{name}.dto.ts` (Zod: Create/Update/Query)
- [ ] Service — `server/services/{name}.service.ts` (plain object, bukan class)
- [ ] API Routes — `server/api/{name}/index.get.ts`, `index.post.ts`, `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`
- [ ] Auth & Authorization — middleware + guard/permission check
- [ ] Validation & Error handling — Zod parse + `createError` h3
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

- [ ] RBAC matrix diperbarui (Role/Permission/Guard)
- [ ] ActivityLog / Audit jika diperlukan
- [ ] Dokumentasi singkat (`docs/` atau inline)

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
- `.ua/` (jika ada)

## Change Log

### Initial

- Task generated from Core Concept.

````

Hanya sertakan bagian opsional tambahan jika benar-benar relevan. Namun **7 bagian berikut MANDATORY dan tidak boleh dihapus**:

```text
Requirements   (tujuan, users, use cases, functional, business rules, edge cases)
Domain         (entity, relationship, state, domain rules, invariant + data model)
API            (server route, HTTP method, request, response, validation, error, authentication, authorization)
UI             (halaman, layout, component, interaction, responsive, loading/empty/error/success, accessibility)
Acceptance     (Given / When / Then — kapan feature dianggap benar)
Tasks          (daftar pekerjaan implementasi — checkbox)
Verification   (checklist verifikasi kualitas)
```

Jika salah satu tidak relevan, isi `N/A` dengan alasan di `Assumptions` — jangan hapus headernya.

---

# 12. UI Requirements

Every user-facing task MUST contain UI requirements dengan granularitas sesuai template di atas (halaman, layout, component, interaction, responsive, states, accessibility).

Do not leave:

```text
## UI

TBD
```

unless the feature genuinely has no user interface — dalam kasus ini tulis `N/A — No UI` + alasan di `Assumptions`.

Consider:

* information architecture
* navigation / workspace
* list / detail / editor / form
* actions / dialogs / confirmation
* feedback / toast
* loading / empty / error / validation / permission denied / success
* responsive behavior (desktop/tablet/mobile)
* accessibility (keyboard, ARIA, contrast, reduced-motion)

Follow:

```text
docs/design-system.md
```

and existing UI implementation.

Do not create a generic admin dashboard if the project's design language specifies a desktop/workspace-oriented application.

---

# 13. Business Rules

Business rules must be explicit dan berada di `## Requirements > ### Business Rules` serta dilengkapi `Edge Cases`.

Example:

```md
### Business Rules

- BR-001: Table name must be unique.
- BR-002: Column name must be unique within a table.
- BR-003: A table must contain at least one column.
- BR-004: A table already referenced by another resource cannot be deleted.

### Edge Cases

| ID | Kondisi | Penanganan |
|----|---------|------------|
| EC-01 | Nama tabel duplikat | Tolak dengan 409 + pesan "Nama sudah digunakan" |
| EC-02 | Hapus tabel yang masih dipakai Component | Tolak dengan 409 + daftar referensi |
```

Do not invent business rules without evidence.

When a rule cannot be determined, put it under:

```md
## Open Questions
```

---

# 14. Acceptance Criteria

Acceptance Criteria MUST be testable dan berada di `## Acceptance Criteria`.

Gunakan format:

```text
Given
When
Then
```

Cover:

* happy path
* validation
* business rules
* error handling
* empty state
* permissions
* important edge cases

Example:

```md
### AC-001 — Menampilkan editor Global Table

Given the administrator is on the Global Table page

When the administrator clicks Create

Then the Global Table editor is displayed.
```

Setiap AC harus dapat dipetakan ke setidaknya satu item di `## Tasks`.

---

# 15. API Specification

Define API requirements di `## API` dengan ke-8 kolom/field wajib:

`server route`, `HTTP method`, `request`, `response`, `validation`, `error`, `authentication`, `authorization`.

Follow existing project API conventions (`AGENTS.md` — Service pattern, Nitro route, Zod DTO, `createError` dari `h3`, pagination `page/limit/search/sortBy/sortOrder`).

Do not invent API patterns that conflict with:

```text
docs/architecture.md
```

or existing implementation.

Jika endpoint tidak butuh auth, jelaskan eksplisit `Auth: Public` + alasan.

---

# 16. Database Specification

Define database impact di `## Domain` (Entities, Relationships, States, Domain Rules, Invariants + Data Model).

Use:

```text
docs/database.md
```

and existing entities as references.

Identify:

* new entities
* modified entities
* relationships (1:1, 1:N, N:M) + cascade
* indexes / unique constraints
* migrations / seed
* lifecycle / state machine + invariants

Do not redesign the entire database for one task.

---

# 17. Production Readiness

The generated roadmap should consider the complete product lifecycle.

When relevant, include final tasks for:

```text
Security
Audit Log
Error Handling
Observability
Performance
Testing
E2E
Accessibility
Responsive UX
Documentation
Deployment
Production Configuration
Backup / Recovery
```

Do not generate irrelevant tasks.

---

# 18. Task Dependency Map

After generating the task list, create a dependency map.

Example:

```text
01 Authentication
       │
       ▼
02 User Management
       │
       ▼
03 Role & Permission
       │
       ├──────────────┐
       ▼              ▼
04 Global Table     06 Component
       │              │
       └──────┬───────┘
              ▼
        08 Template
              │
              ▼
       09 Administration
              │
              ▼
       10 Generated App
```

The dependency map is used to validate task ordering.

---

# 19. Completeness Check

Before finishing, verify that setiap task mencakup 7 bagian mandatory dan roadmap secara keseluruhan mencakup:

### Product

* [ ] Core Concept terpetakan ke Requirements.tujuan & use cases
* [ ] Main user workflows → Requirements.use cases + UI.interaction
* [ ] Main entities → Domain.entities
* [ ] Core business rules → Requirements.business rules + Domain.domain rules/invariants

### Backend

* [ ] API (route, method, request, response, validation, error, authentication, authorization)
* [ ] Domain (entity, relationship, state, domain rules, invariant)
* [ ] Database (Data Model + migration)
* [ ] Validation (Zod)
* [ ] Authorization (Guard/Permission)
* [ ] Error handling (`createError`)

### Frontend

* [ ] Halaman + Layout
* [ ] Components
* [ ] Interaction
* [ ] States (loading/empty/error/success/permission/validation)
* [ ] Responsive behavior
* [ ] Accessibility

### Quality

* [ ] Acceptance (Given/When/Then — kapan feature dianggap benar)
* [ ] Tasks (daftar pekerjaan implementasi)
* [ ] Unit tests
* [ ] Integration/API tests
* [ ] E2E tests
* [ ] UI/UX verification
* [ ] Security
* [ ] Performance where relevant

### Production

* [ ] Observability
* [ ] Deployment
* [ ] Production configuration
* [ ] Documentation where relevant

Do not create separate tasks for these categories unless they represent meaningful capabilities.

---

# 20. Consistency Check

Validate every generated task against:

```text
AGENTS.md
docs/PRD.md
docs/architecture.md
docs/database.md
docs/design-system.md
Understand Anything
existing tasks
```

Check:

* terminology
* entities
* architecture
* dependencies
* API conventions
* database conventions
* UI/UX conventions
* task duplication
* task ordering
* kelengkapan 7 bagian mandatory (Requirements, Domain, API, UI, Acceptance, Tasks, Verification)

If a contradiction exists, do not silently invent a solution.

Record it under:

```text
Open Questions
```

---

# 21. Scope of Modification

This command may:

```text
create/update tasks/*.md
create/update tasks/task-logs.md
```

It MUST NOT:

```text
modify application source code
modify .ua/
modify AGENTS.md
modify docs/PRD.md
modify docs/architecture.md
modify docs/database.md
modify docs/design-system.md
```

unless explicitly requested by the user.

This command is for task decomposition only.

---

# 22. Final Output

After generation, return:

```text
Complete SDD Task Roadmap Generated

Input:
{short summary of Core Concept}

Tasks:
NN tasks generated

Created:
- tasks/01-xxx.md
- tasks/02-xxx.md
- tasks/03-xxx.md
...

Updated:
- ...

Skipped:
- ...

Core Concept:
{summary}

Dependency Flow:

01 → 02 → 03 → ...

Coverage:
- Authentication: ...
- Authorization: ...
- Core Domain: ...
- Database: ...
- API: ...
- Frontend: ...
- UI/UX: ...
- Testing: ...
- Production: ...

Mandatory Sections Check:
- Requirements (tujuan/users/use cases/functional/business rules/edge cases): OK
- Domain (entity/relationship/state/domain rules/invariant): OK
- API (route/method/request/response/validation/error/auth/authz): OK
- UI (halaman/layout/component/interaction/responsive/loading/empty/error/success/accessibility): OK
- Acceptance (Given/When/Then): OK
- Tasks (daftar implementasi): OK
- Verification: OK

Detected Conflicts:
- ...

Open Questions:
- ...

Task Logs:
- tasks/task-logs.md created/updated (see #23)

Next Step:

/plan
```

Do not implement any task.

The generated tasks are the source input for `/plan`.

---

# 23. Task Logs (Mandatory Final Step)

After all tasks in `tasks/` are generated/updated, you MUST create or update `tasks/task-logs.md` as the tracking log for what has NOT yet been implemented, verified, and reviewed.

This step is mandatory and is part of `/gen-tasks` execution — do NOT skip it.

### 23.1 Rules

1. Scan all `tasks/NN-*.md` files (excluding `tasks/task-logs.md` itself).
2. If `tasks/task-logs.md` does not exist → CREATE it using the template in 23.2.
3. If it already exists → UPDATE it:
   - preserve existing checklist states `[x]` for already implemented/verified/reviewed items,
   - add new tasks as unchecked `[ ]`,
   - remove entries for deleted task files,
   - update `Last Updated` section.
4. All newly generated tasks default to NOT YET implemented, verified, and reviewed (`[ ]`).
5. Do NOT modify application source code in this step — only `tasks/task-logs.md`.

### 23.2 Template for `tasks/task-logs.md`

```md
# Task Logs

> Auto-generated by `/gen-tasks` and `/task`. Updated by `/implement`, `/verify`, `/review`.
> Status checklist: `[ ]` = belum, `[x]` = sudah.

## Last Updated

- Date: {YYYY-MM-DD}
- By: /gen-tasks
- Source: {short summary of Core Concept / $ARGUMENTS}

## Overview

| Task File | Status | Implemented | Verified | Reviewed |
| --------- | ------ | ----------- | -------- | -------- |
| tasks/01-xxx.md | TODO | [ ] | [ ] | [ ] |
| tasks/02-xxx.md | TODO | [ ] | [ ] | [ ] |

## Belum Implementasi

- [ ] tasks/01-xxx.md — {Task Name}
- [ ] tasks/02-xxx.md — {Task Name}

## Sudah Implementasi

- (belum ada)

## Belum Diverifikasi

- [ ] tasks/01-xxx.md — {Task Name}
- [ ] tasks/02-xxx.md — {Task Name}

## Sudah Diverifikasi

- (belum ada)

## Belum Direview

- [ ] tasks/01-xxx.md — {Task Name}
- [ ] tasks/02-xxx.md — {Task Name}

## Sudah Direview

- (belum ada)

## Detail per Task

### tasks/01-xxx.md

- Status: TODO
- Implemented: [ ] —
- Verified: [ ] —
- Reviewed: [ ] —
- Notes: Task generated from Core Concept.
```

### 23.3 Verification

Before finishing `/gen-tasks`, ensure:

- [ ] `tasks/task-logs.md` exists
- [ ] Every `tasks/NN-*.md` is listed in Overview and Detail per Task
- [ ] Every new task appears under Belum Implementasi / Belum Diverifikasi / Belum Direview with `[ ]`
- [ ] Existing `[x]` states are not reset to `[ ]`
