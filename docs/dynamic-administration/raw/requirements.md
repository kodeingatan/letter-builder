# Requirements — Dynamic Administration & Document Composition

> Turunan dari `core-conpect.md` bab 1–28 + `docs/PRD.md` + `docs/database.md` § DYNAMIC TABLES.
> Scope: **Global Table → Component → Template → Administration → Document (PDF/HTML)**.
> Implementasi: tasks 07–22 selesai; file ini adalah spesifikasi persyaratan yang berjalan di kode.

---

## 1. Tujuan Feature

### 1.1 Masalah
Membuat surat/dokumen (SK, Surat Tugas, Perjalanan Dinas) secara konvensional butuh hard-code per jenis surat: migration + entity + controller + service + PDF writer per template. Setiap instansi punya struktur berbeda (`Pegawai` dengan kolom `nip, jabatan, pangkat` vs `Dosen` dengan `nidn`), sehingga developer jadi bottleneck.

### 1.2 Tujuan
Membangun platform **metadata-driven** sehingga non-developer (Designer) dapat:
1. Mendefinisikan struktur data sendiri tanpa menulis kode (Global Table).
2. Menyusun blok dokumen reusable (Component).
3. Merangkai blueprint dokumen dengan richtext + binding + loop + condition (Template).
4. Mendefinisikan workflow pengumpulan data bertahap (Administration).
5. Menghasilkan dokumen final yang version-safe (Document → HTML/PDF) via satu Rendering Engine generik.

### 1.3 Indikator Keberhasilan
| Indikator | Target |
|-----------|--------|
| Designer membuat Global Table baru tanpa deploy | < 5 menit, tanpa migration manual |
| CRUD auto-generate untuk tiap tabel | browse/search/sort/pagination + create/edit/delete langsung jalan |
| Template baru memakai component existing | < 10 menit |
| Dokumen lama tetap valid setelah template di-publish ulang | snapshot `dataSnapshot` + `templateVersion` tidak berubah |
| Pembuatan Administrasi multi-step multi-template | 4 template dalam 1 administration (contoh Perjalanan Dinas) berjalan |

### 1.4 Batasan (Non-Goals v1)
- Bukan editor layout print-ready ala InDesign; fokus A4 HTML → PDF.
- Expression tahap awal: `+ - * / ++ "string"`; `IF/SUM/ROUND/DATE_FORMAT` bertahap.
- Bukan approval workflow multi-role kompleks v1.

---

## 2. User / Persona

| Persona | Role sistem | Tanggung jawab | Akses metadata | Contoh |
|---------|-------------|----------------|----------------|--------|
| **System Administrator** | `Super Admin` | Kelola RBAC (users/roles/permissions/guards), settings, logs | Tidak wajib paham persuratan | admin@admin.com |
| **Designer** | `Designer` (seed Task 22) | Membuat `GlobalTable`, `Component`, `Template`, `Administration`; publish version | Write metadata | Kepala TU / staf perancang dokumen |
| **Operator** | `Operator` (seed) | Menjalankan Administration (`/api/runs`), mengisi step, generate dokumen | Read metadata + Write `runs`/`documents` | Staf persuratan |
| **Auditor / Viewer** | `User` read-only | Melihat dokumen, logs | Read | Atasan / pemeriksa |

> Mapping RBAC ada di `server/utils/permission-matrix.ts` — 22 base permissions + `Data:{table}:Read/Write` auto-provision per Global Table.

---

## 3. Use Case

### UC-01 — Kelola Global Table (Designer)
**Aktor**: Designer  
**Pre**: login, `hasPermission('GlobalTables:Write')`  
**Alur**: `Browse` → `Create` (name snake_case immutable, displayName, menuIcon/order) → `Add Column` (text/richtext/date/select/number/currency/image/relation/relation-multiple/computed) → `Save` → `Rows CRUD` → `Menu` muncul di `Data`  
**Post**: `global_tables` + `global_table_columns` tersimpan; `GET /api/navigation` memproyeksikan menu baru.

