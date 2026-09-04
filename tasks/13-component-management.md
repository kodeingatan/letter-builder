# Task 13 — Component Management

## Status

TODO

## Objective

Let Designers build reusable document blocks (Kop Surat, Identitas Pegawai, Tanda Tangan, Daftar Pegawai) with content, single/collection looping mode, preview, and versioning — holding zero final data, only a data-requirement contract.

## Context

Component is the second link in the chain and the reusability unit of the platform ("Component-driven"). Covers `COMPONENT + DATA REQUIREMENT` object model in one task (contract fields live with the component to avoid a nano-task split). Source: `wiki/component.md`, `wiki/data-requirement.md`, `wiki/component-looping.md`, `database.md` PLANNED §3–4.

## Scope

### In Scope

- Component CRUD (name, content with `{{field}}` placeholders, looping flag, preview)
- Data-requirement fields CRUD per component (name + type: text, date, image, number, richtext)
- Single vs Collection mode semantics + collection preview with sample rows
- Versioning (immutable published versions; edit creates new version)
- Usage listing (which templates bind this component)

### Out of Scope

- Template-side binding values (Task 16)
- Loop row selection UI (Task 16); render loop execution (Task 20)

## Actors

- Designer — authors components and their contracts

## Dependencies

- Task 09 (placeholder/expression syntax shared) — recommended (syntax consistency), not blocking for basic content

## Requirements

- REQ-001: Designer can create/edit component with name, rich content (HTML/richtext with `{{requirementName}}` placeholders), looping flag.
- REQ-002: Designer can declare requirement fields (name + type); placeholder names must match declared requirements (validated on save).
- REQ-003: Collection-mode components declare the same single-item contract (each item supplies all requirements).
- REQ-004: Preview renders content with sample values (auto-generated per type + editable sample override).
- REQ-005: Publishing a change creates a new immutable version; templates pin a version (Task 16); old documents keep theirs (Task 19).
- REQ-006: Component list/detail follows DataTable + `.detail-view` conventions; delete blocked when bound by any template.

## Business Rules

- BR-001: Component `name` unique, 1–100 chars.
- BR-002: Requirement `name` unique per component, snake_case; type ∈ { text, date, image, number, richtext }.
- BR-003: Every `{{placeholder}}` in content must match a declared requirement; every declared requirement SHOULD appear in content (warn, not block, if unused).
- BR-004: Removing a requirement used by any template binding version → blocked (409) unless that template version is draft (Task 14 defines draft/published).
- BR-005: `version` auto-increments on each published save; v1 created at first publish. Draft edits don't bump until published.
- BR-006: Component holds no final data (principle guard): no row linkage, no default values beyond preview samples.

## Domain

```text
COMPONENT ─1:N─ DATA REQUIREMENT (contract: name + type)
    │ looping=false → single item
    └── looping=true → collection (same contract per item)
            │ bound by
            ▼
        TEMPLATE BINDING (Task 16)
```

## Data Model

### components

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto-increment |
| name | VARCHAR(100) UNIQUE | Yes | e.g. Identitas Pegawai |
| content | TEXT NULLABLE | No | HTML with placeholders |
| looping | BOOLEAN | — | Default false |
| preview | TEXT NULLABLE | No | Cached sample render (optional) |
| version | INTEGER | — | Default 1, bump on publish |
| status | VARCHAR(16) | — | draft\|published (default draft) |
| createdAt / updatedAt | DATETIME | — | Auto |

### component_data_requirements

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto |
| componentId | INTEGER FK → components.id ON DELETE CASCADE | Yes | Owner (+ version scope: componentId+version unique per name) |
| name | VARCHAR(64) | Yes | snake_case |
| type | VARCHAR(16) | Yes | Enum BR-002 |

UNIQUE(componentId, version, name). Component versions: new row per publish OR version column with immutable snapshots — implement as versioned rows keyed (componentGroupId, version); simplest compliant: single row + `component_versions` history table storing frozen (content, requirements) per version. Choose history-table variant.

## API

