## Domain

> FASE 1 — UI Design. Domain reuse 05-07 tanpa tabel baru (reuse `master_tables/columns`, `doc_components/templates/administrations/admin_steps/documents`, `mst_*` fisik, 9 EntitySchemas RBAC). Ditampilkan konteks untuk mockup & Storybook data.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| MasterTable (reuse 06) | Definisi tabel DDL `mst_*` | id, name, slug, display_name, description, status `DRAFT→ACTIVE→ARCHIVED` |
| MasterColumn (reuse) | Kolom 13 tipe discriminated | id, table_id, name, display_name, type(13), config_json, is_required/orderable/searchable, sort_order |
| MasterRow (fisik `mst_*`) | Baris dinamis QueryBuilder | id, kolom dinamis + created_at/updated_at |
| DocComponent (reuse 07) | Blok reusable Tiptap hardened | id, name UNIQUE, is_looping, tiptap_json (1MB), preview_html, version |
| DocTemplate (reuse) | Surat JSON Tree + Tiptap embed | id, name UNIQUE, code UNIQUE `[a-z0-9-_]{2,60}`, description, schema_json DocNode, version, status `DRAFT/PUBLISHED/ARCHIVED` |
| Administration (reuse) | Definisi multi-step | id, name UNIQUE, slug UNIQUE `[a-z][a-z0-9-]{1,60}`, description |
| AdminStep (reuse) | Step → template + mapping | id, admin_id FK CASCADE, template_id FK RESTRICT, step_order UNIQUE per admin, mapping_json (per-field DR-002) |
| Document (run) (reuse) | Instance wizard | id, admin_id, template_id, document_number UNIQUE NULL, data_json, rendered_html snapshot, pdf_path, status `DRAFT→FINAL→CANCELLED`, template_version |
| DocNode (reuse 05) | Node JSON Tree engine | type 18, props, children, elseChildren, depth≤10 total≤200 |

### Relationships

```text
MasterTable ──1:N── MasterColumn (CASCADE; hapus tolak 409 bila direferensi relation/template → BR-003)
MasterTable ──1:N── MasterRow (fisik mst_*; DROP setelah backup storage/backups/)
DocTemplate ──N:M── DocComponent (via schema_json component-ref; findReferences exact "componentId":"<name>")
Administration ──1:N── AdminStep (CASCADE; order unik INV-002; DR-002 mapping completeness per requirement)
Administration ──1:N── Document (snapshot version dikunci BR-005)
MasterColumn relation_single/multiple ──(logical FK slug)── MasterTable
DocComponent ──(Tiptap nodes)── DocRepeater/DocBinding/DocCondition (custom nodes di tiptap-nodes.ts)
```

### States

| Entity | State | Deskripsi | Transisi Diizinkan |
|--------|-------|-----------|--------------------|
| MasterTable | `DRAFT → ACTIVE → ARCHIVED` | Definisi → dipakai → disembunyikan | `DRAFT→ACTIVE`, `ACTIVE→ARCHIVED` (DELETE = DROP + backup) |
| DocTemplate | `DRAFT → PUBLISHED → ARCHIVED` | Draft → live → pensiun | `DRAFT→PUBLISHED` naik version → `ARCHIVED`; edit PUBLISHED schema bump |
| DocComponent | versioned | Tiptap `configure` guard; is_looping `item.*` | `v1→v2` tiap update |
| Document | `DRAFT → FINAL → CANCELLED` | Wizard draft → final → batal | `DRAFT→FINAL`, `DRAFT/FINAL→CANCELLED` |
| Administration | active | Steps + mapping DR-002 | mapping incomplete → 400 per-field |

### Domain Rules

- DR-001: Slug/kolom sanitasi server `sanitizeSlug` — klien preview UX tidak dipercaya (reuse 06).
- DR-002: `mapping_json` completeness — setiap requirement `field` dari `template.requirements` harus ada di `mapping` → `missing: field` 400 per-field (polish: UX per-field highlight, bukan textarea).
- DR-003: Nilai operasi-teks recompute server `ExpressionService.evalTextOperation` identik preview klien.
- DR-004: Publish DocTemplate validasi DocNode depth≤10 total≤200 + BR-002 requirement lengkap.
- DR-005: Renderer pure + `sanitize-html` allowlist `https://`/`/api/storage/`/`data:image/` + escaping.
- DR-006: Tiptap `StarterKit` dkk harus `Node.create` valid + `configure` guard; `DocBinding` atom inline `contenteditable false` + class `doc-binding`.

### Invariants

