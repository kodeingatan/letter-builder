## Verification

### Automated

- [x] Typecheck (`vue-tsc`) — 0 error.
- [x] Unit (`npm run test:unit` dari `apps/web/`) — UT-01/02/03 PASS, 64/64 file baru; full suite 161/161 (2026-09-13).
- [x] Nuxt (`npm run test:nuxt`) — tidak regresi (52/52; tidak ada komponen baru).
- [x] API/integration — API-01/02 PASS (401/403/400 matrix; 403 live via viewer).
- [x] E2E (`npm run test:e2e`) — E2E-01 5 pass + 1 skip terdokumentasi (Chrome belum install → path ERR-04 500 live terverifikasi).
- [x] Build (`npm run build`) — sukses 19.3MB (Puppeteer hanya server: `chunks/routes/api/documents/*`, tidak bocor ke bundle klien).

### Manual / QA Checklist

- [x] SK 2 pegawai → urutan benar (AC-001, E2E live).
- [x] Condition internal/eksternal berganti (AC-002, E2E live).
- [x] Nested trips di bawah pemiliknya (AC-003, unit).
- [x] XSS payload ter-escape; richtext aman (AC-004, unit).
- [x] PDF A4 portrait terbuka, teks terseleksi (bukan gambar), ukuran wajar (AC-006 — via mock browser unit + file-contract; binary live menunggu Chrome, path 500 ERR-04 live terverifikasi).
- [x] 401/403 untuk kedua endpoint (AC-007, E2E live: 401 anon + 403 viewer).
- [x] `storage/documents/` tidak ter-commit (gitignored) kecuali `.gitkeep` (`storage/.gitignore` + `.gitkeep`).

## Assumptions

- Puppeteer dapat berjalan di CI Linux (bila tidak, ganti `puppeteer-core` + `chrome-aws-lambda` tanpa ubah API — catat di Open Questions).
- QR cukup placeholder; lib QR diputuskan Task 07.
- UI: N/A — backend only; tidak ada Storybook untuk task ini (penyimpangan sadar dari pola UI-First karena user meminta tepat 3 folder).
- [decided by /auto-all-tasks 2026-09-13] `server/utils/permission-matrix.ts` TIDAK diubah (stub kosong di-pin oleh `test/unit/utils/permission-matrix.test.ts`: catalog `[]`, Designer/Operator/Admin `[]`). Permission `Document Preview`/`Document PDF` + URL `/api/documents/preview|pdf` di-seed langsung di `seeder.service.ts` (additive, idempotent) + backfill grant ke Super Admin. Guard URL tidak diubah: `requireApiAccess` hanya menegakkan Permission method+URL (guard allow `/api/*` existing sudah mencakup).
- [decided by /auto-all-tasks 2026-09-13] Spec menyebut "16 type node" tetapi enumerasi di `spec.md`/`domain-api-ui.md` berjumlah 18 — implementasi memakai 18 (`DocNodeType` di `shared/types/document.ts`).
- [decided by /auto-all-tasks 2026-09-13] BR-001 "total node ≤ 200" ditegakkan pada tree statis via `assertTreeLimits` (400 bila lebih); runtime renderer guard ekspansi repeater di 10000 node + 500 item/level (EC-02) agar kedua cap tidak saling meniadakan.
- [decided by /auto-all-tasks 2026-09-13] File service/DTO baru memakai import relatif (bukan `~~/server/…`) karena alias Vitest `~~ → ./server` tidak kompatibel dengan konvensi Nuxt `~~ → root`; satu baris `storage.service.ts` disesuaikan dengan alasan yang sama (tanpa perubahan perilaku). Ditemukan saat implementasi: sintaks `relations: ['x']` sudah dihapus di TypeORM v1 — backfill memakai `relations: { permissions: true }`.
- [decided by /auto-all-tasks 2026-09-13] Puppeteer di-install dengan Chrome download di-skip di env ini (`PUPPETEER_SKIP_DOWNLOAD=1` + postinstall diblokir `allowScripts`); `pdf.service` lazy-launch + 500 `Failed to generate PDF` bila browser absen (ERR-04). PDF binary asli terverifikasi via mock (unit) — E2E AC-006 parsial: preview/401/400 PASS live, PDF binary menunggu Chrome (`npx playwright install` / unblock puppeteer postinstall tidak mengubah API).

## Open Questions

- Puppeteer vs `playwright-core` + channel Chrome untuk prod kecil? (Puppeteer default; ukur memori dulu.)
- Butuh mode `strict` (binding hilang → warning vs throw) via query `?strict=1`?
- Cap 200 node / 500 item/level cukup untuk SK massal?

## Related Knowledge

- `docs/architecture.md` (Nitro route, service object, `requireApiAccess`), `docs/database.md` (tanpa tabel baru), `AGENTS.md` (DTO Zod, service pattern).
- `.ua/` bila ada (pola service/renderer existing).

### Engine singkat (implementasi 2026-09-13, tanpa ubah `docs/` permanen)

- `shared/types/document.ts` — `DocNode` (18 type), `RenderContext/RenderScope/RenderResult`, `PdfOptions A4|F4|Letter × portrait|landscape`.
- `server/services/expression.service.ts` — `resolvePath` (scope-first, `{{current_date}}`), `interpolate` (whole-string preservasi tipe, missing → `''`), `evalCondition` 8 operator, `evalTextOperation` tokenizer aman (`++ "" * / + -`, div-by-zero → `null`).
- `server/services/renderer.service.ts` — `render(tree, data, {components?}) → {html, warnings}`; pure, escape semua binding, `sanitize-html` untuk header richtext, allowlist URL gambar, `component-ref` 1 level + tolak siklus.
- `server/services/pdf.service.ts` — `generatePdf(tree, data, page?) → {url}`; `setBrowserLauncher` seam untuk test; timeout 30s; cleanup file saat gagal.
- `server/dto/documents.dto.ts` — `DocNodeSchema` rekursif + `assertTreeLimits` (depth ≤ 10, node ≤ 200) + body data ≤ 2MB.
- `POST /api/documents/preview|pdf` — `requireApiAccess` + Zod + `createError` + `ActivityLog(DOCUMENT_PREVIEW|DOCUMENT_PDF)`. PDF tersimpan `storage/documents/*.pdf`, serve via storage route (`Content-Type: application/pdf`).
- Dikonsumsi Task 06 (reuse `expression.service`) dan Task 07 (reuse `renderer.service` + registry `components`).

## Change Log

### Initial

- Task specification created (Document Engine — fondasi 05 dari roadmap 05→06→07).
