# UI — Dynamic Administration & Document Composition

> Basis: `docs/design-system.md` (Naive UI 2.44 + Tailwind v4, token Primary `#3B82F6`, `detail-view` pattern, DataTable spec) + `docs/architecture.md` § Dynamic Administration UI Patterns + `core-conpect.md` bab 10–16.
> Implementasi berjalan: `CompositionCanvas` + `CompositionNodeView` + `ComponentPickerModal` + `NodeInspector`; `RelationSelector`; `NSteps` wizard; `NConfigProvider` theming `app/utils/naiveui-theme.ts`.

---

## 1. Halaman & Routing (file-based Nuxt 4)

| Halaman | Route | Persona | Deskripsi |
|---------|-------|---------|-----------|
| Global Tables | `/dashboard/global-tables` | Designer | List metadata tabel |
| Table Data Browse | `/dashboard/data/:tableName` | Designer/Operator | CRUD rows per table (generated) |
| Components | `/dashboard/components` | Designer | List reusable blocks |
| Templates | `/dashboard/templates` | Designer | List blueprints |
| Template Editor | `/dashboard/templates/:id` | Designer | CompositionCanvas (detail+edit) |
| Administrations | `/dashboard/administrations` | Designer | List workflows |
| Administration Editor | `/dashboard/administrations/:id` | Designer | Steps manager |
| Runs — My Runs | `/dashboard/runs/mine` | Operator | List my runs |
| Run Wizard | `/dashboard/runs/:runId` | Operator | Step-by-step filler |
| Documents | `/dashboard/documents` | Operator/Auditor | List issued docs |
| Document Viewer | `/dashboard/documents/:id` | Semua | HTML viewer + PDF download |
| Navigation demo | sidebar `AppLayout` | Semua | Generated menu Data + Persuratan |

> Tambahkan ke `app/pages/dashboard/` mengikuti konvensi `architecture.md` § Nuxt 4 Project Structure. Sidebar menu projection `GET /api/navigation` → render sebagai `<a href>` (design-system.md § Sidebar Navigation) untuk right-click → new tab.

---

## 2. Layout

### 2.1 AppLayout (global)
```
┌─────────────────────────────────────────────────┐
│ Navbar 52px: logo | breadcrumb | Profile dropdown│
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Page header: title + subtitle +     │
│ 220px    │  actions (Create/Publish/Export)      │
│ collapse │  ──────────────────────────────────  │
│ 72px     │  Content card 12px padding            │
│ Data     │  (DataTable / Canvas / Steps)        │
│  Pegawai │  ──────────────────────────────────  │
│  Dept    │  Footer (pagination / wizard nav)    │
│ Persuratan                                   │
│  SK Pengangkatan                             │
└──────────┴──────────────────────────────────────┘
```
Token: `SideWidth 220 / Collapse 72 / Navbar 52 / Card Padding 12 / Section Gap 20` (design-system.md § Layout Dimensions).

### 2.2 Template Editor Layout (split)
```
┌──────────────────────┬────────────────────────────┐
│ Canvas (flex-1)      │ Inspector 320px (right)    │
│ ┌──────────────────┐ │  NodeInspector              │
│ │ Paragraph        │ │   - placementId             │
│ │ [Component:p1] ▼ │ │   - component select        │
│ │ Table 2x3        │ │   - looping toggle          │
│ │ Page Break ──    │ │   - Binding list → edit     │
│ └──────────────────┘ │  ComponentPickerModal        │
│ BubbleMenu: B/I/U    │  (NP: search + loop filter) │
│ FloatingMenu: +Insert│  Version history drawer       │
└──────────────────────┴────────────────────────────┘
```
Di mobile: Inspector jadi `NDrawer` bottom.

### 2.3 Administration Editor Layout (vertical steps)
```
Header: [Save draft] [Preview] [Publish vN → vN+1] [Archive]
NSteps (horizontal) 1 Info Surat → 2 Pilih Pegawai → 3 Preview
Active step card: fields form (generated dari fields JSON) + template picker (NSelect) + fields config
Actions: [+ Add Step] [Reorder drag handle] [Delete step]
```

