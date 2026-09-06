# Task 16 — Template Data Binding

## Status

IN PROGRESS

## Objective

Let Designers answer every component data-requirement with a concrete source — Administration data, Global Table, manual input, expression, or system data — using the single `{{data.*}}` language, so templates become render-ready.

## Context

Implements "Data Requirement = Contract" + "Data Binding" + loop source binding ("Template + Component + Loop"). This is the wiring that makes Task 15 placements executable by Task 20 and fillable by Task 18. Source: `wiki/data-binding.md`, `wiki/data-requirement.md`, `wiki/template-component-loop.md`, `database.md` PLANNED §6 `template_bindings`.

## Scope

### In Scope

- Binding records per (template version scope, component placement, requirementName) → `{ source, sourceRef, expression }`
- Five sources: `administration`, `global_table`, `manual`, `expression`, `system`
- Loop-item scoping (`{{item.*}}` inside loops) + collection source picker
- Binding status tracking (bound/unbound drives Task 15 publish guard)
- Preview resolution with sample data

### Out of Scope

- Renderer execution (Task 20 reads these bindings)
- Administration runtime input collection (Task 18)

## Actors

- Designer — wires bindings

## Dependencies

- Task 15 (placements/slots) — required
- Task 09 (expression source + validation) — required
- Task 12 (global-table rows as bindable sources) — required for `global_table` source

## Requirements

- REQ-001: Every requirement slot of every placement can be bound to one of the five sources with a source-specific ref (field path, `table.column` / row scope, literal, expression, system key).
- REQ-002: Inside loop blocks, bindings may use `{{item.<requirement>}}` (current collection item) in addition to outer context.
- REQ-003: Binding editor validates refs live: administration fields exist (Task 17 schema), table/column/row exist, expression valid (Task 09), system key whitelisted.
- REQ-004: Collection placements bind their loop source once (table + row scope); per-item requirement bindings default to `item.*` with override option.
- REQ-005: All bindings version-scoped: editing bindings on a draft never alters published versions; publish snapshots bindings with the tree.
- REQ-006: `validate-tree` (Task 15) reports unbound slots from this store.

## Business Rules

- BR-001: One binding per (placement, requirementName) per draft; rebind overwrites (audited).
- BR-002: `source` enum fixed: `administration|global_table|manual|expression|system`. `sourceRef` required except manual (uses literal `value`) and expression (uses `expression`).
- BR-003: `global_table` refs must name existing table+column; row-scoped bindings (loop-selected rows) additionally store `rowIds` snapshot policy = "selection at run time" (Task 18 refines), default here = template-designer preselected rows (Task 15 loop config) unless overridden at run.
- BR-004: `system` keys whitelist: `current_date`, `user.name`, `user.username`.
- BR-005: Type compatibility checked: requirement type (Task 13) vs source value kind (date→date, image→image/url, number→number) — mismatch warns (blocks publish only for hard mismatches: image←number, date←image).
- BR-006: Deleting a bound column/requirement marks binding `stale` (visible red) and blocks publish until rebound or removed.

## Domain

```text
COMPONENT REQUIREMENT (contract, Task 13)
        │ bound by
        ▼
TEMPLATE BINDING { source, sourceRef/value/expression }
        │ sources: administration / global_table / manual / expression / system
        └── loop scope: item.* inside collections
```

## Data Model

### template_bindings

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto |
| templateId | INTEGER FK → templates.id ON DELETE CASCADE | Yes | Owner |
| placementId | VARCHAR(64) | Yes | Node id from tree (Task 15) |
| componentId | INTEGER FK → components.id | Yes | Denormalized for usedBy |
| requirementName | VARCHAR(64) | Yes | Slot name |
| source | VARCHAR(16) | Yes | Enum BR-002 |
| sourceRef | VARCHAR(255) NULLABLE | Cond. | Path per source |
| literalValue | TEXT NULLABLE | Cond. | manual source |
| expression | TEXT NULLABLE | Cond. | expression source (Task 09) |
| status | VARCHAR(16) | — | bound\|stale |

UNIQUE(templateId, placementId, requirementName) on the draft scope; published snapshots freeze copies into `template_versions.content.bindings` (no separate versioned binding rows — bindings travel inside the version snapshot JSON).

## API

