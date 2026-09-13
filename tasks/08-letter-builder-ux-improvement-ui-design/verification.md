## Verification (Design)

- [x] **Design System verification** (token `naiveui-theme.ts` Notion `#0075de`/`#0069c4`/`#005bab`/`#f6f5f4`/`#e6e6e6`/Inter/radius xs4/full, Naive UI direct import `import { NButton, NDataTable } from 'naive-ui'` + Tailwind utilities inline, no `NDescriptions` — pakai `.detail-view` + `NForm` di preview, icon `h(NIcon)` Carbon) — cek visual vs `docs/design-system.md` Chrome Patterns + Do's and Don'ts.
- [x] **Responsive verification** (desktop ≥1024 table penuh + 3-pane grid 260|1fr|320, tablet 768–1023 drawer 260/320 + `NSteps` horizontal, mobile <768 tabs Library/Canvas/Properties + toolbar column + modal full-width) — wireframe `wireframes/desktop.svg + tablet.svg + mobile.svg` + Storybook viewport addon (1280/768/375) screenshot.
- [x] **Accessibility verification** (keyboard Tab → focus trap modal/drawer + `Esc` close + `NSteps` `aria-current="step"` + draggable `aria-grabbed` + contrast AA ink/canvas 18:1 + `prefers-reduced-motion 0.01ms` + icon `aria-label="Segarkan data"` + live region toast) — Storybook addon a11y 0 critical + manual keyboard walk 16 steps tanpa mouse.
- [x] **User Flow coverage** (semua Step 1–16 + ALT-01..06 + ERR-01..10 + BR-001..008 + EC-01..08 ada di Storybook prototype — klik tanpa dead-end, play functions `userEvent` reach tiap state).
- [x] **Storybook verification** — `npm run storybook` (:6006) tampil kelompok `LetterBuilder/MasterDataDefinition`, `MasterRowTable`, `RelationPicker`, `ComponentEditor`, `TemplateBuilder`, `TemplateCanvas`, `AdminWizard`, `DocumentPreview` × variants (default/loading/empty/error/validation/permissionDenied/conflict/draft/invalidBinding) + `npm run build-storybook` sukses (chunks `storybook-static` tanpa error, 8 stories di `index.json`).
- [x] **Stakeholder / peer review** via Storybook URL `http://localhost:6006` (capture feedback: discoverability binding right-click + fallback button, looping pilih semua, IDR realtime, wizard guided).

### Manual / QA Checklist (mapping ke User Flow & AC)

- [x] **Token & library audit** — Tiptap toolbar (bold/italic/underline/align/list/table/link/image/undo) + `NTree` searchable + `NSteps` vertical guided + `NDynamicInput` kolom + `NUpload` dragger + `NDatePicker` `m-d-Y` — semua direct import, no extra UI lib selain `@vueuse/core` helper (design rationale tercatat).
- [x] **Wireframe completeness** — low-fi semua halaman surat × 3 breakpoint + 8 state di `wireframes/` (8 SVG) — AC-D01.
- [x] **Mockup token compliance** — hi-fi `mockups/` + Vue stub adherence pill CTA `#0075de` full, input `#ffffff` xs4, card lg12 + hairline + Level-1 shadow, canvas `#f6f5f4`, app-shell row active `#e8f2fd` border — AC-D02.
- [x] **Prototype navigability** — klik happy path surat lengkap (Pegawai → Component Kop/Daftar → Template SK → Administrasi → Wizard +step N → PDF gabungan) tanpa 404 dead-end — AC-D03.
- [x] **Component library relevance** — setiap halaman surat memakai library yang tepat (Tiptap untuk surat, `NSteps` untuk wizard, `NTree` untuk library) + documented trade-off — AC-D04.
- [x] **Test flow design** — tabel `E2E-01..06` mapping 16 steps + ALT/ERR → E2E case terdokumentasi — AC-D05.
- [x] **Responsive proof** — screenshot tablet drawer + mobile tabs + 44px hit — AC-D06.
- [x] **States & error hardening** — validation inline `NFormItem` + 409 `ReferenceList` + 403 single `data-testid=access-denied` + 500 PDF retry tanpa reset — story variant pass — AC-D07.
- [x] **State persistence design** — visibility per slug `localStorage:master-data:pegawai:visibility` + draft wizard `localStorage:letter-builder:draft:<slug>` + pagination ID locale `Menampilkan {from}-{to} dari {total}` — AC-D02/07.
- [x] **Handoff readiness** — `LetterBuilder/*` stories + `wireframes/` + `mockups/` + `Test Plan` mapping lengkap untuk FASE 2 `tasks/09-letter-builder-ux-improvement/` — AC-D08.

