## Domain

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| DocComponent | Blok reusable (Tiptap JSON) | id, name, is_looping, tiptap_json, preview_html, version |
| DocTemplate | Surat (JSON Tree + Tiptap) | id, name, code, description, schema_json, version, status |
| Administration | Definisi persuratan multi-step | id, name, slug, description |
| AdminStep | Satu step → template | id, admin_id, template_id, step_order, mapping_json |
| Document | Instance hasil (run) | id, template_id/admin_id, document_number, data_json, rendered_html, pdf_path, status |

### Relationships

```text
DocTemplate ──N:M── DocComponent (via schema_json component-ref; proteksi hapus)
Administration ──1:N── AdminStep (CASCADE; order unik per admin)
AdminStep ──N:1── DocTemplate (RESTRICT bila dipakai)
Administration ──1:N── Document (run; template_version dikunci)
DocComponent ──1:N── DocComponent (component view bersarang, maks direkomendasikan 2 level)
```

### States

| Entity | State | Deskripsi | Transisi Diizinkan |
|--------|-------|-----------|--------------------|
| DocTemplate | DRAFT → PUBLISHED → ARCHIVED | Draft → live → pensiun | DRAFT→PUBLISHED→ARCHIVED |
| Document | DRAFT → FINAL → CANCELLED | Wizard draft → final → batal | DRAFT→FINAL, DRAFT/FINAL→CANCELLED |

### Domain Rules

- DR-001: Publish menaikkan version; run menyimpan `template_version` (render reproduksibel).
- DR-002: Mapping step wajib mencakup semua requirement template (validasi server).
- DR-003: Binding `manual` bebas; `master_data` wajib kolom masih ada (cek via schema API 06).

### Invariants

- INV-001: Template PUBLISHED selalu lolos validasi DocNode Task 05.
- INV-002: Setiap AdminStep `step_order` unik per administration.

### Data Model

#### doc_components

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | number | Y | Y | auto | PK |
| name | varchar(120) | Y | Y | — | Nama |
| is_looping | boolean | Y | N | false | Butuh `item.*` bila true |
| tiptap_json | text | Y | N | — | Dokumen Tiptap + binding nodes |
| preview_html | text | N | N | null | Cache preview |
| version | number | Y | N | 1 | Naik tiap publish |

#### doc_templates

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | number | Y | Y | auto | PK |
| name | varchar(120) | Y | Y | — | Nama |
| code | varchar(60) | Y | Y | — | Slug/kode |
| description | text | N | N | null | Deskripsi |
| schema_json | text | Y | N | — | JSON Tree (+ Tiptap embed) |
| version | number | Y | N | 1 | Versi |
| status | enum | Y | N | DRAFT | DRAFT/PUBLISHED/ARCHIVED |

#### administrations / admin_steps / documents

| Tabel | Kunci |
|-------|-------|
| administrations | id, name UNIQUE, slug UNIQUE, description |
| admin_steps | id, admin_id FK CASCADE, template_id FK RESTRICT, step_order, mapping_json |
| documents | id, admin_id NULL, template_id NULL, document_number UNIQUE NULL, data_json, rendered_html, pdf_path, status |

## API

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/doc-components` | GET/POST | JWT | component read/write | List/create | Step 1–2 |
| 2 | `/api/doc-components/:id` | GET/PUT/DELETE | JWT | component | Detail/ubah/hapus(409 bila dipakai) | Step 1–2 |
| 3 | `/api/doc-templates` | GET/POST | JWT | template | List/create | Step 3 |
| 4 | `/api/doc-templates/:id` | GET/PUT/DELETE | JWT | template | Detail/publish/protect | Step 3–4 |
| 5 | `/api/doc-templates/:id/form` | GET | JWT | template read | Auto-form schema requirement | Step 3 |
| 6 | `/api/doc-templates/:id/preview-pdf` | POST | JWT | template read | Isi form → PDF via Task 05 | Step 4 |
| 7 | `/api/administrations` | GET/POST | JWT | admin | List/create + data fields | Step 5 |
| 8 | `/api/administrations/:id` | GET/PUT/DELETE | JWT | admin | Detail/steps mapping | Step 5 |
| 9 | `/api/administrations/:id/runs` | GET/POST | JWT | document | List run / eksekusi wizard | Step 6 |
| 10 | `/api/documents/:id/pdf` | GET | JWT | document read | Unduh PDF run | Step 6 |

- Request/response pagination standar; `preview-pdf`/`runs` mendelegasi ke `renderer/pdf.service` Task 05 (tidak duplikasi).
- Zod: Tiptap JSON (shallow validate + binding nodes), DocNode (reuse 05), mapping completeness.
- Error: 400/404/409(ref)/401/403/500(PDF).
- Auth: `requireApiAccess`.

## UI

### Referensi Design

- Inline task ini: wireframe `docs/wireframes/template-admin/` + Storybook `stories/template-admin/` (dibuat saat implementasi; ikuti Task 03 Notion-calm + Task 04 wiring).

### Halaman

| Route | Halaman | Akses | Deskripsi |
|-------|---------|-------|-----------|
| `/dashboard/components` | Component List + Editor Tiptap | Write | Tabel + editor + right-click popup + preview |
| `/dashboard/templates` | Template Builder 3-pane | Write | Library \| Canvas \| Properties + binding/condition/repeater editor + preview drawer |
| `/dashboard/administrations` | Administrasi + Steps | Write | Data `step.field` dinamis + pilih template + mapping |
| `/dashboard/documents/:slug` | Wizard Hasil | Write/Read | Isi data → +step → mapping → render gabungan + PDF |

- Layout: PageShell; builder full-bleed 3-pane (`260px | flex-1 warm #f6f5f4 | 320px`), selection primary `#0075de` + `#e8f2fd` (konsisten sidebar).
- Components: `ComponentEditor.vue (Tiptap)`, `BindingPopup.vue`, `TemplateCanvas.vue`, `PropertyPanel.vue (NForm live)`, `RepeaterEditor.vue`, `ConditionEditor.vue`, `AdminWizard.vue`, `DocumentPreviewDrawer.vue`.
- Interaction: drag-drop HTML5 + reorder up/down (a11y), right-click insert binding, pilih semua kolom loop, tambah step N.
- States/Responsive/A11y: NSpin/NEmpty/NAlert/useMessage; desktop 3-pane, tablet panel jadi drawer, mobile wizard full-width; keyboard + aria-label + reduced-motion; Tiptap a11y toolbar.
