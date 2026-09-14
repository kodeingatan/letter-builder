## User Flow

> MANDATORY — Flow interaksi di prototype. Menjadi ACUAN untuk FASE 2 `tasks/11-letter-builder-polish/` (Implementation). Harus konsisten FASE 1 ↔ FASE 2. Merevisi alur 08 Step 1–16 dengan dedicated pages + Tiptap hardened + mapping eksplisit.

### Diagram

```text
[Super Admin] → /dashboard/master-data (PageShell + DataTable kanonis) → CTA "+ Buat Tabel" pill → /dashboard/master-data/create (PageShell dedicated, layout sama) → NDynamicInput 13 tipe + IDRInput + ColumnConfig → Submit POST /api/master-data → 201 toast Berhasil → redirect /dashboard/master-data → menu Master Data → Pegawai muncul
    → /dashboard/master-data/pegawai (Browse) → DataTable 320/160 + Restart + Settings visibility per slug → Create "/dashboard/master-data/pegawai/create"? atau modal row? → Form 13 tipe + RelationPickerModal + operasi preview live → POST /api/master-data/pegawai/rows → list refresh
    → /dashboard/components (List) → CTA "+ Buat Component" → /dashboard/components/create (PageShell dedicated, layout sama, Tiptap office-min toolbar) → isi name + tiptap_json (StarterKit + extensions guard) → Save POST /api/doc-components → redirect /dashboard/components → Edit via /dashboard/components/:id/edit (layout sama)
    → /dashboard/components/:id/edit → Tiptap hardened (ClientOnly fallback + configure guard) → update PUT /api/doc-components/:id → version bump → Delete → DELETE 409 → NAlert warning + ReferenceList modal bukan 500 (reuse 09)
    → /dashboard/templates (List) → CTA "+ Buat Template" → /dashboard/templates/create (form name/code/description) → POST /api/doc-templates → redirect /dashboard/templates/:id (Builder) [polish: Library NTree 260 | Canvas warm #f6f5f4 | Properties 320 live]
    → /dashboard/templates/:id (Builder) — is_create false — drag Component Kop/Daftar → Requirement via schema API → LoopingPicker pilih semua → Auto-form → Preview HTML/PDF drawer 600px (NCode + NScrollbar + NAlert warning) → Publish PUT status PUBLISHED → version bump
    → /dashboard/templates/:id/edit (bila edit meta) → same layout as create (PageShell)
    → /dashboard/administrations (List) → CTA "+ Buat Administrasi" → /dashboard/administrations/create (PageShell dedicated) → NDynamic step.field + Steps mapping editor baru (per-template requirement rows, bukan textarea JSON) → isi template_id + mapping per requirement field → Submit POST /api/administrations → validate DR-002 missing: field → inline error per-field + NAlert summary + scroll first error
    → /dashboard/administrations/:id/edit (layout sama) → same mapping editor → PUT
    → Menu Persuratan → /dashboard/documents/:slug → Wizard NSteps vertical guided (Data → Step1 → Step2 → +Tambah Step N → Review gabungan pagebreak) → render gabungan → PDF gabungan POST /api/administrations/:id/runs → snapshot template_version → Dokumen FINAL → video recorded via Playwright
    → Global: Empty NEmpty+CTA pill no dead-end | Validation NFormItem inline | 409 ReferenceList | 404 NEmpty+Kembali | 401→/login | 403 AccessDeniedAlert single | 500 PDF NAlert+Coba lagi tanpa reset | Tiptap configure guard → NAlert error + Retry

Alternate/Error: modal lama → dihapus (route baru); Tiptap configure undefined → guard + fallback; Builder canvas empty → EmptyStateCard + illustration; Mapping missing field → field merah + tooltip + NAlert DR-002
```

### Steps