- INV-001: Template `PUBLISHED` selalu lolos DocNodeSchema + BR-002; run lama reproducible via snapshot `template_version`+`rendered_html`.
- INV-002: `step_order` unik per administration; `document_number` unik bila diisi; `slug/code/name` unik.
- INV-003: `renderer.render(tree,data)` selalu HTML `<div class="doc-page">…` tidak undefined.
- INV-004: `mst_*` fisik ignore drift `isMasterPhysicalTable`.
- INV-005: Tiptap `editor` tidak pernah `undefined.configure` — guard `if (!Ext)` fallback minimal.

### Data Model

Reuse 05-07 tanpa tabel baru. Mock Storybook:

#### DocComponent (hardened)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Y | PK |
| name | string | Y | `Kop Surat` UNIQUE |
| is_looping | boolean | Y | `false` → wajib `item.*` bila true |
| tiptap_json | JSON | Y | ProseMirror doc + `DocBinding` nodes `{type:'docBinding', attrs:{name:'kop.nama', view:'text'}}` 1MB |
| preview_html | string | N | Cache `sanitize-html` |
| version | number | Y | 1→2 bump |

#### Administration Step Mapping (DR-002 polish)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| template_id | number | Y | FK DocTemplate RESTRICT 409 |
| step_order | number | Y | UNIQUE per admin INV-002 |
| mapping_json | Record<string, MappingEntry> | Y | `{ "letter.number": {kind:"value", ref:"800/1"} }` — per-field editor, missing→per-field error |

## API

> FASE 1 — N/A endpoint baru. Design mengacu endpoint existing 05-07 sebagai `Flow → API Mapping` wiring ke dedicated pages. FASE 2 tidak menambah route API — hanya route halaman.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/master-data` | GET/POST | JWT | `master-data:read/write` | List/create definisi + DDL | Step 2-4 |
| 2 | `/api/master-data/:slug` | GET/PUT/DELETE | JWT | `read/write` | Detail/alter/drop 409 | Step 5-6,20 |
| 3 | `/api/master-data/:slug/rows` | GET/POST | JWT | `read/write` | Browse/create baris | Step 7 |
| 4 | `/api/master-data/:slug/schema` | GET | JWT | `read` | Schema builder 07 | Step 16,19 |
| 5 | `/api/doc-components` | GET/POST | JWT | `component:read/write` | List/create (Tiptap guard) | Step 8-10 |
| 6 | `/api/doc-components/:id` | GET/PUT/DELETE | JWT | `component:read/write` | Detail/update/delete 409 | Step 11-12 |
| 7 | `/api/doc-templates` | GET/POST | JWT | `template:read/write` | List/create meta | Step 13-14 |
| 8 | `/api/doc-templates/:id` | GET/PUT/DELETE | JWT | `template:read/write` | Detail/meta/protect 409 | Step 14-18 |
| 9 | `/api/doc-templates/:id/preview-pdf` | POST | JWT | `template:read` | Preview PDF reuse 05 | Step 17 |
| 10 | `/api/administrations` | GET/POST | JWT | `admin:read/write` | List/create + DR-002 400 per-field | Step 19-20 |
| 11 | `/api/administrations/:id` | GET/PUT/DELETE | JWT | `admin:read/write` | Detail/steps DR-002 | Step 21 |
| 12 | `/api/administrations/:id/runs` | POST | JWT | `document:write` | Wizard run + PDF | Step 22 |

- Validasi Zod reuse (13 tipe discriminated + TiptapDocSchema 1MB + DocNode limits + mapping DR-002); Error 400/404/409/401/403/500 seragam; Auth `requireApiAccess` + guard allow/deny.

## UI

> MANDATORY — 10 sub-bagian wajib + deliverables. Prototype **Storybook-First** langsung di project (bukan Figma-only). Token `app/utils/naiveui-theme.ts` Notion (primary `#0075de`/`#0069c4`/`#005bab`, canvas `#f6f5f4`/`#ffffff`, hairline `#e6e6e6`, Inter tracking −1px…+0.125px, radius xs4/sm5/md8/lg12/xl16/full).

### Halaman

