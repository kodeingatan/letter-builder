## Acceptance Criteria (Design)

> MANDATORY — Given/When/Then untuk validasi design (FASE 1). Traceability ke User Flow Steps di `flow-requirements.md`.

### AC-D01 — Wireframe coverage semua halaman surat × breakpoint + state

Given reviewer membuka `tasks/08-letter-builder-ux-improvement-ui-design/wireframes/` + Storybook `LetterBuilder/*`

When mengecek daftar halaman (Definisi, Browse, Picker, Component, Builder 3-pane, Administrasi, Wizard, Preview)

Then setiap halaman memiliki wireframe low-fi desktop/tablet/mobile + semua states (loading/empty/error/validation/permission/conflict/draft) tanpa dead-end — konsisten User Flow Step 1–16.

### AC-D02 — Mockup token Notion + Naive UI + Tailwind

Given mockup hi-fi + Storybook stories me-render dengan `NConfigProvider` `themeOverrides`

When inspeksi visual (color, typography, radius, spacing, shadow, icon `h(NIcon)`)

Then semua komponen memakai primary `#0075de`/`#0069c4`/`#005bab`, canvas `#f6f5f4`, hairline `#e6e6e6`, Inter + tracking, radius xs4/full, Tailwind utilities inline, no hard-coded color di luar token — detail: `domain-api-ui.md` Design Tokens Check tercentang.

### AC-D03 — Prototype navigasi tanpa dead-end

Given prototype Storybook `http://localhost:6006` kelompok `LetterBuilder/`

When klik alur utama: Master Data Create → Browse → Relation Picker → Component Tiptap right-click → Builder drag → Properties live → Loop pilih semua → Preview → Administrasi → Wizard `+ Tambah Step` → Review

Then navigasi sesuai User Flow diagram Step 1→15 tanpa 404/missing handler; setiap alternate/error dapat dipicu via controls (empty, validation, 409, 401/403) → state tampil benar.

### AC-D04 — Component library relevan terdokumentasi & dipakai

Given design spec `domain-api-ui.md` tabel Library

When audit `ComponentEditor` (Tiptap toolbar bold/italic/table/link/image + placeholder), `NSteps` wizard, `NTree` library, `NDynamicInput` kolom, `NUpload` dragger, `NDatePicker` format `m-d-Y`, `NPopselect` binding

Then alasan pemilihan library tercatat (Trade-off vs Quill/Slate/MUI) dan setiap stories menampilkan component library yang benar dengan direct import Naive UI + Tailwind — bukan HTML mentah.

### AC-D05 — Playwright test flow terdesain mapping ke User Flow

Given `flow-requirements.md` User Flow 16 steps + `acceptance-tasks.md` Test Plan

When reviewer membaca tabel Test Plan

Then setiap User Flow Step (Step 1–16) + Alternate/Error (ALT-01..06, ERR-01..10) memiliki pasangan E2E case ID (E2E-01..06) yang akan diimplement di FASE 2 (`test/e2e/letter-builder.*.spec.ts`), dengan kondisi Given/When/Then eksplisit.

### AC-D06 — Responsive & kebaruan UX surat terbukti

Given Storybook viewport addon (Desktop 1280 / Tablet 768 / Mobile 375) + canvas builder

When switch viewport → toolbar wrap, builder 3-pane → drawer/tabs, wizard `NSteps` vertical→horizontal, Tiptap toolbar scroll-x + `+ Binding` bottom fixed

Then layout tidak overflow, hit target ≥44px mobile, `prefers-reduced-motion` reduce → 0.01ms, no horizontal scroll paksa — screenshot tercapture di `mockups/responsive.png`.

### AC-D07 — Accessibility & error hardening design

Given accessibility audit via Storybook a11y addon + keyboard alone (tanpa mouse)

When Tab melalui semua halaman, Esc close modal/drawer, focus trap, `aria-label` icon-only, contrast AA, live region alert

Then a11y addon 0 violation critical; semua error states (validation inline, 409 ReferenceList, 403 single `data-testid=access-denied`, 500 retry tanpa reset) terdokumentasi di `States` table dan memiliki story variant yang pass a11y.

### AC-D08 — Storybook build & handoff siap FASE 2

Given `npm run storybook` dan `npm run build-storybook` dari `apps/web/`

When menjalankan kedua command

Then `npm run storybook` tampil `:6006` dengan kategori `LetterBuilder/*` 8 stories + controls + viewport + a11y; `npm run build-storybook` sukses tanpa error (chunks LetterBuilder di `storybook-static`); handoff export + spec komponen terdokumentasi untuk `tasks/09-letter-builder-ux-improvement/`.

## Tasks (Design)

> MANDATORY — checklist design (FASE 1). Ditandai DONE hanya bila Storybook lolos.

