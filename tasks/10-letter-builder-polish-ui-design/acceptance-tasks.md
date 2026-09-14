## Acceptance Criteria (Design)

> MANDATORY — Given/When/Then untuk validasi design (FASE 1). Traceability ke User Flow Steps di `flow-requirements.md`. Setiap AC harus mapping ke Step + Requirement + State.

### AC-D01 — Dedicated Create/Update pages ber-layout sama tanpa dead-end

Given reviewer di Storybook `LetterBuilderPolish/MasterDataCreatePage` / `ComponentCreatePage` / `ComponentEditPage` / `TemplateCreatePage` / `AdministrationCreatePage` + wireframe `master-create.svg` / `component-create.svg` / `administration-create.svg`

When klik CTA `+ Buat Tabel`/`+ Buat Component`/`+ Buat Template`/`+ Buat Administrasi` → pindah ke dedicated page → breadcrumb `Dashboard / Master Data / Buat` → `Back` breadcrumb → simpan valid → redirect list → klik `Edit` → dedicated edit page layout sama (title `Edit: Pegawai v1`, pre-filled, same `PageShell` head `16×20 body 24 radius 12 hairline`, same footer `Batal | Simpan` pill)

Then semua create/update memakai **satu layout PageShell** identik (head/body/padding/radius/border), navigasi `router.push` preserve `href` (right-click new tab works), `onBeforeRouteLeave` unsaved guard `NDialog` tampil, tidak ada stale `NModal` create/update tersisa sebagai jalur utama, User Flow Step 2/8/13/19 konsisten.

### AC-D02 — Fix Tiptap `Cannot read properties of undefined (reading 'configure')` terdokumentasi & di-prototype

Given `ComponentEditor.vue:40-69` + `app/utils/tiptap-nodes.ts` + `playwright` video replay + Storybook `TiptapToolbar` + `StatesPolish/tiptapConfigureError`

When audit import list (`StarterKit`, `TiptapLink`, `TextAlign`, `TiptapTable`, `DocBinding` etc.) vs `https://tiptap.dev/docs/examples` → reviewer mensimulasikan `import` undefined → guard `if (!Ext || !Ext.configure)` → `try/catch initEditor` → klik `Retry` di `NAlert error "Gagal memuat editor"` → editor ter-init tanpa `configure` crash

Then design menampilkan: `ClientOnly` fallback `Editor dimuat di sisi klien...` 60% opacity, `NSpin Memuat editor...`, `NAlert error + Retry` bila `editorError`, `onBeforeUnmount editor?.destroy()` safe, delete path tidak memanggil `configure` lagi, toolbar tidak hilang saat binding insert, story `tiptapConfigureError` + `TiptapToolbar` pass a11y, tidak ada `Cannot read properties of undefined` di console (verified via `npm run build` + `vue-tsc` 0).

### AC-D03 — Builder `/dashboard/templates/:id` polish lebih cantik & mudah

Given Builder redesign `templates/[id].vue` polish + Storybook `TemplateBuilderPolish` + wireframes `builder-3pane.svg` + `desktop/tablet/mobile.svg`

When reviewer switch viewport Desktop 1280 → Tablet 768 → Mobile 375, drag `Kop` dari `ComponentLibrary NTree` searchable ke `DocumentCanvas` warm `#f6f5f4`, lihat `EmptyStateCard` illustration warm `xl16` padded `32` + CTA `+ Tambah Blok`, select block → `PropertyPanel` eyebrow header + `RepeaterEditor` pilih semua indeterminate, keyboard `ArrowUp/Down` reorder, preview drawer 600px tabs

Then canvas tidak overflow, 3-pane grid `260|1fr|320` desktop → `NDrawer` tablet → `NTabs` mobile; Library searchable filter works; selection ring `#0075de` + `bg-[#e8f2fd]` jelas; EmptyState no dead-end; drag ghost `opacity 0.5` + ring primary; spacing `lg24/xl28` via whitespace, pill CTA `+ Buat Component` primary `#0075de` full, not clinical white; contrast AA; `prefers-reduced-motion` reduce → 0.01ms.

### AC-D04 — Form Administrasi Mapping `DR-002` redesign jelas per-field

Given `administrations.vue:178 NDynamicInput mappingText textarea JSON` lama vs `AdministrationMapping.stories.ts` baru + wireframe `administration-create.svg` + `validation.svg`