| Step | Actor | Aksi | Halaman / Component (dari polish design) | Hasil |
|------|-------|------|------------------------------------------|-------|
| 1 | Super Admin | Buka `/dashboard/master-data` (list definisi) | `PageShell` + `MasterTableDataTable.vue` + `DataTable` kanonis (search 320px `Cari...` + field 160px `Semua Kolom` + Restart `Segarkan data` + Settings) | List definisi tampil, pagination `Menampilkan {from}-{to} dari {total}` |
| 2 | Super Admin | Klik `+ Buat Tabel` pill primary `#0075de` | `→ /dashboard/master-data/create` (DEDICATED PAGE baru, layout sama via `PageShell`) | Form definisi kosong `MasterDataDefinitionForm.vue` (reuse `NDynamicInput` kolom) dengan breadcrumb `Dashboard / Master Data / Buat` |
| 3 | Super Admin | Isi `name=pegawai, display_name=Pegawai`, tambah kolom `nama (text searchable)`, `jabatan (relation_single → Jabatan)`, `gaji (number IDR realtime IDRInput.vue)`, `total = gaji*2 (hidden_operation_text)` | `ColumnConfigPanel.vue` + `IDRInput.vue` + slug live sanitize ` pegawai ` → `pegawai` + operasi preview `evalTextOperation` | Validasi live; blacklist `users`/`mst_*` → 400 inline `NFormItem` + `NAlert` summary |
| 4 | Super Admin | Submit valid → `POST /api/master-data` | Form `handleCreate` → `$fetch` Bearer → toast `Berhasil` (ID) via `useMessage` | `mst_pegawai` tercipta (DDL), redirect `/dashboard/master-data`, menu `Master Data → Pegawai` muncul |
| 5 | Admin | Buka Browse `/dashboard/master-data/pegawai` | `PageShell` + `MasterRowTable.vue` (DataTable kanonis header eyebrow, search 320 + field 160) | Browse tampil, `GET /api/master-data/pegawai/rows?page&limit&search&sortBy&sortOrder` |
| 6 | Admin | Search "afd" (hanya `is_searchable`) + sort `gaji` (hanya `is_orderable`) + hide kolom via Settings persist `localStorage:master-data:pegawai:visibility` | DataTable toolbar + `useMasterDataStore` | Hasil tersaring/terurut tanpa reload; header non-orderable tidak sortable |
| 7 | Admin | Klik `+ Tambah Data` (bisa tetap modal row atau dedicated `/dashboard/master-data/pegawai/create` — design polish: modal row tetap minimal) → isi 13 tipe + relation picker | `MasterRowForm.vue` + `RelationPickerModal.vue` (NDataTable + search + sort + checkbox radio/multiple) | Modal terbuka: search debounce 300ms, sortable semua kolom |
| 8 | Super Admin | Buka `/dashboard/components` → klik `+ Buat Component` | `→ /dashboard/components/create` (DEDICATED PAGE baru, layout sama) — `PageShell` + `ComponentEditor.vue` (Tiptap office-min) | Form kosong: `name`, `is_looping`, Tiptap host `min-h-[300px]` border `rounded 4px` hairline, toolbar 1 baris grouped |
| 9 | Super Admin | Di `create` page, ketik "Kepala Dinas" → Toolbar: Bold → Heading 2 → Align center → Insert Image (URL `https://`) → right-click → `BindingPalette` (`name=kop.nama`, `view=text`, `target=pegawai.nama`) → fallback `+ Binding` button 44px hit | `ComponentEditor.vue` hardened: `initEditor` guard `configure` + `DocBinding` nodes + `BubbleMenu` contextual + `FloatingMenu` placeholder | Inline pill `{{kop.nama}}` `bg-[#e8f2fd] text-[#0075de] rounded-full` muncul; toolbar tidak hilang; `ClientOnly` SSR safe |
| 10 | Super Admin | Toggle `is_looping=true` → masukkan `item.nama` → Save → `POST /api/doc-components` → validasi `BR-003` `item.*` | `NForm` + `NCheckbox` is_looping + validation inline badge `Invalid binding` merah `#EF4444` bila tanpa `item.*` → 400 | Component tersimpan `v1`, redirect list, toast `Berhasil` |
| 11 | Admin | Buka `/dashboard/components/:id/edit` (DEDICATED PAGE update, layout sama dengan create) | `PageShell` title `Edit: Kop Surat v1` + breadcrumb `Dashboard / Component / Edit` + same `ComponentEditor` | Form pre-filled, Tiptap content `setContent` via `watch` guard `JSON.stringify` diff, `onBeforeUnmount destroy` guard |
| 12 | Admin | Delete Component dari list → `NPopconfirm` → `DELETE /api/doc-components/:id` bila dipakai → **409** | `ReferenceList.vue` modal `data-testid=conflict-references` + `NTag 409` + `Lihat` link (reuse 09 wiring) | Modal warning `Tidak dapat menghapus — masih dipakai` — bukan `Server Error` generik; delete sukses bila tidak dipakai → toast |
| 13 | Admin | Buka `/dashboard/templates` → klik `+ Buat Template` | `→ /dashboard/templates/create` (DEDICATED PAGE) — `PageShell` form `name/code/description` + validation `code [a-z0-9-_]{2,60}` blacklist | Form kosong, `NInput` 4px, focus first error pattern |
| 14 | Admin | Submit `name=SK Pengangkatan, code=sk-pengangkatan` → `POST /api/doc-templates` → redirect | `usePersuratanStore.createTemplate` → `navigateTo(/dashboard/templates/:id)` (Builder) | Template DRAFT `v1` tercipta |
| 15 | Admin | **Builder polish** di `/dashboard/templates/:id` (route existing tetapi UI baru): Library `NTree` searchable 260px kiri (warm `#f6f5f4` bg + `NInput` filter) \| Canvas flex-1 warm `#f6f5f4` tengah dengan `EmptyStateCard` illustration + CTA `+ Tambah Blok` \| Properties 320px kanan `NForm` live | `TemplateBuilder.vue` + `ComponentLibrary.vue` + `DocumentCanvas.vue` + `PropertyPanel.vue` + `RepeaterEditor`+`ConditionEditor`+`DataBindingEditor` | Canvas menampilkan blok drag-drop HTML5 + keyboard `ArrowUp/Down` reorder + selection ring `#0075de` + pagebreak visual |
| 16 | Admin | Drag `Kop` + `Daftar` dari Library → Canvas ghost `opacity 0.5` + ring primary → Properties live update (`useBuilderStore` blocks/selectedId) → LoopingPicker `pilih semua` indeterminate | `LoopingPicker.vue` reused + `RepeaterEditor` checklist kolom + header `Pilih semua` | Repeater node `source=pegawai, item=item` terbentuk; auto-form ter-generate dari semua requirement (`master_data:pegawai` via `GET /api/master-data/pegawai/schema` + `manual` + `system`) |
| 17 | Admin | Klik `Preview HTML` drawer 600px `NTabs HTML/PDF` + `NCode` preview + `NAlert warning` header (empty repeater/div-by-zero) + `Unduh PDF` pill CTA → `POST /api/doc-templates/:id/preview-pdf` (engine 05 reuse) | `DocumentPreviewDrawer.vue` | Preview HTML escaped + `sanitize-html`; PDF A4 portrait; error 500 → `NAlert error + Coba lagi` tanpa reset |
| 18 | Admin | Publish → `PUT /api/doc-templates/:id status PUBLISHED` validasi `BR-002` (semua requirement terpetakan + ≥1 blok + `is_looping` valid) → version 1→2 | `handleSave(true)` → `message.success Template published (versi naik)` | Badge `PUBLISHED` `NTag success`; run lama snapshot `v1` |
| 19 | Admin | **Administrasi mapping redesign**: Buka `/dashboard/administrations/create` (DEDICATED PAGE baru, layout sama) → isi `name=SK Pengangkatan, slug=sk-pengangkatan` → Steps editor baru: per-step `NSelect` template + **per-requirement mapping rows** (bukan textarea JSON) | `AdministrationFormNew.vue` + `StepMappingEditorNew.vue` (auto-fetch `template.requirements` → render rows `field | kind NSelect (value/master_data/system) | ref NInput/NSelect`) | Setiap field `letter.number` terlihat; missing field belum diisi → inline `NFormItem` merah + `feedback "Wajib diisi"` |
| 20 | Admin | Klik `Simpan` → `POST /api/administrations` dengan `steps: [{template_id, step_order, mapping: {letter.number:{kind:"value",ref:"800/1"}}}]` → bila `DR-002` missing field → server 400 `missing: letter.tanggal` | Client tampil `NAlert type="warning" Mapping incomplete — missing: letter.tanggal` + field `letter.tanggal` highlight merah + auto-scroll + focus + tooltip "Isi mapping untuk field ini" | Sebelumnya textarea JSON membingungkan → sekarang jelas per-field |
| 21 | Admin | Buka `/dashboard/administrations/:id/edit` (layout sama) → update mapping lengkap → `PUT /api/administrations/:id` `replaceSteps` DR-002 pass → success | PageShell breadcrumb `Dashboard / Administrasi / Edit` | Administrasi tersimpan, ActivityLog, menu Persuratan → `[SK Pengangkatan]` muncul |
| 22 | Operator | Buka `→ /dashboard/documents/sk-pengangkatan` Wizard `NSteps` vertical guided (`Data → SK → Tanda Tangan → Review`) → isi `nomor`, pilih pegawai via `RelationPickerModal` multiple → `+ Tambah Step` → mapping step2 → Review gabungan pagebreak → PDF gabungan | `AdminWizard.vue` (`NSteps` + per-step `NForm` + validation + draft autosave `localStorage:letter-builder:draft:<slug>`) | Render gabungan concatenation + `pagebreak` divider → `POST /api/administrations/:id/runs` → snapshot `template_version` + `rendered_html` → `FINAL` → `GET /api/documents/:id/pdf` download |
| 23 | All | Global polish: cek semua halaman surat di Desktop 1280 / Tablet 768 / Mobile 375 → toolbar wrap, modal 600 centered, Tiptap toolbar scroll-x + `+ Binding` bottom fixed 44px, wizard steps vertical→horizontal, DataTable pagination ID | Responsive verify via Storybook viewport addon | No overflow, hit 44px, `prefers-reduced-motion` reduce 0.01ms |
| 24 | QA | Playwright merekam video setiap pengujian (`video: 'on'` dengan `retain-on-failure` + `trace` ) → `npx playwright test --project chromium` → artifact `test-results/*/video.webm` | `playwright.config.ts` hardened + E2E `letter-builder-*.spec.ts` 6 files + `*.spec.ts` untuk dedicated pages + Tiptap + mapping | Video tersedia `playwright-report/data` + `video.webm` per-test, dapat di-attach di CI |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI (polish) |
|----|----------|-------|------------------------|
| ALT-01 | Master Data kosong (0 definisi) | `/dashboard/master-data` → Empty | `NEmpty` + illust `Belum ada definisi` + CTA pill `+ Buat Tabel Pertama` (`#0075de` full) — no dead-end |
| ALT-02 | Browse `mst_pegawai` kosong (0 rows) | Browse → Empty | `NEmpty` + `Belum ada data Pegawai` + CTA `+ Tambah Data Pertama` (card `#f6f5f4` xl16) |
| ALT-03 | Visibility hide all column | Toolbar Settings → hide all | Guard minimal 1 kolom visible (disable last hide + tooltip "Minimal satu kolom") + persist per slug localStorage |
| ALT-04 | Relation picker empty | Modal → Empty | `NEmpty` di modal + search reset `Atur ulang` tanpa tutup modal |
| ALT-05 | Component dibatalkan belum save | `/dashboard/components/create` → Back/Cancel | `NDialog` "Batalkan perubahan?" (`onBeforeRouteLeave` unsaved guard) + breadcrumb back |
| ALT-06 | Template DRAFT belum publish | List → badge | `NTag DRAFT` (`#a39e98`); Preview aktif, Publish disabled tooltip "Lengkapi mapping" |
| ALT-07 | User akses create page tanpa permission | `GET /dashboard/components/create` → 403 | `AccessDeniedAlert` single floating `data-testid=access-denied` top16 right16 max448 slideIn 300ms auto 4s via `rbac-denied` single listener |
| ERR-01 | Validasi Master Data (slug duplikat/blacklist, kolom dupe, minimal 1 kolom) | Submit `create` dedicated page → 400/409 | Inline `NFormItem validationStatus="error"` + `NAlert` summary di atas form + focus first error `ref.focus()` + scroll |
| ERR-02 | **Tiptap `configure` crash** (`Cannot read properties of undefined (reading 'configure')`) | Buka `/dashboard/components/create` atau delete → initEditor → `StarterKit`/`TiptapLink` undefined | **Design fix**: guard `if (!Mod || !Mod.configure)` fallback `StarterKit` minimal, `try/catch initEditor` → `NAlert type="error" Gagal memuat editor — Coba lagi` + `NButton Retry` → re-`initEditor`; delete path guard `onBeforeUnmount` → `editor?.destroy()` tanpa `configure` call; story `tiptapConfigureError` |
| ERR-03 | Validasi Tiptap binding (`is_looping` tanpa `item.*`) | Save → 400 | Badge `Invalid binding` merah `#EF4444` + tooltip + `NAlert` list + Publish blocked |
| ERR-04 | Operasi-teks div-by-zero / hilang | Form row → `null`+warning | `readonly_operation_text` `—` + `NAlert warning "Pembagian nol"` + server 400 sinkro Zod bila required |
| ERR-05 | DDL alter destruktif | `PUT /api/master-data/:slug` → confirm | `NDialog` dua langkah ringkasan + warning backup `storage/backups/*.sqlite` + checkbox "Saya mengerti" required |
| ERR-06 | **Administrasi Mapping `DR-002` incomplete — `missing: field`** | `POST /api/administrations` → 400 `Missing field: letter.tanggal` (textarea lama membingungkan) | **Polish fix**: per-field editor → field `letter.tanggal` border merah, `feedback` `Missing: letter.tanggal (DR-002) — pilih target`, `NAlert type="warning"` summary list missing fields, auto-scroll to first missing, tooltip "Pilih data master/manual/system", tidak lagi textarea JSON mentah |
| ERR-07 | Hapus terproteksi (Component/Template dipakai, Master Table column relation) | Delete → 409 | `NAlert warning` + modal `ReferenceList` list `template:SK` + `NTag 409` + `Lihat` link — bukan 500 |
| ERR-08 | 401 tanpa token | Any → 401 | Interceptor `useApi` clear + `navigateTo('/login')` + toast `Sesi berakhir` |
| ERR-09 | 403 tanpa permission | Any → 403 | Floating global `AccessDeniedAlert` single `data-testid=access-denied` 1 event→1 feedback (hapus duplikat per-page) |
| ERR-10 | 404 slug tidak ada | Browse `GET /api/master-data/:slug` → 404 | `NAlert` + `NEmpty` + `Kembali ke Master Data` button |
| ERR-11 | Puppeteer PDF gagal | Preview PDF → 500 | `NAlert error Gagal generate PDF + Coba lagi` tanpa reset `data/search/sort/page` + draft `DRAFT` |
| ERR-12 | Upload image >5MB / tipe salah | `NUpload` → 400 | `NAlert` + inline `Upload gagal: maksimal 5MB` + retry; client size preflight |

