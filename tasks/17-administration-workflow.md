# Task 17 — Administration Workflow

## Status

DONE

## Objective

Let Designers define multi-step data-collection workflows — ordered steps each optionally pinning a template version plus its own step schema — including multi-template administrations (e.g. Perjalanan Dinas → Surat Tugas + SPD + Rincian Biaya + Laporan).

## Context

Implements "Administration = Data Collection Process" + "Step = Data Gathering Session" + "Multi-Template". Administration is the workflow; Template is the per-step blueprint. Source: `wiki/administration.md`, `wiki/step.md`, `wiki/multi-template-administration.md`, `database.md` PLANNED §7–8.

## Scope

### In Scope

- Administration CRUD (name, description, status draft/published/archived)
- Step CRUD with ordering (name, order, template pinning: templateId + version or latest-published, step-local field schema)
- Multi-template: different template per step
- Publish lifecycle (validate: ≥1 step, every step with data path — template or fields)
- Usage listing (documents produced per administration)

### Out of Scope

- Operator run-time wizard (Task 18)
- Document output (Task 19), rendering (Task 20)

## Actors

- Designer — authors workflows

## Dependencies

- Task 14 (templates to pin) — required (can draft administration with steps first, bind templates after)

## Requirements

- REQ-001: Designer can create administration with ordered steps (add/rename/reorder/remove).
- REQ-002: Each step pins at most one template: `{ templateId, version: N | 'latest' }` plus step-local fields (name/type/required list — lightweight schema, same type enum as Task 08 minus relations/computed).
- REQ-003: Steps without template are allowed (pure data-gathering steps); steps with neither template nor fields are invalid.
- REQ-004: Publish validates the whole workflow; published administrations are runnable (Task 18); edits after publish create a new administration version (same history pattern as templates).
- REQ-005: List/detail follow DataTable + `.detail-view` with step count, templates used, documents count.

## Business Rules

- BR-001: Administration `name` unique, 1–100 chars.
- BR-002: Step `order` is dense 1..N, unique per administration; reorder persists atomically.
- BR-003: `version:'latest'` resolves at run start (Task 18) to the then-current published version and is FROZEN into the produced document (Task 19) — runs never float mid-flight.
- BR-004: Pinning a template version that doesn't exist → 422. Pinning a draft (unpublished) template → 422 (must publish template first).
- BR-005: Step-local field names unique per step, snake_case; match the requirement-naming convention so bindings (Task 16, `administration.*` source) resolve.
- BR-006: Deleting a published administration with documents → blocked (archive instead). Draft with no runs → deletable.

## Domain

```text
ADMINISTRATION ─1:N─ STEP (order)
    │                   ├── TEMPLATE pin (templateId + version|latest)
    │                   └── step FIELDS (local schema)
    └── produces DOCUMENTs (Task 19, one per completed run)
```

## Data Model

### administrations

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto |
| name | VARCHAR(100) UNIQUE | Yes | e.g. Surat Perjalanan Dinas |
| description | TEXT NULLABLE | No | Purpose |
| status | VARCHAR(16) | — | draft\|published\|archived (default draft) |
| version | INTEGER | — | Published workflow version (0 = never) |
| createdAt / updatedAt | DATETIME | — | Auto |

### administration_steps

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto |
| administrationId | INTEGER FK → administrations.id ON DELETE CASCADE | Yes | Owner |
| order | INTEGER | Yes | 1-based dense |
| name | VARCHAR(100) | Yes | e.g. Data Pegawai |
| templateId | INTEGER FK → templates.id NULLABLE | No | Pinned template |
| templateVersion | VARCHAR(16) NULLABLE | Cond. | N or 'latest' (required iff templateId) |
| fields | TEXT NULLABLE | No | JSON `[{ name, label, type, required, options? }]` |

UNIQUE(administrationId, `order`). Workflow version snapshots: `administration_versions` freezing steps JSON (same pattern as Task 14) — include table.

## API

- `GET /api/administrations` (paginated, search) → with stepCount, status, docsCount.
- `POST /api/administrations` → draft.
- `GET /api/administrations/:id` → with ordered steps + resolved template names/versions + docsCount.
- `PUT /api/administrations/:id` → metadata edit (draft only for structural; published edits → new version flow via `POST :id/new-version`).
- `PUT /api/administrations/:id/steps` (bulk ordered upsert incl. reorder) → transactional; validates template pins.
- `POST /api/administrations/:id/publish` → validates ≥1 valid step → snapshots version, status published.
- `POST /api/administrations/:id/archive` → archived (runs blocked, history kept).
- `DELETE /api/administrations/:id` → per BR-006.

