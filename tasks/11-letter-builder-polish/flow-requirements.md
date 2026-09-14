## User Flow

> MANDATORY — Flow implementasi. **HARUS konsisten** dengan FASE 1 `tasks/10-letter-builder-polish-ui-design/flow-requirements.md` (Diagram + 24 Steps + ALT/ERR). Mapping ke API & UI FASE 1 ditambahkan. Tidak mengubah UX tanpa catatan `Penyesuaian dari design`.

### Diagram

```text
[Super Admin] → /dashboard/master-data (DataTable kanonis PageShell) → CTA "+ Buat Tabel" pill → /dashboard/master-data/create (DEDICATED PAGE baru, PageShell same) → NDynamicInput 13 tipe → POST /api/master-data → 201 → redirect /dashboard/master-data
  → /dashboard/master-data/pegawai → Create baris → POST /api/master-data/pegawai/rows
  → /dashboard/components (list) → CTA "+ Buat Component" → /dashboard/components/create (DEDICATED PAGE, PageShell same, ComponentEditor office-min hardened, configure guard) → Save POST /api/doc-components → redirect list → Edit via /dashboard/components/:id/edit (same layout pre-filled) → PUT → Delete → DELETE 409 → ReferenceList modal (reuse 09)
  → /dashboard/templates (list) → "+ Buat Template" → /dashboard/templates/create (meta) → POST /api/doc-templates → redirect /dashboard/templates/:id (Builder polish 260|1fr|320)
  → /dashboard/templates/:id (Builder polish: Library NTree searchable 260 | Canvas warm #f6f5f4 | Properties 320 live) → drag Kop/Daftar → Requirement via GET /api/master-data/pegawai/schema → LoopingPicker pilih semua → Preview HTML/PDF POST /api/doc-templates/:id/preview(-pdf) → Publish PUT status PUBLISHED → version bump
  → /dashboard/administrations (list) → "+ Buat Administrasi" → /dashboard/administrations/create (DEDICATED PAGE, PageShell same, StepMappingEditor per-field DR-002, bukan textarea) → POST /api/administrations (steps mapping) → validate DR-002 missing: field → inline error per-field + NAlert summary + scroll
  → /dashboard/administrations/:id/edit (same layout) → PUT
  → /dashboard/documents/:slug → Wizard NSteps vertical guided Data → Step1 → Step2 → +Tambah Step N → Review pagebreak → POST /api/administrations/:id/runs → PDF → GET /api/documents/:id/pdf
  → Playwright video: playwright.config.ts video: 'on' size 1280×720 trace on-first-retry → test:e2e HEADLESS=1 → video.webm per-test
Alternate/Error: modal lama → dihapus (nav ke page); Tiptap configure undefined → guard + NAlert Retry; Builder empty → EmptyStateCard; DR-002 missing → per-field highlight + NAlert DR-002 summary
```

### Steps

