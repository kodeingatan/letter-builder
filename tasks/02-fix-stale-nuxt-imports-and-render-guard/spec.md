<!-- split dari ../02-fix-stale-nuxt-imports-and-render-guard.md — bagian: Objective, Context, Scope, Dependencies -->

## Objective

Memulihkan build/dev yang rusak pasca Task 01 (RBAC-Only cleanup) dengan menghilangkan warning `[NUXT_B6005]` untuk 9 store terhapus (`administrations`, `components`, `documents`, `global-table-columns`, `globalTables`, `navigation`, `runs`, `tableData`, `templates`) dan error Nitro `Could not load .../server/utils/render-guard (imported by server/api/health/index.get.ts)` sehingga `npm run dev` dan `npm run build` kembali 0 error/warning dan `GET /api/health` merespons `healthy`.

## Context

Task 01 menghapus Dynamic Administration (Global Table → Component → Template → Administration → Document) secara vertikal: 14 EntitySchemas, `server/api/*` dynamic, `app/stores/*` dynamic (9 file), `server/utils/render-guard.ts`, dan docs dynamic. Cleanup kode berhasil (commit `3173d23`, `npm run build` 0 error, 9 schemas/12 tables, `health` diperbarui menghapus `renderer` dan import `render-guard`), tetapi lingkungan dev reporter masih menjalankan build dengan cache lama:

- Vite menampilkan `✔ Vite client/server built` namun 9 warning `NUXT_B6005 Could not resolve app/stores/*.ts used by auto-import use*Store` — mengindikasikan `imports.presets`/`imports.dirs` atau cache `.nuxt/imports.d.ts` masih mereferensikan path yang sudah dihapus.
- Nitro berulang `ERROR Could not load ...//server/utils/render-guard (imported by server/api/health/index.get.ts): ENOENT` — padahal `apps/web/server/api/health/index.get.ts:1-6` saat ini **tidak** mengimpor `render-guard` (sudah dihapus di Task 01). Double slash `apps/web//server` mengindikasikan artefak build lama (`.nuxt/dev/index.mjs`, Vite cache) atau referensi komentar yang menyesatkan di `server/utils/security-limits.ts:10`.

Task ini adalah perbaikan infra/build tanpa UI baru. Tidak memerlukan FASE 1 wireframe/mockup/prototype terpisah — `UI: N/A` dengan verifikasi build + health + DataTable/PageShell RBAC-Only tetap lolos. Merujuk design token dan pola yang dipertahankan di `docs/design-system.md` dan `tasks/01-platform-scope-reduction/README.md`.

## Scope

### In Scope

- Diagnosis & eliminasi sumber `[NUXT_B6005]` untuk 9 store terhapus (`app/stores/administrations.ts`, `components.ts`, `documents.ts`, `global-table-columns.ts`, `globalTables.ts`, `navigation.ts`, `runs.ts`, `tableData.ts`, `templates.ts`) — auto-import `useAdministrationsStore` dkk.
- Penghapusan sisa referensi runtime/build ke `server/utils/render-guard` — verifikasi `server/api/health/index.get.ts` tidak mengimpor file tersebut, dan `server/utils/security-limits.ts:10` dikoreksi (komentar menyebut `render-guard.ts` yang sudah dihapus).
- Pembersihan artefak cache: `.nuxt/`, `.output/`, `.nuxt/dev/index.mjs`, `node_modules/.vite`, dan regenerasi `imports.d.ts`/`tsconfig.app.json` agar konsisten dengan `app/stores/` saat ini (hanya `auth.ts`, `guards.ts`, `permissions.ts`, `roles.ts`, `settings.ts`, `users.ts`).
- Verifikasi `nuxt.config.ts:imports.dirs` (`['stores']`) dan `components.dirs` tidak mereferensikan path terhapus; tidak ada `imports.presets` eksplisit yang listing store dynamic.
- Verifikasi `npm run dev`, `npm run build`, `npm run preview`, dan `GET /api/health` kembali `healthy` tanpa warning B6005 atau ENOENT.
- Regresi RBAC-Only: `PageShell` + `DataTable` kanonis (320/160 + `Restart` + `NAlert`) + `AccessDeniedAlert` + sidebar RBAC tetap PASS.

### Out of Scope

- Penambahan fitur Dynamic Administration baru atau pengembalian modul yang dihapus Task 01.
- Redesign visual / perubahan token `app/utils/naiveui-theme.ts` (`#3B82F6`, Inter, radius 6/4/8).
- Perubahan kontrak API RBAC (`/api/users`, `/api/roles`, `/api/permissions`, `/api/guards`, `/api/activity-logs`, `/api/system-logs`, `/api/settings`, `/api/storage/*`, `/api/health`) selain koreksi komentar/dokumentasi.
- Migrasi data atau perubahan schema DB (tetap 9 EntitySchemas / 12 tabel fisik).

## Dependencies

- `tasks/01-platform-scope-reduction/README.md` — Platform Scope Reduction RBAC-Only (DONE) — sumber penghapusan 9 store + `render-guard.ts` + pembaruan `health`.
- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md` — RBAC-Only setelah Task 01 (tidak menyebut Dynamic Administration di luar Change Log).
- `server/utils/orm-data-source.ts` — canonical 9 EntitySchemas.
- `apps/web/nuxt.config.ts` — `imports.dirs`, `components.dirs`, `nitro.externals.inline: ['better-sqlite3']`.
- `apps/web/server/api/health/index.get.ts` — versi Task 01 tanpa `activeRenderCount`.
- `apps/web/server/utils/security-limits.ts:1-11` — komentar yang masih menyebut `render-guard.ts`.

