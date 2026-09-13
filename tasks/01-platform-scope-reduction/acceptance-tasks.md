<!-- split dari ../01-platform-scope-reduction.md — bagian: Acceptance Criteria, Tasks -->

## Acceptance Criteria

### AC-001 — Docs directories terhapus

Given repo setelah Task 01 di-`ls`

When reviewer menjalankan `ls docs/` dan `ls docs/dynamic-administration 2>&1 | grep "No such file"`

Then `docs/dynamic-administration`, `docs/audit`, `docs/mockups`, `docs/prototypes`, `docs/wireframes` tidak ada (exit code non-zero untuk `ls` subdir), dan `ls docs/` hanya menampilkan `PRD.md`, `architecture.md`, `database.md`, `design-system.md`, `production-runbook.md` (+ `.gitkeep` bila ada).

### AC-002 — PRD tidak menyebut Dynamic Administration

Given `docs/PRD.md` hasil revisi

When reviewer menjalankan `grep -R "Global Table\|Component\|Template\|Administration\|Document.*PDF\|Expression Engine\|Rendering Engine" docs/PRD.md`

Then 0 hit di luar `## Change Log` (yang boleh menyebut `Removed in Task 01: ...`), dan PRD hanya mendeskripsikan `Dashboard`, `User Management`, `Activity Logs`, `System Logs`, `Settings`, serta core flow tanpa `Data → Component → Template → Administration → Document`.

### AC-003 — Architecture tidak menyebut modul dynamic

Given `docs/architecture.md` hasil revisi

When `grep -R "global-tables\|/api/components\|/api/templates\|/api/administrations\|/api/documents\|/api/runs\|/api/navigation\|/api/expressions\|/api/render\|Persuratan\|Dokumen.*Component" docs/architecture.md`

Then 0 hit di luar Change Log, dan `## API Endpoints` hanya listar auth/users/roles/permissions/guards/activity-logs/system-logs/settings/storage/health, serta `Sidebar Menu` hanya 3 groups RBAC-Only.

### AC-004 — Database hanya 9 EntitySchemas

Given `server/utils/orm-data-source.ts` setelah revisi

When reviewer membaca `appEntities` array dan menjalankan `grep -R "GlobalTable\|Component\|Template\|Administration\|Document\|GlobalTableRow" server/entities server/utils/orm-data-source.ts`

Then `appEntities` berisi tepat `[UserSchema, RoleSchema, PermissionSchema, PermissionMethodSchema, PermissionUrlSchema, GuardSchema, GuardUrlSchema, ActivityLogSchema, SettingSchema]` (9 schemas, 12 tabel fisik inc. junctions), dan grep 0 hit.

### AC-005 — API dynamic mengembalikan 404

Given server berjalan dengan JWT Super Admin valid

When client `GET /api/global-tables`, `GET /api/components`, `GET /api/templates`, `GET /api/administrations`, `GET /api/documents`, `GET /api/runs/mine`, `GET /api/navigation`, `POST /api/expressions/validate`, `POST /api/render/preview`, `GET /api/data/test-table`

Then setiap request menerima `404` (bukan 200/500) dengan body `{ message: /Not Found|Cannot find/ }`.

### AC-006 — Login, Register, Dashboard tetap berfungsi

Given guest atau authenticated user

When guest melakukan `POST /api/auth/login` dengan `admin@admin.com / P455w0rd!!!` dan `POST /api/auth/register` dengan payload valid, lalu membuka `/dashboard`

Then login/register 200/201 + JWT + redirect `/dashboard`, dashboard menampilkan `Halo, {firstName}` + stats `Total Users/Roles/Permissions/Guards` + `Recent Users 5` tanpa error console, tanpa widget dynamic.

### AC-007 — User Management CRUD tetap berfungsi (happy path + validation)

Given Super Admin di `/dashboard/users`

When admin mengklik `+ Buat User` → mengisi `firstName`, `lastName`, `email`, `username`, `password` (8+ uppercase+lowercase+angka), `confirmPassword` → submit

Then `POST /api/users` 201, table re-fetch menampilkan user baru, `NMessage success "Berhasil"`. Saat submit dengan email duplikat atau password lemah, `400` dengan inline `NFormItem feedback`.

### AC-008 — Activity Logs, System Logs, Settings tetap berfungsi

Given Super Admin di `/dashboard/activity-logs` dan `/dashboard/system-logs` dan `/dashboard/settings`

