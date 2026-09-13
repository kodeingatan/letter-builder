<!-- split dari ../01-platform-scope-reduction.md — bagian: User Flow, Requirements -->

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

