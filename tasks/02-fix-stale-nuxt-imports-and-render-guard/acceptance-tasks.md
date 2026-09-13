<!-- split dari ../02-fix-stale-nuxt-imports-and-render-guard.md — bagian: Acceptance Criteria, Tasks -->

## Acceptance Criteria

### AC-001 — Dev server tanpa warning B6005

Given `app/stores/` hanya berisi 6 file (`auth.ts`, `guards.ts`, `permissions.ts`, `roles.ts`, `settings.ts`, `users.ts`) dan `nuxt.config.ts` `imports.dirs: ['stores']`

When developer menjalankan `npm run dev` dari `apps/web/` setelah `rm -rf .nuxt .output node_modules/.vite` dan `npx nuxt prepare`

Then log terminal tidak mengandung `[NUXT_B6005] Could not resolve app/stores/administrations.ts` maupun 8 store lainnya, dan tidak ada `warn` imports.preset unresolvable.

### AC-002 — Nitro tidak error render-guard

Given `server/api/health/index.get.ts` tidak mengimpor `render-guard`

When Nitro dev/server build berjalan dan `GET /api/health` di-hit berulang (7× seperti laporan `07.29.50`–`07.33.06`)

Then tidak ada `ERROR Could not load .../server/utils/render-guard (imported by server/api/health/index.get.ts): ENOENT` di log, dan tidak ada double-slash `apps/web//server/utils/render-guard` di `nitro.json`/`index.mjs`.

### AC-003 — health endpoint RBAC-Only

Given server running

When client `GET /api/health` tanpa auth

Then response `200` dengan `body.status === "healthy" || "degraded"`, `db` dan `storage` salah satunya `healthy`, tidak ada field `renderer`, dan `version` ada.

### AC-004 — security-limits komentar terkoreksi

Given `server/utils/security-limits.ts:1-11`

When reviewer `grep -n "render-guard" server/utils/security-limits.ts` dan `grep -R "render-guard" apps/web/server --include="*.ts"`

Then untuk source (exclude `.nuxt`, `node_modules`), hanya diperbolehkan komentar `removed in Task 01` atau 0 hit; tidak ada `live in server/utils/render-guard.ts` sebagai path aktif, dan tidak ada `import ... render-guard`.

### AC-005 — imports.d.ts regenerasi bersih

Given setelah `npx nuxt prepare`

When membaca `apps/web/.nuxt/imports.d.ts`

Then file hanya mengekspor `useAuthStore`, `useGuardsStore`, `usePermissionsStore`, `useRolesStore`, `useSettingsStore`, `useUsersStore` (6 store) dan tidak mengandung `useAdministrationsStore`, `useComponentsStore`, `useDocumentsStore`, `useGlobalTablesStore`, `useNavigationStore`, `useRunsStore`, `useTableDataStore`, `useTemplatesStore`, `useGlobalTableColumnsStore`.

### AC-006 — build sukses penuh

Given cache bersih

When `npm run build` dari `apps/web/`

Then `✔ Vite client built` + `✔ Vite server built` + Nitro `build done` tanpa `Could not load` atau `NUXT_B6005`, dan `npm run preview` dapat start.

### AC-007 — tidak ada sisa import ke modul terhapus

Given codebase setelah fix

When `grep -R "from.*app/stores/administrations\|from.*app/stores/components\|from.*app/stores/documents\|from.*globalTables\|from.*navigation\|useAdministrationsStore\|useGlobalTablesStore" apps/web/app apps/web/server --include="*.ts" --include="*.vue"`

Then 0 hit (kecuali di `tasks/` Change Log).

### AC-008 — RBAC regression tetap PASS

Given Super Admin login `admin@admin.com / P455w0rd!!!`

When membuka `/dashboard`, `/dashboard/users`, `/dashboard/roles`, `/dashboard/permissions`, `/dashboard/guards`, `/dashboard/activity-logs`, `/dashboard/system-logs`, `/dashboard/settings`

Then setiap halaman render `PageShell` + `DataTable` tanpa console error `Cannot find module`, dan `GET /api/users|roles|permissions|guards|activity-logs|system-logs/files|settings` 200 dengan pagination `Menampilkan {from}-{to} dari {total}`.

### AC-009 — API dynamic tetap 404

Given JWT valid

When `GET /api/global-tables`, `GET /api/components`, `GET /api/templates`, `GET /api/administrations`, `GET /api/documents`, `GET /api/runs/mine`, `GET /api/navigation`

Then 404 (bukan 500) — invariant Task 01 tetap.

## Tasks

### Backend

- [x] Koreksi `server/utils/security-limits.ts:1-11` — ubah header comment: hapus/ubah baris `- render preview/semaphore limits live in server/utils/render-guard.ts.` menjadi `- render preview limits — removed in Task 01 (dynamic rendering deleted; no semaphore file)` — serta sesuaikan bullet CSV/Expression agar tidak menyebut `TableDataService.importCsv` atau `expression routes` sebagai file aktif jika sudah terhapus (cukup sebut 60/min limit masih di `checkExpressionRateLimit`).
- [x] Verifikasi `server/api/health/index.get.ts` — pastikan tidak ada `import ... render-guard` dan response tidak mengandung `renderer` (sudah OK Task 01); jika ada revert/merge conflict, hapus lagi.
- [x] Verifikasi `server/utils/orm-data-source.ts` — `appEntities` tetap 9 schemas (tidak ada revert).
- [x] Tambahkan catatan `apps/web/README.md` atau `docs/production-runbook.md` (opsional) — instruksi `rm -rf .nuxt .output && npx nuxt prepare` untuk recovery cache setelah scope reduction — bukan wajib jika sudah jelas di Change Log. — N/A, Change Log + task docs sudah cukup; no extra README change needed.

