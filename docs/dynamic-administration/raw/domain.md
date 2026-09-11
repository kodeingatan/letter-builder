# Domain — Dynamic Administration & Document Composition

> Sumber canonical: `server/entities/*.entity.ts` + `server/utils/orm-data-source.ts` (23 EntitySchemas / 26 physical tables) + `docs/database.md` § DYNAMIC TABLES + `core-conpect.md` bab 26 Core Object Model.
> Prinsip: `GlobalTable → Column → Row` menyediakan Data; `Component → DataRequirement + ComponentVersion` menyediakan reusable block; `Template → Binding + Version` menyusun blueprint; `Administration → Step + Version` mendefinisikan workflow; `AdministrationRun → Document` merekam eksekusi & output.

---

## 1. Entity

### 1.1 Global Tables
| Entity | File | Kolom kunci | Deskripsi |
|--------|------|-------------|-----------|
| `GlobalTable` | `global-table.entity.ts` | `id PK, name UQ 64 snake_case immutable, displayName 100, menuOrder nullable, menuIcon nullable, createdAt, updatedAt` | Metadata tabel dinamis. `name` = physical key untuk `GET /api/data/:tableName`. `displayName` untuk UI/menus. |
| `GlobalTableColumn` | `global-table-column.entity.ts` | `id PK, globalTableId FK, name 64 snake_case, displayName 100, type 32 enum, defaultValue nullable, required/searchable/orderable bool, position int dense, options text JSON, format nullable, expression text nullable, dependencies text nullable, relationTableId nullable, relationConfig text JSON` | Definisi kolom schema-driven. `type` menentukan `Input → Display → Validation → Search/Order` (bab 3 core-conpect). |
| `GlobalTableRow` | `global-table-row.entity.ts` | `id PK, globalTableId FK CASCADE, values text JSON {col: val}, createdAt, updatedAt` | Generic row store — satu baris = satu JSON `values`. Relation single=`number`, multiple=`number[]`, image=`url`, date=`ISO`. |

### 1.2 Components
| Entity | File | Kolom kunci | Deskripsi |
|--------|------|-------------|-----------|
| `Component` | `component.entity.ts` | `id PK, name UQ 100, content text nullable (HTML/handlebars), looping bool default false, preview text nullable, version int default 1, status 16 default draft, createdAt, updatedAt` | Reusable document block. `looping` = Single vs Collection mode (bab 9). |
| `ComponentDataRequirement` | `component.entity.ts` | `id PK, componentId FK, name 64, type 16, createdAt, updatedAt` — UQ `(componentId,name)` | Contract: "saya butuh `nama, nip, jabatan`" (bab 8). v2 type: `text, image, component` (K-03; `component` = nested tanpa batas + cycle alert). |
| `ComponentVersion` | `component.entity.ts` | `id PK, componentId FK, version int, content nullable, looping bool, requirements text JSON frozen, createdAt` — UQ `(componentId,version)` | Immutable snapshot publish. `requirements` frozen `[{name,type}]`. |

### 1.3 Templates
| Entity | File | Kolom kunci | Deskripsi |
|--------|------|-------------|-----------|
| `DocTemplate` (`templates`) | `template.entity.ts` | `id PK, name UQ 100, description text nullable, content text nullable (JSON nodes[]), version int default 0, status 16 default draft, createdAt, updatedAt` | Blueprint dokumen — composition tree `nodes[]` (Tiptap JSON), bukan HTML mentah. |
| `TemplateVersion` | `template.entity.ts` | `id PK, templateId FK, version int, content text frozen nodes, publishedBy nullable, createdAt` — UQ `(templateId,version)` | Immutable publish snapshot. |
| `TemplateBinding` | `template-binding.entity.ts` | `id PK, templateId FK, placementId 64, componentId FK, requirementName 64, source 16 enum, sourceRef 255 nullable, literalValue text nullable, expression text nullable, status 16 default bound, createdAt, updatedAt` — UQ `(templateId,placementId,requirementName)` | Binding per requirement placement. `source`: `administration, global_table, manual, expression, system`. Loop pakai `item.*`. |

