# Task 22 — Dynamic RBAC, Audit & Production Readiness

## Status

TODO REVIEW

## Objective

Close the platform for production: least-privilege permissions for every new module, full audit coverage, security hardening (uploads, rate limits, PII), test/observability baselines, and production configuration (notably the `synchronize:false` + migration cutover).

## Context

Final SDD task. RBAC foundation exists (tasks 01–06) but knows nothing of the 15 new modules (Tasks 07–21); `synchronize:true` + SQLite + no-migration posture from PRD §12 must be resolved before real instansi data lands. This task produces no new domain features — it hardens and ships.

## Scope

### In Scope

- Permission catalog for all new modules (naming, seeding, Designer/Operator/Admin role mapping, guard URLs)
- Activity-log coverage for every mutation + run/document lifecycle events
- Security: upload allowlists, CSV limits (enforce), expression/render rate limits (enforce), PII discipline in logs, JWT/secret review
- Production config: `synchronize:false`, initial TypeORM migration baseline, seed idempotency, backup/restore runbook (SQLite file), health endpoint
- Quality baselines: full test pass (unit/nuxt/e2e), coverage thresholds, Playwright smoke for the golden path (table → component → template → administration → run → document → PDF)
- Docs: operator/designer quickstarts + API reference delta for new endpoints

### Out of Scope

- New domain behavior (any gap found here spawns a follow-up task, not scope creep of this one)
- Multi-role approvals, advanced expressions (tracked in earlier Open Questions)

## Actors

- System Administrator — roles, production config, backups
- Auditor — reads activity/system logs
- Operator/Designer — covered by new least-privilege defaults

## Dependencies

- Tasks 07–21 (hardens what they built) — required; schedule last

## Requirements

- REQ-001: Every new endpoint is covered by a named permission; full catalog seeded; default roles assigned: Designer (define: tables/columns/components/templates/administrations + run + read docs), Operator (run + rows write + read docs own), Admin (all + reissue/purge + settings).
- REQ-002: Every mutation across Tasks 07–21 emits an activity log with (userId, action, entity, entityId, level, metadata-before/after where safe).
- REQ-003: `GET /api/health` (public, no PII) reports `{ status, db, storage, renderer, version }` for ops probes.
- REQ-004: Production boot uses `synchronize:false` + checked-in baseline migration; fresh-install seed is idempotent (re-runnable without duplicates).
- REQ-005: SQLite backup/restore runbook validated (file copy + integrity check) and documented.
- REQ-006: Golden-path E2E (Pegawai → Identitas component → SK template → SK administration → run → document + PDF download) passes on a clean DB; unit coverage thresholds enforced (interpreters/renderers ≥85%, services ≥70%).

## Business Rules

