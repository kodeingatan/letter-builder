## User Flow

> MANDATORY — Flow interaksi implementasi. **HARUS konsisten** dengan FASE 1 `tasks/08-letter-builder-ux-improvement-ui-design/flow-requirements.md` (Diagram + 16 Steps + ALT/ERR). Mapping ke API & UI FASE 1 ditambahkan di sini (Flow→UI + Flow→API). Tidak mengubah urutan UX tanpa catatan `Penyesuaian dari design`.

### Diagram

```text
[Super Admin] → /dashboard/master-data → Create Definisi (name+columns 13 tipe) → POST /api/master-data → mst_pegawai tercipta + menu Master Data → Pegawai
    → /dashboard/master-data/pegawai → Browse (search searchable only | sort orderable only | visibility localStorage | pagination) → Create Baris (form dinamis + relation picker modal + operasi-teks preview live + IDR realtime + image upload) → POST /api/master-data/pegawai/rows → toast Berhasil → list refresh
    → GET /api/master-data/pegawai/schema ──┐
                                             │
[Admin] → /dashboard/components → Create Component Kop (Tiptap editor + right-click BindingPalette: nama data + view text/image/component → mapping) → is_looping? → binding item.* check → Preview drawer → Save → Component v1 (POST /api/doc-components)
    → /dashboard/templates → Create Template SK (3-pane: Library NTree | Canvas drag-drop+reorder caret | Properties NForm live) → Embed Component Kop + Daftar → Requirement terisi (Master Data via schema di atas / manual / system letter/office/signer/current_date) → Looping picker (pilih tabel mst_pegawai + kolom + pilih semua) → repeater node source=item → Auto-form dari requirement → Preview HTML → Preview PDF (POST /api/doc-templates/:id/preview-pdf reuse engine Task 05) → Publish (PUT status PUBLISHED, validasi BR-002+BR-003) → version bump
    → /dashboard/administrations → Create Administrasi "SK Pengangkatan" (data step.field dinamis + steps pilih template + mapping_json per step) → POST /api/administrations → Save
    → Menu Persuratan → [SK Pengangkatan] → /dashboard/documents/sk-pengangkatan → Wizard (NSteps vertical: Data → Step1 SK → Step2 Tanda Tangan → +step N → Review gabungan) → isi data → tambah step → isi mapping → +step lagi → render gabungan (pagebreak) → PDF gabungan → POST /api/administrations/:id/runs → Save run (kunci template_version + snapshot rendered_html) → menu Dokumen per run → unduh PDF GET /api/documents/:id/pdf / cancel DELETE

[Destructive] → Hapus Component/Template/Master Table yang masih dipakai → NDialog dua langkah + backup storage/backups/ (DDL) → DELETE → 409 + ReferenceList modal (daftar pemakai); cancel → tutup; confirm → 204 (rows) atau ARCHIVED
Alternate/Error: Empty (NEmpty+CTA) | Validation 400 (NFormItem inline + NAlert summary) | 409 ref (NAlert warning + ReferenceList modal, bukan 500) | 404 slug hilang | 401→/login | 403→AccessDeniedAlert single rbac-denied | 500 PDF Puppeteer → NAlert+Coba lagi tanpa reset

[Refined focus Task 09]: Step 16 ditekankan — setiap DELETE 409 (doc-components, doc-templates, master-data table/column, administrations document_number dupe) harus tampil sebagai warning modal dengan daftar referensi, bukan "Server Error" generik. Semua error sejenis di 05-07 di-hardening sama.
```

### Steps

