# Task 24 — Startup Warnings Cleanup

## Status

TODO REVIEW

## Objective

Eliminate all noisy warnings on a clean `npm run dev` boot: Nuxt `Duplicated imports` auto-import collisions (8 type names across 3 module pairs), dev-mode `[startup] migration drift` + `JWT_SECRET_DEFAULT` warns, and the `VUE_ROUTER_R0004 /favicon.svg` 404 — while keeping every production fail-fast gate from Tasks 22–23 intact.

## Context

On a fresh dev boot the console currently shows three repeating warning groups (observed 07:05 AM):

1. `WARN Duplicated imports "UnboundSlot" | "TreeIssue" | "CompositionNode" | "CompositionKind"` — `shared/types/template.ts` ignored in favour of `server/utils/composition-tree.ts` (same pattern for `RenderWarning`/`RenderWarningCode` with `server/utils/rendering/types.ts`, and `StepIssue`/`StepField` with `server/utils/administration-helpers.ts`). Repeated on every Vite client/server rebuild (3× per boot). Root cause already flagged as non-blocking in the Task 15 verify/review and Task 16 review ("duplicated type definitions", "auto-import deduplication handles it") — but it was never fixed, and it still pollutes every boot.
2. `WARN [startup] migration drift detected (migrations-table-missing): pending:Baseline1788914913928` — emitted unconditionally by `server/plugins/database.server.ts` even in dev with `synchronize:true`, where the `migrations` bookkeeping table intentionally does not exist. Task 23 AC-005 blesses dev as "warn-only + serving", but the warn itself is noise on every dev boot.
3. `WARN [startup] JWT_SECRET_DEFAULT` — emitted in dev because `process.env.JWT_SECRET` is unset and `nuxt.config.ts` falls back to `default-secret-change-me`.
4. `WARN [VUE_ROUTER_R0004] No match found for location with path "/favicon.svg"` — `nuxt.config.ts` (`app.head.link`) and the seeder (`app_favicon = /favicon.svg`) reference `/favicon.svg`, but `apps/web/public/` is empty so no static file is ever served.

This task makes dev boot warning-clean without weakening the production posture (prod `MIGRATION_DRIFT` / `JWT_SECRET_DEFAULT` fatals stay fatal).

## Scope

### In Scope

- Deduplicate the 8 colliding type names so Nuxt auto-import (`unimport`) registers each exactly once:
  - `CompositionKind`, `CompositionNode`, `TreeIssue`, `UnboundSlot` (`shared/types/template.ts` vs `server/utils/composition-tree.ts`)
  - `RenderWarning`, `RenderWarningCode` (`shared/types/render.ts` vs `server/utils/rendering/types.ts`)
  - `StepField`, `StepIssue` (`shared/types/administration.ts` vs `server/utils/administration-helpers.ts`)
- Gate the dev-mode startup warns so a default `npm run dev` (no env vars, `synchronize:true`) prints zero `[startup]` warns, while prod behaviour is unchanged.
- Resolve `/favicon.svg` (provide the static file or remove/retarget the reference + seed value consistently).
- Unit tests for any changed pure logic (startup-check gating, type re-export surfacing); `vue-tsc` clean; build OK.

### Out of Scope

- Any schema, migration, entity, or API behaviour change (no new tables, no baseline edit — BR-001 from Task 23 still applies).
- Production runbook flow changes beyond documenting the new dev/prod warn matrix.
- Rich favicon/branding redesign (use the existing Inter/blue-500 identity; a minimal SVG placeholder matching current branding is enough).
- CI wiring / coverage thresholds (no CI in repo; same convention as Tasks 13–23).
- Fixing the pre-existing cold-boot Vite-compile E2E flake noted in Task 23 verify (out of scope unless the favicon change touches it).

## Actors

- Developer — runs `npm run dev`, owns warning-clean boot.
- System Administrator — owns prod boot, relies on unchanged fatal gates.
- Auditor — verifies no RBAC/audit/prod-posture regression.

