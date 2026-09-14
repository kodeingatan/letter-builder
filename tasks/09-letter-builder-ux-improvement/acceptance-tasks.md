## Acceptance Criteria

> MANDATORY — Given/When/Then. Setiap AC mapping ke `User Flow` Step + `Requirements` (BR/EC). Kriteria bug pemicu 409 → `ReferenceList` modal menjadi gating `DONE`.

### AC-001 — Definisi Master Data + DDL + duplicate 409 (FR-001/002, BR-001, ERR-01)

Given Super Admin di `/dashboard/master-data` dengan form definisi kosong (`NDynamicInput` 5 kolom)

When isi `name=pegawai, display_name=Pegawai`, tambah 5 kolom (incl. `number` + `IDRInput.vue` + `hidden_operation_text` `gaji*2`), submit `POST /api/master-data`

Then `201`, `mst_pegawai` tercipta, toast `Berhasil`, redirect list, menu `Master Data → Pegawai` muncul; **403 Viewer → `AccessDeniedAlert` single**, **409 duplicate slug `users`/`pegawai` → `NAlert warning` inline + tidak 500**, **400 blacklist/minimal kolom → `NFormItem` error**

### AC-002 — Fix DELETE 409 doc-components: tampil ReferenceList bukan Server Error (BUG PEMICU — FR-014, ERR-05, BR-003)

Given Admin membuat Component `Kop Surat` (Tiptap, `is_looping=false`) dan Template `SK Pengangkatan` yang embed `Kop` (`schema_json` berisi `"componentId":"Kop Surat"`), sehingga `GET /api/doc-components` dan `findReferences("Kop Surat")` mengembalikan `["template:SK Pengangkatan"]` (verified `server/services/doc-components.service.ts:109-125`)

When Admin di `/dashboard/components` klik `TrashCan` `Kop Surat` → `NPopconfirm "Hapus component \"Kop Surat\"?"` → confirm → `$fetch DELETE /api/doc-components/:id`

Then **server mengembalikan `409` JSON** `{ statusCode:409, message:"Component \"Kop Surat\" is still used by: template:SK Pengangkatan", data:{ references:["template:SK Pengangkatan"] } }` dengan header JSON (bukan HTML `Server Error`), dan **client TIDAK menampilkan `NAlert error "Server Error"` atau toast generic** melainkan **`NAlert type="warning" "Tidak dapat menghapus — masih dipakai"` + `NModal` `ReferenceList.vue` menampilkan list `template:SK Pengangkatan` dengan `NTag 409` + link `Lihat` → `/dashboard/templates/...`**, footer `Tutup`; cancel → tutup modal; confirm ulang tetap 409 (tidak 500). **Setelah menghapus Template pemakai, delete lagi → `200` toast success**.

> Trace: `User Flow Step 16 / ERR-05 / BR-003 / BR-004 / EC-10` → `Flow→API #7` → `Flow→UI Step 8-9/16`

### AC-003 — Semua DELETE/POST 409 sejenis konsisten ReferenceList (FR-014, ERR-05, BR-001/BR-004/BR-006)

Given data terproteksi sejenis:
- `master_tables: pegawai` dipakai `Jabatan.relation_single target_slug=pegawai`
- `doc_templates: SK` dipakai `administrations: sk-pengangkatan steps template_id=SK`
- `administrations runs document_number="SK/2026/001"` sudah ada

When respective destructive action:
- `DELETE /api/master-data/pegawai` → Master Admin klik hapus tabel di `MasterTableDataTable.vue`
- `PUT /api/master-data/pegawai` remove column `nama` yang dipakai `relation display_column`
- `DELETE /api/doc-templates/:id` → hapus template `SK` di `templates/index.vue`
- `POST /api/administrations/:id/runs` dengan `document_number` dupe

Then semua mengembalikan **`409` dengan `data.references|steps|administrations`** dan **client menampilkan pola sama** `NAlert warning + ReferenceList modal` (atau untuk document_number: `NAlert warning Document number sudah ada` inline + `NFormItem` error), **bukan `500 Server Error`**. `GET /api/master-data/:slug` 404 tetap `NEmpty` + `Kembali`. Hapus non-terproteksi → `200`.