| Step | Actor | Aksi | Halaman / Component (dari UI-design `08`) | API / Hasil |
|------|-------|------|-------------------------------------------|-------------|
| 1 | Super Admin | Buka Master Data → Create definisi Pegawai (nama, deskripsi, 5 kolom incl. text+date+number+IDR+hidden_operation) | `/dashboard/master-data` → `/dashboard/master-data/create` | Form definisi kosong (`NDynamicInput` kolom) — `MasterDataDefinitionForm.vue` (reuse 08 mockup) |
| 2 | Super Admin | Isi `name=pegawai, display_name=Pegawai`, tambah kolom: `nama (text required searchable)`, `jabatan (relation_single → Jabatan)`, `gaji (number IDR realtime)`, `total = gaji*2 (hidden_operation_text)`, `foto (image)` | `MasterDataDefinitionForm.vue` + `ColumnConfigPanel.vue` + `IDRInput.vue` + Zod preview operasi | Validasi live; slug sanitize ` Pegawai ` → `pegawai`, blacklist tolak `users`/`mst_*` → 400 inline (FR-002/BR-001) |
| 3 | Super Admin | Submit valid | `POST /api/master-data` | `mst_pegawai` tercipta (DDL), toast Berhasil, redirect list definisi, menu `Master Data → Pegawai` muncul — AC-001 FASE1 |
| 4 | Admin | Buka Browse Pegawai | `/dashboard/master-data/pegawai` → `GET /api/master-data/pegawai/rows?page&limit&search&sortBy&sortOrder` | `PageShell` + `MasterRowTable` (DataTable kanonis header eyebrow, search 320px + field 160px + Restart + Settings) — FR-003 |
| 5 | Admin | Search "afd" (hanya `is_searchable`) + sort `gaji` (hanya `is_orderable`) + hide kolom via visibility toggle (persist per slug `localStorage:master-data:pegawai:visibility`) + paginasi 20 | `DataTable` toolbar + `useTable` + `useMasterDataStore` | Hasil tersaring/terurut tanpa reload; kolom non-orderable header tidak sortable; `Menampilkan {from}-{to} dari {total}` — FR-003/BR-006 |
| 6 | Admin | Klik Create Baris → isi form dinamis 13 tipe (date fmt `m-d-Y`, IDR `Rp 2.500.000` realtime, image `NUpload` dragger, relation) → klik relation_single Jabatan → modal picker | `MasterRowForm.vue` + `RelationPickerModal.vue` (`NDataTable` + search all + sort tiap kolom + checkbox 1) | Modal terbuka: search debounce 300ms, sortable semua kolom, checkbox single (radio behavior) — FR-004/005 |
| 7 | Admin | Pilih Jabatan → preview operasi `total` live (`evalTextOperation` reuse Task 05 → `"Total: "++gaji+bonus` → `2500000`) → upload image 2MB → Save | `POST /api/master-data/pegawai/rows` (komputasi server identik `master-operation.ts`) | 201, operasi `null`+pesan bila div-by-zero (FR-006/BR-007); toast + list refresh; row di page 1 |
| 8 | Admin | Buat Component Kop di Tiptap: insert logo image + ketik "Kepala Dinas" → right-click → `BindingPalette` (`nama=kop.nama`, `view=text`) → pilih `Master Data: pegawai.nama` | `/dashboard/components` → `ComponentEditor.vue` (Tiptap `ClientOnly` + BubbleMenu + toolbar bold/italic/list/table/link/image) | Inline node non-editable `<span data-binding="pegawai.nama" class="binding-pill">` muncul; fallback `+ Binding` button 44px hit mobile (FR-007) |
| 9 | Admin | Buat Component Daftar Pegawai (`is_looping=true`, binding `item.nama`/`item.nip`) → Preview | `ComponentEditor` + `BindingPopup` + validation `BR-003` | Preview render 2 baris sample; publish ditolak bila `is_looping` tanpa `item.*` (inline error 400) — FR-001/BR-003 |
| 10 | Admin | Buat Template SK di Builder 3-pane (Library `NTree` kiri \| Canvas tengah drag-drop HTML5 + reorder Up/Down keyboard + EmptyStateCard \| Properties kanan `NForm` live `useBuilderStore`) → drag Kop + Daftar ke canvas → embed component | `/dashboard/templates/create` → `TemplateBuilder.vue` + `ComponentLibrary.vue` + `DocumentCanvas.vue` + `PropertyPanel.vue` | Canvas menampilkan Kop (header) + Daftar (repeater `source=pegawai`, `item=item`, columns picker tabel×kolom + `pilih semua` header) + pagebreak visual — FR-008 |
| 11 | Admin | Isi requirement: `pegawai → master_data:pegawai`, `tanggal → system:current_date`, `kop → manual:"Kop Dinas ..."` → Auto-form tergenerate (`NForm` per requirement) → isi auto-form → Preview HTML Drawer 600px → Preview PDF | `DataBindingEditor.vue` + `RepeaterEditor.vue` + `ConditionEditor.vue` + `AutoForm.vue` + `DocumentPreviewDrawer.vue` (`NTabs` HTML/PDF + `NCode`) | Auto-form semua requirement (source ikut); preview HTML escaped + `sanitize-html`; `POST /api/doc-templates/:id/preview-pdf` (engine 05) → PDF A4 portrait — FR-009/010/011 |
| 12 | Admin | Publish Template (cek `BR-002`: semua requirement terpetakan + minimal 1 blok konten + `is_looping` valid) → version 1→2 | `PUT /api/doc-templates/:id` (status `PUBLISHED`) | Toast, badge `PUBLISHED`; run lama snapshot v1 — BR-002/BR-005 |
| 13 | Admin | Create Administrasi "SK Pengangkatan" → isi `step1.nomor (text)`, `step1.tanggal (date)`, tambah Steps: Step1→Template SK (`mapping pegawai→pegawai.selected` via `schema` API), Step2→Template Tanda Tangan (`mapping penandatangan→manual`) | `/dashboard/administrations/create` → `AdministrationForm.vue` + `NDynamic` fields `step.field` + `StepMappingEditor.vue` | Administrasi tersimpan (slug `sk-pengangkatan`), `ActivityLog ADMINISTRATION_CREATE`, menu Persuratan → `[SK Pengangkatan]` muncul — FR-012 |
| 14 | Operator | Buka menu `[SK Pengangkatan]` → `/dashboard/documents/sk-pengangkatan` → Wizard (`NSteps` vertical `Data → SK → Tanda Tangan → Review`) → isi `nomor`, pilih pegawai via RelationPicker multiple, isi tanggal → Klik `+ Tambah Step` → mapping step2 | `AdminWizard.vue` (NSteps + NForm per step + validation per step + Draft autosave DRAFT `localStorage:letter-builder:draft:<slug>`) | Wizard guided: tidak next bila required kosong (inline error); `+ Tambah Step` append mapping independen; progress bar — FR-013 |
| 15 | Operator | Review gabungan (2 template concatenation + `pagebreak` divider) → Render HTML gabungan + PDF gabungan → Save run | `POST /api/administrations/:id/runs` → `renderer.service` + `pdf.service` (A4) | Dokumen `FINAL` tersimpan (`data_json`, `rendered_html`, `pdf_path`, `template_version` dikunci); dokumen card + pdf download `GET /api/documents/:id/pdf` (`application/pdf`) — FR-013/BR-005 |
| 16 | All | **Aksi destruktif**: hapus Component/Template/Master Table yang masih dipakai → konfirmasi `NDialog` dua langkah + backup `storage/backups/` (DDL) | `DELETE /api/doc-components/:id` / `DELETE /api/doc-templates/:id` / `DELETE /api/master-data/:slug` / `PUT /api/master-data/:slug` remove column / `POST duplicate` semua 409 | **Fix Task 09**: 409 → `NAlert warning` + modal `ReferenceList.vue` (daftar `template:SK Pengangkatan`, `component:Kop`, `pegawai:relation`) + `NTag 409` + `Lihat` link; cancel tutup; confirm hard-delete. Bukan `Server Error` 500. 401/403/404/400/500 sesuai ERR mapping — FR-014/BR-003/BR-004 |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI (konsisten `08` + fix `09`) |
|----|----------|-------|-------------------------------------------|
| ALT-01 | Master Data kosong (0 definisi) | `/dashboard/master-data` → Empty | `NEmpty` + `Belum ada definisi` + CTA `+ Buat Tabel Pertama` pill primary `#0075de` — no dead-end; story `empty` |
| ALT-02 | Browse `mst_pegawai` kosong (0 rows) | Browse → Empty | `NEmpty` + `Belum ada data Pegawai` + CTA `+ Tambah Data Pertama` (`#f6f5f4` xl16) |
| ALT-03 | Visibility toggle hide all | Toolbar `Settings` → hide all | Guard: minimal 1 kolom visible (disable last hide + tooltip "Minimal satu kolom"); persist per slug localStorage |
| ALT-04 | Relation picker 0 rows | Modal → Empty | `NEmpty` di modal + search reset CTA `Atur ulang` tanpa tutup modal |
| ALT-05 | Component dibatalkan belum save | Editor → Back/Cancel | `NDialog` "Batalkan perubahan?" (`onBeforeRouteLeave` unsaved guard) |
| ALT-06 | Template masih DRAFT belum publish | List → badge | `NTag DRAFT` (`#a39e98`); Preview aktif, Publish disabled tooltip "Lengkapi mapping" |
| ERR-01 | Validasi Master Data (slug duplikat/blacklist `users`/`mst_`, kolom duplikat, minimal 1 kolom, name 409) | Submit definisi `POST /api/master-data` → 400/409 | Inline `NFormItem feedback` + `NAlert` summary + focus first error; slug 409 → `NAlert warning` + daftar dupe (bukan Server Error) |
| ERR-02 | Validasi Tiptap binding (`is_looping` tanpa `item.*`, source bukan array) | Save Component/Template `POST /api/doc-components` → 400 | Inline badge `Invalid binding` merah `#EF4444` + tooltip + `NAlert` list; Publish blocked |
| ERR-03 | Operasi-teks div-by-zero / kolom hilang | Form row `POST /api/master-data/:slug/rows` → preview null+warning | Field `readonly_operation_text` → `—` + `NAlert warning "Pembagian nol"`; blokir save bila required; server 400 `errors[]` sinkron Zod |
| ERR-04 | DDL alter destruktif (hapus/rename kolom) | `PUT /api/master-data/:slug` → confirm | `NDialog` dua langkah: ringkasan + warning "Data kolom lama hilang, backup tersedia" + path `storage/backups/*.sqlite` + checkbox `Saya mengerti` |
| **ERR-05** | **Hapus terproteksi (Master Table/column dipakai relation/template, Component/Template dipakai, document_number dupe) → ada 5 sub-error yang sebelumnya tampil sebagai `500 Server Error`** | `DELETE /api/doc-components/:id` (inisial bug), `DELETE /api/doc-templates/:id`, `DELETE /api/master-data/:slug`, `PUT .../master-data/:slug` remove column, `POST /api/administrations/:id/runs` duplicate document_number → **409** | **FIX 09**: `NAlert type="warning"` header `Tidak dapat menghapus — masih dipakai` + modal `ReferenceList.vue` (list `Template SK memakai Component Kop`, `Administrasi SK memakai Master Pegawai`, `steps: [...]`) + `NTag 409` — bukan `NAlert error "Server Error"`; `getErrorMessage` menampilkan `error.data.references` bukan generic; `statusCode 409` tidak di-intercept sebagai 401/403; story `conflict` |
| ERR-06 | 401 tanpa token | Any `*` → 401 | `useApi`/`$fetch` interceptor: `authStore.logout()` + `navigateTo('/login')` + toast `Sesi berakhir`; Storybook unauthenticated variant |
| ERR-07 | 403 tanpa permission | Any → 403 | Floating global `AccessDeniedAlert.vue` single (`data-testid=access-denied`, top16 right16 max448 slideIn 300ms auto4s, `Locked` h-render) via `rbac-denied` event — 1 event→1 feedback |
| ERR-08 | 404 slug/tabel tidak ada | Browse `GET /api/master-data/:slug` → 404 | `NAlert` + `NEmpty` + `Kembali ke Master Data`; JSON `{ statusCode:404, message:"Master table \"x\" not found" }` |
| ERR-09 | Puppeteer PDF gagal (Chrome absen, timeout 30s) | `POST .../preview-pdf` / `POST .../runs` → 500 | `NAlert error Gagal generate PDF` + `Coba lagi` retry tanpa reset `data`/`search/sort/page`; draft tetap `DRAFT` (`pdfPath null`); `pdfError` dikirim ke client; test skip bila Chrome absen (ERR-04 live verified 500 contract) |
| ERR-10 | Upload image >5MB / tipe salah | `NUpload` + `POST /api/settings/upload` → 400 | `NAlert` + inline `Upload gagal: maksimal 5MB` (reuse `general` whitelist) + retry; client preflight `file.size` |

