## Domain

> FASE 2 — Implementation reuse domain 05-07 tanpa tabel baru (reuse `master_tables/columns`, `doc_components/templates/administrations/admin_steps/documents`, `mst_*` fisik, 9 EntitySchemas RBAC). Ditampilkan konteks untuk API/UI wiring dedicated pages + Tiptap guard + DR-002.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| MasterTable (reuse 06) | Definisi tabel DDL `mst_*` | id, name, slug, display_name, description, status `DRAFT→ACTIVE→ARCHIVED` |
| MasterColumn (reuse) | Kolom 13 tipe discriminated | id, table_id, name, display_name, type(13), config_json, is_required/orderable/searchable, sort_order |
| MasterRow (fisik `mst_*`) | Baris dinamis QueryBuilder (bukan EntitySchema) | id, kolom dinamis + created_at/updated_at |
| DocComponent (reuse 07 hardened) | Blok reusable Tiptap office-min | id, name UNIQUE, is_looping, tiptap_json 1MB + Placeholder/Highlight, preview_html, version |
| DocTemplate (reuse) | Surat JSON Tree + Tiptap embed | id, name UNIQUE, code UNIQUE `[a-z0-9-_]{2,60}`, description, schema_json DocNode, version, status `DRAFT/PUBLISHED/ARCHIVED` |
| Administration (reuse) | Definisi multi-step | id, name UNIQUE, slug UNIQUE `[a-z][a-z0-9-]{1,60}`, description |
| AdminStep (reuse) | Step → template + mapping | id, admin_id FK CASCADE, template_id FK RESTRICT, step_order UNIQUE per admin, mapping_json per-field DR-002 |
| Document (run) (reuse) | Instance wizard | id, admin_id, template_id, document_number UNIQUE NULL, data_json, rendered_html snapshot, pdf_path, status `DRAFT→FINAL→CANCELLED`, template_version |
| DocNode (reuse 05) | Node JSON Tree engine | type 18, props, children, elseChildren, depth≤10 total≤200 |

### Relationships

```text
MasterTable ──1:N── MasterColumn (CASCADE; 409 bila direferensi relation/template → BR-003)
MasterTable ──1:N── MasterRow (fisik mst_*; DROP setelah backup storage/backups/)
DocTemplate ──N:M── DocComponent (via schema_json component-ref; findReferences exact "componentId":"<name>")
Administration ──1:N── AdminStep (CASCADE; order unik INV-002; DR-002 mapping completeness per requirement)
Administration ──1:N── Document (snapshot version dikunci BR-005)
MasterColumn relation_single/multiple ──(logical FK slug)── MasterTable
DocComponent ──(Tiptap nodes)── DocRepeater/DocBinding/DocCondition (tiptap-nodes.ts hardened, configure guard)
```

### States

| Entity | State | Deskripsi | Transisi Diizinkan |
|--------|-------|-----------|--------------------|
| MasterTable | `DRAFT → ACTIVE → ARCHIVED` | Definisi → dipakai → disembunyikan | `DRAFT→ACTIVE`, `ACTIVE→ARCHIVED` (DELETE = DROP + backup) |
| DocTemplate | `DRAFT → PUBLISHED → ARCHIVED` | Draft → live → pensiun | `DRAFT→PUBLISHED` bump version → `ARCHIVED`; edit PUBLISHED schema bump |
| DocComponent | versioned | is_looping `item.*` guard + Tiptap `configure` guard | `v1→v2` tiap PUT |
| Document | `DRAFT → FINAL → CANCELLED` | Wizard draft → final → batal | `DRAFT→FINAL`, `DRAFT/FINAL→CANCELLED` |
| Administration | active | Steps + mapping DR-002 per-field | incomplete → 400 per-field |

### Domain Rules

- DR-001: Slug/kolom sanitasi server `sanitizeSlug` — klien preview tidak dipercaya.
- DR-002: `mapping_json` completeness — setiap requirement `field` dari `template.requirements` (via `GET /api/doc-templates/:id` atau `scanRequirements(schemaJson)`) harus ada di `mapping` → `missing: field` 400 `data.missingFields` per-field (polish wiring per-field highlight).
- DR-003: Operasi-teks recompute server `ExpressionService.evalTextOperation` identik preview klien.
- DR-004: Publish DocTemplate validasi DocNode depth≤10 total≤200 + BR-002 requirement lengkap.
- DR-005: Renderer pure + `sanitize-html` allowlist `https://`/`/api/storage/`/`data:image/` + escaping.
- DR-006: Tiptap `StarterKit` dkk `Node.create` valid + `configure` guard; `DocBinding` atom inline `contenteditable false` + `class doc-binding` + `DocRepeater` source=item + `DocCondition` field/operator/value.

### Invariants

- INV-001: Template `PUBLISHED` selalu lolos DocNodeSchema + BR-002; run lama reproducible via snapshot `template_version`+`rendered_html`.
- INV-002: `step_order` unik per administration; `document_number` unik bila diisi; `slug/code/name` unik.
- INV-003: `renderer.render(tree,data)` selalu HTML `<div class="doc-page">…` tidak undefined.
- INV-004: `mst_*` fisik ignore drift `isMasterPhysicalTable`.
- INV-005: Tiptap `editor` tidak pernah `undefined.configure` — guard `if (!Ext?.configure)` fallback minimal.

### Data Model

Reuse 05-07 tanpa tabel baru. Mock Storybook reuse 10.

#### DocComponent (hardened `doc_components`)

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | number | Y | Y | auto | PK |
| name | varchar(120) | Y | Y | — | Nama unik |
| isLooping | boolean | Y | N | false | Butuh `item.*` bila true |
| tiptapJson | text | Y | N | — | ProseMirror doc + `DocBinding` nodes + Placeholder 1MB |
| previewHtml | text | N | N | null | Cache `sanitize-html` |
| version | number | Y | N | 1 | Bump tiap update |

#### Administration Step Mapping (DR-002 polish)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| template_id | number | Y | FK DocTemplate RESTRICT 409 |
| step_order | number | Y | UNIQUE per admin INV-002 |
| mapping_json | Record<string, MappingEntry> | Y | `{ "letter.number": {kind:"value", ref:"800/1"} }` per-field editor, missing→per-field 400 `data.missingFields` |

