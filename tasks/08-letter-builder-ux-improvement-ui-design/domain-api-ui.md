## Domain

> FASE 1 — UI Design. Domain reuse tanpa tabel baru (reuse 05-07). Ditampilkan sebagai konteks untuk mockup & Storybook data.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| MasterTable (reuse Task06) | Definisi tabel DDL `mst_*` | id, name, slug, display_name, description, status (DRAFT→ACTIVE→ARCHIVED) |
| MasterColumn (reuse) | Definisi kolom 13 tipe | id, table_id, name, display_name, type(13), config_json, is_required/orderable/searchable, sort_order |
| MasterRow (fisik `mst_*`) | Baris dinamis QueryBuilder | id, kolom dinamis + created_at/updated_at (fisik) |
| DocComponent (reuse Task07) | Blok reusable Tiptap | id, name, is_looping, tiptap_json, preview_html, version |
| DocTemplate (reuse) | Surat (JSON Tree) | id, name, code (slug), description, schema_json, version, status (DRAFT/PUBLISHED/ARCHIVED) |
| Administration (reuse) | Definisi multi-step | id, name, slug, description |
| AdminStep (reuse) | Step → template + mapping | id, admin_id FK CASCADE, template_id FK RESTRICT, step_order UNIQUE per admin, mapping_json |
| Document (run) (reuse) | Instance hasil wizard | id, admin_id, template_id, document_number UNIQUE NULL, data_json, rendered_html (snapshot), pdf_path, status DRAFT→FINAL→CANCELLED, template_version |
| DocNode (reuse Task05) | Node JSON Tree engine | type (18), props, children, elseChildren |

### Relationships

```text
MasterTable ──1:N── MasterColumn (CASCADE; hapus tolak 409 bila direferensi → BR-003)
MasterTable ──1:N── MasterRow (fisik mst_*; DROP setelah backup storage/backups/)
DocTemplate ──N:M── DocComponent (via schema_json component-ref; 1 level, siklus ditolak)
Administration ──1:N── AdminStep (CASCADE; order unik)
AdminStep ──N:1── DocTemplate (RESTRICT bila dipakai → 409)
Administration ──1:N── Document (snapshot version dikunci)
MasterTable <──(logical FK)── MasterColumn relation_single/multiple (merujuk slug, bukan FK DB kaku → warning bila target hilang)
```

### States

| Entity | State | Deskripsi | Transisi Diizinkan |
|--------|-------|-----------|--------------------|
| MasterTable | DRAFT → ACTIVE → ARCHIVED | Definisi → dipakai → disembunyikan (soft-hide browse) | DRAFT→ACTIVE, ACTIVE→ARCHIVED (hard DELETE = DROP + backup) |
| DocTemplate | DRAFT → PUBLISHED → ARCHIVED | Draft → live → pensiun | DRAFT→PUBLISHED (naikkan version) →ARCHIVED; edit PUBLISHED schema → version bump |
| Document | DRAFT → FINAL → CANCELLED | Wizard draft → final surat → batal | DRAFT→FINAL, DRAFT/FINAL→CANCELLED (cancel = soft, riwayat awet) |

Jika stateless: N/A rows — MasterRow stateless CRUD.

### Domain Rules

- DR-001: Slug/kolom disanitasi server; klien preview hanya UX, tidak dipercaya (reuse Task06 DR-001).
- DR-002: `config_json` divalidasi Zod discriminated union per 13 tipe (options/relation/fmt/operation); `tiptap_json` shallow validate + binding `item.*` rule.
- DR-003: Nilai operasi-teks selalu dikomputasi ulang server via `evalTextOperation` (klien hanya preview identik).
- DR-004: Publish DocTemplate validasi `DocNode` depth ≤10, total ≤200 + requirement lengkap (BR-002).
- DR-005: Renderer pure: tidak mutasi input tree, escape binding, sanitasi richtext `sanitize-html`, allowlist URL gambar (`https://`, `/api/storage/`, `data:image/`).

### Invariants

- INV-001: Template PUBLISHED selalu lolos `DocNodeSchema` + BR-002; run lama render reproducible via snapshot `template_version`+`rendered_html` (bukan baca template terbaru).
- INV-002: `step_order` unik per administration; `document_number` unik bila diisi.
- INV-003: Output `renderer.render(tree,data)` selalu HTML string `<div class="doc-page">…` tidak `undefined` (INV-001 Task05).

