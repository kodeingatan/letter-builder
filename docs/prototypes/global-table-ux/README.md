# Prototype — Global Table UX (Interaktif)

> Task 28 — Global Table UX UI Design (FASE 1) · Status: **DONE** · 2026-09-11 · Tanpa backend · Kontrol QA 7 Steps + ALT/ERR

## Isi

| File | Deskripsi | Step / AC |
|------|-----------|-----------|
| `index.html` | **Prototype interaktif** — single-page tabs (Table List · Columns Manager · Browse · Row Form · Import) + modal Column Form + drawer Browse + RelationSelector mock + Import quote-aware | Steps 1-7 + AC-D01..03 |
| `_prototype-spec.md` | Interaction spec — trigger/debounce/handler per Step + validasi QA checklist | — |

## Cara Pakai

1. Buka `index.html` di browser (tanpa `npm`, tanpa backend). Top bar `Prototype · Global Table UX`.
2. Gunakan **tabs** di halaman: `1. Table List` → `2–4. Columns Manager` → `5. Browse` → `6. Row Form` → `7. Import/Export` — atau klik item sidebar `▦ Global Tables` / `Pegawai — Columns` / `Pegawai — Browse`.
3. Gunakan **Kontrol QA** sticky di bawah (kiri ke kanan):
   - `Step1 Inline` → Table List order inline debounce 300ms + saving indicator
   - `Step2 Search` → Columns search `nip` 300ms filter
   - `Step3 Form` → Buka Column Form type `select-table-relation` (NCheckboxGroup + NRadioGroup)
   - `Reorder` → `ChevronUp` Gaji Total naik 1 posisi + live region
   - `Delete +409` → NPopconfirm → Hapus `nip` → 409 + daftar referensi
   - `ALT-01 Empty` → Columns Empty `NEmpty + Buat Kolom Pertama`
   - `ALT-02 Lookup Empty` → Row Form RelationSelector `NEmpty + Buat Data Jabatan`
   - `ERR Lookup` → `NAlert error + Coba lagi`
   - `Import quoted` → Muat contoh `Budi, S.T.` + `Jl. Merdeka No. 10, Jakarta` → preview benar + `Partial` per baris
   - `403 Tunggal` → floating global `data-testid=access-denied` length 1
   - `Collapse 220↔72` → sider collapse + live region

## Validasi QA (AC)

- [ ] AC-D01: Columns `DataTable` + reorder eksplisit `▲/▼` tanpa drag palsu, responsif 1280→768→375
- [ ] AC-D02: Form `optionRules` computed + `NRadioGroup` + `NCheckboxGroup` + `NInputNumber` + `v-if` + `NPopconfirm` delete — tidak runtime error, inline 409/422
- [ ] AC-D03: Selector `NEmpty` + `NAlert+retry` + `hasMore` benar + DynamicForm `NButton Upload` + computed live `● live` + `POST /api/expressions/evaluate` mock
- [ ] Semua ALT/ERR injectable + 403 tunggal (1 instance) + live region reorder/import
- [ ] Keyboard: Tab urutan toolbar → DataTable header sortable → reorder ▲/▼ → actions 👁/✎/🗑 → relation NSelect → import NUpload

## Token

- Primary #3B82F6 / hover #2563EB, radius 6/4/8, Inter + JetBrains Mono, spacing Tailwind, icons Carbon via NIcon (ChevronUp/Down, Eye, Edit, TrashCan, Search, Restart, Upload), motion Fast150/Normal250/Slow350 + prefers-reduced-motion 0.01ms

## Handoff ke Task 29

Prototype adalah acuan pixel-perfect implementasi — jangan desain ulang. Deviasi catat di `tasks/29: ## UI > Penyesuaian dari design`. Semua 7 steps harus ada E2E `tasks/29:Test Plan` mengacu prototype ini.

## Link terkait

- Wireframes: `docs/wireframes/global-table-ux/`
- Mockups hi-fi: `docs/mockups/global-table-ux/`
- Foundation prototype: `docs/prototypes/foundation/index.html`