## API

> MANDATORY. Mapping ke User Flow 10 + dedicated pages routing (client-only). Semua route server sudah ada di 05-07 — 11 tidak menambah route server, hanya wiring halaman baru ke endpoint existing. Validasi DR-002 `missing: field` 400 tetap.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/master-data` | GET / POST | JWT | `master-data:read/write` | List/create definisi + DDL | Step 2-4 (create page) |
| 2 | `/api/master-data/:slug` | GET / PUT / DELETE | JWT | `read/write` | Detail/alter/drop 409 | Step 5-6,22 |
| 3 | `/api/master-data/:slug/rows` | GET / POST | JWT | `read/write` | Browse/create baris | Step 7 |
| 4 | `/api/master-data/:slug/schema` | GET | JWT | `read` | Schema builder (requirements auto-fetch) | Step 16,19 |
| 5 | `/api/doc-components` | GET / POST | JWT | `component:read/write` | List/create (Tiptap guard, DR-002 N/A) | Step 8-10 dedicated create |
| 6 | `/api/doc-components/:id` | GET / PUT / DELETE | JWT | `component:read/write` | Detail/update/delete 409 (Tiptap `configure` no crash) | Step 11-12 dedicated edit |
| 7 | `/api/doc-templates` | GET / POST | JWT | `template:read/write` | List/create meta (dedicated create) | Step 13-14 |
| 8 | `/api/doc-templates/:id` | GET / PUT / DELETE | JWT | `template:read/write` | Detail/meta/protect 409 + Builder publish `status PUBLISHED` | Step 14-18 builder polish |
| 9 | `/api/doc-templates/:id/preview-pdf` | POST | JWT | `template:read` | Preview PDF reuse 05 (`pdfError` no 500 crash) | Step 17 |
| 10 | `/api/administrations` | GET / POST | JWT | `admin:read/write` | List/create + DR-002 400 `missing: field` → per-field highlight | Step 19-21 dedicated create |
| 11 | `/api/administrations/:id` | GET / PUT / DELETE | JWT | `admin:read/write` | Detail/steps DR-002 per-field `data.missingFields` (polish) | Step 22 dedicated edit |
| 12 | `/api/administrations/:id/runs` | POST | JWT | `document:write` | Wizard run + PDF gabungan `template_version` snapshot | Step 24 |
| 13 | `/api/documents/:id/pdf` | GET | JWT | `document:read` | Unduh PDF run | Step 24 |

- Validasi Zod reuse (13 tipe discriminated + `TiptapDocSchema` 1MB + `DocNodeSchema` `assertTreeLimits` + `CreateAdministrationSchema` `steps` `mapping` `DR-002`); Error 400 (`missing: field` + `data.missingFields`), 404, 409, 401/403 (`requireApiAccess` `matchUrlPattern` allow/deny), 500 PDF `pdfError` catch → `200` with `pdfError` field, not raw 500.

### Detail per Endpoint (wiring 11 — dedicated pages)

#### Dedicated create `POST /api/doc-components` (via `/dashboard/components/create` PageShell)

- **Request**
  - Headers: `Authorization: Bearer <JWT>` (`authHeaders()` / `useAuthStore.token`)
  - Body: `CreateDocComponentInput` `{ name: string 1-120 unique, is_looping: boolean, tiptap_json: Record 1MB (TiptapDocSchema + placeholder/highlight) }`
  - Validation Zod: `name` 1-120, `is_looping` → `BR-003` `item.*` required bila true, `tiptap_json` 1MB valid ProseMirror doc (hardened nodes `DocBinding` etc.)
- **Response Success**
  - `201` `{ id, name, is_looping, tiptap_json, preview_html, version:1 }` → client `navigateTo('/dashboard/components')` atau `/:id/edit` + toast `Berhasil`
  - Dedicated page `handleSave` `POST` → `useMessage.success` → redirect
- **Error (seragam 11)**
  | Status | Kondisi | Body (`createError`) | UI Handling (dedicated page) |
  |--------|---------|----------------------|------------------------------|
  | 400 | `is_looping` tanpa `item.*` (`BR-003`), `tiptap_json` invalid 1MB, `name` empty | `{ statusCode:400, message:"Looping component must contain at least one item.* binding (BR-003)", data:{ errors:[...] } }` | Inline `NFormItem validationStatus="error"` + `NAlert type="warning"` summary + focus first + `DocBinding` badge merah `#EF4444` |
  | 409 | Duplicate `name` unique | `{ statusCode:409, message:"Component \"Kop\" already exists", data:{ name } }` | `NAlert type="warning"` `Nama sudah ada (409)` + `NFormItem` error `Nama duplikat` |
  | 401/403 | auth/permission `requireApiAccess` fail | `{ statusCode:401/403, message:"Unauthorized/Forbidden" }` | `401→/login` interceptor, `403→AccessDeniedAlert` single `data-testid=access-denied` |
  | 500 | unexpected | `{ statusCode:500, message:"Failed" }` | `NAlert error + Coba lagi` tanpa reset |
- **Authentication**: JWT `requireApiAccess(event)` Bearer `roles→permissions` `methods + urls` `matchUrlPattern`
- **Authorization**: `method+URL` guard `permission allow` + `Guard` allow/deny client gating not server
- **Tiptap hardening note**: `tiptap_json` sekarang dapat mengandung nodes `placeholder/highlight` minimal — server `TiptapDocSchema` shallow validate tetap pass (hardened DR-002 N/A); client `ComponentEditor` `Placeholder.configure({ placeholder: 'Tulis konten surat...' })` guard `if (!Placeholder?.configure)` fallback.

#### Dedicated edit `PUT /api/doc-components/:id` (via `/dashboard/components/:id/edit` PageShell same layout)

- **Request**
  - Params: `id` numeric `Number(getRouterParam(event,'id'))`
  - Headers: `Authorization: Bearer <JWT>`
  - Body: `UpdateDocComponentInput` `{ name?, is_looping?, tiptap_json? }` + `version bump` server-side
  - Validation same Zod + `BR-003` + limit
