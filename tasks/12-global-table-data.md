# Task 12 — Global Table Data & Generated CRUD

## Status

TODO

## Objective

Turn every Global Table definition into a working browse + CRUD — schema-driven forms, DataTable browse (search/sort/pagination/column visibility), row storage, and CSV import/export — with zero developer code per table.

## Context

This is the payoff of the Data Engine: "CRUD Generated Table". It integrates Tasks 07/08/10/11 into runtime behavior and provides the row data that Components/Templates/Administrations consume. Source: `wiki/crud-generated-table.md`, `design-system.md` CRUD Generated Table + Column mapping, `database.md` "Perancatatan Desain" (flexible row storage).

## Scope

### In Scope

- Generic row storage (single flexible store keyed by table+column — JSON-per-row approach)
- Row CRUD API scoped per table (`/api/data/:tableName/...`)
- Schema-driven form renderer (column → input component mapping incl. relation selector, computed rules)
- Generated browse (DataTable driven by searchable/orderable flags + column visibility)
- Row detail drawer (`.detail-view`)
- CSV import/export per table
- Validation from column definitions + computed recompute (Task 10) + relation enforcement (Task 11)

### Out of Scope

- Menus (Task 21 reads this metadata)
- Bindings/loops over rows (Tasks 16/20 consume row APIs)

## Actors

- Operator/Designer — browses, creates, edits, imports/exports rows
- System — recomputes computed fields, enforces relations

## Dependencies

- Task 07 (tables) — required
- Task 08 (columns) — required
- Task 10 (computed) — required
- Task 11 (relations) — required

## Requirements

- REQ-001: For any table, `GET /api/data/:tableName` lists rows with global search (searchable columns), field-specific search, server-side sort (orderable columns), pagination.
- REQ-002: Forms are 100% generated from column definitions: text→NInput, richtext→editor, date→NDatePicker (+format display), select→NSelect, number/currency→NInputNumber, relation→RelationSelector, image→upload+NImage, hidden-computed→omitted, readonly-computed→readonly.
- REQ-003: Row create/update validates required/type/options/relation-target-exists and recomputes computed columns (Task 10 contract).
- REQ-004: Row delete enforces Task 11 rules (restrict blocks with 409; detach cascades silently).
- REQ-005: CSV export streams current filter set; CSV import upserts with per-row error report (row number + reason), atomicity = best-effort per-row with summary (not all-or-nothing), max 5000 rows/file.
- REQ-006: Image values stored via existing storage (`server/storage/`, served by `/api/storage/*`); row stores the file URL.

## Business Rules

- BR-001: Unknown `tableName` → 404. Disabled/empty-schema tables return empty browse with "define columns first" empty state, not 500.
- BR-002: Only `searchable` columns participate in global search; only `orderable` in sort (others → 422 `NOT_ORDERABLE`).
- BR-003: `required` enforced server-side on every write, including import rows.
- BR-004: Readonly/hidden computed values in write payloads are ignored (server recomputes; client tampering has no effect).
- BR-005: Import file ≤5MB, `.csv` only; header must match column names (unknown headers → 422 listing them).
- BR-006: Row writes are audited (activity log entity = table displayName, entityId = row id).

## Domain

```text
GLOBAL TABLE definition ──drives──▶ FORM RENDERER + BROWSE
        │                                    │
        └── ROW STORE (tableId, values JSON) ◀── validation + computed + relations
```

## Data Model

### global_table_rows (new, generic)

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Row id (per-row, table-scoped uniqueness via tableId+id) |
| globalTableId | INTEGER FK → global_tables.id ON DELETE CASCADE | Yes | Owner table |
| values | TEXT | Yes | JSON object `{ columnName: value }` (relation single=id, multi=id[], image=url, date=ISO) |
| createdAt / updatedAt | DATETIME | — | Auto |

INDEX(globalTableId, id). Design decision (per `database.md` note): JSON-per-row keeps SQLite + TypeORM dynamic without DDL per table. Documented here; Task 22 may revisit for scale.

## API

- `GET /api/data/:tableName?page&limit&search&searchField&sortBy&sortOrder` → paginated rows (resolved display labels for relations included as `_display`).
- `GET /api/data/:tableName/:rowId` → row + resolved labels.
- `POST /api/data/:tableName` → `201` (validates + recomputes, returns full row incl. computed).
- `PUT /api/data/:tableName/:rowId` → `200` (same pipeline; dependency recompute).
- `DELETE /api/data/:tableName/:rowId` → `204` / 409 RESTRICT.
- `GET /api/data/:tableName/export?format=csv&<filters>` → CSV download.
- `POST /api/data/:tableName/import` (multipart CSV) → `{ imported, failed, errors: [{ row, reason }] }`.

