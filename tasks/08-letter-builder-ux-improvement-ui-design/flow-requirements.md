## User Flow

> MANDATORY — Flow interaksi di prototype. Menjadi ACUAN untuk FASE 2 `tasks/09-letter-builder-ux-improvement/` (Implementation). Harus konsisten FASE 1 ↔ FASE 2.

### Diagram

```text
[Super Admin] → /dashboard/master-data → Create Definisi (name+columns 13 tipe) → POST /api/master-data → mst_pegawai tercipta + menu Master Data → Pegawai
    → /dashboard/master-data/pegawai → Browse (search searchable only | sort orderable only | visibility localStorage | pagination) → Create Baris (form dinamis + relation picker modal + operasi-teks preview live + IDR realtime + image upload) → POST /api/master-data/pegawai/rows → toast Berhasil → list refresh
    → GET /api/master-data/pegawai/schema ──┐
                                             │
[Admin] → /dashboard/components → Create Component Kop (Tiptap editor + right-click BindingPalette: nama data + view text/image/component → mapping) → is_looping? → binding item.* check → Preview drawer → Save → Component v1
    → /dashboard/templates → Create Template SK (3-pane: Library NTree | Canvas drag-drop+reorder caret | Properties NForm live) → Embed Component Kop + Daftar → Requirement terisi (Master Data via schema di atas / manual / system letter/office/signer/current_date) → Looping picker (pilih tabel mst_pegawai + kolom + pilih semua) → repeater node source=item → Auto-form dari requirement → Preview HTML → Preview PDF (reuse engine Task 05) → Publish (validasi BR-002+BR-003) → version bump
    → /dashboard/administrations → Create Administrasi "SK Pengangkatan" (data step.field dinamis + steps pilih template + mapping_json per step) → Save
    → Menu Persuratan → [SK Pengangkatan] → /dashboard/documents/sk-pengangkatan → Wizard (NSteps vertical: Data → Step1 SK → Step2 Tanda Tangan → +step N → Review gabungan) → isi data → tambah step → isi mapping → +step lagi → render gabungan (pagebreak) → PDF gabungan → Save run (kunci template_version + snapshot rendered_html) → menu Dokumen per run → unduh PDF / cancel

Alternate/Error: Empty (NEmpty+CTA) | Validation (NFormItem inline) | 409 ref (daftar pemakai) | 404 slug hilang | 401→/login | 403→AccessDeniedAlert single rbac-denied | 400 Zod/DLL blacklist | 500 PDF Puppeteer → retry
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | Super Admin | Buka Master Data → Create definisi Pegawai (nama, deskripsi, 5 kolom incl. text+date+number+IDR+hidden_operation) | `/dashboard/master-data` → `/dashboard/master-data/create` | Form definisi kosong (NDynamicInput kolom) |
| 2 | Super Admin | Isi `name=pegawai, display_name=Pegawai`, tambah kolom: `nama (text required searchable)`, `jabatan (relation_single → Jabatan)`, `gaji (number IDR realtime)`, `total = gaji*2 (hidden_operation_text)`, `foto (image)` | `MasterDataDefinitionForm.vue` + `ColumnConfigPanel.vue` + Zod preview operasi | Validasi live; slug sanitize ` Pegawai ` → `pegawai`, blacklist tolak `users`/`mst_*` |
| 3 | Super Admin | Submit valid | `POST /api/master-data` | `mst_pegawai` tercipta (DDL), toast Berhasil, redirect list definisi, menu `Master Data → Pegawai` muncul |
| 4 | Admin | Buka Browse Pegawai | `/dashboard/master-data/pegawai` → `GET /api/master-data/pegawai/rows?page&limit&search&sortBy&sortOrder` | PageShell + MasterRowTable (DataTable kanonis header eyebrow, search 320px + field 160px + Restart + Settings) |
| 5 | Admin | Search "afd" (hanya kolom `is_searchable`) + sort `gaji` (hanya `is_orderable`) + hide kolom via visibility toggle (persist per slug `localStorage:master-data:pegawai:visibility`) + paginasi 20 | DataTable toolbar + `useTable` composable | Hasil tersaring/terurut tanpa reload; kolom non-orderable header tidak sortable; `Menampilkan {from}-{to} dari {total}` |
| 6 | Admin | Klik Create Baris → isi form dinamis 13 tipe (date format `m-d-Y`, IDR `Rp 2.500.000` realtime, image NUpload dragger, relation) → klik relation_single Jabatan → modal picker | `MasterRowForm.vue` + `RelationPickerModal.vue` (NDataTable + search all + sort tiap kolom + checkbox 1) | Modal terbuka: search debounce 300ms, sortable semua kolom, checkbox single (radio behavior), `is_looping` belum relevan |
| 7 | Admin | Pilih Jabatan → preview operasi `total` live (`evalTextOperation` reuse Task 05 → `"Total: "++gaji+bonus` → `2500000`) → upload image 2MB → Save | `POST /api/master-data/pegawai/rows` (komputasi server identik) | 201, operasi=`null`+pesan bila div-by-zero; toast + list refresh; row baru di page 1 |
| 8 | Admin | Buat Component Kop di Tiptap: insert logo image + ketik "Kepala Dinas" → right-click → `BindingPalette` (nama=`kop.nama`, view=`text`) → pilih `Master Data: pegawai.nama` | `/dashboard/components` → `ComponentEditor.vue` (Tiptap wrapped ClientOnly + BubbleMenu + toolbar bold/italic/list/table/link/image) | Inline node non-editable `<span data-binding="pegawai.nama" class="binding-pill">` muncul; toolbar tidak hilang; popup punya fallback button `+ Binding` untuk mobile (tanpa right-click) |
| 9 | Admin | Buat Component Daftar Pegawai (`is_looping=true`, binding `item.nama`/`item.nip`) → Preview | `ComponentEditor` + `BindingPopup` + validation BR-003 | Preview render 2 baris sample; publish ditolak bila `is_looping` tanpa `item.*` (inline error) |
| 10 | Admin | Buat Template SK di Builder 3-pane (Library NTree kiri | Canvas tengah drag-drop HTML5 + reorder Up/Down keyboard + EmptyStateCard | Properties kanan NForm live `useBuilderStore`) → drag Kop + Daftar ke canvas → embed component | `/dashboard/templates/create` → `TemplateBuilder.vue` + `ComponentLibrary.vue` + `DocumentCanvas.vue` + `PropertyPanel.vue` | Canvas menampilkan Kop (header) + Daftar (repeater source=`pegawai`, item=`item`, columns picker: tabel×kolom + `pilih semua` checkbox header) + pagebreak visual |
| 11 | Admin | Isi requirement: `pegawai → master_data:pegawai`, `tanggal → system:current_date`, `kop → manual:"Kop Dinas ..."` → Auto-form tergenerate (NForm per requirement) → isi auto-form → Preview HTML Drawer 600px → Preview PDF | `DataBindingEditor.vue` + `RepeaterEditor.vue` + `ConditionEditor.vue` + `AutoForm.vue` + `DocumentPreviewDrawer.vue` | Auto-form menampilkan semua requirement (source ikut dihitung); preview HTML escaped + sanitasi richtext; Preview PDF reuse `POST /api/doc-templates/:id/preview-pdf` (engine Task05) → PDF A4 portrait terbuka |
| 12 | Admin | Publish Template (cek BR-002: semua requirement terpetakan + minimal 1 blok konten + `is_looping` valid) → version 1→2 | `PUT /api/doc-templates/:id` (status PUBLISHED) | Toast, list badge `PUBLISHED`; run lama tetap snapshot v1 |
| 13 | Admin | Create Administrasi "SK Pengangkatan" → isi `step1.nomor (text)`, `step1.tanggal (date)`, tambah Steps: Step1→Template SK (mapping `pegawai→pegawai.selected` via `schema` API), Step2→Template Tanda Tangan (mapping `penandatangan→manual`) | `/dashboard/administrations/create` → `AdministrationForm.vue` + `N Dynamic` fields `step.field` (tambah terus tanpa reset) + `StepMappingEditor.vue` | Administrasi tersimpan (slug `sk-pengangkatan`), ActivityLog `ADMINISTRATION_CREATE`, menu Persuratan → `[SK Pengangkatan]` muncul |
| 14 | Operator | Buka menu `[SK Pengangkatan]` → `/dashboard/documents/sk-pengangkatan` → Wizard (NSteps vertical `Data → SK → Tanda Tangan → Review`) → isi `nomor`, pilih pegawai via RelationPicker (multiple), isi tanggal → Klik `+ Tambah Step` → mapping step2 | `AdminWizard.vue` (NSteps + NForm per step + Validation per step + Draft autosave DRAFT) | Wizard guided: step tidak bisa next bila required kosong (inline error); tambah step ke-N append mapping independen; progress bar; keyboard Tab order |
| 15 | Operator | Review gabungan (2 template concatenation + `pagebreak` divider) → Render HTML gabungan + PDF gabungan → Save run | `POST /api/administrations/:id/runs` → `renderer.service` + `pdf.service` (page_size A4) | Dokumen `FINAL` tersimpan (`data_json`, `rendered_html`, `pdf_path`, `template_version` dikunci); dokumen card di `/dashboard/documents` + pdf download `GET /api/documents/:id/pdf` (`application/pdf`) |
| 16 | All | Aksi destruktif: hapus Component/Template/Master Table yang masih dipakai → konfirmasi NDialog dua langkah + backup `storage/backups/` (untuk DDL) | DELETE routes | 409 + daftar referensi (modal `ReferenceList.vue`); cancel → tutup; confirm → hard-delete (rows) atau ARCHIVED (table) |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Master Data kosong (0 definisi) | `/dashboard/master-data` → Empty | `NEmpty` + illustration + `Belum ada definisi` + CTA `+ Buat Tabel Pertama` (pill primary `#0075de`) — no dead-end; story variant `empty` |
| ALT-02 | Browse `mst_pegawai` kosong (0 rows) | Browse → Empty | `NEmpty` + `Belum ada data Pegawai` + CTA `+ Tambah Data Pertama` (BR Task 04 empty-state card `#f6f5f4` xl16) |
| ALT-03 | Visibility toggle menyembunyikan semua kolom | Toolbar Settings → hide all | Guard: minimal 1 kolom visible (disable last hide + tooltip "Minimal satu kolom"); persist per slug di localStorage |
| ALT-04 | Relation picker 0 baris relasi | Modal → Empty | `NEmpty` di dalam modal + search reset CTA `Atur ulang` (`emit('refresh')`) tanpa tutup modal |
| ALT-05 | Component dibatalkan belum save | Editor → Back/Cancel | `NDialog` "Batalkan perubahan?" (unsaved guard `onBeforeRouteLeave`) — story `unsaved` |
| ALT-06 | Template masih DRAFT, belum publish | List → badge | `NTag` `DRAFT` (eyebrow, `#a39e98`); aksi Preview tetap aktif, Publish disabled dengan tooltip "Lengkapi mapping" |
| ERR-01 | Validasi Master Data (slug duplikat/blacklist `users`/`mst_`, kolom duplikat, minimal 1 kolom) | Submit definisi → 400 | Inline `NFormItem` feedback + `NAlert` summary di atas form + focus first error; story `validation` |
| ERR-02 | Validasi Tiptap binding (`is_looping` tanpa `item.*`, source bukan array) | Save Component/Template → 400 | Inline badge `Invalid binding` di canvas node (merah `#EF4444`) + tooltip + `NAlert` list; Publish blocked |
| ERR-03 | Operasi-teks div-by-zero / kolom hilang | Form row → preview/save → null+pesan | Field `readonly_operation_text` menampilkan `—` + `NAlert` warning "Pembagian nol"; blokir save bila required; server 400 dengan `errors[]` sinkron Zod |
| ERR-04 | DDL alter destruktif (hapus/rename kolom) | Update definisi → confirm | `NDialog` dua langkah: ringkasan perubahan + warning "Data kolom lama hilang, backup tersedia" + path `storage/backups/*.sqlite` + checkbox "Saya mengerti" required |
| ERR-05 | Hapus terproteksi (Master Table/column dipakai relation/template, Component/Template dipakai) | Delete → 409 | `NAlert` + modal `ReferenceList` (list `Template SK memakai Component Kop`, `Administrasi SK memakai Master Pegawai`) — tanpa 500; story `conflict` |
| ERR-06 | 401 tanpa token | Any API → 401 | Axios interceptor: clear token + redirect `/login` + toast `Sesi berakhir`; Storybook play: unauthenticated variant |
| ERR-07 | 403 tanpa permission | Any → 403 | Floating global `AccessDeniedAlert` single (`data-testid=access-denied`, top16 right16 max448px, slideIn 300ms, auto-dismiss 4s, `NIcon` `Locked`) via `rbac-denied` event — 1 event → 1 feedback, no duplicate per page; story `permissionDenied` |
| ERR-08 | 404 slug/tabel tidak ada | Browse → 404 | `NAlert` + `NEmpty` + `Kembali ke Master Data`; `GET /api/master-data/:slug` 404 JSON |
| ERR-09 | Puppeteer PDF gagal (Chrome absen, timeout 30s) | Preview PDF / Wizard PDF → 500 | `NAlert` error `Gagal generate PDF` + `Coba lagi` (emit retry tanpa reset `search/sort/page`/`data`) + log server, tanpa path setengah-jadi; draft tetap DRAFT; story `pdfError` + E2E skip bila Chrome absen (ERR-04 live verified via 500 contract) |
| ERR-10 | Upload image >5MB / tipe salah | NUpload → 400 | `NAlert` + inline `Upload gagal: maksimal 5MB` (reuse `master`/`general` whitelist) + retry; client size check preflight |

