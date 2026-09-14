# Task 11 — Letter Builder Polish (Implementation: Routing Dedicated Pages + Tiptap Hardening + Builder & Mapping Polish + Playwright Video)

## Status

TODO

> Folder mode (opsi B). Baca berurutan:
> 1. `spec.md` — Objective, Context, Scope, Dependencies
> 2. `flow-requirements.md` — User Flow (Diagram, Steps, Alternate/Error) + Requirements
> 3. `domain-api-ui.md` — Domain + API + UI (referensi design FASE 1)
> 4. `acceptance-tasks.md` — Acceptance Criteria (Given/When/Then) + Tasks checklist + Test Plan (QA)
> 5. `verification.md` — Verification (QA) + Assumptions + Open Questions + Related + Change Log
>
> Entrypoint tooling: `tasks/11-letter-builder-polish/README.md`.
> FASE 2 — Implementation: mengacu **FASE 1** `tasks/10-letter-builder-polish-ui-design/` (Wireframe/Mockup/Prototype + Storybook `apps/web/stories/letter-builder-polish/` 7 files). Implementasi: **routing dedicated pages untuk semua create/update dengan layout sama (`PageShell`)**, **fix `Cannot read properties of undefined (reading 'configure')` di `ComponentEditor.vue` (Tiptap 3.31.3 guard)**, **polish Builder `/dashboard/templates/:id` (3-pane `260|1fr|320` Notion-calm + `EmptyStateCard` + `NTree` searchable + `PropertyPanel`)**, **fix `DR-002` Administrasi Mapping `missing: field` dengan editor per-field + `NAlert` summary + focus**, **global UI/UX polish**, **Tiptap office-minimum toolbar merujuk `https://tiptap.dev/docs/examples`**, dan **Playwright video `https://playwright.dev/docs/videos#record-video` (`video: 'on'` dengan artifacts `video.webm` per-test)**.
> Library: Tiptap `^3.31.3` hardened + Naive UI 2.44 (`NForm/NInput/NSelect/NTree/NDynamicInput/NModal/NAlert/NSteps` etc.) + Tailwind v4 + `@vicons/carbon` + optional `@vueuse/core`.
> Verifikasi: `vue-tsc` 0 + `npm run test:unit` + `npm run test:nuxt` + `npm run test:e2e` HEADLESS=1 `video.webm` + `npm run build` + `npm run build-storybook` PASS (regression `LetterBuilder/*` 08 + `LetterBuilderPolish/*` 10).