- **Success**
  - `200` `{ id, name, is_looping, tiptap_json, version:2 }` → bump `version` → client `message.success Component diperbarui (versi naik)` + stay or back to list
  - Pre-filled: `GET /api/doc-components/:id` on mounted → `JSON.parse(row.tiptap_json)` → `editor.commands.setContent` guard `JSON.stringify` diff
- **Error**
  - 400 `BR-003`, 404 `Component 99 not found` → `NAlert` + `NEmpty` + `Kembali`, 409 name dupe → `NAlert warning`, 401/403 → interceptor/single
- **Tiptap guard**: `ComponentEditor` edit page sama layout as create — `initEditor` guard `try/catch` + `onBeforeUnmount` safe + `ClientOnly` #fallback; toolbar `TiptapToolbar.vue` grouped very minimum.

#### DR-002 mapping `POST /api/administrations` (via `/dashboard/administrations/create` per-field editor)

- **Request**
  - Headers: `Authorization: Bearer <JWT>`
  - Body: `CreateAdministrationInput` `{ name string 1-120 unique, slug? [a-z][a-z0-9-]{1,60} unique (auto if empty), description? string, steps: Array<{ template_id:number, step_order:number UNIQUE per admin, mapping: Record<string, MappingEntry> (`kind: "value"|"master_data"|"system", ref:string` per-field) }> max20 }`
  - Validation: `Zod discriminated` 13 tipe reuse + `CreateAdministrationSchema` `steps` `mapping` completeness `DR-002` (`server/services/administrations.service.ts:replaceSteps` checks each `template.requirements` field exists in `mapping`) → if missing → `throw createError({ statusCode:400, message:`Mapping incomplete — missing: ${missing.join(', ')} (DR-002)`, data:{ missingFields: missing } })`
  - Client wiring: `StepMappingEditor.vue` per-step auto-fetch `GET /api/doc-templates/:id` → `scanRequirements(schema)` → render rows per `field` (`field NTag` badge + `kind NSelect` + `ref NInput/NSelect`) → `buildMapping(rows)` → submit `steps.map(s=>({template_id, step_order, mapping}))` — not textarea JSON
- **Response Success**
  - `201` `{ id, name, slug, steps: [...] }` → `message.success Administrasi tersimpan` → `navigateTo('/dashboard/administrations')` + ActivityLog `ADMINISTRATION_CREATE` + menu Persuratan → `[SK Pengangkatan]`
- **Error (seragam 11 polish)**
  | Status | Kondisi | Body (`createError`) | UI Handling (per-field polish) |
  |--------|---------|----------------------|------------------------------|
  | **400 `DR-002`** | **Mapping incomplete — missing: letter.tanggal, letter.number** (`missingFields: ["letter.tanggal", "letter.number"]`) | `{ statusCode:400, message:"Mapping incomplete — missing: letter.tanggal (DR-002)", data:{ missingFields:["letter.tanggal"], missing:"letter.tanggal" } }` | **Polish Fix 11**: per-field `NFormItem validationStatus="error"` border merah `#EF4444` + `feedback "Missing: letter.tanggal (DR-002) — pilih target"` + `NAlert type="warning" Mapping incomplete — missing: letter.tanggal` summary list `data.missingFields` + `ref.focus()` first missing + `scrollIntoView({ behavior:'smooth', block:'center' })` + tooltip `"Pilih data master/manual/system untuk field ini"` + not textarea |
  | 400 | `step_order` duplicate `INV-002`, `slug` format `[a-z][a-z0-9-]{1,60}`, `name` duplicate | `{ statusCode:400/409, message:"Step order duplicate" / "Slug already exists", data:{ ... } }` | `NAlert` summary + inline `step_order` highlight |
  | 409 | Duplicate `name`/`slug` unique | `{ statusCode:409, message:"Administration \"SK\" already exists / Slug \"sk-pengangkatan\" already exists" }` | `NAlert warning Nama/Slug sudah ada (409)` + `NFormItem` error |
  | 404 | `template_id` not found | `{ statusCode:404, message:"Template 99 not found" }` | `NAlert` + `NEmpty` |
  | 401/403 | auth/permission | `401→/login`, `403 AccessDeniedAlert single` |
- **Authentication/Authorization**: same `requireApiAccess` `permission allow` `Guard` gating
- **RETRY**: per-field error not require full reset `search/sort/page`; `Coba lagi` → re-submit without reset `data`

#### Builder publish `PUT /api/doc-templates/:id status PUBLISHED` (via Builder polish `/dashboard/templates/:id` 3-pane)

- **Request**
  - Params: `id` numeric
  - Headers: Bearer
  - Body: `{ schema_json: { type:'document', children: DocNode[] }, status: 'PUBLISHED' }` (Builder `builder.toNodes()` → `schema`) + `name/code/description` optional meta
  - Validation: `DocNodeSchema` `assertTreeLimits` depth≤10 total≤200 item/level 500 + `BR-002` publish guard (semua requirement terpetakan + ≥1 blok konten + `is_looping` valid `item.*`) → `400` sorot field + tooltip `Lengkapi mapping` + version bump `BR-005`
- **Response**
  - `200` `{ id, name, code, version:2, status:'PUBLISHED', schema_json }` → `message.success Template published (versi naik)` → badge `PUBLISHED` `success` + builder `builder.load(newChildren)`
  - Error 400 `BR-002` → inline badge invalid + `NAlert` list; 409 name/code dupe → `NAlert warning`; 404 → `NEmpty` + `Kembali`; 401/403 → interceptor/single; 500 PDF `pdfError` catch → `200` with `pdfError` not raw 500
- **Tiptap polish note**: `schema_json` kini dapat dihasilkan dari `TiptapToolbar` minimal nodes (Placeholder/Highlight) — server validate pass as long as `DocNode` valid.

#### Playwright video — no API (client config)

- `apps/web/playwright.config.ts:use: { video: { mode: 'on', size: { width:1280, height:720 } }, trace: 'on-first-retry', screenshot: 'only-on-failure' }` per `https://playwright.dev/docs/videos#record-video`
- No server route — E2E `test:e2e` HEADLESS=1 `reuseExistingServer: true` `:3000` → `video.webm` artifact `test-results/**/video.webm` + `playwright-report`

## UI

