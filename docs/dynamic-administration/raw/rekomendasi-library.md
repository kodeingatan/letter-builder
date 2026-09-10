# Rekomendasi Library JavaScript — Dynamic Administration & Document Composition

> Pendukung `core-conpect.md` — Data → Component → Template → Administration → Document → PDF
> Stack eksisting: Nuxt 4 + Vue 3.5 + TypeScript 6 + Naive UI 2.44 + Tailwind v4 + Pinia 4 + Zod 3.24 + TypeORM 1.1 + better-sqlite3 + Anime.js 4.5
> Tujuan: memilih library **ringan, Vue 3 / Nuxt 4 SSR-safe, kompatibel Naive UI, aktif di 2026, ESM**, dan memudahkan user non-developer.

---

## 0. Prinsip Pemilihan

| Prinsip | Penjelasan |
|---------|------------|
| **Metadata-driven** | Library harus bisa di-drive oleh JSON schema (Global Table Column Definition), bukan hard-code |
| **Naive UI first** | Jangan duplikasi komponen yang sudah ada di Naive UI (NInput, NSelect, NDatePicker, NDataTable, NSteps). Library pelengkap, bukan pengganti |
| **SSR & Nitro safe** | Harus aman di Nuxt server route / Nitro (guard `process.client` jika butuh DOM) |
| **Bundle budget** | Prioritas `< 50kB gzipped` per layer, tree-shakable, ESM |
| **DX Indonesia** | Format tanggal `m-d-Y`, currency `IDR`, richtext, relasi tabel → harus mudah dilokalkan |

> Instalasi semua dari `apps/web/` : `npm install <pkg>` atau `npm install -D <pkg>` untuk dev-only.

---

## 1. Layer: Global Table — Data Engine (Bab 2, 3, 22, 23, 24)

Definisikan struktur tanpa migration. CRUD otomatis, column type menentukan input/display/validasi/search/sort.

| Library | Kategori | Mendukung Bab | Kegunaan | Kenapa Dipilih untuk BMS | Alternatif | Install |
|---------|----------|---------------|----------|--------------------------|------------|---------|
| `@vueuse/core` | Composable utility | 2, 3, 22 | `useDebounceFn` (search 300ms), `useVModel`, `useStorage` (persist column visibility), `useVirtualList` (dropdown relasi 10k row), `useClipboard`, `onClickOutside` | De-facto standard Vue 3, 0 dependency, tree-shakable, SSR-safe. Menggantikan composable custom `useDataTable` yang sekarang manual | `vue-composable` (legacy) | `npm install @vueuse/core` |
| `date-fns` | Date utility | 3, 22 — `date` column | Parse/format `m-d-Y`, `DATE_FORMAT` di expression, validasi `minDate/maxDate`, `isBefore/isAfter` | Modular per-function (import `{format}` saja ~2kB), locale `id` tersedia, immutable, tidak seperti `moment` yang berat. Kompatibel `NDatePicker` value-format | `dayjs` (lebih ringan 2kB tapi plugin-based), `luxon` (berat) | `npm install date-fns` |
| `currency.js` / `dinero.js` | Number & currency | 3 — `number + currency` | Format `IDR 20.000,00`, parsing input, `ROUND`, `MIN/MAX`, hindari floating error `0.1+0.2` | `currency.js` 3kB, API `currency(20000).multiply(3).format()` cocok untuk computed `harga × jumlah`. `dinero.js v2` lebih lengkap jika butuh multi-currency | `numeral.js` (unmaintained), `accounting.js` | `npm install currency.js` |
| `fuse.js` | Fuzzy search | 22, 23 — Browse search | Global search + field-specific search client-side fallback, search `Pegawai` 5k row tanpa hit API | <10kB, zero-dep, skor relevansi, sudah dipakai di banyak admin generator. Melengkapi `search`/`searchField` server-side | `flexsearch`, `minisearch` | `npm install fuse.js` |
| `filepond` + `filepond-plugin-image-preview` | Upload & image | 3 — `image`/`foto` column | Drag-drop upload foto pegawai, preview, validasi size/type, crop sinyal ke `NImage` | Headless, adaptor Vue `vue-filepond`, mobile-friendly, tidak lock-in seperti `uppy` (berat). Alternatif `vue-dropzone` juga OK jika ingin dropzone penuh | `uppy`, `vue-dropzone`, `naive-ui NUpload` (sudah ada, tapi FilePond UX lebih baik) | `npm install filepond vue-filepond filepond-plugin-image-preview filepond-plugin-file-validate-type` |
| `cropperjs@2` | Image crop | 3 — `image` | Crop foto 3×4 sebelum simpan ke `GlobalTableRow` | Ringan, tidak depend jQuery (v2 ESM), dipakai bersama FilePond | `vue-cropper` | `npm install cropperjs` |

