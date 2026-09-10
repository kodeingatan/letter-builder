# Task 23 — Production Migration Baseline & Drift Check

## Status

DONE

## Objective

Close the one literal REQ-004 gap left by Task 22: check in a TypeORM baseline migration covering all entities, wire migrations into the production boot path, and replace the hardcoded `migrationInSync: true` with a real drift check so `MIGRATION_DRIFT` can actually fire before real instansi data lands.

## Context

Task 22 shipped the `synchronize:false` env switch (`server/utils/db.ts`), idempotent seeds, and the startup self-check scaffold (`server/utils/startup-check.ts` + `server/plugins/database.server.ts`) — but with two documented deferrals (see Task 22 Assumptions and the Task 22 review report):

1. No checked-in migration files exist. Production `synchronize:false` without migrations means a fresh prod database would boot with **no tables at all**.
2. The Nitro plugin passes `migrationInSync: true` unconditionally, so the `MIGRATION_DRIFT` fatal path is dead code that can never fire.

This task resolves both. It produces no new domain features — it makes the production posture claimed by Task 22 real.

## Scope

### In Scope

- Standalone TypeORM data-source config for CLI usage (EntitySchema-aware, no `~~/` Nuxt aliases so `typeorm` CLI can load it)
- Baseline migration file(s) covering all 23 entities registered in `server/utils/db.ts`, generated from the current schema and checked in
- Wiring `migrations` + `migrationsRun` (prod) into `getDataSource()`
- Real drift detection: replace hardcoded `migrationInSync: true` in `server/plugins/database.server.ts` with an actual check (e.g., pending-migration query), keeping the pure `runStartupChecks` core untouched
- npm scripts: `migration:generate`, `migration:run`, `migration:revert` (scoped to `apps/web/`)
- Unit tests for the drift-check wiring logic
- Docs: update `docs/production-runbook.md` §1 (baseline migration workflow: generate/run/revert) and the migration section of `docs/database.md`

### Out of Scope

- New domain behavior or entity changes (any schema gap found here spawns a follow-up task)
- Catalog-vs-DB permission superset reconciliation (`Document Management`, `Global Table Management` extras — tracked separately from the Task 22 review should-fix list)
- Multi-node/HA, WAL tuning, backup cadence (runbook already declares single-node out-of-scope)
- CI wiring / coverage thresholds (no CI in repo; same convention as Tasks 13–22)

## Actors

- System Administrator — runs migrations, owns prod boot
- DBA/Operator — generates future migrations, executes up/down drills
- Auditor — verifies migration history against schema (no new audit entities)

## Dependencies

- Task 22 (production posture, startup-check scaffold, `DB_SYNCHRONIZE` switch) — required
- Tasks 07–21 entities (the 23 schemas the baseline must cover) — required

## Requirements

- REQ-001: A checked-in baseline migration reproduces the full current schema (all 23 entities in `getDataSource()`) on an empty SQLite file with `synchronize:false`.
- REQ-002: Production boot applies pending migrations automatically (`migrationsRun` or explicit run before seed) and seeds idempotently afterward.
- REQ-003: Drift detection is real: booting prod against a database whose applied migrations differ from the checked-in set fails fast with the existing `MIGRATION_DRIFT` fatal (actionable message pointing at the runbook).
- REQ-004: Dev workflow unchanged — `synchronize:true` remains the default outside production; `DB_SYNCHRONIZE` override keeps working.
- REQ-005: Migration workflow (generate/run/revert) is documented and runnable via npm scripts from `apps/web/`.
- REQ-006: No regression — full unit suite green, `vue-tsc` clean, build OK, `/api/health` healthy after migrated boot.

## Business Rules

- BR-001: Baseline is additive history from here on — never edit an applied migration; new schema changes ship as new migrations.
- BR-002: Migration files are the source of truth in production; `synchronize:true` is dev/scratch only and must never run against a prod database file.
- BR-003: Seed stays idempotent after migration (every `seed*` path existence-checked; re-running post-migration creates zero duplicates).
- BR-004: Destructive recovery (restore, revert) follows the existing backup runbook (file copy + `integrity_check`) — this task extends it, not replaces it.

## Domain