## UI/UX

### Information Architecture

`Data > {displayName}` per-table pages (routes registered statically as `/dashboard/data/:tableName`, rendered generically — menu labels from Task 21). Each page: DataTable + Create button + Import/Export buttons.

### User Flow

Browse → Create (generated modal/drawer form) → inline validation → save → toast + refresh. Row → View (drawer `.detail-view` with per-type display incl. formatted dates/currency, relation labels, NImage thumbnails) / Edit / Delete (confirm).

### List

Full DataTable conventions (Task 07 list spec): columns generated from definitions (orderable get sorters; searchable feed search-field options). Column visibility persisted per-table key.

### Editor (schema-driven)

`DynamicForm` renderer: iterates ordered columns → maps type → Naive component with rules derived from definition (required/type/options). Relation → `RelationSelector` (Task 11). Date shows format hint. Currency shows prefix. Image shows upload + preview. Computed handled per BR-004.

### Import/Export

Toolbar buttons (Download/Upload icons): Export downloads current filter; Import opens modal (file picker + dry-run preview of first 5 rows + error table after run).

### States

loading, empty ("No rows yet" / "Define columns first" variants), error, validation, import partial-success (warning NAlert + error table), permission denied.

### Responsive Behavior

Form drawer full-screen mobile; browse scrolls horizontally; import modal stacks.

## Validation

- Zod dynamic schema built per-table server-side from column definitions (single source of truth); client builds matching naive rules for instant feedback but server is authoritative.

## Security & Permission

- Per-table permissions auto-provisioned on table create: `Data:{tableName}:Read/Write` (methods+urls scoped to `/api/data/:tableName*`); UI gates Create/Edit/Delete/Import per Write. Lookup provider (Task 11) requires Read.
- Uploads: image type/size limits from settings; served via existing storage allowlist.

## Acceptance Criteria

### AC-001

Given a Pegawai table definition, when opening its page, then browse + empty Create form render with zero custom code (generic renderer).

### AC-002

Given required/type violations, when saving, then field-level errors and no row persisted.

### AC-003

Given computed + relation columns, when creating a row, then computed values return correct and relation labels resolve.

### AC-004

Given CSV with 2 bad rows of 10, when importing, then 8 import, summary shows 2 errors with row numbers and reasons.

### AC-005

Given non-orderable sort request, when queried, then 422 NOT_ORDERABLE.

### AC-006

Given Read-only user, when opening page, then browse works but Create/Edit/Delete/Import are hidden and API writes 403.

## Implementation

### Backend

- [ ] Entity `global-table-row.entity.ts` + register
- [ ] Dynamic validation builder (`server/utils/dynamic-schema.ts`)
- [ ] Service `table-data.service.ts` (CRUD + search/sortScope + recompute hook + import/export CSV)
- [ ] Routes `server/api/data/[tableName]/...` (+ import/export)
- [ ] Per-table permission auto-provision + activity logging
- [ ] Image upload reuse via settings/storage pipeline
- [ ] Unit tests (validation builder, search scoping, recompute, restrict/detach, CSV edge cases)
- [ ] Integration/API tests

### Frontend

- [ ] `DynamicForm` renderer + `DynamicTablePage` generic page + row detail drawer
- [ ] Per-type display formatters (date format, currency, relation labels, NImage)
- [ ] Import/export UI + error table
- [ ] Types/store generic (`tableData`)
- [ ] Unit + E2E tests (Pegawai fixture: full CRUD + import)

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Database verification (JSON round-trip, cascade on table delete, index use)
- [ ] Permission verification (Read vs Write matrix)
- [ ] UI/UX + Responsive + Design System verification (mapping table compliance)

## Assumptions

- JSON-per-row scales to small/medium instansi (per PRD constraints); full-text search via LIKE on JSON extract is acceptable v1.
- CSV (not XLSX) suffices for v1 import/export.

## Open Questions

- Should large tables get per-table FTS or pagination-only is enough for v1 scale?
- Should import support update-by-key (upsert) in v1, or insert-only?

## Related Knowledge

- `docs/PRD.md` (§8.1, §10.2 CRUD, §13 relations edge)
- `docs/architecture.md`, `docs/database.md` (Perancatatan Desain)
- `docs/design-system.md` (mapping + CRUD Generated Table)
- `wiki/crud-generated-table.md`, `wiki/column-type.md`, `wiki/computed-field.md`
- Tasks 07, 08, 10, 11

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