### Flow → UI Mapping

| Flow Step | Halaman (dari UI-design `08`) | Component (implement `09`) | State (08 `States` table → wire `09`) |
|-----------|-------------------------------|----------------------------|--------------------------------------|
| Step 1-3 Definisi | `/dashboard/master-data` + `create` | `MasterDataDefinitionForm.vue`, `ColumnConfigPanel.vue`, `MasterTableDataTable.vue` (PageShell + DataTable 320/160) | loading `NSpin` → empty `NEmpty+CTA` → validation `NFormItem` → 409 duplicate (ERR-01) → success toast → conflict 409 (ERR-05) via `ReferenceList` |
| Step 4-7 Browse+Rows | `/dashboard/master-data/:slug` | `MasterRowTable.vue`, `MasterRowForm.vue` (13 tipe + `IDRInput.vue`), `RelationPickerModal.vue`, `master-operation.ts` | search/sort/visibility/pagination + loading/empty/error `NAlert+Coba lagi` + validation 400 + operasi warning |
| Step 8-9 Component | `/dashboard/components` | `ComponentEditor.vue` (Tiptap `ClientOnly`), `BindingPopup.vue`/`BindingPalette.vue`, `ReferenceList.vue` wire | `is_looping` validation 400 + preview drawer 600px + 409 delete `ReferenceList` (fix bug pemicu) |
| Step 10-12 Template | `/dashboard/templates` + `/:id` | `TemplateBuilder.vue` 3-pane (`260\|1fr\|320`), `ComponentLibrary.vue` `NTree`, `DocumentCanvas.vue` (drag-drop HTML5 + keyboard), `PropertyPanel.vue` `NForm` live, `RepeaterEditor`+`ConditionEditor`+`DataBindingEditor`, `LoopingPicker.vue` | drag-over ghost + selection ring `#0075de` + `pilih semua` indeterminate + validation publish BR-002/003 (400) + 409 delete (ERR-05) + preview HTML/PDF |
| Step 13 Administrasi | `/dashboard/administrations` | `AdministrationForm.vue`, `StepMappingEditor.vue` (`NDynamic` step.field + NSelect template) | duplicate 409 (name/slug) + mapping incomplete 400 (DR-002) + success |
| Step 14-15 Wizard | `/dashboard/documents/:slug` | `AdminWizard.vue` `NSteps vertical`, `DocumentPreviewDrawer.vue` | per-step validation + `+ Tambah Step` + review pagebreak + PDF combine 500 retry + draft banner localStorage + 409 document_number duplicate |
| Step 16 Delete proteksi | All `DELETE` | `ReferenceList.vue` modal + `NAlert warning` + `NTag 409` — **wired di `09`** | 409 `ReferenceList` (bukan Server Error), cancel/confirm, 401/403/404/500 mapping |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | DTO Validation (Zod) | Error → UI |
|-----------|-------------|--------------|----------------------|------------|
| Step 3 | POST | `/api/master-data` | `CreateMasterTableSchema` (name/display/slug/blacklist `[a-z][a-z0-9_]` + 13 tipe discriminated) | 400 `NFormItem` (BR-001), 409 slug dupe `NAlert warning` (ERR-01) |
| Step 4-7 | GET | `/api/master-data/:slug/rows` | `QueryMasterRowSchema` (`page/limit/search/sortBy(orderable whitelist)/sortOrder`) | 400 non-searchable/orderable → 400 inline; 404 slug → NEmpty 404 |
| Step 7 | POST | `/api/master-data/:slug/rows` | Row `validateAndCompute` (13 tipe + `ExpressionService` recompute + image allowlist) | 400 div-by-zero/required/image → NAlert warning; success 201 |
| Step 8-9 | **DELETE (bug pemicu)** | **`/api/doc-components/:id`** | `—` (id param) + `DocComponentsService.findReferences(name)` (`schemaJson` componentId + `tiptapJson` component) | **409 → `ReferenceList` modal (bukan Server Error) — FIX 09**; 404 → NAlert; 403/401 → interceptor |
| Step 8-9 | POST/PUT | `/api/doc-components` `/api/doc-components/:id` | `CreateDocComponentSchema` (`name unique, is_looping→item.* BR-003, tiptap_json 1MB, TiptapDocSchema`) | 409 name dupe (ERR-01), 400 Tiptap/loop (ERR-02) |
| Step 10-12 | DELETE | `/api/doc-templates/:id` | `DocTemplatesService.remove` check `AdminStepSchema` | 409 `steps/administrations` list (ERR-05) |
| Step 10-12 | POST/PUT | `/api/doc-templates` | `CreateDocTemplateSchema`/`UpdateDocTemplateSchema` (`code [a-z0-9-_]{2,60} unique, DocNodeSchema, status DRAFT→PUBLISHED→ARCHIVED, version bump BR-005`) | 409 name/code dupe, 400 DocNode/requirement/BR-003 |
| Step 11 | POST | `/api/doc-templates/:id/preview-pdf` | `PreviewPdfSchema` (`data, page {size, orientation}`) + `registry()` | 500 Puppeteer → NAlert retry |
| Step 11 | POST | `/api/documents/preview|pdf` | `DocNodeSchema` `assertTreeLimits` (depth≤10 total≤200 item/level 500) | 400/500 sesuai engine 05 |
| Step 13 | POST/PUT | `/api/administrations` | `CreateAdministrationSchema` (`name unique, slug [a-z][a-z0-9-]{1,60} unique, steps {template_id, step_order unique, mapping} max20`) | 409 name/slug dupe (ERR-05), 400 step_order dupe/incomplete mapping DR-002 |
| Step 13-15 | DELETE/PUT | `/api/administrations/:id` | `replaceSteps` + `DR-002` | 400 incomplete, 404 template not found |
| Step 15 | POST | `/api/administrations/:id/runs` | `RunWizardSchema` (`data, extra_steps max20, document_number unique BR-006, as_draft`) + `buildSystemContext` + `generatePdfFromHtml` | 409 document_number dupe (ERR-05), 400 no steps/incomplete, 404 template, 500 pdfError→draft |
| Step 15-16 | GET/DELETE | `/api/documents/:id/pdf`, `DELETE /api/documents/:id` (cancelRun) | `DocumentSchema` | 404, 403 |