| Route (polish) | Halaman | Akses | Deskripsi | Wireframe Ref |
|----------------|---------|-------|-----------|---------------|
| `/dashboard/master-data` | Definisi List | Write/Read | Tabel definisi `master_tables` + DataTable kanonis + CTA pill `+ Buat Tabel` → nav `/create` | `wireframes/master-list.svg` |
| `/dashboard/master-data/create` | **Definisi Create (DEDICATED PAGE baru)** | Write | PageShell dedicated: breadcrumb `Dashboard / Master Data / Buat` + title `Buat Tabel` 20px Semibold + `NDynamicInput` kolom 13 tipe + config panel + slug live + preview DDL + footer `Batal | Simpan` | `wireframes/master-create.svg` + desktop.svg |
| `/dashboard/master-data/:slug` | Browse Hasil | Read | DataTable dinamis per tabel + toolbar 320/160 + visibility per slug | `wireframes/browse.svg` |
| `/dashboard/master-data/:slug/edit` | Master Edit (refine) | Write | PageShell same layout as create (title `Edit: Pegawai v2`) | `wireframes/master-edit.svg` |
| `/dashboard/components` | Component List | Write | Tabel component + CTA `+ Buat Component` → `/create` | `wireframes/component-list.svg` |
| `/dashboard/components/create` | **Component Create (DEDICATED PAGE baru)** | Write | PageShell: `name + is_looping + ComponentEditor` office-min toolbar + `BubbleMenu` + `+ Binding` fallback 44px + footer `Batal | Simpan` | `wireframes/component-create.svg` |
| `/dashboard/components/:id/edit` | **Component Edit (DEDICATED PAGE baru, layout sama dengan create)** | Write | Same PageShell + pre-filled + `configure` guard + `ClientOnly` fallback | `wireframes/component-edit.svg` |
| `/dashboard/templates` | Template List | Write | Tabel template + CTA `+ Buat Template` → `/create` + actions `Publish/Delete` `ReferenceList` | `wireframes/template-list.svg` |
| `/dashboard/templates/create` | **Template Create (DEDICATED PAGE baru)** | Write | PageShell form meta `name/code/description` + validation inline + `code` regex | `wireframes/template-create.svg` |
| `/dashboard/templates/:id` | **Builder (POLISH)** | Write | **3-pane `260|1fr|320` polish**: Library `NTree` searchable + Canvas warm + EmptyStateCard + Properties live + Looping pilih semua + Preview drawer 600px tabs | `wireframes/builder-3pane.svg` + desktop.svg |
| `/dashboard/templates/:id/edit` | Template Edit meta (DEDICATED) | Write | Same layout as `create` (meta only) | `wireframes/template-edit.svg` |
| `/dashboard/administrations` | Administrasi List | Write | Tabel + CTA `+ Buat Administrasi` → `/create` | `wireframes/administrations-list.svg` |
| `/dashboard/administrations/create` | **Administrasi Create (DEDICATED PAGE baru)** | Write | PageShell: `name/slug/description` + **Steps mapping per-field editor** (bukan textarea JSON) + `NDynamicInput` steps + per-field `NSelect` | `wireframes/administration-create.svg` |
| `/dashboard/administrations/:id/edit` | **Administrasi Edit (DEDICATED PAGE baru, layout sama)** | Write | Same + pre-filled + DR-002 per-field highlight | `wireframes/administration-edit.svg` |
| `/dashboard/documents/:slug` | Wizard Hasil | Write/Read | `NSteps` vertical guided + per-step form + `+ Tambah Step` N + Review pagebreak + PDF gabungan | `wireframes/wizard.svg` |
| `drawer` | Preview | Read | `DocumentPreviewDrawer.vue` 600px + `NTabs HTML/PDF` + `NCode` + `NAlert` warnings | `stories/letter-builder-polish/Preview` |
| `modal` | ReferenceList 409 | All | `ReferenceList.vue` modal `data-testid=conflict-references` + `NTag 409` + `Lihat` | `wireframes/conflict.svg` |

### Layout

- Navigasi: sidebar `AppLayout` 220/72 (indikator aktif primary `#0075de` bar + tint `#e8f2fd`), group `Master Data (Definisi + dinamis per tabel)` + `Persuratan (Component/Template/Administrasi + Dokumen per administrasi)` + leaf `<a href>` + `router.push` preserve native right-click. Top AppShell row dipertahankan.
- Struktur dedicated pages: `PageShell` (`breadcrumb <a href>` + `preventDefault` + `router.push`, leaf `span aria-current="page"`, title `20px Semibold tracking -0.125px Ink #000000`, description `12px #615d59` `font-medium`, actions slot `Batal` secondary + `Simpan` primary pill `9999px`) → `card` (`bg-[#ffffff]` hairline `border-[#e6e6e6]` radius `lg12` padded `24` Level-1 shadow `rgba(0,0,0,0.04) 0 4px 18px`) → `NForm` (gap `12`) → `NAlert` summary top bila validation/DR-002 → footer sticky `border-t hairline` + `NSpace justify="end"` + 2 buttons. Semua dedicated create/update **layout identik** (beda hanya `title`, `breadcrumbs`, `initialValues`, `submit endpoint`).
- Builder 3-pane polish: wrapper `display:grid; grid-template-columns: 260px 1fr 320px; gap: 0; height: calc(100vh - 52px - 48px)` (navbar 52 + PageShell head 48) → library `aside.border-r.hairline.bg-[#f6f5f4].p-3` + `NTree` + search `NInput` 32px + canvas `bg-[#f6f5f4] soft p-4` flex-1 + `DocumentCanvas` card `bg-[#ffffff] hairline Level-1` + `EmptyStateCard` illustration warm `xl16` padded `32` → properties `aside.border-l.hairline.p-3.overflow-auto`. Tablet `768-1023`: library collapse ke `NDrawer 260` trigger `Menu` icon 44px; properties jadi `NDrawer 320` kanan. Mobile `<768`: builder jadi `NTabs Library / Canvas / Properties` + toolbar column + modal full-width `100vw` + Tiptap toolbar scroll-x + `+ Binding` fixed bottom.
- Grid & spacing: token Notion xs4×xs8×sm12×md16×lg24×xl28×xxl32 (gap form 12, section 28-32 via whitespace, bukan rules); Tailwind utilities inline (`flex gap-3 p-4 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[12px]`), `<style scoped>` hanya untuk `:deep()` override Naive UI.

