## Objective

Membangun lapisan persuratan lengkap di atas engine: Component registry (Tiptap + `is_looping` + binding `text/image/component`), Template builder 3-pane (embed component + isi requirement dari Master Data/manual + looping picker + auto-form + preview PDF), dan Administrasi multi-step (data `step.field` + wizard hasil + menu per surat + dokumen gabungan + PDF).

## Context

Task ketiga/terakhir roadmap `05 → 06 → 07`. Tanpa task ini engine (05) dan tabel (06) tidak menjadi surat. Menghormati prinsip: tidak generate controller/service per surat; semua via `TemplateController/DocumentController/RendererService/DataSourceService` generik. Pola existing: PageShell 3-pane (rujuk AppLayout sider), DataTable, FormModal, DetailDrawer→property panel inline, `useAuthorization`, `useDataTable`.

## Scope

### In Scope

- Component: `name, is_looping, tiptap_json, preview_html, version`; editor Tiptap (inline/block/align/list/table/link/image/undo/redo); **right-click → popup** (`nama data + view text/image/component→pilih component + mapping`) → inline node non-editable; preview.
- Template: `name, description, schema_json, version, status`; richtext + **right-click pilih component → isi requirement** (Master Data via `schema` API Task 06 / manual / system `letter/office/signer/current_date`); looping → picker tabel + kolom + pilih semua; **auto-form** dari requirement; preview PDF (reuse Task 05).
- Administrasi: `name, description` + data surat dinamis (`step.field` prefix, type text/richtext, tambah terus); steps (`template_id, order, mapping`).
- Hasil: menu per administrasi + wizard (lengkapi data → tambah step → isi mapping → tambah step lagi → render gabungan + PDF); delete run.
- Tabel: `doc_components(+versions?), doc_templates(+versions?), administrations, admin_steps, documents(id, template_id/admin_run, number, data_json, rendered_html, pdf_path, status)`.
- Builder 3-pane: kiri ComponentLibrary, tengah DocumentCanvas (drag-drop HTML5, reorder, EmptyStateCard), kanan PropertyPanel (NForm live `useBuilderStore`), DataBinding/Condition/Repeater editor, Preview Drawer 600px.
- Tiptap↔DocNode converter (binding node ↔ `{{}}`, repeater/condition block).
- Permission `Component/Template/Administration/Document Read/Write` + guard; Storybook `stories/template-admin/`.

### Out of Scope

- Engine inti/PDF transport (reuse Task 05); DDL Master (reuse Task 06).
- Tanda-tangan digital tersertifikasi, approval workflow multi-role, nomor surat otomatis kompleks (cukup `document_number` unik manual + saran format).
- Import Word/PDF ke template.

## Dependencies

- `tasks/05-document-engine/README.md` — renderer/PDF/preview (wajib DONE atau minimal API stabil).
- `tasks/06-master-data-ddl/README.md` — `mst_*` + `schema` API (wajib untuk binding/looping).
- `tasks/04-redesign/README.md` — PageShell/DataTable/a11y baseline.