## Requirements

- REQ-001 (auto-import dedup): After the fix, a clean `npm run dev` prints zero `Duplicated imports` warnings for the 8 listed names across client build, server build, and HMR rebuilds.
- REQ-002 (single source of truth): Each colliding type is defined exactly once and re-exported elsewhere (`export type { … } from …`); no copy-pasted duplicate interfaces remain for the 8 names. Both the existing client import path (`@/shared/types/…` / `~/shared/types/…`) and the existing server import path (`~~/server/utils/…`) keep working (via re-export, not via duplicated declarations).
- REQ-003 (dev drift silence): With dev defaults (`NODE_ENV` unset, no `DB_SYNCHRONIZE`, `synchronize:true`), boot prints no `[startup] migration drift …` warning and still serves + seeds normally.
- REQ-004 (prod drift intact): With `NODE_ENV=production DB_SYNCHRONIZE=false` against a DB whose `migrations` table is missing or whose applied set differs, boot still refuses with fatal `MIGRATION_DRIFT` (+ `process.exit(1)` + runbook pointer) exactly as Task 23 AC-003.
- REQ-005 (JWT dev silence without weakening prod): With dev defaults, boot prints no `[startup] JWT_SECRET_DEFAULT` warning; with `NODE_ENV=production` and no `JWT_SECRET`, boot still fatals with `JWT_SECRET_DEFAULT` exactly as Task 22/23.
- REQ-006 (favicon): Requesting `/favicon.svg` returns 200 (SVG) with no `VUE_ROUTER_R0004` warning, and the browser tab shows the icon on `/login` and `/dashboard`. The seeder `app_favicon` value and the `nuxt.config.ts` `head.link` value agree with the served path.
- REQ-007 (no regression): Full unit suite green, `vue-tsc` clean, `npm run build` OK, `GET /api/health` healthy after the change; permission catalog counts stable (no reseed drift).

## Business Rules

- BR-001: Never edit the applied baseline migration (`server/migrations/1788914913928-Baseline.ts`); this task touches zero migration files (inherits Task 23 BR-001).
- BR-002: `synchronize:true` remains dev/scratch-only; the dev warn-silence must be gated on the same condition (dev / synchronize mode), never by weakening the prod `migrationsRun` + drift gate.
- BR-003: Every `fatal` stays prod-only and keeps the `console.error + process.exit(1)` mechanism (Task 23 implementation note: a Nitro plugin `throw` alone does not refuse boot).
- BR-004: Type-shape compatibility is load-bearing: the surviving canonical definitions must be structurally identical to what clients and services consume today (composition tree, render warnings, step fields); no field renames, no widening/narrowing.
- BR-005: Static-asset fix must not introduce a new binary-asset pipeline: a single hand-authored `public/favicon.svg` (or a single consistent path change) — no icon-generation tooling, no new dependencies.

## Domain

```text
DEV BOOT WARNINGS (4 groups)
├── AUTO-IMPORT COLLISION (unimport scans shared/ + server/utils/)
│   ├── template.ts ↔ composition-tree.ts (4 names)
│   ├── render.ts ↔ rendering/types.ts (2 names)
│   └── administration.ts ↔ administration-helpers.ts (2 names)
├── STARTUP CHECK (startup-check.ts pure core + database.server.ts wiring)
│   ├── migration drift warn (dev noise / prod fatal)
│   └── JWT_SECRET_DEFAULT warn (dev noise / prod fatal)
└── STATIC ASSET (nuxt.config head.link + public/ + seeder app_favicon)
    └── /favicon.svg 404 → VUE_ROUTER_R0004
```

## Data Model

No new entities. No migration. Touched artifacts:

| Artifact | Location | Change |
| -------- | -------- | ------ |
| Canonical type definitions (1 per name, TBD which side survives) | `shared/types/` or `server/utils/` | Single declaration; other side becomes `export type { … } from …` re-export |
| Startup warn gating | `server/utils/startup-check.ts` and/or `server/plugins/database.server.ts` | Suppress dev-only warns under dev/synchronize condition; prod matrix unchanged |
| Dev secret default | `.env.development` / `.env.example` / `nuxt.config.ts` runtimeConfig (one consistent choice) | Dev boot resolves a non-default secret or explicitly acknowledged dev value so the warn does not fire |
| Favicon asset | `apps/web/public/favicon.svg` (or agreed alternate path) | New static file; `nuxt.config.ts` + seeder value aligned |

## API

No new endpoints. No contract changes.

```http
GET /favicon.svg
```

Expected after fix: `200` with `Content-Type: image/svg+xml` (served by Nuxt static, not by vue-router, so no `VUE_ROUTER_R0004`).

```http
GET /api/health
```

Unchanged; must stay healthy after the change (REQ-007).

## UI/UX

### Information Architecture

No new pages, no menu changes, no navigation changes. The only user-visible delta is the browser-tab favicon resolving instead of 404ing. All startup-warn work is console-only (DX), plus the optional `.env` file developers pick up.

### List / Create / Editor / Detail

Not applicable — no CRUD screens change.

### Interaction

- Dev boot (`npm run dev`, no env vars): console shows Vite build lines + ready line, zero `WARN Duplicated imports`, zero `[startup] …` warns, zero `VUE_ROUTER_R0004`.
- Prod boot misconfigured (no `JWT_SECRET`, drifted DB): unchanged fatal UX — `console.error [startup] <CODE>: <message>` + `process.exit(1)` + connection refused.
- Browser: opening `/login` or `/dashboard` shows the favicon in the tab; DevTools network shows `/favicon.svg → 200`.

### States

- loading — unchanged.
- empty — unchanged.
- error — prod fatal paths unchanged (`MIGRATION_DRIFT`, `JWT_SECRET_DEFAULT`).
- success — dev boot clean; favicon 200.
- validation — unchanged (no DTO changes).
- disabled — unchanged.
- permission denied — unchanged (no RBAC changes; verify viewer/guest paths still 403/401 per Task 23).

### Responsive Behavior

No layout changes; favicon is resolution-independent SVG.

### Design System

Follow `docs/design-system.md`. If a new SVG is authored, use the existing brand tokens (Primary 500 `#3B82F6`, Inter-adjacent geometric mark); do not introduce new palette entries. No Naive UI / Tailwind changes expected.

## Validation

- Type-level: `vue-tsc` clean; no new `any` leaks in the re-export touchpoints (existing `attrs?: Record<string, any>`-style fields stay as-is — shape-identical, not shape-improved).
- Startup matrix after this task (extends the Task 23 Validation table):

| Condition | Dev (`synchronize:true`) | Prod (`synchronize:false`) |
| --------- | ------------------------ | -------------------------- |
| `JWT_SECRET` default | silent (fixed) | fatal `JWT_SECRET_DEFAULT` (unchanged) |
| storage unwritable | warn (unchanged) | fatal (unchanged) |
| `migrations` table missing / pending / unknown-applied | silent (fixed) | fatal `MIGRATION_DRIFT` (unchanged) |
| `/favicon.svg` | 200, no router warn (fixed) | 200 (same static serving) |

- Backwards-compat: `rg` for the 8 type names must show exactly one `interface`/`type` declaration each (re-exports excluded), and all existing import sites still resolve.

## Security & Permission

- No permission/catalog changes; no seeder grant changes (permission count stable per REQ-007).
- The dev-secret mechanism must be dev-scoped only (e.g., `.env.development` or documented local `.env`); the production path still requires a strong `JWT_SECRET` env var and still fatals without it. Never commit a production-grade secret.
- No migration runner exposure over HTTP; no change to the `migration:generate/run/revert` ops-only scripts.
- Favicon is a static public asset with no auth implications.

## Dependencies