**Contoh mapping Column Type → Library:**
```ts
// server/dto/global-table.dto.ts (Zod sudah ada) + client renderer
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import currency from 'currency.js'

const renderers = {
  date: (v: string) => format(new Date(v), 'dd-MM-yyyy', { locale: id }),
  currency: (v: number) => currency(v, { symbol: 'Rp ', separator: '.', decimal: ',' }).format(),
  image: (v: string) => h(NImage, { src: v, width: 64 })
}
```

---

## 2. Layer: Computed Field & Expression Engine (Bab 4, 5, 20)

> Satu engine untuk `hidden-operation-text`, `readonly-operation-text`, `{{harga}} * {{jumlah}}`, `IF()`, `CONCAT()` — dipakai di Global Table, Component, Template, Condition.

| Library | Kategori | Mendukung Bab | Kegunaan | Kenapa Dipilih | Alternatif | Install |
|---------|----------|---------------|----------|----------------|------------|---------|
| `jexl` | Expression evaluator (aman) | 4, 5, 20 — `Expression Engine` | Evaluasi `{{harga}} * {{jumlah}}`, `{{nama}} ++ " - " ++ {{jabatan}}` (alias `+`), `IF(status=="aktif", "OK", "Nonaktif")`, `ROUND()`, `SUM()` | **Sandboxed, tidak pakai `eval`/`Function`**, support async transform, tambah fungsi custom `DATE_FORMAT`, `CONCAT`. Dibuat untuk config-driven UI (Mozilla). Lebih aman dari `mathjs` yang bisa loop | `expr-eval`, `filtrex`, `jsonata` | `npm install jexl` |
| `mathjs` | Math lengkap | 5 — `SUM, COUNT, MIN, MAX` | Jika butuh agregasi koleksi `SUM(pegawai.gaji)`, `MAX(pegawai.umur)` di Template loop | Powerful tapi bundle 150kB → **hanya import subset** `import { create } from 'mathjs/number'` atau gunakan `jexl` + helper manual agar tetap ringan | `expr-eval` (7kB, cukup untuk `+-*/`) | `npm install mathjs` |
| `json-logic-js` | Conditional rendering | 10, 19 — `Condition` | Simpan kondisi sebagai JSON `{"if": [{"==": [{"var":"status"},"aktif"]}, "Tampil", "Sembunyi"]}` untuk field visibility & Template `v-if` | Serialisable ke DB (kolom `condition` di Template), no-code friendly, portable ke backend (ada port PHP/Python). Lebih terstruktur dari string `IF()` | `jexl` (bisa juga handle condition) | `npm install json-logic-js` |
| `lodash-es` | Helper | 4, 13 — `Dependencies` tracking | `get(data, 'pegawai.nama')`, `uniq`, `groupBy` untuk collection, `debounce` fallback | ESM, tree-shakable (vs `lodash` CommonJS). Dipakai untuk resolve `{{data.pegawai.nip}}` path | `ramda`, `remeda` | `npm install lodash-es` |

