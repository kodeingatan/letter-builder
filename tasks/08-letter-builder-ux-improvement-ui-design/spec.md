## Objective

Menghasilkan **wireframe low-fi, mockup hi-fi, dan prototype interaktif (Storybook)** untuk **Letter Builder UX Improvement** — penyempurnaan menyeluruh alur pembuatan surat yang saat ini tersebar di Task 05 (Document Engine JSON Tree + Renderer + PDF), Task 06 (Master Data DDL `mst_*` + 13 tipe kolom + relation picker + operasi-teks), dan Task 07 (Component Tiptap + Template Builder 3-pane + Administrasi Wizard + PDF gabungan) — agar **lebih mudah dipakai user awam**, **bebas error state dead-end**, dan **menggunakan library component yang relevan** (Tiptap v2 + Naive UI 2.44 + Tailwind v4 + helpers). Deliverables menjadi acuan **FASE 2** (`tasks/09-letter-builder-ux-improvement/`) untuk: (a) memperbaiki seluruh error yang tercatat di verification 05-07, (b) mengimplementasikan Playwright test flow E2E untuk Task 05-06-07, (c) wiring ulang UX surat dengan komponen yang tepat.

## Context

Roadmap `05 → 06 → 07` telah DONE (2026-09-13, review APPROVED) tetapi memiliki **gap UX & test** yang diminta user pada prompt ini:

- **Test flow belum lengkap**: Task 05 E2E-01 5 pass + 1 skip (Chrome belum install), Task 06 E2E 10/10 pass namun coverage 05-06 belum menyatukan surat end-to-end (Master Data → Component → Template → Administrasi → Wizard → PDF). Belum ada Playwright flow yang mengcover **happy path surat lengkap + alternate/error + permission + edge**.
- **Errors tercatat (verification 05-07)**: Puppeteer skip-download → 500 `Failed to generate PDF` (ERR-04), DDL rename = drop+add tanpa migrasi data, image allowlist `javascript:` belum konsisten, count inflate tanpa join (fixed di review), slug refetch reuse, version bump saat edit PUBLISHED, snake_case vs camelCase leak, `permission-matrix.ts` stub kosong (seed backfill), `mst_*` drift-ignore via helper bukan core, upload 5MB image kolom reuse `general`, Tiptap SSR ClientOnly, dll. — perlu **design error state yang mencegah user masuk lubang**.
- **UX sulit dipakai**: Builder 3-pane (Library | Canvas | Properties) + right-click binding `nama data + view text/image/component` belum discoverable; looping picker `pilih tabel + kolom + pilih semua` tersembunyi; auto-form dari requirement tidak preview live; wizard tambah-step N tidak guided (`NSteps` belum dipakai); relation picker modal (search+sort+checkbox 1/N) belum punya bulk; 13 tipe kolom (terutama `hidden_operation_text` vs `readonly_operation_text` + `number+IDR realtime`) membingungkan; empty/error/validation/403 states belum konsisten di semua halaman surat.
- **Library belum optimal**: Task 07 sudah mengunci **Tiptap v2** (`@tiptap/vue-3`, `starter-kit`, `table`, `table-row/header/cell`, `image`, `link`, `text-align`, `underline`) + Naive UI, namun belum memakai komponen **Naive UI yang relevan untuk surat**: `NSteps` (wizard), `NTree` (library component), `NDynamicInput` (Master Data column builder), `NUpload` dragger (image), `NDatePicker/NTimePicker`, `NScrollbar`, `NTabs`, `NPopselect` untuk binding, `NCode` untuk preview, `vue-draggable-plus`/`@vueuse/core` helper untuk drag-drop canvas (jika perlu) — semuanya perlu di-design token-compliant.

Posisi task ini: **FASE 1 UI-First pertama untuk hardening Letter Builder** (05-07 sudah inline UI tanpa folder `-ui-design` terpisah atas permintaan 3 folder; kini kembali ke prinsip UI-First murni). Tidak mengubah kontrak API/DB secara breaking — hanya merapikan presentasi + menyiapkan spec untuk FASE 2.

## Scope

### In Scope

- **Wireframe low-fi** untuk semua halaman & states surat (desktop/tablet/mobile): Definisi Master Data, Browse `mst_*`, Relation Picker, Component Tiptap Editor, Template Builder 3-pane, Administrasi Steps, Wizard Hasil per surat, Preview Drawer, PDF viewer — termasuk states `loading/empty/error/success/validation/permission/409/conflict`.
- **Mockup hi-fi** (Naive UI 2.44 direct import + Tailwind v4 utility + token `app/utils/naiveui-theme.ts` Notion: primary `#0075de`/`#0069c4`/`#005bab`, canvas `#f6f5f4`, hairline `#e6e6e6`, Inter + tracking, radius xs4/sm5/md8/lg12/xl16/full, `@vicons/carbon` via `h(NIcon)`).
- **Prototype interaktif langsung di project**: komponen Vue `app/components/features/letter-builder/` + halaman `app/pages/dashboard/...` stub + **Storybook stories** `apps/web/stories/letter-builder/*.stories.ts` (`npm run storybook` :6006 & `npm run build-storybook`).
- **Component library selection & design**: audit library relevan untuk pembuatan surat → Tiptap v2 + Naive UI `NSteps/NTree/NDynamicInput/NUpload/NDatePicker/NPopselect/NScrollbar/NTabs` + Tailwind + `@vueuse/core` (useDraggable/useDropZone) — dokumentasi alasan, trade-off, dan usage pattern per halaman (tanpa install di FASE 1, spec saja; install di FASE 2).
- **Playwright test flow design**: rancangan E2E flow (happy + alternate/error + permission + edge) untuk Task 05-06-07 yang akan diimplement di FASE 2 (`test/e2e/letter-builder.*.spec.ts`), termasuk mapping `User Flow Step → E2E case → AC`.
- **Error hardening design**: desain penanganan semua error tercatat (05 ERR-01..04, 06 ERR-01..04, 07 ERR-01..04) + edge cases (div-by-zero, rename relation, 500 PDF, 409 ref, 401/403) dengan `NAlert`/`NEmpty`/`NFormItem` feedback + retry + `rbac-denied` single.
- **UX improvement**: guided wizard (`NSteps` vertical), binding discovery (right-click → `BindingPalette` + toolbar button fallback), looping picker dengan `pilih semua` yang jelas, auto-form live preview, drag-drop canvas HTML5 + keyboard reorder, IDR realtime, operasi-teks preview identik server.
- **Design tokens check, responsive, a11y** (keyboard, ARIA, contrast AA, `prefers-reduced-motion`, addon a11y Storybook).

### Out of Scope

- Implementasi ke API/DB/service/DTO/migration/entitas (itu FASE 2 `tasks/09-letter-builder-ux-improvement/`).
- Install & wiring runtime Puppeteer Chrome, `vue-draggable-plus`, atau deps baru (hanya spec + Storybook mock; install di FASE 2).
- Perubahan breaking pada `permission-matrix.ts` / seeder guard/permission (reuse backfill pattern Task 05-07).
- Import Word/PDF ke template, tanda-tangan digital tersertifikasi, auto-numbering kompleks, approval workflow multi-role (tetap Out of Scope roadmap 05-07).
- Migrasi data `mst_*` legacy atau perubahan `synchronize` vs `migrationsRun` (tetap `isMasterPhysicalTable` helper).