- Task 15 (composition-tree canonical types) — required.
- Task 16/17 (template-bindings / administration-helpers `StepField`/`StepIssue`) — required.
- Task 20 (`server/utils/rendering/types.ts` warning codes) — required.
- Task 22 (startup-check scaffold, `JWT_SECRET_DEFAULT` fatal) — required.
- Task 23 (baseline migration, real drift check, dev warn-only AC-005) — required; this task narrows AC-005 from "warn-only" to "silent" in dev while keeping prod refusal identical.

## Acceptance Criteria

### AC-001

Given a clean checkout with `node_modules` installed and no env vars set, when running `npm run dev` from `apps/web/`, then the console contains zero lines matching `Duplicated imports` (in particular none for `UnboundSlot`, `TreeIssue`, `CompositionNode`, `CompositionKind`, `RenderWarning`, `RenderWarningCode`, `StepIssue`, `StepField`) across initial client build, server build, and one file-touch HMR rebuild.

### AC-002

Given the fix is applied, when searching the codebase for each of the 8 names, then exactly one `interface`/`type` declaration exists per name (re-export statements excluded) and `vue-tsc` plus the full unit suite pass with all existing client (`shared/types`) and server (`server/utils`) import sites untouched or mechanically re-pointed to the re-export.

### AC-003

Given dev defaults (`NODE_ENV` unset, no `DB_SYNCHRONIZE`), when booting `npm run dev`, then no `[startup] migration drift detected …` line is printed, the server still seeds and serves, and `GET /api/health` returns healthy.

### AC-004

Given `NODE_ENV=production DB_SYNCHRONIZE=false` against a scratch database with no `migrations` table (or with a rogue applied row, Task 23 AC-003 procedure), when booting the production build, then boot refuses with fatal `MIGRATION_DRIFT` (`console.error` + `process.exit(1)`) and the message points at `docs/production-runbook.md`.

### AC-005

Given `NODE_ENV=production` with no `JWT_SECRET` set, when booting, then boot refuses with fatal `JWT_SECRET_DEFAULT`; given dev defaults, when booting `npm run dev`, then no `[startup] JWT_SECRET_DEFAULT` line is printed.

### AC-006

Given the dev server is running, when requesting `GET /favicon.svg`, then the response is `200` with an SVG body, no `VUE_ROUTER_R0004` warning is logged on navigation to `/login` or `/dashboard`, and the tab icon renders.

### AC-007

Given the pre-fix dev database file, when booting after the fix and re-running the Task 23 stability check (reboot, count permissions/roles/users/settings), then counts are stable (no reseed drift, no duplicate `Data:*:Read/Write` rows) and no migration files were modified (`git status` shows zero changes under `server/migrations/`).

## Implementation

### Backend

- [x] Canonicalise the 8 colliding types (one declaration each in `shared/types/*`; server counterparts import without re-exporting — see Implementation Notes on the re-export fallback)
- [x] Gate `migration drift` console warn to prod / non-synchronize mode only (keep `checkMigrationStatus` + `computeMigrationSync` pure core untouched; change wiring/gating only)
- [x] Gate `JWT_SECRET_DEFAULT` dev warn via plugin-level `shouldEmitStartupWarn` gate without touching the prod fatal condition in `runStartupChecks`
- [x] Keep `console.error + process.exit(1)` fatal mechanism unchanged
- [x] Unit tests for the new gating (dev-silent vs prod-fatal matrix)
- [x] Integration/API tests (prod scratch boot healthy + JWT fatal refusal — Task 23 scratch-cwd procedure)

### Frontend

- [x] API service — none (no endpoint changes)
- [x] Types — canonical in `shared/types/template.ts`, `shared/types/render.ts`, `shared/types/administration.ts`; 5 server/service/test files repointed to canonical paths (no re-exports)
- [x] Store/composable — none
- [x] Page — none
- [x] Components — none
- [x] Form — none
- [x] Validation — `vue-tsc` clean
- [x] Loading state — unchanged
- [x] Empty state — unchanged
- [x] Error state — unchanged
- [x] Success state — dev console clean; favicon 200
- [x] Permission state — guest `/api/users` 401 spot-checked (no RBAC code touched)
- [x] Responsive behavior — N/A (SVG favicon only)
- [x] Unit tests — `test/unit/utils/startup-warnings.test.ts` (gating matrix + single-source shape tests + no-re-export regression guard)
- [x] E2E tests — `test/e2e/startup-warnings.spec.ts` 2/2 green (`/favicon.svg` 200 + SVG type; `/login` without R0004 warnings)

