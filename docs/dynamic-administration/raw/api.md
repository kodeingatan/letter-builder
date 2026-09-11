# API — Dynamic Administration & Document Composition

> Basis: `server/api/**/index.*` + `server/dto/*.dto.ts` + `docs/architecture.md` § API Endpoints + `server/utils/route-guard.ts`.
> Semua route di bawah prefix `/api`. Nitro file-based routing: `server/api/<module>/index.get.ts → GET /api/<module>`.

---

## 1. Konvensi Umum

### 1.1 Format Response
| Jenis | Format |
|-------|--------|
| List (paginated) | `{ data: T[], total: number, page: number, limit: number, totalPages: number }` |
| Single | `{ …entity… }` atau `entity` langsung (lihat service) |
| Error Zod | `400 { statusCode: 400, message: Validation failed, errors: [{ path, message }] }` |
| 401 | `{ statusCode:401, message:"Unauthorized" }` |
| 403 | `{ statusCode:403, message:"Access denied" }` |
| 404 | `{ statusCode:404, message:"Not found" }` |
| 409 | `{ statusCode:409, message:"Conflict / relation still in use" }` |
| 422 | `{ statusCode:422, message, missingBindings|missingFields }` (validate-tree / run complete) |

### 1.2 Query Pagination & Search (standar semua `index.get.ts`)
```
GET /api/<module>?page=1&limit=20&search=afdal&searchField=email&sortBy=id&sortOrder=DESC
```
- `page` default 1, `limit` default 20 max 100 (`z.coerce.number()` di DTO).
- `search` global LIKE `%search%` pada kolom searchable/whitelist per module.
- `searchField` — filter ke kolom spesifik saja.
- `sortBy` whitelist per module (contoh global-tables: `id,name,displayName,createdAt,updatedAt`).
- `sortOrder` `ASC|DESC` default `DESC` (kecuali columns `ASC`).

### 1.3 Header Auth
```
Authorization: Bearer <JWT>
```
`JWT` expiry 24 jam (`server/utils/jwt.ts`). Disimpan di `localStorage accessToken` + cookie.

### 1.4 Audit
Semua write (`POST/PUT/PATCH/DELETE`) otomatis `activity_logs` via service hook (`action: CREATE|UPDATE|DELETE`, `entity`, `entityId`, `metadata` JSON, `ipAddress`, `userAgent`, `level INFO`).

---

## 2. Authentication & Authorization

### 2.1 Public (tanpa Bearer)
| Method | Route | Alasan public |
|--------|-------|---------------|
| POST | `/api/auth/register` | registrasi |
| POST | `/api/auth/login` | login |
| GET | `/api/health` | `GET /api/health` health check |
| GET | `/api/settings` , `GET /api/settings/:key` | public config |
| GET | `/api/storage/...` | file serve (whitelist subfolder `settings,avatars,general,documents`) |

### 2.2 Protected — `requireAuth` → 401 jika gagal
Semua selain public.

### 2.3 Protected + `requireApiAccess` → 403 jika tidak punya permission method+URL
| Modul | Permission required (contoh `permission-matrix.ts`) |
|-------|------------------------------------------------------|
| Global Tables | `GlobalTables:Read` (GET), `GlobalTables:Write` (POST/PUT/DELETE) |
| Table Data | `Data:{table}:Read` / `Data:{table}:Write` auto-provision per Global Table |
| Components | `Components:Read` / `Components:Write` |
| Templates | `Templates:Read` / `Templates:Write` |
| Administrations | `Administrations:Read` / `Administrations:Write` |
| Runs | `Runs:Read` (mine/detail), `Runs:Write` (create/patch/complete/cancel) |
| Documents | `Documents:Read` |
| Expressions | `Expressions:Read` (validate/evaluate) |
| Navigation | auth-only, filter by permission |
| Activity-logs | `ActivityLogs:Read` |

> Guard `allow/deny URLs` dievaluasi client `canAccessUrl` untuk menu gating; server enforcement adalah permission `methods + urls` via `matchUrlPattern` (wildcard `/*`, `*`).

### 2.4 Role Seed
`Super Admin` (Full Access `methods:[*] urls:[/*]`), `Designer` (Write metadata), `Operator` (Write runs/documents), plus auto `Data:{table}:*`.

---

## 3. Endpoint — Global Tables