> Cover: `Task06 ERR-02/ BR-004`, `Task07 BR-004/BR-006`, `Task05 duplicate`, `master-data column 409`

### AC-004 — Validasi 400, 404, 401/403, 500 PDF seragam (FR-004/006/007/011/014, ERR-01/02/03/09/10)

Given form terkait

When:
- `is_looping=true` tanpa `item.*` → `POST /api/doc-components` → 400 `Looping component must contain at least one item.* binding (BR-003)` → inline badge merah + `NAlert` list + publish blocked
- Publish Template belum semua requirement terpetakan → `PUT .../doc-templates/:id status PUBLISHED` → 400 `BR-002` → sorot field + tooltip `Lengkapi mapping`
- Browse non-orderable sort header diklik → header tidak sortable (`BR-003`); search non-searchable → 400 `Column "x" is not searchable` → inline jika API call (server guard)
- Operasi-teks `gaji/0` div-by-zero → field `readonly_operation_text` menampilkan `—` + `NAlert warning "Pembagian nol"` + server 400 sinkron Zod `ERR-03` saat save bila required
- Upload image >5MB/tipe salah (`javascript:`) → 400 `Maksimal 5MB / allowlist` → inline + retry
- `GET /api/master-data/unknown_slug` → 404 → `NAlert` + `NEmpty` + `Kembali ke Master Data`
- Tanpa token → any → 401 → redirect `/login` (`useApi` + `$fetch` interceptor)
- Tanpa permission → any → 403 → `AccessDeniedAlert` single (`data-testid=access-denied`, top16 right16 max448 slideIn 300ms auto4s, 1 event→1 feedback)
- `POST .../preview-pdf` tanpa Chrome → `500 Failed to generate PDF` **catch** → `pdfError` + draft `DRAFT` → client `NAlert error Gagal generate PDF + Coba lagi` tanpa reset `data`/`search/sort/page` (story `pdfError`)

Then semua state sesuai `08/domain-api-ui.md States` table + Storybook `States` variants pass a11y, tanpa `Server Error` mentah.

### AC-005 — Browse & Form 13 tipe tetap benar (FR-003/004/005/006, BR-006, EC-06, AC-002–004 Task06)

Given `mst_pegawai` dengan 3 rows

When search "afd" (hanya `is_searchable`) + sort `gaji` (hanya `is_orderable`, Carbon ArrowUp/Down 14px primary) + hide kolom via `Settings` visibility (persist `localStorage:master-data:pegawai:visibility`) + paginasi 20 → `Menampilkan {from}-{to} dari {total}`

Then hasil tersaring/terurut tanpa reload; kolom non-orderable header tidak sortable; visibility persist reload; `RelationPickerModal.vue` full: search debounce 300ms + sort tiap kolom + checkbox radio single vs multiple bulk `Pilih semua` + pagination ID. **Form 13 tipe** (text/richtext+`sanitize-html`/date `m-d-Y`/`NDatePicker`/datetime/time/`image NUpload` path `storage/general`/select/select_multiple JSON/relation_single/multiple/number+`IDRInput.vue` realtime/hidden vs readonly operation) + preview `evalTextOperation` identik server ter-render. **Upload path allowlist** benar.

### AC-006 — Builder 3-pane + Wizard guided tetap wiring benar (FR-007/008/009/010/011/012/013, Step 10-15)

Given Admin di `/dashboard/templates/create` (3-pane `260|1fr|320`) dan `/dashboard/administrations` + `/dashboard/documents/sk-pengangkatan`