When reviewer buka `AdministrationsCreatePage` story → pilih `Template SK` di step 1 → per-requirement rows muncul (`letter.number` `NTag` badge + `kind NSelect` + `ref NInput`) → kosongkan `letter.tanggal` → klik `Simpan` → server mock `400 missing: letter.tanggal` → `NAlert type="warning" Mapping incomplete — missing: letter.tanggal (DR-002)` + field `letter.tanggal` border merah `validationStatus="error"` + `feedback "Missing: letter.tanggal — pilih target"` + auto-scroll + focus

Then user tidak lagi melihat textarea JSON mentah membingungkan; setiap `field` dari `template.requirements` (via `GET /api/doc-templates/:id/schema` atau `scanRequirements`) visible sebagai row; missing terasosiasi ke field spesifik + summary list; tooltip "Pilih data master/manual/system" jelas; mapping editor memakai `NFormItem` + `NAlert` warning, bukan modal opaque.

### AC-D05 — Global UI/UX polish seragam mudah dipakai

Given semua halaman polish `MasterDataCreatePage`, `ComponentCreate/Edit`, `TemplateCreate`, `Builder`, `AdministrationCreate/Edit`, `Wizard` + `StatesPolish` (loading/empty/error/validation/permission/conflict) + `docs/design-system.md` + `docs/architecture.md` Table Browse kanonis

When audit visual token: primary `#0075de/#0069c4/#005bab`, canvas `#f6f5f4/#ffffff`, hairline `#e6e6e6`, Inter tracking Display −1px H3 −0.125px Eyebrow +0.125px, radius xs4 4px input / full pill CTA, spacing xxs4-xxl32, icon `h(NIcon)` Carbon, `NEmpty` + CTA pill no dead-end, `NAlert` success/warning/error seragam, `NTag` badge pill, `PageShell` head `16×20 body 24 radius 12`, sidebar 220/72 active `#e8f2fd` border `#0075de`, Tailwind inline `bg-[#f6f5f4] border-[#e6e6e6]`, hit 44px mobile

Then token 100% sesuai `app/utils/naiveui-theme.ts` via `NConfigProvider themeOverrides` decorator; tidak ada hard-coded color di luar token; semua halaman konsisten Notion-calm (warm paper + hairline + micro-shadow Level-1 `rgba(0,0,0,0.04) 0 4px 18px`); no `NDescriptions` (pakai `.detail-view`); Storybook `LetterBuilderPolish/*` + `LetterBuilder/*` (08) + `foundation/*` semua render 1:1.

### AC-D06 — Tiptap office-minimum toolbar merujuk `https://tiptap.dev/docs/examples`

Given `https://tiptap.dev/docs/examples` (examples: StarterKit, Placeholder, TextAlign, Highlight, Color, Link, Image, Table, BubbleMenu, FloatingMenu, Typography) + Storybook `TiptapToolbar.stories.ts` + `ComponentEditor` polish

When reviewer inspeksi toolbar: Group Text `B/I/U/S` + Heading `H1/H2/H3` `NSelect` + Align `Left/Center/Right/Justify` + List `• / 1.` + Insert `Table/Image/Link` + History `↶/↷` + `+ Binding` fallback 44px, `BubbleMenu` saat selection, `FloatingMenu` di empty paragraph `+ Type /`, Placeholder `Tulis konten surat...` + binding pill `{{kop.nama}}`, semua `NButton` small + `NIcon` Carbon, 1 baris grouped `gap-1 flex-wrap` + scroll-x mobile

Then toolbar lengkap layaknya office doc tetapi **very minimum** (tidak overload font-size/family picker, tidak collaboration heavy); setiap button `runAction` sesuai `ComponentEditor.vue:91-110`; referensi examples terdokumentasi di `domain-api-ui.md` Library rationale; direct import Naive UI + Tailwind, no global import.

### AC-D07 — Playwright video `https://playwright.dev/docs/videos#record-video` untuk setiap pengujian

Given `https://playwright.dev/docs/videos#record-video` + `playwright.config.ts` polish + `test/e2e/letter-builder-*.spec.ts` + `test/e2e/letter-builder-polish-*.spec.ts`

When reviewer jalankan `npm run test:e2e` (`HEADLESS=1` atau `CI=true` → headless false/true, `SLOWMO_MS` 100 headed 0 headless) + cek `playwright.config.ts` `use: { video: { mode: 'on' | 'retain-on-failure', size: { width: 1280, height: 720 } }, trace: 'on-first-retry', screenshot: 'only-on-failure', expect: { timeout: 5000 } }` + artifacts `test-results/**/video.webm` + `playwright-report/data` + `testInfo.attach` alternative