## Requirements

### Tujuan Fitur

- REQ-G01: Menyatukan UX pembuatan surat (Master Data → Component → Template → Administrasi → Wizard → PDF) menjadi alur guided yang mudah dipakai user non-teknis (klik tanpa dead-end, empty+CTA, validation inline, retry tanpa reset).
- REQ-G02: Menggunakan library component yang relevan (Tiptap v2 untuk richtext ber-binding + Naive UI `NSteps/NTree/NDynamicInput/NUpload/NDatePicker` untuk form/wizard) agar pembuatan surat lebih cepat & konsisten tanpa dev membuat template baru.
- REQ-G03: Merancang Playwright test flow (happy + alternate/error + permission + edge) untuk Task 05-06-07 yang dapat dieksekusi di FASE 2 (`npm run test:e2e`) dari design ini.
- REQ-G04: Mendesain penanganan seluruh error tercatat (05-07) di level UI agar tidak ada 500 mentah atau dead-end.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Super Admin | Definisi Master Data DDL + hapus + Component/Template publish + Administrasi | `Master Data Write` + `Document Component/Template/Administration Write` + `Full Access` |
| Admin | CRUD baris Master Data + buat Component/Template draft + jalankan Preview PDF | `Master Data Read/Write` + `Component/Template Read/Write` |
| Operator | Jalankan wizard hasil surat (isi data + tambah step N + PDF gabungan) | `Document Write` |
| Viewer | Lihat browse Master Data + Template + hasil dokumen (read-only) | `Master Data Read` + `Document Read` |
| Guest (unauth) | Tidak dapat akses; redirect login | — |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Super Admin | Buat tabel Pegawai 5 kolom (incl. number+IDR+hidden_operation) | `mst_pegawai` + menu | Step 1-3 |
| UC-02 | Admin | Browse Pegawai: search "afd" (searchable), sort gaji (orderable), hide kolom, pagination | Hasil tersaring/terurut + visibility persist | Step 4-5 |
| UC-03 | Admin | Isi form baris 13 tipe + relation picker single + operasi live + upload | Row tersimpan, operasi identik server | Step 6-7 |
| UC-04 | Admin | Buat Component Kop via right-click binding (plus fallback `+ Binding` button) + preview | Inline node + preview | Step 8-9 |
| UC-05 | Admin | Buat Template SK: drag Kop+Daftar, looping picker pilih semua, requirement master/manual/system, auto-form, preview HTML+PDF, publish | Template PUBLISHED v1, auto-form lengkap | Step 10-12 |
| UC-06 | Admin | Buat Administrasi "SK Pengangkatan" dengan 2 steps + mapping lengkap | Administrasi + slug + menu baru | Step 13 |
| UC-07 | Operator | Wizard tambah-step N: isi data → mapping step1 → tambah step2 → review gabungan → PDF → save run | Dokumen FINAL + PDF tersimpan, version dikunci | Step 14-15 |
| UC-08 | Any | Hapus terproteksi: Master Table/Component dipakai → 409 | Daftar referensi, tolak | Step 16 |

