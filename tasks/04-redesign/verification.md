<!-- tasks/04-redesign/verification.md — FASE 2 -->

## Verification (QA — Bertindak sebagai QA Engineer)

### Automated (wajib lolos sebelum DONE)

- [ ] Typecheck (`vue-tsc --noEmit`) — 0 error
- [ ] Unit tests (`npm run test:unit`) — UT-01 PASS + regresi 82 PASS
- [ ] Nuxt tests (`npm run test:nuxt`) — NT-01/NT-02 PASS + regresi 36 PASS
- [ ] E2E tests (`npm run test:e2e`) — E2E-01/E2E-02 PASS (atau manual trace bila browser missing — catat seperti preseden Task 02)
- [ ] Storybook build (`npm run build-storybook`) — `foundation/` + `redesign/` PASS
- [ ] Build (`npm run build` dari `apps/web/`) — sukses

### Manual / QA Checklist (mapping ke User Flow & AC)

- [ ] Dashboard verification — hero tampil, stat akurat vs API, recent benar (AC-001, EC-01)
- [ ] Table verification — pill tampil, sort/search/pagination tak berubah (AC-002)
- [ ] Modal verification — xl16 + Level-2 di 4 FormModal, mobile sheet (AC-003, EC-03)
- [ ] Empty verification — CTA per entity membuka modal (AC-004)
- [ ] Auth verification — card + pill + hero panel, login/register perilaku sama (AC-005)
- [ ] Permission verification — 401/403 matrix tak berubah (BR-002)
- [ ] States verification — loading/empty/error/success/validation/denied sesuai FASE 1
- [ ] Responsive verification — desktop/tablet/mobile 11 halaman
- [ ] Pixel-perfect verification — vs stories approved (BR-001); deviasi tercatat
- [ ] User Flow verification — Steps 1–11 + ALT/ERR ada AC dan ada E2E PASS
- [ ] Acceptance verification — AC-001..006 Given/When/Then PASS

## Assumptions

- FASE 1 approved dan tidak berubah selama FASE 2 berjalan; bila berubah, FASE 2 mengikuti revisi terbaru + catat.
- Token/kode FASE 1 (`naiveui-theme.ts`, refine in-place) adalah baseline — FASE 2 hanya wiring.
- Playwright browser mungkin missing (preseden Task 02) — fallback verifikasi manual + file-level, dicatat eksplisit.
- Asumsi terkecil lainnya dicatat di sini saat implementasi.

## Open Questions

- [ ] `LogLevelBadge` vs `BadgePill` di logs — unifikasi atau koeksistensi? (lihat EC-04; rekomendasi: unifikasi bila API props kompatibel)
- [ ] Stat dashboard diambil dari endpoint ringkasan existing atau agregasi client? Rekomendasi: pakai pola existing dashboard (minimal change).

## Related Knowledge

- `docs/PRD.md` (§14, §17, §21)
- `docs/architecture.md` (§ Routing, Table Browse Component)
- `docs/design-system.md` (token + Chrome Patterns)
- `docs/database.md` (referensi pasif — tanpa perubahan)
- `tasks/03-redesign-ui-design/README.md` — Design referensi (WAJIB)

## Change Log

### Initial

- Task specification created (FASE 2 — Implementation, depends on 03 redesign UI-design DONE+APPROVED).
