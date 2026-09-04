# Task 20 — Rendering Engine

## Status

TODO

## Objective

Ship the single generic renderer that resolves any template tree — data refs, components, bindings, loops, conditions, expressions — into sanitized HTML DOM and then PDF, used identically by live previews and final document issuance.

## Context

The "Renderer-driven" principle forbids per-template PDF code. This engine is the shared resolve pipeline every preview (Tasks 13/15/16/18) and issuance (Task 19) calls. Source: `wiki/rendering-engine.md`, `wiki/runtime-flow.md` (Resolve.* stages), `architecture.md` Rendering Engine layer.

## Scope

### In Scope

- Resolve pipeline: Data → Component → Binding → Loop → Condition → HTML DOM (exact wiki stage order)
- Node handlers: text, image, richtext, component (single+collection), loop, condition, table, page-break, data-token, expression
- HTML sanitizer (output allowlist) + print CSS (A4, page-break support, Kop-friendly header)
- PDF generation (headless Chromium or wkhtmltopdf-class lib — implementation choice documented here, headless Chromium preferred for CSS fidelity)
- Deterministic, logged, timeout-guarded render service + preview endpoint

### Out of Scope

- Editor UIs (Tasks 15/16/18 own their preview panes; they call this)
- Document storage/serving (Task 19)

## Actors

- System — renders on preview request and run completion

## Dependencies

- Task 09 (expression evaluation inside conditions/tokens) — required
- Task 15 (node tree shape) — required
- Task 16 (bindings) — required
- Task 13/14 (pinned versions resolve inputs) — required

## Requirements

- REQ-001: `render(tree, context)` executes stages in order: resolve data refs → components → bindings → loops → conditions → HTML.
- REQ-002: Collection components iterate the bound collection rendering one block per item with `item.*` scope (Task 16).
- REQ-003: Conditions include/exclude subtrees via Task 09 boolean evaluation; evaluation errors → exclude + collect warning (never crash render).
- REQ-004: Output HTML is sanitized + styled with print CSS; `htmlToPdf(html)` returns PDF buffer deterministically for identical input.
- REQ-005: `POST /api/render/preview` `{ templateId|tree, context }` → `{ html, warnings[] }` (Designer/Operator, debounced by callers).
- REQ-006: Internal `renderForDocument(runSnapshot)` used by run completion (Task 18/19 hook) returns `{ html, pdfPath, warnings }` with per-stage timings logged.

## Business Rules

- BR-001: Renderer is pure w.r.t. live tables at issuance: it renders ONLY the frozen snapshot passed in (no lazy re-fetch that could drift).
- BR-002: Missing data → empty string + warning entry (render succeeds with warnings; issuance succeeds — warnings stored alongside document for audit).
- BR-003: Loop collections capped at 500 items per render (beyond → warning + truncation marker in output).
- BR-004: Render timeout 10s (preview) / 30s (issuance); timeout → structured error, no partial document persisted.
- BR-005: Images resolved to absolute storage URLs at render; missing image → placeholder box + warning.
- BR-006: One engine serves all templates (no template-specific code paths; violations caught in review).

## Domain

```text
TREE (Task 15) + BINDINGS (Task 16) + DATA CONTEXT (run snapshot + system)
        │ stages: Data → Component → Binding → Loop → Condition
        ▼
    HTML DOM (sanitized + print CSS)
        │
        ▼
       PDF
```

## Data Model

No new tables. Warning entry contract:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| code | string | Yes | MISSING_DATA\|EXPR_ERROR\|LOOP_TRUNCATED\|IMAGE_MISSING\|TIMEOUT |
| nodeId | string NULLABLE | No | Tree node implicated |
| message | string | Yes | Human-readable |

## API

- `POST /api/render/preview` (auth; Designer/Operator) — validates tree via Task 15 schemas, evaluates with Task 09, returns html + warnings (HTML sanitized).
- Internal service `RenderingService.renderForDocument(snapshot)` — no public route; invoked by run-complete.

## UI/UX

No dedicated page. Contract for consumer panes (Tasks 13/15/16/18, 19 preview):