### Data Model

Reuse 05-07 (tanpa tabel baru). Mock untuk Storybook:

#### MasterTable (story mock)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Y | PK |
| name | string | Y | `pegawai` |
| display_name | string | Y | `Pegawai` |
| slug | string | Y | `pegawai` → fisik `mst_pegawai` |
| description | string | N | Keterangan |

#### DocComponent (story mock)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Y | `Kop Surat` |
| is_looping | boolean | Y | `false` |
| tiptap_json | JSON | Y | ProseMirror doc + binding node `{type:'binding', attrs:{name:'kop.nama', view:'text'}}` |
| preview_html | string | N | Cache |
| version | number | Y | 1→2 |

## API

> FASE 1 — N/A (tidak ada endpoint baru). Design mengacu endpoint existing 05-07 — dicantum sebagai `Flow → API Mapping` untuk FASE 2 wiring.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/master-data` | GET/POST | JWT | read/write | List/create definisi + DDL | Step 1-3 |
| 2 | `/api/master-data/:slug` | GET/PUT/DELETE | JWT | read/write | Detail/alter/drop (409 bila ref) | Step 2,16 |
| 3 | `/api/master-data/:slug/rows` | GET/POST | JWT | read/write | Browse/create baris | Step 4-7 |
| 4 | `/api/master-data/:slug/rows/:id` | GET/PUT/DELETE | JWT | read/write | Detail/ubah/hapus baris | Step 7,16 |
| 5 | `/api/master-data/:slug/schema` | GET | JWT | read | Schema untuk builder 07 | Step 10 |
| 6 | `/api/doc-components` | GET/POST | JWT | component read/write | List/create component | Step 8-9 |
| 7 | `/api/doc-components/:id` | GET/PUT/DELETE | JWT | component | Detail/ubah/hapus (409 bila dipakai) | Step 9,16 |
| 8 | `/api/doc-templates` | GET/POST | JWT | template read/write | List/create template | Step 10-12 |
| 9 | `/api/doc-templates/:id` | GET/PUT/DELETE | JWT | template | Detail/publish/protect | Step 11-13 |
| 10 | `/api/doc-templates/:id/form` | GET | JWT | template read | Auto-form schema | Step 11 |
| 11 | `/api/doc-templates/:id/preview` + `/preview-pdf` | POST | JWT | template read | Preview HTML/PDF reuse engine05 | Step 11 |
| 12 | `/api/documents/preview|pdf` | POST | JWT | preview/pdf | Engine generic Task05 | Step 11,15 |
| 13 | `/api/administrations` | GET/POST | JWT | admin read/write | List/create admin | Step 13 |
| 14 | `/api/administrations/:id` (+ `/slug/:slug`) | GET/PUT/DELETE | JWT | admin | Detail/steps | Step 13-14 |
| 15 | `/api/administrations/:id/runs` | GET/POST | JWT | document read/write | Wizard execute → dokumen gabungan | Step 15 |
| 16 | `/api/documents/:id/pdf` | GET | JWT | document read | Unduh PDF run | Step 15 |

- Validasi Zod reuse (discriminated 13 tipe + DocNode + mapping completeness); Error 400/404/409/401/403/500 sesuai 05-07; Auth `requireApiAccess` method+URL + Guard `guard_urls` allow/deny tidak diubah (backfill seed).

## UI

> MANDATORY — 10 sub-bagian wajib + deliverables. Prototype **Storybook-First** langsung di project (bukan Figma-only). Token `app/utils/naiveui-theme.ts` Notion (primary `#0075de`/`#0069c4`/`#005bab`, canvas `#f6f5f4`/`#ffffff`, hairline `#e6e6e6`, Inter tracking −1px…+0.125px, radius xs4/sm5/md8/lg12/xl16/full).

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/dashboard/master-data` | Definisi List | Write/Read | Tabel definisi (PageShell + DataTable kanonis + +Buat) | `wireframes/list.svg` (reuse 06) |
| `/dashboard/master-data/create` | Definisi Builder | Write | NDynamicInput kolom 13 tipe + config panel per tipe + slug live + preview DDL | `wireframes/form.svg` |
| `/dashboard/master-data/:slug` | Browse Hasil | Read | DataTable dinamis per tabel + toolbar 320/160 + visibility per slug | `wireframes/browse.svg` |
| `modal` | Relation Picker | Read | `RelationPickerModal.vue` full: tabel relasi + search all + sort + checkbox radio/multiple + pagination ID | `wireframes/browse.svg` picker variant |
| `/dashboard/components` | Component List + Editor | Write | Tabel component + Tiptap editor ClientOnly + BindingPalette (right-click + `+ Binding` fallback) + Preview Drawer | `wireframes/component.svg` (reuse 07) |
| `/dashboard/templates` | Template Builder 3-pane | Write | `Library (NTree) \| Canvas (drag-drop) \| Properties (NForm live)` + Binding/Repeater/Condition editors + Preview Drawer 600px | `wireframes/builder.svg` |
| `/dashboard/administrations` | Administrasi + Steps | Write | `step.field` NDynamic + steps mapping (template select + mapping per requirement) | `wireframes/wizard.svg` |
| `/dashboard/documents/:slug` | Wizard Hasil | Write/Read | `NSteps` vertical guided + per-step form + `+ Tambah Step` N + Review gabungan + PDF | `wireframes/wizard.svg` |
| `drawer` | Preview | Read | `DocumentPreviewDrawer.vue` 600px + tabs HTML/PDF + NCode + NScrollbar | `stories/letter-builder/Preview` |
| `/dashboard` | Dashboard (not modified) | Any | Tetap Notion hero `#213183` + stats (baseline Task04) | `wireframes/dashboard.svg` existing |