Then setiap test (happy master, component create/edit 409, template builder, administrasi mapping DR-002, wizard) merekam `video.webm` yang dapat diinspeksi via `playwright show-report` atau CI artifact, sesuai `record-video` docs; config `reuseExistingServer: true` `webServer npx nuxi dev --port 3000` timeout 120s; headed default visible + slowMo 100; video retain-on-failure untuk hemat disk vs `on` untuk penuh — documented.

### AC-D08 — Storybook build & responsive & a11y & handoff siap FASE 2

Given `npm run storybook` :6006 + `npm run build-storybook` + viewport addon (Desktop 1280/Tablet 768/Mobile 375) + a11y addon + `vue-tsc --noEmit` + `npm run build` dari `apps/web/`

When jalankan semua + switch viewport → toolbar wrap, builder 3-pane → drawer/tabs, mapping per-field 2-col → 1-col, Tiptap toolbar scroll-x + `+ Binding` bottom fixed; Tab keyboard → `+ Buat` → form field → `Simpan` → `Coba lagi` → `ReferenceList Tutup` Esc + focus trap `NModal` + `aria-label` icon-only + contrast AA + `prefers-reduced-motion` reduce; build `storybook-static` chunks `LetterBuilderPolish` ada + `vue-tsc` 0 + build `20+MB` sukses

Then `Storybook` menampilkan kategori `LetterBuilderPolish/*` 7+ stories × variants `default/loading/empty/error/validation/permissionDenied/conflict/tiptapConfigureError/draft` + controls + viewport + a11y 0 critical; `build-storybook` sukses tanpa error (chunks `LetterBuilderPolish` di `storybook-static/index.json`); `vue-tsc` 0; `build` sukses; handoff spec `tasks/10-*` siap untuk `11` tanpa redesign.

## Tasks (Design)

> MANDATORY — checklist design (FASE 1). Ditandai DONE hanya bila Storybook + build + a11y lolos.

### Discovery

- [ ] Audit halaman existing `08/09` (screenshot `components.vue` modal, `templates/[id].vue` builder minimal 94-line, `administrations.vue` textarea JSON, `master-data/create.vue` dedicated vs edit) + inventaris gap 7 poin user → gap list + keputusan dedicated pages vs modal.
- [ ] Audit crash `ComponentEditor.vue:40-69` Tiptap `configure` — repro `Cannot read properties of undefined (reading 'configure')` via `console` + `npm run build` log + ESM `default` interop check (`await import('@tiptap/starter-kit')` shape) → root cause doc.
- [ ] Audit Builder `/dashboard/templates/:id` vs wireframe `08/builder-3pane.svg` + `docs/design-system.md` EmptyStateCard/Chrome Patterns → gap polish (illustration, spacing, pill CTA).
- [ ] Audit Administrasi `DR-002` (`server/dto/persuratan.dto.ts`, `administrations.service.ts:replaceSteps`) + `400 missing: field` payload via `$fetch` error shape → mapping UX requirement per-field.
- [ ] Mapping User Flow Step 1-24 + ALT/ERR → halaman/dedicated pages/component/library → matriks Storybook coverage (traceability table) + referensi `https://tiptap.dev/docs/examples` selection (StarterKit/Placeholder/Highlight/Color/Link/Table/etc. minimal) + `https://playwright.dev/docs/videos#record-video`.
- [ ] Tentukan Playwright video strategy (`video: 'on'` vs `retain-on-failure` disk tradeoff, `trace` vs `video`, size 1280×720) sebagai acuan `Test Plan`.

### Wireframe

