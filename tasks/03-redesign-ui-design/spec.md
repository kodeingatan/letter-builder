<!-- tasks/03-redesign-ui-design/spec.md — FASE 1 -->

## Objective

Menghasilkan wireframe low-fi, mockup hi-fi, dan prototype interaktif (Storybook) untuk **redesign menyeluruh 11 halaman** mengikuti token Notion-calm terbaru di `docs/design-system.md` (primary `#0075de`, canvas `#f6f5f4`, hairline `#e6e6e6`, radius xs4–xl16/full, eyebrow, micro-shadow) — sebagai acuan implementasi FASE 2 (`tasks/04-redesign.md`). Target: lebih baik, lebih bagus, lebih cantik tanpa mengubah kontrak API, skema DB, maupun alur RBAC.

## Context

`docs/*` baru saja diadopsi ke design language Notion (warm paper canvas, satu aksen struktural, chrome monokrom, pill CTA, pola Badge/Empty-State/Toast/Auth-Card/Modal/App-Shell-Row), dan token kode (`naiveui-theme.ts`, `main.css`) sudah diganti. Namun 11 halaman (`/login`, `/register`, `/dashboard`, `/dashboard/users|roles|permissions|guards|activity-logs|system-logs|settings|profile`) belum didesain ulang secara sistematis per halaman/state/breakpoint — implementasi parsial berisiko inkonsisten (radius, elevasi, header tabel, empty state, hero dashboard). Task ini menutup gap tersebut: design dulu (FASE 1), implementasi kemudian (FASE 2). Tidak ada perubahan API/DB/RBAC — murni lapisan presentasi.

## Scope

### In Scope

- Wireframe low-fi 11 halaman × 3 breakpoint (desktop/tablet/mobile) + semua states (loading/empty/error/success/validation/permission).
- Mockup hi-fi (Naive UI 2.44 + Tailwind v4 + token `naiveui-theme.ts` Notion: `#0075de`/`#0069c4`/`#005bab`, Inter + tracking, radius xs4/sm5/md8/lg12/xl16/full, `@vicons/carbon`).
- Prototype interaktif langsung di project: komponen Vue + halaman + Storybook stories `apps/web/stories/redesign/*.stories.ts` (`npm run storybook` :6006).
- Penerapan pola baru docs: Auth Card, Badge Pill, Empty-State Card, Toast, Modal Card, App-Shell Row, hero band deep indigo `#213183` untuk dashboard, eyebrow header tabel, sticker palette dekoratif-only.
- Token check + a11y (keyboard, ARIA, kontras AA, `prefers-reduced-motion`, addon a11y Storybook).

### Out of Scope

- Implementasi ke halaman produksi (itu FASE 2 — `tasks/04-redesign.md`).
- Perubahan API, DTO, service, entitas, migrasi, seeder.
- Perubahan alur RBAC, permission matrix, guard logic.
- Rebrand (nama/logo/favicons sudah Notion blue) dan dark mode.

## Dependencies

- `docs/design-system.md` — token Notion + Chrome Patterns + Do's and Don'ts (sumber kebenaran visual).
- `docs/PRD.md` §14, §17, §21 — prinsip + daftar halaman + UX produk.
- `docs/architecture.md` § Routing, Table Browse Component — struktur halaman + DataTable kanonis.
- `apps/web/app/utils/naiveui-theme.ts` — token live di kode.
- `apps/web/stories/foundation/` — stories existing (PageShell, DataTable, AccessDeniedAlert) sebagai baseline regresi.
- `tasks/02-fix-stale-nuxt-imports-and-render-guard/README.md` — invariant build/tests (76+36 tests PASS).
