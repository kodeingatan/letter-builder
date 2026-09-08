# Production Runbook (Task 22)

Single-node SQLite deployment. Multi-node/HA is out of scope.

## 1. Production boot

```bash
NODE_ENV=production JWT_SECRET=<strong-secret> DB_SYNCHRONIZE=false npm run build && npm run preview
```

- `synchronize:false` in production (`server/utils/db.ts` — override with
  `DB_SYNCHRONIZE=true` only for scratch/dev). Schema changes ship as the
  checked-in baseline migration; on drift the server fails fast with
  `MIGRATION_DRIFT` (see `server/utils/startup-check.ts`).
- Fresh-install seed is idempotent: every `seed*` function checks existence
  first — re-running never duplicates permissions, roles, users, or settings.
- Startup self-check fails fast in production when `JWT_SECRET` is default
  or storage is unwritable (warn-only in development).

## 2. Health probe

`GET /api/health` — public, no PII:

```json
{ "status": "healthy", "db": "healthy", "storage": "healthy", "renderer": "healthy", "version": "1.0.0" }
```

Wire it to your process monitor / load-balancer probe. `renderer:
degraded` means all 4 render slots are busy (transient).

## 3. SQLite backup / restore (REQ-005)

SQLite is a single file: `apps/web/db.sqlite`.

```bash
# Backup (stop writes or checkpoint first; single-node so stopping Nitro is enough)
sqlite3 apps/web/db.sqlite "PRAGMA wal_checkpoint(TRUNCATE);"
cp apps/web/db.sqlite backups/db-$(date +%F).sqlite
sqlite3 backups/db-$(date +%F).sqlite "PRAGMA integrity_check;"  # must print: ok

# Restore on a scratch copy + verify
cp backups/db-<date>.sqlite /tmp/restore-check.sqlite
sqlite3 /tmp/restore-check.sqlite "PRAGMA integrity_check;"      # ok
# boot against the copy, open a document + download its PDF, compare
# byte-identical with the live copy before swapping the file in.
```

Cadence: daily file copy off-host; `VACUUM` monthly. WAL mode is the
default recommendation when concurrent readers grow.

## 4. Least-privilege roles (REQ-001)

| Role     | Grants |
| -------- | ------ |
| Designer | Global Table Mgmt, Table Data Read/Write, Component/Template/Administration Mgmt, Run, Document read, Expression Use, Rendering Preview, Navigation Read |
| Operator | Table Data Read/Write, Run, Document read, Expression Use, Navigation Read |
| Admin    | All of Designer + Document Reissue (reissue/purge) + settings |

New users get Operator-equivalent or nothing (never Designer/Admin)
unless explicitly granted. Permission names are immutable once seeded —
add new ones only via additive seeding (`seedTask22Catalog`).

## 5. Audit coverage (REQ-002)

Every mutation emits an activity log. Verify during QA:

```
GET /api/activity-logs/coverage   (admin, activity-logs GET grant)
→ { entities: [{ entity, count, covered }], missing: [...], coverage: "10/10" }
```

Covered entities: GlobalTable, GlobalTableColumn, Component, Template,
TemplateBinding, Administration, AdministrationRun, Document, Render,
Expression. Table-row writes log under the table displayName with
redacted metadata (see §6).

## 6. PII discipline (BR-003)

Row VALUES never enter system logs. Activity metadata stores column
names + row ids; values of PII columns are replaced with `[REDACTED]`.
PII column-name fragments (case-insensitive substring):

`email, phone, telp, telepon, hp, address, alamat, nik, ktp, npwp,
password, token, secret`

The Activity Logs page shows a redaction notice.

## 7. Limits (verified, Task 22 sweep)

| Surface | Limit | Behavior |
| ------- | ----- | -------- |
| Uploads | 5 MB, allowlist `png jpg jpeg svg webp ico gif pdf` | 400 otherwise |
| CSV import | 5000 rows | 422 above |
| Render preview | 30/min/user, 4 concurrent renders | 429 / 503 + `Retry-After` |
| Expressions | 60/min/user, 2000 chars, 100 ms, depth 20 | 429 / 400 |

## 8. CSV formula-injection note (AC-006)

Exported cells starting with `= + - @` are prefixed with `'` so
spreadsheet apps treat them as text. Operators opening exports from
untrusted rows should still prefer "import as text" in their spreadsheet.

## 9. IDOR / traversal posture (AC-005)

Runs/documents are own-vs-all scoped at the service layer: operator B
fetching operator A's run/document gets 403/404 with no data leak.
Storage serving rejects unknown subfolders and generated filenames
prevent traversal.

## 10. Quickstarts

**Designer:** Global Tables → add columns → Components → Templates
(canvas + Bindings tab, validate-tree must be green, publish) →
Administrations (pin published template versions, publish) → share with
Operators.

**Operator:** Persuratan → start a published administration → fill steps
→ complete → Dokumen → preview/download PDF.

## 11. API delta (Tasks 07–21, new since RBAC foundation)

- `/api/global-tables/*`, `/api/data/:tableName/*` (incl. import/export),
  `/api/components/*`, `/api/templates/*` (incl. bindings, validate-tree,
  publish, rollback), `/api/administrations/*` (incl. steps, publish,
  archive, new-version, menu), `/api/administrations/:id/runs`,
  `/api/runs/*` (mine, steps PATCH, complete, cancel),
  `/api/documents/*` (html, pdf, reissue), `/api/render/preview`,
  `/api/expressions/*`, `/api/navigation`, `/api/health`,
  `/api/activity-logs/coverage`.
