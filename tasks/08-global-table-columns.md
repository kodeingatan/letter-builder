# Task 08 — Global Table Columns & Column Types

## Status

TODO

## Objective

Let Designers define the schema of a Global Table — ordered columns with behavior-driving types (text, richtext, date, select, number, currency, image) covering storage, input, display, validation, format, search, and ordering.

## Context

Implements the `COLUMN` node of the Core Object Model and the "Column Type = Behavior Data" concept. Columns are the contract that downstream schema-driven forms (Task 12), relations (Task 11), computed fields (Task 10), and bindings (Task 16) all rely on. Source: `wiki/column-type.md`, `wiki/global-table.md`, `database.md` PLANNED §2 (excluding `expression`/`relationTableId`, owned by Tasks 10/11).

## Scope

### In Scope

- Column CRUD within a Global Table (name, displayName, type, defaultValue, required, searchable, orderable, options, format, ordering)
- Column type registry: text, richtext, date, select, number, currency, image
- Column ordering (drag/reorder or order field)
- Per-type validation + input/display mapping

### Out of Scope

- Computed fields / expressions (Task 10)
- Table relations single/multi (Task 11)
- Row data entry (Task 12)

## Actors

- Designer — defines and maintains columns

## Dependencies

- Task 07 (Global Table foundation) — required

## Requirements

- REQ-001: Designer can add/edit/remove/reorder columns on a Global Table.
- REQ-002: Each column declares type; the system enforces the Column Type → Input/Display mapping from `design-system.md`.
- REQ-003: `select` type stores its `options` list (JSON array of `{ label, value }`).
- REQ-004: `date` type supports display `format` (e.g. `m-d-Y`).
- REQ-005: `searchable`/`orderable` flags drive generated browse behavior (Task 12 reads them).
- REQ-006: Column deletion blocked if the column is used by a computed-field dependency, relation display, or template binding.

## Business Rules

- BR-001: Column `name` unique within its table (snake_case, `^[a-z][a-z0-9_]*$`); `displayName` required.
- BR-002: Allowed types in this task: `text`, `richtext`, `date`, `select`, `number`, `currency`, `image`. Others (`select-table-relation*`, computed) rejected here — owned by Tasks 10/11.
- BR-003: `select` requires ≥1 option; option values unique within the column.
- BR-004: `defaultValue` must type-check against the column type (number parses, date parses, select value ∈ options).
- BR-005: A table must keep ≥1 non-computed column; deleting the last one is blocked.
- BR-006: Column `type` is immutable after row data exists (Task 12); only display/order/flags/default editable then.

## Domain

```text
GLOBAL TABLE ─1:N─ COLUMN
    │               ├── type → behavior (input/display/validation/format/search/order)
    │               ├── options (select)
    │               └── format (date)
```

## Data Model

### global_table_columns

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto-increment |
| globalTableId | INTEGER FK → global_tables.id ON DELETE CASCADE | Yes | Owner table |
| name | VARCHAR(64) | Yes | Unique per table, immutable once data exists |
| displayName | VARCHAR(100) | Yes | Label |
| type | VARCHAR(32) | Yes | Enum this task |
| defaultValue | TEXT NULLABLE | No | Type-checked default |
| required | BOOLEAN | — | Default false |
| searchable | BOOLEAN | — | Default false |
| orderable | BOOLEAN | — | Default false |
| position | INTEGER | Yes | 0-based order |
| options | TEXT NULLABLE | Cond. | JSON for select |
| format | VARCHAR(32) NULLABLE | No | Date display format |

UNIQUE(globalTableId, name). INDEX(globalTableId, position).

## API

### List

`GET /api/global-tables/:tableId/columns` → ordered array (no pagination needed; tables have tens of columns).

### Create

`POST /api/global-tables/:tableId/columns` → `201`. 409 duplicate name, 422 bad type/options/default.

### Detail

`GET /api/global-tables/:tableId/columns/:columnId`.