**Rekomendasi arsitektur engine (gabungan):**
```ts
// server/utils/expression-engine.ts
import jexl from 'jexl'
import { format } from 'date-fns'

// 1x setup, dipakai di Global Table computed + Template binding + Condition
jexl.addTransform('currency', (v: number) => `Rp ${v.toLocaleString('id-ID')}`)
jexl.addFunction('DATE_FORMAT', (d: string, fmt: string) => format(new Date(d), fmt))
jexl.addFunction('CONCAT', (...args: string[]) => args.join(''))
// alias ++ -> + untuk string
export const evaluate = (expr: string, context: Record<string, unknown>) => jexl.evalSync(expr, context)

// usage: evaluate('harga * jumlah', { harga: 20000, jumlah: 3 }) // 60000
// usage: evaluate('nama + " - " + jabatan', { nama: 'Afdal', jabatan: 'Programmer' })
```

> **Jangan** pakai `eval()` / `new Function()` — rawan XSS & injection dari input user.

---

## 3. Layer: Component — Reusable Document Block (Bab 6, 7, 8, 9)

Component = contract `Data Requirement`. Butuh preview, versioning, single vs collection.

| Library | Kategori | Mendukung Bab | Kegunaan | Kenapa Dipilih | Alternatif | Install |
|---------|----------|---------------|----------|----------------|------------|---------|
| `handlebars` | Template logic (preview) | 6, 8 — `Content` + `{{nama}}` | Render preview `Nama: {{nama}}<br>NIP: {{nip}}` dengan data dummy sebelum disimpan | Logicless, aman (escape default), helper `{{#each}}` untuk `is_looping=true`, kompilasi di client untuk preview instan tanpa hit server | `mustache` (lebih minimal), `nunjucks` (lebih powerful), `ejs` | `npm install handlebars` |
| `nanoid` | ID generator | 6 — `ComponentVersion` | Generate `component_id`, `requirement_key` yang collision-safe, lebih pendek dari UUID | 130 byte, URL-safe, sudah ESM. Alternatif `uuid` lebih panjang (36 char) | `uuid`, `shortid` (deprecated) | `npm install nanoid` |
| `jsondiffpatch` + `diff` | Versioning & diff | 27.7 — `Versioned` | Tampilkan diff `v1 → v2` Component/Template (HTML diff highlight) agar user paham perubahan sebelum publish | `jsondiffpatch` untuk object `dataRequirements`, `diff` (jsdiff) untuk `content` string. Penting untuk audit & rollback Dokumen lama pakai versi saat dibuat | `deep-diff` | `npm install jsondiffpatch diff` |
| `dompurify` | Sanitizer | 6, 11 — `Content` | Sanitize `richtext` component sebelum `v-html` preview & sebelum simpan ke `ComponentVersion.content` | Wajib untuk cegah XSS dari editor richtext. SSR-safe via `jsdom` di Nitro, `DOMPurify.sanitize()` di client | `sanitize-html` (Node only) | `npm install dompurify jsdom` + `npm install -D @types/dompurify` |

---

## 4. Layer: Template — Document Composition Canvas (Bab 10, 11, 12, 13, 25)

> Editor bukan sekadar richtext — ini **canvas** yang berisi Text, Image, Table, Component, Dynamic Data, Loop, Condition, Page Break. Kebutuhan UX tertinggi.