- Preview component states: rendering (skeleton), rendered (sandboxed iframe), warnings (collapsible amber NAlert listing codes), error (red NAlert + retry), empty context notice.
- Print CSS must honor: A4 `@page`, `.page-break { break-after: page }`, Kop header repetition via `<thead>` in tables, base font Inter 11pt for documents.

States + responsive behavior inherited from host panes; renderer guarantees HTML is self-contained (inline critical CSS) so iframes render identically everywhere.

## Validation

- Zod on preview payload (tree nodes per Task 15 schemas + context object caps: ≤1MB JSON).
- Engine-level: node-kind dispatch exhaustive (unknown kind → warning + skip, never throw).

## Security & Permission

- Sanitization allowlist on output (no script/iframe/form/on*/javascript: URLs); image URLs restricted to `/api/storage/*` + data: URIs ≤2MB.
- Preview endpoint rate-limited (30/min/user) to bound Chromium cost; issuance path queued if concurrent renders >4 (simple in-process semaphore, 503+Retry-After when saturated).
- No PII in render logs beyond node ids + warning codes.

## Acceptance Criteria

### AC-001

Given Surat Tugas tree + 3-row collection binding, when rendered, then HTML contains 3 numbered blocks with correct NIP/jabatan each.

### AC-002

Given false condition, when rendered, then conditioned subtree absent and warning-free (clean exclusion).

### AC-003

Given missing binding value, when rendered, then empty string + MISSING_DATA warning; render still succeeds.

### AC-004

Given identical snapshot rendered twice, when compared, then HTML byte-identical and PDFs visually identical (hash of HTML equal).

### AC-005

Given 600-item collection, when rendered, then 500 items + truncation marker + LOOP_TRUNCATED warning.

### AC-006

Given `<script>` in richtext content, when rendered, then stripped from output HTML.

### AC-007

Given preview storm (10 concurrent), when exceeded, then 503+Retry-After instead of crash.

## Implementation

### Backend

- [ ] `server/utils/rendering/` (pipeline stages, node handlers, sanitizer config, print CSS, pdf adapter w/ Chromium)
- [ ] Preview DTO + route + rate limit + semaphore
- [ ] `renderForDocument` service + run-complete integration + warnings persistence hook (Task 19 field — coordinate)
- [ ] PDF dependency install + build notes (native/Chromium binary handling alongside better-sqlite3/bcrypt note in AGENTS.md)
- [ ] Unit tests (each node kind, stage order, single/collection, condition true/false/error, truncation, sanitizer XSS vectors, determinism)
- [ ] Integration/API tests (preview + 3-doc multi-template run golden HTML fixtures)

### Frontend

- [ ] Shared `DocumentPreview` component (iframe + warnings + skeleton/error) consumed by Tasks 13/15/16/18/19
- [ ] Unit tests

## Verification

- [ ] Typecheck, Lint, Unit (target ≥85% on pipeline), Integration/API, E2E (run → documents match golden HTML modulo ids/dates)
- [ ] Security verification (XSS payload suite, URL allowlist, rate-limit check)
- [ ] Performance verification (p95 preview <2s for 3-page doc; issuance <15s)
- [ ] Permission + Responsive verification via host panes

## Assumptions

- Headless Chromium (e.g. puppeteer-class) chosen for CSS fidelity; if binary size blocks deployment, fallback to pure-HTML issuance with PDF deferred — decision logged at implementation start.
- Warnings stored on document record (Task 19 adds `renderWarnings` JSON — cross-task note).

## Open Questions

- Should PDFs embed fonts (Inter) for offline fidelity, or is system-font fallback acceptable v1?
- Do we need header/footer page numbers (Surat Dinas format) as first-class nodes, or does CSS `@page @bottom` suffice?

## Related Knowledge

- `docs/PRD.md` (§10.2 Rendering Engine, §12 server-side constraint)
- `docs/architecture.md` (Rendering Engine layer), `docs/database.md` (documents output fields)
- `wiki/rendering-engine.md`, `wiki/runtime-flow.md`, `wiki/template-component-loop.md`
- Tasks 09, 13, 15, 16, 18, 19

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
