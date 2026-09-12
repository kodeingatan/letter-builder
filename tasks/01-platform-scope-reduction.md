# Task 01 — Platform Scope Reduction (RBAC-Only Cleanup & Docs Refresh)

## Status

DONE

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

## User Flow

> Alur verifikasi bahwa cleanup berhasil dan modul yang dipertahankan tetap berfungsi; konsisten untuk semua verifikasi manual & E2E.

### Diagram

```text
[Entry: /login] --(login valid)--> [/dashboard] --(navigasi)--> [User Management: /dashboard/users|roles|permissions|guards]
        |                              |                                 |
        |                              +--(navigasi)--> [Sistem: /dashboard/activity-logs|system-logs|settings]
        |                              |
        +--(login invalid)--> [Inline validation + NAlert]
        |
[Attempt akses modul terhapus: /dashboard/data/*, /dashboard/docs/*, /api/global-tables, /api/components, /api/templates, /api/administrations, /api/documents, /api/runs, /api/navigation, /api/expressions/*, /api/render/*, /api/data/*]
        |
        +--(tanpa auth: 401) / (dengan auth: 404 atau 403 "Not Found" — rute hilang) + sidebar tidak menampilkan group Data/Persuratan/Dokumen
        |
[Docs verification] --> [docs/dynamic-administration, docs/audit, docs/mockups, docs/prototypes, docs/wireframes tidak ada; docs/PRD|architecture|database|design-system hanya menyebut RBAC-Only]
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Developer/Reviewer | Hapus direktori `docs/dynamic-administration`, `docs/audit`, `docs/mockups`, `docs/prototypes`, `docs/wireframes` | Filesystem | Direktori tidak ada di `ls docs/` |
| 2 | Developer | Perbarui `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md` | Docs | Tidak ada sebutan `Global Table`/`Component`/`Template`/`Administration`/`Document` kecuali di Change Log historis |
| 3 | Guest | Buka `/login`, submit kredensial valid | `POST /api/auth/login` | 200 + JWT + redirect `/dashboard` |
| 4 | Guest | Buka `/register`, submit registrasi valid | `POST /api/auth/register` | 201 + redirect `/login` |
| 5 | Authenticated (Super Admin) | Buka `/dashboard` | `GET /api/auth/profile` + `GET /api/settings` | Dashboard render dengan widget stat RBAC-Only (users/roles/permissions/guards) tanpa shortcut dynamic |
| 6 | Authenticated | Navigasi `User Management → User/Role/Guard/Permissions` | `GET /api/users`, `/api/roles`, `/api/guards`, `/api/permissions` | List + search/sort/pagination + PageShell + DataTable 320/160 berfungsi |
| 7 | Authenticated | Navigasi `Sistem → Activity Logs / System Logs / Settings` | `GET /api/activity-logs`, `/api/system-logs/files`, `/api/settings` | Logs & settings berfungsi; upload settings tetap via `/api/settings/upload` & `/api/storage/*` |
| 8 | Authenticated | Coba akses route terhapus `/dashboard/data/global-tables`, `/dashboard/docs/components`, `/dashboard/docs/templates`, `/dashboard/docs/administrations`, `/dashboard/docs/documents`, `/dashboard/docs/runs`, `/dashboard/data/:tableName` | Nuxt router | 404 / redirect ke `/dashboard` / `Not Found` page, tidak ada menu untuknya |
| 9 | Authenticated | Coba panggil API terhapus `GET /api/global-tables`, `GET /api/components`, `GET /api/templates`, `GET /api/administrations`, `GET /api/documents`, `GET /api/runs/mine`, `GET /api/navigation`, `POST /api/expressions/validate`, `POST /api/render/preview`, `GET /api/data/:tableName` | Nitro `h3` | 404 `Cannot find route` (bukan 500) |
| 10 | Reviewer | Jalankan `npm run build` dari `apps/web/` + `vue-tsc` | Build | 0 error, tidak ada import error ke modul terhapus |
| 11 | Reviewer | Jalankan tests `npm run test:unit`, `npm run test:nuxt`, `npm run test:e2e` (subset RBAC) | Vitest/Playwright | Semua test terkait RBAC-Only PASS, tidak ada test yang mengimpor modul terhapus |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Verifikasi docs masih menyebut dynamic | Step 2 → grep `Global Table\|Component\|Template\|Administration\|dynamic-administration` di `docs/*.md` | Harus 0 hit di luar `Change Log`; jika ada, revisi docs |
| ALT-02 | Sidebar masih menampilkan group Data/Persuratan/Dokumen | Step 5–6 → inspeksi `AppLayout` menu | Menu harus hanya `Dashboard`, `User Management` (4), `Sistem` (3) — Data/Persuratan/Dokumen hilang |
| ERR-01 | API terhapus masih merespons 200 karena route tertinggal | Step 9 → `curl -H "Authorization: Bearer …" /api/global-tables` | Harus 404, bukan 500; jika 500, route belum terhapus bersih |
| ERR-02 | Import error setelah penghapusan (mis. `shared/types/global-table` masih diimpor) | Step 10 → `npm run build` gagal `Cannot find module` | Hapus import & type sisa, re-run build |
| ERR-03 | `db.sqlite` masih berisi tabel dynamic (`global_tables`, `components`, dll) | Reviewer → `sqlite3 db.sqlite .tables` | Dev: hapus `db.sqlite` & restart (synchronize:true); Prod: migrasi drop harus applied |
| ERR-04 | Seeder masih membuat role `Designer`/`Operator` atau permission `Data:*` | Seed run → cek `roles`, `permissions` | Hanya `Super Admin`/`Admin`/`User` tersisa; verification query `SELECT roleName FROM roles` |
| ERR-05 | Tests masih mengimpor modul dynamic | Step 11 → `vitest` gagal `Cannot find module` | Hapus/skip tests dynamic, update coverage |

### Flow → UI Mapping

| Flow Step | Halaman (dipertahankan) | Component | State |
|-----------|--------------------------|-----------|-------|
| Step 3 | `/login` | `AuthForm.vue` + `app/pages/login.vue` | default, validation, loading, error 401 |
| Step 4 | `/register` | `AuthForm.vue` + `app/pages/register.vue` | default, validation |
| Step 5 | `/dashboard` | `app/pages/dashboard/index.vue` + `PageShell.vue` + `DashboardPage` widgets + `AppLayout` sidebar 220/72 | loading → success (stats), empty (no users) |
| Step 6 | `/dashboard/users`, `/roles`, `/permissions`, `/guards` | `PageShell.vue` + `DataTable.vue` + `UserTable/RoleTable/PermissionTable/GuardTable.vue` + `*FormModal`/`*DetailDrawer` | loading, empty (`NEmpty` + CTA), error (`NAlert` + retry), success, permission 403 single |
| Step 7 | `/dashboard/activity-logs`, `/system-logs`, `/settings`, `/profile` | `PageShell` + `DataTable` / `LogDetailDrawer` / `SettingsForm` | loading, empty, error |
| Step 8 | Removed routes | — | 404 / Not Found (bukan render halaman dynamic) |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi | Keterangan |
|-----------|-------------|--------------|----------|------------|
| Step 3 | POST | `/api/auth/login` | `LoginSchema` (Zod) | Public |
| Step 4 | POST | `/api/auth/register` | `RegisterSchema` | Public |
| Step 5 | GET | `/api/auth/profile`, `GET /api/settings` | JWT | Retained |
| Step 6 | GET/POST/PUT/DELETE | `/api/users`, `/api/users/:id`, `/api/roles`, `/api/roles/:id`, `/api/permissions`, `/api/permissions/:id`, `/api/guards`, `/api/guards/:id` | JWT + `requireApiAccess` | Retained RBAC |
| Step 7 | GET | `/api/activity-logs`, `/api/activity-logs/stats`, `/api/activity-logs/:id`, `/api/system-logs/files`, `/api/system-logs/files/:filename`, `/api/system-logs/stats/:filename` | JWT (+ permission) | Retained Sistem |
| Step 7 | GET/PUT/POST | `/api/settings`, `/api/settings/:key`, `PUT /api/settings`, `POST /api/settings/upload`, `GET /api/storage/:subfolder/:filename` | JWT (upload: permission) | Retained |
| Step 7 | GET | `/api/health` | Public | Retained |
| Step 8–9 | — | `/api/global-tables/*`, `/api/data/*`, `/api/components/*`, `/api/templates/*`, `/api/administrations/*`, `/api/documents/*`, `/api/runs/*`, `/api/navigation`, `/api/expressions/*`, `/api/render/*` | — | **Dihapus — harus 404** |

## Requirements

### Tujuan Fitur

- REQ-G01: Platform kembali ke inti RBAC-Only sesuai permintaan stakeholder — hanya auth, dashboard, user management, sistem — tanpa beban maintenance Dynamic Administration.
- REQ-G02: Dokumentasi (`docs/*`) menjadi single-source-of-truth yang konsisten dengan kode yang dipertahankan.
- REQ-G03: Tidak ada rute, komponen, atau tabel sisa yang dapat diakses setelah cleanup (keamanan & kebingungan nol).

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Super Admin | Mengelola seluruh RBAC + sistem, verifikator cleanup | Full Access (`/*`, `*`) |
| Admin | Mengelola user/role/permission/guard, melihat logs/settings | Web Access + Read Write |
| User (Viewer) | Akses dashboard & profile, read-only sesuai permission | Read Only |
| Developer/Reviewer | Menjalankan cleanup, verifikasi docs & build | Filesystem + `npm run build/test` |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Developer | Menghapus direktori docs dynamic & artefak mockup/wireframe/prototype | `docs/` hanya berisi `PRD.md`, `architecture.md`, `database.md`, `design-system.md`, `production-runbook.md` (+ assets generik) | Step 1 |
| UC-02 | Developer | Memperbarui PRD/architecture/database/design-system ke RBAC-Only | Docs tidak menyebut `Global Table→Component→Template→Administration→Document` | Step 2, ALT-01 |
| UC-03 | Guest | Login & register tetap berfungsi | JWT + redirect | Step 3–4 |
| UC-04 | Authenticated | Mengelola user/role/guard/permission via DataTable | CRUD 200, validasi Zod, RBAC 403 single | Step 6 |
| UC-05 | Authenticated | Melihat activity-logs, system-logs, settings | List & detail tampil, upload settings berfungsi | Step 7 |
| UC-06 | Authenticated | Mencoba akses modul terhapus | 404 / menu tidak ada | Step 8–9, ERR-01 |
| UC-07 | Reviewer | Verifikasi build & tests RBAC-Only | `build` 0 error, tests PASS | Step 10–11, ERR-02/05 |

### Functional Requirements

- FR-001: Sistem **harus menghapus** fisik direktori `docs/dynamic-administration/`, `docs/audit/`, `docs/mockups/`, `docs/prototypes/`, `docs/wireframes/` — `ls docs/` tidak menampilkan keempat direktori tersebut — mengcover Step 1.
- FR-002: `docs/PRD.md` **harus** direvisi: hapus Bagian I Dynamic Administration (core concept `Data → Component → Template → Administration → Document`, goals dynamic, target users Designer/Operator, functional requirements Global Table/Component/Template/Administration/Document) dan sisakan Bagian II RBAC Foundation sebagai keseluruhan PRD dengan sidebar `User Management + Sistem` saja — mengcover Step 2.
- FR-003: `docs/architecture.md` **harus** direvisi: hapus layer stack Dynamic Administration, module boundaries dynamic, routes `/dashboard/data/*` & `/dashboard/docs/*`, API section `Dynamic Administration` (Global Tables, Table Data, Expressions, Components, Templates, Administrations, Runs, Documents, Rendering, Navigation), ERD dynamic — sisakan RBAC routes/APIs — mengcover Step 2.
- FR-004: `docs/database.md` **harus** direvisi: entitas 23→9 (`users`, `roles`, `permissions`, `permission_methods`, `permission_urls`, `guards`, `guard_urls`, `activity_logs`, `settings` + 3 junction `users_roles`, `roles_guards`, `roles_permissions` = 12 tabel fisik), hapus `DYNAMIC ADMINISTRATION TABLES` — mengcover Step 2.
- FR-005: `docs/design-system.md` **harus** direvisi: hapus `Dynamic Administration UI Patterns` (column type mapping, CRUD generated, template editor, administration workflow) & `Global Table UX Deliverables` / `Foundation Deliverables` yang spesifik dynamic, pertahankan token Naive UI + PageShell/DataTable/AccessDeniedAlert generik — mengcover Step 2.
- FR-006: `server/utils/orm-data-source.ts` **harus** mendaftarkan tepat 9 EntitySchemas (tidak ada import `global-table`, `component`, `template`, `administration`, `document`, `global-table-row`) — mengcover Step 10 & ERR-03.
- FR-007: `server/api/*` **harus** tidak lagi mengekspos rute dynamic (`global-tables`, `data`, `components`, `templates`, `administrations`, `documents`, `runs`, `expressions`, `render`, `navigation`) — `ls server/api` hanya menampilkan `auth`, `users`, `roles`, `permissions`, `guards`, `activity-logs`, `system-logs`, `settings`, `storage`, `health` — mengcover Step 9.
- FR-008: `server/dto/*`, `server/services/*`, `shared/types/*` **harus** menghapus file dynamic (`global-tables.dto.ts`, `components.dto.ts`, `templates.dto.ts`, `administrations.dto.ts`, `documents.dto.ts`, `runs.dto.ts`, `expressions.dto.ts`, `table-data.dto.ts`, dll serta service/type counterpart) — mengcover ERR-02.
- FR-009: `app/pages/dashboard/*`, `app/components/features/*`, `app/composables/*`, `app/stores/*` **harus** menghapus `data/`, `docs/`, `global-tables`, `components`, `templates`, `administrations`, `documents`, `runs`, `table-data` — `ls app/pages/dashboard` hanya menampilkan `index.vue`, `users.vue`, `roles.vue`, `permissions.vue`, `guards.vue`, `activity-logs.vue`, `system-logs.vue`, `settings.vue`, `profile.vue` — mengcover Step 8.
- FR-010: Sidebar `AppLayout` **harus** hanya menampilkan `Dashboard`, `User Management (User, Guard, Role, Permissions)`, `Sistem (Activity Logs, System Logs, Settings)` — tanpa group `Data`, `Persuratan`, `Dokumen` — mengcover Step 5–6 & ALT-02.
- FR-011: `server/services/seeder.service.ts` & `server/utils/permission-matrix.ts` **harus** tidak lagi seed `Designer`/`Operator` atau `Data:{table}:Read/Write` / `Component:*` / `Template:*` / `Administration:*` / `Document:*` permissions — `SELECT * FROM roles` hanya `Super Admin`/`Admin`/`User` — mengcover ERR-04.
- FR-012: `npm run build` (dari `apps/web/`) **harus** sukses 0 error setelah cleanup — mengcover Step 10.
- FR-013: Login (`POST /api/auth/login`), register (`POST /api/auth/register`), dan dashboard (`/dashboard`) **harus** tetap berfungsi penuh setelah cleanup — mengcover Step 3–5.
- FR-014: Modul yang dipertahankan (`users`, `roles`, `permissions`, `guards`, `activity-logs`, `system-logs`, `settings`) **harus** tetap lolos `npm run test:unit` / `test:nuxt` / `test:e2e` untuk RBAC — mengcover Step 11.

### Business Rules

- BR-001: Modul yang dipertahankan tidak boleh mengalami perubahan kontrak API (request/response, query params `page/limit/search/searchField/sortBy/sortOrder`, response `{data,total,page,limit,totalPages}`) — cleanup hanya menghapus, bukan mengubah.
- BR-002: Penghapusan bersifat **hard delete** tanpa soft-delete atau feature flag — rute dynamic harus 404, bukan `deprecated` atau redirect ke stub.
- BR-003: Dokumentasi adalah sumber kebenaran — setiap entitas/tabel/rute/API yang tidak ada di kode **tidak boleh** disebut di `docs/*` (kecuali di `Change Log` historis dengan penanda `Removed in Task 01`).
- BR-004: `synchronize: true` (dev) mengizinkan `db.sqlite` dihapus manual; `synchronize: false` (prod) **wajib** memiliki migrasi drop-table yang terverifikasi atau instruksi reset BMD — tidak boleh ship `synchronize:true` ke prod.
- BR-005: RBAC tetap enforcement server-side via `requireApiAccess` (permission method+URL) + client-side `canAccessUrl` untuk menu gating; guard allow/deny tidak diperluas ke modul terhapus.
- BR-006: `docs/mockups`, `docs/prototypes`, `docs/wireframes` yang generik-foundation (PageShell/DataTable/403) bila masih relevan harus **dimerge** ke `docs/design-system.md` sebelum dihapus sebagai direktori — tidak boleh hilang tanpa jejak.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | File sisa mengimpor modul terhapus (mis. `import { GlobalTableSchema }`) | Build gagal `Cannot find module`; hapus import, re-run `npm run build` | ERR-02 |
| EC-02 | `db.sqlite` lama masih berisi tabel dynamic setelah kode dihapus | Dev: `rm apps/web/db.sqlite` + restart; Prod: jalankan migrasi drop `1788…-DropDynamicTables.ts` | ERR-03 |
| EC-03 | `docs/` masih mengandung referensi dynamic setelah update | Grep `grep -r "Global Table\|Component\|Template\|Administration\|dynamic-administration" docs/` harus 0 hit di luar Change Log | ALT-01 |
| EC-04 | Sidebar masih menampilkan menu dynamic karena `navigation` store cache `localStorage` | Clear `localStorage` & `navigation` Pinia store, reload | ALT-02 |
| EC-05 | Tests dynamic masih ada dan gagal | Hapus `tests/e2e/global-tables.spec.ts` dll, atau skip via `vitest` exclude | ERR-05 |
| EC-06 | `stories/global-table/*` masih direferensikan `/.storybook/main.ts` | Hapus stories dynamic, `npm run build-storybook` harus sukses tanpa import error | Step 11 |
| EC-07 | Permission lama (`Data:*`, `Component:*`) masih di DB setelah seed idempotent | Tambah migrasi cleanup `DELETE FROM permissions WHERE permissionName LIKE 'Data:%'` atau truncate + re-seed | ERR-04 |
| EC-08 | File upload settings (`/api/settings/upload`) masih mereferensikan `dynamic-schema` util | Pastikan util terhapus tidak dipakai; `storage.service.ts` tetap standalone | FR-007 |

## Domain

### Entities

| Entity | Deskripsi | Atribut Kunci | Status |
|--------|-----------|---------------|--------|
| User | Akun platform | id, firstName, lastName, username, email, password (bcrypt) | **Dipertahankan** |
| Role | Kumpulan permission + guard | id, roleName, description | Dipertahankan |
| Permission | Aturan method+URL | id, permissionName, description | Dipertahankan |
| PermissionMethod | Method per permission | id, permissionId, method | Dipertahankan |
| PermissionUrl | URL pattern per permission | id, permissionId, url | Dipertahankan |
| Guard | Kumpulan allow/deny URLs (client gating) | id, guardName, description | Dipertahankan |
| GuardUrl | URL rule per guard | id, guardId, url, type | Dipertahankan |
| ActivityLog | Audit trail | id, userId, action, entity, entityId, description, metadata, ipAddress, userAgent, level, createdAt | Dipertahankan |
| Setting | Key-value konfigurasi | id, key, value | Dipertahankan |
| GlobalTable | Definisi tabel dinamis (name, displayName, columns) | id, name, displayName | **Dihapus** |
| GlobalTableColumn | Kolom schema-driven | id, globalTableId, name, type, position | Dihapus |
| GlobalTableRow | Generic row JSON | id, globalTableId, values | Dihapus |
| Component | Reusable document block | id, name, content, status | Dihapus |
| ComponentDataRequirement | Contract data requirement | id, componentId, name, type | Dihapus |
| ComponentVersion | History immutable | id, componentId, version | Dihapus |
| Template | Blueprint dokumen | id, name, content, status | Dihapus |
| TemplateVersion | History | id, templateId, version | Dihapus |
| TemplateBinding | Binding requirement→source | id, templateId, placementId, requirementName, source | Dihapus |
| Administration | Workflow multi-step | id, name, status | Dihapus |
| AdministrationStep | Step per administration | id, administrationId, order, templateId | Dihapus |
| AdministrationVersion | Snapshot publish | id, administrationId, version | Dihapus |
| AdministrationRun | Eksekusi workflow | id, administrationId, status, startedBy | Dihapus |
| Document | Output PDF/HTML | id, administrationId, runId, dataSnapshot | Dihapus |

### Relationships

```text
users ──M:N── roles ──M:N── guards ──1:N── guard_urls          (dipertahankan)
users ──M:N── roles ──M:N── permissions ──1:N── permission_methods (dipertahankan)
                                          └──1:N── permission_urls (dipertahankan)
users ──1:N── activity_logs (FK SET NULL)                        (dipertahankan)

[DIHAPUS] global_tables ─< global_table_columns
[DIHAPUS] global_tables ─< global_table_rows
[DIHAPUS] components ─< component_data_requirements
[DIHAPUS] components ─< component_versions
[DIHAPUS] templates ─< template_versions
[DIHAPUS] templates ─< template_bindings
[DIHAPUS] administrations ─< administration_steps >── templates
[DIHAPUS] administrations ─< administration_runs ─< documents
```

- REL-01: `users_roles` (users M:N roles) ON DELETE CASCADE — dipertahankan.
- REL-02: `roles_guards` (roles M:N guards) ON DELETE CASCADE — dipertahankan.
- REL-03: `roles_permissions` (roles M:N permissions) ON DELETE CASCADE — dipertahankan.
- REL-04: `guard_urls` (guards 1:N GuardUrl) ON DELETE CASCADE — dipertahankan.
- REL-05: `permission_methods` + `permission_urls` (permissions 1:N) ON DELETE CASCADE — dipertahankan.
- REL-06 (DIHAPUS): `global_table_columns` & `global_table_rows` cascade — dihapus bersama entity.
- REL-07 (DIHAPUS): `component_data_requirements`/`versions`, `template_*`, `administration_*`, `documents` — dihapus.

### States

| Entity | State | Deskripsi | Transisi Diizinkan | Status |
|--------|-------|-----------|--------------------|--------|
| Semua retained | N/A — stateless CRUD | CRUD tanpa workflow | — | Dipertahankan (stateless) |
| GlobalTable/Component/Template/Administration (DIHAPUS) | draft/published/archived | Versioned publish lifecycle | draft→published→archived, published→new-version | Dihapus |
| AdministrationRun (DIHAPUS) | pending/running/completed/cancelled | Eksekusi workflow | pending→running→completed\|cancelled | Dihapus |
| Document (DIHAPUS) | draft/issued/reissued | Render lifecycle | draft→issued→reissued | Dihapus |

### Domain Rules

- DR-01: Setiap `Permission` harus memiliki minimal 1 `PermissionMethod` dan 1 `PermissionUrl` agar efektif (vacuous permission = deny-all).
- DR-02: `GuardUrl` bertipe `deny` dievaluasi client-side sebelum `allow` untuk menu gating; server tidak mengevaluasi guard.
- DR-03: `ActivityLog.userId` nullable — log tetap tersimpan bila user dihapus (SET NULL).
- DR-04 (DIHAPUS): `Component` tidak dapat dihapus bila masih dipakai `Template` — aturan ini hilang bersama modul.
- DR-05 (DIHAPUS): `Global Table` relation `restrict` vs `detach` — hilang.

### Invariants

- INV-01: `users.username` & `users.email` UNIQUE — tidak boleh duplikat (enforced DB + Zod).
- INV-02: `roles.roleName`, `permissions.permissionName`, `guards.guardName`, `settings.key` UNIQUE.
- INV-03: `appEntities` di `orm-data-source.ts` harus tepat 9 schemas dan `synchronize: true` dev tidak membuat tabel dynamic.
- INV-04: `GET /api/navigation`, `GET /api/data/:tableName`, `POST /api/expressions/*`, `POST /api/render/preview` tidak ada — `matchUrlPattern` tidak dipakai untuk route tersebut lagi.
- INV-05: Sidebar menu length = 1 (Dashboard) + 4 (User Management) + 3 (Sistem) (+ Profile) — tidak ada entry dynamic.

### Data Model

#### users (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| firstName | varchar(100) | Y | N | — | Nama depan |
| lastName | varchar(100) | Y | N | — | Nama belakang |
| username | varchar(30) | Y | Y | — | Username 3–30 alfanum+_ |
| email | varchar(255) | Y | Y | — | Email |
| password | varchar(255) | Y | N | — | bcrypt hash |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

- Index: PK `id`, UNIQUE `username`, UNIQUE `email`.

#### roles (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| roleName | varchar(100) | Y | Y | — | Nama role |
| description | text | N | N | null | — |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

#### permissions (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| permissionName | varchar(100) | Y | Y | — | Nama permission |
| description | text | N | N | null | — |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

#### guards (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| guardName | varchar(100) | Y | Y | — | Nama guard |
| description | text | N | N | null | — |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

#### activity_logs (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| userId | integer | N | N | null | FK users.id SET NULL |
| action | varchar | Y | N | — | CREATE/UPDATE/DELETE/LOGIN/LOGOUT |
| entity | varchar | Y | N | — | User/Role/Permission/Guard/Auth/System |
| entityId | integer | N | N | null | ID entity |
| description | text | N | N | null | — |
| metadata | text | N | N | null | JSON |
| ipAddress | varchar | N | N | null | — |
| userAgent | varchar | N | N | null | — |
| level | varchar(20) | Y | N | INFO | INFO/WARNING/ERROR |
| createdAt | datetime | Y | N | now | — |

#### settings (dipertahankan)

| Field | Type | Required | Unique | Default | Description |
| ----- | ---- | -------- | ------ | ------- | ----------- |
| id | integer | Y | Y | auto | PK |
| key | varchar(100) | Y | Y | — | Key unik |
| value | text | Y | N | — | Value |
| createdAt | datetime | Y | N | now | — |
| updatedAt | datetime | Y | N | now | — |

- Junction `users_roles`, `roles_guards`, `roles_permissions` (PK komposit, FK CASCADE) dipertahankan tanpa perubahan.

#### [DIHAPUS] global_tables, global_table_columns, global_table_rows, components, component_data_requirements, component_versions, templates, template_versions, template_bindings, administrations, administration_steps, administration_versions, administration_runs, documents

- Status: **Dihapus** — tidak ada tabel, tidak ada EntitySchema, migrasi drop atau `synchronize` reset. Detail kolom lihat `docs/database.md` sebelum Task 01 (git history) untuk referensi arsip.

## API

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step | Status |
|---|--------------|-------------|------|------------|-----------|-----------|--------|
| 1 | `/api/auth/register` | POST | Public | — | Register | Step 4 | **Retain** |
| 2 | `/api/auth/login` | POST | Public | — | Login | Step 3 | Retain |
| 3 | `/api/auth/profile` | GET | JWT | — | Get profile | Step 5 | Retain |
| 4 | `/api/auth/profile` | PATCH | JWT | — | Update profile | — | Retain |
| 5 | `/api/auth/password` | PATCH | JWT | — | Change password | — | Retain |
| 6 | `/api/users` | GET | JWT | users:list | List paginated | Step 6 | Retain |
| 7 | `/api/users` | POST | JWT | users:create | Create | Step 6 | Retain |
| 8 | `/api/users/:id` | GET | JWT | users:read | Detail | Step 6 | Retain |
| 9 | `/api/users/:id` | PUT | JWT | users:update | Update | Step 6 | Retain |
| 10 | `/api/users/:id` | DELETE | JWT | users:delete | Delete | Step 6 | Retain |
| 11 | `/api/roles` | GET/POST | JWT | roles:* | CRUD | Step 6 | Retain |
| 12 | `/api/roles/:id` | GET/PUT/DELETE | JWT | roles:* | CRUD | Step 6 | Retain |
| 13 | `/api/permissions` | GET/POST | JWT | permissions:* | CRUD | Step 6 | Retain |
| 14 | `/api/permissions/:id` | GET/PUT/DELETE | JWT | permissions:* | CRUD | Step 6 | Retain |
| 15 | `/api/guards` | GET/POST | JWT | guards:* | CRUD | Step 6 | Retain |
| 16 | `/api/guards/:id` | GET/PUT/DELETE | JWT | guards:* | CRUD | Step 6 | Retain |
| 17 | `/api/activity-logs` | GET | JWT | activity-logs:read | List filterable | Step 7 | Retain |
| 18 | `/api/activity-logs/stats` | GET | JWT | activity-logs:read | Stats | Step 7 | Retain |
| 19 | `/api/activity-logs/:id` | GET | JWT | activity-logs:read | Detail | Step 7 | Retain |
| 20 | `/api/activity-logs/coverage` | GET | JWT | — | Coverage matrix | — | **Hapus** (jika terkait dynamic audit) |
| 21 | `/api/system-logs/files` | GET | JWT | system-logs:read | List files | Step 7 | Retain |
| 22 | `/api/system-logs/files/:filename` | GET | JWT | system-logs:read | Read file | Step 7 | Retain |
| 23 | `/api/system-logs/stats/:filename` | GET | JWT | system-logs:read | Stats | Step 7 | Retain |
| 24 | `/api/settings` | GET | Public | — | Get all | Step 7 | Retain |
| 25 | `/api/settings/:key` | GET | Public | — | Get by key | — | Retain |
| 26 | `/api/settings` | PUT | JWT | settings:update | Update | Step 7 | Retain |
| 27 | `/api/settings/upload` | POST | JWT | settings:update | Upload file | Step 7 | Retain |
| 28 | `/api/storage/:subfolder/:filename` | GET | Public | — | Serve file | Step 7 | Retain |
| 29 | `/api/health` | GET | Public | — | Health check | — | Retain |
| 30 | `/api/global-tables` | * | — | — | CRUD global tables | Step 9 | **Hapus → 404** |
| 31 | `/api/global-tables/:id/*` | * | — | — | Columns/rows/menu | Step 9 | Hapus → 404 |
| 32 | `/api/data/:tableName` | * | — | — | Row CRUD import/export | Step 9 | Hapus → 404 |
| 33 | `/api/components` | * | — | — | Components CRUD | Step 9 | Hapus → 404 |
| 34 | `/api/templates` | * | — | — | Templates CRUD | Step 9 | Hapus → 404 |
| 35 | `/api/administrations` | * | — | — | Administrations CRUD | Step 9 | Hapus → 404 |
| 36 | `/api/documents` | * | — | — | Documents | Step 9 | Hapus → 404 |
| 37 | `/api/runs` | * | — | — | Runs | Step 9 | Hapus → 404 |
| 38 | `/api/navigation` | GET | JWT | — | Menu projection | Step 9 | Hapus → 404 |
| 39 | `/api/expressions/*` | POST | JWT | — | Validate/evaluate | Step 9 | Hapus → 404 |
| 40 | `/api/render/*` | POST | JWT | — | Preview render | Step 9 | Hapus → 404 |

> Jumlah akhir retained: 29 - 11 hapus = ~18 endpoint groups (auth 5, users 5, roles 5, permissions 5, guards 5, activity-logs 3, system-logs 3, settings 4, storage 1, health 1 — dikelompokkan).

### Detail per Endpoint (Retained — contoh)

#### List — GET /api/users

- **Request**
  - Query: `page` (1..100, default 1), `limit` (1..100, default 20), `search` (string), `searchField` (whitelist: id,firstName,lastName,username,email), `sortBy` (whitelist), `sortOrder` (ASC/DESC)
  - Headers: `Authorization: Bearer <JWT>` (kecuali public routes)
- **Response**
  ```json
  { "data": [{ "id": 1, "firstName": "Super", "lastName": "Admin", "username": "admin", "email": "admin@admin.com", "roles": [...] }], "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
  ```
- **Validation (Zod)**
  - `QuerySchema`: `page` coerced number min 1, `limit` 1–100, `sortBy` whitelist, `sortOrder` enum.
- **Error**
  | Status | Kondisi | Body |
  |--------|---------|------|
  | 400 | query tidak valid | `{ "message": "Validation failed", "errors": [...] }` |
  | 401 | tanpa/invalid token | `{ "message": "Unauthorized" }` |
  | 403 | permission tidak cukup | `{ "message": "Forbidden" }` |
- **Authentication**: JWT via `Authorization: Bearer` atau cookie `accessToken` (`server/middleware/auth.ts`, `server/utils/route-guard.ts`).
- **Authorization**: `requireApiAccess` — method+URL match terhadap `permissions` dari `roles` user.

#### Create — POST /api/users

- **Request** Body: `{ firstName, lastName, email, username, password, confirmPassword, roleIds? }` (Zod `CreateUserSchema`).
- **Validation**: firstName 1–100, lastName 1–100, email valid & unique, username 3–30 alfanum+_, password 8+ dengan uppercase+lowercase+angka, confirmPassword match.
- **Response**: `201 { id, ... }` (tanpa password).
- **Error**: 400 validation, 409 duplicate email/username, 401/403.

_(Pola identik berlaku untuk Roles/Guards/Permissions — DTO di `server/dto/*.dto.ts` — tidak diubah oleh task ini.)_

#### Detail per Endpoint (Dihapus — harus 404)

- **Request**: `GET /api/global-tables`, `GET /api/components`, `GET /api/templates`, `GET /api/administrations`, `GET /api/documents`, `GET /api/runs/mine`, `GET /api/navigation`, `POST /api/expressions/validate`, `POST /api/render/preview`, `GET /api/data/:tableName` dengan JWT valid.
- **Response**: `404 { "message": "Not Found" atau "Cannot find route" }` — Nitro tidak menemukan handler karena file `server/api/*` telah dihapus.
- **Validasi**: Tidak ada — route tidak ada.
- **Catatan**: Playwright & curl harus assert 404 bukan 500.

## UI

### Referensi Design

- Design task: N/A — tidak ada UI baru; cleanup mempertahankan UI existing yang telah diimplementasikan (RBAC foundation tasks 01–27). Referensi token & pola tetap `docs/design-system.md` (versi RBAC-Only setelah Task 01).
- Wireframe: `docs/wireframes/` — **dihapus** (aset `foundation` yang generik dimerge ke `docs/design-system.md` sebelum penghapusan).
- Mockup: `docs/mockups/` — **dihapus** (idem).
- Prototype: `docs/prototypes/` — **dihapus**.
- Storybook: `apps/web/stories/foundation/*` (PageShell, DataTable, AccessDeniedAlert, DashboardShortcuts) — **dipertahankan hanya jika tidak mereferensikan dynamic**; `stories/global-table/*` **dihapus**. Verifikasi `npm run storybook` :6006 & `npm run build-storybook` tetap sukses.

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design | Storybook |
|-------|---------|-------|-----------|---------------|-----------|
| `/login` | Login | Guest | Form email/username + password | Retain | `stories/LoginPage.stories.ts` |
| `/register` | Register | Guest | Form firstName/lastName/email/username/password | Retain | `stories/RegisterPage.stories.ts` |
| `/dashboard` | Dashboard | Auth | Ringkasan users/roles/permissions/guards + recent users + activity shortcut | Retain — hapus widget dynamic (global-tables/administrations counts) | `stories/DashboardPage.stories.ts` |
| `/dashboard/users` | User List | Auth + permission | Daftar + search + pagination + CRUD modal/drawer | Retain | — |
| `/dashboard/roles` | Role List | Auth | Daftar + assignment guard/permission | Retain | — |
| `/dashboard/permissions` | Permission List | Auth | Daftar + methods/URLs | Retain | — |
| `/dashboard/guards` | Guard List | Auth | Daftar + allow/deny URLs | Retain | — |
| `/dashboard/activity-logs` | Activity Logs | Auth | List filterable + stats + detail drawer | Retain | — |
| `/dashboard/system-logs` | System Logs | Auth | File selector + table + detail + code link | Retain | — |
| `/dashboard/settings` | Settings | Auth | Form key-value + upload favicon/bg | Retain | — |
| `/dashboard/profile` | Profile | Auth (self) | Update info + change password | Retain | — |
| `/dashboard/data/global-tables` | Global Tables | — | Daftar tabel dinamis | **Hapus** | `stories/global-table/*` hapus |
| `/dashboard/data/:tableName` | Table Data Browse | — | Browse row per table | Hapus | — |
| `/dashboard/docs/components` | Components | — | Reusable blocks | Hapus | — |
| `/dashboard/docs/templates` | Templates | — | Blueprint editor | Hapus | — |
| `/dashboard/docs/administrations` | Administrations | — | Workflow list | Hapus | — |
| `/dashboard/docs/runs` | My Runs | — | Runs list | Hapus | — |
| `/dashboard/docs/documents` | Documents | — | Documents list | Hapus | — |
| `/dashboard/docs/run/:adminId` | Run Wizard | — | Step wizard | Hapus | — |
| `/dashboard/docs/templates/:id` | Template Editor | — | Canvas + bindings | Hapus | — |
| `/dashboard/docs/administrations/:id` | Administration Detail | — | Steps editor | Hapus | — |

### Layout

- Navigasi: sidebar `NLayoutSider :width 220 :collapsed-width 72` (token `#3B82F6`/`#2563EB`, `AppLayout.vue:220/72`), menu via `h(NIcon, {default:()=>h(Icon)})`. **Sebelum**: 5 groups (`Dashboard`, `Data` generated, `Persuratan` generated, `Dokumen` 5 items, `User Management` 4, `Sistem` 3). **Sesudah**: 3 groups (`Dashboard`, `User Management → User|Guard|Role|Permissions`, `Sistem → Activity Logs|System Logs|Settings`) + `Profile` di header dropdown. Diproyeksikan statis (tidak via `GET /api/navigation` lagi).
- Struktur halaman: `PageShell` (`title 20px Semibold #1F2937` + `breadcrumb href + preventDefault + router.push` + `actions`) → `toolbar (DataTable: search 320px + field 160px + Restart + Settings + column visibility)` → `konten (NDataTable 36px row, header 40px)` → `pagination "Menampilkan {from}-{to} dari {total}"` → `NEmpty`/`NAlert error + retry`/`NSpin`.
- Penempatan: di bawah `/dashboard` layout `default.vue` dengan middleware `auth`.
- Penyesuaian dari design: tidak ada desain baru; hanya penghapusan menu items dynamic. Jika `wireframes/foundation` sebelumnya mendokumentasikan menu dynamic, catat deviasi di Change Log.

### Components

| Component | Lokasi | Deskripsi | Mengacu Mockup | Status |
|-----------|--------|-----------|----------------|--------|
| `PageShell.vue` | `app/components/layout/PageShell.vue` | Shell kanonis list/detail/editor | `docs/design-system.md` PageShell | Retain |
| `DataTable.vue` | `app/components/common/DataTable/DataTable.vue` | Tabel + search/sort/visibility/pagination + error slot | Kanonis 320/160 + `NAlert` + `Restart` | Retain |
| `AccessDeniedAlert.vue` | `app/components/common/AccessDeniedAlert.vue` | Floating global `NAlert` 403 tunggal `data-testid=access-denied` | `docs/design-system.md` Authorization UI | Retain |
| `AuthForm.vue` | `app/components/common/AuthForm/AuthForm.vue` | Form login/register | `mockups/foundation/auth.png` (dimigrasi) | Retain |
| `UserTable.vue` + `UserFormModal.vue` + `UserDetailDrawer.vue` | `app/components/features/users/` | CRUD user | Detail-view `.detail-view` pattern | Retain |
| `RoleTable.vue` + `RoleFormModal.vue` + `RoleDetailDrawer.vue` | `app/components/features/users/` | CRUD role + guard/permission assignment | — | Retain |
| `PermissionTable.vue` + `PermissionFormModal.vue` + `PermissionDetailDrawer.vue` | `app/components/features/users/` | CRUD permission + methods/URLs | — | Retain |
| `GuardTable.vue` + `GuardFormModal.vue` + `GuardDetailDrawer.vue` | `app/components/features/users/` | CRUD guard + allow/deny URLs | — | Retain |
| `LogDetailDrawer.vue` + `LogLevelBadge.vue` + `CodeLinkButton.vue` | `app/components/features/logging/` | System/Activity log detail | — | Retain |
| `GlobalTableTable.vue`, `ComponentTable.vue`, `TemplateTable.vue`, `AdministrationTable.vue`, `DocumentsTable.vue`, `RunsTable.vue`, `RelationSelector.vue`, `DynamicForm.vue`, `CompositionCanvas.vue`, `BindingTab.vue`, dll | `app/components/features/global-tables|components|templates|administrations|documents|runs|table-data/` | Semua komponen dynamic | **Hapus** |

### Interaction

- Trigger: klik sidebar `User Management → User` → `PageShell` + `DataTable` fetch `GET /api/users?page=1&limit=20`; klik `+ Buat User` → `NModal` `UserFormModal` → validasi Naive UI `NForm` sinkron Zod → `POST /api/users` → `useMessage success` + `NAlert` / re-fetch table → tetap sesuai pola existing.
- Flow: validate → submit → toast → redirect (login/register) atau re-fetch (CRUD) — tidak berubah.
- Konfirmasi: hapus via `NPopconfirm` / `NDialog` — tetap.
- Navigasi balik: `breadcrumb` `<a href>` + `preventDefault` + `router.push`, native right-click/Ctrl+click preserved.
- Deviasi dari prototype: tidak ada prototype baru; semua interaksi dynamic hilang (wizard `NSteps`, canvas `CompositionCanvas`, import CSV modal, relation selector). Jika E2E sebelumnya menguji dynamic, hapus test tersebut.

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe |
|------------|----------|-------------------|
| Desktop (≥1024px) | Sidebar 220 terbuka, tabel penuh, PageShell toolbar flex-row, 3 kolom dashboard `NGrid 3` | `wireframes/foundation/desktop.png` (sebelum dihapus — dimigrasi ke `docs/design-system.md` jika relevan) |
| Tablet (768–1023px) | Sidebar collapsible 72, kolom table hide via visibility toggle, toolbar wrap | `wireframes/foundation/tablet.png` |
| Mobile (<768px) | Sidebar drawer, toolbar `flex-wrap column`, DataTable scroll horizontal, form modal full-width | `wireframes/foundation/mobile.png` |
| — | Halaman dynamic (`/dashboard/data/*`, `/dashboard/docs/*`) tidak ada — akses mobile juga 404 | N/A |

### States

| State | Tampilan | Komponen Naive UI | Mengacu Mockup | Status |
|-------|----------|-------------------|----------------|--------|
| Loading | `NSpin` overlay semi-transparan di table/page | `NSpin` + `NSkeleton` | `loading.png` | Retain |
| Empty | `NEmpty` "Belum ada data" + CTA `+ Buat ...` | `NEmpty` | `empty.png` | Retain |
| Error | `NAlert type="error"` `Gagal memuat data` + `Coba lagi` → `emit retry` | `NAlert` closable | `error.png` | Retain |
| Success | `useMessage success` "Berhasil" | `useMessage()` | `success.png` | Retain |
| Validation | Inline error di `NFormItem` (`feedback`) sinkron Zod | `NFormItem` | `validation.png` | Retain |
| Permission Denied | Floating global `NAlert` "Akses Ditolak" `data-testid=access-denied` auto-dismiss 4s via `rbac-denied` event | `NAlert` + `Teleport` | `403.png` | Retain (tunggal) |
| 404 Not Found | Halaman `[...slug].vue` atau redirect ke `/dashboard` untuk route dynamic terhapus | `NResult` / `NEmpty` | — | **Baru — untuk route terhapus** |

### Accessibility

- Keyboard: semua aksi CRUD via keyboard, focus trap di `NModal`/`NDrawer`, tab order dipertahankan.
- ARIA: `aria-label="Segarkan data"` untuk Refresh, `aria-label="Atur ulang"` untuk Reset, `aria-current="page"` di breadcrumb leaf, `aria-hidden` di `NIcon` dekoratif.
- Kontras & font: tetap `app/utils/naiveui-theme.ts` primary `#3B82F6`, `primaryColorHover` `#2563EB`, radius `6px/4px/8px`, font `Inter`.
- Reduced motion: hormati `prefers-reduced-motion` (`usePageTransition` 250ms + CSS `animation-duration 0.01ms`).
- Screen reader: `NAlert` live region untuk 403, `NEmpty` deskripsi.

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

## Verification (QA — Bertindak sebagai QA Engineer)

### Automated (wajib lolos sebelum DONE)

- [ ] Typecheck (`vue-tsc --noEmit` / `nuxt typecheck`) — 0 error, tidak ada import dynamic sisa
- [ ] Unit tests (`npm run test:unit` dari `apps/web/`) — semua UT-01/02/03 PASS, coverage ≥80% logic retained
- [ ] Nuxt tests (`npm run test:nuxt`) — semua NT-01/02/03 PASS, semua state ter-render (loading/empty/error/success/validation/permission)
- [ ] API/Integration tests — semua retained endpoint PASS, validation + error + auth/authz PASS; deleted endpoints assert 404
- [ ] E2E tests (`npm run test:e2e` headed default) — semua E2E-01/02/03 + INT-01 PASS, semua User Flow steps + Alternate/Error flows
- [ ] Build (`npm run build` dari `apps/web/`) — sukses tanpa error (AC-010)
- [ ] Storybook build (`npm run build-storybook`) — sukses tanpa error (stories dynamic terhapus)

### Manual / QA Checklist (mapping ke User Flow & AC)

- [ ] Docs verification — `ls docs/` hanya 4+1 file, `ls docs/dynamic-administration` gagal, `grep -R "Global Table" docs/` 0 hit di luar Change Log (AC-001/002/003, FR-001/002/003/004/005)
- [ ] Database verification — `appEntities` 9, `sqlite_master` 12 tabel, FK CASCADE retained, UNIQUE invariants INV-01/02 (AC-004/012, FR-006)
- [ ] Permission verification — matrix `users:list|create|read|update|delete`, `roles:*`, `permissions:*`, `guards:*`, `activity-logs:read`, `system-logs:read`, `settings:update` — 401 tanpa token, 403 tanpa permission, 200 dengan permission (AC-011, BR-005)
- [ ] Business Rules verification — BR-001 kontrak API retained tidak berubah (snapshot `api.ts` `PaginatedResponse`), BR-002 hard delete 404, BR-003 docs truth, BR-004 synchronize prod, BR-005 RBAC (AC-005/006/007)
- [ ] Edge Cases verification — EC-01 build fail jika import sisa, EC-02 db reset, EC-03 grep docs, EC-04 localStorage navigation, EC-05 tests cleanup, EC-06 storybook, EC-07 permissions cleanup (ERR/ALT)
- [ ] States verification — loading (`NSpin`), empty (`NEmpty` "Belum ada data"), error (`NAlert` "Gagal memuat data" + `Coba lagi`), success (`useMessage`), validation (`NFormItem feedback`), permission (`data-testid=access-denied` tunggal) untuk retained pages (NT-01/02)
- [ ] Responsive verification — desktop 1024+ (sidebar 220, DataTable penuh), tablet 768–1023 (sidebar 72, visibility toggle), mobile <768 (drawer, toolbar wrap) via Storybook viewport + manual resize (## UI Responsive)
- [ ] Accessibility verification — keyboard tab order, `aria-label`, contrast `#3B82F6`, `prefers-reduced-motion`, a11y addon Storybook (NT-03)
- [ ] UI/UX verification — Naive UI direct import, Tailwind utility, token `naiveui-theme.ts` `#3B82F6`/`#2563EB` radius 6/4/8 Inter `@vicons/carbon` via `h(NIcon)` — visual parity retained pages vs `docs/design-system.md` RBAC-Only
- [ ] Storybook verification — `npm run storybook` :6006 menampilkan retained stories, `npm run build-storybook` sukses tanpa stories dynamic
- [ ] User Flow verification — setiap `User Flow > Steps` 1–11 + `Alternate & Error Flows` ALT-01/02 + ERR-01..05 ada AC (AC-001..012) dan ada E2E PASS (E2E-01/02/03)
- [ ] Acceptance verification — setiap AC-001..012 Given/When/Then PASS dengan traceability AC ↔ User Flow step ↔ Test ID (lihat Test Plan)

## Assumptions

- Diasumsikan tidak ada konsumen eksternal yang bergantung pada API dynamic yang dihapus — penghapusan adalah breaking change yang disetujui stakeholder.
- `docs/mockups`, `docs/prototypes`, `docs/wireframes` diasumsikan 100% terkait Dynamic Administration atau Foundation yang dapat dimerge ke `docs/design-system.md` — bila ada aset generik yang masih dibutuhkan, akan direlokasi sebelum direktori dihapus (BR-006).
- Dev environment memakai `synchronize:true` sehingga `rm db.sqlite` adalah reset yang sah; prod memakai `synchronize:false` + `migrationsRun:true` sehingga migrasi drop diperlukan.
- Tidak ada FASE 1 wireframe/mockup/prototype baru — cleanup hanya menghapus, tidak menambah UI baru; `## UI > Referensi Design` merujuk ke UI existing RBAC-Only.
- `activity_logs` dan `system_logs` dipertahankan sebagai modul Sistem — bukan bagian dari Dynamic Administration.
- Tests untuk modul dynamic boleh dihapus tanpa pengganti; coverage target hanya untuk retained scope.

## Open Questions

- [ ] Apakah `docs/audit/screenshots/README.md` atau aset `public/favicon.svg` yang generik perlu dipertahankan di lokasi baru atau ikut terhapus bersama `docs/audit`?
- [ ] Apakah migrasi drop `global_tables` etc harus ship sebagai migration baru `178...-DropDynamicTables.ts` atau cukup instruksi `rm db.sqlite` untuk semua env (implikasi prod `MIGRATION_DRIFT`)?
- [ ] Apakah `docs/production-runbook.md` perlu direvisi terpisah atau dihapus jika hanya membahas dynamic deployment?
- [ ] Apakah `stories/foundation` (PageShell/DataTable/AccessDeniedAlert) yang generik akan direlokasi ke `stories/rbac/` atau tetap di `stories/foundation` setelah `docs/mockups` dihapus?
- [ ] Perlu konfirmasi apakah `permission_matrix` untuk `settings` dan `system-logs` tetap `Read` vs `Write` atau perlu granularitas baru.

## Related Knowledge

- `docs/PRD.md` — versi sebelum Task 01 (git history) sebagai arsip scope lama
- `docs/architecture.md` — layer Dynamic Administration yang akan dihapus
- `docs/database.md` — 23 EntitySchemas / 26 tabel sebelum cleanup
- `docs/design-system.md` — token Naive UI `#3B82F6`, PageShell, DataTable kanonis, 403 tunggal
- `server/utils/orm-data-source.ts` — canonical `appEntities` / `appMigrations`
- `AGENTS.md` — Working Directory `apps/web/` & RBAC flow
- `docs/dynamic-administration/wiki/index.md` — konsep yang dihapus (arsip)
- `tasks/task-logs.md` — log status implementasi

## Change Log

### Initial

- Task specification created (FASE 2 — Implementation, RBAC-Only cleanup). Menghapus semua fitur kecuali login, register, dashboard, user management (user, guard, role, permission), sistem (activity logs, system logs, Settings); menghapus `docs/dynamic-administration/*`, `docs/audit`, `docs/mockups`, `docs/prototypes`, `docs/wireframes`; memperbarui `docs/*` ke RBAC-Only. FASE 1 tidak diperlukan (tidak ada UI baru, hanya penghapusan — UI retained merujuk ke implementasi existing).
