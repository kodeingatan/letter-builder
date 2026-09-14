## Domain

> FASE 2 — Implementation reuse domain 05–07 tanpa tabel baru (kecuali fix wiring). Ditampilkan sebagai konteks untuk API/UI fix.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| MasterTable (reuse Task06) | Definisi tabel DDL `mst_*` | id, name, slug, display_name, description, status `DRAFT→ACTIVE→ARCHIVED` |
| MasterColumn (reuse) | Definisi kolom 13 tipe | id, table_id, name, display_name, type(13), config_json, is_required/orderable/searchable, sort_order |
| MasterRow (fisik `mst_*`) | Baris dinamis QueryBuilder (bukan EntitySchema) | id, kolom dinamis + created_at/updated_at |
| DocComponent (reuse Task07) | Blok reusable Tiptap | id, name (UNIQUE), is_looping, tiptap_json, preview_html, version (naik tiap update) |
| DocTemplate (reuse) | Surat (JSON Tree + Tiptap embed) | id, name (UNIQUE), code (slug UNIQUE `[a-z0-9-_]`), description, schema_json (DocNode), version, status `DRAFT/PUBLISHED/ARCHIVED` |
| Administration (reuse) | Definisi multi-step surat | id, name UNIQUE, slug UNIQUE `[a-z][a-z0-9-]{1,60}`, description |
| AdminStep (reuse) | Step → template + mapping | id, admin_id FK CASCADE, template_id FK RESTRICT, step_order UNIQUE per admin, mapping_json |
| Document (run) (reuse) | Instance hasil wizard | id, admin_id NULL, template_id NULL, document_number UNIQUE NULL, data_json, rendered_html snapshot, pdf_path, status `DRAFT→FINAL→CANCELLED`, template_version |
| DocNode (reuse Task05) | Node JSON Tree engine | type (18), props, children, elseChildren |

### Relationships

```text
MasterTable ──1:N── MasterColumn (CASCADE; hapus tolak 409 bila direferensi relation/template → BR-003)
MasterTable ──1:N── MasterRow (fisik mst_*; DROP setelah backup storage/backups/; isMasterPhysicalTable ignore drift)
DocTemplate ──N:M── DocComponent (via schema_json component-ref; siklus ditolak; findReferences template: refs)
Administration ──1:N── AdminStep (CASCADE via queryBuilder delete explicit; order unik INV-002)
AdminStep ──N:1── DocTemplate (RESTRICT bila dipakai → 409 steps/administrations)
Administration ──1:N── Document (run; snapshot template_version+rendered_html dikunci BR-005)
MasterColumn relation_single/multiple ──(logical FK slug)── MasterTable (bukan FK DB kaku → warning bila target hilang)
DocComponent ──1:N── DocComponent (nested component view bersarang, max direkomendasikan 2 level, 1 level render)
```

### States

| Entity | State | Deskripsi | Transisi Diizinkan |
|--------|-------|-----------|--------------------|
| MasterTable | `DRAFT → ACTIVE → ARCHIVED` | Definisi → dipakai → disembunyikan (soft-hide browse) | `DRAFT→ACTIVE`, `ACTIVE→ARCHIVED` (hard `DELETE = DROP + backup + delete meta`) |
| DocTemplate | `DRAFT → PUBLISHED → ARCHIVED` | Draft → live → pensiun | `DRAFT→PUBLISHED` (naikkan version) →`ARCHIVED`; edit `PUBLISHED` schema → version bump (BR-005) |
| Document | `DRAFT → FINAL → CANCELLED` | Wizard draft → final surat → batal | `DRAFT→FINAL`, `DRAFT/FINAL→CANCELLED` (cancel soft, riwayat awet) |
| MasterRow | Stateless CRUD | — | — |

### Domain Rules

- DR-001: Slug/kolom disanitasi server (`sanitizeSlug`, `sanitizeColumnName`); klien preview hanya UX, tidak dipercaya (reuse 06 DR-001).
- DR-002: `config_json` divalidasi Zod discriminated union per 13 tipe (options/relation/fmt/operation); `tiptap_json` shallow validate `TiptapDocSchema` + binding `item.*` rule (reuse 06-07).
- DR-003: Nilai operasi-teks selalu dikomputasi ulang server via `ExpressionService.evalTextOperation(client preview identik)` + image allowlist `https://`/`/api/storage/`/`data:image/` (reuse 05).
- DR-004: Publish `DocTemplate` validasi `DocNodeSchema` + `assertTreeLimits` (depth ≤10 total ≤200 + requirement lengkap `BR-002`).
- DR-005: Renderer pure: tidak mutasi input tree, escape binding `sanitize-html`, allowlist URL gambar, `pdf.service` `generatePdfFromHtml` isolasi Chrome.

### Invariants

- INV-001: Template `PUBLISHED` selalu lolos `DocNodeSchema` + `BR-002`; run lama render reproducible via snapshot `template_version`+`rendered_html` (bukan baca template terbaru).
- INV-002: `step_order` unik per administration; `document_number` unik bila diisi; `slug/code/name` unik.
- INV-003: Output `renderer.render(tree,data)` selalu HTML string `<div class="doc-page">…` tidak `undefined` (INV-001 05).
- INV-004: `mst_*` fisik selalu ignore drift (`isMasterPhysicalTable`) — tidak drop oleh `synchronize`.

### Data Model

