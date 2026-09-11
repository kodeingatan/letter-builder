# User Flow → Halaman/Component Mapping — Global Table UX (Task 28)

> Mapping mandatory ACUAN Task 29. Flow → UI dan Flow → API (existing, no new endpoint — `tasks/28:27` Out of Scope).

## Diagram (dari task 28)

```
[Entry] → {Table list} --(open)--> {Columns manager} --(create)--> {Column form} --(save)--> {Columns}
    │--(reorder)--> {Columns}   │--(delete)--> {Confirm}--> {Columns}
[Entry] → {Browse rows} --(create/edit)--> {Row form} --(save)--> {Browse}
    │--(import CSV)--> {Preview + result}   │--(export)--> {CSV}
    │--(relation pick)--> {Selector}--> {Row form}
```

## Steps

| Step | Actor | Aksi | Halaman / Component (design 28) | Hasil | Wireframe | Mockup | Prototype screen | AC |
|------|-------|------|----------------------------------|-------|-----------|--------|------------------|----|
| 1 | Designer | Buka list, ubah order/icon inline | `/dashboard/data/global-tables` → `PageShell` + `GlobalTableTable.vue` (order `NInputNumber` + icon `NSelect`) — debounce 300ms + saving indicator | Tersimpan + toast `Berhasil` (bukan toast-per-klik) | `table-list.png` | `table-list.png` | `prototype: table-list inline edit` | AC-D01 (partial) |
| 2 | Designer | Buka columns manager | Detail tabel → `GlobalTableColumnTab.vue` → DataTable kanonis (search 320px flex-1 + `NSelect 160px` + Refresh `Restart` + visibility + sortable `NDataTable` remote + pagination) | Kolom tampil (search/sort) + `NEmpty+CTA` bila kosong + `NAlert+retry` bila error | `columns.png` | `columns.png` | `prototype: columns manager` | AC-D01 |
| 3 | Designer | Tambah kolom select/relation/computed | `GlobalTableColumnFormModal.vue` → sections `v-if` per-type (text/select/relation `NCheckboxGroup`+`NRadioGroup` / computed `expression`+chips+`Uji`) + validasi inline `NFormItem` | Tersimpan + validasi inline tanpa runtime error | `column-form.png` (wire) | `column-form.png` | `prototype: column form` | AC-D02 |
| 4 | Designer | Reorder + hapus kolom | Manager `ChevronUp/Down` + persist + `NPopconfirm` Delete → 403/409 `NAlert` + daftar referensi | Berubah + konfirmasi hapus | `columns.png` (reorder) | `columns.png` | `prototype: reorder + delete confirm` | AC-D01 + AC-D02 |
| 5 | Operator | Browse rows, search/sort | `/dashboard/data/:table` → `PageShell` + `DataTable` browse (search/sort/import/export) + `TableRowDetailDrawer.vue` | Data tampil + `NSpin` loading + `NEmpty+CTA` + `NAlert+retry` | `browse.png` | `browse.png` | `prototype: browse` | — |
| 6 | Operator | Isi row (relation/computed/image) | `DynamicForm.vue` (semua tipe) + `RelationSelector.vue` — computed `readonly` live + upload `NButton` | Tersimpan, computed live (client preview, server authoritative `BR-001 Task29`) | `row-form.png` + `selector.png` | `row-form.png` + `selector.png` | `prototype: row form relation+computed` | AC-D03 |
| 7 | Operator | Import CSV / export | `TableDataImportModal.vue` — preview quote-aware 5 baris + result `NDataTable` error per baris + export `Download` | Hasil partial + error per baris + file CSV `GET /export?format=csv` | `import.png` | `import.png` | `prototype: import CSV partial` | AC-D03 |

## Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI (design 28) | Wireframe | Mockup | Prototype |
|----|----------|-------|---------------------------|-----------|--------|-----------|
| ALT-01 | Tabel kosong kolom (Manager → Empty) | Empty → `NEmpty description="Belum ada kolom"` + CTA `+ Buat Kolom Pertama` | `columns.png` (empty) | `empty.png` | `prototype: ALT empty` toggle |
| ALT-02 | Lookup relation kosong (Selector → Empty) | Empty → `NEmpty description="Tidak ada data. Buat dulu di tabel target."` + panduan link `Buat data target` | `selector.png` (empty) | `selector.png` empty | `prototype: ALT lookup empty` |
| ERR-01 | Nama kolom duplikat / ekspresi invalid (Form → Inline) | Inline → `NFormItem feedback` `Nama sudah dipakai` / `Ekspresi tidak valid` — `v-if` mount, bukan `v-show` bocor | `column-form.png` (validation) | `validation.png` | `prototype: ERR-01 inject 409/422` |
| ERR-02 | Hapus kolom dipakai (Confirm → 409) | Confirm `NPopconfirm` → 409 → `NAlert type=error` `Gagal hapus — dipakai di ${refs.join}` + daftar referensi | `columns.png` (409) | `error.png` | `prototype: ERR-02 409` |
| ERR-03 | CSV gagal partial (Import → Result) | Result → `NAlert type=warning` `Partial: 8 imported, 2 failed` + `NDataTable` `rows: {row, reason}` per baris | `import.png` (partial) | `import.png` partial | `prototype: ERR-03 CSV partial` |