- [ ] Low-fi dedicated pages: `master-create.svg`, `master-edit.svg` (PageShell same layout), `component-create.svg` + `component-edit.svg` (Tiptap office-min, binding), `template-create.svg` + `template-edit.svg`, `administration-create.svg` + `administration-edit.svg` (per-field mapping rows, DR-002 highlight) — desktop ≥1024.
- [ ] Low-fi Builder polish `builder-3pane.svg` (260|1fr|320) vs tablet `tablet.svg` (drawer 260/320) vs mobile `mobile.svg` (NTabs Library/Canvas/Properties, toolbar scroll-x) — responsive.
- [ ] Low-fi Kantor Tiptap: `tiptap-toolbar.svg` (1 baris grouped + BubbleMenu + FloatingMenu + Placeholder) + `tiptap-error.svg` (NAlert error + Retry + ClientOnly fallback).
- [ ] Wireframe untuk semua states (loading `NSkeleton`, empty `NEmpty+CTA` pill, error `NAlert+Coba lagi` retry tanpa reset, validation `NFormItem` + `NAlert` summary + `DR-002` missing per-field, Tiptap configure error, 403 single `AccessDeniedAlert`, 409 `ReferenceList`, draft banner, invalid binding) — `states.svg` + `validation.svg` + `conflict.svg`.
- [ ] Review wireframe vs `docs/design-system.md` (eyebrow badge pill, empty-state card warm `#f6f5f4` xl16, modal card `16px` + Level-2 shadow, App-Shell Row active) + iterasi internal (discoverability binding right-click + pilih semua looping + IDR realtime).

### Mockup

- [ ] Hi-fi mockup dedicated pages dengan Naive UI 2.44 direct import `import { NButton, NForm, NInput } from 'naive-ui'` + Tailwind v4 `bg-[#f6f5f4] border-[#e6e6e6] text-[#0075de]` + token Notion (`naiveui-theme.ts`: `#0075de/#0069c4/#005bab`, Inter, radius xs4/full) — Vue stub `app/pages/dashboard/.../create.vue` + `edit.vue`.
- [ ] Hi-fi Builder polish: hairline `#e6e6e6` + Level-1 `rgba(0,0,0,0.04) 0 4px 18px` + pill CTA `+ Buat Component` `#0075de` full `9999px`, input `#ffffff` xs4, card lg12, canvas `#f6f5f4` soft, selection `ring-primary #0075de bg-[#e8f2fd]` — `DocumentCanvas` EmptyStateCard + `ComponentLibrary NTree`.
- [ ] Hi-fi Administrasi mapping per-field: `NTag` field badge + `NSelect` kind + `NInput` ref + `validationStatus="error"` merah `#EF4444` + `NAlert warning` summary `missing: letter.tanggal` — bukan textarea.
- [ ] Hi-fi Tiptap office-min: toolbar grouped `flex flex-wrap gap-1` + button `32px` height + active `bg-[#e8f2fd]`, `BubbleMenu` contextual, `FloatingMenu` placeholder, pill binding `rounded-full px-2 py-1 text-xs`.
- [ ] Mockup untuk semua breakpoint (grid dedicated 2-col desktop vs 1-col mobile, builder 260|1fr|320 vs drawer vs tabs) + hairline + Level1 shadow + pill CTA + illustration sticker palette.
- [ ] Mockup untuk semua states (8 variants + `tiptapConfigureError`) + accessibility contrast AA check (Ink `#000000` on `#f6f5f4` 18:1, primary 4.6:1) + `prefers-reduced-motion` variant (0.01ms).

### Prototype

- [ ] Prototype interaktif (klik tanpa dead-end): Vue components dedicated pages `app/pages/dashboard/.../create.vue` stubs + `app/components/features/letter-builder-polish/` (new `TiptapToolbar.vue`, `StepMappingEditor.vue`, `EmptyStateCard.vue` polish) + halaman `templates/[id].vue` polished + Storybook stories `apps/web/stories/letter-builder-polish/*.stories.ts` (7 stories × variants `default/loading/empty/error/validation/permissionDenied/conflict/tiptapConfigureError/draft`) — decorator `NConfigProvider` + `themeOverrides` + `import '../app/assets/css/main.css'` + controls + viewport + a11y.
- [ ] Dedicated page stories: `MasterDataCreatePage.stories.ts` (PageShell dedicated + NDynamicInput), `ComponentCreatePage.stories.ts` + `ComponentEditPage.stories.ts` (Tiptap office-min + configure guard error variant), `AdministrationMapping.stories.ts` (per-field DR-002 validation + missing highlight + summary).
- [ ] Tiptap toolbar story: `TiptapToolbar.stories.ts` (grouped B/I/U/S, H1-3 select, Align, List, Table/Image/Link, History, `+ Binding` fallback 44px hit, BubbleMenu, FloatingMenu, Placeholder) + `ClientOnly` wrapper + `configure` error simulation.
- [ ] Builder polish story: `TemplateBuilderPolish.stories.ts` (Library NTree searchable + Canvas drag-drop HTML5 ghost + keyboard reorder Up/Down + Properties live + Repeater pilih semua indeterminate + EmptyStateCard + Preview drawer 600px tabs HTML/PDF).
- [ ] States polish story: `StatesPolish.stories.ts` (validation DR-002, Tiptap error, conflict 409 ReferenceList `data-testid=conflict-references`, permissionDenied single, pdfError retry, draft banner, invalid binding) — viewport desktop/tablet/mobile + a11y addon 0 critical.
- [ ] Validasi alur dengan User Flow Step 1-24 + ALT/ERR (play fn `userEvent` klik: create → edit same layout → builder drag → mapping missing → validation → publish → wizard → video) — semua step reachable tanpa dead-end + browser back `router.push` preserved.
- [ ] Review internal + iterasi (feedback: binding discoverability right-click + fallback, mapping per-field clarity, builder beauty, toolbar minimum completeness).

