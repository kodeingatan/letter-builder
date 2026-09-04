# Task 09 — Expression Engine & Unified Data Language

## Status

TODO

## Objective

Provide one shared, server-side-evaluated expression language (`{{data.*}}`) with arithmetic, string concat, and comparisons — the single "data language" used by computed fields, bindings, conditions, and the renderer.

## Context

The wiki mandates "Satu Bahasa Data untuk Seluruh Sistem" to avoid divergent syntaxes across modules. This is a cross-cutting platform service with no UI of its own; Tasks 10 (computed), 15/16 (template condition/binding), and 20 (renderer) all depend on it. Source: `wiki/expression-engine.md`, `wiki/unified-data-language.md`, PRD §11 BR-009.

## Scope

### In Scope

- Expression syntax spec + parser + sandboxed server-side evaluator
- Data-context model (`data.*`, `component.*`, `system.*`: current_date, user)
- Operators v1: `+ - * /`, `++` (concat), `"string"`, numbers, parentheses, comparisons (`== != > < >= <=`), field refs
- `IF`-as-function v1: `IF(cond, a, b)` (wiki lists IF/ELSE as "later" — minimal ternary-function form now)
- Pure-function API usable by backend services + validation endpoint for editors
- Security: no code exec, timeouts, depth/length limits

### Out of Scope

- Aggregation (SUM/COUNT/MIN/MAX), ROUND, DATE_FORMAT, CONCAT-variadic (deferred — tracked as Open Questions, NOT promised here)
- Client-side evaluation (forbidden — server-side only per PRD constraints)
- Template loop/condition UI (Tasks 15/16 consume the engine)

## Actors

- System (service) — evaluates expressions for computed fields, bindings, conditions, renderer
- Designer — writes expressions in column/binding/condition editors (validated live via API)

## Dependencies

- Task 07 (tables exist as data sources conceptually). No UI dependency.

## Requirements

- REQ-001: Single canonical syntax `{{ <expr> }}` matching PRD examples (`{{harga}} * {{jumlah}}`, `{{nama}} ++ " - " ++ {{jabatan}}`, `{{data.pegawai.nip}}`, `{{component.identitas_pegawai}}`, `{{current_date}}`, `{{user.name}}`).
- REQ-002: Evaluator resolves refs against a supplied data context and returns typed result (string/number/boolean/date/null).
- REQ-003: Missing/null refs evaluate safely (null-propagation → null, never throw to caller; errors returned as structured `{ value, error }`).
- REQ-004: `POST /api/expressions/validate` dry-runs an expression against a sample context for editor UX.
- REQ-005: `POST /api/expressions/evaluate` (restricted permission) for server-driven previews.
- REQ-006: Dependency extraction: `extractRefs(expr) → string[]` so computed fields know their dependencies.

## Business Rules

- BR-001: Server-side evaluation ONLY. Client must never `eval`; preview calls the validate/evaluate API.
- BR-002: No loops, no function definitions, no property access beyond whitelisted context paths. Max expression length 2000 chars, max AST depth 20, evaluation timeout 100ms.
- BR-003: `++` is string concat (coerces operands); `+` is numeric add (non-numeric → error, not silent concat).
- BR-004: Division by zero → structured error (not Infinity persisted).
- BR-005: System refs whitelist: `current_date`, `user.name`, `user.username`, `administration.*`, `data.*`, `component.*`. Anything else → validation error.
- BR-006: Deterministic: same context + expression ⇒ same result (no randomness/date-now except via `current_date` injected context).

## Domain

```text
DATA CONTEXT (Global Table rows + administration data + manual + system)
        │
        ▼
EXPRESSION ENGINE (parse → resolve refs → evaluate, sandboxed)
        │
        ├──→ computed field result (Task 10)
        ├──→ binding value (Task 16)
        ├──→ condition boolean (Task 15)
        └──→ rendered text (Task 20)
```

## Data Model

No new persistent entity. Optional `expression_cache` is out of scope (no caching v1).

Value contract:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| value | string\|number\|boolean\|null | Cond. | Result when no error |
| error | string NULLABLE | Cond. | Machine-readable error code + message |