### 1.4 Administrations & Runs
| Entity | File | Kolom kunci | Deskripsi |
|--------|------|-------------|-----------|
| `Administration` | `administration.entity.ts` | `id PK, name UQ 100, description nullable, status 16 default draft, version int default 0, menuOrder nullable, menuIcon 32 nullable, createdAt, updatedAt` | Workflow pengumpulan data. Projection ke menu `Persuratan`. |
| `AdministrationStep` | `administration.entity.ts` | `id PK, administrationId FK, order int, name 100, templateId nullable, templateVersion 16 nullable pin, fields text nullable JSON` — UQ `(administrationId,order)` | Satu tahap pengumpulan data (bab 15). `fields` = definisi field step. |
| `AdministrationVersion` | `administration.entity.ts` | `id PK, administrationId FK, version int, steps text JSON frozen `[{order,name,templateId,templateVersion,fields}]`, publishedBy nullable, createdAt` — UQ `(administrationId,version)` | Immutable publish snapshot steps. |
| `AdministrationRun` | `administration-run.entity.ts` | `id PK, administrationId FK, administrationVersion int default 0, resolvedPins text JSON `[{stepId,templateId,version}]`, stepData text JSON `RunStepDataMap`, status 16 default in_progress, startedBy nullable, startedAt nullable, completedAt nullable, createdAt, updatedAt` | Eksekusi workflow. `stepData = { [stepId]: { fields, rowSelections, manualInputs } }`. v2 runtime-penuh (K-02): run juga mem-freeze **urutan + pilihan template steps runtime**; field namespaced `step_field` (`{{data.<step>.<field>}}`). |

### 1.5 Documents
| Entity | File | Kolom kunci | Deskripsi |
|--------|------|-------------|-----------|
| `Document` | `document.entity.ts` | `id PK, runId FK, administrationId FK, stepId nullable, templateId nullable, templateVersion int, dataSnapshot text JSON ` { runInput, templateContent, componentSnapshots, bindings, resolvedPins, systemContext }`, outputHtml text nullable, outputFilePath 500 nullable (storage/documents/), replacesId nullable FK self, createdBy nullable, createdAt` | Hasil akhir immutable (append-only). `replacesId` untuk reissue (baris baru). |

### 1.6 RBAC & System (referensi, bukan fokus domain ini tetapi berelasi)
`User, Role, Permission, Guard, GuardUrl, PermissionMethod, PermissionUrl, ActivityLog, Setting` — hubungan M:N `users_roles, roles_guards, roles_permissions` — lihat `docs/database.md`.

---

## 2. Relationship

### 2.1 Diagram
```
global_tables ──1:N──> global_table_columns
     │ 1:N
     └──> global_table_rows (FK CASCADE, JSON values)
     │ 1:N (logical, relationTableId → id)
     └── relation target (enforced service)

components ──1:N──> component_data_requirements  (UQ componentId,name)
     │ 1:N
     └──> component_versions (immutable)

templates ──1:N──> template_versions (immutable)
     │ 1:N
     └──> template_bindings ──N:1──> components (via componentId)
               │
               └── requirementName → ComponentDataRequirement (logical)

administrations ──1:N──> administration_steps ──N:1──> templates (nullable, pinned version)
     │ 1:N
     ├──> administration_versions (immutable, steps JSON)
     ├──> administration_runs (in_progress/completed/cancelled, resolvedPins frozen)
     │         │ 1:N
     │         └──> documents (per template-step, dataSnapshot frozen, replacesId chain)
     └──> documents (direct FK administrationId for filtering)

administration_runs ──1:N──> documents (runId)
```

### 2.2 Kardinalitas & Enforce
| Relasi | Tipe | Enforce DB vs Service |
|--------|------|----------------------|
| GlobalTable → Column | 1:N, UQ `(globalTableId,name)` | DB index; delete tidak CASCADE (service hapus eksplisit) |
| GlobalTable → Row | 1:N, FK `globalTableId → global_tables.id CASCADE` | DB CASCADE + service check |
| Column `relationTableId` → GlobalTable | Logical N:1 | Service: cek target exists; delete target → `409` atau `detach` nullify |
| Component → DataRequirement | 1:N, UQ `(componentId,name)` | DB index |
| Component/Template/Administration → Version | 1:N, UQ `(*_id,version)` | DB; service append-only |
| Template → Binding | 1:N, UQ `(templateId,placementId,requirementName)` | DB |
| Administration → Step | 1:N, UQ `(administrationId,order)` dense | DB + service replace-all |
| Administration → Run → Document | 1:N → 1:N | Service atomic `complete` |
| Document `replacesId` → Document | Self 0:1 | Logical, tidak FK |