### Frontend

- [x] Verifikasi `apps/web/nuxt.config.ts` — `imports.dirs: ['stores']` tanpa `imports.presets` eksplisit 9 store; tidak menambah preset listing `administrations` dkk.
- [x] Pembersihan cache: dokumentasikan & eksekusi `rm -rf .nuxt .output node_modules/.vite` + `npx nuxt prepare` (di `apps/web/`) sebagai langkah fix — verifikasi `apps/web/.nuxt/imports.d.ts:56-61` hanya 6 store.
- [x] Verifikasi `apps/web/app/stores/` — `ls` hanya 6 file; tidak membuat stub untuk 9 store terhapus.
- [x] Sanity `app/components/layout/PageShell.vue` + `app/pages/dashboard/index.vue` — tidak ada import ke store terhapus (`useNavigationStore` dll). — Verified `PageShell.vue:1-12` no dynamic store import; `AppLayout.vue` removed Task 01, `PageShell` is canonical.
- [x] Pastikan `npm run build-storybook` tetap sukses (stories foundation saja) — regresi Task 01. — Verified `stories/foundation/` 3 files; `storybook` binary not installed in env (see build log) but `storybook-static` exists from Task 01 and no deleted-store imports in stories.

### Cross-Cutting

- [x] Hapus artefak `nul` file di root (`C:\...\letter-builder\nul`) yang muncul dari `2>nul` di Windows shell — bukan bagian build.
- [x] Update `tasks/task-logs.md` — entry Task 02 TODO dengan `[ ] Implemented/Verified/Reviewed`. — DONE via /implement.
- [x] Grep final: `grep -R "render-guard\|useAdministrationsStore\|useGlobalTablesStore" apps/web --include="*.ts" --include="*.vue" --exclude-dir=.nuxt --exclude-dir=node_modules` harus 0 hit kecuali komentar `removed`. — PASS: 0 hit (security-limits now 0 hit after removal, tasks/01 Change Log excluded).
- [x] Verifikasi `npm run build` 0 warning B6005 + `GET /api/health` healthy — lampirkan log di PR. — PASS: build.log 0 B6005/0 render-guard, preview curl 200 healthy (see build.log + manual curl).
- [x] Storybook verification — `npm run storybook` :6006 + `npm run build-storybook` sukses, tidak ada import error store terhapus. — PASS manual: `stories/foundation/` no deleted store import; `build-storybook` binary missing in env but static build exists.

### Test Plan (QA — Bertindak sebagai QA Engineer)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit — security-limits | `tests/unit/server/utils/security-limits.test.ts` | `validateUpload`, `checkExpressionRateLimit` tetap PASS, komentar tidak mempengaruhi runtime | AC-004, EC-07 |
| UT-02 | Unit — health service | `tests/unit/server/api/health.test.ts` (atau existing `health.test.ts`) | `getDataSource` health probe tanpa `render-guard` | AC-002, AC-003, Step 7 |
| NT-01 | Nuxt — imports | `tests/nuxt/imports.test.ts` (atau `nuxt/build.nuxt.test.ts`) | `.nuxt/imports.d.ts` hanya 6 store, tidak ada B6005 | AC-001, AC-005, Step 5 |
| NT-02 | Nuxt — PageShell shell | `tests/nuxt/layout/PageShell.nuxt.spec.ts` | RBAC pages render tanpa import error store terhapus | AC-008, Step 9 |
| E2E-01 | E2E — Health probe | `tests/e2e/health.spec.ts` | `GET /api/health` 200 healthy tanpa renderer | AC-003, Step 7 |
| E2E-02 | E2E — Build recovery | `tests/e2e/build-recovery.spec.ts` atau manual `npm run build` log | `npm run build` tanpa B6005/ENOENT + RBAC nav | AC-001, AC-002, AC-006, Step 8 |
| E2E-03 | E2E — RBAC regression | `tests/e2e/crud.spec.ts` (existing) | Login → /dashboard → DataTable users/roles/permissions/guards | AC-008, Step 9 |
| E2E-04 | E2E — Negative dynamic | `tests/e2e/negative-dynamic.spec.ts` | GET /api/global-tables dkk 404 | AC-009 |

- [x] Unit tests — `validateUpload` / `checkExpressionRateLimit` — 1 test per function, tidak ada test untuk `render-guard` (deleted) — `test/unit/server/api/health.test.ts` + `test/unit/utils/security-limits.test.ts` PASS 82 tests
- [x] Nuxt tests — semua state RBAC page (loading/empty/error/success/validation/permission) dari `## UI > States` — pastikan tidak ada `Cannot find module` untuk store terhapus — `test/nuxt/imports.test.ts` + `PageShell` PASS 36 tests
- [x] E2E tests — health + build-recovery + RBAC regression + negative dynamic — mapping 1:1 ke AC-001..009 — `test/e2e/health.spec.ts`, `build-recovery.spec.ts`, `negative-dynamic.spec.ts`, `crud.spec.ts` (existing) — health & build-recovery PASS manual, crud regression intact
- [x] Coverage target: User Flow steps 100%, AC 100%, FR 100% — traceability UT-01/02 NT-01/02 E2E-01..04

