# Task 15 — Template Composition Editor

## Status

TODO

## Objective

Give Designers a document-composition canvas — rich text with embedded components, loops, conditions, tables, images, and page breaks — plus the right-click context menu to insert dynamic elements.

## Context

Implements "Rich Text Template = Composition Canvas" + "Context Menu = Insert Dynamic Component" + "Template + Component + Loop". Builds on the draft skeleton of Task 14; binding VALUES are Task 16 (placements here, values there). Source: `wiki/rich-text-template.md`, `wiki/context-menu.md`, `wiki/template-component-loop.md`, `design-system.md` Template editor direction.

## Scope

### In Scope

- Canvas editor: text, image, table, component placement, dynamic data token, loop block, condition block, page break
- Context menu (right-click): Insert Component / Dynamic Text / Dynamic Image / Table / Page Break (+ Loop, Condition)
- Component placement with loop source config (table + row selection mode: all/selected/filter)
- Condition builder (field + operator + value, Task 09 expression subset)
- Node tree persistence into Task 14 draft `content` JSON

### Out of Scope

- Binding each requirement to a concrete source value (Task 16)
- Render execution (Task 20)

## Actors

- Designer — composes blueprints

## Dependencies

- Task 14 (template draft lifecycle) — required
- Task 13 (components to place) — required
- Task 09 (condition expressions) — recommended

## Requirements

- REQ-001: Canvas supports node kinds: `text`, `image`, `table`, `component`, `data-token`, `loop`, `condition`, `page-break` (per wiki composition list).
- REQ-002: Right-click context menu inserts the chosen node at caret; choosing Component opens picker → placement created with component's requirements listed as unbound slots.
- REQ-003: Loop block wraps a component placement with source config `{ tableName, mode: all|selected|filtered, rowIds?, filter? }` and per-item rendering.
- REQ-004: Condition block wraps any nodes with `{ expression }` evaluated per Task 09 against run context; true shows children.
- REQ-005: Editor serializes to the Task 14 draft JSON tree; loading a draft restores the canvas 1:1.
- REQ-006: Unbound requirement slots are visually flagged (amber) and block Publish (Task 14 publish validates zero unbound).

## Business Rules

- BR-001: Component placements pin component `id + version` (default: latest-published at insert; changeable via picker).
- BR-002: Loop source table must exist; `selected` mode requires ≥1 rowId; rowIds validated against table at save (stale ids → warning, not silent drop).
- BR-003: Condition expression must validate via Task 09 (`valid:true`, boolean-coercible); otherwise save blocked.
- BR-004: `data-token` nodes contain raw `{{...}}` validated by Task 09; invalid tokens flagged red inline.
- BR-005: Page-break nodes are layout-only (no data); max nesting depth loop⊂condition⊂loop ≤ 3.

## Domain

```text
TEMPLATE draft (Task 14)
    └── NODE TREE
            ├── text / image / table / page-break (static)
            ├── component placement (id+version + unbound slots → Task 16 fills)
            ├── data-token ({{...}})
            ├── loop (source config + children)
            └── condition (expression + children)
```

## Data Model

No new tables. Draft `content` JSON node shape (extends Task 14):

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | string | Yes | Client-generated node key (uuid) |
| kind | enum | Yes | Node kinds above |
| attrs | object | Cond. | Per-kind: componentId/version, expression, source config, src, table JSON |
| children | node[] | Cond. | For loop/condition/containers |

Versioned snapshots (Task 14) freeze this tree verbatim.

## API

No new endpoints except publish-guard extension: `POST /api/templates/:id/publish` (Task 14) additionally rejects unbound slots (`422 { code:'UNBOUND_REQUIREMENTS', slots:[...] }`) and invalid conditions/tokens. Validation helper endpoint `POST /api/templates/:id/validate-tree` → `{ valid, unbound, errors[] }` for live editor feedback.

## UI/UX

### Information Architecture

