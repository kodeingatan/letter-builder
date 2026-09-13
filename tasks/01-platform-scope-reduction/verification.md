<!-- split dari ../01-platform-scope-reduction.md — bagian: Verification, Assumptions, Open Questions, Related Knowledge, Change Log -->

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