### UC-02 — Kelola Component (Designer)
**Aktor**: Designer  
**Alur**: `Create Component` (name unik, content HTML, `looping` boolean) → deklarasi `Data Requirement` (name + type) → `Preview` dengan data dummy → `Publish` (snapshot `component_versions`, bump `version`)  
**Aturan**: Component tidak menyimpan data final; hanya contract.

### UC-03 — Kelola Template (Designer)
**Aktor**: Designer  
**Alur**: `Create Template` → `CompositionCanvas` (tiptap JSON `nodes[]`) → `Insert Component` (picker) → `Binding` tiap `requirement` ke `source` (administration/global_table/manual/expression/system) → `Validate Tree` → `Publish` (frozen `template_versions`) → `Rollback` jika perlu  
**Varian**: loop (`is_looping` component) + condition + page-break.

### UC-04 — Kelola Administration (Designer)
**Aktor**: Designer  
**Alur**: `Create Administration` → `Add Steps` (order dense 1..n, name, templateId optional, fields JSON) → `Pin templateVersion` per step → `Publish` (frozen `administration_versions`, `resolvedPins`) → `Archive` bila usang → `New Version` untuk edit published.  
**Varian**: 1 administration = banyak template (bab 16 core-conpect).

### UC-05 — Jalankan Administration (Operator)
**Aktor**: Operator  
**Alur**: `GET /api/administrations/:id` → `POST :id/runs` (buat `administration_runs` `in_progress`, snapshot `resolvedPins` versi publish) → per step `PATCH /runs/:runId/steps/:stepId` (isi fields, rowSelections, manualInputs) → `POST /runs/:runId/complete` → sistem issue `documents` (1 per template-step, `dataSnapshot` frozen) → `GET /documents/:id/html` + `/pdf`  
**Alternatif**: `POST /runs/:runId/cancel` → status `cancelled`.

### UC-06 — Kelola Table Data (Operator/Designer)
**Aktor**: Designer (define) / Operator (isi)  
**Alur**: `Browse /api/data/:tableName` (search/sort/pagination) → `Create Row` (values JSON, computed dihitung server) → `Edit` → `Delete` (cek relation restrict/detach) → `Import CSV` / `Export CSV`.

### UC-07 — Render & Cetak Dokumen
**Aktor**: Operator  
**Alur**: `POST /api/render/preview` (unsaved preview) → `GET /api/documents/:id/html` (viewer) → `GET /api/documents/:id/pdf` (download) → `POST /api/documents/:id/reissue` (buat dokumen baru `replacesId`, tidak mutate).

### UC-08 — Navigation & Discovery
**Aktor**: Semua authenticated  
**Alur**: `GET /api/navigation` → menu Data (per Global Table) + Persuratan (per Administration) ter-filter permission.

---

## 4. Functional Requirements

### FR-GT Global Table
| ID | Requirement |
|----|-------------|
| FR-GT-01 | CRUD `global_tables`: name snake_case 1–64, unique, **immutable** setelah create; displayName 1–100; menuOrder nullable int; menuIcon nullable string 32. |
| FR-GT-02 | CRUD `global_table_columns` per table: name snake_case, displayName, type enum (`text, richtext, date, select, number, currency, image, select-table-relation, select-table-relation-multiple, hidden-computed, readonly-computed`), position dense, required/searchable/orderable boolean, defaultValue nullable, options JSON (select), format nullable, expression+dependencies (computed), relationTableId+relationConfig (relation). Unique `(globalTableId,name)`. |
| FR-GT-03 | Reorder columns via `PUT /api/global-tables/:id/columns/order` (array `columnIds` dense). |
| FR-GT-04 | `Menu` config `PUT /:id/menu` (menuOrder/menuIcon) live di navigation tanpa redeploy. |
| FR-GT-05 | Rows store `global_table_rows.values` JSON text `{col: value}`; computed columns tidak menerima input client — server recompute setiap write. |
| FR-GT-06 | Generate CRUD UI otomatis: Browse (search/sort/pagination/column-visibility) + Form (input mapping per type) + Delete confirm. |
| FR-GT-07 | `GET /api/data/:tableName` query: `page, limit (≤100), search, searchField, sortBy, sortOrder`; `GET /lookup` untuk relation selector. |
| FR-GT-08 | Import CSV `POST /data/:tableName/import` (multipart) + Export `GET /export?format=csv`. |

