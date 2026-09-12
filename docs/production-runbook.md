# Production Runbook (RBAC-Only — Task 01)

Single-node SQLite deployment. Multi-node/HA is out of scope.

## 1. Production boot & baseline migration

```bash
NODE_ENV=production JWT_SECRET=<strong-secret> DB_SYNCHRONIZE=false npm run build && npm run preview
```

- `synchronize:false` in production (`server/utils/db.ts` — override with
  `DB_SYNCHRONIZE=true` only for scratch/dev). On a fresh database file the
  server applies the checked-in baseline migration
  (`server/migrations/1788914913928-Baseline.ts` — RBAC-Only after Task 01: 9 schemas / 12 tables) automatically at boot (`migrationsRun` in `getDataSource()`), then
  runs the idempotent seed. Dev default is unchanged (`synchronize:true`,
  no migration enforcement).
- On drift the server fails fast with `MIGRATION_DRIFT` pointing here (see
  `server/utils/startup-check.ts` + real check in
  `server/utils/migration-status.ts`, wired via
  `server/plugins/database.server.ts`).
- Fresh-install seed is idempotent: every `seed*` function checks existence
  first — re-running never duplicates permissions, roles, users, or settings.
- Startup self-check fails fast in production when `JWT_SECRET` is default,
  storage is unwritable, or migrations drift. Dev boots
  (`synchronize:true`, the default outside production) are startup-warn-free
  by design (Task 24): a missing `migrations` bookkeeping table and the
  default dev secret emit no warns; storage problems still warn.

### Migration workflow (from `apps/web/`)

```bash
npm run migration:run                    # apply pending migrations (DB_PATH defaults to db.sqlite)
DB_PATH=/tmp/scratch.sqlite npm run migration:run     # target a scratch copy
npm run migration:revert                 # revert the last applied migration (up/down drill)
npm run migration:generate -- <Name>     # diff the RBAC EntitySchemas vs DB → server/migrations/<timestamp>-<Name>.ts
```

- `generate` diffs entity metadata against the target database: point
  `DB_PATH` at a fully-migrated copy so only the new delta is emitted, then
  wire the new class into `appMigrations` in
  `server/utils/orm-data-source.ts` (the CLI prints a reminder).
- BR-001: never edit an applied migration; schema changes ship as new files.
- Up/down drill on an empty scratch file before touching prod:

```bash
rm -f /tmp/drill.sqlite
DB_PATH=/tmp/drill.sqlite npm run migration:run
DB_PATH=/tmp/drill.sqlite npm run migration:revert
DB_PATH=/tmp/drill.sqlite npm run migration:run
sqlite3 /tmp/drill.sqlite "PRAGMA integrity_check;"  # must print: ok
```

### Drift recovery (`MIGRATION_DRIFT` at boot)

1. Back up first (§3).
2. `pending:<name>` — a checked-in migration was not applied: run
   `npm run migration:run` (or `DB_PATH=...` for a copy) and reboot.
3. `unknown:<name>` — the database carries a migration with no checked-in
   file: do NOT delete rows from `migrations` by hand; restore the matching
   migration file from version control (or restore the backup) and reboot.
4. `migrations-table-missing` — pre-migration database file (tables exist
   but no bookkeeping): this file predates the baseline. Either rebuild it
   from the baseline on an empty file, or keep it on the dev
   `synchronize:true` workflow — never force `DB_SYNCHRONIZE=true` against
   a production file (BR-002).

## 2. Health probe

`GET /api/health` — public, no PII:

```json
{ "status": "healthy", "db": "healthy", "storage": "healthy", "version": "1.0.0" }
```

Wire it to your process monitor / load-balancer probe.

## 3. SQLite backup / restore

SQLite is a single file: `apps/web/db.sqlite`.

```bash
# Backup (stop writes or checkpoint first; single-node so stopping Nitro is enough)
sqlite3 apps/web/db.sqlite "PRAGMA wal_checkpoint(TRUNCATE);"
cp apps/web/db.sqlite backups/db-$(date +%F).sqlite
sqlite3 backups/db-$(date +%F).sqlite "PRAGMA integrity_check;"  # must print: ok

# Restore on a scratch copy + verify
cp backups/db-<date>.sqlite /tmp/restore-check.sqlite
sqlite3 /tmp/restore-check.sqlite "PRAGMA integrity_check;"      # ok
```

Cadence: daily file copy off-host; `VACUUM` monthly. WAL mode is the
default recommendation when concurrent readers grow.

## 4. Least-privilege roles (RBAC-Only)

| Role | Grants |
| -------- | ------ |
| Super Admin | Full Access (all methods + URLs) |
| Admin | Web Access + Read Write (users/roles/permissions/guards + logs/settings) |
| User | Web Access + Read (read-only) |

New users get User-equivalent or nothing unless explicitly granted. Permission names are immutable once seeded.

## 5. Audit coverage

Every mutation emits an activity log. Verify during QA:

```
GET /api/activity-logs (admin)
→ { data: [...], total, page, limit, totalPages }
GET /api/activity-logs/stats
```

Covered entities: User, Role, Permission, Guard, Auth, Settings.

## 6. Limits

| Surface | Limit | Behavior |
| ------- | ----- | -------- |
| Uploads (settings) | 5 MB, allowlist `png jpg jpeg svg webp ico gif pdf` | 400 otherwise |
| Auth | 60/min/user for login | 429 |

## 7. Quickstarts

**Admin:** Login → Dashboard → User Management (Users/Roles/Permissions/Guards) → Activity Logs / System Logs / Settings.

## 8. API delta (RBAC-Only after Task 01)

RBAC endpoints only:
- `/api/auth/*` (login, register, profile, password)
- `/api/users/*`, `/api/roles/*`, `/api/permissions/*`, `/api/guards/*`
- `/api/activity-logs/*`, `/api/system-logs/*`, `/api/settings/*`, `/api/storage/*`, `/api/health`

Dynamic Administration endpoints (`/api/global-tables/*`, `/api/data/*`, `/api/components/*`, `/api/templates/*`, `/api/administrations/*`, `/api/runs/*`, `/api/documents/*`, `/api/render/*`, `/api/expressions/*`, `/api/navigation`) removed Task 01.

## Change Log

### Task 01 — 2026-09-12

- Pruned to RBAC-Only. Removed Designer/Operator roles, Dynamic Administration permissions, rendering/expression limits, and docs references. Archived dynamic runbook sections in git history pre-Task 01.
