## Acceptance Criteria

### AC-001 — Preview SK dengan repeater

Given tree SK + `employees:[Afdal,Budi]`

When `POST /api/documents/preview`

Then HTML memuat "Afdal/199xxx/Programmer" dan "Budi/198xxx/Analis" berurutan.

### AC-002 — Condition internal/eksternal

Given condition `letter.type eq internal` + `elseChildren`

When preview dengan `internal` lalu `eksternal`

Then cabang yang tampil berganti dengan benar.

### AC-003 — Nested loop perjalanan dinas

Given `employees[0].trips=[Banda Aceh, Medan]`

When preview

Then kedua destinasi muncul di bawah pegawai yang benar.

### AC-004 — Binding hilang & XSS aman

Given `{{employee.name}}` hilang + `{{name}}="<script>"`

When preview

Then binding hilang → kosong, script → ter-escape (`&lt;script&gt;`).

### AC-005 — Validasi tree

Given type tak dikenal / depth 11

When preview/pdf

Then 400 dengan pesan validasi.

### AC-006 — PDF A4 tersimpan

Given preview valid + `page {A4, portrait}`

When `POST /api/documents/pdf` lalu `GET url`

Then PDF binary `Content-Type: application/pdf` terbuka.

### AC-007 — RBAC

Given tanpa token / tanpa permission

When panggil preview/pdf

Then 401 / 403.

## Tasks

### Backend

- [x] Shared types — `shared/types/document.ts` (DocNode union + RenderContext + PdfOptions).
- [x] DTO — `server/dto/documents.dto.ts` (DocNodeSchema rekursif + Preview/Pdf schema + depth check).
- [x] `expression.service` — `resolvePath`, `evalCondition` 8 operator, operasi-teks `++ "" * / + -` tokenizer aman.
- [x] `renderer.service` — plain object `render(tree, data): {html, warnings}` (rekursif, nested scope, escape, sanitasi).
- [x] `pdf.service` — Puppeteer launch headless, `page.pdf {format, landscape, printBackground}`, tulis `storage/documents/`, cleanup saat gagal.
- [x] API — `server/api/documents/preview.post.ts`, `pdf.post.ts` (`requireApiAccess` + Zod + `createError`).
- [x] Storage whitelist tambah `documents` + serve PDF.
- [x] `permission-matrix.ts` + seeder: permission preview/pdf + guard URLs.
- [x] Deps: tambah `puppeteer`, `sanitize-html` (atau `isomorphic-dompurify`) di `apps/web/package.json`.

### Frontend

- [x] N/A — tidak ada halaman (konsumen di Task 07).

### Cross-Cutting

- [x] RBAC matrix + seed + ActivityLog (`DOCUMENT_PREVIEW`, `DOCUMENT_PDF`).
- [x] Batas body 2MB + timeout PDF 30s + cap node 200/level 500 item.
- [x] Docs singkat engine di `verification.md` Related (tanpa ubah `docs/` permanen).

### Test Plan

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit expression | `test/unit/server/services/expression.service.test.ts` | resolvePath, 8 operator, operasi-teks, div-by-zero | FR-002/004, BR-004, AC-002/004 |
| UT-02 | Unit renderer | `test/unit/server/services/renderer.service.test.ts` | repeater, nested, condition, escape, caps | FR-001..006, BR-001..003, AC-001..005 |
| UT-03 | Unit DTO | `test/unit/server/dto/documents.dto.test.ts` | valid/invalid tree, depth | BR-001, AC-005 |
| API-01 | Integration | `test/unit/server/api/documents-preview.test.ts` | 200 + 400 + 401 + 403 | Step 1–3, AC-001/002/005/007 |
| API-02 | Integration | `test/unit/server/api/documents-pdf.test.ts` | 200 url + serve + 500 mock | Step 4–5, AC-006 |
| E2E-01 | E2E | `test/e2e/documents-engine.spec.ts` | preview→pdf→open (skip bila browser belum install) | Step 1→5, AC-006 |