When drag `Kop` + `Daftar` dari `ComponentLibrary.vue` `NTree` ke `DocumentCanvas.vue` (HTML5 draggable ghost + keyboard `ArrowUp/Down` reorder + `aria-grabbed` + EmptyStateCard) → Properties `NForm` live (`useBuilderStore` blocks/selectedId/update/move/add) → looping picker `LoopingPicker.vue` `Pilih semua` indeterminate → requirement `master_data:pegawai` via `GET /api/master-data/pegawai/schema` / `manual` / `system` → auto-form → preview HTML drawer 600px `NTabs` + `NCode` → preview PDF → publish → buat Administrasi `SK Pengangkatan` 2 steps + mapping lengkap (`DR-002`) → wizard `NSteps vertical` guided (`Data → SK → Tanda Tangan → Review`) + `+ Tambah Step` N + review pagebreak concatenation + PDF gabungan → save run

Then semua wiring sesuai `08` prototype tanpa dead-end; `Step` validation inline; `version bump` BR-005 (publish 1→2, edit `PUBLISHED` schema naik); mapping incomplete → 400 `DR-002`; empty repeater + div-by-zero warnings header; draft autosave banner `localStorage:letter-builder:draft:<slug>` + resume.

### AC-007 — RBAC + Storybook regression + typecheck/build lolos (FR-014/015, Cross-Cutting)

Given Viewer vs Admin / tanpa token + Storybook `08` + build

When akses `POST/DELETE /api/doc-components*` via Viewer → 403; Admin → 200/409 sesuai proteksi; tanpa token → 401 → `/login`; jalankan `npm run storybook` dan `npm run build-storybook` + `npm run build` + `vue-tsc`

Then `401/403` benar (matrix `08` + 05-07 backfill), `DataTable` kanonis `320/160 + Restart + Settings` tidak rusak, `AccessDeniedAlert` single (`grep addEventListener rbac-denied` 1 hit), **Storybook `LetterBuilder/*` 9 files + `foundation/*` 3 files tetap PASS** (`npm run build-storybook` Vite tanpa error, chunks di `storybook-static`), `vue-tsc` 0, `npm run build` sukses, `PageShell` + `DataTable` + `NModal Card` + sidebar 220/72 token `#0075de` tidak regresi.

### AC-008 — Traceability error taxonomy 05–07 100% ter-cover (REQ-G02, BR-001..008, EC-01..10)

Given tabel `Flow → API Mapping` + `ERR-01..10` + `ALT-01..06` + `EC-01..10` + `BR-001..008` di `flow-requirements.md`

When audit `Tasks > Test Plan` matrix (`UT-01..06, NT-01..05, E2E-01..06`)

Then setiap error Taxonomy memiliki test (`409` semua sumber, `400` validation, `404`, `401/403`, `500 PDF`, `div-by-zero`, `image allowlist`, `version bump`, `whitelist`, `status transition`, `step_order unique`, `document_number unique`) dengan file rencana eksplisit per `Test Plan`, coverage `User Flow Steps 16/16 (100%)`, `AC 8/8 (100%)`, `BR 8/8 (100%)`, `EC 10/10 (100%)`, tidak ada error 05–07 yang tersisa sebagai `Server Error` generik.

## Tasks

> MANDATORY — checklist implementasi. Mengacu design FASE 1 `08`. Tandai `[x]` hanya bila lolos `vue-tsc` + test + storybook + build.

### Backend