Reuse 05–07 (tanpa tabel baru). Mock untuk story/testing tetap dari `08`.

#### MasterTable (existing `master_tables`)

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | number | Y | Y | auto | PK |
| name | varchar(60) | Y | N | — | Nama internal `[a-z0-9_]` |
| display_name | varchar(120) | Y | N | — | Label menu |
| slug | varchar(64) | Y | Y | auto sanitize | Identitas fisik `mst_<slug>` |
| description | text | N | N | null | Keterangan |
| status | varchar(16) | Y | N | `ACTIVE` | DRAFT/ACTIVE/ARCHIVED |

#### DocComponent (existing `doc_components`)

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | number | Y | Y | auto | PK |
| name | varchar(120) | Y | Y | — | Nama unik |
| isLooping | boolean | Y | N | false | Butuh `item.*` bila true |
| tiptapJson | text | Y | N | — | ProseMirror doc + binding nodes |
| previewHtml | text | N | N | null | Cache preview |
| version | number | Y | N | 1 | Naik tiap update |

#### Reference payload shape (fix 09, sudah ada tapi diperjelas)

- `DocComponentsService.findReferences(name)` → `string[]` (`template:<name>` / `component:<name>`) — cek `schemaJson.includes("\"componentId\":\"${name}\"")` exact match.
- `DocTemplatesService.remove` → `data: { steps: number, administrations: number[] }` bila 409.
- `MasterDataService.findReferences(slug)` → `string[]` (`<ownerSlug>:<colName>` termasuk `→display`), dipakai `removeTable(slug)` → 409 `data: { references }`, `syncColumns` remove column → 409 `references`.
- Error wire: `throw createError({ statusCode: 409, message: "...", data: { references|steps|... } })` → client `error.response.data.data.references`.

## API