## Requirements

> MANDATORY — mengacu User Flow di atas dan UI design FASE 1 `08`. Tidak mengulang design, hanya menambah acceptance wiring.

### Tujuan Fitur

- REQ-G01: **Memperbaiki bug DELETE 409** agar tidak tampil sebagai `Server Error` generik — dari `toast Gagal menghapus` samar menjadi **`NAlert warning + modal ReferenceList` informatif** dengan daftar `references` dan tautan `Lihat`, sehingga user tahu mengapa terproteksi dan tindakan yang harus diambil (lepas referensi dulu). — mengcover **Step 16 / ERR-05 / AC-002**.
- REQ-G02: **Menyeragamkan penanganan semua error sejenis Task 05–07** (duplicate 409, validation 400, 404, 401/403, 500 PDF, div-by-zero, image allowlist, upload 5MB, loop BR-003, publish BR-002, version bump BR-005, whitelist search/orderable BR-006, status transition, step_order unique, document_number unique) ke dalam **satu pola UX** (`NAlert/NEmpty/NFormItem` + `ReferenceList` + retry tanpa reset + `AccessDeniedAlert` single + `prefers-reduced-motion`) — mengcover **semua ERR-01..10 + ALT-01..06**.
- REQ-G03: **Wiring Storybook → halaman nyata** agar prototype interaktif `08` (klik tanpa dead-end) menjadi **implementasi nyata** dengan **library relevan** (Tiptap + Naive UI + Tailwind + `@vueuse/core` helper) yang konsisten token (`#0075de`/`#f6f5f4`/Inter/radius/`@vicons/carbon`) dan responsive (desktop/tablet/mobile) + a11y — mengcover **Step 1-16**.
- REQ-G04: **Playwright flow executable** untuk letter builder (Master Data → Component → Template → Administrasi → Wizard → PDF) dari design `08` (`E2E-01..06`) agar dapat di-`npm run test:e2e` HEADLESS=1 sejak 09 — termasuk `409 live` tanpa Chrome skip.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Super Admin | Definisi Master Data DDL + Component/Template publish + Administrasi + run FINAL | `Master Data Write` + `Component Write` + `Template Write` + `Administration Write` + `Document Write` + `Full Access` guard/perm |
| Admin | CRUD baris Master Data + buat Component/Template draft + Preview PDF | `Master Data Read/Write` + `Component Read/Write` + `Template Read/Write` |
| Operator | Jalankan wizard hasil surat (isi data + tambah step N + PDF gabungan) | `Document Write` + `Administration Read` + `Template Read` |
| Viewer | Lihat browse Master Data + Template + hasil dokumen (read-only) | `Master Data Read` + `Document Read` |
| Guest (unauth) | Tidak dapat akses; redirect login | — (401) |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Super Admin | Buat tabel Pegawai 5 kolom (incl. number+IDR+hidden_operation) | `mst_pegawai` + menu | Step 1-3 |
| UC-02 | Admin | Browse Pegawai: search "afd" (searchable), sort gaji (orderable), hide kolom, pagination | Hasil tersaring/terurut + visibility persist | Step 4-5 |
| UC-03 | Admin | Isi form baris 13 tipe + relation picker single + operasi live + upload image | Row tersimpan, operasi identik server | Step 6-7 |
| UC-04 | Admin | Buat Component Kop via right-click binding (plus fallback `+ Binding` button) + preview | Inline node + preview | Step 8-9 |
| UC-05 | Admin | Buat Template SK: drag Kop+Daftar, looping picker pilih semua, requirement master/manual/system, auto-form, preview HTML+PDF, publish | Template PUBLISHED v1, auto-form lengkap | Step 10-12 |
| UC-06 | Admin | Buat Administrasi "SK Pengangkatan" dengan 2 steps + mapping lengkap | Administrasi + slug + menu baru | Step 13 |
| UC-07 | Operator | **Hapus Component `Kop` yang dipakai Template SK → 409 + ReferenceList** (bug pemicu) | **Modal `ReferenceList: template:SK Pengangkatan` + warning, tidak terhapus, bukan Server Error** | **Step 16 / ERR-05** |
| UC-08 | Super Admin | Hapus Master Data tabel/column yang dipakai relation/template → 409 + refs | Modal `ReferenceList` + backup hint | Step 16 / ERR-05 |
| UC-09 | Admin | Hapus Template yang dipakai Administrasi Step → 409 steps/administrations | Modal daftar step | Step 16 / ERR-05 |
| UC-10 | Operator | Wizard tambah-step N: isi data → mapping step1 → tambah step2 → review → PDF → save run (duplicate document_number → 409) | Dokumen FINAL + PDF, version dikunci | Step 14-15 |