| Library | Kategori | Mendukung Bab | Kegunaan | Kenapa Dipilih (Vue 3 + Naive UI) | Alternatif | Install |
|---------|----------|---------------|----------|-----------------------------------|------------|---------|
| **`@tiptap/core` + `@tiptap/vue-3` + `@tiptap/starter-kit` + `@tiptap/extension-mention` + `@tiptap/extension-placeholder` + `@tiptap/extension-table` + `@tiptap/extension-image`** | Richtext composition canvas | 10, 11, 12 — **Paling kritikal** | Canvas utama: `Component` sebagai **custom NodeView** (`[ COMPONENT: Identitas Pegawai ]`), `{{data.pegawai.nip}}` sebagai **Mention** dengan autocomplete, BubbleMenu/ContextMenu `Insert Component / Insert Dynamic Text / Insert Page Break`, drag-handle reorder | **Rekomendasi #1 untuk BMS.** ProseMirror-based, Vue 3 first-class (`NodeView` Vue component), extensible (buat `ComponentNode` + `LoopNode` + `ConditionNode` sendiri), JSON storage (bukan HTML) → mudah di-versioning & di-render ke PDF. Dipakai Linear, Notion-clone. Jauh lebih fleksibel dari Quill/CKEditor yang sulit embed custom node | `quill` + `quill-better-table` (sulit custom node), `ckeditor5` (berat, license), `lexical` (React-centric), `editor.js` (block-based tapi plugin terbatas), `slate` (React) | `npm install @tiptap/vue-3 @tiptap/core @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-image @tiptap/extension-text-align @tiptap/pm` |
| `@floating-ui/vue` | Positioning | 12 — `Context Menu` | Posisi `BubbleMenu`, `FloatingMenu`, `Insert Component` popup agar tidak terpotong viewport | Headless, 3kB, successor `popper.js`, dipakai Tiptap BubbleMenu. Lebih ringan dari `tippy.js` | `@popperjs/core`, `tippy.js` | `npm install @floating-ui/vue` |
| `sortablejs` + `vue-draggable-plus` (atau `@vueuse/sortable`) | Drag & drop | 10 — Reorder `Components` di Template, reorder `Columns` di Global Table | Drag handle untuk menyusun urutan `Kop Surat → Menimbang → Component Pegawai → Tanda Tangan` | `sortablejs` 15kB, touch support, dipakai `vue-draggable-plus` yang Vue 3 compatible. Alternatif `dnd-kit` lebih kompleks | `@vueuse/sortable`, `pragmatic-drag-and-drop` | `npm install sortablejs vue-draggable-plus` |
| `prosemirror-view` (via Tiptap) + `naive-ui NDropdown` | Context menu | 12 — `Insert Dynamic Component` | Klik kanan → `Insert Component / Insert Dynamic Text / Insert Dynamic Image / Insert Table / Insert Page Break` | Tiptap sudah provide `FloatingMenu` & `BubbleMenu`, tinggal isi dengan `NDropdown` Naive UI | `radix-vue` (headless) | (sudah ter-cover Tiptap) |
| `object-path` / `dot-prop` | Data binding resolver | 13 — `Data Binding` | Resolve `{{current_date}}`, `{{user.name}}`, `{{administration.nama}}`, `{{pegawai.nip}}` → `get(data, 'pegawai.nip')` | Kecil (2kB), support `{{data.pegawai[0].nama}}` untuk collection preview | `lodash.get` (lebih berat), `jsonpath-plus` | `npm install object-path` |
| `driver.js` | Guided tour | 10, 11 — Onboarding canvas | Tour interaktif `Klik kanan untuk insert component → pilih sumber data → preview` saat user pertama kali buka Template editor | 5kB, zero-dep, highlight step tanpa overlay berat seperti `intro.js`. Penting untuk user non-teknis | `intro.js` (berbayar), `shepherd.js` (berat) | `npm install driver.js` |

**Contoh custom Node Tiptap untuk Component (intisari):**
```ts
// app/components/features/templates/ComponentNode.ts
import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ComponentNodeView from './ComponentNodeView.vue'

export const ComponentNode = Node.create({
  name: 'componentBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      componentId: { default: null },
      looping: { default: false },
      binding: { default: {} }, // { nama: 'administration.nama', nip: 'pegawai.nip' }
    }
  },
  parseHTML() { return [{ tag: 'div[data-type="component-block"]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', { 'data-type': 'component-block', ...HTMLAttributes }, 0] },
  addNodeView() { return VueNodeViewRenderer(ComponentNodeView) },
})
```

> Jika **tidak** ingin Tiptap (tim ingin paling ringan): fallback `editor.js` + plugin `editorjs-drag-drop` + `editorjs-undo`, tapi butuh wrapper Vue manual dan custom block lebih terbatas.

---