## Assumptions

- FASE 1 tidak menginstall runtime `puppeteer` Chrome atau `vue-draggable-plus`/`@vueuse/core` baru — hanya spec + Storybook mock (withProviders decorator mock `$fetch`/`useAuth`). Install & wiring di FASE 2 (tanpa ubah token visual). Ini konsisten `OUT OF SCOPE` spec.
- **Tracer bullet**: Library Tiptap `^3.31.3` sudah terkunci Task07; panambahan `extension-placeholder`, `extension-highlight` untuk UX (placeholder binding + highlight `is_looping` node) diasumsikan additive minor tanpa migrate DB — FASE 2 install + 1 story variant.
- **Master Data 13 tipe tetap**: `text, richtext (sanitized), date, datetime, time, image, select, select_multiple, relation_single, relation_multiple, number (IDR), hidden_operation_text, readonly_operation_text` — tidak menambah tipe baru di FASE 1; UX improvement hanya di configurator/picker/preview.
- **Permission stub**: `server/utils/permission-matrix.ts` tetap stub kosong (di-pin test Task02); FASE 1 tidak mengubah; FASE 2 tetap backfill seed `LetterBuilder:*` + guard URL allow `/api/master-data/*`, `/api/doc-*`, `/api/administrations/*`, `/api/documents/*` (pola Task05-07).
- **DRAG**: HTML5 `draggable` native diasumsikan cukup untuk desktop builder; `@vueuse/core` helper & `vue-draggable-plus` sebagai alternatif progresif — decision final di FASE 2 setelah A/B Storybook play (keduanya design-ready).
- **PDF**: Chrome Puppeteer diasumsikan tersedia di CI via `npx playwright install` atau `PUPPETEER_SKIP_DOWNLOAD=1` fallback (ERR-09 design: `500 Failed to generate PDF` → `NAlert` + `Coba lagi` tanpa hapus draft; binary live terverifikasi via mock unit di Task05 — E2E `pdf` step di-skip bila Chrome absen, bukan fail).
- **Operasi-teks tokenizer** reuse 100% `server/services/expression.service.ts` Task05 → preview klien import murni `evalTextOperation` (tanpa node import) identik by-construction (FR-006) — tidak duplikasi logic.
- **Sidebar dinamis**: Menu `Master Data → [display_name]` dan `Persuratan → [Administrasi]` diasumsikan static grup + link dinamis via page-level fetch (tidak fetch di `AppLayout` — menjaga layout stabil, konsisten Task06/07 decision).
- **Wireframes lokasi**: `tasks/08-letter-builder-ux-improvement-ui-design/wireframes/` (mengikuti praktik Task03 `tasks/03-redesign-ui-design/wireframes/`), bukan `docs/wireframes/` (dihapus Task01) — FASE 2 dapat reuse asset.
- **Nomenclature**: Istilah kanonis **Master Data** (dipilih user Task06) + **Surat** untuk hasil administrasi (bukan Document mentah) — konsisten PRD §7-8 & `docs/database.md` meta `master_tables`.
- **Image storage**: kolom `image` reuse subfolder `general` via `POST /api/settings/upload` (existing) — tanpa folder baru `master/` di FASE 1; allowlist URL `https://`/`/api/storage/`/`data:image/` di renderer tetap (DR-003 Task05).

## Open Questions

- Apakah perlu **import Word/PDF → template** (mis. `mammoth` + `pdfjs`) di roadmap berikutnya, atau tetap manual Tiptap untuk MVP?
- Apakah auto-number `document_number` (format `SK/{year}/{seq}`) perlu generator di `master_tables:config_json` (templated sequence) atau tetap manual + saran format di wizard?
- Seberapa sering `is_looping` card bersarang 2 level dipakai (EmployeeCard: avatar+nama+NIP di dalam repeater trips)? Jika >20%, pertimbangkan `component-ref` depth 2 (saat ini 1) dengan siklus guard — trade-off perf vs fleksibilitas?
- Apakah master `office.logo/signer` lebih baik dipindah dari `Settings` key-value ke tabel `mst_office` khusus (agar bisa dipilih via relation picker), atau tetap `system` source (Task07 decision) untuk kesederhanaan?
- Butuh mode `strict` preview (`?strict=1` fail bila binding hilang) untuk QA, atau cukup warning header (Task05 precedent)?
- Cap `100 kolom / 50k baris` (EC-06) perlu virtual scroll di definisi builder sekarang, atau tunda hingga telemetry menunjukkan >50 kolom real?
- Apakah `NCode` preview HTML cukup, atau perlu `prosemirror-view` live diff untuk binding (`before/after`) di Properties panel?