| Method | Route | Auth | Zod DTO | Deskripsi |
|--------|-------|------|---------|-----------|
| GET | `/api/global-tables` | Bearer+Read | `GlobalTableQuerySchema` | List metadata tabel |
| POST | `/api/global-tables` | Bearer+Write | `CreateGlobalTableSchema` | Create table |
| GET | `/api/global-tables/:id` | Bearer+Read | — | Detail + columns eager |
| PUT | `/api/global-tables/:id` | Bearer+Write | `UpdateGlobalTableSchema` (strict, `name` never) | Update displayName saja |
| DELETE | `/api/global-tables/:id` | Bearer+Write | — | Hapus (cek relation) |
| PUT | `/api/global-tables/:id/menu` | Bearer+Write | `{menuOrder: number|null, menuIcon: string|null}` | Update menu projection |
| GET | `/api/global-tables/:id/columns` | Bearer+Read | `GlobalTableColumnQuerySchema` | List columns |
| POST | `/api/global-tables/:id/columns` | Bearer+Write | `CreateGlobalTableColumnSchema` | Add column |
| PUT | `/api/global-tables/:id/columns/:columnId` | Bearer+Write | `UpdateGlobalTableColumnSchema` strict | Update column (displayName/type/… ) |
| DELETE | `/api/global-tables/:id/columns/:columnId` | Bearer+Write | — | Delete column |
| PUT | `/api/global-tables/:id/columns/order` | Bearer+Write | `ReorderGlobalTableColumnsSchema {orderedIds:number[] nonempty}` | Reorder dense |
| GET | `/api/global-tables/:id/rows/lookup` | Bearer+Read | `?search&limit` | Lookup untuk RelationSelector |

#### Request — POST /api/global-tables
```json
{ "name": "pegawai", "displayName": "Pegawai" }
```
`name` snake_case `^[a-z][a-z0-9_]*$` 1–64, reserved blocklist (`users, roles,…`), unique 409.

#### Request — POST /api/global-tables/:id/columns
```json
{ "name":"nip","displayName":"NIP","type":"text","required":true,"searchable":true,"position":0 }
```
Relational:
```json
{ "name":"department_id","displayName":"Departemen","type":"select-table-relation","position":6,"relationTableId":2,"relationConfig":"{\"displayColumns\":[\"code\",\"name\"],\"separator\":\" - \",\"onTargetDelete\":\"restrict\"}" }
```
Computed:
```json
{ "name":"total_gaji","displayName":"Total","type":"hidden-computed","expression":"gaji_pokok + tunjangan","position":5 }
```

#### Validation error contoh 400
```json
{ "statusCode":400, "message":"relationTableId is required for relational column types" }
```

---

## 4. Endpoint — Table Data (Dynamic Rows)

| Method | Route | Auth | DTO | Deskripsi |
|--------|-------|------|-----|-----------|
| GET | `/api/data/:tableName` | Bearer+Data:Read | `TableDataQuerySchema` (`page,limit,search,searchField,sortBy,sortOrder`) | List rows |
| GET | `/api/data/:tableName/:rowId` | Bearer+Data:Read | — | Detail row |
| POST | `/api/data/:tableName` | Bearer+Data:Write | `CreateTableRowSchema {values: Record<string,unknown>}` | Create row (values JSON) |
| PUT | `/api/data/:tableName/:rowId` | Bearer+Data:Write | `UpdateTableRowSchema` | Update row |
| DELETE | `/api/data/:tableName/:rowId` | Bearer+Data:Write | — | Delete row |
| GET | `/api/data/:tableName/export?format=csv` | Bearer+Data:Read | — | Export CSV |
| POST | `/api/data/:tableName/import` | Bearer+Data:Write | multipart `file` CSV | Import CSV |

#### Request — POST /api/data/pegawai
```json
{ "values": { "nama":"Afdal","nip":"123","jabatan":"Programmer","tanggal_lahir":"1995-08-10","foto":"/api/storage/general/…","department_id":2 } }
```
Server: strip `hidden-computed/readonly-computed` dari input → compute `expression` → merge → simpan `values` JSON text.

#### Response list
```json
{ "data":[{"id":1,"values":{"nama":"Afdal","nip":"123","_display":"001 - Teknologi"},"createdAt":"…"}], "total":42, "page":1, "limit":20, "totalPages":3 }
```
`_display` resolver dari `relationConfig.displayColumns`.