### 2.4 Run Wizard Layout (operator)
```
NSteps current = stepIndex (1..n) + Progress "Step 2 of 4"
Step card: field form (fields + RelationSelector) + Preview per-step (optional)
Nav: [Back] [Next / Validate] [Complete] [Cancel run]
Errors: NAlert per field + top summary
```

---

## 3. Wireframe (low-fi, ASCII)

### 3.1 Global Table Browse (`/dashboard/data/pegawai`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Pegawai   [Create Pegawai] [Export CSV] [Import CSV]             │
│ ┌──────────────┐ [All Fields▼] [Reset] [⚙️ Columns]  [↻ Refresh] │
│ │ 🔍 Search pegawai...                          [x]  │            │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ ☐ | Nama | NIP | Jabatan | Tgl Lahir | Foto | Aksi        │ │
│ │ ☑ | Afdal | 123 | Programmer | 10-08-1995 | [img] | ⋮ Edit│ │
│ │ … | …     | …   | …         | …          | …    | …     │ │
│ │                     Showing 1-20 of 42                       │ │
│ │                     [Pagination 1 2 3]  [10 20 50 100 ▼]     │ │
│ └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Form Generate (Create Row)
```
┌──────────────────────────────┐
│ Create Pegawai              X│
│ Nama* [____________]         │
│ NIP* [________]              │
│ Jabatan [Select ▼] (select)  │
│ Tgl Lahir [📅 10-08-1995]     │
│ Foto [Drop image / Upload]   │
│ Departemen [Search Dept…▼]   │
│ Total (readonly) [auto 0]    │
│           [Cancel] [Save]    │
└──────────────────────────────┘
```
`hidden-computed` tidak dirender; `readonly-computed` disabled `NInput`.

### 3.3 Component Card
```
┌───────────────────────────────┐
│ Identitas Pegawai  [loop ○ ]  │
│ Requires: nama(text) nip(text)│
│ Content:                      │
│  Nama: {{nama}}               │
│  NIP: {{nip}}                 │
│ [Preview] [Edit] [Publish v2] │
└───────────────────────────────┘
```

### 3.4 Template Canvas (wireframe heatmap)
```
┌─────────────────────────────────┐
│ Dengan ini menerangkan bahwa:   │
│ ┌─────────────────────────────┐ │
│ │ [Identitas Pegawai p1]  ⋮⚙ │ │  ← ComponentNodeView (drag handle, inspect)
│ │  Nama: {{data.pegawai.nama}}│ │
│ └─────────────────────────────┘ │
│ Yang bersangkutan telah…        │
│ ┌─────────────────────────────┐ │
│ │ [Daftar Pegawai p2 loop]    │ │  ← loop badge + count
│ └─────────────────────────────┘ │
│  [ + Insert Component ]          │
└─────────────────────────────────┘
```
Context menu (right-click / FloatingMenu):
```
┌──────────────────────────┐
│ Insert Component          │
│ Insert Dynamic Text {{ }} │
│ Insert Dynamic Image      │
│ Insert Table              │
│ Insert Page Break         │
└──────────────────────────┘
```

### 3.5 Binding Inspector
```
Placement p1 – Identitas Pegawai
┌─────────────────────────────────┐
│ nama → [Global Table ▼ pegawai.nama ▼] │
│ nip  → [Manual ▼ "123"]                 │
│ jabatan → [Expression ▼ nip + " - " + jabatan ] [Validate] │
│ ── missing: jabatan (red) ──            │
│ [Preview resolve] → "Afdal - Programmer"│
└─────────────────────────────────┘
```

---

## 4. Mockup (hi-fi guide — tokenized)