| Step | Actor | Aksi | Halaman / Component (dari UI 10) | API / Hasil |
|------|-------|------|----------------------------------|-------------|
| 1 | Super Admin | Buka `/dashboard/master-data` | `PageShell` + `MasterTableDataTable.vue` + `DataTable` kanonis search 320 `Cari...` + NSelect 160 `Semua Kolom` + Restart `Segarkan data` + Settings | `GET /api/master-data` paginated `Menampilkan {from}-{to} dari {total}` |
| 2 | Super Admin | Klik `+ Buat Tabel` pill primary `#0075de` (`h(NIcon Add)`) | `→ navigateTo('/dashboard/master-data/create')` (DEDICATED PAGE baru) — `PageShell` breadcrumb `Dashboard / Master Data / Buat` | Form kosong `MasterDataDefinitionForm.vue` (reuse `NDynamicInput` kolom) layout `head 16×20 body 24 radius 12 hairline` |
| 3 | Super Admin | Isi `name=pegawai, display_name=Pegawai`, tambah kolom `nama (text searchable)` + `jabatan (relation_single)` + `gaji (number IDRInput.vue)` | `ColumnConfigPanel.vue` + slug live sanitize ` pegawai ` → `pegawai` + `evalTextOperation` preview | Validasi live; blacklist `users`/`mst_*` → 400 inline `NFormItem` + `NAlert` summary + focus first |
| 4 | Super Admin | Submit valid → `POST /api/master-data` | `useMasterDataStore.createTable` → Bearer `authHeaders()` | 201 `mst_pegawai` DDL, toast `Berhasil`, redirect `/dashboard/master-data`, menu `Master Data → Pegawai` muncul — AC-D01 |
| 5 | Admin | Buka Browse `/dashboard/master-data/pegawai` | `MasterRowTable.vue` + `DataTable` kanonis | `GET /api/master-data/pegawai/rows?page&limit&search&sortBy&sortOrder` |
| 6 | Admin | Search "afd" (hanya `is_searchable`) + sort `gaji` (hanya `is_orderable`) + visibility toggle persist `localStorage:master-data:pegawai:visibility` | DataTable toolbar | Hasil tersaring/terurut + pagination ID |
| 7 | Admin | `+ Tambah Data` → isi 13 tipe + relation picker | `MasterRowForm.vue` + `RelationPickerModal.vue` | `POST /api/master-data/pegawai/rows` (komputasi `ExpressionService` + image allowlist) → 201 |
| 8 | Super Admin | Buka `/dashboard/components` → klik `+ Buat Component` | `→ navigateTo('/dashboard/components/create')` (DEDICATED PAGE baru) — `PageShell` `title Buat Component` + `ComponentEditor.vue` office-min + `TiptapToolbar.vue` | Form kosong: `name` + `is_looping` + Tiptap host `min-h-[300px]` border `rounded 4px` hairline |
| 9 | Super Admin | Di `create` page: Tiptap office-min toolbar: Bold `B` + Italic `I` + Underline `U` + Heading `H2` `NSelect` + Align `Center` + List `•` + Table + Image `https://` + BubbleMenu contextual + FloatingMenu placeholder `Tulis konten surat...` → right-click → `BindingPalette` (`name=kop.nama`, `view=text`, `target=pegawai.nama`) → fallback `+ Binding` 44px mobile | `ComponentEditor.vue` hardened: `initEditor` guard `configure` + `DocBinding` nodes + `Placeholder.configure({ placeholder: 'Tulis konten surat...' })` | Pill `{{kop.nama}}` `bg-[#e8f2fd] text-[#0075de] rounded-full` |
| 10 | Super Admin | Toggle `is_looping=true` → `item.nama` → Save → `POST /api/doc-components` `CreateDocComponentSchema` `BR-003` | `NCheckbox` is_looping + `BR-003` validation | Component `v1`, redirect list, toast `Berhasil` — AC-D02 |
| 11 | Admin | Buka `/dashboard/components/:id/edit` (DEDICATED PAGE update, layout sama dengan create) | `PageShell` `title Edit: Kop Surat v1` + breadcrumb `Dashboard / Component / Edit` + same `ComponentEditor` pre-filled `GET /api/doc-components/:id` `tiptap_json` → `setContent` guard | PUT `PUT /api/doc-components/:id` → version bump → `Edit: Kop v2` |
| 12 | Admin | Delete Component dari list → `NPopconfirm` → `DELETE /api/doc-components/:id` bila dipakai Template → 409 | `isConflictError`/`getConflictReferences` + `ReferenceList.vue` modal `data-testid=conflict-references` + `NTag 409` + `Lihat` (reuse 09) | Modal warning `Tidak dapat menghapus — masih dipakai` — bukan `Server Error` — AC-D02 |
| 13 | Admin | Buka `/dashboard/templates` → `+ Buat Template` | `→ navigateTo('/dashboard/templates/create')` (DEDICATED PAGE) — PageShell meta | Form `name/code/description` + `code [a-z0-9-_]{2,60}` validation |
| 14 | Admin | Submit `name=SK Pengangkatan, code=sk-pengangkatan` → `POST /api/doc-templates` | `usePersuratanStore.createTemplate` → `schema_json: { type:'document', children:[{type:'heading', props:{content:name, level:1}}]}` | 201 → redirect `/dashboard/templates/:id` (Builder) — AC-D03 |
| 15 | Admin | **Builder polish** di `/dashboard/templates/:id`: Library `NTree` searchable 260px (filter `NInput` 32px) \| Canvas flex-1 warm `#f6f5f4` p-4 + `EmptyStateCard` illustration `xl16` padded 32 + CTA `+ Tambah Blok` \| Properties 320px `NForm` live sectioned eyebrow `11px uppercase #94a3b8` | `TemplateBuilder.vue` + `ComponentLibrary.vue` + `DocumentCanvas.vue` + `PropertyPanel.vue` + `RepeaterEditor`+`ConditionEditor`+`DataBindingEditor` + `LoopingPicker.vue` | Canvas blok drag-drop HTML5 ghost `opacity 0.5` + ring primary `#0075de` + pagebreak visual — AC-D03 |
| 16 | Admin | Drag `Kop` + `Daftar` dari Library NTree → Canvas + Properties live (`useBuilderStore` blocks/selectedId/update/move/add) → LoopingPicker `Pilih semua` indeterminate (header checkbox) + `NTransfer` kolom checklist → repeater node `source=pegawai, item=item, columns:[nama,jabatan]` | `LoopingPicker.vue` | Auto-form ter-generate dari requirement via `GET /api/master-data/pegawai/schema` (`master_data:pegawai`) + `manual` + `system:current_date` |
| 17 | Admin | Preview HTML drawer 600px `NTabs HTML/PDF` + `NCode` + `NScrollbar` + `NAlert warning` header (empty repeater/div-by-zero) + `Unduh PDF` pill | `DocumentPreviewDrawer.vue` | `POST /api/doc-templates/:id/preview` → HTML + `POST /api/doc-templates/:id/preview-pdf` → PDF A4 portrait — 500 → `NAlert error + Coba lagi` tanpa reset |
| 18 | Admin | Publish → `PUT /api/doc-templates/:id status PUBLISHED` `BR-002` (semua requirement terpetakan + ≥1 blok + `is_looping` valid) → version 1→2 | `store.updateTemplate(id, { schema_json, status:'PUBLISHED' })` → `message.success Template published (versi naik)` | Badge `PUBLISHED` `success`, run lama snapshot `v1` — BR-002/BR-005 |
| 19 | Admin | **Administrasi mapping redesign**: `→ navigateTo('/dashboard/administrations/create')` (DEDICATED PAGE baru, layout sama via PageShell) — `name/slug/description` + Steps editor baru per-field | `StepMappingEditor.vue` (replace textarea) — per-step: `NSelect` template searchable + per-requirement rows (`field NTag badge` + `kind NSelect master_data/manual/system` + `ref NInput/NSelect` + inline error) | Requirements auto-fetch via `GET /api/doc-templates/:id` or `scanRequirements(schemaJson)` — rows render |
| 20 | Admin | Submit incomplete mapping (kosongkan `letter.tanggal`): `POST /api/administrations` `steps: [{template_id, step_order:0, mapping:{letter.number:{kind:"value",ref:"800/1"}}}]` missing `letter.tanggal` → server `DR-002` 400 `missing: letter.tanggal` | Client per-field highlight: `letter.tanggal` `NFormItem validationStatus="error"` `feedback "Missing: letter.tanggal (DR-002) — pilih target"` + `NAlert type="warning" Mapping incomplete — missing: letter.tanggal` summary + `ref.focus()` + `scrollIntoView` | Before polish textarea JSON membingungkan → now jelas per-field — AC-D04/ERR-06 |
| 21 | Admin | Fill `letter.tanggal → {kind:"system", ref:"current_date"}` → Submit valid → `POST /api/administrations` | `store.createAdministration` | 201 Administrasi `sk-pengangkatan` + slug, ActivityLog, menu Persuratan → `[SK Pengangkatan]` muncul |
| 22 | Admin | Edit Administrasi via `→ navigateTo('/dashboard/administrations/:id/edit')` (layout sama) → pre-filled `GET /api/administrations/:id` steps mapping + same per-field editor → `PUT /api/administrations/:id` `replaceSteps` DR-002 pass | PageShell `title Edit: SK Pengangkatan` + breadcrumb | Updated — AC-D01 |
| 23 | Operator | `→ /dashboard/documents/sk-pengangkatan` Wizard `NSteps` vertical guided (`Data → SK → Tanda Tangan → Review`) → isi `nomor`, pilih pegawai via `RelationPickerModal` multiple → `+ Tambah Step` append → Review gabungan pagebreak | `AdminWizard.vue` (`NSteps` current + per-step `NForm` + validation + draft autosave `localStorage:letter-builder:draft:<slug>`) | Render gabungan concatenation + `pagebreak` divider |
| 24 | Operator | Save run → `POST /api/administrations/:id/runs` `RunWizardSchema` `data/extra_steps max20/document_number unique BR-006` + `generatePdfFromHtml` → snapshot `template_version` + `rendered_html` → `FINAL` → `GET /api/documents/:id/pdf` download `application/pdf` | `renderer.service` + `pdf.service` | Dokumen FINAL + `video.webm` artifact per `playwright.config.ts` `video: 'on'` — AC-D07 |
| 25 | QA | Playwright video setiap pengujian: `npm run test:e2e` HEADLESS=1 Chromium + `reuseExistingServer: true` `:3000` → artifact `test-results/**/video.webm` + `playwright-report` trace viewer `npx playwright show-report` | `playwright.config.ts` hardened + `test/e2e/letter-builder-polish-*.spec.ts` 6 files + existing 6 files | Video recorded `size 1280×720` per `https://playwright.dev/docs/videos#record-video` — AC-D07/D08 |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI (implementasi 11) |
|----|----------|-------|----------------------------------|
| ALT-01 | Master list empty | `/dashboard/master-data` → Empty | `NEmpty` + `Belum ada definisi` + CTA pill `+ Buat Tabel Pertama` → `navigateTo('/dashboard/master-data/create')` (dedicated) |
| ALT-02 | Browse empty | Browse → Empty | `NEmpty` + `Belum ada data Pegawai` + CTA `+ Tambah Data Pertama` |
| ALT-03 | Visibility hide all column | Settings → hide all | Guard minimal 1 kolom visible (disable last hide + tooltip) |
| ALT-04 | Relation picker empty | Modal → Empty | `NEmpty` + `Atur ulang` without close |
| ALT-05 | Unsaved dedicated create → Back/Cancel | `onBeforeRouteLeave` guard → `NDialog` "Batalkan perubahan?" |
| ALT-06 | Template DRAFT badge | List → `NTag DRAFT` `#a39e98` tooltip `Lengkapi mapping` |
| ALT-07 | Viewer akses dedicated create → 403 | `AccessDeniedAlert` single `data-testid=access-denied` top16 right16 max448 slideIn 300ms auto 4s |
| ERR-01 | Master Data slug duplikat/blacklist, kolom dupe, minimal 1 kolom | `POST /api/master-data` → 400/409 | Inline `NFormItem` error + `NAlert` summary + focus first |
| ERR-02 | **Tiptap `configure` crash** `Cannot read properties of undefined (reading 'configure')` | `ComponentEditor create` `initEditor` → `StarterKit`/`Link` undefined | **Fix 11**: `mod.default ?? mod` guard + `if (!Ext?.configure) fallback` + `try/catch` → `NAlert error Gagal memuat editor (configure) + NButton Retry` + `#fallback` `ClientOnly` + `onBeforeUnmount` safe |
| ERR-03 | Tiptap binding `is_looping` tanpa `item.*` | `POST /api/doc-components` → 400 `BR-003` | Badge merah `#EF4444` + `NAlert` list + publish blocked |
| ERR-04 | Operasi div-by-zero | `POST /api/master-data/:slug/rows` → 400 `ERR-04` | `—` + `NAlert warning "Pembagian nol"` + server `null` |
| ERR-05 | DDL alter destruktif | `PUT /api/master-data/:slug` → confirm | `NDialog` 2 langkah + backup `storage/backups/*.sqlite` + checkbox `Saya mengerti` |
| ERR-06 | **Administrasi DR-002 incomplete — `missing: field`** (polish) | `POST /api/administrations` → 400 `Missing field: letter.tanggal` | **Fix 11**: per-field rows → `letter.tanggal` merah `validationStatus="error"` + `feedback "Missing: letter.tanggal (DR-002)"` + `NAlert type="warning" Mapping incomplete — missing: letter.tanggal` summary + scroll & focus first |
| ERR-07 | Hapus terproteksi (Master Table/Component/Template dipakai) | Delete → 409 | `NAlert warning` + `ReferenceList` modal `data-testid=conflict-references` + `NTag 409` + `Lihat` (reuse 09) |
| ERR-08 | 401 no token | Any → 401 | `useApi` interceptor clear + `navigateTo('/login')` + toast `Sesi berakhir` |
| ERR-09 | 403 no permission | Any → 403 | Single `AccessDeniedAlert` `rbac-denied` 1 hit |
| ERR-10 | 404 slug not found | `GET /api/master-data/:slug` → 404 | `NAlert` + `NEmpty` + `Kembali ke Master Data` |
| ERR-11 | PDF generate fail | `POST .../preview-pdf` → 500 | `NAlert error Gagal generate PDF + Coba lagi` tanpa reset `data/search/sort/page` |
| ERR-12 | Upload image >5MB / tipe salah | `NUpload` → 400 | `NAlert` + inline `Upload gagal: maksimal 5MB` + retry + client preflight |