> MANDATORY — Untuk implementation, WAJIB mereferensikan hasil FASE 1 `10`. Jangan mendesain ulang dari nol.

### Referensi Design

- Design task: `tasks/10-letter-builder-polish-ui-design/README.md` — TODO (wireframes 18 SVG + mockup hi-fi + prototype Storybook `apps/web/stories/letter-builder-polish/` 7 files + `TiptapToolbar` + `StepMappingEditor` polish)
- Wireframe: `tasks/10-letter-builder-polish-ui-design/wireframes/` (`desktop.svg`, `tablet.svg`, `mobile.svg`, `builder-3pane.svg`, `master-create.svg`, `master-edit.svg`, `component-create.svg`, `component-edit.svg`, `template-create.svg`, `template-edit.svg`, `administration-create.svg`, `administration-edit.svg`, `states.svg`, `validation.svg`, `conflict.svg`, `tiptap-toolbar.svg`, `tiptap-error.svg`)
- Mockup: `tasks/10-letter-builder-polish-ui-design/mockups/` + Vue `app/components/features/letter-builder-polish/` (`TiptapToolbar.vue` grouped, `StepMappingEditor.vue` per-field DR-002, `EmptyStateCard` polish) + dedicated pages stubs `app/pages/dashboard/.../create.vue` (`PageShell` same layout)
- Prototype: **Storybook** `apps/web/stories/letter-builder-polish/*.stories.ts` (`MasterDataCreatePage`, `ComponentCreatePage`, `ComponentEditPage`, `TiptapToolbar`, `TemplateBuilderPolish`, `AdministrationMapping`, `StatesPolish` × variants default/loading/empty/error/validation/permissionDenied/conflict/tiptapConfigureError/draft) — `http://localhost:6006` (`LetterBuilderPolish/*`) + `withProviders.ts` `NConfigProvider` + `themeOverrides` Notion + `import '../app/assets/css/main.css'`
- Design tokens: `app/utils/naiveui-theme.ts` (`primary #0075de`, hover `#0069c4`, pressed `#005bab`, canvas `#f6f5f4`, card `#FFFFFF`, hairline `#e6e6e6`, Inter tracking −1px…+0.125px, radius 8/4, 12) + `app/assets/css/main.css` (`tailwindcss/theme` + `utilities`, no preflight)

### Halaman

| Route (implement 11) | Halaman | Akses | Deskripsi | Status Design (10) | Storybook (11 regression) |
|------|---------|-------|-----------|--------------------|---------------------------|
| `/dashboard/master-data` | Definisi List | Write/Read | Tabel definisi `master_tables` + DataTable kanonis + CTA pill `+ Buat Tabel` → nav `/create` (not modal) | Approved `master-create.svg` + `master-edit.svg` | `LetterBuilderPolish/MasterDataCreatePage` |
| `/dashboard/master-data/create` | **Definisi Create (DEDICATED PAGE)** | Write | PageShell dedicated `Buat Tabel` + `NDynamicInput` kolom 13 tipe + slug live + preview DDL + footer `Batal | Simpan` | Approved `master-create.svg` | `MasterDataCreatePage` `create` vs `edit` same layout |
| `/dashboard/master-data/:slug/edit` | Master Edit (refine dedicated, layout same as create) | Write | PageShell `Edit: Pegawai v2` + pre-filled | Approved `master-edit.svg` | `MasterDataCreatePage` `edit` variant |
| `/dashboard/master-data/:slug` | Browse Hasil `mst_*` | Read | DataTable dinamis + toolbar 320/160 + visibility per slug | Approved `browse.svg` | `MasterRowTable` + `RelationPicker` 08 |
| `/dashboard/components` | Component List | Write | Tabel `doc_components` + CTA `+ Buat Component` → `/components/create` (not NModal) | Approved `component-create.svg` | `ComponentCreatePage` |
| `/dashboard/components/create` | **Component Create (DEDICATED PAGE, layout same)** | Write | PageShell `Buat Component` + `name + is_looping + ComponentEditor` office-min `TiptapToolbar` guarded + `ClientOnly` | Approved `component-create.svg` | `ComponentCreatePage` `default` + `tiptapConfigureError` |
| `/dashboard/components/:id/edit` | **Component Edit (DEDICATED PAGE, layout same as create, pre-filled)** | Write | PageShell `Edit: Kop Surat v1` + same `ComponentEditor` + `version bump` | Approved `component-edit.svg` | `ComponentEditPage` |
| `/dashboard/templates` | Template List | Write | Tabel + CTA `+ Buat Template` → `/templates/create` | Approved `template-create.svg` | `TemplateBuilderPolish` |
| `/dashboard/templates/create` | **Template Create (DEDICATED PAGE meta)** | Write | PageShell `Buat Template` meta `name/code/description` + validation `code` regex + footer `Batal | Simpan & Buka Builder` | Approved `template-create.svg` | `LetterBuilderPolish/TemplateBuilderPolish` `create` variant |
| `/dashboard/templates/:id` | **Builder (POLISH)** | Write | **3-pane `260|1fr|320` polish**: Library `NTree` searchable + Canvas warm `#f6f5f4` + `EmptyStateCard` + Properties live + Looping pilih semua + Preview drawer 600px tabs | Approved `builder-3pane.svg` | `TemplateBuilderPolish` |
| `/dashboard/templates/:id/edit` | Template Edit meta (DEDICATED, layout same as create) | Write | PageShell `Edit: SK Pengangkatan` meta only (bukan builder) | Approved `template-edit.svg` | `TemplateBuilderPolish` `edit` variant |
| `/dashboard/administrations` | Administrasi List | Write | Tabel + CTA `+ Buat Administrasi` → `/administrations/create` | Approved `administration-create.svg` | `AdministrationMapping` |
| `/dashboard/administrations/create` | **Administrasi Create (DEDICATED PAGE per-field DR-002)** | Write | PageShell `Buat Administrasi` + `name/slug/description` + **Steps per-field `StepMappingEditor.vue`** (bukan textarea JSON) | Approved `administration-create.svg` + `validation.svg` | `AdministrationMapping` `validation` `missing: letter.tanggal` |
| `/dashboard/administrations/:id/edit` | **Administrasi Edit (DEDICATED PAGE layout same)** | Write | Same + pre-filled `GET .../:id` steps mapping + per-field highlight | Approved `administration-edit.svg` | `AdministrationMapping` `edit` variant |
| `/dashboard/documents/:slug` | Wizard Hasil | Write/Read | `NSteps` vertical guided + per-step form + `+ Tambah Step` N + Review pagebreak + PDF gabungan | Approved `wizard.svg` | `AdminWizard` 08 + polish |
| `global` | Error States + Video | All | `AccessDeniedAlert` single `data-testid=access-denied` + `ReferenceList` 409 `data-testid=conflict-references` + `Tiptap` guard `NAlert` + video `video.webm` | Approved `states.svg`+`conflict.svg`+`tiptap-error.svg` | `StatesPolish` |

