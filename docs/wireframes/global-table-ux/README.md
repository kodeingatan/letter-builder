# Wireframes — Global Table UX (Low-Fi)

> Task 28 — Global Table UX UI Design (FASE 1) · Status: **TODO → DONE by /implement** · 2026-09-11

## Isi

| File | Deskripsi | AC / Step |
|------|-----------|-----------|
| `index.html` | **Master wireframe** — semua 10 sections dalam satu halaman (table-list, columns manager, column form per-type, browse, RelationSelector, DynamicForm, import modal, responsive D/T/M, states, flow overlay) — low-fi grayscale dashed | AC-D01..03, Steps 1-7 |
| `table-list.png` | Global Tables list — PageShell + order/icon inline debounce + saving indicator | Step 1 |
| `columns.png` | Columns manager — DataTable kanonis (320/160) + reorder ChevronUp/Down eksplisit + NPopconfirm + icons distinct + empty/409 | Steps 2,4 + ALT-01/ERR-02 |
| `browse.png` | Browse rows — PageShell + DataTable + Import/Export + drawer detail-view | Step 5 |
| `column-form.png` | Column form — modal v-if per-type + NRadioGroup/NCheckboxGroup/NInputNumber + chips + Uji | Step 3 + ERR-01 |
| `selector.png` | RelationSelector — NSelect remote + loading/empty (ALT-02)/error + multiple NTag | Step 6 + AC-D03 |
| `row-form.png` | DynamicForm — all types + computed live + upload NButton | Step 6 + AC-D03 |
| `import.png` | Import modal — quoted-CSV preview 5 rows + partial error per baris | Step 7 + ERR-03 |
| `desktop.png` | Desktop ≥1024 — shell penuh + modal standar | Responsive |
| `tablet.png` | Tablet 768–1023 — visibility toggle, toolbar wrap | Responsive |
| `mobile.png` | Mobile <768 — scroll-x terkendali / drawer full 100vw | Responsive |
| `states.png` | 6 states: loading NSpin, empty NEmpty+CTA, error NAlert+retry, success toast, validation inline, 403 tunggal | ALT/ERR |
| `_audit-matrix.md` | Audit matrix 17 GAP-GT `file:line` → keputusan design | Discovery |
| `_user-flow-map.md` | User Flow 7 steps → halaman/component/Flow→UI/API mapping | Discovery |
| `_wireframe-spec.md` | Anotasi ukuran & token per wireframe | — |

## Cara Lihat

- Buka `index.html` di browser (low-fi statis, tanpa JS). PNG 1280×800 adalah ekspor siap-review (placeholder).
- Mockups hi-fi token-exact di `docs/mockups/global-table-ux/` , prototype interaktif di `docs/prototypes/global-table-ux/`.

## Token (low-fi anotasi)

- Sidebar 220/72 (Task 27), search 320px flex-1, select 160px, heights 32px, radius 6/4/8, animation Fast 150/Normal 250/Slow 350, locale ID, 403 floating global tunggal.

## Verifikasi

- [ ] Semua PNG 1280×800 ada + `index.html` render tanpa error
- [ ] AC-D01: columns manager DataTable + reorder eksplisit (tanpa DragHandle palsu), responsive
- [ ] AC-D02: column form v-if + NRadioGroup + NCheckboxGroup + NInputNumber + optionRules + NPopconfirm
- [ ] AC-D03: RelationSelector NEmpty/NAlert+retry + DynamicForm upload NButton + computed live
- [ ] Responsive D/T/M + states + a11y (keyboard, ARIA, reduced-motion)

## Handoff ke Task 29

Wireframes menjadi acuan pixel-perfect Task 29: `GlobalTableColumnTab.vue` migrasi raw→DataTable, `GlobalTableColumnFormModal.vue` fix, `RelationSelector.vue` states+hasMore, `DynamicForm.vue` upload+live, `TableDataImportModal.vue` quote-aware, `TableRowDetailDrawer.vue` confirm+retry. Mockups di `docs/mockups/global-table-ux/`, prototype di `docs/prototypes/global-table-ux/`.