## UI/UX

### Information Architecture

Sidebar **Persuratan** group → `Administrations` → `/dashboard/docs/administrations`. Detail/editor page with Steps manager.

### User Flow

List → Create → Steps manager (add step → name → pin template+version or add fields → reorder via drag) → Publish (validation errors listed per step) → status chip flips.

### Steps manager

NSteps vertical overview + per-step NCard: name input, template picker (template NSelect → version NSelect with "latest (auto)" option + pinned-version snapshot note), fields dynamic-list editor (same input kinds as Task 12 lite), delete/reorder handles.

### Detail

`.detail-view`: Name, Description, Status/Version, Steps timeline (order + template pins + field counts), Documents count; footer Edit/Publish/Archive/Delete.

### States

loading, empty steps ("Add the first step"), invalid step (red badge + reason), publish-blocked banner, archived read-only notice, permission denied.

### Responsive Behavior

Steps stack vertically on mobile; template+version pickers full-width.

## Validation

- Zod: administration + steps bulk schema (template pin coherence, field-name uniqueness, dense order enforced server-side regardless of client order payload).

## Security & Permission

- Permission `Administration Management` (`/api/administrations/*`). Activity logs entity `Administration` (publish/archive with version).

## Acceptance Criteria

### AC-001

Given 4 templates, when building Perjalanan Dinas with one template per step, then publish succeeds and steps resolve names correctly.

### AC-002

Given a step with neither template nor fields, when publishing, then 422 names the step.

### AC-003

Given pin to unpublished template, when saving steps, then 422 directing to publish the template first.

### AC-004

Given published administration with documents, when deleting, then blocked with archive guidance; archive succeeds and blocks new runs.

### AC-005

Given steps reordered, when reloaded, then dense 1..N order persists.

## Implementation

Implemented 2026-09-06 by /implement.

Live smoke on dev server (fixtures cleaned up after): AC-001 multi-template publish v1/v2 with resolved names, AC-002 422 naming the step, AC-003 422 draft-template pin, archive blocks edits, AC-005 dense reorder persists, dup-name 409, unknown version 422, bad field 422, viewer GET 200/POST 403, template delete after unpin. Unit 320/320, vue-tsc clean, `npm run build` OK.

Note: reorder uses up/down handles (not drag) — same persistence guarantee; no Playwright spec (live smoke instead, as Tasks 13–16). `latest` pins resolve to the current published version for display and freeze per document at run start (Tasks 18/19).

### Backend

- [x] Entities (administrations, steps, administration_versions) + register
- [x] DTO (incl. bulk steps + publish/archive)
- [x] Service (ordering transaction, pin validation vs templates, versioning, usedBy vs documents — stub for Task 19)
- [x] Routes
- [x] Authorization + logs
- [x] Unit tests (ordering, pin validation, publish rules, archive/delete)
- [x] Integration/API tests

### Frontend

- [x] Types/store/pages/components (Table, WorkflowEditor, StepCard, DetailDrawer)
- [x] Reorder (up/down handles) + validation display
- [x] States + responsive
- [x] Unit tests (21 new; no E2E spec — live smoke instead)

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Database verification (dense order, version snapshots)
- [ ] Permission + UI/UX + Responsive + Design System verification

## Assumptions

- Step-local fields are intentionally lite (no relations/computed) — complex data comes from Global Tables via bindings.
- `latest` pins resolve at run start (Task 18), frozen per document (Task 19).

## Open Questions

- Should steps support conditional branching (skip step X if field Y), or is strictly linear sufficient for v1?
- Do we need per-step assignees/roles in v1, or is single-operator run enough (PRD non-goal: complex multi-role approval)?

## Related Knowledge

- `docs/PRD.md` (§5 non-goals approval, §8.1, §10.2)
- `docs/database.md` (PLANNED §7–8), `docs/architecture.md` (Administration layer)
- `wiki/administration.md`, `wiki/step.md`, `wiki/multi-template-administration.md`
- Tasks 14, 16, 18, 19

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