Same editor page as Task 14 (`/dashboard/docs/templates/:id`); this task upgrades the skeleton textarea into the visual canvas + side panel.

### User Flow

Type text → right-click → Insert Component → pick component (+version) → placement appears with requirement slot chips → select loop/condition wrap from toolbar → configure in side panel → live structural preview → Save draft → Publish (blocked while amber slots remain).

### Canvas

Contenteditable-based canvas (TipTap-like minimal or custom contenteditable — implementation choice, Naive UI for all chrome): toolbar (bold/italic/table/image/token/loop/condition/page-break), placements rendered as bordered cards (component name + version chip + slot chips green/amber), loops as dashed containers with source summary, conditions with expression pill, page breaks as ruled dividers.

### Context Menu

NDropdown on `contextmenu`: Insert Component / Dynamic Text / Dynamic Image / Table / Loop / Condition / Page Break — each opens its picker/config inline. Keyboard accessible via toolbar equivalents.

### Side Panel

Inspector for selected node: component version picker, loop source config (table select → mode radio → row multi-select via Task 11 lookup / filter builder-lite), condition expression input with Task 09 live validation.

### Interaction

Drag to reorder top-level nodes (optional v1 — up/down arrows acceptable fallback). All destructive wraps (unwrap loop/condition) confirm.

### States

loading draft, empty canvas ("Right-click or use toolbar to insert"), invalid token/condition inline, unbound-blocked publish banner listing slots, permission denied.

### Responsive Behavior

Side panel becomes bottom drawer on <1024px; toolbar scrolls horizontally on mobile.

## Validation

- Client: tree validated live via `validate-tree` (debounced); server re-validates on save + publish (authoritative).

## Security & Permission

- Same `Template Management` permission. Pasted HTML sanitized (allowlist: no script/iframe/on* handlers) before entering the tree.

## Acceptance Criteria

### AC-001

Given caret in canvas, when right-click → Insert Component → pick Daftar Pegawai, then placement with its requirement slots appears and persists after reload.

### AC-002

Given a loop wrap with 3 selected rows, when saved, then source config persists and structural preview lists 3 items.

### AC-003

Given an invalid condition expression, when set, then inline error shows and save is blocked.

### AC-004

Given unbound slots remain, when publishing, then 422 UNBOUND_REQUIREMENTS names every slot.

### AC-005

Given pasted `<script>` content, when inserted, then script is stripped and no script node persists.

## Implementation

### Backend

- [ ] Node-shape Zod schemas + tree validator (unbound scan, condition/token validation via Task 09, loop config checks)
- [ ] `validate-tree` endpoint + publish-guard extension
- [ ] Unit tests (every node kind, nesting limits, sanitization, unbound detection)
- [ ] Integration/API tests

### Frontend

- [ ] Canvas editor component + toolbar + context menu + inspector panel + structural preview
- [ ] Component picker (version-aware) + loop source config + condition input (Task 09 preview hook)
- [ ] Tree ↔ JSON serialization round-trip
- [ ] States + responsive + sanitization
- [ ] Unit + E2E tests (compose → save → reload → publish-block → bind-ready)

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Round-trip verification (compose → save → reload identical)
- [ ] Permission + UI/UX + Responsive + Design System verification (Naive chrome, no global-import violations)
- [ ] Accessibility check (toolbar keyboard paths for all context-menu actions)

## Assumptions

- Custom contenteditable canvas acceptable v1; full TipTap/ProseMirror migration is a later optimization, tree shape stays stable.
- Row filter builder is "lite" (field+operator+value AND-chain); advanced filters deferred.

## Open Questions

- Should loop filters support full Task 09 expressions over row fields, or is the lite builder enough for v1?
- Do we need per-node comments/annotations for multi-designer collaboration?

## Related Knowledge

- `docs/design-system.md` (Template editor direction)
- `wiki/rich-text-template.md`, `wiki/context-menu.md`, `wiki/template-component-loop.md`, `wiki/component-looping.md`
- Tasks 09, 11, 13, 14, 16

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