### Flow → UI Mapping

| Flow Step | Halaman (dari UI 10) | Component (implement 11) | State (10 States → wire 11) |
|-----------|----------------------|--------------------------|------------------------------|
| Step 1-4 Master Data dedicated | `/dashboard/master-data/create` + `/:slug/edit` (same PageShell) | `MasterDataDefinitionForm.vue` + `ColumnConfigPanel.vue` + `IDRInput.vue` + `PageShell` | validation 400/409 → `NFormItem` + `NAlert` summary |
| Step 5-7 Browse | `/dashboard/master-data/:slug` | `MasterRowTable.vue`, `MasterRowForm.vue`, `RelationPickerModal.vue` | loading/empty/error + search/sort/visibility/pagination ID |
| Step 8-12 Component dedicated + Tiptap | `/dashboard/components/create` + `/dashboard/components/:id/edit` | `ComponentEditor.vue` hardened + `TiptapToolbar.vue` (new) + `BindingPalette.vue` + `ReferenceList.vue` | `tiptapConfigureError` → `NAlert` + Retry, `is_looping` 400, 409 modal |
| Step 13-18 Template dedicated + Builder polish | `/dashboard/templates/create` + `/dashboard/templates/:id/edit` + Builder `/dashboard/templates/:id` | `TemplateBuilder.vue` polish + `ComponentLibrary.vue` NTree + `DocumentCanvas.vue` + `PropertyPanel.vue` + `RepeaterEditor`+`LoopingPicker` | empty canvas `EmptyStateCard` → drag ghost → selection ring `#0075de` |
| Step 19-22 Administrasi dedicated + DR-002 | `/dashboard/administrations/create` + `/:id/edit` | `StepMappingEditor.vue` (new per-field) + `AdministrationForm` PageShell | `missing: field` → per-field highlight + `NAlert DR-002` summary |
| Step 23-24 Wizard | `/dashboard/documents/:slug` | `AdminWizard.vue` NSteps + `DocumentPreviewDrawer.vue` 600px tabs | per-step validation + draft banner + PDF 500 retry + video |
| Global | Dedicated pages vs modal | `PageShell` same layout, `NButton` pill primary `#0075de`, breadcrumb `<a href>` | 401→/login, 403 single, 404 NEmpty, video |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | DTO Validation (Zod) | Error → UI |
|-----------|-------------|--------------|----------------------|------------|
| Step 4 | POST | `/api/master-data` | `CreateMasterTableSchema` (`name/[a-z0-9_]` blacklist + 13 tipe discriminated) | 400 `NFormItem` (BR-001), 409 slug dupe `NAlert warning` |
| Step 7 | POST | `/api/master-data/:slug/rows` | `validateAndCompute` 13 tipe + `ExpressionService` + image allowlist | 400 div-by-zero/required/image → `NAlert warning` |
| Step 10 | POST | `/api/doc-components` | `CreateDocComponentSchema` (`name 1-120 unique, tiptap_json 1MB TiptapDocSchema, is_looping→item.* BR-003`) | 409 name dupe, 400 Tiptap/loop |
| Step 11 | PUT | `/api/doc-components/:id` | Same + `version bump` | 409, 400, 404 |
| Step 12 | DELETE | `/api/doc-components/:id` | `DocComponentsService.findReferences` exact | 409 `ReferenceList` modal (reuse 09) |
| Step 14 | POST | `/api/doc-templates` | `CreateDocTemplateSchema` (`name unique, code [a-z0-9-_]{2,60} unique, DocNodeSchema limits`) | 409 name/code dupe, 400 DocNode |
| Step 18 | PUT | `/api/doc-templates/:id` | `UpdateDocTemplateSchema` `status PUBLISHED` → `BR-002` publish guard + version bump | 400 BR-002, 409 |
| Step 17 | POST | `/api/doc-templates/:id/preview-pdf` | `PreviewPdfSchema` (`data, page size/orientation`) + `registry()` | 500 puppeteer → `NAlert retry` + `pdfError` (no 500 crash) |
| Step 19-21 | POST/PUT | `/api/administrations` `/api/administrations/:id` | `CreateAdministrationSchema` (`name unique, slug [a-z0-9-]{1,60} unique, steps max20 template_id + order unique + mapping DR-002`) | **400 `missing: field` → per-field highlight + NAlert DR-002** (Fix 11), 409 name/slug dupe |
| Step 24 | POST | `/api/administrations/:id/runs` | `RunWizardSchema` (`data, extra_steps max20, document_number unique BR-006, as_draft`) + `buildSystemContext` + `generatePdfFromHtml` | 409 document_number dupe, 400 incomplete, 500 pdfError → draft |
| Step 25 | — | — | — | Playwright `video: 'on'` config — no API, but E2E `video.webm` artifact per `https://playwright.dev/docs/videos#record-video` |

