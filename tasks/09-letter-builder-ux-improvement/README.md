# Task 09 — Letter Builder UX Improvement (Implementation: Fix DELETE 409 + Error Hardening + Wiring) — Playwright Flow + Tiptap/Naive UI

## Status

TODO

> Folder mode (opsi B). Baca berurutan:
> 1. `spec.md` — Objective, Context, Scope, Dependencies
> 2. `flow-requirements.md` — User Flow (Diagram, Steps, Alternate/Error) + Requirements
> 3. `domain-api-ui.md` — Domain + API + UI (referensi design FASE 1)
> 4. `acceptance-tasks.md` — Acceptance Criteria (Given/When/Then) + Tasks checklist + Test Plan (QA)
> 5. `verification.md` — Verification (QA) + Assumptions + Open Questions + Related + Change Log
>
> Entrypoint tooling: `tasks/09-letter-builder-ux-improvement/README.md`.
> FASE 2 — Implementation: mengacu **FASE 1** `tasks/08-letter-builder-ux-improvement-ui-design/` (Wireframe/Mockup/Prototype + Storybook `apps/web/stories/letter-builder/` 9 files). Fix utama: **`[DELETE] "/api/doc-components/:id": 409 Server Error` tampil sebagai `Server Error` generik tanpa daftar referensi** → perbaiki menjadi **409 warning + modal `ReferenceList.vue`** (bukan 500), serta audit & seragamkan semua error sejenis dari **Task 05–07** (duplicate 409, validation 400, 404 slug, 401/403, 500 PDF, div-by-zero, image allowlist, version bump, dll.) agar konsisten dengan design `08` (NAlert/NEmpty/NFormItem + retry tanpa reset + `rbac-denied` single).
> Library: Tiptap `^3.31.3` + Naive UI 2.44 (`NSteps/NTree/NDynamicInput/NUpload/NDatePicker/NModal/NAlert`) + Tailwind v4 + `@vicons/carbon` + optional `@vueuse/core`/`vue-draggable-plus` (helpers, bukan UI baru).
> Verifikasi: `npm run test:unit`, `npm run test:nuxt`, `npm run test:e2e` HEADLESS=1, `vue-tsc` 0, `npm run build` + `npm run build-storybook` PASS (regression `LetterBuilder/*` + `foundation/`).