## 5. Layer: Administration — Data Collection Workflow (Bab 14, 15, 16)

Multi-step wizard, satu Administration bisa punya banyak Template per step.

| Library | Kategori | Mendukung Bab | Kegunaan | Kenapa Dipilih | Alternatif | Install |
|---------|----------|---------------|----------|----------------|------------|---------|
| `vee-validate` + `zod` (sudah ada) | Form validation per step | 15 — `Step = Data Gathering Session` | Validasi tiap step sebelum `Next`, integrasi `zodResolver` dari `server/dto/*.dto.ts` agar schema front & back sinkron | Sudah pakai Zod di server — tinggal `npm install vee-validate @vee-validate/zod` untuk client. `NSteps` + `NForm` Naive UI + vee-validate = step wizard yang robust | `formkit` (berat, ganti total form system), `vue-form` | `npm install vee-validate @vee-validate/zod` |
| `pinia-plugin-persistedstate` | State persistence | 14, 15 — `AdministrationRun` draft | Simpan draft `AdministrationRun` ke `localStorage` (atau `sessionStorage`) agar user refresh tidak hilang data step 1-3 | Plugin resmi Pinia, 1 line `persist: true` di store `useAdministrationsData`. Alternatif manual `localStorage` rawan desync | manual `useStorage` dari `@vueuse/core` | `npm install pinia-plugin-persistedstate` |
| `@vueuse/core` — `useStepper` | Stepper logic | 15, 17 — `STEPS → DATA COMPLETION` | Logic `currentStep`, `next()`, `prev()`, `isFirst`, `isLast`, `goTo(n)` tanpa reinvent | Sudah di `@vueuse/core` jika pilih paket di layer 1 — tidak perlu library tambahan | `vue-stepper` (legacy) | (sudah ter-cover) |
| `notivue` / `vue-sonner` | Toast & feedback | 14 — `Preview` step | Toast `Step 2 tersimpan`, `Dokumen berhasil di-generate` dengan auto-dismiss & promise toast | `vue-sonner` 5kB, headless, stack toast, kompatibel Naive UI `NAlert` untuk error 403. `notivue` alternatif Vue 3 native | `naive-ui useMessage` (sudah ada, tapi sonner untuk global stack lebih baik) | `npm install vue-sonner` |

**Pola Step Wizard (Naive UI + vee-validate):**
```vue
<N-steps :current="stepIndex" size="small">
  <N-step title="Informasi Surat" />
  <N-step title="Informasi Pegawai" />
  <N-step title="Preview" />
</N-steps>
<N-form @submit.prevent="nextStep">
  <!-- field dari AdministrationStep definition, validate dengan Zod schema step tersebut -->
</N-form>
```

---

## 6. Layer: Rendering Engine & Document Generation (Bab 17, 18, 19, 20)

> `Template + Data + Component → Resolve Tree (Binding/Loop/Condition) → HTML DOM → PDF`. Satu engine generik, bukan per-template.

