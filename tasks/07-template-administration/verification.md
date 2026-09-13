## Verification

### Automated

- [ ] Typecheck 0; `test:unit` UT-01..03 PASS ≥80%; `test:nuxt` NT-01/02 PASS semua state.
- [ ] E2E-01/02 PASS (component→template→PDF→wizard→PDF gabungan; 409/version).
- [ ] `storybook` + `build-storybook` sukses (stories template-admin).
- [ ] `build` sukses (Tiptap hanya klien; Puppeteer tetap server-only).

### Manual / QA Checklist

- [ ] Right-click → 3 view binding tampil benar (AC-001).
- [ ] Loop pilih semua mengisi repeater (AC-003).
- [ ] PDF SK rapi: kop/header/footer, page-break (AC-004).
- [ ] Wizard 2 step → PDF gabungan + menu baru (AC-005).
- [ ] Hapus terproteksi; run lama tak berubah setelah publish (AC-006).
- [ ] 401/403 + viewport tablet/mobile + a11y toolbar (AC-007).

## Assumptions

- Tiptap v2 stabil di Nuxt 4 SSR (bungkus `<ClientOnly>` bila perlu; tidak ubah arsitektur SSR).
- Nomor surat manual + saran format cukup; auto-numbering kompleks ditunda.
- UI-First digabung inline atas permintaan 3 folder; Storybook tetap gate DONE.

## Open Questions

- Perlu `component_versions/template_versions` terpisah atau cukup kolom `version` + snapshot di run?
- System source `office.logo/signer` dari Settings/User existing atau tabel Master baru?
- Batas ukuran `tiptap_json/schema_json` (mis. 5MB) cukup?

## Related Knowledge

- `tasks/05-document-engine/*` (renderer/PDF/kunci versi), `tasks/06-master-data-ddl/*` (schema/looping source).
- `docs/design-system.md` (Notion-calm, `#0075de`, Inter), `app/utils/naiveui-theme.ts`, `.ua/` bila ada.

## Change Log

### Initial

- Task specification created (Template & Administrasi — 07 dari roadmap 05→06→07).