#### Error
- `404` `{message:"Global table 'x' not found"}`
- `400` validation per column type (required, select options, date ISO, number, relation id exists).

---

## 5. Endpoint — Components

| Method | Route | Auth | DTO | Deskripsi |
|--------|-------|------|-----|-----------|
| GET | `/api/components` | Read | `ComponentQuerySchema` | List |
| POST | `/api/components` | Write | `CreateComponentSchema {name 1–100, content nullable, looping bool, requirements: [{name snake_case 1–64, type enum text/image/component (v2 K-03; legacy: text/date/image/number/richtext)}]}` | Create (requirements UQ per component) |
| GET | `/api/components/:id` | Read | — | Detail + requirements |
| PUT | `/api/components/:id` | Write | `UpdateComponentSchema` | Update |
| DELETE | `/api/components/:id` | Write | — | Delete (cek binding usage 409) |
| POST | `/api/components/:id/preview` | Read | `PreviewComponentSchema {samples: Record<string,string|number>, items?: Record[] }` | Render preview tanpa publish |
| POST | `/api/components/:id/publish` | Write | — | Publish → append `component_versions` frozen `requirements` |
| GET | `/api/components/:id/versions/:version` | Read | — | Snapshot |
| POST | `/api/components/:id/rollback/:version` | Write (🎯 v2 K-parity, task 38) | — | Copy vX snapshot ke draft (paritas template rollback) |

#### Request preview
```json
{ "samples":{"nama":"Afdal","nip":"123"}, "items":[{"nama":"Afdal"},{"nama":"Budi"}] }
```

---

## 6. Endpoint — Templates

| Method | Route | Auth | DTO | Deskripsi |
|--------|-------|------|-----|-----------|
| GET | `/api/templates` | Read | `TemplateQuerySchema` | List |
| POST | `/api/templates` | Write | `CreateTemplateSchema {name 1–100, description nullable, content nullable JSON string {nodes:[]}}` | Create draft content optional valid skeleton |
| GET | `/api/templates/:id` | Read | — | Detail |
| PUT | `/api/templates/:id` | Write | `UpdateTemplateSchema` | Update draft (content skeleton check) |
| DELETE | `/api/templates/:id` | Write | — | Delete (cek AdministrationStep usage 409) |
| POST | `/api/templates/:id/validate-tree` | Read | `ValidateTreeSchema {content: string|object}` | Structural + binding + expression checks |
| POST | `/api/templates/:id/publish` | Write | — | Publish → frozen `template_versions.content` |
| POST | `/api/templates/:id/rollback/:version` | Write | — | Copy vX snapshot ke draft lalu publish baru |
| GET | `/api/templates/:id/versions/:version` | Read | — | Snapshot |
| PUT | `/api/templates/:id/bindings` | Write | `UpsertTemplateBindingsSchema {bindings:[{placementId 64, requirementName 64, source enum administration/global_table/manual/expression/system, sourceRef 255 nullable, literalValue text nullable, expression text nullable}]}` batch upsert | Binding. UQ `(placementId,requirementName)`. v2 K-04: `sourceRef` namespace `step.*`/`component.*` divalidasi bind-time (typo → 422 + saran) |
| GET | `/api/templates/:id/bindings` | Read | — | List bindings |
| DELETE | `/api/templates/:id/bindings/:bindingId` | Write | — | Delete binding |
| POST | `/api/templates/:id/bindings/preview` | Read | `{ placementId, dummyData }` | Preview binding |

#### Error validate-tree 422
```json
{ "statusCode":422, "message":"Missing bindings", "missingBindings":[{"placementId":"p1","requirementName":"nip"}], "invalidExpressions":[{"placementId":"p1","error":"Unexpected token"}] }
```

---

## 7. Endpoint — Administrations & Steps