### FR-CMP Component
| ID | Requirement |
|----|-------------|
| FR-CMP-01 | CRUD `components`: name unique 1–100, content nullable text (HTML/handlebars), looping boolean, preview nullable, version default 1, status `draft/published`. |
| FR-CMP-02 | Data Requirements `component_data_requirements`: `(componentId,name)` unique; type enum (text/number/date/image/select dll). Contract minimal 1 requirement jika content memakai placeholder. |
| FR-CMP-03 | `POST /components/:id/preview` — render dengan `payload` dummy tanpa publish. `POST /:id/publish` — append `component_versions` (requirements frozen JSON), bump version, status published. |
| FR-CMP-04 | `GET /components/:id/versions/:version` — baca snapshot immutabel. |

### FR-TMP Template
| ID | Requirement |
|----|-------------|
| FR-TMP-01 | CRUD `templates`: name unique 1–100, description nullable, content JSON `nodes[]` (tiptap-like tree, bukan HTML mentah), version default 0, status `draft/published/archived`. |
| FR-TMP-02 | `TemplateVersion` frozen `content` (tree) + `publishedBy`; rollback `POST /templates/:id/rollback/:version` copy snapshot ke draft lalu publish baru (bukan overwrite). |
| FR-TMP-03 | `TemplateBinding` per `placementId`: `requirementName`, `source` enum (`administration, global_table, manual, expression, system`), `sourceRef`, `literalValue`, `expression`, `status bound`. Unique `(templateId, placementId, requirementName)`. |
| FR-TMP-04 | `PUT /templates/:id/bindings` upsert batch; `GET` list bindings; `DELETE :id/bindings/:bindingId`; `POST :id/bindings/preview` resolve dummy. |
| FR-TMP-05 | `POST /templates/:id/validate-tree` — lengkapi guard: setiap placement requirement harus bound, expression valid (`POST /api/expressions/validate`), loop `item.*` reference valid. |
| FR-TMP-06 | `POST /templates/:id/publish` — frozen version; `archived` tidak bisa edit kecuali `new-version`. |

### FR-ADM Administration
| ID | Requirement |
|----|-------------|
| FR-ADM-01 | CRUD `administrations`: name unique 1–100, description, status `draft/published/archived`, version 0, menuOrder/menuIcon. |
| FR-ADM-02 | Steps `administration_steps`: `(administrationId,order)` unique dense; name 1–100; templateId nullable; templateVersion nullable string pin; fields JSON (field definitions per step). `PUT /administrations/:id/steps` replace all steps atomically. |
| FR-ADM-03 | Publish `POST /:id/publish` — frozen `administration_versions.steps` JSON + bump version + `publishedBy`. `POST /:id/new-version` reopen draft. `POST /:id/archive`. |
| FR-ADM-04 | `GET /:id/versions/:version` read snapshot. |

### FR-RUN Run & Document
| ID | Requirement |
|----|-------------|
| FR-RUN-01 | `POST /administrations/:id/runs` — buat `administration_runs` `in_progress`, `resolvedPins` dari versi publish (pin per step), `stepData {}` kosong, `startedBy` dari JWT. |
| FR-RUN-02 | `PATCH /runs/:runId/steps/:stepId` — upsert `stepData[stepId] = { fields, rowSelections, manualInputs }`; validasi required sesuai `fields` step. |
| FR-RUN-03 | `POST /runs/:runId/complete` — validasi semua step terisi, issue `documents` 1 per step yang punya template (dataSnapshot frozen), status run `completed`, `completedAt`. Atomic. |
| FR-RUN-04 | `POST /runs/:runId/cancel` — status `cancelled`; tidak issue dokumen. |
| FR-RUN-05 | `GET /runs/mine` list milik user; `GET /runs/:runId` detail; query pagination standar. |
| FR-RUN-06 | `Documents` append-only: `runId, administrationId, stepId, templateId, templateVersion, dataSnapshot (JSON frozen), outputHtml nullable, outputFilePath nullable, replacesId`. `GET /documents`, `GET /documents/:id`, `GET /:id/html`, `GET /:id/pdf`, `POST /:id/reissue` (buat baris baru), `DELETE` hanya admin purge. |
| FR-RUN-07 | `POST /api/render/preview` — preview tanpa simpan (resolve tree → HTML). |
| FR-RUN-08 | Navigation `GET /api/navigation` — projection menu Data+Persuratan ter-filter permission. |