---

## 3. State

### 3.1 Status Fields & Transisi
| Entity | Field | Nilai | Transisi (allowed) | Guard |
|--------|-------|-------|--------------------|-------|
| `Component.status` | `status` | `draft → published` | `draft --publish--> published`; `published --update--> draft` (edit buka draft baru `POST /:id/new-version` analog) | `publish` butuh bindings valid (jika dipakai template) |
| `DocTemplate.status` | `status` | `draft, published, archived` | `draft --publish--> published`; `published --archive--> archived`; `archived --new-version--> draft`; rollback = copy snapshot → draft → publish | publish butuh `validate-tree` pass |
| `Administration.status` | `status` | `draft, published, archived` | `draft --publish--> published`; `published --archive--> archived`; `published --new-version--> draft`; version bump tiap publish | publish butuh steps valid + template pins exist |
| `AdministrationRun.status` | `status` | `in_progress → completed \| cancelled` | `in_progress --complete--> completed` (atomic issue docs); `in_progress --cancel--> cancelled` | `complete` validasi semua step required terisi |
| `Document` | (tanpa status) | immutable | hanya `reissue` → baris baru `replacesId` | tidak ada update-in-place |

### 3.2 Diagram State Utama
```
Component: draft ──publish──> published

Template: draft ──publish──> published ──archive──> archived
            ^                    │
            └──── new-version ───┘
         rollback = copy vX → draft → publish = vN+1

Administration: sama dengan Template

Run: in_progress ──complete──> completed (issue Documents)
      │
      └──cancel──> cancelled (no docs)

Document: [issued] ──reissue──> [new Document replacesId=old]
          (lama tetap, tidak berubah)
```

---

## 4. Domain Rules

| ID | Aturan | Penjelasan |
|----|--------|------------|
| DR-01 | Unified data language | Semua referensi data pakai `{{data.*}}` / `{{component.*}}` / `{{system.*}}`; expression pakai `+ - * / ++` + helper `IF/ROUND/SUM/COUNT/MIN/MAX/DATE_FORMAT/CONCAT`. Satu engine (`jexl` di `rekomendasi-library.md`). |
| DR-02 | Component tidak memiliki data final | Component hanya declare `DataRequirement`; Template supply via `TemplateBinding.source`. Satu component reusable lintas template & administration. |
| DR-03 | Binding source tertutup | `source ∈ { administration, global_table, manual, expression, system }`. `administration` → `stepData.fields`; `global_table` → `{tableName.column}`; `manual` → `literalValue`; `expression` → `expression`; `system` → `current_date, user.*`. |
| DR-04 | Loop semantik | `Component.looping=true` → collection; Template pilih `Source Table` + `rowSelections number[]`; Renderer `for each` render component per item. `item.*` di binding loop merujuk elemen iterasi, bukan root. |
| DR-05 | Condition terpisah dari content | `Condition` simpan sebagai JSON logic (`json-logic-js`) atau `IF()` di tree node, bukan di string content. Renderer evaluasi sebelum/ saat loop. |
| DR-06 | Pin versi (frozen) | Saat `Administration.publish`, `resolvedPins = [{stepId, templateId, version}]` frozen. Saat `Run` dibuat, pins disalin ke `AdministrationRun.resolvedPins`. Rendering selalu pakai pin, bukan `templates.version` live. |
| DR-07 | Computed field server-authoritative | `GlobalTableColumn.expression` + `dependencies` dievaluasi server setiap `POST /data/:tableName` + `PUT /data/:tableName/:rowId`. Payload client untuk kolom computed di-ignore. Tipe `hidden-computed` tidak dikirim ke form; `readonly-computed` tampil readonly. |
| DR-08 | Schema-driven form | `Column definition → Form Renderer → Input Component` — mapping: `text→NInput, richtext→NInput textarea (defer HTML editor), date→NDatePicker, select→NSelect, number/currency→NInputNumber, relation→RelationSelector, image→Upload+NImage, computed→(skip/readonly)`. |
| DR-09 | Generated menu = projection metadata | `GET /api/navigation` proyeksi `GlobalTable` → `Data/*` + `Administration` → `Persuratan/*` ter-filter permission. Tidak hard-code. |
| DR-10 | Renderer-driven, bukan per-template PDF writer | `Template → Generic Renderer → HTML → PDF` (bab 27 core-conpect). Semua dokumen lewat `POST /api/render/preview` / `GET /documents/:id/{html,pdf}`. |