### Functional Requirements

- FR-001: **Master Data definisi** — form `name/display_name/slug/description` + `NDynamicInput` editor kolom 13 tipe discriminated — mengcover Step 1-3 (reuse 06).
- FR-002: **DDL preview & guard** — sanitasi slug/kolom `[a-z0-9_]`, blacklist `users, roles, mst_, sqlite_, master_, documents, doc_`, minimal 1 kolom, konfirmasi destruktif + backup design — Step 2-3 (reuse 06, wiring 09).
- FR-003: **Browse** — `PageShell` + `DataTable` kanonis (search 320px + field 160px `Semua Kolom` + `Restart` + `Settings` visibility) → server pagination `page/limit/search/sortBy/sortOrder` — hanya `is_searchable`/`is_orderable` aktif (whitelist 400) — Step 4-5.
- FR-004: **Form baris 13 tipe** (text, richtext sanitized, date `m-d-Y`, datetime `m-d-Y H:i:s`, time `H:i:s`, image `NUpload` dragger path `storage/general/`, select, select_multiple JSON, relation_single/multiple via modal, number+IDR realtime via `IDRInput.vue`, hidden_operation_text vs readonly_operation_text) — Step 6-7.
- FR-005: **Relation picker** — `RelationPickerModal.vue` full: tabel relasi `NDataTable` + global search debounce 300ms + sort tiap kolom (Carbon ArrowUp/Down 14px primary) + checkbox (single=radio, multiple=N) + bulk pilih semua + pagination ID `Menampilkan {from}-{to} dari {total}` — Step 6,14.
- FR-006: **Operasi-teks** — grammar `concat("++"concat)*` / `"..."` / `col_ref/number/(expr)` / `* / + -` → preview klien `evalTextOperation` (Task05) identik server + div-by-zero → `null`+warning — Step 7 (reuse 05).
- FR-007: **Component Tiptap** — editor `ClientOnly` + toolbar (bold/italic/underline/align/list/table/link/image/undo/redo) + `BindingPopup` right-click (nama+view) + fallback `+ Binding` button 44px hit + `is_looping` validation `BR-003` (`item.*` required) — Step 8-9; **FIX 09**: wiring 409 `ReferenceList` saat delete dipakai.
- FR-008: **Template Builder 3-pane** — `260px NTree Library | flex-1 canvas warm #f6f5f4 | 320px Properties NForm live` (`useBuilderStore` blocks/selectedId/update/move/add), drag-drop HTML5 + keyboard reorder Up/Down + `EmptyStateCard` — Step 10; wiring `LoopingPicker.vue` pilih semua indeterminate.
- FR-009: **Binding & requirement** — embed component → requirement table (Master Data via `GET /api/master-data/:slug/schema` / manual / system `letter/office/signer/current_date`); repeater editor `source=item` (`pegawai→pegawai.*`); condition `field/operator/value` + elseChildren — Step 10-11.
- FR-010: **Looping picker pilih semua** — modal/panel pilih `tabel mst_*` → checklist kolom + header `Pilih semua` → repeater node; auto-form ter-generate dari semua requirement (source ikut) — Step 10-11 (wiring `LoopingPicker.vue`).
- FR-011: **Preview & Publish** — Preview HTML drawer 600px + Preview PDF (`POST /api/doc-templates/:id/preview-pdf` reuse engine05) + validasi publish `BR-002` (semua requirement terpetakan + ≥1 blok konten) → 400 sorot field + version bump `BR-005` — Step 11-12.
- FR-012: **Administrasi** — `NDynamic` field `step.field` (tambah terus) + steps `template_id+order+mapping_json` (`N dynamic` steps + `NSelect` template + mapping per requirement `DR-002`) — Step 13.
- FR-013: **Wizard hasil** — `NSteps` vertical guided (`Data → SK → Tanda Tangan → Review`), per-step `NForm` + validation, tambah-step N append, render gabungan concatenation + `pagebreak` + PDF gabungan (A4/F4/Letter × portrait/landscape) → `POST /api/administrations/:id/runs` → snapshot `template_version` + `rendered_html` (BR-005) + duplicate `document_number` → 409 (ERR-05) — Step 14-15.
- FR-014: **Proteksi & audit (FIX UTAMA 09)** — **Duplicate 409** (name/slug/code/document_number) → `NAlert warning` + `data.references`; **Referensi 409** (`findReferences` semua sumber) → **`ReferenceList.vue` modal** (template:SK, component:Kop, table:pegawai:column) + `NTag 409`; **400** validation → inline `NFormItem`; **404** slug → `NEmpty`; **401→/login**, **403** single alert, **500 PDF** retry tanpa reset — Step 16 (ERR-05) + semua ERR.
- FR-015: **States & persist** — loading `NSpin/NSkeleton`, empty `NEmpty Belum ada data`+CTA pill, error `NAlert Gagal memuat data+Coba lagi` tanpa reset, success `Berhasil`, `ReferenceList` conflict 409, permissionDenied, draft banner localStorage, invalid binding red ring — semua ada Storybook variant `08` + wire di `09`.

