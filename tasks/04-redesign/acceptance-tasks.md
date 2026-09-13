<!-- tasks/04-redesign/acceptance-tasks.md — FASE 2 -->

## Acceptance Criteria

### AC-001 — Dashboard hero terintegrasi

Given auth user membuka `/dashboard`

When halaman render

Then `DashboardHero` tampil (band `#213183`, headline, stat users/roles/permissions/guards, recent users); greeting card lama tidak ada; loading → skeleton parsial bila stat lambat (EC-01).

### AC-002 — BadgePill di tabel

Given auth user membuka `/dashboard/users` dan `/dashboard/activity-logs`

When tabel render

Then kolom peran/level berupa BadgePill (primer/semantic); role null → `—` tanpa crash (EC-02).

### AC-003 — ModalCard merata

Given auth user mengklik `+ Buat/Edit` di users/roles/permissions/guards

When modal terbuka (desktop + mobile)

Then semua FormModal radius xl16 + Level-2 + hairline; mobile full-width sheet (EC-03); validasi inline tak berubah.

### AC-004 — Empty state per entity

Given tabel kosong (filter tanpa hasil atau data nol)

When DataTable empty

Then `EmptyStateCard` + caption + CTA spesifik (`+ Buat User/Role/...`); klik CTA membuka modal create (no dead-end).

### AC-005 — Auth final

Given guest membuka `/login` dan `/register`

When form tampil dan submit invalid/valid

Then Auth Card xl16 + pill CTA + hero panel gradient Notion; inline error; login/register 200/201 + redirect (perilaku tak berubah).

### AC-006 — Tanpa regresi

Given suite penuh dijalankan

When `test:unit`, `test:nuxt`, `test:e2e` (bila infra siap), `build`, `build-storybook`

Then semua hijau; stories `foundation/` + `redesign/` PASS; tidak ada perubahan kontrak API/DB.

## Tasks

### Backend

- [ ] N/A — tidak ada entity/DTO/service/API baru maupun perubahan (FR-006). Verifikasi via grep: tidak ada file `server/` yang diubah kecuali bila insidental.

### Frontend

- [ ] `dashboard/index.vue` — integrasi `DashboardHero` (stat + recent), hapus greeting card lama (FR-001, AC-001, EC-01)
- [ ] `UserTable.vue` — kolom peran → `BadgePill` + fallback `—` (FR-002, AC-002, EC-02)
- [ ] Logs table — kolom level → `BadgePill` (atau pertahankan `LogLevelBadge` + catat deviasi EC-04) (FR-002, AC-002)
- [ ] `RoleFormModal`, `PermissionFormModal`, `GuardFormModal` — tambah class `.modal-card` (FR-003, AC-003, EC-03)
- [ ] List pages — slot `#empty` → `EmptyStateCard` + CTA per entity (FR-004, AC-004)
- [ ] Auth pages — verifikasi final visual + hero panel (FR-005, AC-005)
- [ ] Sweep visual 11 halaman (PageShell/DataTable/sidebar hasil FASE 1) + catat deviasi (BR-001)

### Cross-Cutting

- [ ] RBAC tak tersentuh — permission gating `canAccessUrl`/`requireApiAccess` identik (BR-002)
- [ ] Stories `foundation/` + `redesign/` tetap PASS (BR-003)
- [ ] `docs/design-system.md` — catat penyesuaian bila ada (Change Log)

### Test Plan (QA — Bertindak sebagai QA Engineer)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit — komponen baru | `test/unit/components/badge-pill.test.ts`, `empty-state-card.test.ts`, `dashboard-hero.test.ts` | Props, emit, fallback EC-02 | FR-002/FR-004, AC-002/AC-004 |
| NT-01 | Nuxt — halaman | `test/nuxt/redesign-dashboard.test.ts` | Dashboard render hero + stat | Step 4, AC-001 |
| NT-02 | Nuxt — states | `test/nuxt/redesign-states.test.ts` | Empty/modal/validation per halaman | ALT-01, AC-003/AC-004 |
| E2E-01 | E2E — Happy | `test/e2e/redesign.spec.ts` | Login → dashboard → list → modal → toast | Steps 1–11, AC-001..005 |
| E2E-02 | E2E — Alternate | `test/e2e/redesign-alt.spec.ts` | Empty, validation, 403, mobile viewport | ALT-01, ERR-01/02, EC-03 |

- [ ] Unit tests — props/emit/fallback per komponen baru
- [ ] Nuxt tests — semua state dari `## UI > States`
- [ ] E2E tests — happy + alternate/error + permission — mapping 1:1 ke User Flow + AC
- [ ] Coverage target: User Flow steps 100%, AC 100%, EC 100% (FR/BR tak ada logika baru — coverage via regresi)