### Layout

- Navigasi: sidebar AppLayout 220/72 (indikator aktif primary `#0075de` bar + tint `#e8f2fd`), group `Master Data (Definisi + dinamis per tabel)` + `Persuratan (Component/Template/Administrasi + Dokumen per administrasi)` + leaf `<a href>` + `router.push` preserve native right-click;-top AppShellRow pattern Task03-04 dipertahankan.
- Struktur halaman: `PageShell` (`breadcrumb <a href>` + title 20px Semibold tracking −0.125px Ink + description 12px `#615d59`) → `toolbar DataTable` (search 320px `Cari...` + NSelect 160px `Semua Kolom` filterable + `Restart` Refresh `aria-label="Segarkan data"` + `Settings` visibility + `Reset`) → `konten` (tabel/form/editor/wizard) → `pagination` `Menampilkan {from}-{to} dari {total}` (locale ID) — padding head 16×20, body 24, radius lg12, border hairline, overflow hidden, flex-wrap responsive `column <768px`.
- Builder 3-pane: wrapper `display:grid; grid-template-columns: 260px 1fr 320px; gap:0; height: calc(100vh - 52px - 48px)` (navbar+PageShell header) → tablet panel kanan jadi drawer `NDrawer width 320`, mobile `N Tabs` + `NSteps` vertical full-width; canvas `bg-[#f6f5f4]` soft, cards `#ffffff` hairline + Level1 shadow, selection `ring-primary #0075de` + bg `#e8f2fd`.
- Grid & spacing: token Notion xs4×xs8×sm12×md16×lg24×xl28×xxl32 (gap form 12, section 28-32 via whitespace, bukan rules); Tailwind utilities inline (`flex gap-3 p-4 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[12px]`).

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|------------------|-----------|---------------|
| `MasterDataDefinitionForm.vue` (refine) | `app/components/features/letter-builder/master/` | NDynamicInput kolom (tambah/hapus `Add` Carbon) + `ColumnConfigPanel.vue` per tipe discriminated (options/relation/fmt/operation) + slug live sanitize + DDL preview + badge `is_searchable/orderable` | default, validation (ERR-01), destruktif confirm (ERR-04) |
| `MasterRowTable.vue` + `MasterRowForm.vue` (refine) | `app/components/features/letter-builder/master/` | DataTable dinamis per slug (columnDefs dari `master_table_columns`) + Form 13 tipe (NInput/NSelect/NDatePicker/NTimePicker/NUpload/NInputNumber IDR) + `master-operation.ts` preview | default, loading, empty CTA, validation, pdfError |
| `RelationPickerModal.vue` (enhance) | `app/components/features/letter-builder/common/` | NModal (`width 800`) + NDataTable + NInput search 320px + NSelect field + sort ArrowUp/Down 14px primary + checkbox (radio single vs N multiple) + footer `Batal/Pilih` | default, empty, loading, error retry |
| `ComponentEditor.vue` (enhance) | `app/components/features/letter-builder/component/` | Tiptap `ClientOnly` + `N Toolbar` (bold/italic/underline/align/list/table/link/image/undo/redo via `@vicons/carbon` h-render) + `BubbleMenu` + `BindingPalette` (right-click contextmenu + `+ Binding` button fallback 44px hit) | default, is_looping validation, preview, unsaved guard |
| `BindingPopup.vue` / `BindingPalette.vue` (new) | `app/components/features/letter-builder/component/` | NPopover/NDropdown: input `nama` + NSelect `view (text/image/component)` + NSelect `mapping (master_data:slug.field / manual / system)` → inline pill `<span data-binding>` non-editable `bg-[#e8f2fd] text-[#0075de] rounded-full px-2 py-1 text-xs` | default, invalid badge merah |
| `TemplateBuilder.vue` (enhance) | `app/components/features/letter-builder/template/` | Wrapper 3-pane + `useBuilderStore` (blocks: {id,type,props,children}, selectedId, add/update/move/remove/reorder) + drag HTML5 (`draggable + @dragstart/@drop`) + keyboard Up/Down | default, empty canvas, selected, drag-over |
| `ComponentLibrary.vue` | `app/components/features/letter-builder/template/` | NTree/N List komponent (search filterable) + NTag version + preview hover + drag handle `h(NIcon, null, () => h(Add))` | default, empty, filtered |
| `DocumentCanvas.vue` | `app/components/features/letter-builder/template/` | Drop zone flex-1 + `EmptyStateCard` (`NEmpty` + `+ Tambah Blok`) + blocks render live + selection ring `border-[#0075de]` + hover actions Edit/Delete | default, empty, loading preview, pdfError |
| `PropertyPanel.vue` | `app/components/features/letter-builder/template/` | NForm live (label `Eyebrow 11px uppercase #94a3b8`) + NInput/NSelect per block prop + `RepeaterEditor` + `ConditionEditor` + `DataBindingEditor` | default, validation, 409 conflict |
| `RepeaterEditor.vue` + `ConditionEditor.vue` + `DataBindingEditor.vue` | `app/components/features/letter-builder/template/` | Repeater: NSelect tabel `mst_*` + `NTransfer` like kolom checklist + header `Pilih semua` + item var display; Condition: `field NSelect + operator NSelect eq/neq/gt/gte/lt/lte/contains/in/empty + value NInput`; Binding: master/manual/system tabs | default, empty source warning |
| `DocumentPreviewDrawer.vue` (enhance) | `app/components/features/letter-builder/common/` | NDrawer `width 600` + NTabs `HTML | PDF` + NScrollbar + NCode preview + NAlert warning header (empty repeater/div-by-zero) + `Unduh PDF` pill CTA | default, html, pdf loading, pdfError, warning |
| `AdminWizard.vue` (enhance) | `app/components/features/letter-builder/administration/` | `NSteps vertical :current` + NForm per step + `+ Tambah Step` (NButton dashed w-full) + NAlert validation per step + footer `Simpan Draft / Finalkan` | default, step1, step2, review, validation, DRAFT banner |
| `AccessDeniedAlert.vue` (reuse) | `app/components/common/AccessDeniedAlert/` | Teleport body top16 right16 max448 slideIn 300ms auto 4s `data-testid=access-denied` | single |
| `ReferenceList.vue` (new) | `app/components/features/letter-builder/common/` | NList + NTag per referensi (`Template SK memakai Component Kop`) + anchor `Lihat` → route; dipakai di 409 modal | default |
| `IDRInput.vue` (helper) | `app/components/features/letter-builder/master/` | `NInputNumber` + formatter `Intl.NumberFormat('id-ID', style:'currency', currency:'IDR')` live; reuse Task06 `master-operation` | default, fokus hairline+shadow |

