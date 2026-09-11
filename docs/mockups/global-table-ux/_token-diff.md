# Token Diff — Off-Token Removal untuk Task 29 (Global Table UX)

> Audit `grep -rn "purple\|#666\|text-blue-500\|DragHandle\|NRadio\b\|v-show\|indigo\|#6366f1"` di `apps/web/app/components/features/global-tables` + `table-data` + `docs/mockups/global-table-ux`. Semua harus 0 setelah Task 29. Mockups hi-fi Task 28 sudah 0 off-token — ini daftar yang harus disapu bersih di Task 29.

## Hits Saat Ini (akan dihapus Task 29 — sumber `tasks/28:Context:13` + `tasks/29:Context:14` + audit `_audit-matrix.md`)

| File | Line (saat audit) | Sebelum (off-token / bug) | Sesudah (token / fix) | Wireframe/Mockup Ref |
|------|-------------------|---------------------------|-----------------------|----------------------|
| `GlobalTableColumnTab.vue:35` | `currency:'purple'` | `purple` invalid NTag type | `warning` (atau `primary`) | `mockup/columns.png` tag warn |
| `GlobalTableColumnTab.vue:4,135` | `DragHandle` + `cursor-move` | Drag palsu tanpa handler | `ChevronUp` + `ChevronDown` via `h(NIcon)` + `reorder` persist + live region | `wireframe/columns.png` reorder |
| `GlobalTableColumnTab.vue:162-166` | both `<Edit/>` `info` vs `warning` | Ikon ambigu | Detail `View`/`Eye` (`info ghost`), Edit `Edit` (`warning ghost`), Delete `TrashCan` (`error ghost`) | `mockup/columns.png` distinct |
| `GlobalTableColumnTab.vue:115` | `<table class="w-full">` raw | Bukan DataTable | `DataTable` kanonis `search 320 flex-1 + select 160 + Restart + error slot` | `wireframe/columns.png` |
| `GlobalTableColumnTab.vue:60,168` | `@click="handleDelete"` direct | Tanpa NPopconfirm | `NPopconfirm` wrapper `onPositiveClick="handleDelete"` | `mockup/columns.png` NPopconfirm |
| `GlobalTableColumnFormModal.vue:304,374` | `@change="optionRules.value={}"` / `:rules="optionRules"` | `optionRules` undefined | `const optionRules = computed<FormRules>` validasi JSON `[{label,value}]` | `mockup/column-form.png` |
| `GlobalTableColumnFormModal.vue:5,351` | `NRadio` only + `:options` | API salah | `import { NRadioGroup, NRadio }` + `<NRadioGroup><NRadio value="restrict">` | `_wireframe-spec.md` NRadioGroup |
| `GlobalTableColumnFormModal.vue:308+` | `v-show` 7× | Validasi bocor | `v-if` per section + `computed<FormRules>` per type | `wireframe/column-form.png` v-if |
| `GlobalTableColumnFormModal.vue:292` | `color:#666` | hardcoded | `color:#94a3b8` / `<NText depth="3">` | token detail-label |
| `GlobalTableColumnFormModal.vue:329` | `NCheckbox :value="includes"` loop | Bukan NCheckboxGroup | `NCheckboxGroup v-model:value="relationDisplayColumns"` + `NCheckbox value="col"` | `wireframe/column-form.png` |
| `GlobalTableColumnFormModal.vue:404` | `NInput type="number"` | — | `NInputNumber :min="0" clearable` | `mockup/column-form.png` |
| `RelationSelector.vue:3,40,73,115` | dead `NEmpty,NTag,NButton` / `offset+length<total` / `message.error` only / no conditional | Missing states + hasMore salah | Hapus dead → pakai `NEmpty`+`NTag`+`NButton`; `hasMore = options.length < total`; `NAlert error + retry`; template conditional | `mockup/selector.png` |
| `TableDataImportModal.vue:33` | `line.split(',')` | naive | quote-aware state machine (`inQuote` + `""` escape) mirror `table-data.service:353` | `mockup/import.png` quoted |
| `TableDataImportModal.vue:78,81` | `width:640px` / `custom-request="()=>{}"` | fix + no-op | `width:min(640px,90vw)` `preset="card"` + `@change` | `wireframe/import.png` |
| `DynamicForm.vue:163,165` | `<span class="text-blue-500">` + no button | off-token + tidak focusable | `NButton type="primary" ghost` + `h(NIcon,()=>h(Upload))` + `NImage` preview | `mockup/row-form.png` upload |
| `DynamicForm.vue:171` | `placeholder="Computed on save"` | tanpa live | `computed live` `NInput disabled :value="liveValue"` + chips + `Uji` + `POST /api/expressions/evaluate` | `mockup/row-form.png` live |
| `TableRowDetailDrawer.vue:37,44,108` | `catch{row=null}` silent / direct delete | — | `NAlert error` + `retry` + `NPopconfirm` | `wireframe/browse.png` drawer |
| `table-data` / `global-tables` | `NIcon` wrappers check | bare icons if any | Semua `h(NIcon, null, {default:()=>h(Icon)})` | token audit |

## Ukuran Sider / DataTable (fondasi — sudah di Task 27, tetap 0)

| File | Line | Sebelum | Sesudah | Status di 28 |
|------|------|---------|---------|--------------|
| `default.vue:335` | `width:240 collapsed:64` | 240/64 | 220/72 (Task27 done) | ✅ 0 di mockup 28 |
| `DataTable.vue:154` | `min-width:280px` | 280 | **320** (Task27 done) | ✅ 0 |
| `DataTable.vue:168` | `width:140px` | 140 | **160** | ✅ 0 |
| `indigo` / `#6366f1` | `grep indigo` | off-token | **0** | ✅ 0 |

## Verifikasi Task 29 (harus 0 setelah implementasi)

```bash
# global-table specific — harus 0 setelah Task 29
grep -r "purple" apps/web/app/components/features --include="*.vue" | wc -l          # → 0
grep -r "#666" apps/web/app/components/features --include="*.vue" | wc -l            # → 0
grep -r "text-blue" apps/web/app/components/features --include="*.vue" | wc -l       # → 0
grep -r "DragHandle" apps/web/app/components/features --include="*.vue" | wc -l      # → 0 (ganti ChevronUp/Down)
grep -rn "NRadio\b" apps/web/app/components/features/global-tables --include="*.vue" | grep -v "NRadioGroup" | wc -l # → 0
grep -rn "v-show" apps/web/app/components/features/global-tables/GlobalTableColumnFormModal.vue | wc -l # → 0 (pakai v-if)
grep -r "offset.value + options" apps/web/app/components/features --include="*.vue" | wc -l # → 0 (fix hasMore)
grep -r "line\.split" apps/web/app/components/features/table-data --include="*.vue" | wc -l # → 0 (quote-aware)
grep -r "custom-request.*{}" apps/web/app --include="*.vue" | wc -l               # → 0
# fondasi — harus tetap 0 (Task 27)
grep -r "indigo" apps/web/app --include="*.vue" --include="*.ts" | wc -l            # → 0
grep -r "#6366f1" apps/web/app --include="*.vue" --include="*.ts" | wc -l           # → 0
```
