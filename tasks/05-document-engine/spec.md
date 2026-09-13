## Objective

Membangun Document Engine generik: model JSON Tree (`document/header/content/section/footer` + blok `text/heading/paragraph/image/table/signature/date/qrcode/divider/pagebreak` + `repeater` + `condition` + `component-ref`), expression/binding evaluator, renderer HTML aman, dan PDF via Puppeteer — sebagai fondasi Task 06 (Master Data sebagai Data Source) dan Task 07 (Component Tiptap + Template + Administrasi).

## Context

Posisi pertama dari tiga task yang diminta user (`05 → 06 → 07`). Kode saat ini RBAC-Only (9 EntitySchemas/12 tabel, Task 01 menghapus 14 tabel dynamic). Engine ini mengembalikan kapabilitas dokumen tanpa mengembalikan DDL lama: murni service + util + 2 endpoint (`preview`, `pdf`), tanpa halaman UI. Pola existing yang dipakai: `EntitySchema + Zod DTO + Service plain object + requireApiAccess + pagination`.

## Scope

### In Scope

- Tipe `DocNode` kanonis di `shared/types/document.ts` + Zod schema validasi tree (depth ≤ 10, children ≤ 200).
- `expression.service`: `resolvePath(scope.field)`, operator condition (`eq/neq/gt/gte/lt/lte/contains/in/empty`), evaluator operasi-teks `++ "" * / + -` (dipakai juga Task 06).
- `renderer.service` (pure): render rekursif + nested repeater (`source/item`, mis. `employees` → `item.trips`) + condition + component-ref 1 level + escape XSS + sanitasi richtext.
- `pdf.service` + endpoint: HTML → PDF Puppeteer (`page_size A4/F4/Letter, orientation`), simpan `storage/documents/*.pdf`, serve via storage whitelist.
- Endpoint: `POST /api/documents/preview {schema_json, data}` (tanpa simpan), `POST /api/documents/pdf {schema_json, data, page}` → `{url}`.
- Permission baru: `Document Engine Preview/PDF` (method+URL), guard `/api/documents/preview`, `/api/documents/pdf`.
- Unit test renderer/expression (nested loop, condition, escape, div-by-zero).

### Out of Scope

- Editor visual/builder 3-pane, Tiptap, Component registry (Task 07).
- Master Data DDL `mst_*` (Task 06); engine hanya terima `data` JSON arbitrer.
- Template/Administration persistence multi-step (Task 07); tidak ada tabel template di task ini.
- QR rendering final (cukup placeholder `div[data-qr]` bila lib belum dipilih).

## Dependencies

- `tasks/04-redesign/README.md` — DONE (fondasi UI/RBAC stabil, tidak diubah).
- `docs/architecture.md`, `docs/database.md`, `docs/design-system.md` (konvensi service/DTO/API).
- `server/utils/orm-data-source.ts`, `server/utils/route-guard.ts`, `server/utils/permission-matrix.ts`, `server/services/seeder.service.ts`.