```text
CURRENT SCHEMA (23 EntitySchemas in db.ts)
    ├── BASELINE MIGRATION (checked-in, reproducible)
    ├── MIGRATION RUNNER (prod boot path)
    └── DRIFT CHECK (fail fast: MIGRATION_DRIFT)
```

## Data Model

No new entities. New artifacts:

| Artifact | Location | Description |
| -------- | -------- | ----------- |
| Data-source config | `apps/web/server/utils/orm-data-source.ts` (or `typeorm.config.ts`) | CLI-loadable (plain relative imports, no `~~/` alias), exports the same 23 EntitySchemas |
| Baseline migration | `apps/web/server/migrations/<timestamp>-Baseline.ts` | Full schema create (tables, uniques, indexes, FKs as defined by entities) |
| `migrations` table | TypeORM-managed | Applied-migration bookkeeping (automatic) |

Entity count to cover (from `server/utils/db.ts`): users, roles, permissions, permission_methods, permission_urls, guards, guard_urls, activity_logs, settings, global_tables, global_table_columns, global_table_rows, components, component_data_requirements, component_versions, templates, template_versions, template_bindings, administrations, administration_steps, administration_versions, administration_runs, documents (23).

## API

No new endpoints. Health (`GET /api/health`) and coverage (`GET /api/activity-logs/coverage`) behavior unchanged; health must report healthy after a migrated boot.

## UI/UX

No new pages. Optional (implementation choice, non-blocking): extend the Settings → Status Produksi card with migration state (e.g., applied-migration count or drift warning) reusing the existing `.detail-view` pattern. If the health payload gains a `migrations` field, keep it PII-free (counts/names only).

### States

- Migration drift in prod: boot refusal with actionable `MIGRATION_DRIFT` message (log + thrown error), same pattern as the existing `JWT_SECRET_DEFAULT` fatal.
- Dev: no behavior change; drift check only enforces in production (`isProd` gate already in `runStartupChecks`).

## Validation

- Startup self-check matrix after this task:

| Condition | Dev | Prod |
| --------- | --- | ---- |
| `JWT_SECRET` default | warn | fatal (existing) |
| storage unwritable | warn (existing; plugin attempts `mkdir` first) | fatal (existing) |
| pending/unapplied migrations | warn or silent (choice, documented) | **fatal `MIGRATION_DRIFT` (new: real check)** |

## Security & Permission

- No permission/catalog changes. Migration files must not contain seed secrets or PII fixtures.
- Migration runner executes before seed; seed secrets discipline unchanged (bcrypt-hashed defaults, `JWT_SECRET` via env).
- `migration:revert` is admin/ops-only documentation — no HTTP endpoint runs or reverts migrations.

## Acceptance Criteria

### AC-001

Given an empty SQLite file + `NODE_ENV=production DB_SYNCHRONIZE=false`, when booting, then migrations apply, all 23 tables exist, seed completes, and `GET /api/health` returns healthy.

### AC-002

Given the backup runbook flow on a scratch copy, when running migration up then down then up, then each step succeeds and `PRAGMA integrity_check` prints `ok`.

### AC-003

Given a production boot against a database with an unapplied (or extra-unknown) migration state, when starting, then boot refuses with `MIGRATION_DRIFT` and the message points at `docs/production-runbook.md`.

### AC-004

Given a migrated database, when re-running seed (restart / explicit re-seed), then zero duplicate permissions, roles, users, or settings are created (permission count stable, e.g., still 26 as in Task 22 verify).

### AC-005

Given dev defaults (`NODE_ENV` unset, no `DB_SYNCHRONIZE`), when booting, then behavior is unchanged (`synchronize:true`, no migration enforcement breakage) and the full unit suite + build pass.

## Implementation

### Backend

- [x] CLI-loadable data-source config (same 23 EntitySchemas, no Nuxt aliases)
- [x] Baseline migration generated + checked in under `apps/web/server/migrations/`
- [x] `getDataSource()` wired with `migrations` (+ `migrationsRun` in prod or explicit pre-seed run)
- [x] Real `migrationInSync` computation in `server/plugins/database.server.ts` (remove hardcoded `true`)
- [x] npm scripts `migration:generate` / `migration:run` / `migration:revert` in `apps/web/package.json`
- [x] Unit tests for drift-check logic (pending-migration detection, prod/dev gating); full suite green

