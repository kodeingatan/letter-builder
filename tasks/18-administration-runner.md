# Task 18 — Administration Runner

## Status

TODO

## Objective

Let Operators execute a published administration as a guided multi-step wizard (NSteps) — filling step fields, picking template row selections, previewing — then submitting a completed run that produces documents.

## Context

Implements the "Runtime Flow" (Pilih Administration → Step 1..N → Complete → Resolve → Render → PDF) from the operator's side. Consumes Task 17 (workflow), Task 12 (row picking), Task 16 (bindings context), and hands the frozen run to Tasks 19/20. Source: `wiki/runtime-flow.md`, `wiki/overall-flow.md`, `design-system.md` Administration Workflow UI.

## Scope

### In Scope

- Run session lifecycle (start → per-step save draft → back/next → complete/cancel)
- Per-step forms: step-local fields + template loop row selectors + manual binding inputs (Task 16 `manual` slots surface here)
- Live document preview per step (via Task 20 preview with current run context)
- Run validation (required fields, row selections) + completion producing a run record
- My-runs list (operator's in-progress + completed runs)

### Out of Scope

- Snapshot persistence format details (Task 19 owns document rows; this task creates the run input)
- Render engine internals (Task 20)
- Multi-operator approvals (PRD non-goal)

## Actors

- Operator (Staff) — runs administrations
- Designer — previews runs for testing (same UI, flagged test mode)

## Dependencies

- Task 17 (published workflows) — required
- Task 12 (row data to pick) — required
- Task 16 (binding slots needing manual values) — required
- Task 20 (preview render) — recommended (graceful fallback: raw data summary if renderer unavailable)

## Requirements

- REQ-001: Operator can start a run from the Administration menu (Task 21) or Administrations list; `latest` template pins resolve + freeze at start.
- REQ-002: Wizard shows NSteps with per-step status (pending/active/done/invalid); navigation back/next preserves entered data (autosaved draft per step).
- REQ-003: Each step renders: (a) step-local fields form (generated from Task 17 schema), (b) row selectors for template loop sources (Task 15 configs with designer defaults pre-checked), (c) manual binding inputs for slots sourced `manual`.
- REQ-004: Live preview pane (per step + final) renders current context via Task 20 preview API (debounced).
- REQ-005: Completion validates all steps; success creates run + triggers document generation (Tasks 19/20) and navigates to the document (Task 19 view).
- REQ-006: Operator can cancel/resume runs; My Runs page lists status with resume/continue.

## Business Rules

- BR-001: Only `published` administrations are runnable; archived/draft → 422/empty state with explanation.
- BR-002: Run input frozen at completion (later definition edits never alter completed runs — Task 19 snapshot derives from this frozen input).
- BR-003: Row selections limited to rows the operator may Read (Task 12 permission filter enforced server-side on every step save).
- BR-004: Step saves are idempotent partial updates (PATCH per step); completion is a single atomic transition (no half-completed runs producing documents).
- BR-005: Runs record `startedBy`, `startedAt`, `completedAt`, administration version, resolved template versions.

## Domain

```text
ADMINISTRATION (published, Task 17)
    └── RUN (session: status in_progress|completed|cancelled)
            ├── STEP DATA (per-step field values + row selections + manual inputs)
            └── RESOLVED PINS (template versions frozen at start)
                    │ on complete
                    ▼
                DOCUMENT generation (Tasks 19/20)
```

## Data Model

### administration_runs (new)

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | INTEGER PK | — | Auto |
| administrationId | INTEGER FK → administrations.id | Yes | Workflow |
| administrationVersion | INTEGER | Yes | Frozen workflow version |
| resolvedPins | TEXT | Yes | JSON `[{ stepId, templateId, version }]` frozen at start |
| stepData | TEXT | Yes | JSON `{ stepId: { fields, rowSelections, manualInputs } }` |
| status | VARCHAR(16) | — | in_progress\|completed\|cancelled |
| startedBy | INTEGER FK → users.id NULLABLE | No | Operator (SET NULL on user delete) |
| startedAt / completedAt | DATETIME NULLABLE | — | Timestamps |
| createdAt / updatedAt | DATETIME | — | Auto |

INDEX(administrationId, status). Document linkage (Task 19 `administrationId` + run reference) added in Task 19.

## API

- `POST /api/administrations/:id/runs` → start (resolves pins, returns run + step skeletons).
- `GET /api/runs/mine` → operator's runs (paginated, filter status).
- `GET /api/runs/:runId` → run + workflow + per-step schemas + current data.
- `PATCH /api/runs/:runId/steps/:stepId` → save step data (validates fields + row readability).
- `POST /api/runs/:runId/complete` → atomic validate-all → creates documents (Tasks 19/20 hook) → `{ runId, documentIds }`.
- `POST /api/runs/:runId/cancel` → cancelled (no documents).

## UI/UX

### Information Architecture

`Persuratan > {Administration}` run page `/dashboard/docs/run/:adminId` + wizard `/dashboard/docs/runs/:runId` + `My Runs` page. Entry from Generated Menu (Task 21).

### User Flow

Pick Administration → Start → Step 1 form (+row picks) → Next (autosaved, step validated) → … → Final review (all steps summary + live preview) → Complete → success → open Document.

### Wizard

NSteps header (clickable completed steps), per-step NCard form (generated fields + RelationSelector-style row pickers with search + manual inputs), sticky footer (Back / Save draft / Next), right-side (desktop) live preview tab (Rendered / Data JSON toggle). Mobile: preview becomes full-screen modal.

### My Runs

DataTable: Administration, Status tag, Started, Completed, Actions (Resume / View documents). Standard features.

### States

loading run, step invalid (block Next with reasons), row unreadable (dropped with warning), preview error (fallback to data summary), run cancelled/completed read-only, permission denied.

### Responsive Behavior

Steps header scrolls horizontally on mobile; footer sticky; forms single-column <768px.

## Validation

- Zod per-step against Task 17 field schema + row-id existence + manual-slot types (Task 16); completion re-validates everything server-side in one transaction.

## Security & Permission

- Permission `Administration Run` (start/save/complete own runs) separate from `Administration Management` (design). Operators see only runnable administrations + own runs (admins may see all runs — list filter `?scope=all` gated).
- Activity logs: run started/completed/cancelled (entity `AdministrationRun`).

## Acceptance Criteria

### AC-001

Given published Perjalanan Dinas, when Operator starts, then wizard shows all steps with designer-default rows pre-checked.

### AC-002

Given missing required field, when clicking Next, then blocked with field error and no data loss on Back.

### AC-003

Given all steps valid, when completing, then document(s) created and operator lands on the document view.

### AC-004

Given archived administration, when starting, then blocked with archived explanation.

### AC-005

Given row revoked mid-run, when saving the step, then row dropped with warning and step re-validates.

### AC-006

Given reload mid-run, when reopening, then entered data restored (resume).

## Implementation

### Backend

- [ ] Entity + DTO (start/step-save/complete) + service (pin resolution, step validation, atomic complete + document hook interface for Tasks 19/20)
- [ ] Routes (nested + `/api/runs/*`)
- [ ] Authorization (Run vs Management split) + logs
- [ ] Unit tests (pin freeze, partial saves, atomic complete, permission scoping)
- [ ] Integration/API tests

### Frontend

- [ ] Types/store (`runs`) + Wizard page + step form renderer + row pickers + manual inputs + preview pane + My Runs page
- [ ] Autosave (debounced) + resume
- [ ] States + responsive
- [ ] Unit + E2E tests (full 3-step run → document)

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E
- [ ] Database verification (frozen pins/input, atomic complete)
- [ ] Permission verification (Operator vs Designer matrix)
- [ ] UI/UX + Responsive + Design System verification (NSteps pattern)

## Assumptions

- Single-operator runs v1 (no handoff); step assignees deferred per Task 17 question.
- Live preview uses Task 20; data-summary fallback keeps this task shippable independently.

## Open Questions

- Should runs support liều "save as template defaults" (operator promotes their selections to designer defaults)?
- Do we need run expiry (abandoned drafts auto-cancel after N days)?

## Related Knowledge

- `docs/PRD.md` (§6 target users, §9.2 workflow steps 5–7)
- `docs/design-system.md` (Administration Workflow UI — NSteps)
- `wiki/runtime-flow.md`, `wiki/overall-flow.md`, `wiki/step.md`
- Tasks 12, 15, 16, 17, 19, 20, 21

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