## Requirements

### Tujuan Fitur

- REQ-G01: **Dedicate pages create/update** — semua pembuatan & pengubahan dialihkan ke halaman baru ber-layout sama (PageShell + breadcrumb + description + toolbar) sehingga user tidak bingung modal vs halaman, konsisten navigasi browser (back/forward, `href` preserve right-click), dan mudah di-deep-link/test (Playwright `page.goto`).
- REQ-G02: **Hardening Tiptap** — hilangkan crash `configure` (extension init guard + `ClientOnly` + `onBeforeUnmount` safe) sehingga create & delete Component tidak lagi `Server Error`/`undefined`, dan toolbar office-minimum tetap stabil di Chrome/SSR/no-JS.
- REQ-G03: **Builder polish** — `/dashboard/templates/:id` menjadi lebih cantik (token Notion + hairline + shadow + pill + illustration + spacing) dan lebih mudah dipakai (drag ghost + keyboard reorder + EmptyStateCard + searchable Library + Properties live + preview tabs).
- REQ-G04: **Fix DR-002 mapping UX** — `missing: field` tidak lagi membingungkan karena form mapping menampilkan per-field requirement dengan inline error + summary `NAlert`, sehingga user tahu persis field mana yang incomplete.
- REQ-G05: **Global UI/UX polish** — semua halaman surat konsisten Notion-calm, typography Inter tracking, spacing, radius, elevation, empty/loading/error/success/validation/permission states seragam, `prefers-reduced-motion` dihormati, hit 44px mobile.
- REQ-G06: **Tiptap office-minimum** — toolbar memakai contoh `https://tiptap.dev/docs/examples` (StarterKit + Placeholder + Highlight + Color + Link + Table + Image + TextAlign + Underline + BubbleMenu + FloatingMenu) tetapi very minimum (1 baris grouped, tidak overload), sehingga editing seperti office doc tetapi tetap ringan.
- REQ-G07: **Playwright video** — setiap pengujian merekam video (`https://playwright.dev/docs/videos#record-video` → `video: 'on'` / `retain-on-failure` / `size` / `trace`) sehingga QA dapat melihat replay tanpa repro manual.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Super Admin | Definisi Master Data DDL + Component/Template publish + Administrasi create/edit + hapus terproteksi | `Master Data Write` + `Component Write` + `Template Write` + `Administration Write` + `Document Write` + `Full Access` |
| Admin | CRUD baris Master Data + buat Component/Template draft + Preview PDF + Wizard | `Master Data Read/Write` + `Component Read/Write` + `Template Read/Write` |
| Operator | Jalankan Wizard hasil surat (isi data + tambah step N + PDF gabungan) | `Document Write` + `Administration Read` + `Template Read` |
| Viewer | Lihat Browse + Template + dokumen (read-only) | `Master Data Read` + `Document Read` |
| Guest (unauth) | Redirect login | — (401) |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Super Admin | Buat tabel Pegawai 5 kolom via dedicated create page | `mst_pegawai` + menu | Step 2-4 |
| UC-02 | Admin | Browse Pegawai search/sort/visibility/pagination | Hasil tersaring | Step 5-6 |
| UC-03 | Super Admin | Buat Component Kop di dedicated create page dengan Tiptap office-min + binding | Inline pill + redirect list | Step 8-10 |
| UC-04 | Super Admin | Edit Component di dedicated edit page (layout sama) | Pre-filled + version bump | Step 11 |
| UC-05 | Admin | Delete Component terproteksi → 409 ReferenceList | Modal warning | Step 12 |
| UC-06 | Admin | Buat Template SK via dedicated create → Builder polish | Template DRAFT v1 | Step 13-14 |
| UC-07 | Admin | Builder drag Kop/Daftar + looping pilih semua + requirement + preview + publish | PUBLISHED v2 | Step 15-18 |
| UC-08 | Admin | Buat Administrasi via dedicated create page dengan mapping per-field (bukan textarea JSON) | Administrasi + slug | Step 19 |
| UC-09 | Admin | Submit mapping incomplete → DR-002 per-field error `missing: letter.tanggal` yang jelas | Inline highlight + summary | Step 20 / ERR-06 |
| UC-10 | Admin | Edit Administrasi di dedicated edit page (layout sama) | Updated | Step 21 |
| UC-11 | Operator | Wizard tambah-step N → PDF → save run (video recorded) | Dokumen FINAL | Step 22 |
| UC-12 | QA | Playwright merekam video setiap test (happy + error + 409 + mapping) | `video.webm` per-test | Step 24 |