### Business Rules

- BR-001 (FR-002): `slug` `[a-z][a-z0-9_]{1,60}`, unik, blacklist (`users, roles, permissions, guards, mst_, sqlite_, master_, documents, doc_, master-data`) → 400 bila ilegal, 409 bila dupe — ERR-01.
- BR-002 (FR-011): Publish Template wajib semua requirement terpetakan + minimal 1 blok konten + `is_looping` valid (≥1 `item.*`) — else 400 sorot field (ERR-02).
- BR-003 (FR-007/005): `relation_*` target harus tabel aktif `status ACTIVE`; hapus tabel/kolom dipakai → 409 + daftar (`ReferenceList`), tidak CASCADE diam-diam — **fix 09 wiring** (ERR-05).
- BR-004 (FR-013/014): `step_order` unik per administration (INV-002); mapping step wajib lengkap (`DR-002` → 400); `document_number` unik bila diisi → 409 (ERR-05).
- BR-005 (FR-011/013): Versioning snapshot — setiap publish naikkan `version` (`PUBLISHED` atau edit schema `PUBLISHED`); run mengunci `template_version` + `rendered_html`; run lama tak berubah — `invariants Task07`.
- BR-006 (FR-003): Hanya `is_searchable` → search, `is_orderable` → sort; `isMasterPhysicalTable` ignore `mst_*` drift — 400 bila salah (BR-003 Task06).
- BR-007 (FR-006): Div-by-zero → `null` + warning `NAlert`, tidak `Infinity`; binding hilang → `''` + warning header (BR-002 Task05) — ERR-03.
- BR-008 (FR-014): `m.Upload` 5MB image; `tiptap_json/schema_json` 1MB (`MAX_JSON_BYTES`); `DocNode` depth ≤10, total ≤200, item/level 500 + warning — EC-08.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Operator batal wizard tengah jalan (close browser) | Autosave draft `DRAFT` di localStorage (`letter-builder:draft:<slug>`) + banner `Lanjutkan draft?` resume | Step 14 |
| EC-02 | Nested repeater 2 level × 500 item (50 pegawai × 10 trips) | Cap 500/level + warning header `Dipotong 500` + paginasi preview (`NAlert info`) — BR-008 | Step 11,15 |
| EC-03 | Logo image hilang (path broken `https://`/`/api/storage/` invalid) | Preview: placeholder bordered + `NAlert warning "Gambar tidak ditemukan"`, tidak gagal render; upload retry | ERR-09 |
| EC-04 | Rename kolom relation target (`Jabatan.nama → title`) | Runtime lookup longgar: binding lama badge `Invalid` + pilih ulang, tidak FK kaku; warning di Properties | ERR-02 |
| EC-05 | Right-click tidak tersedia (mobile/tablet) | Fallback toolbar `+ Binding` button + long-press → same `BindingPalette` (min hit 44px) | Step 8 |
| EC-06 | `mst_*` 100 kolom / 50k baris | Cap form 100 kolom + virtual scroll definisi builder; browse server pagination + index `LIKE` | Step 4 |
| EC-07 | `select_multiple` JSON invalid | Zod discriminated → inline error + reset via `NSelect` multiple; unit disc. union test | ERR-01 |
| EC-08 | PDF timeout 30s (server) | 500 → `Coba lagi` tanpa hapus draft; client timeout `NSpin` + cancel token | ERR-09 |
| EC-09 | **409 race**: dua admin hapus komponen/template yang sama berdekatan | Second → 404 (already deleted) bukan 409; first 409 tetap modal; idempotency `DELETE` tidak double-throw 500 | ERR-05 |
| EC-10 | `findReferences` memakai string `includes` false-positive (nama substring) | **Mitigasi 09**: harus match exact `"<<key>":"<name>"` (sudah ada) — bukan substring; unit test reference leak | ERR-05 |
