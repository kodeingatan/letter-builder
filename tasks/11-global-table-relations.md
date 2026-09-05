# Task 11 — Global Table Relations

## Status

DONE

## Objective

Let columns reference rows of another Global Table — single (`select-table-relation`) and multi (`select-table-relation-multiple`) — with configurable display fields and referential integrity.

## Context

Implements "Relation sebagai Data Provider" + "Multi Relation". Relations power relation selectors in forms, display composition, loop sources (Task 16/20), and binding sources. Source: `wiki/relation-data-provider.md`, `wiki/multi-relation.md`, `database.md` PLANNED §2 `relationTableId`.

## Scope

### In Scope

- Relation column types (single + multiple) with `relationTableId`
- Display-field config (which target columns compose the label) + value semantics (target row id)
- Relation selector UI (single NSelect / multi NSelect multiple with search)
- Referential rules (block table delete when targeted — enforces Task 07 BR-004; null vs restrict on row delete)
- Relation data provider API for selectors (searchable, paginated)

### Out of Scope

- Row CRUD itself (Task 12 consumes this)
- Cross-table computed refs (deferred, Task 10 question)

## Actors

- Designer — defines relation columns
- Operator — picks related rows in forms

## Dependencies

- Task 08 (columns) — required (extends type enum)
- Task 07 (target table must exist)

## Requirements

- REQ-001: Designer can create single-relation column pointing at a target Global Table with display-field selection (≥1 target column).
- REQ-002: Designer can create multi-relation column (stores id collection).
- REQ-003: Forms render relation selectors fed by a paginated searchable provider endpoint.
- REQ-004: Relation labels compose as configured (e.g. `code + " - " + name` → "001 - Teknologi Informasi").
- REQ-005: Deleting a target row referenced by a single-relation is blocked (RESTRICT default); multi-relation silently drops the id (configurable per column: `onTargetDelete: restrict|detach`, default restrict single / detach multi).
- REQ-006: Self-relations allowed (table → itself) except target = own column loops are guarded.

## Business Rules

- BR-001: `relationTableId` required iff type is relational; forbidden otherwise.
- BR-002: Target table must differ from owner OR be self with explicit confirm; target must have ≥1 column to display.
- BR-003: Display config requires ≥1 target column; stored as JSON `{ displayColumns: string[], separator: string }`.
- BR-004: Relation chains max depth 3 when resolving display labels (guard against infinite self-relation recursion).
- BR-005: Multi-relation stores ordered id array (JSON); duplicates rejected.
- BR-006: Relation column cannot itself be computed; computed columns cannot be relation targets' display only — any non-computed target column may display.

## Domain

```text
COLUMN (relation) ──relationTableId──▶ GLOBAL TABLE (target)
    │ single → rowId              target rows provide { id, label }
    └── multiple → rowId[]         selector = Relationship Data Provider
```

## Data Model

Extends `global_table_columns`:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| relationTableId | INTEGER FK → global_tables.id NULLABLE | Cond. | Required iff relational |
| relationConfig | TEXT NULLABLE | Cond. | JSON `{ displayColumns: string[], separator, onTargetDelete }` |

Allowed `type` += `select-table-relation`, `select-table-relation-multiple`.

## API

### Provider

`GET /api/global-tables/:tableId/rows/lookup?search&limit` → `{ data: [{ id, label, raw }] }` (label pre-composed server-side using display config of the *requesting* column when `?columnId=` passed; else default first-text-column). Powers selectors without leaking full rows.

### CRUD

Same Task 08 routes; create/update validate target exists, display columns exist on target, no self-target-column loop.

## UI/UX

### Information Architecture

Column form gains "Relation" section when relational type picked: target table NSelect (searchable) → display-columns NCheckbox group (from target schema) → separator input → preview list (first 5 target rows rendered as labels) → onTargetDelete radio.

### Selector (forms)

Single: NSelect filterable, remote search via provider, clearable (unless required). Multi: NSelect multiple + NTag rendering, max-tag count responsive. Both show NSpin while searching, NEmpty when no match.

### States

loading target schema, empty target (no rows → "No data in target table yet"), invalid config, permission denied.

### Responsive Behavior

Selectors full-width on mobile; multi tags wrap.

## Validation

- Zod: relation branch requires relationTableId + relationConfig with displayColumns ≥1.
- Server: target + display columns existence; cycle guard (target table must not depend back through a relation chain that includes this column — direct self-column check minimum).

## Security & Permission

- Table permission (Task 07) for definition; row-read permission (Task 12) gates provider results (selector only sees rows the user may read).

## Acceptance Criteria

### AC-001

Given Department rows, when defining `Pegawai.department_id` (single, display code+name), then form selector lists "001 - Teknologi Informasi" etc.

### AC-002

Given multi-relation with two checked departments, when saving, then ids persist ordered without duplicates.

### AC-003

Given a target row referenced by RESTRICT column, when deleting the target row, then 409 blocks.

### AC-004

Given DETACH multi config, when target row deleted, then referencing rows drop the id and remain valid.

### AC-005

Given no provider permission, when querying lookup, then 403.

## Implementation

### Backend

- [x] Extend column entity + DTO relation branch
- [x] Lookup provider service + route (label composition, depth guard, permission filter)
- [x] Reference enforcement helpers (`isTableTargeted`, `isRowReferenced`) exposed for Tasks 07/12
- [ ] Authorization + activity logs
- [ ] Unit tests (label composition, detach/restrict, depth guard)
- [ ] Integration/API tests

### Frontend

- [ ] Column form relation section + target preview
- [ ] Reusable `RelationSelector` component (single/multi) used by Task 12 forms
- [ ] Unit + E2E tests

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Database verification (FK, JSON config round-trip)
- [ ] Permission + UI/UX + Responsive + Design System verification

## Assumptions

- Row storage shape (Task 12) holds relation as scalar id / JSON array; this task defines the contract Task 12 implements.

## Open Questions

- Should display labels support expressions (e.g. concat with formatting) in v2 instead of separator-join?
- Do we need cascade-delete option for tightly-owned children, or is restrict/detach sufficient?

## Related Knowledge

- `docs/database.md` (PLANNED §2), `docs/design-system.md` (relation selector mapping)
- `wiki/relation-data-provider.md`, `wiki/multi-relation.md`, `wiki/column-type.md`
- Tasks 07, 08, 12

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