### Frontend

- [x] None required; optional migration-state line in the Settings production card declined (minimal-change principle; health payload also left unchanged)

### Docs

- [x] `docs/production-runbook.md` §1 rewritten around the baseline (generate/run/revert commands, drift recovery)
- [x] `docs/database.md` migrations note updated (`synchronize:true` dev-only + baseline file reference)

## Assumptions

- Single-node SQLite deployment (per PRD constraints); the migration runner assumes one writer at boot.
- TypeORM 1.1 + `better-sqlite3` migration generation via the `typeorm` CLI against the new standalone config; if CLI generation proves lossy for any EntitySchema construct, hand-authoring the baseline to match `sqlite_master` of a synchronized dev DB is acceptable (documented in the task log).
- `runStartupChecks` pure core is untouched; only the plugin's `migrationInSync` input becomes real.

## Implementation Notes (/implement 2026-09-09)

- No `ts-node` in repo and no network justification for new deps: `migration:*` scripts run `server/utils/migration-cli.ts` via the repo's own `jiti` binary. `generate` reuses TypeORM's own `driver.createSchemaBuilder().log()` in-process (same up/down SQL the CLI would emit, incl. correct down reversals) — no CLI file-loading needed.
- Baseline `1788914913928-Baseline.ts` (106 up / 106 down) generated against an empty scratch DB. TypeORM emits the 8 FK-bearing tables as create-then-recreate-with-FK (temporary-table dance); end state verified byte-identical to dev `sqlite_master` except column order of `menuOrder`/`menuIcon` in `administrations` + `global_tables` (current entities declare them before timestamps; dev file carries legacy append-at-end order from `synchronize`). Name-addressed queries unaffected; post-migration `generate` reports zero phantom diff.
- Fatal startup issues now `console.error` + `process.exit(1)` instead of `throw`: verified live that a Nitro plugin throw surfaces as a logged `unhandledRejection` while the server keeps listening, so throw alone does NOT refuse boot. Exit path is prod-only by construction (every `fatal` is `isProd`-gated; dev stays warn-only and serving — observed live).
- Fresh-seed permission count is 22 base catalog; dev `db.sqlite` shows 26 = 22 + 4 leftover `Data:v16*:Read/Write` auto-provisioned for pre-existing fixture tables. AC-004 verified as stability (22 → 22 across reboot), not the absolute 26.
- Live AC-001/003/004 verified against the production build (`.output/server/index.mjs`) with cwd in `/tmp/opencode/prodtest` (repo `db.sqlite` md5 unchanged). Pending-migration drift covered by unit tests + same refusal path as the live unknown-applied case.

## Verification

- [ ] Typecheck (`vue-tsc`), full unit suite green, build OK
- [ ] Migration up on empty scratch DB with `synchronize:false` → all tables present → seed → health healthy (AC-001)
- [ ] Up/down/up round-trip on scratch copy + `integrity_check` ok (AC-002)
- [ ] Drift simulation (skip a migration) → prod boot refuses with `MIGRATION_DRIFT` (AC-003)
- [ ] Seed re-run idempotent post-migration, permission/role counts stable (AC-004)
- [ ] Dev-default boot unchanged (AC-005)
- [ ] Backup/restore drill still passes per existing runbook

## Open Questions

- Should future `migration:generate` run in CI (when CI lands) with a schema-drift diff gate, or stay a manual DBA step?
- Should dev keep `synchronize:true` indefinitely, or converge dev onto migrations once the baseline proves stable?

## Related Knowledge

- `docs/PRD.md` (§12 constraints), `docs/architecture.md` (server utilities), `docs/database.md` (migrations note)
- `docs/production-runbook.md` (§1 production boot, §3 backup/restore)
- `AGENTS.md` (Verification, native addons)
- Task 22 (`tasks/22-dynamic-rbac-audit-production.md`) — Assumptions (migration deferral), REQ-004, Verification notes
- Task 22 review report (in `tasks/task-logs.md` detail) — should-fix #3 is this task's charter

## Change Log

### Initial

- Task spawned from Task 22 review should-fix #3 (dead `migrationInSync`, no checked-in baseline).