| Library | Kategori | Mendukung Bab | Kegunaan | Kenapa Dipilih (Nuxt Nitro + SQLite) | Alternatif | Install |
|---------|----------|---------------|----------|--------------------------------------|------------|---------|
| `handlebars` (server) | HTML string composer | 19 — `Renderer` | Compile `Template.content` + `Component.content` + resolved `binding` menjadi HTML final sebelum PDF. Helper `{{#each pegawai}}`, `{{#if status}}` native | Sama dengan preview client → **single source of truth**. Server Nitro bisa `Handlebars.compile(template)(data)` tanpa browser | `ejs`, `nunjucks`, `mustache` | `npm install handlebars` (atau sudah di layer 3) |
| `puppeteer-core` + `@sparticuz/chromium` **atau** `playwright-core` | Server PDF (Nitro) | 17, 19 — `HTML → PDF` | `page.setContent(html); await page.pdf({ format: 'A4', printBackground: true, margin })` untuk hasil pixel-perfect sesuai preview HTML | **Rekomendasi produksi.** `@sparticuz/chromium` ~50MB, auto-download chromium untuk Lambda/Vercel/Nitro preset. Jika deploy di VPS sendiri, `puppeteer` full (bukan core) lebih sederhana. Alternatif `playwright` lebih stabil untuk multi-browser tapi bundle lebih besar | `pdfmake` (hanya JSON → PDF, tidak HTML), `jspdf` + `html2canvas` (client only, kualitas rendah) | `npm install puppeteer-core @sparticuz/chromium` |
| `pdf-lib` | PDF manipulation (server) | 27.7 — `Versioned Document` | Merge multi-Template jadi 1 PDF (Bab 16: 4 Template → 1 Administration), tambah watermark, page number, footer `Generated by BMS` tanpa re-render | Pure JS, no native dep (penting untuk `better-sqlite3` yang sensitif native addon), bisa `PDFDocument.load()` + `copyPages()` | `pdfjs`, `hummus` (native) | `npm install pdf-lib` |
| `html2canvas` + `jspdf` | Client preview fallback | 17 — `HTML / PDF` toggle | Preview `Download PDF` instan di client tanpa roundtrip server (untuk Template preview). `html2canvas(dom).then(canvas => jspdf.addImage(...))` | **Hanya fallback.** Kualitas < Puppeteer (font, page-break). Tetap sediakan karena user ingin preview cepat sebelum `Generate` | `dom-to-image-more` | `npm install html2canvas jspdf` |
| `pagedjs` (opsional) | Print CSS & page break | 11, 19 — `Page Break` | Polyfill `@page { size: A4; margin: 20mm }`, `break-before: page`, header/footer berulang via CSS Paged Media | Jika ingin `Page Break` Tiptap langsung tercerminkan di PDF tanpa logic manual `page.pdf()` | Manual `page-break-after: always` | `npm install pagedjs` |
| `qrcode` + `bwip-js` | Barcode/QR di dokumen | Ekstensi Bab 19 | Generate QR `Nomor Surat` atau barcode `NIP` langsung di Template (`{{qrcode nomor_surat}}` helper) | `qrcode` 10kB, `bwip-js` support Code128/QR. Berguna untuk surat resmi yang butuh verifikasi | `jsbarcode` | `npm install qrcode bwip-js` + `npm install -D @types/qrcode` |

**Flow Nitro yang direkomendasikan:**
```ts
// server/api/documents/generate.post.ts
import Handlebars from 'handlebars'
import { PDFDocument } from 'pdf-lib'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

Handlebars.registerHelper('qrcode', (text: string) => new Handlebars.SafeString(`<img src="${await QRCode.toDataURL(text)}" />`))

const html = Handlebars.compile(template.content)(resolvedData) // resolvedData = binding + loop + condition hasil jexl/json-logic
const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath() })
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle0' })
const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
return pdfBuffer
// jika multi-template: PDFDocument.load() tiap buffer lalu copyPages() gabung
```

---

## 7. Layer: Cross-Cutting — Menu, Search, Relation, UX Global (Bab 18, 21, 22, 26, 27)

| Library | Kategori | Mendukung Bab | Kegunaan | Kenapa Dipilih | Alternatif | Install |
|---------|----------|---------------|----------|----------------|------------|---------|
| `fuse.js` (sudah di layer 1) | Menu search | 21 — `Generated Menu` | Search `Pegawai` / `Surat Keputusan` di sidebar yang ter-generate dari metadata | Tidak perlu library baru — reuse | — | — |
| `@vueuse/core` — `useVirtualList` | Relation selector scalability | 23, 24 — `select table relation` | Dropdown `Department` 5k row tetap lancar (virtual scroll) melengkapi `RelationSelector` yang sekarang | Sudah di `@vueuse/core` | `vue-virtual-scroller` (lebih berat) | — |
| `command-score` / `fuse.js` | Command palette | 21 — Quick jump | `Cmd+K` palette `Buka Pegawai / Buka Surat Tugas` ala Linear | `command-score` 2kB untuk scoring, UI pakai `NModal` + `NInput` | `kbar`, `cmdk` (React) | `npm install command-score` |
| `dayjs` plugin `relativeTime` (jika pakai dayjs) atau `date-fns/formatDistance` | Relative time | 18 — `Runtime Flow` progress | `2 jam lalu`, `Step 2 — 5 menit` di AdministrationRun log | Sudah ter-cover `date-fns` | `timeago.js` | — |
| `auto-animate` (`@formkit/auto-animate`) | Micro-animation | 27 — `Renderer-driven` UX | Animate tambah/hapus Component di canvas, reorder step, tanpa tulis CSS manual | 1 line `v-auto-animate`, 2kB, hormat `prefers-reduced-motion` | `anime.js` (sudah ada untuk page transition) | `npm install @formkit/auto-animate` |

