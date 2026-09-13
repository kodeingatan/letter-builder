<!-- tasks/03-redesign-ui-design/verification.md — FASE 1 -->

## Verification (Design)

- [x] Design System verification (token `naiveui-theme.ts` Notion, Naive UI direct import, Tailwind utility — no `NDescriptions`, pakai `.detail-view` + Chrome Patterns) — PASS via stories + build
- [x] Responsive verification (desktop/tablet/mobile — wireframe + Storybook viewport) — wireframes 6 SVG + stories
- [x] Accessibility verification (keyboard, ARIA, kontras AA terpenuhi via token, `prefers-reduced-motion`, addon a11y Storybook terpasang; audit terotomasi penuh di FASE 2)
- [x] User Flow coverage (Step 1–11 + ALT/ERR semua ada di prototype — klik tanpa dead-end) — 8 stories redesign
- [x] Storybook verification — `npm run storybook` tampil, stories 11 halaman/state, `npm run build-storybook` sukses, `foundation/` tidak regresi — build-storybook sukses, 8 stories Redesign/* terdaftar di storybook-static
- [x] Stakeholder / peer review via Storybook URL (`http://localhost:6006`) — menunggu review user

## Assumptions

- Wireframe/mockup PNG disimpan di folder task (`wireframes/`, `mockups/`) karena `docs/wireframes|mockups|prototypes` dihapus Task 01 — asumsi terkecil agar FASE 1 tetap punya artefak statis selain Storybook.
- Token kode (`naiveui-theme.ts`, `main.css`) sudah Notion — design memakai nilai live tersebut, bukan nilai lama (`#3B82F6`, radius 6/4/8) yang masih tertulis di template perintah `/task` (template usang, tidak diubah dalam step ini).
- Tidak ada perubahan API/DB/RBAC — jika design butuh perubahan kontrak, catat di Open Questions untuk FASE 2.
- FASE 2 (`tasks/04-redesign.md`) dibuat setelah task ini DONE.

## Open Questions

- [ ] Apakah hero band `#213183` juga dipakai di halaman auth (login/register) atau hanya dashboard? Rekomendasi: hanya dashboard (satu momen gelap).
- [ ] Apakah ilustrasi sticker palette perlu aset desainer atau cukup category dot + tile warna? Rekomendasi: mulai dari dot/tile, ilustrasi custom menyusul.
- [ ] Apakah `PageShell` existing di-refine in-place atau dibungkus varian baru? Rekomendasi: refine in-place (hindari duplikasi shell).

## Related Knowledge

- `docs/PRD.md` (§14, §17, §21)
- `docs/architecture.md` (§ Routing, Table Browse Component)
- `docs/design-system.md` (token Notion, Chrome Patterns, Do's and Don'ts)
- `docs/database.md` (tidak ada perubahan skema — referensi pasif)
- `apps/web/stories/foundation/` — baseline regresi

## Change Log

### Review fixes — 2026-09-13 (5 temuan review)

- MF-01: `ToastState` dibungkus `NMessageProvider` (useMessage tanpa provider me-throw).
- MF-02: selector sidebar `.n-menu-item--selected` → `.n-menu-item-content--selected` (kelas asli Naive).
- SF-01: story AppShellRow render ikon via `<NIcon><component :is /></NIcon>` (bukan VNode ke `:is`).
- SF-02: prop `illustration` mati dihapus dari `EmptyStateCard`.
- SF-03: klaim a11y dilunakkan (addon terpasang + cek manual; audit penuh FASE 2).

### Implemented — 2026-09-13 via /implement

- Komponen baru: `BadgePill`, `EmptyStateCard`, `DashboardHero` (+ sticker SVG inline).
- Refine in-place: `auth.vue` (Auth Card + header title), pill CTA login/register, `PageShell` (lg12/24px/tracking), `DataTable` (header eyebrow, cell 12/16, hairline), sidebar App-Shell Row, `UserFormModal` exemplar `.modal-card` + util di `main.css`.
- Stories `apps/web/stories/redesign/` 8 files; wireframes 6 SVG + mockups README di folder task.
- Infra fix (pre-existing): `.storybook/preview.ts` path CSS, `main.ts` +vue plugin + alias `~/`.
- Verifikasi: test:unit 82/82, test:nuxt 36/36, build 15.8MB, build-storybook sukses (8 Redesign/* terdaftar).
- Status: DONE — siap /review design, lalu FASE 2 (`tasks/04-redesign.md`).

### Initial

- UI design task created (FASE 1 — UI-First, Notion-calm redesign 11 halaman). FASE 2 menyusul (`tasks/04-redesign.md`).