**Library relevan & alasan (design rationale):**

| Library | Versi terkunci | Dipakai di | Alasan relevan |
|---------|----------------|-----------|----------------|
| **Tiptap** `@tiptap/vue-3` + `starter-kit` + `extension-image/table/table-row/header/cell/link/text-align/underline/placeholder` | `^3.31.3` (reuse Task07) | `ComponentEditor.vue` | Editor richtext ber-binding terbaik untuk surat: inline node non-editable (`binding-pill`), bubble menu, table/align/link/image/undo — tidak ada rival Naive UI untuk konten surat; SSR safe via ClientOnly. Alternatif `quill/slate` ditolak: API tidak mendukung node custom binding se-natural Tiptap ProseMirror. |
| **Naive UI** `NDataTable` + `NForm/NInput/NSelect/NDatePicker/NTimePicker/NUpload/NDynamicInput/NSteps/NTree/NDrawer/NModal/NPopover/NTag/NAlert/NEmpty/NSpin/NSkeleton/NScrollbar/NTabs` | `^2.44.1` existing | Semua halaman | Satu design system (token Notion) + kanonis PageShell/DataTable/ModalCard — tanpa tambah MUI/Element; `NSteps` mem-guided wizard tambah-step N, `NTree` library, `NDynamicInput` definisi kolom, `NUpload` image, `NDatePicker` format `m-d-Y`. |
| **Tailwind CSS v4** utilities | `^4.3.3` existing | Semua template | CSS utama per keputusan `docs/architecture.md` (tanpa preflight, `@theme` + utilities); spacing/grid/responsive inline, `<style scoped>` hanya untuk `:deep()` override Naive UI. |
| **@vicons/carbon** via `h(NIcon)` | `^0.13.0` | Icons | Konsisten Task04-07; map 1:1 (Add/Edit/TrashCan/Search/Restart/Settings/Grid/User/Security…) |
| **@vueuse/core** `useDraggable/useDropZone/useStorage` (opsional) | `^12` (install FASE2) | Canvas drag + localStorage visibility/draft | Helper drag-drop & storage; tidak menambah UI baru — re-export helper kecil; jika ditolak, fallback HTML5 `draggable` native (design sudah cover both). |
| **vue-draggable-plus** (alternatif) | `^0.6` (evaluasi FASE2) | Canvas reorder | Jika HTML5 drag terasa janky di mobile, swap ke draggable-plus tanpa ubah API `useBuilderStore`; story variant tetap pass. |
| **sanitize-html** | `^2.17.7` reuse | Renderer preview | XSS escape + richtext sanitasi (existing Task05); tidak diganti. |
| **Puppeteer** server-only | `^25.10.0` reuse | PDF | Tetap server bundle `chunks/routes/api/documents/*` only; FASE 1 hanya mock, Chrome install di FASE2 CI. |