---

## 8. Layer: Developer Experience & Safety (Wajib untuk Metadata-driven System)

| Library | Kategori | Mendukung Bab | Kegunaan | Kenapa Dipilih | Install |
|---------|----------|---------------|----------|----------------|---------|
| `zod` (sudah ada) + `drizzle-zod` / `zod-to-json-schema` | Schema sync | 2, 3, 26 — `COLUMN`, `Core Object Model` | Generate JSON Schema dari Zod DTO (`server/dto/*.dto.ts`) untuk auto-generate form & validasi client | Single source of truth: DTO → JSON Schema → Form Renderer | `npm install zod-to-json-schema` |
| `msw` (Mock Service Worker) | Mock API | Testing wizard | Mock `GET /api/global-tables/:id/rows` untuk Storybook & Vitest tanpa DB | Dev-only, intercept fetch/axios | `npm install -D msw` |
| `vitest` + `@vue/test-utils` (sudah ada) + `happy-dom` | Test | Semua | Unit test expression engine, binding resolver, PDF helper | Sudah di stack | — |
| `eslint-plugin-security` + `npm audit` | Security | 4, 5 — cegah `eval` | Lint `no-eval`, `no-new-func` untuk expression engine | Dev-only | `npm install -D eslint-plugin-security` |

---

## 9. Ringkasan Prioritas (Apa Dipasang Dulu)

### 🔴 Must Have (Pasang di sprint ini)

| # | Library | Alasan |
|---|---------|--------|
| 1 | `@vueuse/core` | Fondasi semua layer (debounce, storage, virtual list, clipboard) |
| 2 | `jexl` + `json-logic-js` | Expression & condition engine — inti Bab 4 & 5. Tanpa ini computed field tidak aman |
| 3 | `@tiptap/vue-3` + starter-kit + mention + table + image | Composition Canvas Bab 10-12. Ini pembeda UX utama |
| 4 | `handlebars` | Single engine preview (client) + render (server). Sinkronkan sekarang |
| 5 | `dompurify` + `jsdom` | Wajib sanitasi richtext — jangan tunda (XSS) |
| 6 | `date-fns` + `currency.js` | Format display Bab 3 — langsung terasa oleh user |
| 7 | `puppeteer-core` + `@sparticuz/chromium` + `pdf-lib` | PDF generation Bab 19 — blocker untuk `Generated Document` |

### 🟡 Recommended (Sprint berikutnya)

| # | Library |
|---|---------|
| 8 | `vee-validate` + `@vee-validate/zod` |
| 9 | `pinia-plugin-persistedstate` |
| 10 | `filepond` + `cropperjs` |
| 11 | `fuse.js` |
| 12 | `sortablejs` + `vue-draggable-plus` |
| 13 | `@floating-ui/vue` |
| 14 | `nanoid` + `jsondiffpatch`/`diff` |
| 15 | `html2canvas` + `jspdf` (client preview cepat) |

### 🟢 Optional / Nice to Have

| # | Library |
|---|---------|
| 16 | `qrcode` + `bwip-js` |
| 17 | `driver.js` (onboarding tour) |
| 18 | `vue-sonner` |
| 19 | `pagedjs` |
| 20 | `@formkit/auto-animate` |
| 21 | `command-score` |

