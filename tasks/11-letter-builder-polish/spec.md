## Objective

Mengimplementasikan **FASE 2** dari `10-letter-builder-polish-ui-design` dengan fokus **routing dedicated pages untuk semua create/update dengan layout sama, hardening Tiptap `configure` crash, polish Builder, fix `DR-002` mapping UX, global UI/UX polish, toolbar office-minimum, dan Playwright video**:

1. **Dedicated pages** — migrasi semua `NModal` create/update (`components.vue:159` Editor, `templates/index.vue:149` Template Baru, `administrations.vue:163` Form Administrasi + `master-data/create.vue` inconsistensi) ke **route baru ber-layout sama via `PageShell`** (`/dashboard/components/create` & `/:id/edit`, `/dashboard/templates/create` & `/:id/edit` meta, `/dashboard/administrations/create` & `/:id/edit`, `/dashboard/master-data/:slug/edit` refine) dengan breadcrumb `<a href>` preserve right-click + footer `Batal | Simpan` pill.
2. **Fix `Cannot read properties of undefined (reading 'configure')`** pada `ComponentEditor.vue:40-69` create & delete — guard ESM `default` interop (`mod.default ?? mod`) + `if (!Ext?.configure)` fallback + `try/catch initEditor` → `NAlert error + Retry` + `onBeforeUnmount editor?.destroy()` safe + `ClientOnly` #fallback.
3. **Polish Builder `app/pages/dashboard/templates/[id].vue`** — redesign 3-pane grid `260|1fr|320` dengan token Notion (`#0075de/#f6f5f4/#e6e6e6`, Inter, radius xs4/full, hairline + Level-1 shadow), `EmptyStateCard` illustration warm `xl16`, `ComponentLibrary.vue` `NTree` searchable filter, `PropertyPanel` section eyebrow, `RepeaterEditor` pilih semua indeterminate, drag ghost + keyboard `ArrowUp/Down`.
4. **Fix `DR-002` Administrasi Mapping `missing: field`** (`server/services/administrations.service.ts:replaceSteps` + `server/dto/persuratan.dto.ts:DR-002`) — ganti textarea JSON mentah `mappingText` (`'{"letter.number":...}'`) dengan **editor per-template requirement** (`StepMappingEditor.vue` per-field `field NTag` + `kind NSelect` + `ref NInput/NSelect` + inline `validationStatus="error"` + `NAlert warning` summary + focus & scroll) agar mudah dipahami user.
5. **Global UI/UX polish** — seragamkan `PageShell` head `16×20 body 24 radius 12`, spacing xxs4-xxl32, typography Inter tracking, `NEmpty` CTA pill `#0075de` full, `NAlert` warning vs error, `prefers-reduced-motion` reduce 0.01ms, hit 44px mobile untuk semua halaman surat.
6. **Tiptap office-minimum toolbar** — implement `TiptapToolbar.vue` grouped (Text `B/I/U/S` + Heading `H1-H3` `NSelect` + Align `Left/Center/Right/Justify` + List `•/1.` + Insert `Table/Image/Link` + History `↶↷` + `+ Binding` fallback 44px + `BubbleMenu` contextual + `FloatingMenu` placeholder) merujuk `https://tiptap.dev/docs/examples` (StarterKit, Placeholder, Highlight, Color, TextAlign, Underline, Link, Image, Table) very minimum.
7. **Playwright video** — harden `apps/web/playwright.config.ts:21` dari `video: 'retain-on-failure'` ke `video: 'on'` (mode + size `1280×720`) + `trace: 'on-first-retry'` + `screenshot: 'only-on-failure'` per `https://playwright.dev/docs/videos#record-video` untuk **merekam video setiap pengujian** (`E2E-01..06` polish + existing 01-09 regression) dengan artifact `test-results/**/video.webm` + `playwright-report`.

Tidak menambah entitas/permisi baru (reuse `Master Data Read/Write` + `Component/Template/Administration/Document Read/Write` backfill 05-07). Storybook `LetterBuilderPolish/*` 10 regression harus tetap PASS.

## Context

Roadmap `05 → 06 → 07 → 08 (FASE1 UX) → 09 (FASE2 409 hardening) → 10 (FASE1 Polish dedicated pages + Tiptap + Builder + DR-002 + video)` telah DONE di 10 (design). Audit pasca-09 + laporan user 2026-09-14 mengekspos **gap implementasi** yang harus di-fix di 11 tanpa redesign:

- **Dedicated pages belum ada**: `components.vue:159 NModal` create, `templates/index.vue:149 NModal` create, `administrations.vue:163 NModal` form, `templates/[id].vue` builder campur create+edit meta, `master-data/create.vue` sudah halaman tetapi inconsistency dengan update page. User eksplisit: *untuk keseluruhan pembuatan create dan update akan di arahkan ke halaman baru dengan layout yang sama*. Design 10 telah mem-wireframe 10 dedicated routes dengan `PageShell` identik — 11 wiring ke `app/pages/dashboard/.../create.vue` + `.../[id]/edit.vue`.
- **Tiptap crash**: `ComponentEditor.vue:54-69` `StarterKit`/`TiptapLink.configure({ openOnClick:false })` + `TextAlign.configure({ types:['heading','paragraph'] })` + `TiptapTable.configure({ resizable:true })` — bila `import` default `undefined` (ESM interop), `.configure` di `undefined` → `Cannot read properties of undefined (reading 'configure')` saat create & delete. Delete path re-render tanpa `editor.destroy()` guard. Design 10 audit exact root cause (`await import` shape `mod.default ?? mod` + guard `if (!Mod?.configure)` fallback) — 11 implement `try/catch initEditor` + `NAlert error + Retry` + `ClientOnly` fallback + `onBeforeUnmount` safe.
- **Builder polish pending**: `templates/[id].vue:94 grid gap-4 lg:grid-cols-[260px_1fr_320px]` sederhana, palette `NButton` list tanpa search, canvas `border rounded p-3 min-h-[400px]` tanpa `EmptyStateCard`, properties tanpa eyebrow header. User: *fix ui /dashboard/templates/2 pada Builder : buat ui/ux lebih baik lagi, buat lebih cantik dan lebih mudah digunakan*. Design 10 polish: warm canvas `#f6f5f4` + hairline `#e6e6e6` + Level-1 shadow + `NTree` searchable + `EmptyStateCard` illustration.
- **DR-002 mapping**: `administrations.vue:178-186 NDynamicInput mappingText textarea JSON` — user tidak paham `Form Administrasi Mapping incomplete — missing: field (DR-002)`. Server `administrations.service.ts:replaceSteps` validasi `missing: field` → 400. Design 10 redesign: per-field `StepMappingEditor.vue` dengan `NSelect` kind + `NInput` ref + inline error + `NAlert` summary. User: *buat tampilan lebih baik agar mudah dipahami*.
- **Global UI/UX inconsistency** & **Tiptap minimal**: design 10 token Notion + spacing + toolbar office-min `https://tiptap.dev/docs/examples` sangat minimal — 11 wiring.
- **Playwright video**: `playwright.config.ts:21 video: 'retain-on-failure'` hanya saat fail — user: *pastikan untuk Merekam video untuk setiap pengujian dengan menggunakan playwright, sebagai referensi https://playwright.dev/docs/videos#record-video*. Design 10 spec `video: 'on'` + size `1280×720` + trace — 11 wiring + E2E `video.webm` artifact.

Posisi task: **FASE 2 UI-First**: wire design 10 ke kode nyata (`app/pages/dashboard/...` + `app/components/features/persuratan/` + `app/utils/tiptap-nodes.ts` + `playwright.config.ts`) dengan `vue-tsc` 0 + `test:unit` + `test:nuxt` + `test:e2e` video + `build` + `build-storybook` PASS.

## Scope

### In Scope

- **Backend hardening minimal (audit 05-09, no new entity)**:
  - Verifikasi `DR-002` mapping completeness tetap (`server/services/administrations.service.ts:replaceSteps` `missing: field` 400) — tidak ubah logic, hanya pastikan `createError({ statusCode:400, message, data:{ missingFields } })` ter-serialisasi JSON untuk per-field highlight (bila backend belum mengirim array missing, tambahkan `data.missingFields` tanpa ubah contract routing).
  - Verifikasi `DocumentTemplate` `schema_json` validasi `DocNodeSchema` `assertTreeLimits` depth≤10 total≤200 item/level 500 + `TiptapDocSchema` 1MB (`server/dto/persuratan.dto.ts`) tidak regresi saat Tiptap toolbar minimal menambah `Placeholder`/`Highlight` nodes — sanitize `renderer.service` allowlist.
  - Jamin `findReferences` exact-match (`"componentId":"<name>"`) tidak regresi saat dedicated pages (same service).
  - No migration baru — `synchronize: true` dev, `isMasterPhysicalTable` helper tetap, `storage/backups/` reuse.

