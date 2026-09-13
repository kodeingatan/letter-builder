<!-- split dari ../02-fix-stale-nuxt-imports-and-render-guard.md — bagian: User Flow, Requirements -->

## User Flow

> MANDATORY — alur verifikasi bahwa build recovery berhasil; konsisten dengan User Flow Task 01 Step 10-11.

### Diagram

```text
[Entry: dev melaporkan build error] --> [Investigasi: baca log Vite B6005 + Nitro ENOENT]
        |
        +--(diagnosis: cache .nuxt / stale import)--> [Bersihkan cache + koreksi komentar]
        |
        +--(restart dev)--> [npm run dev 0 warning] --(success)--> [GET /api/health 200 healthy]
        |                       |
        |                       +--(error)--> [Inspect nuxt.config imports + filesystem]
        |
        +--(verifikasi)--> [npm run build 0 warning B6005 + 0 ENOENT]
        |
        +--> [RBAC regression: /dashboard, /dashboard/users|roles|permissions|guards, /dashboard/activity-logs|system-logs|settings]

[Alternate: cache tidak dibersihkan] -> [Warning B6005 tetap muncul, health 500 ENOENT]
[Alternate: komentar security-limits tidak dikoreksi] -> [Grep render-guard 0 hit kecuali Change Log gagal]
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Developer | Reproduksi error: jalankan `npm run dev` dari `apps/web/` dan amati log | Terminal | Muncul 9× `[NUXT_B6005] Could not resolve app/stores/*.ts` + berulang `Nitro ERROR Could not load .../server/utils/render-guard (imported by server/api/health/index.get.ts)` |
| 2 | Developer | Inspeksi filesystem: `ls app/stores/` | Filesystem | Hanya 6 file: `auth.ts`, `guards.ts`, `permissions.ts`, `roles.ts`, `settings.ts`, `users.ts` — 9 file terhapus tidak ada |
| 3 | Developer | Inspeksi `server/api/health/index.get.ts` | File | Tidak ada `import { activeRenderCount } from '~~/server/utils/render-guard'` (sudah dihapus Task 01); file hanya import `h3`, `node:fs/promises`, `node:path`, `~~/server/utils/db` |
| 4 | Developer | Grep `render-guard` di codebase | Grep | Hanya hit di `server/utils/security-limits.ts:10` (komentar `render preview/semaphore limits live in .../render-guard.ts`) — tidak ada import runtime |
| 5 | Developer | Inspeksi `nuxt.config.ts:9-12` dan `.nuxt/imports.d.ts:56-61` | Config + generated | `imports.dirs: ['stores']` scan folder saat ini; `imports.d.ts` hasil regenerasi terbaru hanya export 6 store (`useAuthStore`, `useGuardsStore`, `usePermissionsStore`, `useRolesStore`, `useSettingsStore`, `useUsersStore`) — tidak ada 9 store terhapus |
| 6 | Developer | Hapus cache: `rm -rf .nuxt .output node_modules/.vite` + koreksi `security-limits.ts` komentar + restart `npm run dev` | Terminal | Dev server bootstrap tanpa `NUXT_B6005`, Vite client/server built `292ms/113ms` tanpa warning |
| 7 | Developer | Verifikasi `GET /api/health` | `GET /api/health` public | `200 { status: "healthy", db: "healthy", storage: "healthy", version: "1.0.0" }` — tidak ada `renderer` field (RBAC-Only) dan tidak ada ENOENT |
| 8 | Verifier | Jalankan `npm run build` | Build | Sukses 0 error, 0 warning B6005, Nitro tidak mengeluh `render-guard`, `.nuxt/dev/index.mjs` tidak mengandung `render-guard` |
| 9 | QA | Regresi RBAC: buka `/login` → `POST /api/auth/login` → `/dashboard` → navigasi `User Management` + `Sistem` | Pages + APIs | Dashboard `Halo, {firstName}` + stats users/roles/permissions/guards render; DataTable PageShell pagination `Menampilkan {from}-{to} dari {total}` berfungsi; 403 single `data-testid=access-denied` tetap |
| 10 | Reviewer | Grep final `grep -R "administrations\|GlobalTable\|render-guard\|from.*stores/administrations" apps/web --include="*.ts" --include="*.vue"` | Grep | 0 hit di luar `server/utils/security-limits.ts` yang sudah dikoreksi dan `Change Log` Task 01 |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Cache sudah bersih tapi warning B6005 masih muncul | Step 6 → `npm run dev` tetap warning | Periksa `nuxt.config.ts` apakah ada `imports.presets` eksplisit listing 9 store; hapus preset atau set `imports.autoImport: false` untuk preset tersebut; cek `node_modules/.cache`, `tsconfig.app.json` path alias |
| ALT-02 | Health masih ENOENT setelah cache bersih | Step 7 → Nitro error double-slash `apps/web//server/utils/render-guard` | Cari `server/middleware`, `server/plugins`, atau `health` versi lama di `.nuxt/dev/index.mjs` sourcemap; `grep -R "render-guard" .nuxt --include="*.mjs"`; rebuild clean; pastikan `security-limits.ts` tidak ada dynamic import |
| ALT-03 | Build sukses tapi `GET /api/health` `degraded` | Step 7 → status `degraded` | Periksa `storage` dir `apps/web/storage` writable dan `db` query `SELECT 1`; bukan terkait `render-guard` |
| ERR-01 | `npx nuxt prepare` gagal karena `better-sqlite3` native bindings | Step 6/8 → build error `Cannot find module better-sqlite3` | `npm rebuild better-sqlite3 bcrypt` atau `npm ci` di `apps/web/` |
| ERR-02 | Setelah koreksi komentar, `grep render-guard` masih 1 hit di `security-limits.ts` | Step 10 → reviewer flag | Ubah komentar menjadi `render preview limits (removed in Task 01 — dynamic rendering deleted)` — bukan path file yang tidak ada |
| ERR-03 | `.nuxt/imports.d.ts` masih listing 9 store setelah delete `.nuxt` | Step 5 → stale global cache | Hentikan semua `nuxt dev` processes, `lsof` port 3000, `rm -rf .nuxt`, jalankan `npx nuxt prepare` ulang |
| ERR-04 | `npm run build` sukses tapi E2E `crud.spec.ts` gagal open page | Step 9 → Playwright infra | `npx playwright install --with-deps` lalu `HEADLESS=1 npm run test:e2e` — bukan blocking untuk build recovery, catat di Verification |

### Flow → UI Mapping

| Flow Step | Halaman (dari UI-design/id) | Component | State |
|-----------|------------------------------|-----------|-------|
| Step 1 | Terminal / Dev server | `Nitro` + `Vite` log | warning B6005 + error ENOENT |
| Step 9 | `/login` → `/dashboard` | `AuthForm.vue` + `PageShell.vue` + `DataTable.vue` | loading → success |
| Step 9 | `/dashboard/users`, `/roles`, `/permissions`, `/guards` | `PageShell` + `DataTable` + `*DetailDrawer` + `*FormModal` | loading, empty (`NEmpty Belum ada data` + CTA), error (`NAlert Gagal memuat data` + retry), success |
| Step 9 | `/dashboard/activity-logs`, `/system-logs`, `/settings`, `/profile` | `PageShell` + `LogDetailDrawer`/`SettingsForm` | loading → success |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi | Keterangan |
|-----------|-------------|--------------|----------|------------|
| Step 7 | GET | `/api/health` | Public — no auth | Harus 200 `healthy` tanpa `renderer` (RBAC-Only) |
| Step 9 | POST | `/api/auth/login` | `LoginSchema` | Public — verifikasi login tetap |
| Step 9 | GET | `/api/users`, `/api/roles`, `/api/permissions`, `/api/guards`, `/api/activity-logs`, `/api/system-logs/files`, `/api/settings` | JWT + `requireApiAccess` (permission method+URL) | RBAC regression |
| — | * | `/api/global-tables`, `/api/components`, `/api/templates`, `/api/administrations`, `/api/documents`, `/api/runs`, `/api/navigation`, `/api/expressions/*`, `/api/render/*`, `/api/data/*` | — | Harus 404 (Task 01 invariant) — bukan bagian fix ini, tetap terverifikasi |

## Requirements

### Tujuan Fitur

- REQ-G01: Memulihkan pipeline dev/build yang terblokir oleh artefak Dynamic Administration yang sudah dihapus di Task 01 (build 0 warning B6005, 0 ENOENT).
- REQ-G02: Menghapus referensi menyesatkan ke file yang tidak ada (`server/utils/render-guard`) sehingga `grep render-guard` 0 hit di luar Change Log yang diperbolehkan.
- REQ-G03: Menjaga RBAC-Only invariant (9 schemas/12 tables, health tanpa `renderer`, sidebar RBAC-Only) tetap PASS setelah perbaikan.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Developer | Menjalankan `npm run dev/build`, membersihkan cache, mengoreksi komentar | Filesystem `apps/web/` + code |
| Reviewer/Verifier | Menjalankan `grep`, `npm run build`, `GET /api/health`, memeriksa `.nuxt/imports.d.ts` | Read + build |
| Authenticated User (Super Admin/Admin) | Regresi RBAC-Only setelah fix | JWT + permission method+URL |
| CI | Menjalankan `npm run test:unit`, `test:nuxt`, `build-storybook` | — |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Developer | Melihat log `NUXT_B6005` 9× untuk store terhapus | Mengidentifikasi bahwa `auto-import` masih mereferensikan path yang dihapus | Step 1–2 |
| UC-02 | Developer | Membuka `server/api/health/index.get.ts` dan melihat tidak ada import `render-guard` | Mengkonfirmasi sumber ENOENT adalah cache, bukan kode saat ini | Step 3 |
| UC-03 | Developer | Grep `render-guard` hanya hit di `security-limits.ts` komentar | Mengidentifikasi dokumen/komentar menyesatkan | Step 4 |
| UC-04 | Developer | Menghapus `.nuxt/.output/node_modules/.vite` dan memperbarui komentar, restart dev | Warning hilang, Nitro tidak error | Step 6 |
| UC-05 | Verifier | `GET /api/health` mengembalikan healthy | Health probe RBAC-Only PASS | Step 7 |
| UC-06 | Verifier | `npm run build` sukses tanpa B6005/ENOENT | Build PASS | Step 8 |
| UC-07 | QA | Login dan navigasi RBAC-Only DataTable/PageShell | Tidak ada regresi | Step 9 |
| UC-08 | Reviewer | Final grep 0 hit untuk store/dynamic | Tidak ada referensi sisa | Step 10 |

### Functional Requirements

- FR-001: Setelah perbaikan, `npm run dev` dari `apps/web/` **harus** tidak menampilkan warning `[NUXT_B6005]` untuk `app/stores/administrations.ts`, `components.ts`, `documents.ts`, `global-table-columns.ts`, `globalTables.ts`, `navigation.ts`, `runs.ts`, `tableData.ts`, `templates.ts` — mengcover Step 1 & 6.
- FR-002: `server/api/health/index.get.ts` **harus** tetap tanpa import `~~/server/utils/render-guard` atau `activeRenderCount` — hanya `h3`, `node:fs/promises`, `node:path`, `~~/server/utils/db` — mengcover Step 3 & ALT-02.
- FR-003: `server/utils/security-limits.ts:1-11` **harus** tidak lagi mengklaim `render preview/semaphore limits live in server/utils/render-guard.ts` sebagai file aktif — komentar harus diperbarui menjadi `removed in Task 01 — dynamic rendering deleted` atau dihapus — mengcover Step 4 & ERR-02.
- FR-004: `apps/web/nuxt.config.ts:imports` **harus** tetap `dirs: ['stores']` tanpa `presets` yang listing 9 store terhapus — mengcover ALT-01.
- FR-005: `apps/web/.nuxt/imports.d.ts` setelah `npx nuxt prepare` ulang **harus** hanya mengekspor 6 store: `useAuthStore`, `useGuardsStore`, `usePermissionsStore`, `useRolesStore`, `useSettingsStore`, `useUsersStore` (dari `app/stores/*.ts` yang ada) — mengcover Step 5.
- FR-006: Artefak ` .nuxt/dev/index.mjs` dan `.nuxt/dist` setelah clean build **harus** tidak mengandung string `render-guard` (verifikasi via `grep -a render-guard .nuxt/dev/index.mjs`) — mengcover ALT-02.
- FR-007: `GET /api/health` **harus** merespons `200 { status, db, storage, version }` tanpa field `renderer` dan tanpa error `Could not load .../render-guard` di log Nitro — mengcover Step 7.
- FR-008: `npm run build` dari `apps/web/` **harus** sukses dengan `✔ Vite client built`, `✔ Vite server built`, tanpa error Nitro — mengcover Step 8.
- FR-009: Grep final untuk sisa dynamic **harus** 0 hit untuk pola `useAdministrationsStore|useComponentsStore|useDocumentsStore|useGlobalTablesStore|useNavigationStore|useRunsStore|useTemplatesStore|useTableDataStore|render-guard` di `apps/web/app`, `apps/web/server` (kecuali `tasks/01-*.md` Change Log dan komentar terperbaiki) — mengcover Step 10.
- FR-010: Halaman RBAC-Only (`/dashboard`, `/dashboard/users|roles|permissions|guards|activity-logs|system-logs|settings|profile`, `/login`, `/register`) **harus** tetap render dengan `PageShell` + `DataTable` kanonis dan tidak ada `import` error ke modul terhapus — mengcover Step 9 & Task 01 FR-013/FR-014.

### Business Rules

- BR-001: Cleanup artefak **tidak** mengubah kontrak API RBAC — response `{data,total,page,limit,totalPages}` + query `page/limit/search/searchField/sortBy/sortOrder` tetap.
- BR-002: `render-guard.ts` tetap **terhapus** (Task 01) — tidak boleh dibuat ulang; limit rendering dianggap tidak relevan untuk RBAC-Only.
- BR-003: Komentar yang menyebut file terhapus harus memakai penanda `removed in Task 01` agar `grep` reviewer dapat membedakan Change Log yang diperbolehkan vs referensi aktif menyesatkan.
- BR-004: Perbaikan build harus idempoten via `rm -rf .nuxt .output` — tidak memerlukan `synchronize: false` prod flag atau migrasi baru.
- BR-005: `.nuxt` adalah generated — tidak di-version-control; perbaikan tidak menambah file di repo kecuali koreksi `security-limits.ts` dan docs jika perlu.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Developer lupa hentikan `nuxt dev` sebelum `rm -rf .nuxt` | File lock di Windows (`EPERM`); hentikan proses (`Ctrl+C`, task manager `node.exe`), lalu hapus | Step 6 |
| EC-02 | `better-sqlite3` native binding rusak setelah `rm -rf node_modules/.vite` | Jalankan `npm rebuild better-sqlite3` atau `npm ci` | ERR-01 |
| EC-03 | Warning B6005 hilang tapi `GET /api/health` tetap `degraded` karena `storage` tidak writable | Pastikan `apps/web/storage` ada dan writable (`access(..., W_OK)`) — bukan terkait `render-guard` | ALT-03 |
| EC-04 | `grep render-guard` masih 1 hit setelah edit karena cache `.nuxt` | Hapus `.nuxt` dan `node_modules/.vite` lagi, rerun `grep -R --exclude-dir=.nuxt` untuk membedakan cache vs source | Step 4, ALT-02 |
| EC-05 | `imports.d.ts` masih listing 9 store karena multiple `nuxt dev` instances | Kill semua `node` processes, `npx nuxt prepare --force` | ERR-03 |
| EC-06 | `npm run build` sukses tapi `npx playwright install` belum | E2E tidak blocking build recovery — catat skipped di Verification | ERR-04 |
| EC-07 | `security-limits.ts` komentar dikoreksi tapi test `EXPRESSION_RATE_LIMIT` gagal | Tidak terkait — `checkExpressionRateLimit` tetap 60/min; jangan ubah konstanta | FR-003 |
| EC-08 | Double-slash `apps/web//server` di log Nitro | Tidak fatal — cek `~~/` alias `..` di `nuxt.config` path resolution sudah benar; pastikan tidak ada `import '~~/server/utils/render-guard'` absolut yang tersisa | ALT-02 |