## Requirements

> MANDATORY — mengacu User Flow + UI 10. Tidak mengulang design, hanya menambah implementasi wiring.

### Tujuan Fitur

- REQ-G01: **Dedicated pages routing** — semua create/update dialihkan ke halaman baru ber-layout sama (`PageShell` `head 16×20 body 24 radius 12` hairline) agar navigasi konsisten, deep-linkable, dan mudah di-test via `page.goto` + video.
- REQ-G02: **Hardening Tiptap** — hilangkan crash `configure` (ESM guard + try/catch + ClientOnly fallback) sehingga `ComponentEditor` create & delete stabil.
- REQ-G03: **Builder polish** — `/dashboard/templates/:id` lebih cantik (token Notion + `EmptyStateCard` + `NTree` searchable + `PropertyPanel`) dan lebih mudah (drag ghost + keyboard reorder + pilih semua indeterminate).
- REQ-G04: **DR-002 mapping per-field** — `missing: field` tidak lagi membingungkan karena highlight per-field + summary `NAlert` + scroll.
- REQ-G05: **Global UI/UX polish** — seragamkan spacing, typography, radius, elevation, empty/loading/error/success/validation/permission states, `prefers-reduced-motion`, hit 44px.
- REQ-G06: **Tiptap office-minimum** — toolbar `https://tiptap.dev/docs/examples` very minimum (1 baris grouped + BubbleMenu + FloatingMenu) seperti office doc ringan.
- REQ-G07: **Playwright video** — setiap pengujian merekam `video.webm` (`https://playwright.dev/docs/videos#record-video` `video: 'on'` 1280×720) untuk QA replay.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Super Admin | Definisi Master Data + Component/Template publish + Administrasi + run FINAL | `Master Data Write` + `Component Write` + `Template Write` + `Administration Write` + `Document Write` + `Full Access` |
| Admin | CRUD baris Master Data + buat Component/Template draft + Preview PDF | `Master Data Read/Write` + `Component Read/Write` + `Template Read/Write` |
| Operator | Jalankan wizard hasil surat + tambah step N + PDF gabungan | `Document Write` + `Administration Read` + `Template Read` |
| Viewer | Lihat browse + Template + dokumen (read-only) | `Master Data Read` + `Document Read` |
| Guest (unauth) | Redirect login | — (401) |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Super Admin | Buat tabel Pegawai via `/master-data/create` dedicated | `mst_pegawai` + menu | Step 2-4 |
| UC-02 | Super Admin | Buat Component Kop via `/components/create` dedicated Tiptap office-min | `Kop` v1 | Step 8-10 |
| UC-03 | Super Admin | Edit Component via `/components/:id/edit` layout same pre-filled | `Kop v2` | Step 11 |
| UC-04 | Admin | Delete Component terproteksi → 409 ReferenceList | Modal warning | Step 12 |
| UC-05 | Admin | Buat Template SK via `/templates/create` → Builder polish | DRAFT v1 | Step 13-14 |
| UC-06 | Admin | Builder drag Kop/Daftar + looping pilih semua + requirement + preview + publish | PUBLISHED v2 | Step 15-18 |
| UC-07 | Admin | Buat Administrasi via `/administrations/create` dedicated per-field mapping | Administrasi + slug | Step 19 |
| UC-08 | Admin | Submit DR-002 incomplete → `missing: letter.tanggal` per-field highlight | Inline + summary | Step 20 / ERR-06 |
| UC-09 | Admin | Edit Administrasi `/administrations/:id/edit` layout same | Updated | Step 22 |
| UC-10 | Operator | Wizard tambah-step N → PDF → save run (video recorded) | FINAL | Step 23-24 |
| UC-11 | QA | Playwright video per-test `E2E-01..06` polish + existing regression | `video.webm` | Step 25 |

