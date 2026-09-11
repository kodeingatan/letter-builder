# Prototype Interaction Spec — Global Table UX (Task 28)

> Merujuk `docs/wireframes/global-table-ux/_user-flow-map.md` + `docs/wireframes/global-table-ux/index.html` + `docs/mockups/global-table-ux/index.html` + prototype `docs/prototypes/global-table-ux/index.html`.

## Keputusan Kunci (dari _audit-matrix.md)

- **Reorder**: kontrol eksplisit `ChevronUp/Down` per baris (bukan drag palsu `DragHandle` + bukan DnD sungguhan) — persist per-klik debounce 300ms + live region `Dipindahkan ke posisi ${pos}`. Alasan: a11y, konsisten `GlobalTableTable.vue:58-68`, hindari kompleksitas.
- **CSV preview limit**: 5 baris preview + 20 baris error table di modal; file >5MB atau >5000 baris → 422 `File terlalu besar` / `Maks 5000 baris`. Alasan: performa, mirror server `table-data.service:210` + `_token-diff` limit.
- **Richtext placeholder**: `NInput textarea 4 rows` + note `Editor penuh Task 35` — tidak ada richtext penuh di 28.
- **Expression**: hanya existing `{{field}}` + `++` concat + aritmetika; tombol `Uji Ekspresi` → `POST /api/expressions/validate` mock `200 OK` / `422 Ekspresi tidak valid`. Fungsi lanjutan Task 37.
- **403 tunggal**: tetap pola 26 — floating global Teleport top-right `data-testid="access-denied"` (tidak per halaman).

## Interaction per User Flow (7 Steps)