### Components

| Component | Lokasi (rencana polish) | Deskripsi | State Variant |
|-----------|------------------------|-----------|---------------|
| `MasterDataDefinitionForm.vue` (refine → dedicated pages) | `app/components/features/letter-builder/master/` + `app/pages/dashboard/master-data/create.vue` + `edit.vue` | `NDynamicInput` kolom (Add Carbon) + `ColumnConfigPanel.vue` per tipe discriminated + slug live + DDL preview + badge searchable/orderable | default, validation ERR-01, destruktif confirm, dedicated-page header |
| `MasterRowTable.vue` + `MasterRowForm.vue` (refine) | `app/components/features/letter-builder/master/` | DataTable dinamis + Form 13 tipe (`NInput/NSelect/NDatePicker/NUpload/NInputNumber IDRInput`) + `master-operation.ts` preview | default, loading, empty CTA, validation |
| `ComponentEditor.vue` (hardened) | `app/components/features/persuratan/ComponentEditor.vue` (existing hardened) + `app/pages/dashboard/components/create.vue` + `[id]/edit.vue` | Tiptap `ClientOnly` + office-min toolbar grouped (see FR-008) + `BubbleMenu` + `FloatingMenu` + `BindingPalette` (right-click + `+ Binding` 44px) + `DocBinding` atom pill + `Placeholder` `Tulis konten surat...` | default, `configure` guard error (`NAlert` + Retry), is_looping validation, loading `NSpin`, empty `ClientOnly fallback` |
| `TiptapToolbar.vue` (new extracted) | `app/components/features/persuratan/TiptapToolbar.vue` | Toolbar office-min 1 baris grouped: Text `B/I/U/S` + Heading `NSelect H1-H3` + Align `Left/Center/Right/Justify` + List `•/1.` + Insert `Table/Image/Link` + History `↶/↷`; `h(NIcon)` Carbon; overflow scroll-x mobile | default, disabled `!editorReady`, active `isActive` ring primary |
| `BindingPalette.vue` / `BindingPopup.vue` (polish) | `app/components/features/persuratan/` | `NPopover/NDropdown`: `name NInput` + `view NSelect (text/image/component)` + `target NSelect` master_data/manual/system → inline pill `bg-[#e8f2fd] text-[#0075de] rounded-full px-2 py-1 text-xs` | default, invalid badge merah `#EF4444` |
| `TemplateBuilder.vue` (polish) | `app/components/features/persuratan/TemplateBuilder.vue` wrapper + pages builder | 3-pane wrapper + `useBuilderStore` (blocks/selectedId/update/move/add) + drag HTML5 + keyboard Up/Down | default, empty canvas `EmptyStateCard`, selected ring, drag-over `border-dashed #0075de` |
| `ComponentLibrary.vue` (polish) | `app/components/features/persuratan/ComponentLibrary.vue` | `NTree` searchable (NInput filter 32px) + `NTag` version + preview hover card + drag handle `h(NIcon, Add)` | default, empty `NEmpty`, filtered |
| `DocumentCanvas.vue` (polish) | `app/components/features/persuratan/DocumentCanvas.vue` | Drop zone flex-1 + `EmptyStateCard` (`NEmpty` + `+ Tambah Blok` pill + illustration `#f6f5f4` xl16) + blocks render live + selection `ring-[#0075de] bg-[#e8f2fd]` + hover `Edit/Delete` `NButton` quaternary | default, empty, loading preview, pdfError |
| `PropertyPanel.vue` (polish) | `app/components/features/persuratan/PropertyPanel.vue` | `NForm` live + header `eyebrow 11px uppercase #94a3b8 letter-spacing 0.05em` + `RepeaterEditor` + `ConditionEditor` + `DataBindingEditor` sectioned | default, validation, 409 conflict `NAlert` |
| `RepeaterEditor.vue` + `ConditionEditor.vue` + `DataBindingEditor.vue` (polish) | `app/components/features/persuratan/` | Repeater: `NSelect` tabel `mst_*` + checklist kolom + header `Pilih semua` indeterminate; Condition: `field/operator/value` selects; Binding: tabs master/manual/system | default, empty source warning `NAlert info` |
| `StepMappingEditor.vue` (new replacing textarea) | `app/components/features/persuratan/StepMappingEditor.vue` | Per-step card `border hairline rounded-[8px] p-3` + header `Step 1: Template SK` + `NSelect` template searchable + **per-requirement rows** (`field` `NTag` badge + `kind` `NSelect` + `ref` `NInput/NSelect` + `feedback` missing) + `NAlert` DR-002 summary | default, valid, `missing: field` error (highlight merah `border-[#EF4444]` + `aria-invalid`), empty template `NEmpty` |
| `DocumentPreviewDrawer.vue` (enhance) | `app/components/features/persuratan/` | `NDrawer width 600` + `NTabs HTML/PDF` + `NScrollbar` + `NCode` preview + `NAlert warning` header + `Unduh PDF` pill CTA | default, html, pdf loading `NSpin`, pdfError retry |
| `AdminWizard.vue` (enhance) | `app/components/features/persuratan/AdminWizard.vue` | `NSteps vertical :current` + per-step `NForm` + `+ Tambah Step` dashed w-full + `NAlert` validation per step + footer `Simpan Draft/Finalkan` + draft banner `localStorage` | default, step1, step2, review, validation, DRAFT banner |
| `ReferenceList.vue` (reuse) | `app/components/features/letter-builder/ReferenceList.vue` | `NList` + `NTag 409` per ref + `Lihat` anchor + `NModal` wrapper `aria-modal` + `data-testid=conflict-references` | default |
| `EmptyStateCard.vue` (polish) | `app/components/common/EmptyStateCard/` | Card warm `#f6f5f4` `rounded xl16 p-32` + illustration sticker palette + caption `Body 14 #615d59` + CTA pill `+ Buat ...` | empty |
| `AccessDeniedAlert.vue` (reuse) | `app/components/common/AccessDeniedAlert/` | Teleport body top16 right16 max448 slideIn 300ms auto 4s `data-testid=access-denied` | single |

