# Wireframe Spec — Anotasi Ukuran & Token — Global Table UX (Task 28)

> Low-fi anotasi — hi-fi exact di `docs/mockups/global-table-ux/_mockup-tokens.md`. Fondasi kanonis Task 27 tetap: `PageShell`, `DataTable` kanonis, token `naiveui-theme.ts`.

## PageShell (kanonis — dari Task 27)

- `PageShell.vue` `app/components/layout/` — props `title: string`, `breadcrumbs: {label, href?}[]`, `description?: string`, slots `actions` + `default`.
- Header: title 20px Semibold #1F2937, subtitle 12px #6B7280, breadcrumb 13px #6B7280, active #1F2937 semibold.
- Padding: head 16px 20px, body 20px, border 1px #E5E7EB radius 8, `flex-wrap` column <768.
- Breadcrumb leaf non-link (`aria-current="page"`), others `<a href>` + `preventDefault` + `router.push` (native right-click preserved).

## DataTable Kanonis (global — dipakai Columns manager + Browse + Table list)

- Toolbar: `display:flex; gap:12px; flex-wrap:wrap`.
- Search `NInput`: `min-width:320px; flex:1; height:32px; border-radius:6px; border:1px #E5E7EB`, focus `border #3B82F6 + shadow 0 0 0 2px #DBEAFE`, prefix `Search` via `h(NIcon)`, clearable, debounce 300ms, placeholder `Cari...` / `Cari kolom...`.
- Select `NSelect`: `width:160px; height:32px; border-radius:6px`, placeholder `Semua Kolom`, filterable.
- Buttons: `NButton` + `NIcon` (`Restart` Refresh, `Reset`, `Settings` visibility), height 32px, radius 6, hover `scale(1.02)` 150ms, `aria-label` untuk icon-only.
- Error slot: `NAlert type="error"` full-width di atas `NDataTable`, closable, + `NButton` Retry `emit('retry')` tanpa reset `search/sort/page`.
- Table: `NDataTable` remote, row 36px, cell 8px, header 40px, sorter ASC/DESC via Carbon `ArrowUp/Down` 14px #3B82F6, pagination `Menampilkan {from}-{to} dari {total}` ID + pageSizes 10/20/50/100.
- Props baru: `storageKey="datatable-hidden-columns-global-${tableId}"` + `emptyDescription="Belum ada kolom"` + `error: string | null`.

## Columns Manager (khusus — migrasi raw table → DataTable)

- Ganti `<table class="w-full">` `GlobalTableColumnTab.vue:115` → `DataTable` dengan columns: Reorder | Name (`NText code`) | Type (`NTag`) | Required/Searchable/Orderable (`NTag`) | Actions.
- Reorder eksplisit: `NButton quaternary size="small"` `ChevronUp` / `ChevronDown` (Carbon via `h(NIcon)`) + disabled first/last + `aria-label="Pindahkan ke atas/bawah"` + persist debounce + live region `Dipindahkan ke posisi ${n}`. Tidak ada `DragHandle` palsu.
- Actions: Detail `Eye`/`View` `type info ghost`, Edit `Edit` `type warning ghost`, Delete `TrashCan` `type error ghost` + `NPopconfirm` `positive-text="Hapus"` — distinct, bukan dua Edit identik.
- Tag `currency` → `warning` (bukan `purple` invalid `typeColors:35`).
- States: loading `NSpin` overlay, empty `NEmpty description="Belum ada kolom"` + CTA `+ Buat Kolom Pertama`, error `NAlert error` + retry.

## Column Form (per-type sections)

- Modal `preset="card"` `class="max-w-2xl"` responsive `width:min(640px,90vw)` (bukan `max-w-md` fix).
- Type `NSelect` filterable `columnTypes 11` — @change tidak pakai `optionRules.value={}` (bug `304`) melainkan computed `optionRules` JSON validasi.
- Sections mount `v-if` (bukan `v-show` `308+`) per type: `select` → Options JSON + `optionRules`; `date` → Format `NInput`; `select-table-relation*` → Relation Table `NSelect` + `NCheckboxGroup` displayColumns + Separator `NInput` + `NRadioGroup` `restrict/detach`; `hidden/readonly-computed` → Expression `NInput` monospace + dependency chips + Uji; common → Default `NInput` / `NInputNumber` Position + Checkboxes `required/searchable/orderable`.
- `NRadioGroup` pattern: `<NRadioGroup v-model:value="relationOnTargetDelete"><NSpace><NRadio value="restrict">Restrict</NRadio><NRadio value="detach">Detach</NRadio></NSpace></NRadioGroup>` (fix `NRadio` tunggal `351`).
- `NCheckboxGroup` pattern: `<NCheckboxGroup v-model:value="relationDisplayColumns"><NSpace vertical><NCheckbox v-for="col in targetColumns" :key="col.name" :value="col.name" :label="col.name"/></NSpace></NCheckboxGroup>` (fix loop `NCheckbox` single `329`).
- Position: `NInputNumber v-model:value="form.position" :min="0" clearable` (fix `NInput type="number" 404`).
- Token: `font-size:12px; color:#94a3b8` bukan `#666` `292`; no `text-blue-500`.
- Validation: `computed<FormRules>` per `type` — `name` snake_case, `displayName` required, `expression` required bila computed, `displayColumns` min 1 bila relation, `options` JSON valid bila select, `422` inline `NFormItem feedback` + focus first invalid.

## RelationSelector