### Functional Requirements

- FR-001: **Master Data dedicated pages** — `GET /dashboard/master-data/create` + `GET /dashboard/master-data/:slug/edit` (bila ada) dengan `PageShell` breadcrumb `Dashboard / Master Data / Buat|Edit` + title `Buat Tabel`/`Edit: Pegawai` + description `Isi definisi 13 tipe` + footer `Batal | Simpan` pill; route list tetap `GET /dashboard/master-data` DataTable. Navigasi click → `router.push` preserve `href`; back → `router.back()`. — Step 1-4.
- FR-002: **Component dedicated pages** — `GET /dashboard/components/create` + `GET /dashboard/components/:id/edit` (pecah dari modal `components.vue:159`). Form `name + is_looping + tiptap_json` sama layout dengan `PageShell` + `NForm` + `NAlert` summary + `ComponentEditor.vue` office-min. Submit `POST /api/doc-components` / `PUT /api/doc-components/:id` + toast + redirect. Delete tetap di list via `NPopconfirm` → 409 `ReferenceList`. — Step 8-12.
- FR-003: **Template dedicated pages** — `GET /dashboard/templates/create` form meta (`name/code/description`) → redirect builder; `GET /dashboard/templates/:id/edit` meta edit; builder tetap `GET /dashboard/templates/:id` polish. Semua `PageShell` same layout (title `20px Semibold tracking -0.125px`, description `12px #615d59`, padding `head 16×20 body 24`). — Step 13-14.
- FR-004: **Administrasi dedicated pages** — `GET /dashboard/administrations/create` + `GET /dashboard/administrations/:id/edit` dengan `PageShell` dedicated + `NDynamicInput` steps + **new** `StepMappingEditor` per-requirement (FR-010). Redirect setelah save. List tetap `DataTable`. — Step 19-21.
- FR-005: **Tiptap `configure` guard** — `ComponentEditor.vue` lazy imports guarded: `const mod = await import('@tiptap/starter-kit'); const StarterKit = mod.default ?? mod` + check `if (!StarterKit || typeof StarterKit.configure !== 'function')` fallback minimal; same untuk `Link`, `TextAlign`, `Table`, `Highlight`, `Color`. `initEditor` wrapped `try/catch` → `editorError` + `NAlert` retry. `onBeforeUnmount` guard `if (editor && editor.destroy) editor.destroy()`. `ClientOnly` + `#fallback`. — ERR-02.
- FR-006: **Builder polish** — 3-pane grid `260 | 1fr | 320` (desktop), tablet `NDrawer` 260/320, mobile `NTabs Library/Canvas/Properties`. Library `NTree` searchable + filter `NInput` + drag handle `h(NIcon Add)`; Canvas `bg-[#f6f5f4]` warm + border hairline `border-[#e6e6e6]` + radius `lg12` + padding `24` + `EmptyStateCard` (`NEmpty Belum ada blok + CTA + illustration warm`); Properties `NForm` live + section header `eyebrow 11px uppercase #94a3b8`. — Step 15-16.
- FR-007: **Mapping `DR-002` explicit** — `StepMappingEditorNew.vue` per-step: fetch `template.requirements` (via `GET /api/doc-templates/:id` atau `GET /api/doc-templates/:id/schema` atau `scanRequirements(schemaJson)`) → render rows: `field` label badge `NTag` + `kind NSelect (value/master_data/system)` + `ref NInput/NSelect` + inline error `validationStatus="error"` bila missing. Submit → server `replaceSteps` `DR-002` `missing: field` → map ke `NAlert warning` summary + per-field highlight + `ref.focus()` first + scroll. — ERR-06.
- FR-008: **Tiptap office-minimum toolbar** — referensi `https://tiptap.dev/docs/examples` (examples: `Bold`, `Italic`, `Underline`, `Strike`, `Heading`, `BulletList`, `OrderedList`, `Blockquote`, `CodeBlock`, `Table`, `Image`, `Link`, `TextAlign`, `Color`, `Highlight`, `Placeholder`, `CharacterCount`, `BubbleMenu`, `FloatingMenu`). Design polish: grouped `NSpace` rows: Group Text `B/I/U/S` + Heading `H1/H2/H3` `NSelect` + Align `Left/Center/Right` + List `• / 1.` + Insert `Table/Image/Link` + History `↶/↷` + `+ Binding` fallback. `BubbleMenu` untuk selection (Bold/Italic/Link), `FloatingMenu` untuk empty paragraph (+ `Type /`). Very minimum: tidak ada font-family/size custom berat. — Step 9.
- FR-009: **Playwright video** — `playwright.config.ts` `use: { video: { mode: 'on' | 'retain-on-failure', size: { width: 1280, height: 720 } }, trace: 'on-first-retry' }` + per-project `chromium` + `webServer reuseExistingServer:true` + headed `slowMo 100`. Artifact `test-results/**/video.webm` + `playwright-report/data`. Doc ref `https://playwright.dev/docs/videos#record-video` di verification. — Step 24.
- FR-010: **Global UI polish** — semua halaman surat memakai token `app/utils/naiveui-theme.ts` (`primary #0075de`/`#0069c4`/`#005bab`, canvas `#f6f5f4/#ffffff`, hairline `#e6e6e6`, Inter tracking, radius xs4 sm5 md8 lg12 xl16 full, elevation Level1 0 4px 18px rgba(0,0,0,0.04) + hairline, Level2 0 23px 52px), Tailwind utilities inline `flex gap-3 p-4 bg-[#f6f5f4] border border-[#e6e6e6] rounded-[12px]`, icon `h(NIcon)` Carbon, `NEmpty` CTA pill, `NAlert` warning vs error konsisten, `prefers-reduced-motion` reduce 0.01ms. — ALT/ERR semua.