When membuka Activity Logs → filter `action=CREATE` → membuka System Logs → memilih file → membuka Settings → mengubah `app_name` → `PUT /api/settings` → upload favicon via `POST /api/settings/upload`

Then list & stats tampil, file log terbaca, settings terupdate, upload mengembalikan `{ url: "/api/storage/settings/..." }` dan `GET /api/storage/settings/...` 200 image.

### AC-009 — Sidebar hanya menampilkan menu RBAC-Only

Given authenticated user di `/dashboard`

When reviewer menginspeksi `AppLayout` sidebar DOM (`[data-testid="sidebar-menu"]` atau `NMenu` items)

Then menu yang terlihat adalah `Dashboard`, `User Management` (4 children), `Sistem` (3 children) saja — `Data`, `Persuratan`, `Dokumen` tidak ada — collapsed width 72, expanded 220, active state `bg #EFF6FF border #BFDBFE text #1D4ED8`.

### AC-010 — Build sukses tanpa import sisa

Given working directory `apps/web/`

When reviewer menjalankan `npm run build` (Nuxt build) dan `npx vue-tsc --noEmit` / `nuxt typecheck`

Then 0 error, tidak ada `Cannot find module '@/shared/types/global-table'` atau `server/entities/global-table` atau `app/composables/useGlobalTablesData`.

### AC-011 — 403 tunggal tetap berfungsi

Given authenticated Viewer (Read Only) mencoba `POST /api/users` tanpa permission

When server mengembalikan `403`

Then tepat satu floating `NAlert` `[data-testid=access-denied]` "Akses Ditolak" muncul top `16px` right `16px`, auto-dismiss 4s, tidak ada duplikat alert per halaman (verifikasi `document.querySelectorAll('[data-testid=access-denied]').length === 1`).

### AC-012 — DB tidak berisi tabel dynamic

Given environment development setelah cleanup

When reviewer menjalankan `rm -f apps/web/db.sqlite && npm run dev` lalu `sqlite3 db.sqlite "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"`

Then tabel yang ada hanya `users`, `roles`, `permissions`, `permission_methods`, `permission_urls`, `guards`, `guard_urls`, `activity_logs`, `settings`, `users_roles`, `roles_guards`, `roles_permissions` (+ `sqlite_sequence`, `migrations`) — tidak ada `global_tables`, `global_table_columns`, `global_table_rows`, `components`, `templates`, dll.

## Tasks

### Backend

- [ ] Entities — hapus `server/entities/global-table.entity.ts`, `global-table-column.entity.ts`, `global-table-row.entity.ts`, `component.entity.ts`, `template.entity.ts`, `template-binding.entity.ts`, `administration.entity.ts`, `administration-run.entity.ts`, `document.entity.ts`; perbarui `server/utils/orm-data-source.ts` `appEntities` 23→9; pastikan `server/utils/db.ts` re-export tidak duplikasi.
- [ ] DTO — hapus `server/dto/global-tables.dto.ts`, `global-table-columns.dto.ts`, `table-data.dto.ts`, `components.dto.ts`, `templates.dto.ts`, `template-bindings.dto.ts`, `administrations.dto.ts`, `documents.dto.ts`, `runs.dto.ts`, `expressions.dto.ts`, `render.dto.ts`, `navigation.dto.ts` (jika-only dynamic).
- [ ] Service — hapus `server/services/global-tables.service.ts`, `global-table-column.service.ts`, `table-data.service.ts`, `components.service.ts`, `templates.service.ts`, `template-bindings.service.ts`, `administrations.service.ts`, `runs.service.ts`, `documents.service.ts`, `rendering.service.ts`, `navigation.service.ts`, `computed-field.service.ts`, `relation.service.ts`; bersihkan `seeder.service.ts` (hapus `Designer`/`Operator`, `Data:*`, `Component:*` perms) & `permission-matrix.ts`.
- [ ] API Routes — hapus direktori `server/api/global-tables/`, `server/api/data/`, `server/api/components/`, `server/api/templates/`, `server/api/administrations/`, `server/api/documents/`, `server/api/runs/`, `server/api/expressions/`, `server/api/render/`, `server/api/navigation/`; pertahankan `auth`, `users`, `roles`, `permissions`, `guards`, `activity-logs` (hapus `coverage.get.ts` jika dynamic), `system-logs`, `settings`, `storage`, `health`.
- [ ] Utils — hapus `server/utils/composition-tree.ts`, `dynamic-schema.ts`, `component-helpers.ts`, `template-helpers.ts`, `administration-helpers.ts`, `run-helpers.ts`, `document-helpers.ts`, `binding-refs.ts`, `audit-redaction.ts` (jika hanya dynamic), `expressions/`, `rendering/`, `csv-safety.ts`, `security-limits.ts` (jika hanya dynamic); pertahankan `db.ts`, `jwt.ts`, `password.ts`, `route-guard.ts`, `url-matcher.ts`, `migration-status.ts`, `startup-check.ts`.
- [ ] Auth & Authorization — verifikasi `requireApiAccess` tetap untuk retained routes; tidak ada permission check untuk route terhapus.
- [ ] Validation & Error handling — pastikan Zod schemas dynamic terhapus tidak lagi diimpor; `createError` untuk retained routes tetap.
- [ ] Migration/Seed — buat migrasi drop `server/migrations/<ts>-DropDynamicTables.ts` (drop 14 tabel dynamic) atau instruksi `rm db.sqlite` untuk dev `synchronize:true`; update `appMigrations` export; seed RBAC-Only idempotent.
- [ ] Unit tests — hapus `tests/unit/*global-table*`, `*component*`, `*template*`, `*administration*`, `*document*`, `*rendering*`; pertahankan `users|roles|permissions|guards|activity-logs|system-logs|settings`.
- [ ] Integration/API tests — hapus coverage untuk `GET /api/global-tables` etc; tambah test `404` untuk route terhapus.