| Method | Route | Auth | DTO | Deskripsi |
|--------|-------|------|-----|-----------|
| GET | `/api/administrations` | Read | `AdministrationQuerySchema` | List |
| POST | `/api/administrations` | Write | `CreateAdministrationSchema {name 1–100, description nullable}` | Create |
| GET | `/api/administrations/:id` | Read | — | Detail + steps |
| PUT | `/api/administrations/:id` | Write | `UpdateAdministrationSchema` | Update name/description |
| DELETE | `/api/administrations/:id` | Write | — | Delete |
| PUT | `/api/administrations/:id/menu` | Write | `{menuOrder, menuIcon}` | Menu projection |
| PUT | `/api/administrations/:id/steps` | Write | `BulkStepsSchema {steps:[{id?, name 1–100, templateId positive|null, templateVersion 1–16 nullable, fields: StepField[] 0–100}]}` replace-all | Step fields enum `text,richtext,date,select,number,currency,image` |
| POST | `/api/administrations/:id/publish` | Write | — | Publish → frozen `administration_versions.steps` bump version |
| POST | `/api/administrations/:id/new-version` | Write | — | Reopen draft from published |
| POST | `/api/administrations/:id/archive` | Write | — | Archived |
| GET | `/api/administrations/:id/versions/:version` | Read | — | Snapshot |

#### Request steps
```json
{ "steps":[
  {"name":"Info Surat","templateId":1,"templateVersion":"1","fields":[{"name":"nomor","label":"Nomor Surat","type":"text","required":true}]},
  {"name":"Pilih Pegawai","fields":[]}
]}
```

---

## 8. Endpoint — Runs

| Method | Route | Auth | DTO | Deskripsi |
|--------|-------|------|-----|-----------|
| POST | `/api/administrations/:id/runs` | Write | — | Create run `in_progress`, `resolvedPins` dari versi publish, `stepData:{}`. v2 K-02: run menerima `runtimeSteps[]` (template pilihan operator) yang ikut di-freeze |
| GET | `/api/runs/mine` | Read | `?page&limit&search&status` | List my runs |
| GET | `/api/runs/:runId` | Read | — | Detail run + steps |
| PATCH | `/api/runs/:runId/steps/:stepId` | Write | `UpdateRunStepSchema {fields?: Record<string,unknown>, rowSelections?: Record<string,number[]>, manualInputs?: Record<string,unknown>}` | Upsert stepData[stepId] |
| POST | `/api/runs/:runId/complete` | Write | — | Validate all required → atomic issue `documents` → run `completed` |
| POST | `/api/runs/:runId/cancel` | Write | — | `cancelled` |

#### Response create run
```json
{ "id":10,"administrationId":3,"administrationVersion":2,"resolvedPins":"[{\"stepId\":1,\"templateId\":5,\"version\":\"3\"}]","stepData":"{}","status":"in_progress","startedBy":1,"createdAt":"…" }
```
#### Error complete 422
```json
{ "statusCode":422, "message":"Missing required fields", "missingFields":[{"stepId":1,"field":"nomor"}] }
```

---

## 9. Endpoint — Documents & Rendering

| Method | Route | Auth | DTO | Deskripsi |
|--------|-------|------|-----|-----------|
| GET | `/api/documents` | Read | `DocumentQuerySchema {page,limit,search,administrationId,runId}` | List |
| GET | `/api/documents/:id` | Read | — | Detail (dataSnapshot JSON) |
| DELETE | `/api/documents/:id` | Write (admin) | — | Purge only |
| GET | `/api/documents/:id/html` | Read | — | Rendered HTML |
| GET | `/api/documents/:id/pdf` | Read | — | PDF binary (`Content-Type: application/pdf; Content-Disposition: attachment; filename="doc-#id.pdf"`) |
| POST | `/api/documents/:id/reissue` | Write | `{reason?: string}` | Create new row `replacesId=id` |
| POST | `/api/render/preview` | Read | `RenderPreviewSchema {administrationId, runId?, templateId, data: Record}` | Unsaved HTML preview |
| GET | `/api/data/:tableName/export` & POST `/import` | — | — | CSV (lihat §4) |

---

## 10. Endpoint — Expressions

| Method | Route | Auth | Input | Output |
|--------|-------|------|-------|--------|
| POST | `/api/expressions/validate` | Read | `{ expression: string, dependencies?: string[] }` | `{ valid: boolean, errors?: string[] }` 400 jika invalid |
| POST | `/api/expressions/evaluate` | Read | `{ expression: string, context: Record<string,unknown> }` | `{ result: unknown }` sandbox; 400 syntax error |

> Expression engine future prof: dipakai `hidden-computed`, `readonly-computed`, `TemplateBinding.expression`, `Step` condition (`POST /api/expressions/*` + `validate-tree`).

---

## 11. Endpoint — System