### Functional Requirements

- FR-001: **Master Data definisi** — form `name/display_name/slug/description` + `NDynamicInput` editor kolom (13 tipe disciminated) — mengcover Step 1-2.
- FR-002: **DDL preview & guard** — sanitasi slug/kolom `[a-z0-9_]`, blacklist `users, roles, mst_, sqlite_, master_`, minimal 1 kolom, konfirmasi destruktif + backup design — Step 2-3.
- FR-003: **Browse** — PageShell + DataTable kanonis (search 320px + field 160px  `Semua Kolom` + `Restart` + `Settings` visibility) → server pagination `page/limit/search/sortBy/sortOrder` — hanya kolom `is_searchable`/`is_orderable` aktif — Step 4-5.
- FR-004: **Form baris 13 tipe** (text, richtext sanitized, date `m-d-Y`, datetime `m-d-Y H:i:s`, time `H:i:s`, image `NUpload` dragger path `storage/general/`, select, select_multiple JSON, relation_single/multiple via modal, number+IDR realtime, hidden_operation_text (tak dirender) vs readonly_operation_text (disabled)) — Step 6-7.
- FR-005: **Relation picker** — `RelationPickerModal.vue` full: tabel relasi `NDataTable` + global search debounce 300ms + sort tiap kolom (Carbon ArrowUp/Down 14px primary) + checkbox (single=radio, multiple=N) + bulk pilih semua + pagination ID `Menampilkan {from}-{to} dari {total}` — Step 6,14.
- FR-006: **Operasi-teks** — grammar `concat("++"concat)*` / `"..."` / `col_ref/number/(expr)` / `* / + -` → preview klien reuse `evalTextOperation` (Task05) identik server + div-by-zero → `null` + warning — Step 7.
- FR-007: **Component Tiptap** — editor `ClientOnly` + toolbar (bold/italic/underline/align/list/table/link/image/undo/redo) + `BindingPopup` right-click (nama+view) + fallback `+ Binding` button (mobile) + `is_looping` validation BR-003 — Step 8-9.
- FR-008: **Template Builder 3-pane** — `260px NTree Library | flex-1 canvas warm #f6f5f4 | 320px Properties NForm live` (`useBuilderStore` blocks/selectedId/update/move/add), drag-drop HTML5 + keyboard reorder Up/Down + EmptyStateCard — Step 10.
- FR-009: **Binding & requirement** — embed component → requirement table (Master Data via `GET /api/master-data/:slug/schema` / manual / system `letter/office/signer/current_date`); repeater editor `source=item` (`pegawai→pegawai.*`); condition `field/operator/value` + elseChildren — Step 10-11.
- FR-010: **Looping picker pilih semua** — modal/panel pilih `tabel mst_*` → checklist kolom + header `pilih semua` → repeater node; auto-form ter-generate dari semua requirement (source ikut) — Step 10-11.
- FR-011: **Preview & Publish** — Preview HTML drawer 600px + Preview PDF (`POST /api/doc-templates/:id/preview-pdf` reuse engine05) + validasi publish BR-002 — Step 11-12.
- FR-012: **Administrasi** — `N Dynamic` field `step.field` (tambah terus) + steps `template_id+order+mapping_json` (N dynamic steps + NSelect template + mapping per requirement) — Step 13.
- FR-013: **Wizard hasil** — `NSteps` vertical guided (`Data → SK → Tanda Tangan → Review`), per-step NForm + validation, tambah-step N append, render gabungan concatenation + `pagebreak` + PDF gabungan (page_size A4/F4/Letter × portrait/landscape) → `POST /api/administrations/:id/runs` → snapshot `template_version` + `rendered_html` — Step 14-15.
- FR-014: **Proteksi & audit** — 409 reference list, 403 single alert, 401 redirect, 404 slug, 400 Zod, 500 PDF retry, ActivityLog per aksi — Step 16.

