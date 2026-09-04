# Task 10 — Computed Fields

## Status

TODO REVIEW

## Objective

Let columns derive their value from an expression over sibling fields — hidden (stored, not shown) or readonly (shown, not editable) — recomputed whenever a dependency changes.

## Context

Implements "Operation Column = Computed Data" (`hidden-operation-text`, `readonly-operation-text`). Builds on Task 08 (columns) + Task 09 (engine). Source: `wiki/computed-field.md`, `database.md` PLANNED §2 `expression` column.

## Scope

### In Scope

- Two computed column types: `hidden-computed` (stored, no input) and `readonly-computed` (displayed, no input)
- `expression` field on column + dependency tracking via `extractRefs` (Task 09)
- Recompute on row create/update (Task 12 integration point) + live preview in editor
- Cycle detection

### Out of Scope

- New operators (Task 09 owns language)
- Cross-table refs in v1 (same-row refs only; relations in expressions deferred)

## Actors

- Designer — defines computed columns
- Operator — sees readonly results / benefits from hidden stored values

## Dependencies

- Task 08 (columns) — required
- Task 09 (expression engine) — required

## Requirements

- REQ-001: Designer can create `hidden-computed` / `readonly-computed` columns with an `expression`.
- REQ-002: Expression editor shows extracted dependency chips + live validated preview (uses Task 09 validate API).
- REQ-003: On row write, server evaluates computed columns after sibling values resolve; hidden values persisted, readonly values returned (persisted or derived — persisted for auditability).
- REQ-004: Changing a dependency value recomputes dependents (dependency graph, topological order).
- REQ-005: Cyclic dependencies rejected at column save time with the cycle path shown.

## Business Rules

- BR-001: Computed columns accept no manual input (forms render nothing for hidden, readonly text for readonly-computed).
- BR-002: Expression refs limited to same-row sibling column names in v1 (`{{harga}}`, not `{{other_table.x}}`).
- BR-003: Computed column cannot be `required` (value is derived) and cannot be a dependency of itself (directly or transitively).
- BR-004: Evaluation failure on row write → row write fails with 422 naming column + engine error (no silent null persist), except nullable-tolerant null-propagation which yields null legitimately.
- BR-005: `searchable`/`orderable` allowed on readonly-computed (persisted value indexed like normal); hidden-computed `searchable` allowed, `orderable` allowed.

## Domain

```text
COLUMN (sibling values)
    │
    ▼
EXPRESSION (Task 09, refs = dependencies)
    │
    ├── HIDDEN-COMPUTED → stored, no UI input
    └── READONLY-COMPUTED → stored + displayed readonly
```

## Data Model

Extends `global_table_columns` (Task 08):

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| expression | TEXT NULLABLE | Cond. | Required iff type is computed |
| dependencies | TEXT NULLABLE | — | JSON string[] from extractRefs, denormalized for cycle checks |

Allowed `type` += `hidden-computed`, `readonly-computed`. Migration: SQLite `synchronize` adds nullable columns (dev); note for production migration later (Task 22).

## API

Extends Task 08 routes: create/update accept `expression`; server validates expression (Task 09 validate), checks refs ⊆ sibling names, runs cycle detection over table graph. Error `422 { code: 'CYCLIC_DEPENDENCY', cycle: [...] }`.

Row-write evaluation contract (implemented in Task 12, specified here): `POST/PUT` row → server topologically sorts computed columns → evaluates → persists → returns computed values in response.

## UI/UX

### Information Architecture

Same Columns tab (Task 08); computed types appear in type select with "computed" badge.

### Editor

Type-conditional section: monospace expression NInput + Validate status + dependency chips (NTag, clickable → highlights sibling column) + live preview against sample sibling values + cycle error display.

### List / Detail

Type column shows `hidden-computed`/`readonly-computed` tags; detail drawer shows expression (code block) + dependencies.

### States

validating, valid (green + preview value), invalid (red + engine message), cyclic (red + path), permission denied.

### Responsive Behavior

Same as Task 08; expression input scrolls horizontally on mobile.

## Validation

- Zod: expression required iff computed; refs must be known siblings (checked server-side with table context).
- Cycle detection: DFS over table's dependency graph on every computed save.

## Security & Permission

- Same table permission (Task 07). Expressions evaluated server-side only (Task 09 BR-001). No PII in logs beyond hashes.

## Acceptance Criteria

### AC-001

Given siblings `harga=20000, jumlah=3`, when saving readonly-computed `total = {{harga}} * {{jumlah}}`, then preview shows 60000 and row writes persist 60000.

### AC-002

Given expression refs unknown column, when saving, then 422 UNKNOWN_REF and nothing stored.

### AC-003

Given A depends on B and B edited to depend on A, when saving B, then 422 CYCLIC_DEPENDENCY showing A→B→A.

### AC-004

Given a hidden-computed column, when rendering the row form, then no input is shown but the value is stored and searchable.

### AC-005

Given dependency value changes on row update, when saved, then dependents recompute in one write.

## Implementation

### Backend

- [x] Extend column entity (expression, dependencies) + type enum
- [x] Extend DTO (discriminated union branches for computed)
- [x] Service: validate-via-engine, sibling-ref check, cycle detection, topological recompute helper `recomputeRow(table, values)` exported for Task 12
- [ ] Authorization + activity logs
- [ ] Unit tests (cycle cases, topo order, null-propagation, failure → 422)
- [ ] Integration/API tests

### Frontend

- [x] Extend ColumnFormModal (computed branch: expression input + preview + dep chips)
- [x] Form rendering rules (hidden → omit; readonly-computed → readonly display)
- [x] Unit + E2E tests

## Verification

- [x] Typecheck, Lint, Unit
- [ ] Database verification (expression/dependencies persisted)
- [ ] Permission + UI/UX + Responsive + Design System verification

## Assumptions

- Persisting readonly values (vs pure-derivation) chosen for audit + sort/search simplicity.
- Same-row refs only in v1 keeps dependency graph per-table.

## Open Questions

- Should cross-table refs (e.g. relation target fields) be allowed in v2 expressions?
- For long chains, do we need async/background recompute, or is synchronous per-write fine at SQLite scale?

## Related Knowledge

- `docs/PRD.md` (§8 glossary Computed Field, §13 edge cases)
- `docs/database.md` (PLANNED §2)
- `wiki/computed-field.md`, `wiki/expression-engine.md`
- Tasks 08, 09, 12

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