### Functional Requirements

- FR-001: **Master Data dedicated pages** — `GET /dashboard/master-data/create` + `GET /dashboard/master-data/:slug/edit` dengan `PageShell` same layout + `MasterDataDefinitionForm.vue` (`NDynamicInput` kolom) — Step 1-4.
- FR-002: **Component dedicated pages** — `GET /dashboard/components/create` + `GET /dashboard/components/:id/edit` (pecah dari `components.vue:159` NModal) dengan `PageShell` + `ComponentEditor` office-min hardened + `TiptapToolbar.vue` — Step 8-12.
- FR-003: **Template dedicated pages** — `GET /dashboard/templates/create` + `GET /dashboard/templates/:id/edit` (meta) + builder `GET /dashboard/templates/:id` polish — Step 13-15.
- FR-004: **Administrasi dedicated pages** — `GET /dashboard/administrations/create` + `GET /dashboard/administrations/:id/edit` dengan `StepMappingEditor.vue` per-field DR-002 — Step 19-22.
- FR-005: **Tiptap `configure` guard** — `ComponentEditor.vue` lazy imports `mod.default ?? mod` + `if (!Ext?.configure) fallback` + `try/catch initEditor` → `NAlert error + Retry` + `onBeforeUnmount` safe + `ClientOnly` #fallback — ERR-02.
- FR-006: **Builder polish** — 3-pane `260|1fr|320` + warm `#f6f5f4` + `EmptyStateCard` + `NTree` searchable + `PropertyPanel` eyebrow + `RepeaterEditor` pilih semua indeterminate + drag ghost + keyboard `ArrowUp/Down` — Step 15-16.
- FR-007: **Mapping `DR-002` per-field** — `StepMappingEditor.vue` per-step fetch `schema/requirements` → rows `field NTag + kind NSelect + ref NInput` + `validationStatus="error"` bila missing + `NAlert warning DR-002` summary + focus & scroll — ERR-06.
- FR-008: **Tiptap office-min toolbar** — `TiptapToolbar.vue` grouped `B/I/U/S | Heading | Align | List | Table/Image/Link | History | + Binding` 1 baris `gap-1 flex-wrap` + `BubbleMenu` + `FloatingMenu` placeholder — very minimum office.
- FR-009: **Playwright video** — `playwright.config.ts` `use: { video: { mode: 'on', size: { width:1280, height:720 } }, trace: 'on-first-retry', screenshot: 'only-on-failure' }` + `headed` + `slowMo` + `reuseExistingServer` per `https://playwright.dev/docs/videos#record-video` — Step 25.
- FR-010: **Global polish** — token `naiveui-theme.ts` + Tailwind inline `bg-[#f6f5f4] border-[#e6e6e6] text-[#0075de]` + `NEmpty` CTA pill + `NAlert` warning vs error + `prefers-reduced-motion` — all pages.