**Library relevan & alasan (polish — diperkaya dari 08):**

| Library | Versi | Dipakai di | Alasan relevan |
|---------|-------|------------|----------------|
| **Tiptap** `@tiptap/vue-3` + `starter-kit` + `extension-placeholder` + `extension-highlight` + `extension-color` + `extension-text-style` + `extension-image/table/link/text-align/underline/character-count` | `^3.31.3` reuse hardened | `ComponentEditor.vue` + `TiptapToolbar.vue` | Office-min richtext: StarterKit (bold/italic/strike/code/heading/blockquote/list), Placeholder `Tulis...`, Highlight/Color untuk emphasis, TextAlign untuk align, Table resizable, Image/Link, Underline, CharacterCount, BubbleMenu/FloatingMenu — referensi `https://tiptap.dev/docs/examples` (Typography, Placeholder, Bubble Menu, Floating Menu, Highlight, Collaboration). Quill/Slate ditolak: API custom node binding tidak natural Tiptap ProseMirror. Hardening: guard `configure` undefined. |
| **Naive UI** `NDataTable/NForm/NInput/NSelect/NDatePicker/NUpload/NDynamicInput/NSteps/NTree/NDrawer/NModal/NPopover/NTag/NAlert/NEmpty/NSpin/NSkeleton/NScrollbar/NTabs/NCode` | `^2.44.1` existing | Semua dedicated pages + builder + wizard | Satu design system token Notion + kanonis PageShell/DataTable/ModalCard; `NSteps` wizard, `NTree` library, `NDynamicInput` kolom, `NUpload` dragger, `NDatePicker` `m-d-Y`. |
| **Tailwind v4** utilities | `^4.3.3` | Semua | CSS utama `tailwindcss/theme` + `utilities` no preflight; spacing/grid/responsive inline |
| **@vicons/carbon** `h(NIcon)` | `^0.13.0` | Icons | Konsisten 04-07 (Add/Edit/TrashCan/Search/Restart/Settings/Locked/Warning/Checkmark/TextAlign*) |
| **@vueuse/core** `useStorage/useDraggable` (opsional) | `^12` (install FASE2 jika belum) | Canvas drag + localStorage visibility/draft | Helper storage/drag fallback HTML5 native |
| `sanitize-html` + `Puppeteer` | `^2.17.7`/`^25.10.0` | Renderer/PDF server-only | XSS + PDF reuse, tidak bundle client |