### Interaction

- Trigger: Sidebar `Master Data → Definisi` → `+ Buat Tabel` (NButton pill primary `+ Buat Tabel` + icon `Add` h-render) → Definisi Form; `Browse` → `+ Tambah Data`; `Component List` → `+ Buat Component` → Tiptap; `Template Builder` drag `Component` dari Library → Canvas (ghost `opacity 0.5` + ring primary); Properties live update (`@update:value` → store); right-click canvas block → `BindingPalette` (atau toolbar `+ Binding` tap 44px hit di mobile); repeater `Pilih semua` checkbox header (indeterminate state); wizard `NSteps` click header (hanya bisa ke step yang sudah valid, tab order + `aria-current="step"`).
- Flow: validate inline (Zod → NFormItem feedback + NAlert summary) → submit → `useMessage` toast `Berhasil` (ID) → re-fetch tabel/store → redirect/back (breadcrumb + `router.push` preserve `href`). Semua form punya `onSubmit` preventDefault + Enter submit (kecuali Tiptap Enter = newline).
- Konfirmasi: destruktif (hapus Master Table/Column, Component, Template) → `NPopconfirm`/`NDialog` (mode dua langkah untuk DDL alter: ringkasan + warning backup + checkbox `Saya mengerti` required before confirm); tanpa double-confirm untuk non-destruktif (cancel wizard → single confirm unsaved).
- Navigasi balik: breadcrumb `Master Data / Pegawai` (leaf `span aria-current="page"`, others `<a href>` + preventDefault + router.push, native right-click preserved), back button `ArrowLeft` → `router.back()`, modal `Esc` + overlay click → close (kecuali unsaved guard → dialog), drawer `Esc` → close.
- Transisi/animasi: `usePageTransition` Anime.js `fadeInUp 250ms easeOut` untuk PageShell/card, `staggerFadeIn 50ms` untuk DataTable rows; semua hormati `prefers-reduced-motion: reduce` → `0.01ms` (media query `app/assets/css/main.css`); Storybook play `SLOWMO_MS` 100 headless 0.
- Drag & keyboard: HTML5 `draggable="true"` + `data-transfer: application/x-lb-block`; keyboard alternatif: block selected → `ArrowUp/Down` reorder (aria `role="list"` + `aria-grabbed`), `Enter` edit property, `Delete` hapus (confirm).
- Prototype link: Storybook `http://localhost:6006` (`apps/web/stories/letter-builder/`); stories `Default` + play fn klik alur tanpa dead-end.

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Builder 3-pane grid `260 \| 1fr \| 320`; toolbar flex-row; DataTable penuh; relation picker modal 800px; wizard `NSteps vertical` + form 2-col (`grid-cols-2 gap-4`) | `wireframes/desktop.svg` |
| Tablet (768–1023px) | Builder: library collapse ke `N Drawer` 260 (trigger `Menu` icon 44px); properties jadi drawer 320; canvas full-width; wizard `NSteps` horizontal di atas; DataTable kolom hide via visibility (toggle `Settings`) | `wireframes/tablet.svg` |
| Mobile (<768px) | Semua `grid-cols-1`; builder jadi `NTabs Library / Canvas / Properties`; toolbar column (search full-width flex-1 min 320px tetap tetapi wrap); modal/drawer full-width `width: 100vw`; form `NForm` label top; wizard `NSteps vertical condensed`; Tiptap toolbar scroll-x + `+ Binding` button fixed bottom (44px hit) | `wireframes/mobile.svg` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading | `NSpin show` overlay di tabel/canvas + `NSkeleton` (3 baris) | `NSpin`, `NSkeleton` | `mockups/loading.png` + story `loading` |
| Empty | `NEmpty description="Belum ada data"` (+ illustrasi warm `#f6f5f4` xl16) + CTA pill `+ Buat ...` / `+ Tambah Data Pertama` (BR no dead-end) via `NDataTable #empty` slot single instance | `NEmpty` + illustrations | `mockups/empty.png` + stories `empty` per halaman |
| Error (fetch 500/network) | `NAlert type="error" closable` full-width `Gagal memuat data` + `Coba lagi` retry emit tanpa reset search/sort/page (`error: string | null` prop) | `NAlert` via DataTable slot `error` | `mockups/error.png` + story `error` |
| Success | `useMessage().success('Berhasil')` toast style feature-card `#ffffff` xl16 + auto-dismiss; list re-fetch | `useMessage` | `mockups/success.png` |
| Validation | Inline `NFormItem` (`feedback` + `validationStatus="error"` + border merah) + `NAlert` summary di atas form + focus jump ke first error (`ref.focus()`) | `NFormItem`, `NAlert` | `mockups/validation.png` + story `validation` |
| Permission Denied | Floating global single `AccessDeniedAlert.vue` (`NAlert type="error"` + `Locked` h-render, `Akses Ditolak: Anda tidak memiliki izin...` ID) via `rbac-denied` event 1→1, no per-page duplicate | `NAlert` Teleport | `mockups/403.png` + story `permissionDenied` |
| Conflict 409 | `NAlert` warning + modal `ReferenceList.vue` (list pemakai + link `Lihat`) + `NTag` `409` | `NAlert`, `NModal`, `NTag` | `mockups/409.png` + story `conflict` |
| Draft/DRAFT | Banner `NAlert type="info"` top `Draft tersimpan otomatis — Lanjutkan?` + `NSteps` highlighted step + `LocalStorage` draft badge | `NAlert` | `mockups/draft.png` |
| Invalid Binding | Canvas node red ring `border-[#EF4444]` + badge `Invalid` + tooltip "Kolom terhapus, pilih ulang" + Properties `NAlert` | `NTag` error + `NAlert` | `mockups/invalid-binding.png` |