### Handoff

- [ ] Export assets & spec (wireframe SVG + mockup PNG + component spec table + library rationale `tiptap.dev/examples` + Playwright video config `playwright.config.ts` diff) → `tasks/10-letter-builder-polish-ui-design/`.
- [ ] Dokumentasi komponen & interaction (props/events/slots per `domain-api-ui.md` Components: `TiptapToolbar`, `StepMappingEditor`, `EmptyStateCard`, `ComponentEditor` guard, dedicated page PageShell) + `Test Plan` mapping `User Flow → AC → E2E ID + Video`.
- [ ] Storybook stories terdokumentasi (`*.stories.ts` args/controls/a11y notes + play functions + viewport + `withProviders.ts` decorator `NConfigProvider` + `pinia` + `$fetch` mock deterministik).
- [ ] Verifikasi Storybook: `npm run storybook` (:6006) menampilkan `LetterBuilderPolish/*` 7+ stories + `LetterBuilder/*` 08 regression + `foundation/*` + `npm run build-storybook` sukses (chunks LetterBuilderPolish di `storybook-static/index.json` tanpa error, Vite 10.28s).
- [ ] Verifikasi Video: `playwright.config.ts` `video: 'on' | 'retain-on-failure'` + trace terdokumentasi + artifact path `test-results/**/video.webm` + docs `https://playwright.dev/docs/videos#record-video` di verification.
- [ ] Tandai `Status: DONE` di `README.md` sebelum FASE 2 `tasks/11-letter-builder-polish/` dimulai — hanya jika `AC-D01..08` + `vue-tsc 0` + `build` + `build-storybook` + `a11y` + `video` config lolos.

## Test Plan (QA — Bertindak sebagai QA Engineer)

> FASE 1: Test Plan merancang Playwright flow yang akan di-*implement* di FASE 2. Setiap User Flow step + Alternate/Error + BR + Edge HARUS punya pasangan E2E design + Video. Eksekusi E2E di FASE 1 adalah via Storybook play (manual click + video mock), bukan `test:e2e` penuh.

