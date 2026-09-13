<!-- split dari ../02-fix-stale-nuxt-imports-and-render-guard.md — bagian: Verification, Assumptions, Open Questions, Related Knowledge, Change Log -->

## Verification (QA — Bertindak sebagai QA Engineer)

### Automated (wajib lolos sebelum DONE)

- [ ] Typecheck (`vue-tsc` / `nuxt typecheck`) — 0 error
- [ ] Unit tests (`npm run test:unit`) — semua UT-01/UT-02 PASS, coverage ≥80% logic baru
- [ ] Nuxt tests (`npm run test:nuxt`) — semua NT-01/NT-02 PASS, tidak ada import error store terhapus
- [ ] API/Integration tests — `GET /api/health` 200 healthy, RBAC endpoints 200/401/403 matrix PASS
- [ ] E2E tests (`npm run test:e2e`) — semua E2E-01..04 PASS (atau build-recovery manual log jika E2E infra belum `playwright install`)
- [ ] Storybook build (`npm run build-storybook`) — sukses tanpa error (foundation stories saja)
- [ ] Build (`npm run build` dari `apps/web/`) — sukses, log tanpa `NUXT_B6005` dan `Could not load .../render-guard` — attach log di PR

### Manual / QA Checklist (mapping ke User Flow & AC)

- [ ] Filesystem verification — `ls app/stores/` 6 file, `ls server/utils/` tanpa `render-guard.ts` (INV-01)
- [ ] Grep verification — `grep -R "render-guard" apps/web --exclude-dir=.nuxt --exclude-dir=node_modules` 0 hit atau hanya `removed in Task 01` (AC-004, AC-007)
- [ ] Imports verification — `.nuxt/imports.d.ts` 6 store, `grep -a render-guard .nuxt/dev/index.mjs` 0 hit (AC-005, FR-006)
- [ ] Health verification — `curl http://localhost:3000/api/health` 200 healthy tanpa renderer (AC-003)
- [ ] Log verification — `npm run dev` start log tanpa 9× B6005 dan tanpa 7× Nitro ENOENT (AC-001, AC-002)
- [ ] Build verification — `npm run build` 0 warning B6005, 0 ENOENT (AC-006)
- [ ] Sidebar verification — hanya `Dashboard`, `User Management (4)`, `Sistem (3)` + Profile (FR-010)
- [ ] State verification — loading/empty (`Belum ada data` + CTA)/error (`Gagal memuat data` + retry)/success/permission (`Akses Ditolak` `data-testid=access-denied`) — sesuai `docs/design-system.md`
- [ ] Responsive verification — desktop/tablet/mobile PageShell + DataTable tidak regresi
- [ ] Negative API verification — `GET /api/global-tables` 404 (AC-009) — tetap Task 01 invariant
- [ ] User Flow verification — setiap `User Flow > Steps` ada AC dan ada E2E PASS (traceability Step ↔ AC ↔ Test ID)
- [ ] Acceptance verification — setiap AC Given/When/Then PASS

## Assumptions

- Build error disebabkan cache `.nuxt`/`node_modules/.vite` stale setelah penghapusan 9 store + `render-guard.ts` di Task 01, bukan oleh kode saat ini yang sudah bersih (dibuktikan `health/index.get.ts` tidak import `render-guard` dan `imports.d.ts` terbaru hanya 6 store).
- `nuxt.config.ts` saat ini tidak memiliki `imports.presets` eksplisit listing 9 store — warning B6005 berasal dari `.nuxt` generasi lama sebelum Task 01. Jika ditemukan preset eksplisit, akan dihapus di implementasi.
- Double slash `apps/web//server/utils/render-guard` di log Nitro adalah artefak path `~~/` alias `..` + `server/utils` — bukan bug alias baru, hanya menunjuk file yang memang tidak ada.
- `better-sqlite3`/`bcrypt` native bindings tidak rusak; jika rusak, `npm rebuild` sudah cukup.
- Tidak ada migrasi DB baru untuk fix ini — `db.sqlite` 12 tabel Task 01 tetap.

## Open Questions

- Apakah `security-limits.ts:10` perlu dipertahankan sebagai rujukan historis (`removed in Task 01`) atau dihapus total? Rekomendasi: pertahankan dengan tag `removed` agar reviewer trace, hapus path aktif.
- Apakah perlu menambahkan `imports.presets` eksplisit allowlist untuk 6 store guna mencegah B6005 di masa depan, atau tetap mengandalkan `imports.dirs: ['stores']` scan? Rekomendasi: tetap scan — cukup pastikan `.nuxt` dibersihkan.
- Apakah `nul` file di root perlu di-`.gitignore`? Rekomendasi: hapus file dan hindari `2>nul` (gunakan `2>nul:` atau `2>$null` di PowerShell) di dokumentasi.

## Related Knowledge

- `docs/PRD.md` — RBAC-Only (login, register, dashboard, user management, sistem)
- `docs/architecture.md` — RBAC layer stack, module boundaries, startup checks, `server/utils/*` catalog
- `docs/database.md` — 9 EntitySchemas / 12 tabel fisik (RBAC-Only)
- `docs/design-system.md` — PageShell, DataTable kanonis 320/160, AccessDeniedAlert single, token `#3B82F6`
- `tasks/01-platform-scope-reduction/README.md` — Scope reduction RBAC-Only (prasyarat — menghapus 9 store + render-guard + docs dynamic)
- `AGENTS.md` — Working directory `apps/web/`, tech stack Nuxt 4 + TypeORM EntitySchema + better-sqlite3

## Change Log

### Initial

- Task specification created (FASE 2 — Implementation, no UI new, build recovery for stale Nuxt imports + missing render-guard). Depends on Task 01.

### Implemented — 2026-09-12 via /implement

- Fixed `apps/web/server/utils/security-limits.ts:1-11` — removed `live in server/utils/render-guard.ts` + `TableDataService.importCsv` → `removed in Task 01 (dynamic rendering deleted; no semaphore file)` + `MAX_CSV_IMPORT_ROWS` + `checkExpressionRateLimit 60/min`. Verified `server/api/health/index.get.ts:1-36` no `render-guard`/`renderer`, `nuxt.config.ts:9-12` `dirs:['stores']`, `app/stores/` 6 files, `orm-data-source.ts:26-36` 9 schemas.
- Purged `.nuxt/.output/node_modules/.vite` + `npx nuxt prepare` — `imports.d.ts:56-61` now 6 stores, `dev/index.mjs` 0 `render-guard`. Deleted `letter-builder/nul` + added `nul` to `.gitignore`.
- Created tests: `test/unit/server/api/health.test.ts` (UT-02), `test/nuxt/imports.test.ts` (NT-01), `test/e2e/health.spec.ts` (E2E-01), `test/e2e/build-recovery.spec.ts` (E2E-02), `test/e2e/negative-dynamic.spec.ts` (E2E-04). Updated `test/unit` 82 passed, `test/nuxt` 36 passed, `npm run build` 0 B6005/0 ENOENT (build.log 382 lines, 17.5MB), preview `GET /api/health` 200 healthy without renderer, `ls server/api` 10 dirs, `server/utils` no `render-guard.ts`.
- Status: DONE — ready for /verify.