## Flow → UI Mapping (untuk Task 29 — pixel-perfect)

| Flow Step | Halaman (dari UI 28) | Component (rencana Task 29) | State | File implement Task29 |
|-----------|----------------------|------------------------------|-------|------------------------|
| Step 1 | `/dashboard/data/global-tables` | `GlobalTableTable.vue` + `DataTable.vue` kanonis + `PageShell.vue` | saving indicator `NSpin` kecil, success `useMessage`, error `NAlert+retry`, validation inline, 403 pola 26 | `app/components/features/global-tables/GlobalTableTable.vue` |
| Step 2–4 | Detail tabel → Columns manager | `GlobalTableColumnTab.vue` (migrasi raw table → `DataTable`) + `GlobalTableColumnFormModal.vue` (sections `v-if` + `NRadioGroup`+`NCheckboxGroup`+`NInputNumber`+`optionRules`) | loading `NSpin`, empty `NEmpty+CTA`, error `NAlert+retry`, validation `NFormItem`, delete `NPopconfirm`, reorder `ChevronUp/Down` | `features/global-table-columns/` |
| Step 5 | `/dashboard/data/:table` | `app/pages/dashboard/data/[tableName].vue` + `DataTable.vue` browse + `TableRowDetailDrawer.vue` | loading/empty/error/success/403 kanonis Task27 | `pages/dashboard/data/[tableName].vue` |
| Step 6 | Row form (create/edit) | `TableRowFormModal.vue` + `DynamicForm.vue` (all types + computed live + upload `NButton`) + `RelationSelector.vue` (search+`NEmpty`+`NAlert+retry`+`hasMore` fix) | validation `NFormItem`, empty `NEmpty`, error `NAlert`, computed `readonly` live value | `features/table-data/DynamicForm.vue`, `RelationSelector.vue` |
| Step 7 | Import/Export | `TableDataImportModal.vue` (quote-aware preview 5 rows + result per baris) + export `NButton Download` | preview, partial `NAlert warning`, error per baris `NDataTable`, success toast | `features/table-data/TableDataImportModal.vue` |

## Flow → API Mapping (existing, no new endpoint)

| Flow Step | HTTP | Server Route | Validasi | Catatan |
|-----------|------|--------------|----------|---------|
| Step 1 | PUT | `/api/global-tables/:id/menu` | `MenuUpdateSchema` (`menuOrder: number`, `menuIcon: string` allowlist) | Designer-gated, order/icon inline debounce |
| Step 2–4 | GET/POST/PUT/DELETE | `/api/global-tables/:id/columns`, `/:id/columns/:colId`, `/:id/columns/reorder` | `ColumnDTO` discriminated union `type` + `name` snake_case + `options` JSON + `expression` + `relation*` — 422/409 preserved | CRUD + reorder explicit, 409 hapus dipakai, `min 1 column` invariant |
| Step 5 | GET | `GET /api/data/:tableName?page&search&searchField&sortBy&sortOrder` | `QuerySchema` (`NOT_SEARCHABLE`/`NOT_ORDERABLE` 422) + JSON filter `values` | Browse kanonis DataTable remote |
| Step 6 | POST/PUT/DELETE/GET | `/api/data/:tableName` + `/:rowId` + `/:id/rows/lookup` (RelationSelector) | `dynamic-schema` + `recomputeRow` computed server authoritative, `relationTableId` | Relation pagination `limit 20` + `hasMore` fix client, hasMore not server |
| Step 7 | POST/GET | `/api/data/:tableName/import` (multipart CSV) + `/export?format=csv` | CSV `neutralizeFormula` `csv-safety.ts:7`, partial `summary: {imported, failed, errors: {row, reason}[]}` | Preview client quote-aware mirrors server `table-data.service.ts:353` |

## Invariants untuk Prototype QA (Task 29 handoff)

- BR-002 Task28: semua aksi destruktif `NPopconfirm` (tidak ada delete langsung).
- BR-001 Task29 (design honori): computed `hidden` tetap hidden, `readonly` live preview client hanya presentasi, server tetap authoritative `recomputeRow` ignore client.
- BR-003 Task29: 422/409 existing dipertahankan (tidak dilonggarkan UI).
- AC-D01: DataTable + reorder eksplisit, tanpa drag palsu, responsif ≥1024/768/<768.
- AC-D02: Form tanpa runtime error (`optionRules` declared, `NRadioGroup`, `v-if` mount).
- AC-D03: Selector empty/error jelas + computed live + upload button.