### Layout

- Navigasi: **Sesuai design 10** — sidebar `AppLayout` 220/72 active `#0075de`/`#e8f2fd`, group `Master Data` + `Persuratan` + leaf `<a href>` + `router.push` preserve native right-click; `PageShell` same structure untuk semua dedicated create/update (head `16×20` body `24` radius `12` hairline `border-[#e6e6e6]` overflow hidden, title `20px Semibold tracking -0.125px #000000`, description `12px #615d59`, breadcrumb `<a href>` + `preventDefault` + `router.push`, leaf `span aria-current="page"`).
- Struktur dedicated pages: `PageShell` → `NAlert` summary top (validation DR-002/missing, Tiptap configure error, 409 warning) → `card bg-[#ffffff] border hairline rounded-[12px] p-6 Level-1 shadow rgba(0,0,0,0.04) 0 4px 18px` → `NForm` gap `12` → rows `grid-cols-2 gap-4` desktop vs `grid-cols-1` mobile + per-field `NFormItem` → sticky footer `border-t hairline mt-6 pt-4` + `NSpace justify="end"` + `NButton` secondary `Batal` (`router.back()` / `navigateTo('/dashboard/components')`) + primary pill `9999px` `Simpan` (`#0075de` hover `#0069c4`) loading. **Dedicated create vs edit layout identik** (beda `title` `Batal` destination, `initialValues` via `GET` pre-filled, submit `POST` vs `PUT`, `version bump` toast).
- Builder 3-pane polish: `display:grid; grid-template-columns: 260px 1fr 320px; gap:0; height: calc(100vh - 52px - 48px)` (navbar 52 + PageShell head 48) → library `aside.border-r hairline bg-[#f6f5f4] p-3` + `NInput` filter `placeholder "Cari component..."` 32px + `NTree` expand default → canvas `bg-[#f6f5f4] soft p-4` flex-1 + `DocumentCanvas` card `bg-[#ffffff] hairline Level-1 rounded-[12px] p-4 min-h-[400px]` + `EmptyStateCard` illustration warm `xl16` `p-32` (#f6f5f4 bg) + Properties `aside.border-l hairline p-3 overflow-auto` `NForm` live sectioned eyebrow `11px uppercase tracking-[0.05em] #94a3b8 font-semibold`. Tablet/library collapse `NDrawer 260` trigger `Menu` 44px; mobile `NTabs Library / Canvas / Properties` + toolbar column.
- Grid & spacing: token Notion xxs4→xxl32 via Tailwind `gap-3 p-4 bg-[#f6f5f4] border-[#e6e6e6] rounded-[12px]`, `<style scoped>` hanya untuk `:deep()` override Naive UI (pola `docs/design-system.md`).
- **Penyesuaian dari design 10**: **Tidak ada redesign visual** — hanya **behavioral wiring**: `NModal` create lama (`components.vue:159` `showForm`, `templates/index.vue:149` `showCreate`, `administrations.vue:163` `showForm`) disembunyikan (default `false` + `v-if="false"` atau dihapus CTA → nav ke route), modal hanya untuk delete `ReferenceList` + `RelationPicker` & `DocumentPreviewDrawer`. `playwright.config.ts` `video: 'retain-on-failure'` → `video: 'on'` dengan `size 1280×720` + `trace: 'on-first-retry'` — ini dicatat sebagai **deviasi config yang diperbolehkan** (bukan token), alasan `record-video` per-test per user request `https://playwright.dev/docs/videos#record-video`.

### Components

| Component | Lokasi (implement 11, reuse 10 stub) | Deskripsi | Mengacu Mockup (10) | Wire 11 (fix polish) |
|-----------|--------------------------------------|-----------|---------------------|----------------------|
| `MasterDataDefinitionForm.vue` (refine → dedicated pages) | `app/components/features/letter-builder/master/` + pages `master-data/create.vue` + `[slug]/edit.vue` | `NDynamicInput` kolom + `ColumnConfigPanel` per tipe + slug live + DDL preview + badge searchable/orderable | `master-create.svg` + `master-edit.svg` | Same layout `PageShell` + `NAlert` validation |
| `ComponentEditor.vue` (hardened) | `app/components/features/persuratan/ComponentEditor.vue` (existing hardened) | Tiptap `ClientOnly` + `TiptapToolbar.vue` office-min grouped + `BubbleMenu` + `FloatingMenu` + `DocBinding` pill + `Placeholder` + `DocRepeater/Condition` + `configure` guard + `editorReady` flag | `tiptap-toolbar.svg` + `tiptap-error.svg` | `configure` guard `mod.default ?? mod` + `try/catch` + `NAlert Retry` |
| `TiptapToolbar.vue` (new extracted 11) | `app/components/features/persuratan/TiptapToolbar.vue` | Toolbar 1 baris grouped `gap-1 flex-wrap` `role="toolbar"` `aria-label="Toolbar editor"`: Text `B/I/U/S` `h(NIcon)` + Heading `NSelect H1-H3` + Align `Left/Center/Right/Justify` `NButton` + List `•/1.` + Insert `Table/Image/Link` + History `↶↷` + `+ Binding` 44px fallback | `tiptap-toolbar.svg` | Very minimum office, `isActive` ring `bg-[#e8f2fd] border-[#0075de]` |
| `StepMappingEditor.vue` (new per-field 11) | `app/components/features/persuratan/StepMappingEditor.vue` | Per-step card `border hairline rounded-[8px] p-3 bg-[#ffffff]` + header `Step 1: Template SK (NTag)` + `NSelect` template searchable filterable + per-requirement rows (`field NTag eyebrow` + `kind NSelect master_data/manual/system` + `ref NInput/NSelect` + `validationStatus="error"` per `missingFields`) + `NAlert DR-002` summary | `administration-create.svg` + `validation.svg` | `missing: letter.tanggal` highlight + `feedback` + `aria-invalid` |
| `TemplateBuilder.vue` (polish 11) | `app/components/features/persuratan/TemplateBuilder.vue` + pages builder | 3-pane wrapper + `useBuilderStore` + drag HTML5 `draggable` + keyboard Up/Down `aria-grabbed` | `builder-3pane.svg` | `260|1fr|320` polish + drag ghost `opacity 0.5` |
| `ComponentLibrary.vue` (polish) | `app/components/features/persuratan/ComponentLibrary.vue` | `NTree` searchable `NInput` 32px + `NTag` version + preview hover + drag handle `h(NIcon Add)` | `builder-3pane.svg` | Search filter `Semua` |
| `DocumentCanvas.vue` (polish) | `app/components/features/persuratan/DocumentCanvas.vue` | Drop zone flex-1 `EmptyStateCard` + blocks render live + selection ring `border-[#0075de] bg-[#e8f2fd]` + hover `Edit/Delete` | `builder-3pane.svg` | `EmptyStateCard` illustration warm |
| `PropertyPanel.vue` (polish) | `app/components/features/persuratan/PropertyPanel.vue` | `NForm` live + `RepeaterEditor` + `ConditionEditor` + `DataBindingEditor` sectioned eyebrow `11px uppercase #94a3b8` | `mockups/panel.png` | validation + 409 conflict `NAlert` |
| `EmptyStateCard.vue` (polish reuse) | `app/components/common/EmptyStateCard/` | Warm `#f6f5f4` `rounded xl16 p-32` + illustration sticker + caption `14px #615d59` + CTA pill `+ Tambah Blok` | `states.svg` | `NEmpty` via `NDataTable #empty` single |
| `DocumentPreviewDrawer.vue` (enhance) | `app/components/features/persuratan/DocumentPreviewDrawer.vue` | `NDrawer width 600` + `NTabs HTML/PDF` + `NScrollbar` + `NCode` + `NAlert warning` header + `Unduh PDF` pill | `DocumentPreview` 08 | pdfError `Coba lagi` |
| `AdminWizard.vue` (enhance) | `app/components/features/persuratan/AdminWizard.vue` | `NSteps vertical :current` + per-step `NForm` + `+ Tambah Step` dashed + draft banner `localStorage` | `wizard.svg` | step1/2/review + document_number 409 |
| `ReferenceList.vue` (reuse 09) | `app/components/features/letter-builder/ReferenceList.vue` + reuse di dedicated lists | `NList` + `NTag 409` per ref + `Lihat` anchor + `NModal` `data-testid=conflict-references` | `conflict.svg` | `isConflictError`/`getConflictReferences` |
| `AccessDeniedAlert.vue` (reuse) | `app/components/common/AccessDeniedAlert/` | Teleport top16 right16 max448 slideIn 300ms auto 4s `data-testid=access-denied` | `foundation/AccessDeniedAlert` | 1 event→1 feedback |

**Library relevan & alasan (dipertahankan 10 → 11 wiring):**

| Library | Versi | Dipakai di | Alasan relevan |
|---------|-------|------------|----------------|
| **Tiptap** `@tiptap/vue-3` + `starter-kit` + `placeholder` + `highlight` + `color`/`text-style` + `underline/link/image/table/text-align/character-count` | `^3.31.3` reuse hardened | `ComponentEditor.vue` + `TiptapToolbar.vue` | Office-min richtext: StarterKit (bold/italic/strike/code/heading/blockquote/list), Placeholder, Highlight/Color, TextAlign, Link/Image/Table, CharacterCount, BubbleMenu/FloatingMenu — referensi `https://tiptap.dev/docs/examples` very minimum. Quill/Slate ditolak binding pill. Hardening: guard `configure` undefined. |
| **Naive UI** `NForm/NInput/NSelect/NTree/NDynamicInput/NModal/NAlert/NEmpty/NSpin/NButton/NSteps/NUpload` | `^2.44.1` | Semua dedicated pages + builder + wizard | Satu design system + kanonis PageShell/DataTable/ModalCard |
| **Tailwind v4** | `^4.3.3` | Semua | Utilities inline `bg-[#f6f5f4]` etc., no preflight |
| **@vicons/carbon** `h(NIcon)` | `^0.13.0` | Icons | Konsisten (Add/Edit/TrashCan/Search/Restart/Settings/Locked/Warning) |
| **@vueuse/core** `useStorage/useDraggable` (opsional) | `^12` evaluasi 11 | Canvas drag + localStorage visibility/draft | Helper fallback HTML5 native |
| `sanitize-html` + `Puppeteer` | `^2.17.7`/`^25.10.0` | Renderer/PDF server-only | XSS + PDF reuse, tidak bundle client |
| **Playwright** `video` `trace` `screenshot` | `^1.62.1` | `playwright.config.ts` video `on` 1280×720 | `https://playwright.dev/docs/videos#record-video` per `use: { video: { mode, size } }` + trace `on-first-retry` |

### Interaction

- Trigger dedicated: List DataTable CTA `+ Buat` pill primary `Add` → `router.push('/dashboard/components/create')` (`<a href>` preserve); Edit quaternary `Edit` → `navigateTo('/dashboard/components/${row.id}/edit')`; Publish `NButton` success → `store.updateTemplate(id, { status:'PUBLISHED' })`; Delete `NPopconfirm` → `DELETE` → 409 → `NModal ReferenceList` `data-testid=conflict-references` + `NTag 409` + `Lihat` → route `search` filter. Master `+ Buat Tabel` → `/master-data/create`; `Administrasi` `+ Buat` → `/administrations/create` (per-field editor).
- Flow dedicated: `PageShell` breadcrumb `<a href>` + `preventDefault` + `router.push` → form `NForm` + `NFormItem validationStatus="error"` + `NAlert type="warning"` summary list missing per-field `DR-002` → `ref.focus()` first + `scrollIntoView` smooth → submit `POST/PUT` + `QuerySchema` Zod → `useMessage.success 'Berhasil'` (ID) → re-fetch store → `navigateTo` redirect (e.g., create Template meta → builder `/dashboard/templates/:id`; create Component → list; edit → back or stay). Semua form `onSubmit preventDefault` + Enter submit (Tiptap Enter = newline).
- Tiptap: Toolbar `NButton` grouped `gap-1 flex-wrap` `role="toolbar"` + `isActive` → `bg-[#e8f2fd] border-[#0075de]`; `BubbleMenu` selection (Bold/Italic/Link/Highlight), `FloatingMenu` empty paragraph (`+ Type / Heading / List`), right-click → `BindingPalette` (or toolbar `+ Binding` 44px mobile long-press); `Placeholder` `Tulis konten surat...` faint `#a39e98`; `DocBinding` pill `bg-[#e8f2fd] text-[#0075de] rounded-full px-2 py-1 text-xs` non-editable `contenteditable false`.
- Builder: `ComponentLibrary` `NTree` search `NInput` 32px filter → drag `Component` → Canvas ghost `opacity 0.5` + ring primary `#0075de` `border-dashed` → drop → `useBuilderStore.add(node)` → Properties live `NForm` `eyebrow` `11px uppercase #94a3b8` + `RepeaterEditor` `Pilih semua` indeterminate state (`checked all? true : some? indeterminate : false`) → `LoopingPicker` + keyboard `ArrowUp/Down` reorder `role="list" aria-grabbed` + `Enter` edit + `Delete` confirm. Preview drawer `NTabs HTML|PDF` `width 600` + `NScrollbar` + `NCode` + `NAlert warning` header (empty repeater/div-by-zero) + `Unduh PDF` pill CTA `type="primary"`.
- Konfirmasi destruktif: `NPopconfirm` (`Apakah hapus "X"?`) → `DELETE` → if 409 → `NModal ReferenceList` (list `template:SK Pengangkatan` `component:Kop` + `NTag 409` + link `Lihat` → `search` filter) + footer `Tutup`; `NDialog` 2 langkah untuk DDL alter `storage/backups/*.sqlite` + checkbox `Saya mengerti`.
- Navigasi balik: breadcrumb `Master Data / Pegawai` leaf `span aria-current="page"` others `<a href>` + `preventDefault` + `router.push`; back `ArrowLeft` → `router.back()`; modal `Esc` + overlay → close (kecuali unsaved guard → `NDialog` `Batalkan perubahan?` `onBeforeRouteLeave` + `isDirty` flag + `localStorage:letter-builder:draft:<slug>` autosave); drawer `Esc` → close.
- Transisi: `usePageTransition` Anime.js `fadeInUp 250ms easeOut` PageShell/card, `staggerFadeIn 50ms` rows; hormati `prefers-reduced-motion: reduce → 0.01ms` (`app/assets/css/main.css`).

### Responsive Behavior

| Breakpoint | Perilaku | Mengacu Wireframe (10) + Storybook viewport |
|------------|----------|---------------------------------------------|
| Desktop (≥1024px) | Dedicated pages 2-col `grid-cols-2 gap-4`; Builder 3-pane grid `260 \| 1fr \| 320`; toolbar flex-row; DataTable penuh; picker modal 800px; wizard `NSteps vertical` + form 2-col `grid-cols-2`; mapping per-field 2-col; Tiptap toolbar 1 row grouped | `desktop.svg` + `builder-3pane.svg` |
| Tablet (768–1023px) | Dedicated 1-col `grid-cols-1`; Builder library `NDrawer 260` + properties `NDrawer 320` (Menu 44px trigger); wizard `NSteps horizontal`; mapping 1-col; modal 90vw | `tablet.svg` |
| Mobile (<768px) | Semua `grid-cols-1`; builder `NTabs Library/Canvas/Properties`; toolbar column wrap + search full-width flex-1 min 320px wrap; modal/drawer `100vw` full; form label top; wizard `NSteps vertical condensed`; Tiptap toolbar `overflow-auto` scroll-x + `+ Binding` bottom fixed 44px; mapping vertical stack | `mobile.svg` |

### States

| State | Tampilan | Komponen Naive UI | Mengacu Mockup (10) + 11 wire |
|-------|----------|-------------------|--------------------------------|
| Loading (dedicated page) | `NSpin show` `Memuat...` overlay + `NSkeleton` 3 baris | `NSpin`, `NSkeleton` | `loading` story |
| Empty | `NEmpty description="Belum ada data"` (+ `#f6f5f4` xl16) + CTA pill `+ Buat ...` via `NDataTable #empty` single (Task02 single) | `NEmpty` + `EmptyStateCard` | `empty` story |
| Error (fetch 500/network) | `NAlert type="error" closable` `Gagal memuat data` + `Coba lagi` `emit('retry')` tanpa reset `search/sort/page` | `NAlert` via `DataTable` error slot | `error` story |
| **Tiptap Configure Error** | `NAlert type="error" Gagal memuat editor (configure)` + `NButton Retry` + `ClientOnly` `#fallback` `Editor dimuat di sisi klien...` 60% | `NAlert`, `ClientOnly`, `NSpin` | `tiptap-error.svg` + `StatesPolish/tiptapConfigureError` |
| Success | `useMessage().success('Berhasil')` toast `#ffffff` xl16 + list re-fetch + redirect | `useMessage` | `success` |
| Validation 400 (incl. `DR-002`) | Inline `NFormItem validationStatus="error"` + `feedback` + border merah `#EF4444` + `NAlert type="warning"` summary `missing: letter.tanggal (DR-002)` + per-field highlight + focus & scroll first | `NFormItem`, `NAlert` | `validation.svg` + `AdministrationMapping` `missing` |
| Permission Denied 403 | Floating global single `AccessDeniedAlert.vue` `NAlert error` + `Locked` `data-testid=access-denied` top16 right16 max448 slideIn 300ms auto 4s | `NAlert` Teleport | `403` |
| Conflict 409 | `NAlert warning Tidak dapat menghapus — masih dipakai` + modal `ReferenceList.vue` `data-testid=conflict-references` + `NTag 409` + `Lihat` link | `NAlert`, `NModal`, `NList`, `NTag` | `conflict.svg` + `ReferenceList` reuse 09 |
| Draft/DRAFT | Banner `NAlert info Draft tersimpan otomatis — Lanjutkan?` + `NSteps` highlight + localStorage badge | `NAlert` | `draft` |
| Invalid Binding | Canvas node red ring `border-[#EF4444]` + badge `Invalid` | `NTag error` | `invalid-binding` |
| 404 Not Found | `NAlert` + `NEmpty` + `Kembali ke ...` button `router.back()` | `NAlert`, `NEmpty` | `notFound` |

### Accessibility

- Keyboard: semua aksi via keyboard (Tab → `+ Buat` dedicated → form field → `Simpan` → `Coba lagi` → `ReferenceList Tutup` Esc), focus trap `NModal/NDrawer`, `Tab` order logis, `Esc` close (404/409 modal, kecuali unsaved guard `NDialog`), wizard `NSteps` `tabindex 0` + `Enter` + `aria-current="step"`, canvas `ArrowUp/Down` reorder `role="list" aria-grabbed`, Tiptap toolbar roving focus, min hit 44px mobile (binding 44px, toolbar button 32px + padding 8px → 40px effective).
- ARIA: `aria-label` icon-only (`Segarkan data`, `Bold`, `Tambah step`, `Tutup`), `aria-current="page"` breadcrumb leaf & `aria-current="step"` wizard, `aria-grabbed` draggable, `aria-invalid`+`aria-describedby` per-field DR-002 missing + `feedback` linked, `role="status"` live region toast/alert `data-testid=access-denied` single & `data-testid=conflict-references` list `role="list"`/`listitem` `aria-modal="true"` NModal, `role="toolbar"` `aria-label="Toolbar editor"` + `aria-label="Binding editor"`.
- Kontras & font: ink `#000000` on `#f6f5f4` 18:1 AA; primary `#0075de` on white 4.6:1 AA; Inter `fontFamily naiveui-theme.ts` + tracking −1px…+0.125px; `NTag 409` warning `#D97706` on `#FFFBEB`.
- Reduced motion: semua transisi 150/250/350ms hormati `@media (prefers-reduced-motion: reduce) { animation-duration:0.01ms; transition-duration:0.01ms }` (`app/assets/css/main.css`), Anime.js degenerate.
- Screen reader: `label` form + `aria-label` select filter `Semua Kolom`, live region alert/error summary + 409 list + per-field DR-002 `aria-describedby`, `alt` image upload + `aria-label` file name, `ReferenceList` links deskriptif (`Lihat Template SK`), Tiptap toolbar `aria-pressed` active.

### Wireframe & Mockup Deliverables

> FASE 2 tidak membuat wireframe/mockup baru — reuse FASE 1 `10`. Perubahan behavioral (dedicated pages routing + Tiptap guard + builder polish + DR-002 per-field + video config) didokumentasikan di `10/wireframes/` + `stories/letter-builder-polish/` + stories regression `LetterBuilderPolish/*`. Jika ada penyesuaian visual minor, catat di `Penyesuaian dari design`.

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi (reuse 10) | SVG | `tasks/10-letter-builder-polish-ui-design/wireframes/` | DONE (10) |
| Mockup hi-fi (reuse 10) | Vue + PNG | `app/components/features/letter-builder-polish/` + `tasks/10-.../mockups/` | DONE (10) |
| Prototype interaktif (reuse 10, regression 11) | **Storybook stories** | `apps/web/stories/letter-builder-polish/*.stories.ts` 7 files + `apps/web/stories/letter-builder/*.stories.ts` 08 | DONE (10) → regression `npm run build-storybook` di 11 |
| Wiring implementation 11 | Vue pages dedicated + `TiptapToolbar.vue` + `StepMappingEditor.vue` + `playwright.config.ts` video `on` | `app/pages/dashboard/components/create.vue` + `components/[id]/edit.vue` + `templates/create.vue` + `templates/[id].vue` polish + `templates/[id]/edit.vue` + `administrations/create.vue` + `administrations/[id]/edit.vue` + `app/components/features/persuratan/ComponentEditor.vue` hardened + `TiptapToolbar.vue` + `StepMappingEditor.vue` + `playwright.config.ts` | TODO (11) |
| Storybook build 11 | Static | `npm run build-storybook` (LetterBuilderPolish 7 files + LetterBuilder 9 files + foundation 3 files tetap tampil, chunks di `storybook-static`) | TODO verify |
| Video artifacts | `video.webm` | `test-results/**/video.webm` + `playwright-report` (`https://playwright.dev/docs/videos#record-video`) | TODO verify |

### Design Tokens Check

- [ ] Warna `app/utils/naiveui-theme.ts` (`primaryColor #0075de`, hover `#0069c4`, pressed `#005bab`, body `#f6f5f4`, card `#FFFFFF`, border `#e6e6e6`, text `#000000`, radius `8px`/`4px`, font `Inter`) — `NConfigProvider :theme-overrides` di Storybook + `11` dedicated pages
- [ ] Typography Inter + tracking (Display 40/700/−1px, H3 20/600/−0.125px pageShell title, Eyebrow 12/600/+0.125px)
- [ ] Radius xs4 input 4px / sm5 / md8 / lg12 card(PageShell) / xl16 modal(`ReferenceList` NModal) / full pill CTA `9999px` (`+ Buat Component`)
- [ ] Spacing Tailwind xxs4→xxl32 via `gap-3 p-4`
- [ ] Icon `@vicons/carbon` `h(NIcon, null, { default: () => h(IconName) })` (Add/Edit/TrashCan/Search/Restart/Settings/Locked/Warning/TextAlignCenter etc.)
- [ ] Storybook `LetterBuilderPolish/*` + `LetterBuilder/*` + `foundation/*` tetap me-render `NConfigProvider` + `themeOverrides` (11 regression) — visual 1:1
- [ ] Reduced-motion & a11y addon pass (contrast AA, keyboard, focus trap ReferenceList + Tiptap toolbar)
- [ ] No `NDescriptions` — pakai `.detail-view` + `NForm` live