Error codes: `UNKNOWN_REF`, `TYPE_MISMATCH`, `DIV_BY_ZERO`, `SYNTAX_ERROR`, `LIMIT_EXCEEDED`, `TIMEOUT`.

## API

### Validate

`POST /api/expressions/validate` `{ expression, sampleContext? }` → `{ valid, refs: string[], error? }`. Auth required; Designer permission.

### Evaluate

`POST /api/expressions/evaluate` `{ expression, context }` → `{ value, error? }`. Restricted (Designer + system-internal use).

Both validate with Zod (expression required, ≤2000 chars).

## UI/UX

No dedicated page. Consumers embed:

- Expression input (NInput monospace) + live Validate (debounced 500ms → green check / red message + extracted refs chips).
- Shared client helper `useExpressionPreview()` (calls validate API) reused by Tasks 10/15/16 — defined here, implemented with first consumer.

States: valid, invalid (message + position hint where parser provides), validating (spinner), permission denied.

## Validation

- Zod on API; grammar-level validation in engine (tokenizer → parser with position-aware errors).

## Security & Permission

- Sandbox: hand-written parser/interpreter (no `eval`/`Function`); path resolution against whitelisted context only; timeout + depth guards; length limits.
- Endpoints require Designer permission. All evaluate calls logged at DEBUG with expression hash (never raw PII context).

## Acceptance Criteria

### AC-001

Given `harga=20000, jumlah=3`, when evaluating `{{harga}} * {{jumlah}}`, then result is `60000` (number).

### AC-002

Given `nama, jabatan`, when evaluating `{{nama}} ++ " - " ++ {{jabatan}}`, then result is `"Afdal - Programmer"`.

### AC-003

Given an unknown ref, when validating, then `valid:false` with `UNKNOWN_REF` naming the ref.

### AC-004

Given `1/0`, when evaluating, then structured `DIV_BY_ZERO` error, no exception leak (500 never).

### AC-005

Given a 3000-char expression, when submitted, then rejected with `LIMIT_EXCEEDED`.

### AC-006

Given any expression, when inspected client-side, then no `eval`/`Function` constructor exists in the client bundle path (code review check).

## Implementation

### Backend

- [ ] Grammar spec (doc comment / `server/utils/expressions/grammar.md` brief)
- [ ] Tokenizer + parser + interpreter (`server/utils/expressions/*`, pure functions)
- [ ] `extractRefs()`, `validate()`, `evaluate(context)` with timeout/depth guards
- [ ] DTO + routes (`server/api/expressions/validate.post, evaluate.post`)
- [ ] Authorization (Designer permission)
- [ ] Unit tests (every operator, precedence, concat vs add, null-propagation, IF, all error codes, limits, malicious input `constructor`, `__proto__`, infinite nesting)
- [ ] Integration/API tests

### Frontend

- [ ] `useExpressionPreview` composable + expression input component (shared)
- [ ] Unit tests for composable (mock API)

## Verification

- [ ] Typecheck, Lint, Unit (target ≥90% branch on interpreter), Integration/API
- [ ] Security verification (payload fuzz: deep nesting, huge input, prototype-pollution strings)
- [ ] Permission verification
- [ ] Performance check (1000 evaluations < 1s local)

## Assumptions

- Hand-written interpreter (no external dep) to keep bundle + audit surface small.
- `IF(cond,a,b)` satisfies the wiki's IF/ELSE need for v1; full statement IF deferred.

## Open Questions

- Should SUM/COUNT/MIN/MAX/DATE_FORMAT/ROUND land in v2 as aggregate functions over collections (needed by looping reports), and with what exact signatures?
- Should expressions support date arithmetic (e.g. `{{tanggal}} + 7d`)?

## Related Knowledge

- `docs/PRD.md` (§10.2 Expression Engine, §11 BR-009, §12 constraints)
- `docs/architecture.md` (Expression Engine layer)
- `docs/database.md` (computed `expression` column)
- `wiki/expression-engine.md`, `wiki/unified-data-language.md`, `wiki/computed-field.md`

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
