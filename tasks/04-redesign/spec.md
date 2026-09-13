<!-- tasks/04-redesign/spec.md — FASE 2 -->

## Objective

Menerapkan prototype approved Task 03 ke 11 halaman produksi (pixel-perfect terhadap stories `apps/web/stories/redesign/`) tanpa mengubah kontrak API, skema DB, maupun logika RBAC: integrasi `DashboardHero`, `BadgePill`, `EmptyStateCard`, pola `ModalCard`, Auth Card final, dan DataTable Notion-calm — plus tests QA (UT/NT/E2E) dan verifikasi regresi penuh.

## Context

Task 03 (FASE 1, DONE + APPROVED) menghasilkan komponen (`BadgePill`, `EmptyStateCard`, `DashboardHero`), refine in-place (`auth layout`, `PageShell`, `DataTable`, sidebar, `UserFormModal` exemplar), 8 stories, dan 6 wireframe. Namun komponen baru **belum dipakai halaman produksi** (terverifikasi: 0 pemakaian di `app/` di luar definisinya; hanya `UserFormModal` yang punya `.modal-card`; dashboard masih greeting card lama). Task ini menutup gap tersebut: wiring + rollout pola + tests. Bukan desain ulang — setiap deviasi dari FASE 1 wajib dicatat di `domain-api-ui.md` § Penyesuaian dari design.

## Scope

### In Scope

- Integrasi `DashboardHero` ke `/dashboard` (hero band + stat + recent, ganti greeting card lama).
- `BadgePill` untuk kolom role/level di tabel users + logs (`LogLevelBadge` bila sejalan, jika tidak — catat deviasi).
- `EmptyStateCard` ke slot `#empty` DataTable (CTA per entity, tanpa dead-end).
- Rollout `.modal-card` ke sisa `*FormModal` (Role, Permission, Guard) mengikuti exemplar `UserFormModal`.
- Finalisasi Auth Card (login/register sudah pill CTA; pastikan konsisten + hero panel gradient Notion).
- PageShell/DataTable/sidebar hasil refine FASE 1 — verifikasi visual per halaman, perbaiki yang terlewat.
- Tests QA: UT (komponen baru), NT (states + halaman), E2E (happy + alternate/error + permission + responsif smoke).
- Regresi: `test:unit`, `test:nuxt`, `test:e2e` (infra memungkinkan), `build`, `build-storybook` (`foundation/` + `redesign/` tetap PASS).

### Out of Scope

- Perubahan API, DTO, service, entitas, migrasi, seeder, permission matrix.
- Perubahan alur RBAC/guard logic (visual gating tetap mengikuti `canAccessUrl` existing).
- Desain ulang di luar stories approved (deviasi → catat, bukan redesign diam-diam).
- Dark mode, rebrand, ilustrasi custom baru (pakai inline SVG + Carbon existing).

## Dependencies

- `tasks/03-redesign-ui-design/README.md` — Wireframe/Mockup/Prototype (DONE + APPROVED; acuan pixel-perfect).
- `apps/web/stories/redesign/*.stories.ts` — 8 stories approved.
- `apps/web/stories/foundation/` — baseline regresi (tidak boleh rusak).
- `docs/design-system.md` — token Notion + Chrome Patterns.
- `docs/PRD.md` §17 (daftar halaman), `docs/architecture.md` § Routing.