- **Frontend wiring dedicated pages (referensi design 10)**:
  - Buat **6+ dedicated pages** baru ber-layout sama `PageShell`:
    - `app/pages/dashboard/components/create.vue` (PageShell `title: Buat Component` + `breadcrumbs: [Dashboard / Component / Buat]` + `ComponentEditor` office-min + `NForm` `name + is_looping` + footer `Batal | Simpan` pill — `POST /api/doc-components` → `navigateTo('/dashboard/components')` atau `.../:id/edit`)
    - `app/pages/dashboard/components/[id]/edit.vue` (PageShell `title: Edit: ${name} v${version}` + pre-filled `GET /api/doc-components/:id` + `PUT` + `version bump`)
    - `app/pages/dashboard/templates/create.vue` (PageShell form meta `name/code/description` — `POST /api/doc-templates` → `navigateTo(/dashboard/templates/:id)` builder)
    - `app/pages/dashboard/templates/[id]/edit.vue` (meta edit — `PUT` name/code/description, bukan builder; builder tetap `[id].vue` polish)
    - `app/pages/dashboard/administrations/create.vue` (PageShell + `StepMappingEditor.vue` per-field DR-002 — `POST /api/administrations`)
    - `app/pages/dashboard/administrations/[id]/edit.vue` (same layout + pre-filled `GET /api/administrations/:id` steps mapping + `PUT`)
    - Refine `app/pages/dashboard/master-data/create.vue` (ensure PageShell same as edit) + `app/pages/dashboard/master-data/[slug]/edit.vue` (refine to same layout, if not exists create)
    - `components.vue`, `templates/index.vue`, `administrations.vue` list: remove `NModal` create sebagai jalur utama (keep only `ReferenceList` 409 modal), CTA `+ Buat` now `navigateTo` ke dedicated create route (preserve `href` for right-click).
  - Layout same: `PageShell` props `title: string`, `breadcrumbs: {label, href?}[]`, `description?: string`, slots `actions` + `default`; card `class="bg-[#ffffff] border border-[#e6e6e6] rounded-[12px] p-6"` Level-1 shadow; `NForm` gap 12; `NAlert` summary top; sticky footer `border-t` + `NSpace justify="end"` + `NButton` secondary `Batal` (`router.back()`) + primary pill `Simpan`.

- **Tiptap hardening `ComponentEditor.vue`**:
  - Audit `app/components/features/persuratan/ComponentEditor.vue:40-69` + `app/utils/tiptap-nodes.ts` (`DocBinding`/`DocRepeater`/`DocCondition`) — fix crash:
  ```ts
  const sk = await import('@tiptap/starter-kit'); const StarterKit = (sk as any).default ?? sk
  const l = await import('@tiptap/extension-link'); const Link = (l as any).default ?? l
  // guard
  const linkExt = Link?.configure ? Link.configure({ openOnClick: false }) : Link
  ```
  - Wrap `new Editor({ extensions: [...] filter(Boolean) })` dalam `try/catch` → `editorError.value = msg` + `NAlert type="error" Gagal memuat editor (configure) + NButton Retry` → `retryInit`.
  - `onMounted initEditor` + `onBeforeUnmount if (editor && !editor.isDestroyed) editor.destroy()` guard + `ClientOnly` `#fallback` + `editorReady` flag.
  - Extract `TiptapToolbar.vue` baru (1 baris grouped `B/I/U/S` + Heading `NSelect` + Align + List + Insert + History + `+ Binding` 44px) sesuai `https://tiptap.dev/docs/examples` very minimum (StarterKit + Placeholder + Highlight/Color + TextAlign + Underline + Link/Image/Table + BubbleMenu).

- **Builder polish `app/pages/dashboard/templates/[id].vue`**:
  - Redesign 3-pane grid wrapper `grid gap-4 lg:grid-cols-[260px_1fr_320px]` + warm canvas `bg-[#f6f5f4]` soft + `DocumentCanvas.vue` polish + `ComponentLibrary.vue` `NTree` searchable filter `NInput` + `PropertyPanel` eyebrow header `text-[11px] uppercase tracking-[0.05em] text-[#94a3b8] font-semibold` + `RepeaterEditor` `Pilih semua` indeterminate + `EmptyStateCard` illustration + Level-1 shadow `rgba(0,0,0,0.04) 0 4px 18px`.

- **Administrasi DR-002 polish**:
  - Ganti `administrations.vue:178-186 textarea mappingText` dengan `StepMappingEditor.vue` per-field: per `step` → fetch `GET /api/doc-templates/:id` atau `scanRequirements(schemaJson)` → render rows `field NTag + kind NSelect (master_data/manual/system) + ref NInput/NSelect` + `validationStatus="error"` bila missing + `NAlert type="warning" Mapping incomplete — missing: letter.tanggal (DR-002)` summary list + `focus` & `scrollIntoView` first error. Submit `steps.map(s => ({template_id, step_order, mapping: buildMapping(rows)}))` — server `DR-002` pass.