### FR-EXP Expression Engine
| ID | Requirement |
|----|-------------|
| FR-EXP-01 | `POST /api/expressions/validate` — cek syntax `+ - * / ++ "string"` + fungsi `IF/SUM/COUNT/MIN/MAX/DATE_FORMAT/CONCAT` (sesuai core-conpect bab 5). |
| FR-EXP-02 | `POST /api/expressions/evaluate` — evaluasi dengan `context` JSON; sandbox, tidak `eval`. |

### FR-RND Rendering Engine
| ID | Requirement |
|----|-------------|
| FR-RND-01 | Resolve tree: `Binding → Loop → Condition → Text/Image/RichText/Table/PageBreak/DataBinding/Expression` (bab 19). |
| FR-RND-02 | Hasil HTML → PDF via engine generik (`puppeteer-core` di `rekomendasi-library.md`). Satu renderer untuk semua template. |

---

## 5. Business Rules

| ID | Rule | Sumber |
|----|------|--------|
| BR-01 | Global Table `name` immutable setelah create (rename dilarang agar `dataSnapshot` & relation tetap valid). | `database.md` + `global-tables.dto.ts` |
| BR-02 | Column `type` computed (`hidden-computed`, `readonly-computed`) nilai diabaikan dari client; server hitung ulang tiap write dari `expression` + `dependencies`. Hidden tidak tampil di form; readonly tampil readonly. | bab 4 |
| BR-03 | Template/Component/Administration version adalah **immutable history** — update tidak mutate `*_versions`; publish = append. Rollback = copy snapshot ke draft lalu publish baru (AC-003). | `template.entity.ts` comment |
| BR-04 | Document `dataSnapshot` frozen (runInput + templateContent + componentSnapshots + bindings + resolvedPins + systemContext). Edit template setelah issue tidak mengubah dokumen lama. | bab 28 versioned |
| BR-05 | `replacesId` untuk reissue: baris baru dengan pointer ke dokumen lama; lama tidak di-update/hapus. | `document.entity.ts` |
| BR-06 | Step `order` dense & unique per administration; reorder harus kirim ulang array lengkap. | `administration.entity.ts` indices |
| BR-07 | Binding source `global_table` butuh `sourceRef = { tableName, column }` valid; `expression` butuh validasi via `/expressions/validate`. Loop placement pakai `item.*` (bukan root). | template-bindings.dto |
| BR-08 | Relation `select-table-relation-multiple` simpan `number[]`; `single` simpan `number`. Display resolver ikut `relationConfig.displayFields`. | bab 23–24 |
| BR-09 | Generated Menu adalah projection metadata — bukan hard-code. Tambah Global Table/Administration langsung muncul setelah `GET /api/navigation`. | bab 21 |
| BR-10 | RBAC load-bearing: semua `/api/*` kecuali `POST /auth/*`, `GET /health`, `GET /settings`, `GET /storage/*` wajib Bearer + permission method+URL match. | `architecture.md` §RBAC |

---

## 6. Edge Cases