### Static / Config

- [x] `apps/web/public/favicon.svg` added (brand-token layers mark, Primary 500 `#3B82F6`)
- [x] `nuxt.config.ts` `head.link` and seeder `app_favicon` already agreed on `/favicon.svg` — left unchanged
- [x] `apps/web/.env.example` documents the JWT/DB_SYNCHRONIZE dev/prod contract (`.env.*` is gitignored, so no checked-in dev secret — gating is code-level instead)

## Implementation Notes (/implement 2026-09-10)

- Re-export fallback (planned Step 4 contingency, triggered): `export type { … } from …` does NOT silence `unimport` — the first vitest run still listed all 8 names (plus a new self-inflicted `isSynchronizeEnabled` dup from a `db.ts` re-export). Fix applied: exactly one export site per name in `shared/types/*`; server files import-without-re-export; 5 importer files repointed to canonical relative paths (`templates.service.ts`, `template-bindings.service.ts`, `rendering.service.ts`, `rendering/pipeline.ts`, `composition-tree.test.ts`). Relative (not `~~/`) paths are load-bearing: vitest maps `~~` → `./server`, so `~~/shared/…` would break unit resolution. Verified: zero `Duplicated imports` in vitest output, full `npm run build` output, and live dev boot + HMR rebuild.
- `COMPOSITION_KINDS` const moved to `shared/types/template.ts` (file stays import-free); `composition-tree.ts` imports it for local runtime use.
- `StepField` reconciled to the loose wire shape (`type: string`, `required?:`); strictness stays in `StepFieldSchema`/`isStepFieldType` + `StepFieldType` union for UI pickers (BR-004).
- `isSynchronizeEnabled` lives in dependency-free `server/utils/startup-check.ts` (first attempt in `db.ts` broke unit resolution via the `~~/server/utils/orm-data-source` chain); `db.ts` imports it, plugin imports it from `startup-check.ts`.
- No `.env.development`: `.gitignore` covers `.env.*` (only `!.env.example` exempted), so a checked-in dev secret would not ship — dev silence is purely the plugin gate; `.env.example` is docs-only.
- Live evidence: dev boot `:3001` — 0 duplicated-imports, 0 `[startup]`, 0 `R0004` across boot + HMR touch; `health`/`favicon`/`login` 200, guest `/api/users` 401. Prod scratch boot (fresh cwd, `JWT_SECRET` set) → `migrations`=1, perms=22, users=5, `/api/health` 200. Prod without `JWT_SECRET` → `[startup] JWT_SECRET_DEFAULT` + `process.exit(1)` + conn refused. Repo DB untouched by this session (latest activity log 00:26, pre-session; `sdas` table + `Data:sdas` perms from 00:19 predate the session; counts 28|9|5|4 stable, `integrity_check ok`, `server/migrations/` clean).
- New E2E ran against the pre-existing `:3000` dev server (playwright `reuseExistingServer`); it exercises static serving + console, independent of app-code version.

## Verification

- [ ] Typecheck (`vue-tsc` clean from `apps/web/`)
- [ ] Lint (if configured; at minimum no new `unimport` warnings in build output)
- [ ] Unit test (full suite green; new gating tests green)
- [ ] Integration test (prod scratch-cwd drift refusal per AC-004)
- [ ] API test (`GET /api/health` healthy; `GET /favicon.svg` 200)
- [ ] E2E test (login navigation without `VUE_ROUTER_R0004`; cold-boot flake acknowledged per Task 23 note)
- [ ] Database verification (counts stable; `server/migrations/` untouched; `integrity_check ok`)
- [ ] Permission verification (viewer GET 200 / POST 403 spot-check unchanged)
- [ ] UI/UX verification (tab icon on `/login` + `/dashboard`)
- [ ] Responsive verification (N/A — no layout change)
- [ ] Design-system consistency verification (favicon uses existing brand tokens only)

