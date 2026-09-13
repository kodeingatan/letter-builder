## Verification

### Automated

- [x] Typecheck 0; `test:unit` UT-01/02/03 PASS (10+8+8; full suite 225/225+); `test:nuxt` NT-01/02 PASS (10/10; full 67/67).
- [x] E2E-01/02 PASS (component→template→preview→wizard→PDF gabungan 6/7 + 1 skip Chrome; 409/version/401/403).
- [x] `storybook` + `build-storybook` sukses (TemplateAdmin/Component, Builder, Wizard).
- [x] `build` sukses (Tiptap hanya klien; Puppeteer tetap server-only — `routes/api/*documents*` + `preview-pdf` di server bundle).

### Manual / QA Checklist

- [x] Right-click → 3 view binding tampil benar (AC-001, NT-02 + E2E binding nodes tersimpan).
- [x] Loop pilih semua mengisi repeater (AC-003, E2E master-list + UT registry-in-repeater).
- [x] PDF SK rapi: kop/header/footer, page-break (AC-004, mock unit + ERR-03 live; binary live menunggu Chrome).
- [x] Wizard 2 step → PDF gabungan + menu baru (AC-005, E2E + UI menu per surat).
- [x] Hapus terproteksi; run lama tak berubah setelah publish (AC-006, E2E + UT snapshot).
- [x] 401/403 + viewport tablet/mobile + a11y toolbar (AC-007, E2E + toolbar role/aria + stories).

## Assumptions

- Tiptap v2 stabil di Nuxt 4 SSR (bungkus `<ClientOnly>` bila perlu; tidak ubah arsitektur SSR).
- Nomor surat manual + saran format cukup; auto-numbering kompleks ditunda.
- UI-First digabung inline atas permintaan 3 folder; Storybook tetap gate DONE.
- [decided by /auto-all-tasks 2026-09-13] Versioning = snapshot (kolom `version` + `template_version` + `rendered_html` di run; tanpa tabel versions terpisah). Open Question terjawab: snapshot.
- [decided by /auto-all-tasks 2026-09-13] System source: `office.*` dari Settings + `current_date` otomatis; `signer.*` wajib dari data run (field/value) — bukan tabel Master baru.
- [decided by /auto-all-tasks 2026-09-13] Cap `tiptap_json/schema_json` 1MB (Zod). Cukup untuk surat; Open Question terjawab.
- [decided by /auto-all-tasks 2026-09-13] Sidebar statis grup Persuratan (Component/Template/Administrasi/Dokumen); menu per surat = halaman `/dashboard/documents` (kartu per administrasi) — tanpa fetch definisi di layout (konsisten Task 06).
- [decided by /auto-all-tasks 2026-09-13] Dev DB di-reset (`rm db.sqlite`, prosedur AGENTS) karena tabel basi pre-Task-01 (`documents`, `administrations`, `admin_steps` skema lama) clash dengan entitas baru; prod dicover migrasi additive.
- [decided by /auto-all-tasks 2026-09-13] Tambahan di luar 10 endpoint spec: `POST /api/doc-templates/:id/preview` (HTML builder, cermin documents/preview), `GET /api/administrations/slug/:slug` (menu per surat), `POST /api/documents/:id/pdf` (retry ERR-03), `DELETE /api/documents/:id` = cancel (riwayat awet).
- [decided by /auto-all-tasks 2026-09-13] Repeater `source` dihitung sebagai requirement (bukan hanya `{{}}`), sehingga mapping `employees → master-list` tervalidasi DR-002.
- [decided by /auto-all-tasks 2026-09-13] Semua output API dinormalisasi snake_case sesuai `shared/types` (temuan review: camelCase entity bocor ke klien).
- [decided by /auto-all-tasks 2026-09-13] `permission-matrix.ts` stub TIDAK diubah (di-pin test); 8 permission persuratan di-seed + backfill Super Admin. Tiptap 3.31 (v2-line) + ClientOnly; Puppeteer tetap server-only. PDF binary live menunggu Chrome (precedent Task 05).

## Open Questions

- Perlu `component_versions/template_versions` terpisah atau cukup kolom `version` + snapshot di run?
- System source `office.logo/signer` dari Settings/User existing atau tabel Master baru?
- Batas ukuran `tiptap_json/schema_json` (mis. 5MB) cukup?

## Related Knowledge

- `tasks/05-document-engine/*` (renderer/PDF/kunci versi), `tasks/06-master-data-ddl/*` (schema/looping source).
- `docs/design-system.md` (Notion-calm, `#0075de`, Inter), `app/utils/naiveui-theme.ts`, `.ua/` bila ada.

### Ringkasan implementasi (2026-09-13, tanpa ubah `docs/` permanen)

- 5 entitas (`doc_components`, `doc_templates`, `administrations`, `admin_steps`, `documents`) + migrasi `1789310000000`; registrasi (16 schemas).
- Converter Tiptap↔DocNode (binding 3 view, repeater/condition container, tabel flatten) + scan requirements (source ikut) + resolve 5 mapping kind.
- Services: components (BR-003, 409 ref-check, registry), templates (publish/version, form-schema, preview/preview-pdf), administrations (steps, DR-002, executeRun gabungan + pagebreak + kunci versi), documents (snapshot, cancel, pdf download/regenerate).
- API 15 route files (10 spec + 4 tambahan + slug lookup). Seeder: 8 permission + demo Kop/Daftar/SK/Administrasi.
- Frontend: stores persuratan + builder; 8 komponen (Tiptap editor ClientOnly + popup + canvas/panel/repeater/condition + wizard + drawer); 6 halaman; grup sidebar Persuratan; stories template-admin ×3 + wireframes SVG.

## Change Log

### Initial

- Task specification created (Template & Administrasi — 07 dari roadmap 05→06→07).