### Business Rules

- BR-001: `slug`/`code` blacklist → 400/409 — Step 3-4.
- BR-002: Publish guard → 400 + tooltip — Step 18.
- BR-003: `is_looping` `item.*` → 400 — Step 10.
- BR-004: `step_order` unique + `DR-002` mapping completeness → 400 per-field — ERR-06.
- BR-005: Version bump publish — Step 18.
- BR-006: `is_searchable`/`is_orderable` whitelist — Step 6.
- BR-007: Div-by-zero → `null`+warning — Step 7.
- BR-008: `MAX_JSON_BYTES` 1MB + DocNode limits — Step 10.
- BR-009: **Dedicated page layout same** — semua create/update `PageShell` identik `head 16×20 body 24 radius 12` hairline — FR-001..004.
- BR-010: **Tiptap guard** — `if (!Ext?.configure) fallback` + `editor.destroy()` safe + `ClientOnly` — FR-005.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Unsaved dedicated create → Back | `onBeforeRouteLeave` `NDialog` + draft `localStorage` banner | Step 8-11 |
| EC-02 | Extension import network fail | Guard fallback `StarterKit` minimal + `NAlert` retry | ERR-02 |
| EC-03 | Builder drag tablet no mouse | Keyboard `ArrowUp/Down` + `Enter` | Step 16 |
| EC-04 | 50 requirements per step | `NScrollbar` max-height 400 + search filter | ERR-06 |
| EC-05 | XSS `javascript:` via Tiptap | `sanitize-html` allowlist `https`/`/api/storage/`/`data:image/` | Step 9 |
| EC-06 | Video disk penuh CI | Switch `video: 'retain-on-failure'` + `trace: 'on-first-retry'` fallback | FR-009 |
| EC-07 | Mobile toolbar overflow 375 | Scroll-x + `+ Binding` bottom fixed 44px | Step 9 |
| EC-08 | `prefers-reduced-motion` | Anime 250ms → 0.01ms `app/assets/css/main.css` | Global |
| EC-09 | 409 race delete | Second → 404 not 500 | Step 12 |
| EC-10 | `findReferences` substring false-positive | Exact `"componentId":"<name>"` guard | Step 12 |