### Interaction

- Trigger dedicated pages: List `DataTable` → CTA `+ Buat Component` pill primary `Add` h-render → `router.push('/dashboard/components/create')` (`<a href>` preserve right-click/Ctrl+click); Row `Edit` quaternary `Edit` → `navigateTo(/dashboard/components/:id/edit)`; `Publish`/`Delete` tetap di list; `Master Data` `+ Buat Tabel` → `/master-data/create`; `Administrasi` `+ Buat` → `/administrations/create`; `Template` `+ Buat` → `/templates/create`. Semua trigger memakai `NButton` pill `rounded-full` primary `#0075de` (`hover #0069c4` `pressed #005bab`).
- Flow dedicated: Validate inline (Zod → `NFormItem feedback` + `validationStatus="error"` + `NAlert type="warning"` summary list missing per-field) → `focus` first error `ref.focus()` + `scrollIntoView({ behavior: 'smooth', block: 'center' })` → submit `defineEventHandler` + `QuerySchema` → `useMessage.success 'Berhasil'` (ID) → `re-fetch` store → `redirect` via `navigateTo` (breadcrumb back preserve `href`). Semua form `onSubmit preventDefault` + Enter submit (kecuali Tiptap Enter = newline + `Shift+Enter` break).
- Konfirmasi destruktif: `NPopconfirm` (`Apakah hapus "X"?`) → `DELETE` → jika 409 → ganti `NModal ReferenceList` (bukan toast); `NAlert warning` header `Tidak dapat menghapus — masih dipakai` + `NList` `data-testid=conflict-references` + `NTag 409` per item + `Lihat` secondary → `Tutup`. DDL alter tetap `NDialog` dua langkah ringkasan + checkbox `Saya mengerti`.
- Navigasi balik dedicated: breadcrumb leaf `span aria-current="page"`, others `<a href>` + `preventDefault` + `router.push` (native right-click preserved); back `NButton ArrowLeft` → `router.back()`; modal `Esc` + overlay → close (kecuali unsaved guard → `NDialog` confirm `Batalkan perubahan?` `onBeforeRouteLeave`).
- Tiptap interaction: Toolbar `NButton` grouped `role="toolbar"` + `aria-label="Toolbar editor"` + active state `isActive` → `bg-[#e8f2fd] border-[#0075de]`; `BubbleMenu` muncul saat selection (`Bold/Italic/Link`), `FloatingMenu` di empty paragraph (`+ Tipe / Heading / List`); right-click block → `BindingPalette` (atau toolbar `+ Binding` 44px hit di mobile long-press); repeater `Pilih semua` checkbox header `indeterminate` (`checked ? all : some → indeterminate`); wizard `NSteps` click header hanya ke valid step + `aria-current="step"`.
- Transisi/animasi: `usePageTransition` Anime.js `fadeInUp 250ms easeOut` untuk PageShell/card, `staggerFadeIn 50ms` rows; hormati `prefers-reduced-motion: reduce → 0.01ms` (`app/assets/css/main.css` `@media (prefers-reduced-motion: reduce)`).

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Dedicated pages form 2-col `grid-cols-2 gap-4`; Builder 3-pane grid `260 \| 1fr \| 320`; toolbar flex-row; DataTable penuh; relation picker modal 800px; wizard `NSteps vertical` + form 2-col; mapping editor per-field 2-col; Tiptap toolbar 1 row grouped | `wireframes/desktop.svg` + `wireframes/builder-3pane.svg` |
| Tablet (768–1023px) | Dedicated pages 1-col `grid-cols-1`; Builder library `NDrawer 260` + properties `NDrawer 320` (trigger `Menu` 44px); wizard `NSteps horizontal`; DataTable kolom hide via Settings; mapping per-field single col; modal 90vw | `wireframes/tablet.svg` |
| Mobile (<768px) | Semua `grid-cols-1`; builder `NTabs Library / Canvas / Properties`; toolbar column wrap + search full-width flex-1 min 320px wrap; modal/drawer `100vw` full; form `NForm` label top; wizard `NSteps vertical condensed`; Tiptap toolbar scroll-x `overflow-auto` + `+ Binding` bottom fixed 44px; mapping editor vertical | `wireframes/mobile.svg` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading | `NSpin show` overlay `Memuat...` + `NSkeleton` 3 baris di form/canvas | `NSpin`, `NSkeleton` | `mockups/loading.png` + story `loading` |
| Empty | `NEmpty description="Belum ada data"` (+ illust warm `#f6f5f4` xl16) + CTA pill `+ Buat ...` via `NDataTable #empty` single instance (Task02 fix) | `NEmpty` + `EmptyStateCard` | `mockups/empty.png` + stories `empty` per halaman |
| Error (fetch 500/network) | `NAlert type="error" closable` full-width `Gagal memuat data` + `Coba lagi` retry `emit('retry')` tanpa reset search/sort/page (`error: string \| null` prop) | `NAlert` via DataTable error slot | `mockups/error.png` + story `error` |
| Tiptap Configure Error | `NAlert type="error" Gagal memuat editor (configure)` + `NButton Retry` + `#fallback` `Editor dimuat di sisi klien...` 60% opacity | `NAlert`, `ClientOnly`, `NSpin` | `mockups/tiptap-error.png` + story `tiptapConfigureError` |
| Success | `useMessage().success('Berhasil')` toast `#ffffff` xl16 + list re-fetch + redirect | `useMessage` | `mockups/success.png` |
| Validation 400 (incl. DR-002) | Inline `NFormItem validationStatus="error"` + `feedback` + border merah `#EF4444` + `NAlert type="warning"` summary per-field list `missing: letter.tanggal` + auto-focus first + scroll | `NFormItem`, `NAlert` | `mockups/validation.png` + story `validation` + `wireframes/validation.svg` |
| Permission Denied 403 | Floating global single `AccessDeniedAlert.vue` (`NAlert error` + `Locked` h-render, `Akses Ditolak` ID) via `rbac-denied` single listener `data-testid=access-denied` top16 right16 max448 slideIn 300ms auto 4s | `NAlert` Teleport | `mockups/403.png` + story `permissionDenied` |
| Conflict 409 | `NAlert warning Tidak dapat menghapus — masih dipakai` + modal `ReferenceList.vue` list `template:SK` + `NTag 409` + `Lihat` link `data-testid=conflict-references` | `NAlert`, `NModal`, `NList`, `NTag` | `mockups/409.png` + `wireframes/conflict.svg` + story `conflict` |
| Draft/DRAFT | Banner `NAlert info Draft tersimpan otomatis — Lanjutkan?` + `NSteps` highlight + localStorage badge | `NAlert` | `mockups/draft.png` |
| Invalid Binding | Canvas node red ring `border-[#EF4444]` + badge `Invalid` + tooltip "Kolom terhapus, pilih ulang" | `NTag error` | `mockups/invalid-binding.png` |
| 404 Not Found | `NAlert` + `NEmpty` + `Kembali` button → `/dashboard/master-data` etc. | `NAlert`, `NEmpty` | `States notFound` |