| Step | Trigger | Debounce / Duration | Handler (prototype JS) | Hasil | Prototype kontrol |
|------|---------|---------------------|------------------------|-------|------------------|
| 1 Table list order/icon | `NInputNumber` / `NSelect` `@update:value` inline di `GlobalTableTable.vue` | **300ms debounce** + `NSpin small` saving indicator | `PUT /api/global-tables/:id/menu` mock debounce → `showToast('Tersimpan')` + `liveRegion('Disimpan order 5')` | Tersimpan + toast `Berhasil` (bukan toast-per-klik) | Tab Table List → ubah Order 5→3 → saving → toast |
| 2 Columns manager open | Breadcrumb `Global Tables → Pegawai → Columns` | — | `store.fetchAll(tableId)` → `DataTable` columns tampil | Kolom tampil (search/sort) | Tab Columns Manager → tabel muncul |
| 2 Search/filter/sort | Toolbar `NInput` 320px + `NSelect 160px` | **300ms debounce** search, click header sort ASC→DESC→none | `GET /api/global-tables/:id/columns?search&searchField&sortBy` mock filter | Hasil terfilter, `Menampilkan 1–8` update | Ketik `nip` di Search — filtered setelah 300ms |
| 2 Refresh | `NButton Restart` `aria-label="Segarkan data"` | — | `emit('refresh')` → refetch dengan query existing (search/sort/page dipertahankan) — tanpa reset | Data refetch, toast `Data dimuat ulang.` | Tombol Segarkan — loading overlay 0.6s lalu toast, query tetap |
| 3 Create select | `+ Buat Kolom` → Column Form `type=select` | — | `NModal` `select` → Options JSON `[{"label":"A","value":"a"}]` + `optionRules` computed validasi — `v-if` mount | Tersimpan tanpa runtime error (fix `optionRules` undefined 304) | Tab Columns → Buat Kolom → Type select → isi Options JSON valid → Simpan |
| 3 Create relation | Type `select-table-relation` | — | `Relation Table` `NSelect` → `NCheckboxGroup` displayColumns + `NRadioGroup` restrict/detach — `v-if` | Form valid, inline required `At least one display column` bila kosong | Type relation → NCheckboxGroup visible (bukan `NCheckbox` loop 329) + NRadioGroup (bukan NRadio 351) |
| 3 Create computed | Type `readonly-computed` | — | Expression `{{harga}} * {{jumlah}}` + chips `NTag closable` + `Uji Ekspresi` → mock `POST /api/expressions/validate` | `NAlert success` `Hasil: 50000` atau `422 Ekspresi tidak valid` inline | Type computed → chips muncul + Uji → success |
| 4 Reorder | `ChevronUp/Down` `aria-label="Pindahkan ke atas/bawah"` | debounce persist 300ms | Swap `columns` array → `store.reorder(tableId, orderedIds)` mock → `liveRegion('Dipindahkan ke posisi 2')` + toast | Berubah + top disabled ▲ / bottom disabled ▼ | Kolom Gaji Total → klik ▲ → posisi naik → live region |
| 4 Delete confirm | `TrashCan` → `NPopconfirm` `Hapus kolom nip?` | slide 150ms | `onPositiveClick` → `DELETE /:id/columns/:colId` mock → 409 bila dipakai (refs) `NAlert error` + daftar referensi, else success + `store.remove` | Berubah + konfirmasi (bukan direct `handleDelete 60`) | Klik 🗑 → NPopconfirm → Hapus → ERR-02 409 atau success |
| 5 Browse | `GET /api/data/pegawai?page&search&searchField` | 300ms debounce | `DataTable` browse rows tampil + `PageShell` `Pegawai — Browse` | Data tampil | Tab Browse → tabel pegawai 42 rows |
| 6 Row form relation | `RelationSelector` `NSelect remote` search | 300ms debounce remote, scroll pagination `index≥length-5` | `fetchOptions(search, floor(length/limit)+1)` → `hasMore = options.length < total` correct (fix `offset+length 40`) | Selector hasil 20/42, hasMore benar, NEmpty/NAlert bila kosong/gagal | Browse → Tambah Baris → Relation field → ketik `Staf` → 1 hasil, scroll → load more |
| 6 Relation empty/error | Search `xyz` / offline mock error | — | `NEmpty description="Tidak ada data. Buat dulu di tabel target."` + panduan link; `NAlert error + Coba lagi` retry keep selected | ALT-02 / EC benar | Kontrol `Empty lookup` & `Error lookup` |
| 6 Computed live | `harga`/`jumlah` `NInputNumber` → `readonly-computed` `gaji_total` | **200ms debounce** client recompute | watch `formValue` → `POST /api/expressions/evaluate` mock → `liveComputed = harga * jumlah` → `NInput disabled` value live | Nilai `readonly` ter-update live (bukan placeholder kosong `Computed on save` 171) + chips `harga/jumlah` | Row form → ubah Harga 5jt → Gaji Total live 10.4jt |
| 6 Image upload | `NUpload` `Upload image` button | — | `custom-request` `handleImageUpload` → `NButton primary ghost` + `NImage preview 64` — no `span text-blue-500` | Upload berupa button focusable + preview | Row form → Image field → Upload image (button) → preview |
| 7 Import CSV preview | Select file `pegawai.csv` | onChange `file.text()` quote-aware parser | `parsePreview(text)` state machine `inQuote` + `""` escape — 5 rows max | Preview benar untuk `"Budi, S.T.","Jl. Merdeka No. 10, Jakarta"` (1 kolom, bukan split) | Tab Import → Select CSV quoted → preview 2 rows correct |
| 7 Import CSV partial | `Import` → `POST /api/data/:table/import` multipart | — | Mock `summary {imported:8, failed:2, errors:[{row:3,reason:'NIP duplikat'}]}` → `NAlert warning` + `NDataTable max-height 240` error per baris | Hasil partial + error per baris ERR-03 | Kontrol `Import quoted` → `Import` → Partial warning + error table |
| 7 Export | `Export CSV` `NButton Download` | — | `GET /api/data/:table/export?format=csv` mock Blob download | File CSV terunduh | Browse → Export |

## Transisi / Animasi (Token)

| Token | Duration | Easing | Usage | Prototype |
|-------|----------|--------|-------|-----------|
| Fast | 150ms | ease-out | hover, button scale, menu hover, sort arrow | `.btn:hover` scale 1.02, menu hover bg |
| Normal | 250ms | ease | page, card reveal, NAlert slideDown | NAlert 250ms, page fadeInUp |
| Slow | 350ms | ease-in-out | modal/drawer, toast slideIn | NModal 350ms, toast slideIn 300ms |
| Reduced | 0.01ms | — | `@media (prefers-reduced-motion: reduce)` | media query di prototype |

## Validasi alur (QA Checklist di Prototype — AC-D01..03)