- [ ] Audit & uniform `throw createError({ statusCode: 409, message, data })` — `server/api/doc-components/[id].delete.ts:6-24`, `doc-templates/[id].delete.ts`, `master-data/[slug].delete.ts:6-25` + `master-data/[slug].put.ts` (via `syncColumns` 409), `administrations/[id].delete.ts`, `administrations/[id]/runs.post.ts` (document_number 409), `master-data/index.post.ts` (duplicate slug 409) — verifikasi `data.references|steps|administrations` JSON, `grep -rn "statusCode = 409" server/services` 7 hits tetap; `grep -rn "createError" server/api` 5+ files seragam `statusCode ?? 500`.
- [ ] Hardening `findReferences` exact-match (bukan substring): `DocComponentsService.findReferences(name)` (`"componentId":"${name}"` / `"component":"${name}"` exact, test `EC-10`), `DocTemplatesService.remove` (`AdminStepSchema` count), `MasterDataService.findReferences/findColumnReferences` (relation `target_slug/display_column` + deduplicate `Set`)
- [ ] Uniform 400/404 → Zod discriminated 13 tipe (`server/dto/master-data.dto.ts:96-122`, `persuratan.dto.ts:24-50` `TiptapDocSchema 1MB`, `DocNodeSchema` `assertTreeLimits`), slug regex `[a-z][a-z0-9_]`/`[a-z][a-z0-9-]{1,60}`, `config_json` per-13 tipe, `is_looping BR-003` (`item.*`), `publish BR-002` (`schemaJson` + header block), whitelist search/orderable → 400, `status transition` (`DRAFT→PUBLISHED→ARCHIVED` vs `ACTIVE→ARCHIVED`), `step_order INV-002` unique, `document_number BR-006` unique — pastikan `notFound` helper 404 konsisten.
- [ ] PDF hardening (reuse `server/services/pdf.service.ts`): `generatePdfFromHtml` catch di `doc-templates.service:141-148` + `administrations.service:228-236` → `pdfError` string, `status DRAFT` tanpa `pdfPath` bila gagal, return `200` dengan `pdfError` bukan 500 mentah (contract `ERR-09`). Verifikasi `storage.service.ts` reuse `general`/`avatars` tanpa folder baru.
- [ ] Operasi & image allowlist: `ExpressionService.evalTextOperation` recompute server (`master-data.service:474-479`) div-by-zero → 400 `ERR-03`; `coerceValue` image `https://`/`/api/storage/`/`data:image/` allowlist (same as `renderer.service` sanitize) — unit `master-operation.test.ts`.
- [ ] ActivityLog & seed: tetap `ActivityLogsService.log` per aksi (master delete `MASTER_TABLE_DELETE`, component `COMPONENT_DELETE`, template `TEMPLATE_DELETE`) — catch silent `.catch(()=>{})`; seeder `LetterBuilder:*` backfill tetap (stub `permission-matrix.ts` pin).
- [ ] Unit tests backend — `server/services/doc-components.service.ts` (duplicate 409 + findReferences + looping BR-003), `doc-templates.service` (duplicate code 409 + publish guard + steps 409), `master-data.service` (duplicate slug 409 + refs 409 + column refs + whitelist 400 + div-zero), `administrations.service` (duplicate name/slug 409 + `replaceSteps` DR-002 + `executeRun` pagebreak + document_number 409), `master-operation` eval, DTO Zod.

### Frontend