### Accessibility

- Keyboard: semua aksi via keyboard (Tab → `+ Buat` → form field → `Simpan` → `Coba lagi` → `ReferenceList Tutup` Esc), focus trap `NModal/NDrawer` (`focus-trap` Naive UI), `Tab` order logis (toolbar → editorHost → BindingPalette → footer), `Esc` close modal/drawer/toolbar bubble, wizard `NSteps` reachable `tabindex 0 + Enter`, canvas blocks `ArrowUp/Down` reorder `role="list" aria-grabbed`, Tiptap toolbar roving focus, min hit 44px mobile (binding button 44px, toolbar button 32px + padding).
- ARIA: `aria-label` icon-only (`Segarkan data`, `Atur kolom`, `Tambah step`, `Tutup` ReferenceList, `Bold`), `aria-current="page"` breadcrumb leaf & `aria-current="step"` wizard current, `aria-grabbed` draggable block, `aria-invalid`+`aria-describedby` field error (DR-002 missing field linked), `role="status"` live region toast/alert, `data-testid` `access-denied` single & `conflict-references` list, `aria-modal="true"` NModal, `aria-label="Toolbar editor"` + `role="toolbar"`, `aria-label="Binding editor"` + `aria-label="Field mapping"` per-field.
- Kontras & font: ink `#000000` pada canvas `#f6f5f4` ~18:1 AA; primary `#0075de` pada putih ~4.6:1 AA; Inter `fontFamily naiveui-theme.ts` + tracking Display −1px/+0.125px Eyebrow; `NTag 409` warning `#D97706` pada `#FFFBEB` contrast AA.
- Reduced motion: semua transisi 150/250/350ms hormati `@media (prefers-reduced-motion: reduce) { animation-duration:0.01ms; transition-duration:0.01ms }` (`app/assets/css/main.css`), Anime.js `usePageTransition` degenerate `0.01ms`.
- Screen reader: `label` form + `aria-label` select filter (`Semua Kolom`), live region alert/error summary + 409 list `role="list"`/`listitem`, `alt` image upload + `aria-label` file name, `ReferenceList` links deskriptif (`Lihat Template SK Pengangkatan`).

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi (semua halaman polish × 3 breakpoint + 8 state + dedicated pages) | SVG/PNG | `tasks/10-letter-builder-polish-ui-design/wireframes/` (`desktop.svg`, `tablet.svg`, `mobile.svg`, `builder-3pane.svg`, `wizard.svg`, `master-create.svg`, `master-edit.svg`, `component-create.svg`, `component-edit.svg`, `template-create.svg`, `template-edit.svg`, `administration-create.svg`, `administration-edit.svg`, `states.svg`, `validation.svg`, `conflict.svg`, `tiptap-toolbar.svg`, `tiptap-error.svg`) | TODO |
| Mockup hi-fi (Naive UI + Tailwind + token Notion) | PNG + Vue (Tailwind inline `bg-[#f6f5f4]` `border-[#e6e6e6]` `text-[#0075de]`) | `tasks/10-letter-builder-polish-ui-design/mockups/` + `app/components/features/letter-builder-polish/` + `app/pages/dashboard/.../create.vue` stubs | TODO |
| Prototype interaktif (klik tanpa dead-end, dedicated pages + builder polish + mapping per-field + Tiptap office-min) | **Storybook stories langsung di project** | `apps/web/stories/letter-builder-polish/*.stories.ts` (`MasterDataCreatePage.stories.ts`, `ComponentCreatePage.stories.ts`, `ComponentEditPage.stories.ts`, `TiptapToolbar.stories.ts`, `TemplateBuilderPolish.stories.ts`, `AdministrationMapping.stories.ts`, `StatesPolish.stories.ts`) | TODO |
| Storybook build | Static Storybook | `npm run build-storybook` (stories `LetterBuilderPolish/*` tampil) | TODO |