## Related Knowledge

- `docs/PRD.md` §4-10 (RBAC + Goals) + §17.1-17.6 Table Browse + §18 Alur Authorization + §19-20 API/Routes + §22 Seed + §23 Client-Side Authorization.
- `docs/architecture.md` § RBAC Architecture (RBAC-Only 9 schemas/12 tables) + § Nuxt 4 Project Structure + § API Endpoints (Auth/Users/Roles/Permissions/Guards/ActivityLogs/SystemLogs/Settings) + § Table Browse Component (320/160 + Restart + error slot `NAlert` + Settings) + § PageShell + § Storybook Foundation (`stories/foundation/` 3 files).
- `docs/database.md` § ERD + § Entity Details 1-12 + § Seed Data (users/roles/guards/permissions) + § Relationships (9 EntitySchemas) — + meta `master_tables/columns` & `doc_*` & `mst_*` dari Task06-07 (reuse).
- `docs/design-system.md` § Color Palette (Notion blue `#0075de` + canvas `#f6f5f4`, hairline `#e6e6e6`, Ink, Sticker) + Typography Inter + Spacing xxs4-xxl32 + Radius xs4-full + Elevation + Table + System Logs + PageShell + Responsive + Icons `@vicons/carbon` + Animations + Chrome Patterns (Badge Pill, Empty-State Card, Toast, Auth Card, Modal Card, App-Shell Row) + Foundation Deliverables Task26/27.
- `AGENTS.md` (EntitySchema, Service plain object, DTO Zod, Nitro route `defineEventHandler` + `QuerySchema` + `createError`, `useApi` + 401/403 handling, Tailwind v4 no preflight).
- `tasks/05-document-engine/*` (engine JSON Tree 18 type, expression `++ "" * / + -`, renderer escape/sanitasi, PDF Puppeteer).
- `tasks/06-master-data-ddl/*` (spec `mst_*` + 13 tipe + relation picker + schema API + Storybook `stories/master-data/` ×3 + wireframes `browse.svg/form.svg/list.svg`).
- `tasks/07-template-administration/*` (Tiptap v2 ClientOnly + right-click BindingPalette + Builder 3-pane 260|1fr|320 + NSteps wizard + seeder demo + Storybook `stories/template-admin/` ×3 + wireframes `builder.svg/component.svg/wizard.svg`).
- `tasks/03-redesign-ui-design/*` + `tasks/04-redesign/*` (Notion-calm baseline 11 halaman + stories `redesign/` 8).
- `app/utils/naiveui-theme.ts` (live token), `app/assets/css/main.css` (`tailwindcss/theme`+`utilities` token `:root`), `app/components/common/DataTable/DataTable.vue` (kanonis 320/160 + Restart + error slot), `app/components/layout/PageShell.vue` & `AppLayout.vue` (sidebar 220/72).
- `.ua/` (knowledge graph 754 nodes).

## Change Log

### Initial — FASE 1 UI-First

- Task specification created (FASE 1 — UI Design: Wireframe/Mockup/Prototype + Playwright test flow + error hardening + Tiptap/Naive UI library untuk pembuatan surat, menyatukan 05-07). Sumber: user prompt "buatkan test flow untuk tasks/05-06 dengan playward, perbaiki seluruh errors, improve design ui/ux agar lebih mudah digunakan user, gunakan library component yang relevan agar ui/ux menjadi lebih baik lagi dalam membuat surat pada task 05-6" — ditafsir sebagai hardening Letter Builder (05-07) dengan UI-First.
- Deliverables: `wireframes/` SVG (desktop/tablet/mobile + states), mockups Vue Tailwind, Storybook `apps/web/stories/letter-builder/*.stories.ts` (8 stories × variants), library rationale table, Playwright flow E2E-01..06 mapping ke User Flow. Next: `tasks/09-letter-builder-ux-improvement/` (FASE 2 Implementation) setelah Status DONE + Storybook build PASS.