### Accessibility

- Keyboard: semua aksi via keyboard (Tab → `+ Buat` → form field → `Simpan` → `Coba lagi`), focus trap di `NModal`/`NDrawer`, `Tab` order logis, `Esc` close, wizard `NSteps` reachable (`tabindex 0` + `Enter`), canvas blocks keyboard reorder (`ArrowUp/Down`), Tiptap toolbar roving focus, min hit 44px mobile.
- ARIA: `aria-label` icon-only (`Segarkan data`, `Atur kolom`, `Tambah step`), `aria-current="page"` breadcrumb leaf & `aria-current="step"` current wizard, `aria-grabbed` draggable, `aria-invalid`+`aria-describedby` field error, live region `role="status"` toast/alert.
- Kontras & font: ink `#000000` pada canvas `#f6f5f4` ~18:1 AA; primary `#0075de` pada putih ~4.6:1 AA; Inter `fontFamily` `naiveui-theme.ts` + tracking eksplisit (Display −1px…Eyebrow +0.125px); font-size body 14 Small 13 Eyebrow 12.
- Reduced motion: semua transisi 150/250/350ms hormati `@media (prefers-reduced-motion: reduce) { animation-duration:0.01ms; transition-duration:0.01ms }`.
- Screen reader: `label` form + `aria-label` select filter (`Semua Kolom`), `live region` alert/error summary, `alt` image (upload punya `aria-label` file name).

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi (semua halaman surat × 3 breakpoint + 8 state) | SVG/PNG | `tasks/08-letter-builder-ux-improvement-ui-design/wireframes/` (`desktop.svg`, `tablet.svg`, `mobile.svg`, `empty.svg`, `validation.svg`, `conflict.svg`, `wizard.svg`, `builder-3pane.svg`) | TODO |
| Mockup hi-fi (Naive UI + Tailwind + token Notion) | PNG + Vue (Tailwind inline `bg-[#f6f5f4]` `border-[#e6e6e6]` `text-[#0075de]`) | `tasks/08-letter-builder-ux-improvement-ui-design/mockups/` + `app/components/features/letter-builder/` | TODO |
| Prototype interaktif (klik tanpa dead-end) | **Storybook stories langsung di project** | `apps/web/stories/letter-builder/*.stories.ts` (diusulkan: `MasterDataDefinition.stories.ts`, `MasterRowTable.stories.ts`, `RelationPicker.stories.ts`, `ComponentEditor.stories.ts`, `TemplateBuilder.stories.ts`, `TemplateCanvas.stories.ts`, `AdminWizard.stories.ts`, `DocumentPreview.stories.ts`) | TODO |
| Storybook build | Static Storybook | `npm run build-storybook` (stories `LetterBuilder/*` tampil) | TODO |