> **Aturan Storybook (WAJIB FASE 1)**: Prototype TIDAK cukup Figma link/PNG. Harus komponen Vue nyata (Naive UI direct import `import { NButton, NForm, NInput, NSelect } from 'naive-ui'`, Tailwind utility `flex gap-3 bg-[#f6f5f4]`, token `app/utils/naiveui-theme.ts` via `NConfigProvider` + `themeOverrides` decorator `withProviders.ts` + `import '../app/assets/css/main.css'`) + stories `apps/web/stories/letter-builder-polish/` dengan `args/controls`, `viewport` (desktop 1280/tablet 768/mobile 375), `a11y` addon. Config `apps/web/.storybook/main.ts` (`stories: ['../stories/**/*.stories.*']`, addons `a11y`+`docs` + `vue3-vite`) & `preview.ts` decorator `NConfigProvider`. Verifikasi: `npm run storybook` :6006 menampilkan semua stories + `npm run build-storybook` sukses tanpa error (chunks LetterBuilderPolish di `storybook-static`).

### Design Tokens Check

- [ ] Warna `app/utils/naiveui-theme.ts` Notion (`primaryColor #0075de`, hover `#0069c4`, pressed `#005bab`, body `#f6f5f4`, card `#FFFFFF`, border `#e6e6e6`, text `#000000`, radius `8px`/`4px`, font `Inter`) — `NConfigProvider :theme-overrides` di Storybook decorator + `10` pages
- [ ] Typography Inter + tracking (Display 40/700/−1px, H3 20/600/−0.125px PageShell title, Eyebrow 12/600/+0.125px)
- [ ] Radius xs4 input 4px / sm5 / md8 / lg12 card(PageShell) / xl16 modal(`ReferenceList` NModal) / full pill CTA `9999px`
- [ ] Spacing Tailwind xxs4→xxl32 via utilities `gap-3 p-4`
- [ ] Icon `@vicons/carbon` `h(NIcon, null, { default: () => h(IconName) })` (Add/Edit/TrashCan/Search/Restart/Settings/Locked/Warning/TextAlignCenter etc.)
- [ ] Storybook `LetterBuilderPolish/*` me-render `NConfigProvider` + `themeOverrides` (Notion) — visual 1:1
- [ ] Reduced-motion & a11y addon pass (contrast AA, keyboard, focus trap ReferenceList + Tiptap toolbar)
- [ ] No `NDescriptions` — pakai `.detail-view` + `NForm` live
- [ ] Tiptap toolbar token: button `32px` height, gap `4px`, active `bg-[#e8f2fd] border-[#0075de]` ring