- `NSelect` remote filterable `filterable+remote` + `render-label` + `render-tag` `NTag`.
- Props: `search 300ms debounce` → `fetchOptions(search, page)`, `handleScroll` `index >= length-5` → `fetchOptions(search, floor(length/limit)+1)`, `hasMore = options.length < total` (fix `offset+length < total 40`).
- States: `NSpin small` loading + `NEmpty description="Tidak ada data. Buat dulu di tabel target."` + panduan link `Buat data target` ALT-02 + `NAlert type="error" Gagal memuat opsi` + `NButton size="small" @click="retry" Coba lagi` ERR-01. Dead imports `NTag,NButton,NEmpty` dipakai lagi, tidak dead.
- A11y: keyboard `Tab` → `Enter`, `aria-label="Pilih relation"` .

## DynamicForm (all types + computed live + upload)

- `editableColumns` filter `type !== 'hidden-computed'` (hidden tetap hidden).
- Per type: `text` `NInput`, `richtext` `NInput textarea 4 rows` + note `Editor penuh Task 35`, `date` `NDatePicker type="datetime"`, `select` `NSelect`, `number/currency` `NInputNumber` prefix `Rp`, `select-table-relation*` `RelationSelector`, `image` `NUpload` + `NInput URL`, `readonly-computed` `NInput disabled` + live value.
- Upload: `NUpload :show-file-list="false" accept="image/*"` → `NButton type="primary" ghost` + `h(NIcon,()=>h(Upload))` `Upload image` + `NSpin` uploading + `NImage preview 64` — no `span text-blue-500 cursor-pointer` `163`, token `#3B82F6`, `role="button"` `tabIndex 0`, keyboard `Space/Enter`.
- Computed live: watch `formValue` + `expression` → client recompute via `POST /api/expressions/evaluate` debounce 200ms + dependency chips `NTag closable type="info"` + tombol `Uji ekspresi` + `NAlert` success/error preview; placeholder bukan `"Computed on save"` kosong; server authoritative `BR-001`.
- Rules: `computed<FormRules>` per `col.required` + type number + serverErrors.

## Import Modal

- `NModal preset="card" title="Import CSV" style="width:min(640px,90vw)"` (fix `640px` `78`) + `NUpload accept=".csv"` tanpa `custom-request` stub `81`.
- Preview: `parsePreview` quote-aware — state machine `inQuote`, handle `""` escape + `,` inside `"` — 5 rows max (batas 28), kolom mismatch `NAlert type="warning"`.
- Result: `NAlert type="warning" Partial: ${imported} imported, ${failed} failed` + `NDataTable :columns="errorColumns" :data="summary.errors" :max-height="240"` per baris `row/reason`; success `NAlert type="success"`.
- File guards: `!endsWith('.csv')` error + `size>5MB` error + `rows>5000` 422.

## Row Drawer

- `NDrawer width="480"` + `NDrawerContent title="Row #id"` + `detail-view` pattern (bukan `NDescriptions`).
- States: `NSpin` loading, `NEmpty description="Row not found"` + retry, `NAlert error` + `NButton @click="fetchOne" Coba lagi` (fix silent `catch{row=null} 37`).
- Footer `NSpace` + `h(NIcon)` icons: Edit `Edit` `type="warning" ghost`, Delete `TrashCan` `type="error" ghost` + `NPopconfirm` `Hapus baris ini?` (fix no confirm `44`).

## Table List Order/Icon Inline (GAP-GT tambahan vs GAP-GT-01)

- `GlobalTableTable.vue:58` order `NInputNumber min 0` + icon `NSelect` allowlist `resolveMenuIcon` — inline edit debounce 300ms + saving `NSpin size="small"` indicator sebelah field (bukan toast-per-klik) — `wireframe/table-list.png`.

## Responsive

- Desktop ≥1024: tabel penuh 12 kolom, modal `max-w-2xl` standar, PageShell `padding 20`, NGrid 2.
- Tablet 768–1023: columns hidden via visibility toggle (`NPopover` + `NCheckbox`), toolbar wrap search full-row, form 1 kolom.
- Mobile <768: table horizontal scroll terkendali `overflow-x:auto` + `min-width:640px` inside, drawer full `width="100vw"` atau `480→100%`, form full-width, toolbar stack search full-width + field+buttons row2.

## States

- Loading: `NSpin show` overlay `rgba(255,255,255,.6)` + `NGrid skeleton shimmer 1.4s`.
- Empty: `NEmpty description` ID + CTA `NButton type="primary"` (`+ Buat Kolom Pertama` / `+ Buat Data Pertama` / `Buat data target`).
- Error: `NAlert type="error" closable` + `NButton Retry` `emit('retry')` keep data.
- Success: `useMessage()` toast — `import.meta.client ? useMessage() : null`, live region, 3s auto-dismiss, `slideIn 300ms`.
- Validation: `NFormItem feedback` `12px #DC2626`, focus first invalid, `aria-describedby`.
- 403: pola 26 tunggal — floating global `NAlert` Teleport body top 16 right 16 max 448px `data-testid="access-denied"` (bukan per halaman).

## Motion & A11y

- Tokens: Fast 150 ease-out, Normal 250 ease, Slow 350 ease-in-out.
- prefers-reduced-motion: `* {animation-duration:.01ms !important; transition-duration:.01ms !important}`.
- Keyboard: Tab order toolbar→table→pagination→CTA→modal focus trap; reorder `Enter/Space` Up/Down, delete `Enter` confirm; relation `NCheckboxGroup` arrow + Space.
- ARIA: icon-only `aria-label`, decorative `aria-hidden`, `aria-live="polite"` untuk reorder/import result, `role="dialog"` modal/drawer `aria-modal`.