### 4.1 Token
- Primary `#3B82F6` (brand), hover `#2563EB`, focus ring 2px `rgba(59,130,246,.3)`.
- Card `rounded 8px`, input `rounded 6px`, tag `rounded 4px`, full `9999px`.
- Font `Inter 14/20 body`, label `11 uppercase slate-400 600`.
- Shadow card `0 1px 3px rgba(0,0,0,.08)`.

### 4.2 Mockup Deskripsi
- **DataTable header** sticky 40px, row 36px, zebra off, hover `Primary 50 #EFF6FF`.
- **ComponentNodeView** border dashed `1px #BFDBFE`, bg `Primary 50`, badge `loop` amber `NTag`.
- **Binding row** success green border jika bound; error red jika missing.
- **NSteps** dot Primary active, tail gray, current step blue.
- **Document viewer** A4 paper shadow `0 4px 24px rgba(0,0,0,.12)`, max-width 800px, centered.

### 4.3 Storybook
Tiap feature punya `stories/*.stories.ts`: `GlobalTableForm`, `RelationSelector`, `ComponentNodeView`, `CompositionCanvas`, `BindingInspector`, `RunWizardStep`.

---

## 5. Prototype Interaktif (Alur Klik)

### 5.1 Designer — Buat Template
`Components → + New → requirements[ nama ] → Preview → Publish → Templates → + New → Canvas ketik "Dengan ini" → FloatingMenu +Insert Component → picker search "Identitas" → placement p1 created → Inspector bind nama→global_table pegawai.nama → Validate-tree (green) → Publish → Administrations → + New → Steps add template SK v1 → Publish`

### 5.2 Operator — Jalankan
`Persuratan → SK Pengangkatan → Start run → Step1 isi nomor → Next → Step2 RelationSelector cari "Afdal" checklist 2 row → Preview → Complete → Documents → View HTML → Download PDF → Reissue (reason) → new doc appears`

### 5.3 Error recovery
`Template publish tanpa binding → validate 422 → drawer sorot merah + list missingBindings → click missing → jump to Inspector → bind → retry publish (success toast slideInRight)`

Tool prototype: Figma link (placeholder) + Storybook `play` function untuk click-through.

---

## 6. Component (mapping Naive UI + custom)

| UI Piece | Component | Props / API | Catatan |
|----------|-----------|-------------|---------|
| Table browse | `DataTable` (`app/components/common/DataTable/DataTable.vue`) | `columns, data, loading, page, limit, total, sortBy, sortOrder` + `emits:update:page,search,sort-change` | Reuse existing; column visibility via `NPopover + NCheckbox`; localStorage persist |
| Form generator | `DynamicForm` (baru) | `fields: GlobalTableColumn[] | StepField[]` → renders `NInput/NSelect/NDatePicker/NInputNumber/RelationSelector/Upload` | Util `columnTypeToComponent` dari `docs/design-system.md` § Dynamic Administration UI Patterns |
| Relation selector | `RelationSelector` | `globalTableId, multiple bool, displayColumns, separator` → async `GET /rows/lookup?search` with `useVirtualList` | `select-table-relation` single vs multiple; RelationConfig |
| Image upload | `NUpload + NImage` atau `FilePond` | `action POST /api/storage/general` | preview 64px |
| Component card/list | `ComponentTable / ComponentFormModal / ComponentDetailDrawer` | `detail-view` pattern | looping `NSwitch` |
| Canvas editor | `CompositionCanvas + CompositionNodeView` | `content JSON nodes[]` v-model | Tiptap NodeView `componentBlock` draggable `placementId` |
| Picker | `ComponentPickerModal` | `NModal + NInput search + NTag is_looping filter` | pilih component |
| Inspector | `NodeInspector` | `placementId, componentId, bindings` → `PUT /bindings` | edit binding source |
| Steps editor | `AdministrationStepsEditor` | `steps: StepItem[]` + drag handle `sortablejs` | order dense |
| Run wizard | `RunWizard` | `run, steps, stepData` + `useStepper` | `NSteps` + `NForm` per step |
| Document viewer | `DocumentViewer` | `html string` (sanitized `DOMPurify`) | A4 paper container; actions `Download PDF` |
| Navigation | `AppLayout` menu | `GET /api/navigation` | `<a href>` + `router.push` pattern |

