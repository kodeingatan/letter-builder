<!-- tasks/03-redesign-ui-design/acceptance-tasks.md — FASE 1 -->

## Acceptance Criteria (Design)

> MANDATORY — Given/When/Then untuk validasi design/prototype.

### AC-D01 — Navigasi prototype tanpa dead-end

Given reviewer membuka Storybook `:6006` (`stories/redesign/`)

When mengklik alur utama (login → dashboard → list → modal → toast)

Then semua langkah sesuai User Flow Step 1–11 tanpa dead-end; setiap empty state punya CTA.

### AC-D02 — Token Notion konsisten

Given semua stories + mockup

When diperiksa melawan Design Tokens Check

Then primary `#0075de` hanya untuk CTA/link/fokus; canvas `#f6f5f4`; radius & tracking sesuai; sticker palette tidak dipakai struktural.

### AC-D03 — Semua halaman/state ter-cover

Given 11 halaman

When dicocokkan ke tabel Halaman + States

Then tiap halaman punya wireframe 3 breakpoint + stories untuk loading/empty/error/success/validation/permission (yang relevan).

### AC-D04 — Responsif + a11y

Given viewport desktop/tablet/mobile + keyboard-only + reduced-motion

When navigasi penuh via keyboard dan resize

Then tidak ada overflow rusak, fokus terlihat, motion 0.01ms saat reduced, kontras AA terpenuhi (ink/canvas ~18:1, primary/putih ~4.6:1), addon a11y Storybook terpasang; audit terotomasi penuh dijadwalkan FASE 2.

### AC-D05 — Konsisten docs

Given `docs/design-system.md` (Chrome Patterns, Do's/Don'ts), `docs/PRD.md` §14/§17/§21, `docs/architecture.md` § Routing/Table Browse

When design direview terhadap ketiganya

Then tidak ada pola yang bertentangan; deviasi (jika ada) tercatat di Open Questions + `Penyesuaian dari design` (untuk FASE 2).

## Tasks (Design)

> MANDATORY — checklist design.

### Discovery

- [x] Audit 11 halaman & states existing vs token Notion (gap: radius, elevasi, header tabel, empty state, hero)
- [x] Mapping User Flow (Step 1–11) → halaman → stories

### Wireframe

- [x] Low-fi 11 halaman desktop (`tasks/03-redesign-ui-design/wireframes/`)
- [x] Low-fi tablet & mobile
- [x] Wireframe semua states (loading/empty/error/success/validation/permission)

### Mockup

- [x] Hi-fi Naive UI + Tailwind + token Notion (`tasks/03-redesign-ui-design/mockups/`)
- [x] Mockup semua breakpoint + semua states
- [x] Dashboard hero band `#213183` + stat cards + sticker dekoratif (satu momen gelap)

### Prototype

- [x] Komponen Vue nyata: `AuthCard` refine, `DashboardHero`, `BadgePill`, `EmptyStateCard`, `Toast`, `ModalCard`, `AppShellRow`, `DataTable` refine
- [x] Stories `apps/web/stories/redesign/*.stories.ts` (klik, navigasi, validasi, transisi)
- [x] Validasi alur dengan User Flow + review internal + iterasi

### Handoff

- [x] Export assets & spec (wireframes/ + mockups/ di folder task)
- [x] Dokumentasi komponen & interaction (per stories args/controls/a11y)
- [x] Verifikasi Storybook: `npm run storybook` (:6006) & `npm run build-storybook` sukses; `foundation/` tidak regresi
- [x] Tandai `Status: DONE` sebelum FASE 2 (`tasks/04-redesign.md`) dimulai — hanya jika Storybook lolos