### Update

`PUT /api/global-tables/:tableId/columns/:columnId` (type change rejected with 422 if row data exists — checked in Task 12, stub here).

### Delete

`DELETE ...` → `204`; 409 if referenced (BR-006 in Requirements REQ-006).

### Reorder

`PUT /api/global-tables/:tableId/columns/reorder` `{ orderedIds: number[] }` → `200` persisted positions.

## UI/UX

### Information Architecture

Global Table detail drawer/page → **Columns** tab (table of columns) + Add/Edit column modal + drag-handle reorder.

### User Flow

Open table → Columns tab → Add column → pick type → type-specific fields appear (options editor / format) → save → row appears in order; drag to reorder (auto-saves).

### List

NDataTable (client-side, small N): columns Name (mono), Display, Type (NTag), Required/Searchable/Orderable (NCheckbox disabled), Default, Actions (Edit/Delete). Drag via hamburger handle.

### Editor

NModal form: name, displayName, type (NSelect with descriptions), then conditional section — select: NDynamicTags options editor; date: format NInput with preview; number/currency: default NInputNumber; image: accept hint. Flags as NCheckboxes with helper text ("drives search/sort in generated browse").

### Interaction

Type select changes visible fields instantly. Delete → confirm naming dependents if blocked.

### States

loading, empty ("No columns yet — add the first column"), error, validation (per-type messages), permission denied.

### Responsive Behavior

Modal full-screen on mobile; columns table scrolls horizontally.

## Validation

- Zod discriminated union on `type` (options required iff select; format validated against allowlist `m-d-Y`, `d-m-Y`, `Y-m-d`, `d M Y`).
- Client mirrors with type-conditional rules.

## Security & Permission

- Same `Global Table Management` permission as Task 07 (column ops are table metadata ops). Activity log entity `GlobalTableColumn`.

## Acceptance Criteria

### AC-001

Given a table, when Designer adds a `select` column with 3 options, then it is stored ordered and rendered with those options.

### AC-002

Given an invalid default (e.g. text in number column), when saving, then 422 with a field-level message and nothing is stored.

### AC-003

Given columns exist, when reordered via drag, then the order persists after reload.

### AC-004

Given a column used by a binding/dependency, when deleting, then 409 blocks with the usage listed.

### AC-005

Given a disallowed type (`select-table-relation`, computed), when submitted here, then 422 directs to the owning task.

## Implementation

### Backend

- [ ] Entity (`global-table-column.entity.ts`, EntitySchema) + register in db.ts
- [ ] DTO (discriminated Zod union + reorder schema)
- [ ] Service (CRUD + reorder transaction + reference-check stub interface used by Tasks 10/11/16)
- [ ] Routes (nested under `/api/global-tables/:tableId/columns`, incl. reorder)
- [ ] Authorization + activity logs
- [ ] Unit tests (type validation, uniqueness, reorder)
- [ ] Integration/API tests

### Frontend

- [ ] Types + store (`globalTableColumns`, scoped per table)
- [ ] Columns tab component + ColumnFormModal (type-conditional) + sortable list
- [ ] Validation mirroring server union
- [ ] Loading/empty/error states, responsive
- [ ] Unit + E2E tests

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Database verification (unique per table, cascade on table delete)
- [ ] Permission + UI/UX + Responsive + Design System verification

## Assumptions

- Max ~50 columns per table; client-side list is fine.
- Reference-check interface defined here, enforced fully once Tasks 10/11/16 land.

## Open Questions

- Do we need column-level help text/placeholder in v1, or is displayName enough?
- Should `image` store accept/size limits per column, or global settings only?

## Related Knowledge

- `docs/PRD.md` (§8.1, §10.2)
- `docs/architecture.md`, `docs/database.md` (PLANNED §2)
- `docs/design-system.md` (Column Type mapping table)
- `wiki/column-type.md`, `wiki/global-table.md`, `wiki/core-object-model.md`

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