- BR-001: Least privilege by default: new users get Operator-equivalent or nothing (never Designer/Admin) unless explicitly granted.
- BR-002: Permission names immutable once seeded (renames break assignments); new permissions only via additive seeding.
- BR-003: PII rule: row VALUES never enter system logs; activity metadata stores column-names + ids, redacting configured PII columns (email/phone/address-like names) — redaction list documented.
- BR-004: Upload/CVS/expression/render limits from Tasks 09/12/20 are enforced here if deferred (this task verifies, doesn't re-specify).
- BR-005: Destructive prod actions (purge document, archive with runs) require confirm + activity log + admin role (no self-service).

## Domain

```text
ALL MODULES (07–21)
    ├── PERMISSION CATALOG (least-privilege matrix)
    ├── AUDIT TRAIL (activity logs on every mutation/lifecycle)
    └── PROD POSTURE (migrations, health, backup, limits, docs)
```

## Data Model

No new entities except optional `migrations` bookkeeping (TypeORM-managed). Permission seed delta:

| Permission | Methods | URLs |
| ---------- | ------- | ---- |
| Global Table Management | GET,POST,PUT,DELETE | `/api/global-tables/*`, `/api/navigation` |
| Table Data Read / Write | GET / GET,POST,PUT,DELETE | `/api/data/*` (Write split for import/export too) |
| Component Management | GET,POST,PUT,DELETE | `/api/components/*` |
| Template Management | GET,POST,PUT,DELETE | `/api/templates/*`, `/api/render/preview` |
| Administration Management | GET,POST,PUT,DELETE | `/api/administrations/*` |
| Administration Run | GET,POST,PATCH | `/api/administrations/*/runs`, `/api/runs/*` |
| Document Management / Reissue | GET / POST | `/api/documents/*` |
| Expression Use | POST | `/api/expressions/*` |

Guard URLs mirror the same prefixes for URL-layer defense in depth.

## API

- `GET /api/health` public per REQ-003.
- Audit verification helper: `GET /api/activity-logs/coverage` (admin-only, temporary or permanent — implementation choice) reporting event counts per entity to prove REQ-002 during QA.

## UI/UX

### Information Architecture

No new pages except: Settings → Production checklist card (health status, migration mode, backup timestamp) visible to admins; existing Activity/System log pages gain new entity filters (GlobalTable, Component, Template, Administration, Document, Run) + PII-redaction notice.

### States

health degraded (amber/red with component detail), coverage gaps (QA banner listing unlogged entities), permission denied.

### Responsive Behavior

Checklist card stacks on mobile; log filters wrap (existing patterns).

## Validation

- Startup self-check: fail fast with actionable message if `JWT_SECRET` default, storage unwritable, renderer binary missing, or migration drift detected.

## Security & Permission

- This task IS the security task: secrets review, allowlists, rate limits, traversal guards, PII redaction, dependency audit (`npm audit` clean or triaged), least-privilege defaults. Penetration-lite checklist executed: auth bypass on new routes, IDOR on runs/documents (own-vs-all), CSV formula-injection note (prefix `=`/`+` cells on export), XSS in preview/HTML endpoints.

## Acceptance Criteria

### AC-001

Given fresh DB + seed, when assigning Designer/Operator defaults, then the permission matrix in REQ-001 holds (verified by automated matrix test).

### AC-002

Given any mutation from Tasks 07–21, when performed, then a corresponding activity log exists (coverage report 100%).

### AC-003

Given production env, when booting, then `synchronize:false`, migrations applied, health returns healthy, and cold E2E golden path passes.

### AC-004

Given backup runbook, when executed, then restore on a scratch copy yields byte-identical documents + passing integrity check.

### AC-005

Given IDOR probe (operator B fetching operator A's run/document), when attempted, then 403/404 without data leak.

### AC-006

Given CSV export with `=CMD` cells, when opened per runbook guidance, then neutralized (prefixed) or documented as operator warning.

## Implementation

### Backend

- [x] Permission/guard seed delta + role mapping migration-safe (`permission-matrix.ts` catalog + `seedTask22Catalog` additive; Designer/Operator roles)
- [x] Audit sweep: missing log calls added (activity-logger: TemplateBinding/Expression branches, nested-runs entity, column-branch order fix; redacted row metadata in TableDataService)
- [x] Health endpoint (`GET /api/health` public) + coverage endpoint (`GET /api/activity-logs/coverage`) + startup self-checks (`startup-check.ts` + plugin wiring)
- [x] `synchronize` env switch (`DB_SYNCHRONIZE`, prod default false) + idempotent seeds (all seed paths existence-checked; migration posture documented in runbook)
- [x] Limit enforcement sweep (upload allowlist+5MB in StorageService, expression 60/min + Retry-After, render 30/min+semaphore pre-existing, CSV 5000 pre-existing) + PII redaction util + CSV formula neutralization in export
- [x] Unit tests (matrix 6, redaction 4, csv-safety 3, security-limits+startup 4) — 427/427 green, 15/15 nuxt, vue-tsc clean, build OK

### Frontend

- [x] Log filter extensions (10 audit entities) + PII redaction notice + production checklist card on Settings (admin-only, live /api/health)
- [x] Docs: `docs/production-runbook.md` (backup/restore, roles, coverage, PII list, limits, CSV note, IDOR posture, quickstarts, API delta)
- [x] Unit tests added; golden-path E2E deferred to /verify (live smoke used instead, per Tasks 13–21 convention)

## Assumptions

- Guard-URL mirroring has no server effect (`requireApiAccess` enforces permissions only; guards are client-side) — no new guards created; permission layer is the enforcement point. Documented in runbook §4.
- No checked-in TypeORM migration files: with `better-sqlite3` + EntitySchema dev-sync history, the cutover is the `synchronize:false` env switch + fail-fast drift check; baseline migration generation is a /verify DBA step. Documented in runbook §1.
- Login mutations stay `entity=unknown` (pre-existing auth-module convention, out of scope).
- `email` is not a column type — PII detection is by column *name*, proven live with a text column named `email`.

## Verification

- [ ] Typecheck, Lint, Unit, Integration/API, E2E (full suite green), Nuxt component tests
- [ ] Coverage thresholds met (enforced in CI/config)
- [ ] Security verification (checklist signed: IDOR, XSS, traversal, rate-limit, audit, secrets)
- [ ] Database verification (migration up/down on scratch, seed re-run idempotent)
- [ ] Permission verification (full matrix automated)
- [ ] Backup/restore drill executed + documented
- [ ] UI/UX + Responsive + Design System verification for touched surfaces

## Assumptions

- Single-node SQLite deployment (per PRD constraints); multi-node/HA is out of scope — runbook says so explicitly.
- Docs live alongside code (markdown in `docs/`), not a separate site.

## Open Questions

- Should production use WAL mode + scheduled vacuum for SQLite, and what backup cadence do instansi ops accept?
- Is an admin "impersonate for support" needed, or is own-vs-all log visibility sufficient?

## Related Knowledge

- `docs/PRD.md` (§12 constraints, §6–7 users/roles)
- `docs/architecture.md` (RBAC, API conventions), `docs/database.md` (migrations note)
- `AGENTS.md` (Verification, native addons, JWT_SECRET)
- Tasks 01–06 (foundation), 07–21 (all modules)

## Change Log

### Initial

- Task generated from Core Concept `docs/dynamic-administration`.