### Discovery

- [x] Audit halaman & states existing Task06-07 (screenshot list definisi, browse `mst_*`, relation picker, Tiptap editor, builder 3-pane, wizard, preview) + inventaris error tercatat (05 ERR-04 skip Chrome, 06 409/rename, 07 version/permission) → gap list.
- [x] Mapping User Flow Step 1–16 + ALT/ERR → halaman/component/library → matriks Storybook coverage (traceability table).
- [x] Audit library relevan: bandingkan Tiptap vs Quill/Slate untuk binding; Naive UI `NSteps/NTree/NDynamicInput/NUpload` vs alternatif; `@vueuse/core` vs HTML5 drag native → keputusan tertulis di `domain-api-ui.md` Library rationale.
- [x] Tentukan Playwright test flow skeleton (happy surat lengkap + alternate/error/permission/edge) sebagai acuan `Test Plan` FASE 1 → FASE 2.

### Wireframe

- [x] Low-fi untuk semua halaman surat (Definisi List, Definisi Builder, Browse per tabel, Relation Picker, Component List+Editor, Template Builder 3-pane, Administrasi, Wizard, Preview Drawer) — desktop (≥1024) di `wireframes/`.
- [x] Low-fi untuk tablet (768–1023) & mobile (<768) — 3-pane → drawer/tabs, toolbar wrap, modal full-width (`wireframes/tablet.svg`, `mobile.svg`).
- [x] Wireframe untuk semua states (loading `NSkeleton`, empty `NEmpty+CTA`, error `NAlert+Coba lagi`, validation `NFormItem`, 403 `AccessDeniedAlert`, 409 `ReferenceList`, draft banner, invalid binding) — `wireframes/states.svg`.
- [x] Review wireframe vs `docs/design-system.md` (eyebrow, badge pill, empty-state card, modal card) + iterasi internal.

### Mockup

- [x] Hi-fi mockup dengan Naive UI 2.44 direct import + Tailwind v4 + token Notion (`naiveui-theme.ts`: `#0075de`/`#e8f2fd`/`#f6f5f4`/`#e6e6e6`, Inter) — `mockups/` + komponen Vue stub `app/components/features/letter-builder/`.
- [x] Mockup untuk semua breakpoint (grid 260|1fr|320 desktop, drawer tablet, tabs mobile) + hairline + Level-1 shadow + pill CTA.
- [x] Mockup untuk semua states (8 variants) + accessibility contrast check (AA) + `prefers-reduced-motion` variant.

### Prototype

- [x] Prototype interaktif (klik tanpa dead-end): Vue components + pages stub + Storybook stories `apps/web/stories/letter-builder/*.stories.ts` (8 stories × variants `default/loading/empty/error/validation/permissionDenied/conflict/draft/invalidBinding`) — decorator `NConfigProvider` + `themeOverrides` + `import '../app/assets/css/main.css'` + controls + viewport + a11y.
- [x] Tiptap editor story: toolbar bold/italic/list/table/link/image/undo + right-click `BindingPalette` + fallback `+ Binding` button (44px) + `is_looping` validation inline — `ClientOnly` wrapper.
- [x] Template Builder story: Library `NTree` searchable + Canvas drag-drop HTML5 + keyboard reorder Up/Down + Properties `NForm` live (`useBuilderStore`) + Repeater `pilih semua` + Preview drawer 600px tabs HTML/PDF.
- [x] Wizard story: `NSteps vertical` guided + per-step validation + `+ Tambah Step` N + Review gabungan pagebreak + Draft banner `localStorage`.
- [x] Validasi alur dengan User Flow Step 1–16 + ALT/ERR (play fn `userEvent` klik) — semua step reachable.
- [x] Review internal + iterasi (feedback UX: discoverability binding, pilih semua looping, operasi IDR).

### Handoff

- [x] Export assets & spec (wireframe SVG + mockup PNG + component spec table + library rationale + Playwright flow table) → `tasks/08-letter-builder-ux-improvement-ui-design/`.
- [x] Dokumentasi komponen & interaction (props/events/slots per `domain-api-ui.md` Components) + `Test Plan` mapping `User Flow → AC → E2E ID`.
- [x] Storybook stories terdokumentasi (`*.stories.ts` args/controls/a11y notes + play functions + viewport).
- [x] Verifikasi Storybook: `npm run storybook` (:6006) menampilkan 8 LetterBuilder stories + `npm run build-storybook` sukses (chunks di `storybook-static` tanpa error).
- [x] Tandai `Status: DONE` di `README.md` + `spec.md` handoff note sebelum FASE 2 `tasks/09-letter-builder-ux-improvement/` dimulai — hanya jika Storybook lolos + AC-D01..08 checklist tercentang.