| Method | Route | Auth | Deskripsi |
|--------|-------|------|-----------|
| GET | `/api/navigation` | Bearer | Projection `{ data: [{title:"Data",children:[{title,path,tableName}]}, {title:"Persuratan",children:[{title,path,administrationId}]}] }` filtered by permission |
| GET | `/api/health` | public | `{ status:"ok", uptime, db:"connected" }` |
| GET | `/api/activity-logs` etc | Bearer | RBAC logs (lihat `architecture.md`) |
| GET | `/api/settings`, `PUT /api/settings`, `POST /api/settings/upload` | mixed | app config |
| GET | `/api/storage/...` | public (whitelist `settings,avatars,general,documents`) | file serve |

---

## 12. Validasi & Error — Pola Zod

```ts
// pattern semua handler (architecture.md § Backend Conventions)
import { CreateGlobalTableSchema } from '~~/server/dto/global-tables.dto'
export default defineEventHandler(async (event) => {
  await requireApiAccess(event, 'GlobalTables:Write') // 401/403
  const body = CreateGlobalTableSchema.parse(await readBody(event)) // 400 Zod
  return TablesService.create(body) // 409 unique, 404 FK miss
})
```
- Extra keys → `400` jika `.strict()` (mis. `UpdateGlobalTableSchema` tolak `name`).
- `relationTableId` cross-check `global_tables.id` exists else `404`.
- Draft `content` must be `{nodes:[]}` skeleton else `400`.

---

## 13. Auth Flow Detail

```
POST /api/auth/login {username|email, password} → 200 {token, user}
Client set localStorage accessToken + cookie
→ useApi() interceptor add `Authorization: Bearer <token>`
→ server middleware `verifyToken(token)` → `userId`
→ `requireApiAccess` load user with roles→permissions→methods/urls eager `matchUrlPattern(method,url)`
→ ALLOW / 403
→ 401 clear token redirect /login
```

---

## 14. Contoh E2E HTTP Tap (Operator)

```http
POST /api/auth/login
{"username":"operator","password":"P455w0rd!!!"}
→ {token:"eyJ..."}

POST /api/administrations/3/runs
Authorization: Bearer eyJ...
→ 201 {id:10, status:"in_progress"}

PATCH /api/runs/10/steps/5
Authorization: Bearer eyJ...
{"fields":{"nomor":"001/IX/2026","tanggal":"2026-09-10"}}
→ 200 {stepData…}

POST /api/runs/10/complete
→ 200 {documents:[{id:42, runId:10, templateVersion:3}], status:"completed"}

GET /api/documents/42/pdf
→ 200 application/pdf (binary)

```http
# v2 K-02 — runtime step: pilih template 7 sebagai step baru
POST /api/runs/10/runtime-steps
{"templateId":7}
→ 201 {stepId:"rs1", templateId:7, version:"2"}

# v2 K-parity — rollback component ke v1
POST /api/components/4/rollback/1
→ 200 {draft:{...}, fromVersion:1}
```

---

## 15. Sinkronisasi v2 (2026-09-11, keputusan K-01…K-04)

- K-01: `global-table-columns.dto` enum bertambah `datetime,time,select-multiple`;
  `administrations.dto` step fields mengikuti (minimal `text,richtext` + v2 sesuai keputusan task).
- K-02: `POST /runs/:runId/runtime-steps` (baru) + `resolvedPins` diperluas (audit pilihan runtime).
- K-03: requirement enum menambah `component`; `validate-tree`/publish/preview mengembalikan
  `cyclicRequirements[]` (rantai + lokasi) sebagai 422 `INFINITE_LOOP`.
- K-04: binding validator menolak namespace tak dikenal dengan 422 + `suggestion`.

## 16. Referensi DTO Lengkap
`server/dto/global-tables.dto.ts`, `global-table-columns.dto.ts`, `table-data.dto.ts`, `components.dto.ts`, `templates.dto.ts`, `template-bindings.dto.ts`, `administrations.dto.ts`, `runs.dto.ts`, `documents.dto.ts`, `render.dto.ts`, `expressions.dto.ts`, `navigation.dto.ts`, `users.dto.ts`, `roles.dto.ts`, `permissions.dto.ts`, `guards.dto.ts`, `activity-logs.dto.ts`, `system-logs.dto.ts`, `settings.dto.ts`, `auth.dto.ts`.
Lihat `orm-data-source.ts` untuk entity list canonical; `docs/database.md` untuk 26 physical tables.
