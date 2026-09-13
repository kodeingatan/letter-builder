<!-- split dari ../01-platform-scope-reduction.md — bagian: Objective, Context, Scope, Dependencies -->

## Objective

Merampingkan platform menjadi **RBAC-Only** — hanya menyisakan `login`, `register`, `dashboard`, `user management` (`user`, `guard`, `role`, `permission`), dan `sistem` (`activity logs`, `system logs`, `settings`) — dengan menghapus seluruh modul **Dynamic Administration** (`Global Table`, `Component`, `Template`, `Administration`, `Document`, `Expression/Rendering`, `Generated Menu`, `Table Data`) di backend, frontend, dan dokumentasi, serta menghapus direktori `docs/dynamic-administration/*`, `docs/audit`, `docs/mockups`, `docs/prototypes`, `docs/wireframes` dan memperbarui `docs/*` agar konsisten dengan scope baru.

## Context

PRD & arsitektur saat ini (`docs/PRD.md:13-14`, `docs/architecture.md:11-66`, `docs/database.md:5-481`) mendokumentasikan platform metadata-driven `Data → Component → Template → Administration → Document` dengan 23 EntitySchemas / 26 tabel fisik plus `docs/dynamic-administration/wiki` (25+ file), `docs/mockups`, `docs/prototypes`, `docs/wireframes`, `docs/audit`. Implementasi kode (`apps/web/server/entities`, `server/api/*`, `app/pages/dashboard/data|docs`, `app/components/features/*`, `app/composables/*`, `shared/types/*`) telah meng-ekspansi jauh melampaui inti RBAC yang diminta stakeholder saat ini. Request `remove all feature kecuali login, register, dashboard, user management : user, guard, role, permission, sistem : activity logs, system logs, dan Settings` memerlukan **cleanup vertikal** (entity → DTO → service → API → composable/store → page/component → docs → seed → permission matrix → migration) agar build, tests, dan dokumentasi kembali single-source-of-truth untuk RBAC-Only tanpa sisa referensi Dynamic Administration.

Scope cleanup ini adalah prasyarat sebelum feature baru berbasis RBAC-Only dikembangkan — tidak ada UI baru yang didesain, hanya penghapusan dan pelurusan dokumen. Karena tidak ada antarmuka baru, FASE 1 wireframe/mockup/prototype terpisah tidak diperlukan; verifikasi UI mengacu pada UI existing yang dipertahankan.

## Scope

### In Scope

- **Hapus modul Dynamic Administration** — 14 EntitySchemas (`GlobalTable`, `GlobalTableColumn`, `GlobalTableRow`, `Component`, `ComponentDataRequirement`, `ComponentVersion`, `Template`, `TemplateVersion`, `TemplateBinding`, `Administration`, `AdministrationStep`, `AdministrationVersion`, `AdministrationRun`, `Document`) beserta DTO, service, API routes, composables, stores, pages, components, shared types, utils helper, seeder, dan permission matrix terkait.
- **Hapus generated/navigation layer** — `server/api/navigation`, `server/api/data/*`, `server/api/expressions/*`, `server/api/render/*`, `server/services/navigation.service.ts`, `server/utils/*` helper dynamic (`composition-tree.ts`, `dynamic-schema.ts`, `component-helpers.ts`, `template-helpers.ts`, `administration-helpers.ts`, `run-helpers.ts`, `document-helpers.ts`, `binding-refs.ts`, `expressions/`, `rendering/`).
- **Hapus frontend dynamic** — `app/pages/dashboard/data/*`, `app/pages/dashboard/docs/*`, `app/components/features/*` kecuali `users` & `logging` (yang dipertahankan untuk activity/system logs), `app/composables/use*Data.ts` untuk global-tables/components/templates/administrations/runs, `app/stores/*` dynamic, `stories/global-table/*` & `stories/foundation` yang mereferensikan modul terhapus (sisakan `AuthForm`, `Button`, `LoginPage`, `RegisterPage`, dll bila tidak terkait dynamic).
- **Hapus dokumentasi** — direktori `docs/dynamic-administration/` (wiki + raw), `docs/audit/`, `docs/mockups/`, `docs/prototypes/`, `docs/wireframes/` (beserta konten `foundation` & `global-table-ux` jika sepenuhnya terkait dynamic — `foundation` 403-tunggal/PageShell/DataTable kanonis **dipertahankan dengan merelokasi** hanya bagian yang generik ke `docs/design-system.md` jika masih relevan).
- **Perbarui `docs/*`** — `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`, `docs/production-runbook.md` agar hanya mendeskripsikan RBAC-Only (9 EntitySchemas / 12 tabel fisik inc. junctions), tanpa `Data → Component → Template → Administration → Document`.
- **Perbarui konfigurasi** — `server/utils/orm-data-source.ts` (`appEntities` 23→9), `server/utils/db.ts` re-export, `server/plugins/database.server.ts` seed (`Designer`/`Operator` + `Data:*` permissions dihapus), `server/utils/permission-matrix.ts`, `server/migrations/1788914913928-Baseline.ts` atau buat migrasi drop-table baru + instruksi `db.sqlite` reset untuk dev, `app/utils/navigation-icons.ts` / `resolveMenuIcon` dari dynamic.
- **Perbarui layout & menu** — `app/components/layout/AppLayout.vue` / `app/layouts/default.vue` & `app/stores/navigation.ts` agar sidebar hanya: `Dashboard`, `User Management (User, Guard, Role, Permissions)`, `Sistem (Activity Logs, System Logs, Settings)` (+ `Profile`), tanpa `Data` / `Persuratan` / `Dokumen` generated groups.
- **Bersihkan referensi silang** — `AGENTS.md`, `README`, `package.json` scripts/comments yang menyebut dynamic modules.

### Out of Scope

- Perubahan behavior pada modul yang dipertahankan (`auth` login/register/profile, `users`, `roles`, `guards`, `permissions`, `activity-logs`, `system-logs`, `settings`, `storage`, `health`) selain penyesuaian RBAC/seed/menu.
- Redesign visual baru — token `app/utils/naiveui-theme.ts` (`#3B82F6`, Inter, radius 6/4/8), `PageShell`, `DataTable` kanonis, `AccessDeniedAlert` tetap, hanya dipastikan tidak mereferensikan modul terhapus.
- Migrasi data historis Dynamic Administration — diasumsikan truncate/drop tanpa retensi (dev `synchronize:true`, prod via migrasi drop).
- Penambahan fitur baru RBAC-Only di luar cleanup.

## Dependencies

- `docs/PRD.md` — sumber scope baru (Bagian II Current Implementation Detail — RBAC Foundation menjadi keseluruhan PRD).
- `docs/architecture.md` — harus diselaraskan setelah penghapusan.
- `docs/database.md` — harus dipangkas ke 9 entitas RBAC.
- `docs/design-system.md` — referensi token & pola UI yang dipertahankan.
- `server/utils/orm-data-source.ts` — canonical entity list (jangan duplikasi di `server/utils/db.ts`).
- `AGENTS.md` — Working Directory `apps/web/` & tech stack.