| ID | Jenis Test | File (rencana FASE 2) | Mengcover | User Flow Step / AC |
|----|------------|------------------------|-----------|---------------------|
| ST-01 | Storybook play — Master dedicated pages | `apps/web/stories/letter-builder-polish/MasterDataCreatePage.stories.ts` play | PageShell dedicated create vs edit layout same (breadcrumb, title 20px, NDynamicInput, footer pill) | Step 2-4, AC-D01, REQ-G01, BR-009 |
| ST-02 | Storybook play — Component dedicated + Tiptap guard | `ComponentCreatePage.stories.ts` + `ComponentEditPage.stories.ts` play + `TiptapToolbar.stories.ts` play | Dedicated create (`POST`) vs edit (`PUT` pre-filled) layout same + Tiptap office-min grouped toolbar + `configure` guard error → NAlert Retry + BubbleMenu/FloatingMenu + `+ Binding` 44px | Step 8-11, AC-D02/D06, FR-002/005/008, ERR-02 |
| ST-03 | Storybook play — Template Builder polish | `TemplateBuilderPolish.stories.ts` play | Library NTree searchable + Canvas drag-drop+keyboard + EmptyStateCard + Properties live + looping pilih semua + preview drawer 600px | Step 15-17, AC-D03, REQ-G03, FR-006 |
| ST-04 | Storybook play — Administration mapping DR-002 | `AdministrationMapping.stories.ts` play | Dedicated `/administrations/create` vs edit layout same + per-field mapping rows vs textarea + `missing: letter.tanggal` inline error + NAlert summary + auto-scroll | Step 19-20, AC-D04, REQ-G04, DR-002/ERR-06, BR-004 |
| ST-05 | Storybook play — States polish | `StatesPolish.stories.ts` play (variants validation/permissionDenied/conflict/tiptapConfigureError/draft/invalidBinding/404) | `NAlert` warning/success/error seragam + `NEmpty`+CTA pill + 409 `ReferenceList` `data-testid=conflict-references` + 403 single `data-testid=access-denied` + draft banner + invalid binding red ring | ERR-01..12, ALT-01..07, AC-D05 |
| ST-06 | Storybook play — Responsive Video prep | `*stories` viewport play + `preview.ts` decorator | Desktop 1280 vs Tablet 768 drawer vs Mobile 375 NTabs + toolbar scroll-x + 44px hit + `prefers-reduced-motion` 0.01ms + video artifact placeholder | Step 23-24, AC-D03/D08 |
| E2E-01 | E2E (design, impl FASE2 video: 'on') — Master dedicated | `test/e2e/letter-builder-polish-master.spec.ts` (video) | Create tabel Pegawai via `/dashboard/master-data/create` (PageShell dedicated) → verify redirect list → Edit via `/dashboard/master-data/:slug/edit` same layout → browse search/sort/visibility → create row → schema | Step 1-7, AC-D01/REQ-G01, BR-001/006, video.webm |
| E2E-02 | E2E (video) — Component Tiptap dedicated + configure guard | `test/e2e/letter-builder-polish-component.spec.ts` (video) | Create Kop via `/dashboard/components/create` dedicated + Tiptap office-min toolbar B/I/U/H2/Align/List/Table/Image → binding pill → Save POST → Edit via `/dashboard/components/:id/edit` layout same pre-filled → is_looping BR-003 → delete 409 ReferenceList; mock `StarterKit undefined` → guard not throw | Step 8-12, AC-D02/D06, FR-005, ERR-02, video.webm |
| E2E-03 | E2E (video) — Template builder polish | `test/e2e/letter-builder-polish-template.spec.ts` (video) | Create Template via `/dashboard/templates/create` dedicated → Builder polish `/dashboard/templates/:id` drag Kop/Daftar Library NTree → Canvas warm → Properties live → looping pilih semua → preview HTML/PDF → publish BR-002 → version bump | Step 13-18, AC-D03, REQ-G03, FR-006/008, video.webm |
| E2E-04 | E2E (video) — Administration mapping DR-002 polish | `test/e2e/letter-builder-polish-administration.spec.ts` (video) | Create Administrasi via `/dashboard/administrations/create` dedicated → Steps per-field mapping editor → submit incomplete → assert `missing: letter.tanggal` inline border merah + NAlert summary + scroll → fill lengkap → success → Edit via `/dashboard/administrations/:id/edit` layout same | Step 19-21, AC-D04, ERR-06/DR-002, BR-004, video.webm |
| E2E-05 | E2E (video) — Wizard + polish + PDF | `test/e2e/letter-builder-polish-wizard.spec.ts` (video) | Wizard NSteps vertical guided (Data → SK → Tanda Tangan → +Tambah Step N → Review pagebreak → PDF gabungan `POST /api/administrations/:id/runs`) → snapshot version + document_number 409 duplicate inline | Step 22, REQ-G05, BR-005, video.webm |
| E2E-06 | E2E (video) — Errors & video & access & responsive | `test/e2e/letter-builder-polish-errors.spec.ts` (video) | 401→/login, 403 single `access-denied` (retain 1 hit), 404 slug `NEmpty+Kembali`, 500 PDF `Coba lagi` tanpa reset, Tiptap configure guard, mapping DR-002, 409 ReferenceList, mobile viewport `+ Binding` 44px + video artifact assert `video.webm` exists | ERR-01..12, ALT-05..07, EC-01..10, AC-D05/D07, video.webm |

- [ ] Storybook plays — ST-01..06 PASS via `npm run storybook` manual click + a11y addon 0 critical + viewport desktop/tablet/mobile + `prefers-reduced-motion` reduce.
- [ ] E2E design — E2E-01..06 terdokumentasi Given/When/Then `video: 'on'` mapping ke User Flow + BR/EC + AC-D07 — implementasi `npm run test:e2e` HEADLESS=1 `video.webm` di `test-results/` + `playwright-report` di FASE 2 (`reuseExistingServer: true` :3000).
- [ ] Coverage target FASE 1: User Flow Steps 24/24 (100%), States 10/10 (100%), AC-D01..08 (100%), dedicated pages 10/10 layout same via Storybook.