- [ ] Wire `ReferenceList.vue` modal untuk semua DELETE 409: `app/pages/dashboard/components.vue:67-73` (`removeComponent` 409 → `NModal` + `ReferenceList references: error.data.data.references | error.response.data.data.references`), `app/pages/dashboard/templates/index.vue:58-64`, `app/pages/dashboard/administrations.vue:65-77`, `app/components/features/master-data/MasterTableDataTable.vue:57` (removeTable 409), `app/components/features/master-data/MasterTableForm.vue:131` (syncColumns 409 column), `app/stores/persuratan.ts:49-82` + `master-data.ts:107-110` tetap re-throw untuk `getErrorMessage` + `data` akses (helper `extract409(error)`). Fallback fallback: `error.data?.references ?? error.response?.data?.data?.references ?? error.response?.data?.references`.
- [ ] Helper 409 `app/utils/error.ts` — tambahkan `getConflictReferences(e): string[] | null` + `isConflictError(e): boolean (status 409)` (+ tutorkan `extractErrorData(e)` untuk `steps/administrations`) — unit test; **tidak menambah `useApi` interceptor 409 global** (hanya per-page modal agar warning kontekstual, 403 tetap global `rbac-denied` event via `useApi.ts:25`/`middleware/auth.ts:52` + `AccessDeniedAlert.vue` single `data-testid=access-denied` — hapus duplikat listener per halaman).
- [ ] Wiring 400/404/500 UI: `MasterTableForm.vue` + `MasterRowForm.vue` (`NFormItem validationStatus` + `NAlert` summary + `ref.focus()` first error), Tiptap `ComponentEditor.vue` `is_looping` 400 → badge merah `#EF4444` + `NAlert`, `IDRInput.vue` formatter `Intl.NumberFormat('id-ID', currency:'IDR')` realtime, operation warning `—` + `NAlert`, `DocumentPreviewDrawer.vue` 500 PDF → `NAlert error + Coba lagi` tanpa reset, `RelationPickerModal.vue`/`DataTable` error slot `NAlert` + `emit('retry')`.
- [ ] Wire Storybook `08` components ke halaman nyata (regresi visual): `ReferenceList.vue` + `LoopingPicker.vue` (`pilih semua` indeterminate) + `IDRInput.vue` dipakai di form/builder; `TemplateBuilder` 3-pane drag-drop HTML5 + keyboard Up/Down (`useBuilderStore`), `AdminWizard.vue` `NSteps vertical`, `RelationPickerModal` full — semua Naive UI direct import `import { NModal, NAlert, NList, NTag, NSteps, NTree } from 'naive-ui'` + Tailwind inline `bg-[#f6f5f4]` `border-[#e6e6e6]` + `h(NIcon)` Carbon.
- [ ] Persistence & toolbar: `localStorage:master-data:<slug>:visibility` (min 1 kolom guard), `localStorage:letter-builder:draft:<slug>` draft banner `DRAFT` (`NAlert info`), `DataTable` kanonis toolbar 320/160 + `Restart` `aria-label="Segarkan data"` + `Settings` + `Reset` → re-fetch tanpa reset `search/sort/page`.
- [ ] Akses & responsive: sidebar 220/72 active `#0075de`/`#e8f2fd`, `PageShell` breadcrumb `<a href>` + `router.push`, leaf `aria-current="page"`, `aria-modal="true"` ReferenceList + `role="list"` references + `data-testid="conflict-references"`, focus trap `NModal`, `prefers-reduced-motion` reduce 0.01ms, Reduced-motion + viewport tablet/mobile via `storybook viewport addon`.
- [ ] Unit/NT tests nuxt — `test/nuxt/letter-builder-conflict.test.ts` (mock 409 → ReferenceList modal tampil, 400 inline, 403 single tidak double, 404 empty, pdf retry tanpa reset), `master-data.form.test.ts` (13 tipe + IDR + picker + whitelist), `template-builder.test.ts` (drag+keyboard), `component-editor.test.ts` (Tiptap+popup).

### Cross-Cutting

- [ ] RBAC matrix & guards: backfill seed `LetterBuilder:*` reuse Task05-07 (Component/Template/Administration/Document Read/Write + `Master Data Read/Write`) + guard allow `/api/master-data/*`, `/api/doc-*`, `/api/administrations/*`, `/api/documents/*` — tidak tambah permission baru; verifier `requireApiAccess` `matchUrlPattern` whitelist.
- [ ] `isMasterPhysicalTable` helper (drift ignore `mst_*`) tetap di `server/utils/migration-status.ts` + `orm-data-source.ts` appMigrations `Baseline + DropDynamic + CreateMasterTables + CreatePersuratanTables` orde tetap; `STORAGE_DIR` allowlist `settings/avatars/general` reuse.
- [ ] Storybook regression 08: `npm run storybook` + `npm run build-storybook` tetap PASS — `LetterBuilder/*` 9 files + `foundation/*` 3 files; chunks `storybook-static/index.json` berisi `LetterBuilder` + `Conflict409`; no `NDescriptions` (pakai `.detail-view`).
- [ ] `getErrorMessage` vs `extract409` — pastikan `app/utils/error.ts` tidak breaking RBAC existing (401→login, 403→`rbac-denied`); 409 bukan 401/403 interceptor global.
- [ ] Verifikasi konsistensi `08` ↔ `09`: `User Flow` 16 steps `08` = `09` (tidak deviasi UX tanpa catatan); `UI > Penyesuaian dari design` di `domain-api-ui.md` jelaskan `NPopconfirm`→`NModal ReferenceList` wiring.
- [ ] Docs: `tasks/README.md` + `tasks/task-logs.md` update (task 09 Fase 2, Depends on 08).