| # | Edge case | Penanganan |
|---|-----------|------------|
| EC-01 | Rename Global Table setelah ada `rows` + `templateBindings` mengacu `tableName` | Ditolak 400 — `name` immutable (BR-01). Alternatif: buat tabel baru + migrasi manual. |
| EC-02 | Hapus Global Table yang masih jadi `relationTableId` di kolom lain | `409` jika `restrict`; atau `detach` (nullify relation) service-level. FK DB tidak enforce (better-sqlite3), service cek eksplisit. |
| EC-03 | Hapus Global Table Row yang masih dipilih di `RunStepData.rowSelections` | Simpan ID tetap di snapshot; display fallback `"[deleted row #id]"`. Tidak cascade hapus run. |
| EC-04 | Expression `harga * jumlah` dengan `jumlah = null` | Evaluasi → `null` / fallback `0` sesuai helper; UI tampilkan warning validasi step (vee-validate). Server tidak throw 500 — return `null` + log. |
| EC-05 | Component loop dengan `rowSelections = []` (tidak ada yang dipilih) | Render kosong (0 iterasi) — bukan error; preview tampilkan empty state `NEmpty`. |
| EC-06 | Template publish dengan placement belum di-binding | `validate-tree` fail 422 — list `missingBindings [{placementId, requirementName}]`. Publish diblok. |
| EC-07 | Expression syntax error saat `PATCH step` | `400` dari `/expressions/validate`; step tetap tersimpan draft, tapi `complete` diblok sampai valid. |
| EC-08 | Dua user publish template/administration bersamaan | Optimistic via `version` increment DB unique `(id,version)` — yang kedua dapat `409 Conflict`, diminta refresh. |
| EC-09 | Administration di-publish lalu langsung di-edit | Edit langsung buka draft via `POST /:id/new-version`; versi publish lama tetap immutable. |
| EC-10 | Run `complete` dengan step belum terisi required | `422` dengan detail `missingFields [{stepId, field}]`. |
| EC-11 | Document reissue bertubi-tubi → chain `replacesId` panjang | Chain boleh; `GET /documents/:id?trail=true` (opsional) telusuri chain via `replacesId` tanpa update lama. |
| EC-12 | Page-break & table besar di HTML → PDF terpotong | Renderer pakai CSS `break-inside: avoid` + pagedjs fallback; test visual dengan `html2canvas` snapshot. |
| EC-13 | CSV import dengan kolom computed atau relation id tidak valid | Kolom computed di-skip; relation id tidak ditemukan → baris di-skip dengan `errors[]` di response, tidak abort semua. |
| EC-14 | Global Table `name` bentrok dengan `users/roles` dsb | Validasi blocklist reserved names (`users`, `roles`, `permissions`, `guards`, `documents`, ...). |
| EC-15 | `search` global pada `global_table_rows.values` JSON (tidak indexed) | Service-level scan JSON; batasi `limit ≤100`; peringatan skala menengah. FTS per-tabel adalah upgrade boundary. |

---

## 7. User Flow

### 7.1 Designer — End-to-end (Global Table → Document jadi)
```text
Login → Navigation (GET /api/navigation) → Data > + New Table
  → POST /api/global-tables { name:"pegawai", displayName:"Pegawai" }
  → POST /api/global-tables/:id/columns (bulk: nama(text), nip(text), jabatan(select), tanggal_lahir(date), foto(image), total(g hidden-computed: harga*jumlah))
  → Rows: POST /api/data/pegawai { values:{ nama:"Afdal", nip:"123" } }
  → Components: POST /api/components { name:"Identitas Pegawai", content:"Nama:{{nama}}", looping:false, requirements:[{name:"nama",type:"text"},…] } → Preview → Publish
  → Templates: POST /api/templates { name:"SK Pengangkatan", content:{nodes:[{type:"paragraph",text:"Dengan ini…"}, {type:"component", placementId:"p1", componentId:1}]}} → PUT /templates/:id/bindings [{placementId:"p1", requirementName:"nama", source:"global_table", sourceRef:"pegawai.nama"},…] → Validate-tree → Publish (v1)
  → Administrations: POST /api/administrations { name:"SK Pengangkatan" } → PUT /:id/steps [{order:1,name:"Info Surat", templateId:1, templateVersion:"1", fields:[…]}, {order:2,name:"Pilih Pegawai",…}] → Publish
  → Verifikasi: GET /api/navigation → menu Data: Pegawai muncul; Persuratan: SK Pengangkatan muncul
```