### Frontend

- [ ] Shared Types — hapus `shared/types/global-table.ts`, `global-table-column.ts`, `component.ts`, `template.ts`, `template-binding.ts`, `administration.ts`, `run.ts`, `document.ts`, `table-data.ts`, `render.ts`, `navigation.ts` (jika-only dynamic); pertahankan `user`, `role`, `permission`, `guard`, `activity-log`, `system-log`, `auth`, `api`.
- [ ] API Service / Composable — hapus `app/composables/useGlobalTablesData.ts`, `useComponentsData.ts`, `useTemplatesData.ts`, `useAdministrationsData.ts`, `useRunsData.ts`, `useCompositionTree.ts`, `useTemplateBindings.ts`, `useExpressionPreview.ts`, `useRenderPreview.ts`; pertahankan `useApi`, `useAuthorization`, `useDataTable`, `usePageTransition`, `useUsersData`, `useRolesData`, `usePermissionsData`, `useGuardsData`.
- [ ] Store — hapus `app/stores/globalTables.ts`, `global-table-columns.ts`, `components.ts`, `templates.ts`, `administrations.ts`, `runs.ts`, `documents.ts`, `tableData.ts`, `navigation.ts`; pertahankan `auth`, `users`, `roles`, `permissions`, `guards`, `settings`.
- [ ] Pages — hapus `app/pages/dashboard/data/global-tables.vue`, `app/pages/dashboard/data/[tableName].vue`, `app/pages/dashboard/docs/components.vue`, `templates.vue`, `administrations.vue`, `documents/index.vue`, `templates/[id].vue`, `administrations/[id].vue`, `documents/[id].vue`, `runs/index.vue`, `runs/[runId].vue`, `run/[adminId].vue`; pertahankan `index.vue`, `users.vue`, `roles.vue`, `permissions.vue`, `guards.vue`, `activity-logs.vue`, `system-logs.vue`, `settings.vue`, `profile.vue`, `login.vue`, `register.vue`.
- [ ] Components — hapus `app/components/features/global-tables/`, `components/`, `templates/`, `administrations/`, `documents/`, `runs/`, `table-data/`; pertahankan `users/` (User/Role/Guard/Permission) + `logging/` + `common/` (AuthForm/DataTable) + `layout/PageShell.vue`.
- [ ] Validation — Naive UI `NForm` rules untuk retained modules tetap sinkron Zod; hapus rules dynamic.
- [ ] States — loading/empty/error/success/permission 403 tunggal untuk retained pages tetap via `DataTable` kanonis + `PageShell`; hapus stories dynamic.
- [ ] Responsive & Accessibility — breakpoint & ARIA untuk retained pages tetap; hapus wireframe dynamic.
- [ ] Unit tests — `vitest` `test:unit` / `test:nuxt` untuk retained components saja.
- [ ] E2E tests — Playwright `test:e2e` untuk login/register/dashboard/users/roles/permissions/guards/activity-logs/system-logs/settings — hapus `global-tables`, `components`, `templates`, `administrations`, `documents` specs.