## Test Plan (QA — Bertindak sebagai QA Engineer)

> FASE 1: Test Plan merancang Playwright flow yang akan di-*implement* di FASE 2. Setiap User Flow step + Alternate/Error + BR + Edge HARUS punya pasangan E2E design. Eksekusi E2E di FASE 1 adalah via Storybook play (manual click), bukan `test:e2e` penuh.

| ID | Jenis Test | File (rencana FASE 2) | Mengcover | User Flow Step / AC |
|----|------------|------------------------|-----------|---------------------|
| ST-01 | Storybook play — Definition | `apps/web/stories/letter-builder/MasterDataDefinition.stories.ts` play | Definisi form + DDL validation inline | Step 1-3, AC-D01/D02/D08, BR-001/002 |
| ST-02 | Storybook play — Browse & Picker | `MasterRowTable.stories.ts` + `RelationPicker.stories.ts` play | Search searchable only, sort orderable only, visibility persist, picker radio/multiple | Step 4-6, AC-D03, BR-006, ALT-03/04 |
| ST-03 | Storybook play — Component Tiptap | `ComponentEditor.stories.ts` play (right-click + fallback button) | Tiptap toolbar + binding 3 view + is_looping BR-003 | Step 8-9, AC-D04, FR-007, BR-003 |
| ST-04 | Storybook play — Template Builder | `TemplateBuilder.stories.ts` + `TemplateCanvas.stories.ts` play | 3-pane, drag-drop+keyboard reorder, Library NTree, Properties live, looping pilih semua, condition | Step 10-11, AC-D03/D06, FR-008..010 |
| ST-05 | Storybook play — Admin Wizard | `AdminWizard.stories.ts` + `DocumentPreview.stories.ts` play | NSteps guided, tambah-step N, validation per step, review gabungan pagebreak, draft banner | Step 13-15, AC-D03/D07, FR-012/013, BR-004/005 |
| ST-06 | Storybook play — States | `*stories` variant `error/validation/permissionDenied/conflict/draft` | NAlert retry tanpa reset, 409 ReferenceList, 403 single, 404 slug | ERR-01..10, ALT-01..06, AC-D07 |
| E2E-01 | E2E (design, impl FASE2) — Master Data happy | `test/e2e/letter-builder-master.spec.ts` | Create definisi Pegawai (5 kolom) → browse → create baris relation+operasi → schema | Step 1-7, UC-01..03, AC-001 FASE2, BR-001/006 |
| E2E-02 | E2E — Master protect + validate | `test/e2e/letter-builder-master-protect.spec.ts` | 400 slug duplikat/blacklist, 409 ref delete, 403 Viewer vs Admin, empty CTA | ERR-01/04/05/07, ALT-01/02, EC-06 |
| E2E-03 | E2E — Component Tiptap | `test/e2e/letter-builder-component.spec.ts` | Create Kop (right-click binding + fallback), create Daftar is_looping, preview, publish validation BR-003 | Step 8-9, UC-04, FR-007, BR-003 |
| E2E-04 | E2E — Template builder | `test/e2e/letter-builder-template.spec.ts` | Builder 3-pane drag+keyboard, embed component, requirement master/manual/system, looping pilih semua, auto-form, preview HTML, preview PDF (skip 500 bila Chrome absen), publish | Step 10-12, UC-05, FR-008..011, BR-002 |
| E2E-05 | E2E — Administrasi + Wizard gabungan | `test/e2e/letter-builder-wizard.spec.ts` | Create Administrasi 2 steps + wizard guided NSteps (data → SK → Tanda Tangan → +step N → review gabungan pagebreak → PDF → save run → snapshot version dikunci → menu per surat) | Step 13-15, UC-06/07, FR-012/013, BR-004/005, EC-02 |
| E2E-06 | E2E — Errors & permissions & edge | `test/e2e/letter-builder-errors.spec.ts` | 401/403 matrix, 404 slug, 500 PDF retry (ERR-09), div-by-zero (FR-006), rename relation EC-04, upload >5MB, mobile viewport binding fallback | ERR-01..10, ALT-05/06, EC-01..08, BR-007/008 |

- [x] Storybook plays — ST-01..06 PASS via `npm run storybook` manual click + a11y addon (viewport desktop/tablet/mobile).
- [x] E2E design — E2E-01..06 terdokumentasi Given/When/Then mapping ke User Flow + BR/EC + AC-D05 — implementasi `npm run test:e2e` di FASE 2 (HEADLESS=1 chromium, video retain-on-failure, SLOWMO 0).
- [x] Coverage target FASE 1: User Flow Steps 16/16 (100%), States 8/8 (100%), AC-D01..08 (100%) via Storybook stories.