---

## 7. Interaction

| Trigger | Komponen | Feedback |
|---------|----------|----------|
| Search ketik | `DataTable` `NInput` 300ms debounce | `useDebounceFn` + spinner kecil di suffix |
| Toggle kolom | Popover checkbox | immediate hide/show + `useStorage` persist |
| Klik header sort | `NDataTable` | `↑/↓` Primary 500 150ms ease-out |
| Create/Edit row | `NModal` form | validate per column `required` + relation exists → 400 inline `NFormItem` feedback `error` |
| Drag reorder column/step | handle `⋮⋮` mousedown | `sortablejs` ghost opacity .5, drop → `PUT /columns/order` atau `steps` |
| Right-click canvas | `FloatingMenu` | `NDropdown` options Insert_* ; ESC close |
| Insert component | `ComponentPickerModal` search `fuse.js` | type 2 char → list filter; Enter pick |
| Bind edit | `NSelect source` change | dependent `sourceRef` field muncul (conditional rendering); Validate button → call `POST /expressions/validate` |
| Publish | `NButton type=primary` | `NPopconfirm` "Publish akan freeze versi. Lanjut?" → success `NPimp toast` |
| Next step (run) | `[Next]` | `vee-validate` per step; error scroll to first invalid `NFormItem` |
| Complete run | `[Complete]` | `NModal confirm` → `NSpin overlay` 1–2s → success + redirect to Documents |
| PDF download | `[Download PDF]` | `window.open(/api/documents/:id/pdf, '_blank')` atau blob link |
| Reissue | `[Reissue]` | `NModal prompt reason` → POST reissue → toast + new row highlight |

---

## 8. Responsive Behavior

| Breakpoint | Layout adapt |
|------------|--------------|
| Mobile 320–639 | Sidebar collapse 72px icon only; DataTable card list alternative (row → card); Canvas single column; Inspector drawer bottom sheet; NSteps vertical |
| Tablet 640–1023 | Sidebar overlay drawer; Inspector 280px; DataTable horizontal scroll + sticky first column |
| Desktop 1024–1535 | Split canvas/inspector tetap; Steps horizontal |
| Large ≥1536 | Canvas max-width 900px centered; Inspector 360px |

- Container padding: Mobile 16 / Tablet 24 / Desktop 32.
- Grid: Mobile 4 / Tablet 8 / Desktop 12.
- Touch: drag handle 44px hit area; relation multi-select bottom sheet di mobile.

---

## 9. States

### 9.1 Loading
- List: `NSpin` overlay semi-white di `DataTable` (`loading` prop) + `NSkeleton` untuk cards.
- Detail: `NSkeleton text` 3 baris + `NSkeleton` rectangle untuk canvas.
- Tab action: `NButton loading` prop.
- Transition `250ms ease` (`architecture.md` § Animation Tokens).

### 9.2 Empty
- `NEmpty description="No {entity} found"` centered; action `+ Create {entity}` primary.
- Global Table empty → guide "Buat Global Table pertama untuk generate menu Data".
- RelationSelector empty → "Tidak ada data. Buat dulu di Data → {table}".
- Template canvas empty → placeholder Tiptap `"Ketik / atau klik + untuk insert component"` (extension-placeholder).
- Runs empty → "Belum ada run. Mulai dari Persuratan".

### 9.3 Error
- Form field: `NFormItem` `validationStatus="error"` + `feedback` pesan Zod.
- API 400: inline per field + top `NAlert type="error" closable` list errors.
- 401: clear token → redirect `/login` + "Sesi habis" (useApi interceptor).
- 403: `NAlert type="error" title="Access Denied"` + dispatch `rbac-denied` custom event; hide action buttons via `hasPermission`.
- 404: `NResult status="404" title="Not found"` + link back.
- 409: `NAlert` "Masih dipakai di …" + link ke dependent.
- 422 validate-tree / complete: panel merah list `missingBindings/missingFields` clickable scroll.