### Cross-Cutting

- [ ] RBAC matrix diperbarui — `permission-matrix.ts` hanya `users|roles|permissions|guards|activity-logs|system-logs|settings` + `Full Access`/`Read`/`Read Write`.
- [ ] ActivityLog — tetap log untuk retained entities; hapus `entity` values `GlobalTable`/`Component`/`Template`/`Administration`/`Document` dari enum/docs.
- [ ] Docs — `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md` direvisi RBAC-Only; `docs/production-runbook.md` diperbarui tanpa dynamic; direktori `docs/dynamic-administration`, `docs/audit`, `docs/mockups`, `docs/prototypes`, `docs/wireframes` dihapus.
- [ ] `AGENTS.md` — perbarui `Entities (23 → 9, 26 → 12 tables)` dan `Documentation` tanpa `dynamic-administration`.
- [ ] `app/utils/navigation-icons.ts` & `app/utils/table-data-format.ts` — hapus jika hanya dipakai dynamic, atau pangkas ke retained.
- [ ] Storybook — `stories/global-table` dihapus, `stories/foundation` dipangkas ke retained generik, `npm run build-storybook` sukses.
- [ ] Verifikasi konsistensi dengan docs — `grep -R` 0 hit dynamic di `docs/*.md` (di luar Change Log).

### Test Plan (QA — Bertindak sebagai QA Engineer)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit — DTO Zod retained | `tests/unit/users.dto.test.ts`, `roles.dto.test.ts`, `permissions.dto.test.ts`, `guards.dto.test.ts` | Validasi create/update/query schemas RBAC | FR-014, AC-007, AC-011 |
| UT-02 | Unit — Service retained | `tests/unit/users.service.test.ts`, `roles.service.test.ts`, `permissions.service.test.ts`, `guards.service.test.ts`, `activity-logs.service.test.ts`, `settings.service.test.ts` | CRUD, search/sort/pagination, unique constraints INV-01/02 | FR-006, INV-01/02, AC-007/008 |
| UT-03 | Unit — Deletion guard | `tests/unit/orm-datasource.test.ts` | `appEntities` length 9, no dynamic imports | FR-006, INV-03, AC-004, EC-01 |
| NT-01 | Nuxt — Component retained | `tests/nuxt/users.table.test.ts`, `roles.table.test.ts`, `permissions.table.test.ts`, `guards.table.test.ts` | Render DataTable + states loading/empty/error/success/validation | Step 6, AC-007 |
| NT-02 | Nuxt — Page retained | `tests/nuxt/dashboard.page.test.ts`, `login.page.test.ts`, `register.page.test.ts`, `activity-logs.page.test.ts` | Layout PageShell, sidebar menu count, auth forms | Step 3–5, AC-006/009 |
| NT-03 | Nuxt — 403 single | `tests/nuxt/access-denied.test.ts` | Floating `data-testid=access-denied` single instance | AC-011 |
| E2E-01 | E2E — Happy RBAC | `tests/e2e/rbac.spec.ts` | Full flow login → dashboard → users/roles/permissions/guards CRUD → activity-logs/system-logs/settings | Step 3–7, AC-006/007/008 |
| E2E-02 | E2E — Menu & 404 | `tests/e2e/scope-reduction.spec.ts` | Sidebar RBAC-Only (AC-009), akses route terhapus 404 (AC-005), docs deletion (AC-001) via filesystem check | Step 8–9, AC-001/005/009 |
| E2E-03 | E2E — Alternate/error | `tests/e2e/rbac.error.spec.ts` | Validation 400, 401 redirect login, 403 alert single, empty state `Belum ada data` + CTA | ALT/ERR, AC-007/011, EC-01/05 |
| INT-01 | API — Retained endpoints | `tests/integration/api.retained.test.ts` | `GET /api/users` pagination/search/sort, auth 401/403 matrix | FR-013/014, AC-006/007 |

- [ ] Unit tests — semua service/DTO retained + deletion-guard — 1 test per FR/BR/INV
- [ ] Nuxt tests — semua state (loading/empty/error/success/validation/permission) dari `## UI > States` untuk retained pages
- [ ] E2E tests — happy RBAC + menu/404 + alternate/error — mapping 1:1 ke User Flow + AC
- [ ] Coverage target: User Flow steps 100%, AC 100%, BR 100%, EC 100% (untuk retained scope)