### 7.2 Operator — Eksekusi
```text
Login → Persuratan > SK Pengangkatan → Start (POST /administrations/:id/runs) → run {id, resolvedPins}
  → Step 1: PATCH /runs/:runId/steps/:stepId { fields:{ nomor:"001/2026", tanggal:"2026-09-10"} }
  → Step 2: PATCH /runs/:runId/steps/:stepId { rowSelections:{ pegawai:[1,2] }, fields:{…}}
  → Preview: POST /api/render/preview { administrationId, runId } → HTML
  → Complete: POST /runs/:runId/complete → documents[] (per template-step)
  → Documents: GET /documents?administrationId=1 → list
  → View: GET /documents/:id/html (viewer) → GET /documents/:id/pdf (download)
  → Reissue jika salah: POST /documents/:id/reissue → dokumen baru (replacesId)
```

### 7.3 Error & Recovery Flow
```text
Bound gagal → validate-tree 422 → UI sorot placement merah + list missingBindings
Publish conflict 409 → toast "Versi sudah berubah, refresh" → GET /templates/:id → retry
Run complete 422 missingFields → scroll ke step yang merah → isi ulang
Auth 401 → clear token → redirect /login → toast "Sesi habis"
Auth 403 → NAlert "Access Denied" + event rbac-denied → sembunyikan tombol Record
```

### 7.4 Navigation Flow (Generated Menu)
```text
Designer POST /api/global-tables (Pegawai) → GET /api/navigation
  → { data: [{ title:"Data", children:[{title:"Pegawai", path:"/dashboard/data/pegawai"}]}, {title:"Persuratan", children:[…]}] }
  → AppLayout render menu via <a href> + router.push (SSR-safe)
```

---

## 8. Kriteria Penerimaan (Acceptance Checklist)

- [ ] Designer bisa buat Global Table dengan 6 tipe kolom minimal (text/date/select/number/relation/computed) dan CRUD row jalan.
- [ ] Component loop + template binding + Administration multi-step berjalan end-to-end sampai PDF.
- [ ] `GET /api/navigation` memproyeksikan menu baru tanpa restart.
- [ ] Dokumen ter-issue menyimpan `dataSnapshot` + `templateVersion`; edit template tidak mengubah PDF lama.
- [ ] Reissue membuat baris baru (`replacesId`), tidak mutate.
- [ ] Semua route metadata terproteksi RBAC; 401/403 handling client sesuai `design-system.md` Authorization UI Patterns.
- [ ] Expression invalid diblok di `validate`/`validate-tree` dengan pesan field-level.

## 9. Sinkronisasi v2 (2026-09-11, keputusan K-01…K-04)

- [ ] K-01: `datetime`/`time`/`select-multiple` terdaftar di DTO + form + display + search/order
  (format default `m-d-Y H:i:s` / `H:i:s`; options `{value,label}`).
- [ ] K-02: Operator dapat menambah step (pilih template) saat runtime; run mem-freeze pilihan;
  complete atomic mencakup steps runtime; steps predefined tetap kerangka awal.
- [ ] K-03: Requirement `component` nested tanpa batas depth; loop terdeteksi → alert infinite
  loop + blokir render terdampak (tanpa crash) di validate-tree, publish guard, preview, editor.
- [ ] K-04: Field step memakai konvensi `step_field` (`{{data.<step>.<field>}}`); typo namespace
  gagal di bind-time dengan pesan + saran; ref lama kompatibel mundur.
- [ ] Popup klik-kanan component: input nama data + select tipe (`text`/`image`/`component`).
- [ ] Template: description + form generated (C.4) + preview PDF (C.5) — ketiganya verified existing,
  dipertahankan sebagai acceptance.

## 10. Referensi
- `core-conpect.md` bab 1–31 (sumber konsep, termasuk v2 bab 29–31)
- `spec-v2-statamic-alignment.md` (spec mentah v2 + keputusan K-01…K-04)
- `docs/PRD.md` §8–11 (business rules & glossary)
- `docs/database.md` §DYNAMIC ADMINISTRATION TABLES (schema aktual)
- `docs/architecture.md` §Dynamic Administration Layers & RBAC