### 9.4 Success
- Toast `NMessage success` / `vue-sonner` slideInRight 300ms: "Saved", "Published v3", "Run completed — 2 documents issued".
- `detail-view` tidak hilang setelah save — tetap di drawer dengan footer actions.
- PDF ready: `NNotification` with Download action.

---

## 10. Accessibility (a11y)

| Area | Ketentuan | Implementasi |
|------|-----------|--------------|
| Keyboard | Semua action reachable Tab | `NButton`, `NInput` native focus; Canvas `ProseMirror` arrow navigation; Inspector `NSelect` keyboard `↑↓ Enter ESC`; Modal trap `NModal focus-trap` |
| Focus visible | Ring jelas | Naive theme `focus: 2px solid #3B82F6 30%` + `:focus-visible` |
| ARIA | Label & role | `aria-label` di icon button, `aria-current="page"` di menu active, `role="toolbar"` untuk canvas bubble, `NDrawer aria-modal` |
| Color contrast | WCAG AA | Primary 500 on white 4.5:1; label `#94a3b8` on white tidak dipakai untuk body (< 12px) — body `#1e293b` |
| Reduced motion | Hormati | `@media (prefers-reduced-motion: reduce) { animation-duration: 0.01ms }` (design-system.md § Animations) — matikan stagger 250ms |
| Screen reader | Live region | `NAlert` `role="alert" aria-live="polite"`; loading `aria-busy` pada DataTable |
| Form | Label for | `NFormItem label` → `for=id`; required `aria-required`; error `aria-invalid` + describedby feedback id |
| Image | Alt | `NImage alt="{displayName}"`; image upload must have alt text prompt |
| Semantic | Heading | Satu `h1` per page (title); Canvas nodes pakai `h2/h3` via Tiptap heading extension |

---

## 11. Design Checklist (Definition of Done)

- [ ] Semua DataTable pakai toolbar spec `320px search + All Fields 160px + Reset + ⚙️ + ↻` dan persist column visibility.
- [ ] Semua detail view pakai `.detail-view` (bukan `NDescriptions`).
- [ ] Sidebar menu `<a href>` pattern untuk new-tab.
- [ ] Canvas placeholder + BubbleMenu + FloatingMenu berfungsi keyboard.
- [ ] Inspector binding error red highlight + Validate expression.
- [ ] NSteps `prefers-reduced-motion` reduce.
- [ ] Empty/Error/Success/Loading states di Storybook tiap component.
- [ ] A11y axe audit 0 violation critical.

## 12. Sinkronisasi v2 (2026-09-11, keputusan K-01…K-04)

- K-01: input `datetime` (date+time picker, format `m-d-Y H:i:s`), `time` (format `H:i:s`),
  `select-multiple` (multi dari options `{value,label}`) di DynamicForm + column form;
  currency IDR realtime di label number.
- K-02: wizard mendukung "tambah step (pilih template)" saat runtime + review mencakup steps
  runtime + complete menampilkan tautan dokumen per step.
- K-03: popup klik-kanan requirement menambah opsi `component` + picker component;
  loop terdeteksi → alert infinite loop (rantai + lokasi) + blokir aksi terkait.
- K-04: editor/picker menampilkan namespace `step.*` (`{{data.<step>.<field>}}`) dengan
  autocomplete; typo → inline error + saran (bind-time).

## 13. Referensi
- `core-conpect.md` bab 10–16 (canvas, context menu, binding, workflow), 29–31 (v2)
- `spec-v2-statamic-alignment.md` (spec mentah v2)
- `architecture.md` § Dynamic Administration UI Patterns (column mapping, CRUD impl)
- `design-system.md` (tokens, Table, Animations, Authorization UI Patterns, naiveui-theme)
- `rekomendasi-library.md` layer 4 (Tiptap stack) & layer 7 (auto-animate)