---

## 5. Invariant (tidak boleh dilanggar — test harus fail jika langgar)

| ID | Invariant | Mekanisme penegak |
|----|-----------|-------------------|
| INV-01 | **GlobalTable.name immutable & snake_case UQ** | DTO `global-tables.dto.ts` regex `^[a-z][a-z0-9_]{0,63}$`; service tolak `PUT` rename jika sudah punya rows/bindings; index UQ `name`. |
| INV-02 | **Column `(globalTableId,name)` UQ & position dense** | Index UQ + service validasi dense `0..n-1` pada reorder. |
| INV-03 | **Reserved table names block** | Blocklist `users, roles, permissions, guards, documents, administration_runs, templates, components, global_tables, global_table_*` di service. |
| INV-04 | **Computed column tidak writable client** | Service strip computed keys dari `values` input; hitung ulang `expression` server-side; `dependencies` harus subset kolom existing. |
| INV-05 | **Version tables append-only** | `component_versions, template_versions, administration_versions` tidak ada `update/delete` route; repository hanya `insert`; test cek tidak ada `PUT` ke `*_versions`. |
| INV-06 | **Document & AdministrationVersion immutable snapshot** | `documents`, `administration_versions` tidak ada `PUT`; `dataSnapshot` & `steps` JSON tidak di-update; `reissue` buat baris baru `replacesId`. |
| INV-07 | **Binding uniqueness & loop reference** | Index UQ `(templateId,placementId,requirementName)`; validator cek `item.*` hanya valid di placement looping; non-loop tidak boleh `item.*`. |
| INV-08 | **Step order dense UQ** | Index UQ `(administrationId,order)`; service `PUT /:id/steps` tolak duplicate order / gap (dense `1..n`). |
| INV-09 | **Publish guard** | `publish` tolak jika `validate-tree` fail (missing bindings / expression invalid); status tidak berubah. |
| INV-10 | **Run atomic issue** | `POST /runs/:runId/complete` dalam transaksi: validasi semua step required → insert `documents` per template-step → update run `completed`; gagal → rollback, tidak ada dokumen setengah jadi. |
| INV-11 | **Pin frozen at run start** | `AdministrationRun.resolvedPins` disalin saat `POST /administrations/:id/runs`; perubahan `templates.version` setelahnya tidak memengaruhi run yang sudah `in_progress`. |
| INV-12 | **Relation target existence** | `relationTableId` harus FK ke `global_tables.id` existing; hapus target dengan referensi aktif → `409` atau `detach` policy eksplisit (service). |
| INV-13 | **RBAC deny-by-default** | Semua `/api/*` selain allowlist (`POST /auth/*, GET /health, GET /settings, GET /storage/*`) require `requireAuth + requireApiAccess` (permission method+URL match). Tanpa permission → `403`. |
| INV-14 | **Navigation projection filtered** | `GET /api/navigation` filter menu by permission; user tanpa `Data:pegawai:Read` tidak lihat menu Pegawai (client `canAccessUrl` + server filter). |
| INV-15 | **One data language** | Semua binding/expression reference harus lewat unified `{{data.*}}` namespace; tidak ada ad-hoc path `pegawai_nip` tanpa prefix. |

---

## 6. Contoh Aggregat & Snapshot