## Assumptions

- Dev boot under test is the documented default: `npm run dev` from `apps/web/` with no `NODE_ENV`, no `JWT_SECRET`, no `DB_SYNCHRONIZE`, existing `db.sqlite` using `synchronize:true`.
- The `Duplicated imports` warnings come from Nuxt `unimport` auto-scanning both `shared/` and `server/utils/` (not from explicit double-imports in one file); the fix is therefore dedup-at-declaration (single definition + re-export) rather than fixing individual import statements. If investigation shows an additional `imports.dirs` / `nitro.imports` scan misconfiguration, fixing the scan config is in scope as an alternative.
- `StepField` shape difference is noted: `shared/types/administration.ts` (`required: boolean`, `type: StepFieldType`) is stricter than `server/utils/administration-helpers.ts` (`required?: boolean`, `type: string`). BR-004 requires the canonical choice to typecheck all current consumers; the surviving definition may need the looser server shape with the shared strictness re-expressed as a Zod/DTO concern, not a type rename.
- `CompositionKind` duplication is `union-literal` (shared) vs `typeof COMPOSITION_KINDS[number]` (server): structurally identical today; the canonical side keeps the `COMPOSITION_KINDS` const (runtime allowlist) and the other side re-exports the type.
- Favicon choice defaults to adding `apps/web/public/favicon.svg` (minimal brand-consistent SVG) rather than deleting the `head.link` reference, because the Settings page (`app_favicon`) and seeder already treat `/favicon.svg` as the canonical path.

## Open Questions

- Dev JWT mechanism: checked-in `.env.development` with a fixed dev-only secret vs `.env.example` documentation vs changing the `nuxt.config.ts` fallback string — which does the team prefer? (Constraint: must stay dev-scoped; prod fatal unchanged. The task currently permits any one consistent choice.)
- Dev drift silence vs Task 23 AC-005 wording ("warn-only drift" in dev): this task intentionally narrows AC-005 to silent-in-dev. If the team wants to preserve a dev hint, the alternative is a one-line `debug`-level log instead of `warn` — confirm silent is acceptable.
- Canonical home for the 8 types: `shared/` (client-safe, imported by server) vs `server/utils/` (DB-free pure modules, re-exported to client)? Either satisfies REQ-002; the implementer picks the side with fewer import churn, but must keep `server/utils/*.test.ts` unit-project imports working without pulling the Nuxt alias chain.
- No conflict with Permanent Knowledge: PRD §12 (`synchronize:true` dev-only), architecture (RBAC/server utilities), database (baseline + BR-001), design-system (brand tokens) all remain authoritative; this task changes none of them.

## Related Knowledge

- `docs/PRD.md` (§12 constraints: `synchronize:true` dev-only; §15 glossary)
- `docs/architecture.md` (server utilities, startup-check + route-guard, `shared/types` conventions)
- `docs/database.md` (baseline migration `1788914913928`, BR-001 never-edit-applied)
- `docs/design-system.md` (brand tokens for the favicon; no new palette)
- `docs/production-runbook.md` (§1 migration workflow, drift recovery)
- Task 15 verify/review (duplicated composition types noted as non-blocking)
- Task 16 review (duplicated requirement-resolution + type definitions noted)
- Task 22 (startup-check scaffold, `JWT_SECRET_DEFAULT` fatal, Validation matrix)
- Task 23 (baseline + real drift check, AC-003/AC-005, `console.error + process.exit(1)` mechanism)

## Change Log

### Initial

- Task specification created from dev-boot warning report (duplicated imports ×8, migration-drift warn, JWT_SECRET_DEFAULT warn, /favicon.svg R0004).