- [ ] Step1: ubah Order 5→3 → debounce 300ms → indicator `◌ Menyimpan…` → toast `Tersimpan` (acuan `GlobalTableTable.vue:58`).
- [ ] Step2: ketik `nip` di Columns search → 300ms → filtered 1 row, `Menampilkan 1–1 dari 1`. Segarkan → tetap filtered `nip` (tidak reset).
- [ ] Step3: ganti Type `text` → `select` → Options JSON valid → tidak RuntimeError `optionRules` (fix 304). `relation` → `NCheckboxGroup` + `NRadioGroup` muncul (fix 329/351). `v-if` sections — relation tidak validasi saat type=text.
- [ ] Step4: Reorder Gaji Total `▲` → posisi 1 → live region `Dipindahkan ke posisi 1` + ▲ disabled first. Delete `nip` → `NPopconfirm` muncul → Hapus → 409 `Gagal hapus — dipakai di Template SK` → `NAlert error` + refs (AC-D02).
- [ ] Step5: Browse `Cari pegawai` → `Budi` → 1 result + pagination `Menampilkan 1–1`.
- [ ] Step6: Row form relation search `Staf` → 1 result, scroll → load more 20→40 via `options.length < total` (fix 40). Empty search `xyz` → `NEmpty + Buat Data Jabatan`. Error lookup → `NAlert + Coba lagi` keep selected. Ubah Harga 5.000.000 → Gaji Total live `Rp 10.000.000`. Image `Upload image` adalah `NButton primary ghost` + `h(NIcon)` + preview `NImage` 64 (fix span).
- [ ] Step7: Import `pegawai.csv` quoted → preview `Budi, S.T.` 1 kolom `alamat` = `Jl. Merdeka No. 10, Jakarta` (bukan split). `Import` → Partial `8 imported, 2 failed` + `NDataTable` error per baris (ERR-03).
- [ ] States: Empty ALT-01 → `NEmpty + Buat Kolom Pertama`; Error → `NAlert + Coba lagi`; 403 → `data-testid=access-denied` length 1 floating global (AC-D03).
- [ ] A11y: Tab urutan toolbar → DataTable header sortable → Reorder ▲/▼ → Aksi 👁/✎/🗑 → modal `NCheckboxGroup` → relation `NSelect` → import `NUpload`; icon-only `aria-label`, dekorasi `aria-hidden`, live region `aria-live="polite"` untuk reorder/import; `prefers-reduced-motion` reduce 0.01ms.
- [ ] Responsive: resize 1280→768→375 — columns hidden via ⚙ toggle, toolbar wrap search full-row, table scroll-x, drawer 480→100vw, modal `min(640,90vw)` — semua tanpa overflow.

## Responsive

| Breakpoint | PageShell | DataTable | Drawer / Modal | Form |
|------------|-----------|-----------|----------------|------|
| Desktop ≥1024 | header row | row: search flex-1 320 + select 160 + buttons | drawer 480 right, modal `max-w-2xl` centered | grid 2 cols |
| Tablet 768–1023 | header row | wrap: search full-row, field+buttons baris 2, columns hidden via visibility | drawer 480 overlay | grid 2 |
| Mobile <768 | `flex-direction:column` <768 | stack: search full-width, field+buttons row 2, table scroll-x `min-width:640` | drawer `100vw` full, modal `90vw` | full-width, stack |

## Handoff untuk Task 29

- **Columns manager** → `GlobalTableColumnTab.vue` migrasi raw→`DataTable` + `ChevronUp/Down` + `NPopconfirm` + `purple→warning` + icons distinct — verify `grep DragHandle` 0, `grep purple` 0.
- **Column form** → `GlobalTableColumnFormModal.vue` `optionRules` computed + `NRadioGroup` + `NCheckboxGroup` + `NInputNumber` + `v-if` per section + chips + Uji — verify `grep -rn "v-show" GlobalTableColumnFormModal.vue` 0, `grep "optionRules" — has computed` ok.
- **RelationSelector** → `RelationSelector.vue` `options.length < total` + `NEmpty`+`NAlert+retry` — verify `grep "offset.value + options"` 0.
- **DynamicForm** → `DynamicForm.vue` `NButton Upload` + live computed `readonly` — verify `grep "text-blue"` 0.
- **Import** → `TableDataImportModal.vue` quote-aware parser + `min(640,90vw)` + partial error per baris — verify `grep "line\.split"` 0.
- **Drawer** → `TableRowDetailDrawer.vue` `NPopconfirm` + `NAlert error+retry` — verify `catch{row=null}` has retry.