### Business Rules

- BR-001: `slug`/`code` `[a-z][a-z0-9_]{1,60}` & `[a-z][a-z0-9-]{2,60}`, unik, blacklist (`users, roles, mst_, sqlite_, master_`) → 400/409 — Step 3.
- BR-002: Publish guard `BR-002` (semua requirement terpetakan + ≥1 blok + `is_looping` valid `item.*`) → 400 sorot field + tooltip — Step 18.
- BR-003: `is_looping` `BR-003` → 400 bila tanpa `item.*`; `relation_*` target harus tabel aktif → 409 bila dipakai — Step 10,12.
- BR-004: `step_order` unik per administration `INV-002`; mapping lengkap `DR-002` → 400 `missing: field` per-field — ERR-06.
- BR-005: Version `BR-005` bump saat publish; run snapshot `template_version` — Step 18,22.
- BR-006: `is_searchable`→search, `is_orderable`→sort (whitelist 400) — Step 6.
- BR-007: Div-by-zero → `null`+warning `NAlert` — Step 7.
- BR-008: `MAX_JSON_BYTES` 1MB `tiptap_json`/`schema_json`, `DocNode` depth≤10 total≤200 item/level 500 — Step 10.
- BR-009: **Dedicated page layout same** — semua create/update memakai `PageShell` props `title, breadcrumbs, description` identik struktur (head 16×20 body 24 radius 12 hairline) — FR-001..004.
- BR-010: **Tiptap guard** — `StarterKit` dkk harus import `default` guard, `editor` hanya dibuat bila `editorHost.value` ada (mounted), `editor.destroy()` hanya bila `editor && !editor.isDestroyed`. — FR-005.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | User refresh di dedicated create page sebelum save | Unsaved guard `onBeforeRouteLeave` → `NDialog` "Batalkan perubahan?" + draft `localStorage:letter-builder:draft:<slug>` banner resume | Step 8-11 |
| EC-02 | `ComponentEditor` extension import gagal (network) | Guard → fallback minimal `StarterKit` + `NAlert warning` + retry button; unit mock extension undefined | ERR-02 |
| EC-03 | Builder drag di tablet tanpa mouse | Fallback keyboard `ArrowUp/Down` + `Enter` edit; HTML5 `draggable` ghost fallback `opacity 0.5` | Step 16 |
| EC-04 | Mapping field 50 requirement per template | Scrollable `NScrollbar` max-height 400 + `NTag` counter + search filter per-step | ERR-06 |
| EC-05 | User paste XSS `javascript:` via Tiptap image/link | `sanitize-html` allowlist `https://`/`/api/storage/`/`data:image/` + `renderer` escape | Step 9 |
| EC-06 | Video disk penuh di CI (trace+video on) | Config `video: 'retain-on-failure'` default + `trace: 'on-first-retry'` untuk hemat; `expect` screenshot vs video tradeoff documented | FR-009 |
| EC-07 | Mobile viewport 375 toolbar 1 baris overflow | Toolbar scroll-x `overflow-auto` + `+ Binding` fixed bottom 44px hit | Step 9 |
| EC-08 | Browser `prefers-reduced-motion` | Anime `usePageTransition` 250ms → 0.01ms via CSS `app/assets/css/main.css` | Global |
| EC-09 | 409 race delete after dedup | Second delete → 404 not 500; modal `ReferenceList` idempoten | Step 12 |
| EC-10 | `findReferences` substring false-positive | Exact `"componentId":"<name>"` guard — dedicated page tidak ubah logic | Step 12 |