---

## 10. Instalasi Batch (Copy-Paste)

```bash
# dari apps/web/
# --- MUST HAVE ---
npm install @vueuse/core jexl json-logic-js lodash-es handlebars dompurify jsdom date-fns currency.js nanoid
npm install @tiptap/vue-3 @tiptap/core @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-image @tiptap/extension-text-align @tiptap/pm
npm install puppeteer-core @sparticuz/chromium pdf-lib

# --- RECOMMENDED ---
npm install vee-validate @vee-validate/zod pinia-plugin-persistedstate filepond vue-filepond filepond-plugin-image-preview filepond-plugin-file-validate-type cropperjs fuse.js sortablejs vue-draggable-plus @floating-ui/vue jsondiffpatch diff html2canvas jspdf qrcode bwip-js
npm install -D @types/dompurify @types/qrcode

# --- OPTIONAL ---
npm install driver.js vue-sonner pagedjs @formkit/auto-animate command-score
```

> **Catatan native addon:** `better-sqlite3` & `bcrypt` sensitif terhadap `npm install`. Setelah batch install, jalankan `npm rebuild better-sqlite3 bcrypt` jika dev server gagal start. `pdf-lib`, `jexl`, `handlebars`, `date-fns` aman (pure JS).

---

## 11. Peta Library → Bab Core Concept

```
Global Table (Bab 2,3,22)        → @vueuse/core, date-fns, currency.js, fuse.js, filepond/cropperjs, lodash-es
Computed & Expression (Bab 4,5)  → jexl, mathjs (subset), json-logic-js
Component (Bab 6-9)              → handlebars, nanoid, jsondiffpatch/diff, dompurify
Template Canvas (Bab 10-13)      → Tiptap + floating-ui + sortablejs + object-path + driver.js
Administration (Bab 14-16)       → vee-validate/zod, pinia-plugin-persistedstate, vue-sonner
Rendering (Bab 17-20)            → handlebars (server), puppeteer-core/chromium, pdf-lib, html2canvas/jspdf, pagedjs, qrcode/bwip-js
Cross-cutting (Bab 21,26,27)     → fuse.js, @vueuse/virtualList, command-score, auto-animate
```

---

## 12. Yang TIDAK Perlu Ditambah (Sudah Ter-cover)

| Kebutuhan | Sudah Ada | Jangan Tambah |
|-----------|-----------|---------------|
| UI Kit | `naive-ui` 2.44 | `element-plus`, `ant-design-vue` (duplikat) |
| State | `pinia` 4 | `vuex` |
| HTTP | `axios` + `useApi()` | `ky`, `ofetch` duplikat (Nuxt sudah punya `useFetch`) |
| Validation DTO | `zod` 3.24 | `yup`, `joi` |
| Auth | `jsonwebtoken` | `authjs` (butuh migration) |
| Animation page | `animejs` 4.5 | `gsap` (kecuali butuh timeline kompleks) — cukup `auto-animate` untuk list |
| Icon | `@vicons/carbon` | `lucide`, `heroicons` duplikat |

---

## 13. Referensi & Versi 2026

- Tiptap v2.8+ — https://tiptap.dev/docs/editor/getting-started/install
- VueUse v11+ — https://vueuse.org/
- Jexl 2.x — https://github.com/TomFrost/jexl
- json-logic-js 2.x — https://jsonlogic.com/
- date-fns 4.x — https получили format `dd-MM-yyyy`
- Puppeteer 23+ + @sparticuz/chromium 131+ — https://github.com/Sparticuz/chromium
- pdf-lib 1.17+ — https://pdf-lib.js.org/
- Handlebars 4.7+ — https://handlebarsjs.com/

> Dokumen ini adalah rekomendasi. Keputusan final sesuaikan dengan kapasitas bundle & strategi deploy (VPS vs serverless). Untuk validasi, cek `docs/architecture.md` dan `server/utils/orm-data-source.ts` sebagai sumber canonical entity.