### Test Plan (QA — Bertindak sebagai QA Engineer)

> MANDATORY untuk FASE 2. Setiap User Flow step, Alternate/Error `ERR-01..10` + `ALT-01..06`, Business Rule `BR-001..008`, Edge Case `EC-01..10` HARUS pasangan test. Dipakai `/verify` + `/review`.

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit — DocComponents 409 + findRefs | `test/unit/server/services/doc-components.service.test.ts` | Duplicate `name` 409; `remove` 409 `refs: template/component` exact-match `EC-10`; `isLooping BR-003` 400 | FR-007/014, BR-003/004, AC-002/003 |
| UT-02 | Unit — DocTemplates 409 + publish | `test/unit/server/services/doc-templates.service.test.ts` | Duplicate `name/code` 409; `remove` 409 `steps/administrations` (BR-004); publish `BR-002` 400 + version bump `BR-005` | FR-011/014, BR-002/004/005, AC-003 |
| UT-03 | Unit — MasterData 409 + refs + whitelist | `test/unit/server/services/master-operation.test.ts` + `master-data.service.test.ts` | Duplicate slug 409 (`BR-001`); `removeTable` 409 `refs` + `findColumnReferences` `display_column`; `syncColumns` 409; whitelist `is_searchable/orderable` 400 (`BR-006`); div-by-zero 400 (`BR-007`); image allowlist | FR-002/003/006/014, BR-001/003/006/007, AC-003/004/005 |
| UT-04 | Unit — Administrations 409 + DTO | `test/unit/server/services/administrations.service.test.ts` + `test/unit/server/dto/persuratan.dto.test.ts` | Duplicate `name/slug` 409; `document_number` unique 409 (`BR-006`); `replaceSteps` `step_order` unique 400 (`INV-002`) + `DR-002` incomplete mapping 400; `RunWizardSchema` `MAX_JSON_BYTES` 1MB; `TiptapDocSchema` shallow + `DocNodeSchema` limit | FR-012/013/014, BR-004/006, INV-002, AC-003 |
| UT-05 | Unit — Documents DTO + Renderer | `test/unit/server/dto/documents.dto.test.ts` + `test/unit/server/services/renderer.service.test.ts` | `DocNode` depth≤10 total≤200 400; sanitize `javascript:` → escape; `assertTreeLimits` | DR-004/005, BR-008, AC-004 |
| UT-06 | Unit — Error helper | `test/unit/app/utils/error.test.ts` (new) | `getErrorMessage` fallback; `isConflictError/status 409`; `getConflictReferences` extract `data.references` dari `error.response.data` / `error.data` | ERR-05, AC-002/003 |
| NT-01 | Nuxt — Conflict ReferenceList wire | `test/nuxt/letter-builder-conflict.test.ts` (new) | Mock `$fetch DELETE 409` → `NModal ReferenceList` tampil `data-testid=conflict-references` + `NTag 409` + `Lihat` link; cancel tutup; 200 delete success toast; 400 inline validation; pdf retry tanpa reset; 403 single | Step 16, ERR-05, AC-002/003, AC-004 |
| NT-02 | Nuxt — Master form + IDR + picker + whitelist | `test/nuxt/master-data.form.test.ts` (existing refine) | 13 input + `IDRInput` `Intl` realtime; `RelationPickerModal` search/sort/checkbox `Pilihan` (BR-003 loop guard); visibility persist `localStorage:master-data:*`; empty 404 | Step 6-7, FR-004/005/006, BR-006, AC-005 |
| NT-03 | Nuxt — Template builder 3-pane + wizard | `test/nuxt/template-builder.test.ts` + `test/nuxt/component-editor.test.ts` (refine) | Library `NTree` + Canvas drag-drop HTML5 + keyboard Up/Down + Properties live; Tiptap right-click `BindingPalette` + `+ Binding` fallback 44px + invalid binding badge; `NSteps` wizard + tambah-step N | Step 8-15, FR-007/008/009/010, AC-006 |
| NT-04 | Nuxt — DataTable kanonis + AccessDenied single | `test/nuxt/imports.test.ts` + foundation `DataTable` | Toolbar 320/160 + `Restart` + `Settings` visibility + pagination ID `Menampilkan`; `rbac-denied` → single `AccessDeniedAlert` (`grep addEventListener` 1 hit, `useMessage` 0 unguarded) | Step 4-5, FR-003, AC-007 |
| E2E-01 | E2E — Master Data happy | `test/e2e/letter-builder-master.spec.ts` | Create definisi Pegawai 5 kolom → browse search/sort/visibility → create row relation+operasi → schema `GET` | Step 1-7, UC-01..03, AC-001/005, BR-001/006 |
| E2E-02 | E2E — Master protect & delete 409 ReferenceList | `test/e2e/letter-builder-master-protect.spec.ts` (refine) | Duplicate slug 409, **delete referenced table → 409 `ReferenceList` modal (bukan Server Error)**  — play: klik Trash → NPopconfirm → DELETE 409 → assert `data-testid=conflict-references` visible → Tutup → list remain; column 409; 403 Viewer vs Admin; empty CTA | ERR-01/04/05/07, ALT-01/02, EC-06, AC-002/003 |
| E2E-03 | E2E — Component Tiptap + 409 ReferenceList (bug pemicu) | `test/e2e/letter-builder-component.spec.ts` | Create Kop (right-click binding + fallback `+ Binding`), create Daftar looping `item.*`, preview → **delete Kop dipakai Template → 409 → ReferenceList `template:SK` + NTag 409** → delete Template dulu → delete Kop 200; blocking `isLooping` BR-003 400 | Step 8-9, FR-007/014, BR-003, AC-002 |
| E2E-04 | E2E — Template builder + publish vs 409 | `test/e2e/letter-builder-template.spec.ts` | Builder 3-pane drag+keyboard, embed, requirement master/manual/system, looping `pilih semua`, auto-form, preview HTML, preview PDF (skip 500 bila Chrome absen), publish BR-002 + version bump, **delete Template dipakai steps → 409 → ReferenceList steps/administrations** | Step 10-12, FR-008..011, BR-002/005, AC-003/006 |
| E2E-05 | E2E — Administrasi + Wizard gabungan + document_number 409 | `test/e2e/letter-builder-wizard.spec.ts` | Create Administrasi 2 steps + wizard guided `NSteps` (data → SK → Tanda Tangan → +step N → review pagebreak → PDF → save run version snapshot → menu per surat) + **document_number duplicate → 409 warning inline** | Step 13-15, UC-06/07/10, FR-012/013, BR-004/005, AC-006, EC-02 |
| E2E-06 | E2E — Errors & permissions & edge (ERR-01..10) | `test/e2e/letter-builder-errors.spec.ts` | **401/403 matrix (token hilang → login, Viewer → 403 single)**, 404 slug (`NEmpty+Kembali`), **500 PDF retry (ERR-09 `Coba lagi` tanpa reset `data`)**, div-by-zero (FR-006), rename relation `EC-04` invalid badge, upload >5MB, mobile viewport binding fallback `+ Binding`, story a11y `prefers-reduced-motion` | ERR-01..10, ALT-05/06, EC-01..10, BR-007/008, AC-004/007/008 |

- [ ] Unit tests `UT-01..06` — semua DTO/service/helper — 1 test per `FR/BR/DR/INV` (coverage ≥80% logic baru)
- [ ] Nuxt tests `NT-01..04` — semua state `loading/empty/error/success/validation/permissionDenied/conflict 409/draft/invalidBinding` + a11y keyboard/`aria-label`/contrast + reduced-motion
- [ ] E2E tests `E2E-01..06` — happy + alternate/error + permission + edge + **409 live** (`HEADLESS=1` Chromium, video retain-on-failure, SLOWMO 0, `reuseExistingServer: true` `:3000`) — **mapping 1:1 ke `User Flow` + `AC-001..008`**
- [ ] Coverage target: User Flow Steps 16/16 (100%), AC 8/8 (100%), BR 8/8 (100%), EC 10/10 (100%), ERR-01..10 (100%)