- `GET /api/templates/:id/bindings` → all draft bindings grouped by placement.
- `PUT /api/templates/:id/bindings` `{ bindings: [...] }` (bulk upsert, transactional; validates all refs) → `{ saved, stale: [...] }`.
- `DELETE /api/templates/:id/bindings/:bindingId` → unbind (slot returns to unbound).
- `POST /api/templates/:id/bindings/preview` `{ sampleContext }` → resolved values per slot (uses Task 09 evaluate, no persistence).
- Publish (Task 14) embeds bindings snapshot; `validate-tree` counts unbound from this table.

## UI/UX

### Information Architecture

Template editor → **Bindings** tab (alongside Canvas): placement-grouped binding rows.

### User Flow

Open Bindings tab → pick placement → per-requirement row: source NSelect → source-specific control (administration field picker / table+column picker / literal input / expression input w/ live check / system key select) → status dot flips green → Save all → unbound counter decrements.

### Controls per source

- administration: field NSelect (from Task 17 step schemas; graceful "define administration first" empty state with link).
- global_table: table NSelect → column NSelect → (collection: row-scope summary).
- manual: type-appropriate literal input (date picker / number / upload for image).
- expression: monospace input + Task 09 validation + preview value.
- system: key NSelect with descriptions.

### States

unbound (amber), bound (green), stale (red + reason + Rebind button), type-mismatch warning, validating, permission denied.

### Responsive Behavior

Binding rows stack label-over-control on mobile; tab layout collapses to accordion per placement.

## Validation

- Zod discriminated union on `source`; server verifies every ref existence + type compatibility matrix; bulk save is all-or-nothing (transaction).

## Security & Permission

- Same `Template Management` permission. Expression/manual values sanitized; preview never persists sample PII.

## Acceptance Criteria

### AC-001

Given placement Identitas Pegawai (nama/nip/jabatan), when binding nama→administration.nama, nip→Pegawai.nip, jabatan→manual "Staff", then all slots green and publish unblocked.

### AC-002

Given an expression binding with unknown ref, when saving, then 422 names the slot and nothing persists (transactional).

### AC-003

Given loop placement, when binding requirements to `item.*`, then preview with 2 sample items resolves both rows.

### AC-004

Given bound column later deleted, when opening bindings, then slot shows stale + reason and publish blocks until fixed.

### AC-005

Given hard type mismatch (image←number literal), when saving, then blocked; soft mismatch (text←number) warns only.

## Implementation

### Backend

- [x] Entity + DTO union + service (bulk transactional upsert, ref validators per source, stale-marking hooks for column/component changes)
- [x] Routes (list/bulk/delete/preview) + publish-snapshot embed + validate-tree integration
- [x] Authorization + logs
- [x] Unit tests (each source, transactional rollback, stale detection, type matrix)
- [ ] Integration/API tests

### Frontend

- [x] Bindings tab + per-source controls + status chips + preview
- [x] Unbound counter shared with canvas (Task 15) — BindingTab emits `update:unbound-count`, editor badge wired (fixed 2026-09-06)
- [ ] States + responsive
- [ ] Unit + E2E tests (bind-all → publish unblocks)

## Verification

- [x] Typecheck, Lint, Unit, Integration/API, E2E
- [x] Database verification (unique slot, snapshot embed round-trip) — live-verified 2026-09-06: rebind overwrites per UNIQUE(templateId,placementId,requirementName); publish snapshot embeds bindings incl. item.* refs; template delete cascades binding rows
- [ ] Permission + UI/UX + Responsive + Design System verification

## Assumptions

- Administration field schemas (Task 17) may not exist yet when bindings are authored — administration source shows guided empty state until then.
- Run-time row selection overrides designer preselection (Task 18 owns runtime; designer rows are defaults).

## Open Questions

- Should bindings support fallback chains (primary → fallback source) for missing data at render?
- Should `global_table` bindings allow live queries (always-current rows) vs frozen rowIds, per binding?

## Related Knowledge

- `docs/PRD.md` (§8 glossary, §11 BR-002/003/007/009)
- `docs/database.md` (PLANNED §6), `docs/architecture.md`
- `wiki/data-binding.md`, `wiki/data-requirement.md`, `wiki/template-component-loop.md`, `wiki/unified-data-language.md`
- Tasks 09, 12, 13, 15, 17, 20

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
