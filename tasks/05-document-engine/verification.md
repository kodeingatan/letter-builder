## Verification

### Automated

- [ ] Typecheck (`vue-tsc`) — 0 error.
- [ ] Unit (`npm run test:unit` dari `apps/web/`) — UT-01/02/03 PASS, coverage ≥80% file baru.
- [ ] Nuxt (`npm run test:nuxt`) — tidak regresi (tidak ada komponen baru).
- [ ] API/integration — API-01/02 PASS (401/403/400 matrix).
- [ ] E2E (`npm run test:e2e`) — E2E-01 PASS atau SKIP terdokumentasi bila Chromium belum install.
- [ ] Build (`npm run build`) — sukses (Puppeteer hanya server, tidak bocor ke bundle klien).

### Manual / QA Checklist

- [ ] SK 2 pegawai → urutan benar (AC-001).
- [ ] Condition internal/eksternal berganti (AC-002).
- [ ] Nested trips di bawah pemiliknya (AC-003).
- [ ] XSS payload ter-escape; richtext aman (AC-004).
- [ ] PDF A4 portrait terbuka, teks terseleksi (bukan gambar), ukuran wajar (AC-006).
- [ ] 401/403 untuk kedua endpoint (AC-007).
- [ ] `storage/documents/` tidak ter-commit (gitignored) kecuali `.gitkeep`.

## Assumptions

- Puppeteer dapat berjalan di CI Linux (bila tidak, ganti `puppeteer-core` + `chrome-aws-lambda` tanpa ubah API — catat di Open Questions).
- QR cukup placeholder; lib QR diputuskan Task 07.
- UI: N/A — backend only; tidak ada Storybook untuk task ini (penyimpangan sadar dari pola UI-First karena user meminta tepat 3 folder).

## Open Questions

- Puppeteer vs `playwright-core` + channel Chrome untuk prod kecil? (Puppeteer default; ukur memori dulu.)
- Butuh mode `strict` (binding hilang → warning vs throw) via query `?strict=1`?
- Cap 200 node / 500 item/level cukup untuk SK massal?

## Related Knowledge

- `docs/architecture.md` (Nitro route, service object, `requireApiAccess`), `docs/database.md` (tanpa tabel baru), `AGENTS.md` (DTO Zod, service pattern).
- `.ua/` bila ada (pola service/renderer existing).

## Change Log

### Initial

- Task specification created (Document Engine — fondasi 05 dari roadmap 05→06→07).