- **Global UI/UX polish**:
  - Audit semua halaman surat (`master-data`, `components`, `templates`, `administrations`, `documents/[slug]` wizard, `documents/index`) → apply token Notion `#0075de` primary pill `9999px`, canvas `#f6f5f4`, hairline `#e6e6e6`, Inter tracking, radius xs4 `4px` input vs xl16 `16px` modal, spacing xxs4-xxl32, `NEmpty` + CTA pill no dead-end, `NAlert` warning vs error konsisten, `prefers-reduced-motion` reduce 0.01ms (`app/assets/css/main.css`).

- **Playwright video**:
  - Harden `apps/web/playwright.config.ts:1-32`: `use: { video: { mode: 'on', size: { width: 1280, height: 720 } }, trace: 'on-first-retry', screenshot: 'only-on-failure' }` + `headed = HEADLESS !== '1' && CI !== 'true'` + `slowMo headed 100` + `webServer npx nuxi dev --port 3000 reuseExistingServer true` per `https://playwright.dev/docs/videos#record-video` (fitur `video`, `trace`, `size`, `mode`).
  - Implement/update `test/e2e/letter-builder-polish-*.spec.ts` 6 files (E2E-01..06 polish) + `letter-builder-*.spec.ts` 6 existing tetap PASS + video artifact `test-results/**/video.webm` + `playwright-report` trace viewer.
  - Doc trace: setiap test merekam `video.webm` bahkan `HEADLESS=1` (kecuali CI `retain-on-failure` fallback disk limit documented).

- **Testing & docs**: Unit/NT/E2E mapping ke User Flow 10 Step 1-24 + ALT/ERR + BR/EC; `tasks/task-logs.md` + `tasks/README.md` update; Storybook `LetterBuilderPolish/*` + `LetterBuilder/*` regression `build-storybook` PASS.

### Out of Scope

- Menambah entitas/tabel/kolom baru di luar `orm-data-source.ts` (9 RBAC + `master_tables/columns` + `doc_components/templates/administrations/admin_steps/documents` + `mst_*` fisik). Tidak ada migration baru kecuali fix drift `mst_*` ignore minimal.
- Mengubah `permission-matrix.ts` stub kosong menjadi granular RBAC matrix baru (reuse backfill seed `LetterBuilder:*` 05-07; tidak menambah permission string baru).
- Import Word/PDF → template (`mammoth`/`pdfjs`), tanda-tangan tersertifikasi, auto-number `document_number` (tetap manual).
- Menambah dependency UI besar (MUI/Element/Ant) — tetap **Naive UI 2.44 + Tailwind v4**; Tiptap tambahan `extension-placeholder/highlight/color/text-style/character-count` sangat minimal (additive, no table overhaul).
- Mengubah API contract `snake_case` (`is_looping`/`tiptap_json`/`schema_json`) atau menambah endpoint — dedikasi halaman hanya route client, kontrak `createError` tetap.
- Mengubah `synchronize` vs `migrationsRun` vs `isMasterPhysicalTable` helper (tetap existing).

## Dependencies

- `tasks/10-letter-builder-polish-ui-design/README.md` — TODO (FASE 1 design, wireframes 18 SVG + stories 7 files `LetterBuilderPolish/*` + `TiptapToolbar` + `StepMappingEditor` — WAJIB sebagai acuan pixel-perfect; tidak redesign di 11).
- `tasks/08-letter-builder-ux-improvement-ui-design/README.md` + `tasks/09-letter-builder-ux-improvement/README.md` — DONE (baseline 409 hardening + 9 stories LetterBuilder — 11 wiring polish tanpa regresi).
- `tasks/05-document-engine/README.md` + `tasks/06-master-data-ddl/README.md` + `tasks/07-template-administration/README.md` — DONE.
- `docs/design-system.md` — token Notion `#0075de`/`#0069c4`/`#005bab`/`#f6f5f4`/`#e6e6e6`/Inter + elevation + PageShell + Table + System Logs + Chrome Patterns + Do/Don't.
- `docs/architecture.md` — RBAC (`requireApiAccess` method+URL) + Table Browse (320/160 + Restart + error slot) + PageShell (`head 16×20 body 24 radius 12`) + Sidebar 220/72 + E2E Testing (headed default, `video` etc.).
- `docs/database.md` — 9 EntitySchemas RBAC + meta `master_tables/columns` + `doc_*` + `mst_*` + `DR-002` mapping invariant.
- `AGENTS.md` — EntitySchema + plain-object service + Zod DTO + `defineEventHandler` + `useApi` + Tailwind no-preflight + `h(NIcon)`.
- `https://tiptap.dev/docs/examples` — toolbar office-min (StarterKit, Placeholder, Highlight, Color, TextAlign, Underline, Link, Image, Table, BubbleMenu, FloatingMenu).
- `https://playwright.dev/docs/videos#record-video` — video recording spec (`video: 'on' | 'retain-on-failure'`, `trace`, `contextOptions`, `size`).

