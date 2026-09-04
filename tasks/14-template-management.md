# Task 14 — Template Management

## Status

TODO

## Objective

Let Designers own document blueprints — versioned templates with static content slots that later receive components, bindings, loops, and conditions (composition lives in Tasks 15–16; this task is the blueprint lifecycle).

## Context

Template is the "blueprint of a document" holding structure but no final data. This task covers template identity, content skeleton storage, draft/published lifecycle, and versioning that Documents (Task 19) and Administration steps (Task 17) pin. Source: `wiki/template.md`, `wiki/core-object-model.md`, `database.md` PLANNED §5.

## Scope

### In Scope

- Template CRUD (name, description, content skeleton JSON/HTML)
- draft → published lifecycle + immutable version snapshots
- Version history view + rollback-as-new-version
- Usage listing (administration steps + documents referencing each version)

### Out of Scope

- Rich composition canvas interactions (Task 15)
- Data binding values (Task 16)
- Rendering (Task 20)

## Actors

- Designer — authors and publishes templates

## Dependencies

- Task 13 (components exist to be placed — soft dependency; templates can be drafted empty first)

## Requirements

- REQ-001: Designer can create template with name + description + initial content skeleton.
- REQ-002: Template has draft working copy; Publish freezes immutable version (v1, v2…).
- REQ-003: Any published version is viewable read-only; rollback creates a NEW version copying old content (never mutates history).
- REQ-004: Delete allowed only for never-published drafts, or blocked when any administration step or document references any version.
- REQ-005: List/detail follow DataTable + `.detail-view` conventions with version + status + usage counts.

## Business Rules

- BR-001: Template `name` unique, 1–100 chars.
- BR-002: Only one draft working copy per template; publish requires non-empty content (≥1 text node or component placement).
- BR-003: Published versions immutable (content + structure frozen; enforced DB + API level).
- BR-004: Version numbers are per-template monotonically increasing integers starting at 1.
- BR-005: Documents store `templateVersion` (Task 19); steps pin a version or "latest-published" (resolved at run time — Task 17).

## Domain

```text
TEMPLATE ─1:N─ TEMPLATE VERSION (immutable snapshot)
    │ draft working copy (mutable)
    ├── referenced by ADMINISTRATION STEP (Task 17)
    └── snapshotted by DOCUMENT (Task 19)
CONTENT (skeleton) ◀── composed in Task 15, bound in Task 16
```

## Data Model

### templates

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto |
| name | VARCHAR(100) UNIQUE | Yes | e.g. Surat Keputusan |
| description | TEXT NULLABLE | No | Purpose notes |
| content | TEXT NULLABLE | No | Draft working copy (JSON document tree) |
| version | INTEGER | — | Latest published version number (0 = never published) |
| status | VARCHAR(16) | — | draft\|published |
| createdAt / updatedAt | DATETIME | — | Auto |

### template_versions (immutable)

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto |
| templateId | INTEGER FK → templates.id ON DELETE CASCADE | Yes | Owner |
| version | INTEGER | Yes | Per-template sequence |
| content | TEXT | Yes | Frozen snapshot |
| publishedBy | INTEGER FK → users.id NULLABLE | No | Publisher |
| createdAt | DATETIME | — | Publish time |

UNIQUE(templateId, version).

## API

- `GET /api/templates` (paginated, search name/description) → with latest version, status, usage counts.
- `POST /api/templates` → draft.
- `GET /api/templates/:id` → draft + versions list + usedBy (steps, documents count).
- `PUT /api/templates/:id` → edit draft only (403 if attempting to edit published snapshot path; 422 if empty publish attempted via `?publish` — use explicit endpoint instead).
- `POST /api/templates/:id/publish` → validates non-empty → freezes snapshot, bumps version.
- `GET /api/templates/:id/versions/:v` → immutable snapshot.
- `POST /api/templates/:id/rollback/:v` → copies snapshot into draft (then publish separately) — two-step, auditable.
- `DELETE /api/templates/:id` → per REQ-004 (409 with references).

## UI/UX

### Information Architecture

`Dokumen > Templates` → `/dashboard/docs/templates`. Editor page `/dashboard/docs/templates/:id` (draft canvas placeholder in this task — full canvas Task 15; this task ships structured textarea/JSON preview + metadata form so lifecycle works end-to-end).

### User Flow

List → Create (name/desc) → editor (metadata + skeleton placeholder + Publish button) → version timeline → view snapshot read-only → rollback-as-draft → publish again.

### List

DataTable: Name, Version (vN chip), Status tag, Used In (steps/docs counts), Updated. Standard features.

### Editor (this task scope)

Metadata form + content skeleton JSON viewer/editor (monospace, validated JSON) + Publish + version timeline with snapshot viewer (read-only render stub). Full visual canvas arrives in Task 15 without breaking this lifecycle.

### Detail

`.detail-view` drawer: Name, Description, Version/Status, Usage, timestamps; footer Edit/Publish/Delete.

### States

loading, empty ("No templates yet"), invalid JSON, empty-publish blocked, immutability notice on snapshots, permission denied.

### Responsive Behavior

Timeline collapses below editor on mobile; drawer full-screen.

## Validation

- Zod: name/description; content must be valid JSON document tree (schema-light v1: `{ nodes: [...] }`) when publishing.

## Security & Permission

- Permission `Template Management` (`/api/templates/*`). Activity logs entity `Template` (publish/rollback logged with version numbers).

## Acceptance Criteria

### AC-001

Given a new template, when created, then it appears as draft v0 and is editable.

### AC-002

Given non-empty draft, when published, then v1 snapshot freezes and further draft edits don't alter v1.

### AC-003

Given v2 published, when rolling back to v1, then draft matches v1 and publishing yields v3 (history v1/v2 untouched).

### AC-004

Given a template referenced by a step/document, when deleting, then 409 with references.

### AC-005

Given empty content, when publishing, then 422 and no version bump.

## Implementation

### Backend

- [ ] Entities (templates, template_versions) + register
- [ ] DTO (create/update/publish/rollback)
- [ ] Service (draft/publish/rollback, immutability guard, usedBy checks — stub interfaces for Tasks 17/19)
- [ ] Routes incl. publish/versions/rollback
- [ ] Authorization + logs
- [ ] Unit tests (versioning, immutability, rollback-as-new, delete-block)
- [ ] Integration/API tests

### Frontend

- [ ] Types/store/pages/components (Table, Editor-lite, DetailDrawer, VersionTimeline, SnapshotViewer)
- [ ] JSON skeleton validation UX
- [ ] States + responsive
- [ ] Unit + E2E tests

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Database verification (UNIQUE per-template version, immutability)
- [ ] Permission + UI/UX + Responsive + Design System verification

## Assumptions

- Document-tree JSON shape defined here minimally (`{ nodes: [...] }`); Task 15 extends node kinds without migration (JSON schemaless).
- Steps/documents pin versions (details in Tasks 17/19).

## Open Questions

- Should publish require a second approver (Designer vs Reviewer) in v1, or is single-Designer publish acceptable?
- Do templates need categories/tags for large libraries?

## Related Knowledge

- `docs/PRD.md` (§8.1, §10.2, §13 versioning edge)
- `docs/database.md` (PLANNED §5), `docs/architecture.md` (Template layer)
- `wiki/template.md`, `wiki/core-object-model.md`
- Tasks 13, 15, 16, 17, 19

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