> **Aturan Storybook (WAJIB FASE 1)**: Prototype TIDAK cukup Figma link/PNG. Harus komponen Vue nyata (Naive UI direct import `import { NButton, NForm } from 'naive-ui'`, Tailwind utility `flex gap-3`, token `app/utils/naiveui-theme.ts` via `NConfigProvider` + `themeOverrides` decorator) + stories `apps/web/stories/letter-builder/` dengan `args/controls`, `viewport` (desktop/tablet/mobile), `a11y` addon. Config `apps/web/.storybook/main.ts` (`stories: ['../stories/**/*.stories.*']`, addons `a11y`+`docs` + `vue3-vite`) & `preview.ts` (`import '../app/assets/css/main.css'` + decorator `NConfigProvider`). Verifikasi: `npm run storybook` :6006 menampilkan semua stories + `npm run build-storybook` sukses tanpa error (chunks LetterBuilder di `storybook-static`).

### Design Tokens Check

- [ ] Warna mengikuti `app/utils/naiveui-theme.ts` (Notion: `primaryColor #0075de`, `primaryColorHover #0069c4`, `primaryColorPressed #005bab`, `primaryColorSuppl #62aef0`, `bodyColor #f6f5f4`, `cardColor #FFFFFF`, `borderColor #e6e6e6`, `textColorBase #000000`, `borderRadius 8px`/`borderRadiusSmall 4px`, `fontFamily Inter`) — `NConfigProvider :theme-overrides` di Storybook decorator.
- [ ] Typography Inter + tracking (Display 40/700/−1px, H3 20/600/−0.125px (PageShell title), Eyebrow 12/600/+0.125px untuk header tabel/badge).
- [ ] Radius xs4 (input `NInput` 4px) / sm5 / md8 (button) / lg12 (card/PageShell) / xl16 (modal/drawer) / full (CTA pill `9999px`).
- [ ] Spacing Tailwind xxs4→xxl32 via utilities (`gap-3 p-4` mapping to sm12/lg24).
- [ ] Icon `@vicons/carbon` dengan `h(NIcon, null, { default: () => h(IconName) })` (Add/Edit/TrashCan/Search/Restart/Settings/Information/Warning/Checkmark).
- [ ] Storybook stories me-render dengan `NConfigProvider` + `themeOverrides` (Notion) — visual 1:1 dengan mockup, no `NDescriptions` (pakai `.detail-view` untuk preview drawer).
- [ ] Reduced-motion & a11y addon pass (contrast AA, keyboard).
