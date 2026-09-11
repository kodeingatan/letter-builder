# Mockups — Global Table UX (Hi-Fi)

> Task 28 — Global Table UX UI Design (FASE 1) · Status: **TODO → DONE by /implement** · 2026-09-11

## Isi

| File | Deskripsi | AC / Step |
|------|-----------|-----------|
| `index.html` | **Master mockup** — semua 8 sections token-exact (table-list, columns DataTable+reorder+NPopconfirm, column form per-type hi-fi, browse+drawer, RelationSelector states, DynamicForm types+live+upload, import quoted+partial) | AC-D01..03, Steps 1-7 |
| `table-list.png` | Table list hi-fi — PageShell + order/icon inline + saving indicator | Step 1 |
| `columns.png` | Columns manager hi-fi — DataTable kanonis + ChevronUp/Down + NPopconfirm + icons distinct Eye/Edit/TrashCan + warning tag | Steps 2,4 + AC-D01/02 |
| `column-form.png` | Column form hi-fi — NRadioGroup + NCheckboxGroup + NInputNumber + optionRules + chips + Uji | Step 3 + AC-D02 + ERR-01 |
| `selector.png` | RelationSelector hi-fi — search + hasMore benar 20/42 + NEmpty+CTA + NAlert+retry + multiple NTag | Step 6 + AC-D03 |
| `row-form.png` | DynamicForm hi-fi — all types + computed live `● live` + NButton Upload `primary ghost` + NImage preview | Step 6 + AC-D03 |
| `import.png` | Import modal hi-fi — preset card min(640,90vw) + quoted 5 rows + partial error per baris | Step 7 + ERR-03 |
| `browse.png` | Browse rows hi-fi — PageShell + DataTable + drawer .detail-view | Step 5 |
| `loading.png` | State loading — NSpin overlay | States |
| `empty.png` | State empty — NEmpty `Belum ada kolom` + CTA `+ Buat Kolom Pertama` + `Tidak ada data. Buat dulu di tabel target.` | ALT-01/02 |
| `error.png` | State error — NAlert `Gagal memuat kolom` + Coba lagi + retry tanpa reset | ERR-02 |
| `validation.png` | State validation — NFormItem inline snake_case + optionRules + displayColumns | ERR-01 |
| `success.png` | State success — NAlert success `Berhasil — Kolom disimpan.` + toast 3s | Success |
| `403.png` | 403 tunggal — floating global Teleport `data-testid=access-denied` | Permission |
| `_mockup-tokens.md` | Token audit hi-fi (Inter/JetBrains Mono, radius 6/4/8, spacing Tailwind, icons h(NIcon)) | Design Tokens Check |
| `_token-diff.md` | Diff off-token → token (purple→warning, #666→#94a3b8, text-blue-500→primary ghost, DragHandle→Chevron) | Token diff |

## Cara Lihat

- Buka `index.html` di browser (hi-fi token-exact, Naive-like styling, Inter + JetBrains Mono).
- PNG 1280×800 adalah ekspor siap-review (placeholder hi-fi). Untuk fidelity penuh buka `index.html`.
- Prototype interaktif (tanpa backend) di `docs/prototypes/global-table-ux/` — semua 7 steps klikable + kontrol QA.

## Token (hi-fi exact)

- Primary #3B82F6 / hover #2563EB / pressed #1D4ED8, radius 6/4/8, Inter 14px + mono 13px JetBrains Mono, spacing xs2…3xl, icon Carbon via h(NIcon) (ChevronUp/Down, View/Eye, Edit, TrashCan, Search, Restart, Upload), 0 off-token (`purple`→`warning`, `#666`→`#94a3b8`, `text-blue-500`→`primary` ghost), motion Fast150/Normal250/Slow350 + prefers-reduced-motion.

## Verifikasi

- [ ] `index.html` render token-exact tanpa error
- [ ] 12 PNG 1280×800 ada
- [ ] `_token-diff.md` 0 indigo/#666/purple/text-blue/DragHandle/v-show/hasMore naive
- [ ] AC-D01: columns DataTable + reorder eksplisit + responsive
- [ ] AC-D02: form NRadioGroup/NCheckboxGroup/NInputNumber + v-if + optionRules + NPopconfirm
- [ ] AC-D03: selector NEmpty/NAlert + DynamicForm upload NButton + computed live

## Handoff ke Task 29

Mockups menjadi acuan pixel-perfect Task 29 — jangan desain ulang. Deviasi harus dicatat di `tasks/29: ## UI > Penyesuaian dari design`. Prototype link di `docs/prototypes/global-table-ux/index.html`.