### Business Rules

- BR-001 (sinkron FR-002/005): `slug` `[a-z][a-z0-9_]{1,60}`, unik, blacklist (`users, roles, permissions, guards, mst_, sqlite_, master_, documents, doc_`), tolak via 400 inline.
- BR-002 (FR-011): Publish Template wajib semua requirement terpetakan + minimal 1 blok konten + component `is_looping` valid (≥1 `item.*`) — else 400 sorot field.
- BR-003 (FR-005/007): `relation_*` target harus tabel aktif; hapus tabel/kolom dipakai → 409 + daftar (modal ReferenceList), tidak CASCADE diam-diam.
- BR-004 (FR-013): `step_order` unik per administration; mapping step wajib lengkap (validasi server DR-002); `document_number` unik bila diisi.
- BR-005 (FR-013): Versioning snapshot — setiap publish naikkan `version`; run mengunci `template_version` + `rendered_html`; run lama tak berubah (INV-001 Task07).
- BR-006 (FR-003): Hanya `is_searchable` → search, `is_orderable` → sort; drift detection `isMasterPhysicalTable` ignore `mst_*`.
- BR-007 (FR-006): Div-by-zero → `null` + warning, tidak `Infinity`; binding hilang → `''` + warning header (BR-002 Task05).
- BR-008 (FR-014): `m.Upload` 5MB image; `tiptap_json/schema_json` 1MB; `DocNode` depth ≤10, total ≤200, item/level 500 + warning.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Operator batal wizard tengah jalan (close browser) | Autosave draft DRAFT di localStorage + `POST /api/documents` draft; resume saat reopen (banner "Lanjutkan draft?") | Step 14 |
| EC-02 | Nested repeater 2 level × 500 item (50 pegawai × 10 trips) | Cap 500/level + warning header `Dipotong 500` + paginasi preview (beri `NAlert` info) — BR-008 | Step 11,15 |
| EC-03 | Logo image hilang (path broken) | Preview: placeholder bordered + `NAlert` warning "Gambar tidak ditemukan", tidak gagal render; upload retry | ERR-09 |
| EC-04 | Rename kolom relation target (Jabatan.nama → title) | Runtime lookup longgar: binding lama badge `Invalid` + pilih ulang, tidak FK kaku; warning di template editor | ERR-02 |
| EC-05 | Right-click tidak tersedia (mobile/tablet) | Fallback: toolbar `+ Binding` button + long-press → same `BindingPalette`; pastikan min touch 44px | Step 8 |
| EC-06 | `mst_*` 100 kolom / 50k baris | Cap form 100 kolom + virtual scroll di definisi builder; browse server pagination + index (LIKE) — EC-01 Task06 | Step 4 |
| EC-07 | `select_multiple` JSON invalid | Zod discriminated → inline error + reset via `NSelect` multiple; unit disc. union test | ERR-01 |
| EC-08 | PDF timeout 30s (server) | 500 + `Coba lagi` tanpa hapus draft; client timeout NSpin + cancel token | ERR-09 |