- `GET /api/components` (paginated, search name) → list with version/status/usageCount.
- `POST /api/components` → draft v1.
- `GET /api/components/:id` → component + requirements + versions + usedBy templates.
- `PUT /api/components/:id` (draft edits; requirements nested write) → validates placeholders ⊆ requirements.
- `POST /api/components/:id/publish` → freezes version snapshot, bumps version.
- `GET /api/components/:id/versions/:v` → immutable snapshot.
- `DELETE /api/components/:id` → 204 or 409 with usedBy.
- `POST /api/components/:id/preview` `{ samples }` → rendered HTML (uses Task 09 placeholder substitution subset or Task 20 preview hook — stub simple replace here, full engine in Task 20).

## UI/UX

### Information Architecture

Sidebar **Dokumen** group → `Components` → `/dashboard/docs/components`. Detail drawer + dedicated editor page for content authoring.

### User Flow

List → Create → editor (content + requirements side-by-side) → live preview pane → Save draft → Publish → version chip increments.

### List

DataTable: Name, Mode (Single/Collection NTag), Requirements count, Version, Status (draft/published tag), Updated. Standard search/sort/pagination/visibility.

### Editor

Two-pane: left richtext/content editor (contenteditable + placeholder insert dropdown listing requirements), right requirements manager (dynamic rows: name+type+delete) + sample values + live preview (NCard rendering substituted HTML). Publish button with confirm; version history timeline (N Timeline) with view-only snapshots.

### Detail

`.detail-view`: Name, Mode, Version/Status, Requirements table, Used By templates, timestamps. Footer: Edit, Publish, Delete.

### States

loading, empty ("No components — create Kop Surat first"), validation (placeholder mismatch highlights), version conflict, permission denied.

### Responsive Behavior

Panes stack vertically on <1024px; preview collapses into tab on mobile.

## Validation

- Zod: component + nested requirements (names regex, types enum); server cross-checks placeholders via regex `\{\{\s*([a-z][a-z0-9_]*)\s*\}\}` against declared set.

## Security & Permission

- Permission `Component Management` (`/api/components/*`). Draft vs published: same permission (no separate approver role v1). Activity logs entity `Component`.

## Acceptance Criteria

### AC-001

Given requirements nama/nip/jabatan and content using all three, when saving, then success and preview renders sample values.

### AC-002

Given content with `{{unknown}}`, when saving, then 422 naming the unknown placeholder.

### AC-003

Given publish, when published twice with edits, then versions v1/v2 snapshots differ and v1 remains byte-identical.

### AC-004

Given component bound by a template, when deleting, then 409 with template names.

### AC-005

Given collection mode, when previewing with 3 sample items, then 3 rendered blocks appear.

## Implementation

### Backend

- [ ] Entities (components, requirements, component_versions) + register
- [ ] DTO (nested requirements, publish, preview)
- [ ] Service (CRUD + placeholder validation + versioning + usedBy check vs Task 14/16 tables — stub interface now, enforced when they land)
- [ ] Routes incl. publish/versions/preview
- [ ] Authorization + logs
- [ ] Unit tests (placeholder matching, versioning immutability, delete-block)
- [ ] Integration/API tests

### Frontend

- [ ] Types/store/pages/components (Table, Editor, DetailDrawer, RequirementManager, Preview pane)
- [ ] Placeholder insert dropdown + mismatch highlighting
- [ ] States + responsive + version timeline
- [ ] Unit + E2E tests

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Database verification (version snapshots immutable)
- [ ] Permission + UI/UX + Responsive + Design System verification

## Assumptions

- History-table versioning chosen; frozen snapshots include requirements JSON.
- Simple `{{name}}` substitution for preview here; full binding/loop/condition resolution is Task 20.

## Open Questions

- Should requirements support nested objects (e.g. address.street) in v1, or flat fields only?
- Do we need component categories/folders for large libraries, or is search enough?

## Related Knowledge

- `docs/PRD.md` (§8.1, §10.2, §11 BR-002)
- `docs/database.md` (PLANNED §3–4), `docs/architecture.md` (Component layer)
- `wiki/component.md`, `wiki/data-requirement.md`, `wiki/component-looping.md`, `wiki/core-object-model.md`

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