> MANDATORY. Mapping ke User Flow `08` + fixing 409 handling. Semua route sudah ada di 05-07 — 09 tidak menambah route, hanya memastikan **kontrak error JSON** konsisten dan **client menampilkan ReferenceList**.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/master-data` | GET / POST | JWT | `master-data:read` / `write` | List definisi paginated / Create definisi + DDL `mst_*` | Step 1-3 |
| 2 | `/api/master-data/:slug` | GET / PUT / DELETE | JWT | `read` / `write` | Detail / alter (syncColumns) / drop (409 bila ref) | Step 2,16 |
| 3 | `/api/master-data/:slug/rows` | GET / POST | JWT | `read` / `write` | Browse baris (search searchable only | sort orderable only | page/limit) / Create baris (komputasi operasi server) | Step 4-7 |
| 4 | `/api/master-data/:slug/rows/:id` | GET / PUT / DELETE | JWT | `read` / `write` | Detail/ubah/hapus baris | Step 7,16 |
| 5 | `/api/master-data/:slug/schema` | GET | JWT | `read` | Schema untuk builder Task07 (daftar tabel+kolom) | Step 10 |
| 6 | **`/api/doc-components`** | GET / POST | JWT | `component:read` / `write` | List / create Component | Step 8-9 |
| 7 | **`/api/doc-components/:id`** | GET / PUT / **DELETE (bug 409)** | JWT | `component:read` / `write` | **Detail / update (bump version) / delete (409 bila dipakai `findReferences`) — FIX utama Task09** | **Step 9,16 / ERR-05** |
| 8 | `/api/doc-templates` | GET / POST | JWT | `template:read` / `write` | List / create Template | Step 10-12 |
| 9 | `/api/doc-templates/:id` | GET / PUT / **DELETE (409)** | JWT | `template:read` / `write` | Detail / update+bump version publish / **409 bila dipakai steps** | Step 11-13,16 |
| 10 | `/api/doc-templates/:id/form` | GET | JWT | `template:read` | Auto-form schema requirement (`scanRequirements`) | Step 11 |
| 11 | `/api/doc-templates/:id/preview-pdf` | POST | JWT | `template:read` | Isi data → PDF via `pdf.service` (engine 05) | Step 11 |
| 12 | `/api/documents/preview` + `/api/documents/pdf` | POST | JWT | `preview` / `pdf` | Engine generic Task05 (Html+Pdf) | Step 11,15 |
| 13 | `/api/administrations` | GET / POST | JWT | `admin:read` / `write` | List / create Administration + steps | Step 13 |
| 14 | `/api/administrations/:id` | GET / PUT / DELETE | JWT | `admin:read` / `write` | Detail + steps mapping (`replaceSteps` DR-002) / delete explicit steps + detach docs | Step 13-14 |
| 15 | `/api/administrations/:id/runs` | GET / POST | JWT | `document:read` / `write` | List runs / Execute wizard gabungan (`executeRun` pagebreak + snapshot) | Step 15 |
| 16 | `/api/documents/:id/pdf` + `DELETE /api/documents/:id` | GET / DELETE | JWT | `document:read` | Unduh PDF run / Cancel run | Step 15 |

### Detail per Endpoint (fix 09 — error contract harus seragam)

#### Duplicate 409 — POST /api/master-data, POST /api/doc-components, POST /api/doc-templates, POST /api/administrations

- **Request**
  - Headers: `Authorization: Bearer <JWT>` (via `authHeaders()`)
  - Body: `CreateMasterTableInput` / `CreateDocComponentInput` (`name`, `tiptap_json`) / `CreateDocTemplateInput` (`name`, `code`, `schema_json`) / `CreateAdministrationInput` (`name`, `slug` optional, `steps` max20)
  - Validation Zod: `name` 1-120, `code`/`slug` regex, `tiptap_json` 1MB JSON valid, `schema_json` `DocNodeSchema`, blacklist, minimal 1 column, dll.
- **Response Success**
  - `201` `{ id, name, slug/code, ... }` (definisi) / redirect/wiring `toast Berhasil`
- **Error (seragam 09)**
  | Status | Kondisi | Body (`createError`) | UI Handling |
  |--------|---------|----------------------|-------------|
  | 400 | slug/blacklist/column dupe/Tiptap invalid/DocNode limit/status transition | `{ statusCode:400, message:"Invalid slug \"users\" (BR-001)", data: { errors: [...] } }` | Inline `NFormItem validationStatus="error"` + `NAlert` summary + focus first |
  | **409** | **Duplicate unique** (`slug`/`name`/`code`/`document_number` sudah ada) | `{ statusCode:409, message:"Slug \"pegawai\" already exists / Component \"Kop\" already exists / Document number \"SK/2026/001\" already exists (BR-006)", data:{ slug|name } }` | **`NAlert type="warning" + inline feedback + tidak Server Error`** |
  | 401 | token hilang | `{ statusCode:401, message:"Unauthorized" }` | redirect `/login` |
  | 403 | permission `requireApiAccess` fail | `{ statusCode:403, message:"Forbidden" }` | `AccessDeniedAlert` single |
- **Authentication**: JWT `requireApiAccess(event)` — RBAC `roles→permissions (methods + urls)` via `matchUrlPattern`
- **Authorization**: `method+URL` guard allow; `users→roles→permissions` eager; `Guard` allow/deny tidak enforce server

#### DELETE 409 — DELETE /api/doc-components/:id (BUG PEMICU), DELETE /api/doc-templates/:id, DELETE /api/master-data/:slug (+ syncColumns column remove)

- **Request**
  - Params: `id` numeric (`Number(getRouterParam(event,'id'))`) / `slug` string (`getRouterParam(event,'slug')`)
  - Headers: `Authorization: Bearer <JWT>`
- **Success**
  - `200` `{ id }` or `{ slug, backupPath }` (master drop after backup) → `message.success` + re-fetch list + close modal
  - Master `dropTable` → `backupPath: storage/backups/*.sqlite` + `DELETE meta CASCADE` + ActivityLog
- **Conflict 409 (fix wiring 09)**
  - **Trigger**:
    - `DocComponentsService.remove(id)` → `findReferences(name)` loops `DocTemplateSchema.find()` `schemaJson.includes("\"componentId\":\"${name}\"")` + `DocComponentSchema` `"component":"${name}"` → `refs.length>0` → `error.statusCode=409, data:{ references: ["template:SK Pengangkatan","component:Daftar"] }`
    - `DocTemplatesService.remove(id)` → `AdminStepSchema.find({where:{templateId:id}})` → `steps.length>0` → `error.statusCode=409, data:{ steps, administrations: [...] }`
    - `MasterDataService.removeTable(slug)` → `findReferences(slug)` (relation_single/multiple `target_slug === slug`) → `409 data:{ references: ["pegawai:jabatan","pegawai:jabatan→display"] }`; `syncColumns` removed column → `findColumnReferences(slug,col)` → 409
  - **Response Body (harus JSON, bukan HTML Server Error)**
    ```json
    { "statusCode": 409, "message": "Component \"Kop Surat\" is still used by: template:SK Pengangkatan, component:Daftar (409)", "data": { "references": ["template:SK Pengangkatan","component:Daftar"] } }
    { "statusCode": 409, "message": "Template \"SK\" is still used by 2 step(s) in 1 administration(s)", "data": { "steps": 2, "administrations": [5] } }
    { "statusCode": 409, "message": "Table \"pegawai\" is still referenced: pegawai:jabatan", "data": { "references": ["pegawai:jabatan"] } }
    ```
  - **Handler**: `server/api/**/ [id].delete.ts` `catch(error) { throw createError({ statusCode: error.statusCode??500, message: error.message, data: error.data }) }` — jangan `500` fallback bila 409.
  - **Client contract**: `error.response.status === 409`, `error.response.data.data.references` array, `error.response.data.message` string — `getErrorMessage` fallback + `err.data` via `createError`.
- **Other Errors**
  | Status | Kondisi | Body |
  |--------|---------|------|
  | 404 | id/slug tidak ada | `{ statusCode:404, message:"Component 99 not found" }` → `NAlert` + `NEmpty` + `Kembali` |
  | 401/403 | auth/permission | Redirect/`rbac-denied` single |
  | 500 | unexpected (DDL backup fail, Puppeteer throw tidak catch) | `{ statusCode:500, message:"Failed to generate PDF" }` → `NAlert error + Coba lagi` tanpa reset |
- **Authentication/Authorization**: sama `requireApiAccess`
- **RETRY**: `Coba lagi` → re-`$fetch` tanpa reset `search/sort/page`/`data` (prop `error` di `DataTable` + `emit('retry')`)

#### Preview PDF 500 — POST /api/doc-templates/:id/preview-pdf, POST /api/administrations/:id/runs (pdfError)

- **Request**: `PreviewPdfSchema` `{ data: Record<string,unknown>, page: {size:'A4'|'F4'|'Letter', orientation} }`
- **Response Success**: `{ url: "/api/storage/pdfs/...pdf", html, warnings, pdfError: null }` or `{ document, html, warnings, pdfError: null }`
- **Error 500 (hardened 09)**
  - `try { generatePdfFromHtml(html) } catch(e) { pdfError = e.message; /* runs tetap simpan DRAFT, preview tanpa path */ }`
  - Client: `NAlert type="error" Gagal generate PDF + Coba lagi` tanpa hapus draft; `pdfError` badge di drawer.
  - Bukan `500 Server Error` mentah — sudah catch & return `200` dengan `pdfError` field (contract runs).

## UI

> MANDATORY — Untuk task implementation, WAJIB mereferensikan hasil FASE 1 `08`. Jangan mendesain ulang dari nol.

### Referensi Design

- Design task: `tasks/08-letter-builder-ux-improvement-ui-design/README.md` — DONE + APPROVED (2026-09-14)
- Wireframe: `tasks/08-letter-builder-ux-improvement-ui-design/wireframes/` — `desktop.svg` 3462, `tablet.svg` 2502, `mobile.svg` 2310, `builder-3pane.svg` 4141, `wizard.svg` 4567, `states.svg` 5111, `empty.svg` 997, `validation.svg` 1853, `conflict.svg` 1459
- Mockup: `tasks/08-letter-builder-ux-improvement-ui-design/mockups/` + komponen Vue `app/components/features/letter-builder/` (`ReferenceList.vue` 409, `LoopingPicker.vue` `pilih semua` indeterminate, `IDRInput.vue` `Intl IDR`)
- Prototype: **Storybook** `apps/web/stories/letter-builder/*.stories.ts` (`MasterDataDefinition/MasterRowTable/RelationPicker/ComponentEditor/TemplateBuilder/AdminWizard/DocumentPreview/States/EnhancedComponents` × variants default/loading/empty/error/validation/permissionDenied/conflict/draft/invalidBinding) — `http://localhost:6006` (`LetterBuilder/*`) + `withProviders.ts` decorator `NConfigProvider` + `themeOverrides` Notion + import `../app/assets/css/main.css`
- Design tokens: `app/utils/naiveui-theme.ts` (`primary #0075de`, hover `#0069c4`, pressed `#005bab`, canvas `#f6f5f4`, card `#FFFFFF`, hairline `#e6e6e6`, Inter tracking −1px…+0.125px, radius 8/4, 12) + `app/assets/css/main.css` (`tailwindcss/theme` + `utilities`, no preflight)

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design (`08`) | Storybook (`09` regression) |
|-------|---------|-------|-----------|----------------------|-----------------------------|
| `/dashboard/master-data` | Master Definisi List | Write/Read | Tabel definisi `master_tables` + search+pagination + CTA `+ Buat Tabel` + **409 delete master** | Approved `wireframes/list.svg` + `builder-3pane.svg` | `LetterBuilder/MasterDataDefinition` + `MasterRowTable` |
| `/dashboard/master-data/create` | Definisi Builder | Write | `NDynamicInput` kolom 13 tipe + `ColumnConfigPanel` per tipe + slug live + preview DDL + **409 duplicate inline** | Approved `wireframes/form.svg` | `MasterDataDefinition` validation/empty |
| `/dashboard/master-data/:slug` | Browse Hasil `mst_*` | Read | `DataTable` dinamis per tabel + toolbar 320/160 + visibility per slug + **409 column remove** | Approved `wireframes/browse.svg` | `MasterRowTable` + `RelationPicker` |
| `modal` | Relation Picker | Read | `RelationPickerModal.vue` full (table + search all + sort tiap kolom + checkbox radio/N + pg ID) | Approved | `RelationPicker` + `States` conflict |
| `/dashboard/components` | Component List + Editor | Write | Tabel component + Tiptap `ClientOnly` + `BindingPalette` (right-click + `+ Binding` 44px fallback) + Preview Drawer 600px + **fix 409 modal** | Approved `wireframes/component.svg` | `ComponentEditor` + `DocumentPreview` |
| `/dashboard/templates` + `/:id` | Template Builder 3-pane | Write | `Library NTree \| Canvas drag-drop \| Properties NForm live` + Binding/Repeater/Condition + Looping `pilih semua` + `AutoForm` + Preview PDF + **409 delete modal** | Approved `wireframes/builder.svg` + `builder-3pane.svg` | `TemplateBuilder` / `TemplateCanvas` |
| `/dashboard/administrations` | Administrasi + Steps | Write | `step.field` NDynamic + NSelect template + mapping per requirement + steps order | Approved `wireframes/wizard.svg` | `AdminWizard` |
| `/dashboard/documents/:slug` | Wizard Hasil | Write/Read | `NSteps vertical` guided + per-step NForm + `+ Tambah Step` N + Review pagebreak + PDF gabungan + `document_number` 409 | Approved `wireframes/wizard.svg` | `AdminWizard` + `DocumentPreview` |
| `drawer` | Preview | Read | `DocumentPreviewDrawer.vue` 600px `NTabs HTML/PDF` + `NCode` + `NAlert warnings` | Approved | `DocumentPreview` states |
| `global` | Error States | All | `AccessDeniedAlert.vue` single (`data-testid=access-denied`) + `ReferenceList.vue` 409 modal + `NAlert` retry | Approved `wireframes/states.svg` + `conflict.svg` | `States` (loading/empty/error/validation/permissionDenied/conflict/draft) + `EnhancedComponents` |

### Layout

- Navigasi: **Sesuai design `08`** — sidebar `AppLayout` 220/72 (indikator aktif primary `#0075de` bar + tint `#e8f2fd`), group `Master Data (Definisi + dinamis per tabel `master_tables.name` fetch)` + `Persuratan (Component/Template/Administrasi + Dokumen per administrasi slug)` + leaf `<a href>` + `router.push` preserve native right-click (iddle `BR-004` tidak ubah layout).
- Struktur halaman: `PageShell` (`breadcrumb <a href>` + title 20px Semibold tracking −0.125px Ink + description 12px `#615d59`) → `toolbar DataTable` (search 320px `Cari...` + NSelect 160px `Semua Kolom` filterable + `Restart` Refresh `aria-label="Segarkan data"` + `Settings` visibility + `Reset`) → `konten` (tabel/form/editor/wizard) → `pagination` `Menampilkan {from}-{to} dari {total}` locale ID — padding head 16×20, body 24, radius lg12 `rounded-[12px]`, border hairline `border-[#e6e6e6]`, overflow hidden, flex-wrap responsive `column <768px`. **Tidak ada perubahan struktur di 09** — hanya wiring aksi delete ke `ReferenceList`.
- Builder 3-pane: `display:grid; grid-template-columns: 260px 1fr 320px; gap:0; height: calc(100vh - 52px - 48px)` (navbar+PageShell header) → tablet panel kanan jadi drawer `NDrawer width 320`, mobile `NTabs Library / Canvas / Properties`; canvas `bg-[#f6f5f4]` soft, cards `#ffffff` hairline + Level1 shadow, selection `ring-primary #0075de` + bg `#e8f2fd` (konsisten `08`).
- Grid & spacing: token Notion xs4→xxl32 (`gap-3 p-4` → sm12/lg24); Tailwind utilities inline (`flex gap-3 p-4 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[12px]`), `<style scoped>` hanya untuk `:deep()` override Naive UI (pola `docs/design-system.md` Implementation Notes).
- **Penyesuaian dari design `08`**: **Tidak ada redesign visual** — hanya **behavioral wiring**: `NPopconfirm` delete (`Apakah hapus "X"?`) → jika 409 → ganti `NModal` `ReferenceList` (bukan tetap `NPopconfirm`). Ini dicatat sebagai **deviasi behavior yang diperbolehkan** (bukan visual token), dengan alasan `409 informatif > generic toast`.
### Components

| Component | Lokasi (implement `09`, reuse `08` stub) | Deskripsi | Mengacu Mockup (`08`) | Wire `09` (fix 409) |
|-----------|------------------------------------------|-----------|-----------------------|---------------------|
| `MasterDataDefinitionForm.vue` (refine) | `app/components/features/master-data/` + `letter-builder/master/` (reuse) | `NDynamicInput` kolom (tambah/hapus `Add` Carbon) + `ColumnConfigPanel.vue` per tipe discriminated (options/relation/fmt/operation `evalTextOperation`) + slug live sanitize + DDL preview + badge `is_searchable/orderable` | `mockups/form.png` + `wireframes/form.svg` | + 409 duplicate `NAlert warning` + 400 discriminated inline (reuse `MasterTableForm.vue:131` pattern) |
| `MasterRowTable.vue` + `MasterRowForm.vue` (refine) | `app/components/features/master-data/` | `DataTable` dinamis per slug + Form 13 tipe (`NInput/NSelect/NDatePicker/NTimePicker/NUpload/NInputNumber IDR via IDRInput.vue`) + `master-operation.ts` preview live + `getErrorMessage` | `mockups/browse.png` + `LetterBuilder/MasterRowTable` | + 409 column delete `ReferenceList` via `MasterDataService` 409 catch |
| `MasterTableDataTable.vue` (refine) | `app/components/features/master-data/` | Tabel definisi + hapus + `useMasterDataStore.removeTable` | `MasterDataDefinition` | **FIX**: `handleDelete` catch 409 → `NModal` `ReferenceList` (refs array + `Lihat` anchor) + `NAlert warning`, bukan `message.error generic` |
| `RelationPickerModal.vue` (enhance) | `app/components/features/master-data/` + `letter-builder/common/` | `NModal width 800` + `NDataTable` + `NInput` search 320px + `NSelect` field + sort ArrowUp/Down 14px primary + checkbox radio vs multiple + footer `Batal/Pilih` + `Menampilkan` pg | `wireframes/browse.svg` picker | empty + loading + error retry reuse `getErrorMessage` |
| `ComponentEditor.vue` (enhance) | `app/components/features/persuratan/` + `letter-builder/component/` | Tiptap `ClientOnly` + `N Toolbar` + `BubbleMenu` + `BindingPalette` (contextmenu + `+ Binding` 44px) + `is_looping` → `item.*` check | `wireframes/component.svg` | preview + unsaved guard `onBeforeRouteLeave` |
| `BindingPopup.vue` / `BindingPalette.vue` | `app/components/features/persuratan/` | `NPopover/NDropdown`: `nama` + `NSelect view (text/image/component)` + `NSelect mapping (master_data:slug.field / manual / system)` → inline pill `bg-[#e8f2fd] text-[#0075de] rounded-full` | `States` binding | invalid badge merah `#EF4444` |
| `TemplateBuilder.vue` | `app/components/features/persuratan/` + `letter-builder/template/` | Wrapper 3-pane + `useBuilderStore` (blocks/selectedId/update/move/add) + drag HTML5 + keyboard Up/Down | `wireframes/builder.svg` | default/empty/selected/drag-over |
| `ComponentLibrary.vue` | `app/components/features/persuratan/` | `NTree` searchable + `NTag` version + preview hover + drag handle `h(NIcon)` | `builder-3pane.svg` | — |
| `DocumentCanvas.vue` | `app/components/features/persuratan/` | Drop zone flex-1 + `EmptyStateCard` + blocks render + selection ring `border-[#0075de]` | `builder-3pane.svg` | empty/loading/pdfError |
| `PropertyPanel.vue` | `app/components/features/persuratan/` | `NForm` live + `RepeaterEditor` + `ConditionEditor` + `DataBindingEditor` | `mockups/panel.png` | validation + 409 conflict `NAlert` |
| `RepeaterEditor.vue` + `ConditionEditor.vue` + `DataBindingEditor.vue` | `app/components/features/persuratan/` | Repeater `NSelect` tabel `mst_*` + checklist kolom + `Pilih semua`; Condition field/operator/value; Binding tabs master/manual/system | `LetterBuilder/TemplateBuilder` | — |
| `DocumentPreviewDrawer.vue` (enhance) | `app/components/features/persuratan/` | `NDrawer width 600` + `NTabs HTML/PDF` + `NScrollbar` + `NCode` + `NAlert` warning header + `Unduh PDF` pill CTA | `DocumentPreview` | warning + pdfError retry |
| `AdminWizard.vue` (enhance) | `app/components/features/persuratan/` | `NSteps vertical :current` + `NForm` per step + `+ Tambah Step` dashed + `NAlert` validation per step + footer `Simpan Draft/Finalkan` + draft banner localStorage | `wireframes/wizard.svg` | step1/2/review/validation/DRAFT + document_number 409 |
| `ReferenceList.vue` **(new, wiring utama 09)** | `app/components/features/letter-builder/ReferenceList.vue` (dari `08`) + reuse di `master-data`/`persuratan` | `NList` + `NTag 409` per reference (`Template SK memakai Component Kop` + link `Lihat` → `/dashboard/templates/:id` etc.) + `NModal` wrapper + `NAlert warning` | `mockups/409.png` + `conflict.svg` + `EnhancedComponents` | **Wired di semua DELETE 409 catch** (components, templates, master table/column) — bukan story-only |
| `IDRInput.vue` (helper) | `app/components/features/letter-builder/master/IDRInput.vue` | `NInputNumber` + `Intl.NumberFormat('id-ID', currency:'IDR')` live | `MasterRowTable` | reuse |
| `LoopingPicker.vue` | `app/components/features/letter-builder/LoopingPicker.vue` | `NCheckbox` header `Pilih semua` indeterminate + `NTransfer` like kolom checklist | `LetterBuilder/TemplateBuilder` | — |
| `AccessDeniedAlert.vue` (reuse) | `app/components/common/AccessDeniedAlert/` | Teleport body top16 right16 max448 slideIn 300ms auto 4s `data-testid=access-denied` single | `foundation/AccessDeniedAlert` | 1 event→1 feedback (hapus duplikat per halaman) |

**Library relevan & alasan (design rationale — dipertahankan dari `08`):**

| Library | Versi terkunci | Dipakai di | Alasan relevan |
|---------|----------------|-----------|----------------|
| **Tiptap** `@tiptap/vue-3` + `starter-kit` + `image/table/link/text-align/underline/placeholder` | `^3.31.3` reuse | `ComponentEditor.vue` | Inline node non-editable binding-pill, bubble menu — quill/slate ditolak (no custom node) |
| **Naive UI** `NSteps/NTree/NDynamicInput/NModal/NAlert/NEmpty/NSpin/NForm/NInput/NSelect/NDatePicker/NUpload` | `^2.44.1` | Semua | Satu design system + kanonis PageShell/DataTable/ModalCard + `NSteps` wizard + `NTree` library |
| **Tailwind v4** | `^4.3.3` | Semua | Utilities inline `bg-[#f6f5f4]` etc., no preflight, CSS-first `@theme` |
| **@vicons/carbon** `h(NIcon)` | `^0.13.0` | Icons | Konsisten 04-07 (Add/Edit/TrashCan/Search/Restart/Settings/Locked) |
| **@vueuse/core** `useStorage/useDraggable` (opsional) | `^12` (install FASE2 jika belum) | Canvas drag + localStorage visibility/draft | Helper storage/drag; fallback HTML5 `draggable` native bila ditolak — design cover both |
| **vue-draggable-plus** | `^0.6` evaluasi | Canvas reorder | Swap bila HTML5 janky — tanpa ubah `useBuilderStore` API |
| sanitize-html, Puppeteer | `^2.17.7`/`^25.10.0` | Renderer/PDF server-only | XSS + PDF reuse, tidak bundle client |

### Interaction

- Trigger: Sidebar `Master Data → Definisi` → `+ Buat Tabel` (pill primary `+ Buat` + `Add` h-render) → Definisi Form; `Browse ... → + Tambah Data`; `Component List → + Buat Component → Tiptap`; `Template Builder` drag Component dari Library → Canvas (ghost `opacity 0.5` + ring primary); Properties live (`@update:value` → `useBuilderStore`); right-click block → `BindingPalette` (atau toolbar `+ Binding` tap 44px mobile); repeater `Pilih semua` checkbox header indeterminate; wizard `NSteps` click header (hanya ke valid, `aria-current="step"`); **Delete → `NPopconfirm` → `DELETE` → 409 → ganti `NModal` `ReferenceList` (bukan toast semata)**.
- Flow: validate inline (Zod → `NFormItem feedback` + `NAlert` summary) → submit → `useMessage` toast `Berhasil` (ID) → re-fetch store → redirect/back (breadcrumb + `router.push` preserve `href`). Semua form `onSubmit preventDefault` + Enter submit (kecuali Tiptap Enter = newline).
- Konfirmasi: destruktif (hapus Master Table/Column, Component, Template, document_number dupe) → **`NPopconfirm`/`NDialog` dua langkah untuk DDL alter (ringkasan + warning backup + checkbox `Saya mengerti` required) + `ReferenceList` 409 modal bila masih dipakai**; tanpa double-confirm untuk non-destruktif (cancel wizard → single unsaved dialog).
- Navigasi balik: breadcrumb `Master Data / Pegawai` (leaf `span aria-current="page"`, others `<a href>`+preventDefault+router.push), back `ArrowLeft` → `router.back()`, modal `Esc` + overlay → close (kecuali unsaved guard → dialog), drawer `Esc` → close.
- Transisi: `usePageTransition` Anime.js `fadeInUp 250ms easeOut` untuk PageShell/card, `staggerFadeIn 50ms` rows; hormati `prefers-reduced-motion: reduce → 0.01ms` (`app/assets/css/main.css`).
- Drag & keyboard: HTML5 `draggable="true"` + `data-transfer: application/x-lb-block`; keyboard alternatif: block selected → `ArrowUp/Down` reorder (`role="list"` + `aria-grabbed`), `Enter` edit property, `Delete` hapus (confirm via `ReferenceList` bila 409).
- Prototype link: Storybook `http://localhost:6006` (`apps/web/stories/letter-builder/` 9 files) + `LetterBuilder/States Conflict409` sebagai acuan modal 409.

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe (`08`) + Storybook viewport |
|------------|----------|-----------------------------------------------|
| Desktop (≥1024px) | Builder 3-pane grid `260 \| 1fr \| 320`; toolbar flex-row; DataTable penuh; relation picker 800px; wizard `NSteps vertical` + form 2-col `grid-cols-2`; delete `ReferenceList` modal 600px centered | `wireframes/desktop.svg` + `builder-3pane.svg` |
| Tablet (768–1023px) | Builder: library `NDrawer` 260 + properties drawer 320; canvas full-width; wizard `NSteps` horizontal; DataTable kolom hide via `Settings`; modal `ReferenceList` `width 90vw` | `wireframes/tablet.svg` |
| Mobile (<768px) | Semua `grid-cols-1`; builder `NTabs Library/Canvas/Properties`; toolbar column (search full-width flex-1 min 320px wrap); modal/drawer full-width `100vw`; form label top; wizard `NSteps` vertical condensed; Tiptap toolbar scroll-x + `+ Binding` bottom fixed 44px hit; `ReferenceList` `NList` vertical | `wireframes/mobile.svg` |

### States

| State | Tampilan | Komponen Naive UI | Mengacu Mockup (`08`) + `09` wire |
|-------|----------|-------------------|-----------------------------------|
| Loading | `NSpin show` overlay + `NSkeleton` 3 baris | `NSpin`, `NSkeleton` | `mockups/loading.png` + story `loading` |
| Empty | `NEmpty description="Belum ada data"` (+ `#f6f5f4` xl16) + CTA pill `+ Buat ...` via `NDataTable #empty` single instance (Task02 single NEmpty) | `NEmpty` + `.detail-view` illustration | `mockups/empty.png` + stories `empty` |
| Error (fetch 500/network) | `NAlert type="error" closable` `Gagal memuat data` + `Coba lagi` retry emit tanpa reset `search/sort/page` (`error: string \| null` prop via DataTable slot) | `NAlert` via error slot | `mockups/error.png` + story `error` |
| Success | `useMessage().success('Berhasil')` toast `#ffffff` xl16 auto-dismiss; list re-fetch | `useMessage` | `mockups/success.png` |
| Validation 400 | Inline `NFormItem feedback` + `validationStatus="error"` + border merah + `NAlert` summary + focus jump first error | `NFormItem`, `NAlert` | `mockups/validation.png` + story `validation` + ERR-01/02 |
| Permission Denied 403 | Floating global single `AccessDeniedAlert.vue` (`NAlert error` + `Locked` h-render, `Akses Ditolak: Anda tidak memiliki izin...` ID) via `rbac-denied` event 1→1, no per-page duplicate — **hapus listener duplikat per halaman Task 08 → single listener global** | `NAlert` Teleport | `mockups/403.png` + story `permissionDenied` |
| **Conflict 409 (fix utama 09)** | **`NAlert type="warning"` `Tidak dapat menghapus — masih dipakai` + modal `ReferenceList.vue` (list `Template SK memakai Component Kop` / `pegawai:jabatan`) + `NTag 409` + link `Lihat` → route + footer `Tutup` / `Batal` | **`NAlert`, `NModal`, `NList`, `NTag`** | **`mockups/409.png` + `wireframes/conflict.svg` + story `States Conflict409` + `EnhancedComponents` 409** |
| Draft/DRAFT | Banner `NAlert type="info"` top `Draft tersimpan otomatis — Lanjutkan?` + `NSteps` highlight + localStorage draft badge | `NAlert` | `mockups/draft.png` |
| Invalid Binding | Canvas node red ring `border-[#EF4444]` + badge `Invalid` + tooltip "Kolom terhapus, pilih ulang" + Properties `NAlert` | `NTag error` + `NAlert` | `mockups/invalid-binding.png` |
| 404 Not Found | `NAlert` + `NEmpty` + `Kembali ke Master Data` button | `NAlert`, `NEmpty` | `States` notFound variant |

### Accessibility

- Keyboard: semua aksi via keyboard (Tab → `+ Buat` → form field → `Simpan` → `Coba lagi` → `ReferenceList` `Tutup`), focus trap `NModal`/`NDrawer`, `Tab` order logis, `Esc` close (404/409 modal, kecuali 409 → focus `Tutup`), wizard `NSteps` reachable (`tabindex 0` + `Enter`), canvas blocks keyboard reorder (`ArrowUp/Down`), Tiptap toolbar roving focus, min hit 44px mobile (binding button).
- ARIA: `aria-label` icon-only (`Segarkan data`, `Atur kolom`, `Tambah step`, `Tutup` ReferenceList), `aria-current="page"` breadcrumb leaf & `aria-current="step"` wizard, `aria-grabbed` draggable, `aria-invalid`+`aria-describedby` field error, live region `role="status"` toast/alert (`data-testid=access-denied` single, `data-testid=conflict-references` untuk 409 list), `aria-modal="true"` ReferenceList.
- Kontras & font: ink `#000000` pada canvas `#f6f5f4` ~18:1 AA; primary `#0075de` pada putih ~4.6:1 AA; Inter `fontFamily` `naiveui-theme.ts` + tracking eksplisit; `NTag 409` warning `#F59E0B` pada `#FFFBEB`.
- Reduced motion: semua transisi 150/250/350ms hormati `@media (prefers-reduced-motion: reduce) { animation-duration:0.01ms; transition-duration:0.01ms }` (`app/assets/css/main.css`).
- Screen reader: `label` form + `aria-label` select filter (`Semua Kolom`), live region alert/error summary + 409 list `role="list"`/`role="listitem"`, `alt` image, `aria-label` file name upload, `ReferenceList` links deskriptif (`Lihat Template SK Pengangkatan`).

### Wireframe & Mockup Deliverables

> FASE 2 tidak membuat wireframe/mockup baru — reuse FASE 1 `08`. Perubahan behavior (ReferenceList wiring) didokumentasikan di `08/wireframes/conflict.svg` + `States.stories.ts Conflict409`. Jika ada penyesuaian visual minor, catat di `Penyesuaian dari design` (di atas) dan update `mockups/409.png` (bukan redesign token).

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi (reuse 08) | SVG | `tasks/08-letter-builder-ux-improvement-ui-design/wireframes/` | DONE (08) |
| Mockup hi-fi (reuse 08) | Vue + PNG | `app/components/features/letter-builder/` + `tasks/08-.../mockups/` | DONE (08) |
| Prototype interaktif (reuse 08, regression 09) | **Storybook stories** | `apps/web/stories/letter-builder/*.stories.ts` + `EnhancedComponents` 409 | DONE (08) → regression `npm run build-storybook` di 09 |
| Wiring implementation `09` | Vue + stores | `app/pages/dashboard/components.vue`, `templates/index.vue`, `administrations.vue`, `master-data/*.vue`, `stores/{persuratan,master-data}.ts` + `ReferenceList.vue` modal | TODO (09) |
| Storybook build `09` | Static | `npm run build-storybook` (LetterBuilder 9 files tetap tampil, chunks di `storybook-static`) | TODO verify |

### Design Tokens Check

- [ ] Warna `app/utils/naiveui-theme.ts` (`primaryColor #0075de`, hover `#0069c4`, pressed `#005bab`, body `#f6f5f4`, card `#FFFFFF`, border `#e6e6e6`, `textColorBase #000000`, `borderRadius 8px`/`4px`, `fontFamily Inter`) — `NConfigProvider :theme-overrides` di Storybook decorator + `09` pages
- [ ] Typography Inter + tracking (Display 40/700/−1px, H3 20/600/−0.125px, Eyebrow 12/600/+0.125px header)
- [ ] Radius xs4 input 4px / sm5 / md8 / lg12 card(PageShell) / xl16 modal(`ReferenceList` NModal) / full pill CTA `9999px` (`+ Buat Component`)
- [ ] Spacing Tailwind xxs4→xxl32 via utilities `gap-3 p-4` (mapping Notion sm12/lg24/xl28), `app/assets/css/main.css` token `:root`
- [ ] Icon `@vicons/carbon` `h(NIcon, null, { default: () => h(IconName) })` (Add/Edit/TrashCan/Search/Restart/Settings/Locked/Warning)
- [ ] Storybook `LetterBuilder/*` + `foundation/*` tetap me-render `NConfigProvider` + `themeOverrides` (09 regression) — visual 1:1
- [ ] Reduced-motion & a11y addon pass (contrast AA, keyboard, focus trap `ReferenceList` modal)
- [ ] No `NDescriptions` — pakai `.detail-view` (di preview drawer) + `NForm` live