### Global Table pegawai
```json
{
  "name": "pegawai",
  "displayName": "Pegawai",
  "columns": [
    {"name":"nama","type":"text","required":true,"position":0},
    {"name":"nip","type":"text","required":true,"searchable":true,"position":1},
    {"name":"jabatan","type":"select","options":"[\"Programmer\",\"Analis\"]","position":2},
    {"name":"tanggal_lahir","type":"date","format":"m-d-Y","position":3},
    {"name":"foto","type":"image","position":4},
    {"name":"total_gaji","type":"hidden-computed","expression":"gaji_pokok + tunjangan","dependencies":"[\"gaji_pokok\",\"tunjangan\"]","position":5},
    {"name":"department_id","type":"select-table-relation","relationTableId":2,"relationConfig":"{\"displayFields\":[\"code\",\"name\"]}","position":6}
  ]
}
```

### Component Identitas Pegawai
```json
{
  "name": "Identitas Pegawai",
  "looping": false,
  "content": "Nama: {{nama}}\nNIP: {{nip}}\nJabatan: {{jabatan}}",
  "requirements": [{"name":"nama","type":"text"},{"name":"nip","type":"text"},{"name":"jabatan","type":"text"}]
}
```

### Template SK (nodes)
```json
{
  "nodes": [
    {"type":"paragraph","text":"Dengan ini menerangkan bahwa:"},
    {"type":"component","placementId":"p1","componentId":1,"looping":false},
    {"type":"paragraph","text":"Demikian surat ini dibuat."}
  ]
}
```
Binding `p1`:
```json
[
  {"placementId":"p1","requirementName":"nama","source":"global_table","sourceRef":"pegawai.nama"},
  {"placementId":"p1","requirementName":"nip","source":"global_table","sourceRef":"pegawai.nip"}
]
```

### Administration SK Pengangkatan (steps frozen v1)
```json
[
  {"order":1,"name":"Info Surat","templateId":1,"templateVersion":"1","fields":[{"name":"nomor","type":"text","required":true}]},
  {"order":2,"name":"Pilih Pegawai","templateId":null,"fields":[{"name":"pegawai_ids","type":"select-table-relation-multiple","relationTableId":1}]},
  {"order":3,"name":"Preview","templateId":null}
]
```

### Run stepData & resolvedPins
```json
{
  "resolvedPins": [{"stepId":1,"templateId":1,"version":"1"}],
  "stepData": {
    "1": {"fields":{"nomor":"001/2026"},"rowSelections":{},"manualInputs":{}},
    "2": {"fields":{},"rowSelections":{"pegawai":[1,3]},"manualInputs":{}}
  }
}
```

### Document dataSnapshot (ringkas)
```json
{
  "runInput": {"stepData": "…"},
  "templateContent": {"nodes":"…"},
  "componentSnapshots": [{"componentId":1,"version":3,"content":"…","requirements":"…"}],
  "bindings": "…",
  "resolvedPins": "…",
  "systemContext": {"current_date":"2026-09-10","user":{"id":1,"username":"admin"}}
}
```

---

## 8. Sinkronisasi v2 (2026-09-11, keputusan K-01…K-04)

- **K-01 katalog 14**: `GlobalTableColumn.type` bertambah `datetime` (format default `m-d-Y H:i:s`),
  `time` (default `H:i:s`), `select-multiple` (options `{value,label}`).
- **K-02 runtime-penuh**: `AdministrationRun` mem-freeze urutan + pilihan template steps runtime;
  steps predefined = kerangka awal. Relasi run→template-step runtime tercatat di `resolvedPins`
  yang diperluas (audit).
- **K-03 nested**: `ComponentDataRequirement.type` menambah `component`; rantai
  requirement→component→requirement membentuk graph (bukan tree) — engine wajib cycle check.
- **K-04 prefix**: field step memakai namespace `step_field`; `RunStepDataMap` keys
  direkomendasikan `<step>_<field>`; bahasa `{{data.<step>.<field>}}`.

## 9. Referensi
- `core-conpect.md` bab 6–9 (Component contract), 10–13 (Template binding), 14–16 (Administration), 26 (Object Model), 27 (Prinsip), 29–31 (v2)
- `database.md` § DYNAMIC ADMINISTRATION TABLES (skema aktual)
- `architecture.md` § Dynamic Administration Layers
