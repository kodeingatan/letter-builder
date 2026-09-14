# Implementation Plan — Task 09: Letter Builder UX Improvement (FASE 2 — Fix DELETE 409 + Error Hardening + Wiring)

## Overview

FASE 2 Implementation meng-wire prototype FASE 1 (`08-letter-builder-ux-improvement-ui-design` — 8 SVG wireframes + 9 Storybook files `LetterBuilder/*` + 3 komponen `ReferenceList/LoopingPicker/IDRInput`) ke halaman nyata. Fokus utama: **bug `[DELETE] "/api/doc-components/:id": 409 Server Error` tampil sebagai Server Error generik** → harus **`409 warning JSON + NAlert warning + NModal ReferenceList.vue` (bukan 500)**. Serta **audit & seragamkan semua error sejenis Task 05–07** (duplicate 409, validation 400, 404, 401/403, 500 PDF, div-by-zero, image allowlist, version bump, whitelist search/orderable, status transition, step_order unique, document_number unique) ke satu pola UX `NAlert/NEmpty/NFormItem + ReferenceList + retry tanpa reset + AccessDeniedAlert single`. Library: Tiptap `^3.31.3` + Naive UI `2.44` + Tailwind v4 + `@vicons/carbon` h-render. Verifikasi: `vue-tsc 0`, `test:unit`, `test:nuxt`, `test:e2e HEADLESS=1`, `build` + `build-storybook` PASS.

## Fase & Dependencies

- Fase: FASE 2 — Implementation (Fix DELETE 409 + Error Hardening + Wiring)
- Depends on: `tasks/08-letter-builder-ux-improvement-ui-design/README.md` (DONE + APPROVED 2026-09-14 — wireframe 8 SVG + Storybook 9 files + ReferenceList spec + Playwright flow E2E-01..06)
- Depends on backend: `tasks/05-document-engine` (DONE — expression/renderer/pdf), `tasks/06-master-data-ddl` (DONE — master_tables/columns mst_*), `tasks/07-template-administration` (DONE — doc_components/templates administrations Tiptap builder)
- User Flow: 16 Steps (Step 1-3 definisi, 4-7 browse+rows, 8-9 component, 10-12 template 3-pane, 13 administrasi, 14-15 wizard, 16 delete proteksi) + ALT-01..06 + ERR-01..10 + EC-01..10 + BR-001..008
- Referensi Design: `tasks/08-letter-builder-ux-improvement-ui-design/wireframes/*.svg` (desktop/tablet/mobile/builder-3pane/wizard/states/empty/validation/conflict) + `apps/web/stories/letter-builder/*.stories.ts` 9 files + `app/components/features/letter-builder/ReferenceList.vue` + `LoopingPicker.vue` + `IDRInput.vue` — tidak redesign, hanya wiring.
- Entrypoint: `tasks/09-letter-builder-ux-improvement/README.md` → `spec.md` → `flow-requirements.md` → `domain-api-ui.md` → `acceptance-tasks.md` → `verification.md`

## Prerequisites

- [ ] Task `08-letter-builder-ux-improvement-ui-design` DONE — Storybook `LetterBuilder/*` 9 files PASS (`npm run build-storybook` Vite 10.28s chunks LetterBuilder, 8 SVG di tasks/08/wireframes/)
- [ ] Dependencies installed (`npm install` di `apps/web/` — Tiptap ^3.31.3, Naive UI 2.44, Tailwind 4.3.3, better-sqlite3, puppeteer, sanitize-html sudah di package.json)
- [ ] Database ready (`db.sqlite` auto-sync dev, 16 EntitySchemas di `server/utils/orm-data-source.ts` + 4 migrations, `synchronize:true` dev)
- [ ] Design tokens `app/utils/naiveui-theme.ts` (primary #0075de hover #0069c4) + `app/assets/css/main.css` + `withProviders.ts` NConfigProvider themeOverrides tersedia
- [ ] Token JWT valid (admin@admin.com / P455w0rd!!!) dan seeder backfill `Master Data Read/Write`, `Component/Template/Administration/Document Read/Write` sudah di `server/services/seeder.service.ts`

## Implementation Steps

### Step 1: Backend audit & uniform 409 contract (CRITICAL — bug pemicu)

**Priority**: HIGH

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/server/api/doc-components/[id].delete.ts:1-24` — VERIFY `createError({ statusCode: error.statusCode ?? 500, message, data })` sudah benar (DONE, keep)
- `apps/web/server/api/doc-templates/[id].delete.ts:1-24` — VERIFY same pattern
- `apps/web/server/api/master-data/[slug].delete.ts:1-24` — VERIFY
- `apps/web/server/api/master-data/[slug].put.ts:1-27` — VERIFY `syncColumns` 409 bubbles via same handler
- `apps/web/server/api/administrations/[id]/runs/index.post.ts:1-26` — FIX missing `data` pass-through → tambahkan `data: (error as Error & { data?: unknown }).data` di `createError` agar `document_number` 409 (BR-006) mengembalikan JSON `data.references` bukan hanya message
- `apps/web/server/api/master-data/index.post.ts` — VERIFY duplicate slug 409 already handled in `master-data.service.createTable`
- `apps/web/server/api/administrations/index.post.ts` — VERIFY duplicate name/slug 409
- `apps/web/server/api/doc-components/index.post.ts` — VERIFY duplicate name 409
- `apps/web/server/api/doc-templates/index.post.ts` — VERIFY duplicate name/code 409

**Details**:
- Audit `grep -rn "statusCode = 409" server/services` — harus 7 hits tetap: `doc-components.service.ts:100`, `doc-templates.service.ts:196`, `master-data.service.ts:128,202,224`, `administrations.service.ts:327,187`
- Audit `grep -rn "createError" server/api` — harus seragam `statusCode: error.statusCode ?? 500, message: error.message, data: error.data` — fix hanya `runs/index.post.ts` yang currently missing `data`
- Pastikan semua 409 response JSON: `{ statusCode:409, message:"Component \"X\" is still used by: ...", data:{ references: [...] } }` dengan `Content-Type application/json` bukan HTML Server Error
- Tidak menambah endpoint baru, tidak ubah DB schema

**User Flow / AC mapping**:
- Covers: `User Flow Step 16 / ERR-05 / BR-003/BR-004/BR-006` → `AC-002` (bug pemicu), `AC-003` (all 409), `Flow→API #7, #6, #2, #15`

**Verification**:
- [ ] `grep -rn "statusCode = 409" server/services` == 7 hits — UT-01..04 mock
- [ ] `curl -X DELETE /api/doc-components/<id>` dengan ref → 409 JSON `data.references` — E2E-02/E2E-03 live 409 assertion
- [ ] Unit `doc-components.service.test.ts` + `doc-templates.service.test.ts` + `master-data.service.test.ts` PASS

### Step 2: Hardening `findReferences` exact-match (prevent false-positive EC-10)

**Priority**: HIGH

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/server/services/doc-components.service.ts:108-125` — VERIFY exact-match `'"componentId":"${name}"'` dan `'"componentId": "${name}"'` + `'"component":"${name}"'` — keep, add comment EC-10, no change to logic (O(n*m) tree traversal di-consider tapi ditolak untuk perf 200 templates)
- `apps/web/server/services/doc-templates.service.ts:100-117` — VERIFY `AdminStepSchema.find({where:{templateId:id}})` exact
- `apps/web/server/services/master-data.service.ts:280-312` — VERIFY `findReferences` + `findColumnReferences` deduplicate `Set`, relation `target_slug` + `display_column` check

**Details**:
- `DocComponentsService.findReferences` sudah exact string match bukan substring — validated by UT `EC-10` (test bahwa `name="Kop"` tidak match `"Kop Surat"`)
- `MasterDataService.findColumnReferences` returns `[...new Set(refs)]` — deduplicate `→display` refs
- `syncColumns` removed loop: per-column `findColumnReferences` → 409 with `statusCode=409` (add `data:{references}` to error for consistency — currently missing `data` in master-data.service:225, fix to add `data`)
- Decision `decided by /auto-task`: Keep `String.includes` exact quoted approach vs JSON.parse traversal — reason: `schemaJson` up to 1MB per template, `includes` O(n) faster than parse+traverse O(n*m) for 200 templates×200 nodes benchmark; false-positive via `name` substring blocked by quotes

**User Flow / AC mapping**:
- Covers: `EC-10` → `AC-002/AC-003/AC-008` + `UT-01..03`

**Verification**:
- [ ] `UT-01` `findReferences exact-match` — test `Kop` vs `Kop Surat` no leak
- [ ] `master-operation.test.ts` findReferences 409 deductible
- [ ] No change breaks existing `master-operation.test.ts` 8 tests PASS

### Step 3: Uniform 400/404 validation & status transition

**Priority**: MEDIUM

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/server/dto/master-data.dto.ts:1-123` — VERIFY discriminated union 13 types, slug regex `[a-z][a-z0-9_]{1,60}`, `CreateMasterTableSchema` min 1 max 100 — keep
- `apps/web/server/dto/persuratan.dto.ts:1-111` — VERIFY `TiptapDocSchema 1MB`, `DocNodeSchema`, `Code [a-z0-9-_]{2,60}`, `slug [a-z][a-z0-9-]{1,60}`, `step_order 0-100`, `MAX_JSON_BYTES 1MB` — keep
- `apps/web/server/services/master-data.service.ts:332-360` — VERIFY `findAllRows` searchable `400` + orderable `400` — keep
- `apps/web/server/services/doc-templates.service.ts:180-188` — VERIFY `assertStatusTransition DRAFT→PUBLISHED→ARCHIVED` — keep
- `apps/web/server/services/administrations.service.ts:114-158` — VERIFY `replaceSteps duplicate step_order 400 INV-002` + `assertMappingComplete DR-002 400` — keep

**Details**:
- No code change needed — audit only: all Zod safeParse returns `createError({ statusCode:400, message: parsed.error.errors[0].message })` with inline `NFormItem` mapping on client
- 404 `notFound` helper konsisten `statusCode:404` message `"Component 99 not found"` etc. already uniform
- Document decision: `validateAndCompute` image allowlist already at `master-data.service:537-544` — reuse same list as `renderer.service` sanitize allowlist

**User Flow / AC mapping**:
- Covers: `ERR-01/02/03 + BR-001..008 + INV-002` → `AC-004/AC-008` + `UT-04/05`

**Verification**:
- [ ] `test/unit/server/dto/master-data.dto.test.ts` + `persuratan.dto.test.ts` PASS
- [ ] `NT-02` master form validation inline — NFormItem error visible

### Step 4: PDF & operation & image hardening

**Priority**: MEDIUM

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/server/services/pdf.service.ts` — VERIFY `generatePdfFromHtml` isolates Chrome, keep
- `apps/web/server/services/doc-templates.service.ts:141-148` — VERIFY `previewPdf` catches pdf error? Currently NOT caught — add try/catch to return `pdfError` consistently like `administrations.service:228-236` OR document that `previewPdf` 500 is catch at API handler. Decision: keep as-is — `preview-pdf.post.ts` will throw 500 and client shows `NAlert error + Coba lagi` — matches spec ERR-09 contract (both paths valid, unit mocks both)
- `apps/web/server/services/administrations.service.ts:224-236` — VERIFY already `try generatePdfFromHtml` → `pdfError` + `status DRAFT` without `pdfPath` — keep
- `apps/web/server/services/expression.service.ts:232-248` — VERIFY div-by-zero → `null` (BR-007) — keep
- `apps/web/server/services/master-data.service.ts:443-482` — VERIFY `validateAndCompute` recompute + div-by-zero throw 400 — keep
- `apps/web/app/utils/master-operation.ts:11-20` — VERIFY `previewOperation` parity — keep

**Details**:
- Decision: No file change for PDF preview — spec says `500 → NAlert error + Coba lagi tanpa reset` — both `generatePdfFromHtml` throw → 500 via `createError 500` is acceptable UI contract, while `executeRun` already does `pdfError` soft success. Document in verification that mocked browser test covers both.
- `syncColumns` DDL rebuild already handles backup `storage/backups/` — keep

**User Flow / AC mapping**:
- Covers: `ERR-03/09 + BR-007/008 + FR-006` → `AC-004/AC-005/AC-006`

**Verification**:
- [ ] `expression.service.test.ts` div-by-zero null PASS
- [ ] `master-operation.test.ts` div-by-zero 400 + null PASS
- [ ] `administrations.service.test.ts` pdfError DRAFT still saves PASS

### Step 5: Helper `app/utils/error.ts` — 409 extractor (new, critical for UX)

**Priority**: HIGH

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/app/utils/error.ts:1-5` — MODIFY: extend from 5 lines → ~55 lines

**Details**:
```typescript
// Add after getErrorMessage:
export function isConflictError(e: unknown): boolean
  // checks e?.response?.status === 409 || e?.statusCode === 409 || e?.status === 409 || e?.data?.statusCode === 409

export function getConflictReferences(e: unknown): string[] | null
  // extracts from: e.response.data.data.references || e.response.data.references || e.data.references || e.response.data.data.data.references || e.data.data.references
  // returns string[] if array, null otherwise
  // Handles both $fetch (h3) shape { statusCode, message, data:{references} } and axios shape { response:{data:{data:{references}}} }

export function getConflictData(e: unknown): { references?: string[]; steps?: number; administrations?: number[] } | null
  // same fallback chain for steps/administrations (doc-templates 409 shape)

export function extractErrorData(e: unknown): unknown
  // generic data extractor for any status

// Keep getErrorMessage backward compatible — no breaking change for 401/403 interceptors
```
- Must handle `$fetch` error shape: H3 `createError` throws with `{ statusCode, statusMessage, message, data }` — client sees `error.data` OR `error.response._data` depending on fetch library. Axios shape via `useApi` is `error.response.data`. Helper tries both.
- Type safe: `unknown` + guarded access, no `any` leakage in public API (internal any cast allowed for compatibility)
- Add JSDoc explaining both shapes and Trace: AC-002/003, ERR-05

**User Flow / AC mapping**:
- Covers: `Step 16 / ERR-05 / AC-002/003/006` → `UT-06` + `NT-01`

**Verification**:
- [ ] `test/unit/utils/error.test.ts` extended — 7 original + 10 new 409 extractor tests PASS
- [ ] `vue-tsc` 0 error — error.ts typed correctly

### Step 6: Frontend wiring `ReferenceList.vue` modal untuk semua DELETE 409

**Priority**: HIGH

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/app/components/features/letter-builder/ReferenceList.vue:1-44` — READY but prop type is structured `Reference[]` with `type/name/slug/href` while backend returns `string[]` like `"template:SK Pengangkatan"` — ADAPT: component already supports string[] via new wrapper? Decision: Keep component as-is but pages will parse string[] → Reference[] before passing. No file change needed, but verify story `EnhancedComponents ReferenceConflict` still renders (it passes structured refs).
- `apps/web/app/pages/dashboard/components.vue:1-148` — MODIFY `handleDelete` catch:
  ```typescript
  import { getErrorMessage, isConflictError, getConflictReferences } from '~/utils/error'
  import { NAlert, NModal, NTag } from 'naive-ui' // add NModal/NAlert/NTag
  // Add: const conflictRefs = ref<string[] | null>(null); const showConflict = ref(false)
  // In catch: if (isConflictError(e) && getConflictReferences(e)) { conflictRefs.value = getConflictReferences(e); showConflict.value = true; return; } else message.error(...)
  // Template: add <NModal v-model:show="showConflict"><NAlert type="warning">Tidak dapat menghapus — masih dipakai</NAlert><ReferenceList :references="parsedRefs" data-testid="conflict-references" /><NTag>409</NTag></NModal>
  ```
  Pattern: handleDelete tries `store.removeComponent` → catch → `isConflictError` → show modal NOT toast. After deref, delete 200 → toast success.
- `apps/web/app/pages/dashboard/templates/index.vue:1-139` — MODIFY same 409 modal for `handleDelete` (steps/administrations shape: `data: { steps: number, administrations: number[] }` → render as strings `steps: X, administrations: [...]` in ReferenceList)
- `apps/web/app/pages/dashboard/administrations.vue:1-182` — MODIFY `handleDelete` + `handleSave` duplicate 409 handling (name/slug 409 should be `NAlert warning` inline not modal — per domain-api-ui 400 vs 409 table). Document: DUP 409 for create/update → inline `formError` NAlert warning, DELETE 409 not applicable (administrations remove detaches runs, no 409).
- `apps/web/app/components/features/master-data/MasterTableDataTable.vue:1-96` — MODIFY `handleDelete` catch 409 → NModal + ReferenceList (`data-testid="conflict-references"` + `NTag 409` + `Lihat` link to `/dashboard/master-data/<slug>` or `/dashboard/templates/<id>`). Must parse `error.response.data.data.references` via helper.
- `apps/web/app/components/features/master-data/MasterTableForm.vue:1-189` — MODIFY `handleSubmit` catch: if 409 column refs → `formError` = `NAlert warning` + show ReferenceList below form (syncColumns column 409). Currently only `formError.value = getErrorMessage(e)` — extend to handle 409 data.references display.
- `apps/web/app/stores/persuratan.ts:49-82` — VERIFY re-throw: store methods currently do `$fetch` without catch — error propagates to page catch (good). No change needed. But ensure `removeComponent/removeTemplate` do NOT swallow error (they currently correctly rethrow).
- `apps/web/app/stores/master-data.ts:107-110` — VERIFY `removeTable` same — rethrows

**Details**:
- Modal spec per `domain-api-ui.md` States Conflict409: `NModal width 600` (desktop) / `90vw` tablet / `100vw` mobile, `NAlert type="warning" title="Tidak dapat menghapus — masih dipakai"` + `NList` + `NTag 409` + `Lihat` anchor + footer `Tutup`. Use `aria-modal="true"`, `role="list"` + `role="listitem"`, `data-testid="conflict-references"` for E2E.
- Prefetch `ReferenceList` import: `import ReferenceList from '~/components/features/letter-builder/ReferenceList.vue'` — direct import.
- Do NOT add global `useApi` 409 interceptor — per-page modal keeps warning contextual (spec says 403 global, 409 per-page).
- For doc-templates 409 with `steps/administrations` shape, convert to display strings: `refs = errorData.steps ? [`${errorData.steps} step(s) in ${errorData.administrations?.length ?? 0} administration(s)`] : []`
- Ensure `message?.error` NOT called for 409 — only warning modal (per AC-002).

**User Flow / AC mapping**:
- Covers: `Step 16 / ERR-05 / BR-003/004` → `AC-002` (bug pemicu must), `AC-003` (all 409), `NT-01`, `E2E-02/03/04`

**Verification**:
- [ ] `mountSuspended` nuxt conflict test — mock DELETE 409 → `data-testid=conflict-references` visible + NTag 409 + Lihat link
- [ ] E2E `letter-builder-component.spec` — bug pemicu exact flow PASS
- [ ] No toast `Server Error` appears for 409 — getErrorMessage not called for 409

### Step 7: Wiring 400/404/500 UI seragam

**Priority**: MEDIUM

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/app/components/features/master-data/MasterRowForm.vue:1-199` — VERIFY already handles `formError` + `NAlert` + `previewOperation` warning `Pembagian nol` — keep, add `validationStatus="error"` mapping? Already implicit via formError. No change unless review requests inline per-field.
- `apps/web/app/components/features/master-data/MasterTableForm.vue:142` — Already has `formError NAlert error` — extend to support `warning` type for 409 vs `error` for 400 (dynamic `type` prop)
- `apps/web/app/pages/dashboard/documents/[slug].vue:51-77` — VERIFY `loadError NAlert error` + `DataTable` empty — keep, add `Coba lagi` retry button already via DataTable `error` prop
- `apps/web/app/pages/dashboard/templates/[id].vue` — READ file, ensure `publish` error 400 shows `NAlert` summary + focus first error — inspect and add if missing
- `apps/web/app/utils/error.ts` — ensure `getErrorMessage` fallback still shows array join for 400 `errors[]` (existing)

**Details**:
- 400 → inline `NFormItem validationStatus="error"` + `NAlert summary` + `ref.focus()` first error — existing pattern in `MasterTableForm` already does `getErrorMessage`; adding focus is minor enhancement but not required for gate — document as `decided by /auto-task`: keep existing `formError = getErrorMessage(e)` without focus jump (focus requires template refs not yet present) — satisfies AC-004 via NAlert summary
- 404 → `NAlert` + `NEmpty` + `Kembali ke Master Data` button — already in many pages via `loadError`, add explicit `Kembali` link where missing (master-data/[slug].vue not yet checked)
- 500 PDF → `NAlert error + Coba lagi` tanpa reset — `DocumentPreviewDrawer.vue` equivalent is `AdminWizard` + `Template publish` — verify retry handler does `emit('retry')` without resetting `search/sort/page` (DataTable already does `emit('retry')` without reset — keep)
- 403 → `AccessDeniedAlert.vue` single global already correct — ensure `grep addEventListener rbac-denied` == 1 hit (currently 1 in AccessDeniedAlert.vue only) — no per-page duplicate to remove

**User Flow / AC mapping**:
- Covers: `ERR-01/02/03/04/06/08/09/10` + `ALT-03..06` → `AC-004` + `NT-01` + `E2E-06`

**Verification**:
- [ ] `NT-01` 400 inline validation story — NAlert summary visible
- [ ] `E2E-06` errors spec — 401→/login, 403 single, 404 NEmpty+Kembali, 500 retry tanpa reset PASS

### Step 8: Wire Storybook 08 components + persistence & responsive

**Priority**: LOW

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/app/components/features/letter-builder/LoopingPicker.vue:1-64` — VERIFY already `Pilih semua indeterminate` — wire via import in `TemplateBuilder`? Currently not used in templates/[id].vue — For 09, wire by adding `LoopingPicker` usage in `templates/[id].vue` properties panel? Decision: `decided by /auto-task`: Keep LoopingPicker as story-only helper — builder 3-pane already has repeater editor via `NTree` etc. No new wiring needed to pass gate, but import LoopingPicker in templates builder page if easy without breaking existing. Otherwise document as story regression only.
- `apps/web/app/components/features/letter-builder/IDRInput.vue` — VERIFY `Intl.NumberFormat id-ID` — reuse in `MasterRowForm.vue` via `formatIDR/parseIDRInput` already (not directly via IDRInput component) — Decision: keep existing `formatIDR` usage, no need to swap to component — IDRInput story remains regression.
- `apps/web/stories/letter-builder/*` — NO CHANGE — regression verify `build-storybook` PASS
- `apps/web/app/composables/useDataTable.ts` (if exists) — verify `localStorage:master-data:<slug>:visibility` guard min 1 column — DataTable already has column visibility toggle with localStorage — keep
- `apps/web/app/pages/dashboard/master-data/[slug].vue` — verify `DataTable` toolbar kanonis 320/160 + Restart + Settings + Reset — keep

**Details**:
- No visual redesign — keep tokens Notion #0075de, #f6f5f4, #e6e6e6, Inter trackings
- Responsive desktop 1280 3-pane 260|1fr|320 vs tablet drawer vs mobile NTabs — already via existing CSS — no change
- `prefers-reduced-motion` already in `app/assets/css/main.css` — keep

**User Flow / AC mapping**:
- Covers: `FR-007..015` + `AC-005/006/007` → `NT-02/03/04`

**Verification**:
- [ ] `npm run build-storybook` PASS — LetterBuilder 9 files chunks
- [ ] `npm run build` 20MB baseline PASS

### Step 9: Tests (QA — act as QA Engineer) & docs

**Priority**: HIGH

**Fase**: FASE 2

**Files to create/modify**:
- `apps/web/test/unit/utils/error.test.ts:1-35` — MODIFY: extend to 15 tests covering `isConflictError`, `getConflictReferences`, `getConflictData`, `extractErrorData` (UT-06)
- `apps/web/test/unit/server/services/doc-components.service.test.ts` — CREATE (UT-01) — 8 tests: duplicate name 409, remove 409 refs exact-match, isLooping BR-003 400, etc.
- `apps/web/test/unit/server/services/doc-templates.service.test.ts` — already exists (from 07) — VERIFY covers UT-02 (duplicate name/code 409, remove 409 steps, publish 400, version bump)
- `apps/web/test/unit/server/services/master-data.service.test.ts` — CREATE? Already `master-operation.test.ts` covers much, but need dedicated `master-data.service.test.ts` for UT-03 whitelist 400 + column refs + syncColumns 409 — OR extend `master-operation.test.ts` — Decision: create `apps/web/test/unit/server/services/master-data.service.test.ts` for explicit UT-03 coverage (reuse in-memory DataSource pattern)
- `apps/web/test/unit/server/services/administrations.service.test.ts` — already exists — VERIFY covers UT-04 (duplicate slug, document_number 409, step_order 400, DR-002)
- `apps/web/test/nuxt/letter-builder-conflict.test.ts` — CREATE (NT-01) — mountSuspended + NMessageProvider + mock $fetch DELETE 409 → assert `data-testid=conflict-references` + NTag 409 + Lihat link; cancel tutup; 200 delete success toast; 400 inline; pdf retry
- `apps/web/test/e2e/letter-builder-component.spec.ts` — CREATE / REFINE (E2E-03) — bug pemicu flow + Tiptap binding
- `apps/web/test/e2e/letter-builder-master-protect.spec.ts` — VERIFY already exists (E2E-02) — extend with UI modal assertion (currently only API request tests)
- `apps/web/test/e2e/letter-builder-master.spec.ts` — REFINE from `master-data.spec.ts` to cover E2E-01 happy master
- Other E2E stubs if needed: `letter-builder-template.spec.ts`, `letter-builder-wizard.spec.ts`, `letter-builder-errors.spec.ts` — create minimal skeletons mapping to E2E-04..06 if not existing
- `apps/web/test/unit/app/utils/master-operation.test.ts` — VERIFY already UT-06 parity
- `tasks/task-logs.md:26,168-176` — MODIFY update gate Implemented [x]
- `tasks/README.md` — VERIFY update if needed

**Details**:
- UT pattern reuse `master-operation.test.ts` mock `vi.mock('../../../../server/utils/db', ...)` + `DataSource(':memory:', synchronize:true)`
- NT pattern reuse `master-data.form.test.ts` withProvider + `mountSuspended` + `createPinia()` + `NMessageProvider`
- E2E pattern reuse `master-data-protect.spec.ts` loginAs helper + request API fixture Bearer admin, then page goto + assert conflict-references visible
- Coverage target 100% Flow 16/16, AC 8/8, BR 8/8, EC 10/10, ERR-01..10

**User Flow / AC mapping**:
- Covers: All `AC-001..008` + `Test Plan UT-01..06, NT-01..04, E2E-01..06`

**Verification**:
- [ ] `npm run test:unit` — UT-01..06 + existing 228 PASS
- [ ] `npm run test:nuxt` — NT-01..04 + existing 67 PASS
- [ ] `npm run test:e2e` HEADLESS=1 — E2E-01..06 PASS (or SKIP if Chrome missing for PDF)
- [ ] `vue-tsc --noEmit` 0 error
- [ ] `npm run build` + `npm run build-storybook` PASS

## File Change Summary

| Action | File | Description | Fase | User Flow / AC |
|--------|------|-------------|------|----------------|
| MODIFY | `server/api/administrations/[id]/runs/index.post.ts` | Add `data` passthrough in createError for document_number 409 | FASE 2 | Step 15, AC-003, BR-006 |
| MODIFY | `server/services/master-data.service.ts` | Add `data:{references}` to column remove 409 error (line 224) + deduplicate Set | FASE 2 | Step 16, AC-003, EC-10 |
| MODIFY | `app/utils/error.ts` | Add `isConflictError`, `getConflictReferences`, `getConflictData`, `extractErrorData` helpers | FASE 2 | Step 16, AC-002/003, UT-06 |
| MODIFY | `app/pages/dashboard/components.vue` | Wire 409 modal NModal+ReferenceList data-testid=conflict-references NTag 409 Lihat | FASE 2 | Step 8-9/16, AC-002 |
| MODIFY | `app/pages/dashboard/templates/index.vue` | Same 409 modal for steps/administrations shape | FASE 2 | Step 10-12/16, AC-003 |
| MODIFY | `app/pages/dashboard/administrations.vue` | Duplicate 409 inline warning vs modal distinction | FASE 2 | Step 13, AC-003 |
| MODIFY | `app/components/features/master-data/MasterTableDataTable.vue` | 409 modal for MasterTable delete | FASE 2 | Step 1-3/16, AC-003 |
| MODIFY | `app/components/features/master-data/MasterTableForm.vue` | 409 warning inline + ReferenceList for column remove | FASE 2 | Step 2, AC-003 |
| MODIFY | `app/pages/dashboard/master-data/[slug].vue` | Add 404 NEmpty+Kembali + pdf retry Coba lagi wiring if missing | FASE 2 | Step 4-7, AC-004 |
| MODIFY | `app/pages/dashboard/documents/[slug].vue` | Verify wizard document_number 409 inline + pdf retry | FASE 2 | Step 14-15, AC-006 |
| MODIFY | `test/unit/utils/error.test.ts` | Extend UT-06 10 tests for 409 helpers | FASE 2 | AC-002/003 |
| CREATE | `test/unit/server/services/doc-components.service.test.ts` | UT-01 exact-match + 409 refs | FASE 2 | AC-002 |
| CREATE | `test/unit/server/services/master-data.service.test.ts` | UT-03 whitelist + refs (if not reusing master-operation) | FASE 2 | AC-003/005 |
| CREATE | `test/nuxt/letter-builder-conflict.test.ts` | NT-01 conflict modal + 400 + 403 single + pdf retry | FASE 2 | AC-002/003 |
| CREATE | `test/e2e/letter-builder-component.spec.ts` | E2E-03 bug pemicu live | FASE 2 | AC-002, Step 8-9 |
| VERIFY | `server/services/doc-components.service.ts` | Audit exact-match 409 already correct — no change | FASE 2 | AC-002 |
| VERIFY | `server/services/doc-templates.service.ts` | Audit publish+steps 409 — no change | FASE 2 | AC-003 |
| VERIFY | `app/components/features/letter-builder/ReferenceList.vue` | No change — story regression | FASE 2 | AC-007 |
| VERIFY | `app/components/common/AccessDeniedAlert.vue` | Single listener — no duplicate | FASE 2 | AC-007 |
| VERIFY | `stories/letter-builder/*.stories.ts` 9 files | No change — build-storybook regression | FASE 2 | AC-007 |
| MODIFY | `tasks/task-logs.md` | Gate Implemented [x] + detail notes | FASE 2 | — |

## Test Plan (QA — Bertindak sebagai QA Engineer)

| Test ID | Jenis | File | Mengcover (User Flow / AC / BR) | Ekspektasi Given/When/Then |
|---------|-------|------|----------------------------------|-----------------------------|
| UT-01 | unit | `test/unit/server/services/doc-components.service.test.ts` | FR-007/014, BR-003/004, Step 8-9/16, AC-002 | Given Kop + SK template referencing Kop When remove Kop Then 409 refs=["template:SK"] exact-match EC-10 not leak "Kop"→"Kop Surat"; is_looping without item.* → 400 BR-003 |
| UT-02 | unit | `test/unit/server/services/doc-templates.service.test.ts` (existing) | FR-011/014, BR-002/004/005, AC-003 | Given SK template + Adm step referencing When remove template Then 409 steps/administrations; duplicate name/code 409; publish without content 400; version bump 1→2 |
| UT-03 | unit | `test/unit/server/services/master-operation.test.ts` + `master-data.service.test.ts` | FR-002/003/006/014, BR-001/003/006/007, AC-003/004/005 | Given pegawai + relation target When duplicate slug Then 409 BR-001; removeTable with refs Then 409 refs peg:jabatan; findColumnReferences display_column; syncColumns remove column with ref 409; whitelist is_searchable/orderable 400 BR-006; div-by-zero null BR-007; image allowlist 400 |
| UT-04 | unit | `test/unit/server/services/administrations.service.test.ts` (existing) | FR-012/013/014, BR-004/006, INV-002, AC-003 | Given Adm with 2 steps When duplicate name/slug Then 409; replaceSteps duplicate order 400 INV-002; DR-002 incomplete mapping 400; document_number duplicate 409 BR-006; executeRun pagebreak + pdfError DRAFT |
| UT-05 | unit | `test/unit/server/dto/documents.dto.test.ts` + `test/unit/server/services/renderer.service.test.ts` | DR-004/005, BR-008, AC-004 | Given DocNode depth>10 total>200 Then 400; sanitize javascript: → escape; assertTreeLimits; image URL allowlist |
| UT-06 | unit | `test/unit/utils/error.test.ts` (extend) | ERR-05, AC-002/003 | Given 409 shapes: axios response.data.data.references vs $fetch data.references vs nested data.data When isConflictError/getConflictReferences Then true + extracts refs; getErrorMessage fallback; array join; getConflictData steps/administrations |
| NT-01 | nuxt | `test/nuxt/letter-builder-conflict.test.ts` (new) | Step16, ERR-05, AC-002/003/004 | Given mount components.vue with mock $fetch DELETE 409 When Trash click → NPopconfirm → DELETE 409 Then NModal ReferenceList visible data-testid=conflict-references + NTag 409 + Lihat link; cancel tutup; 200 → toast; 400 inline; 403 single; pdf retry tanpa reset |
| NT-02 | nuxt | `test/nuxt/master-data.form.test.ts` (existing refine) | Step 6-7, FR-004/005/006, BR-006, AC-005 | Given pegawai schema 13 types When mount MasterRowForm Then 13 labels + IDRInput Intl realtime + RelationPicker search/sort/checkbox radio vs multiple + visibility persist localStorage:master-data:* + empty 404 |
| NT-03 | nuxt | `test/nuxt/template-builder.test.ts` + `test/nuxt/component-editor.test.ts` (refine) | Step 8-15, FR-007/008/009/010, AC-006 | Given TemplateBuilder 3-pane When drag NTree → Canvas + keyboard Up/Down + properties live Then ghost opacity + ring #0075de + pilih semua indeterminate; Tiptap right-click BindingPalette + +Binding 44px fallback + invalid binding badge red #EF4444 |
| NT-04 | nuxt | `test/nuxt/imports.test.ts` + foundation tests | Step 4-5, FR-003, AC-007 | Given DataTable kanonis When mount Then toolbar 320/160 + Restart aria-label + Settings visibility + pagination ID Menampilkan dari total; rbac-denied → single AccessDeniedAlert (grep 1 hit, useMessage 0 unguarded) |
| E2E-01 | e2e | `test/e2e/letter-builder-master.spec.ts` (refine master-data.spec) | Step 1-7, UC-01..03, AC-001/005, BR-001/006 | Given Super Admin via request token When POST /api/master-data create Pegawai 5 cols Then 201 mst_pegawai + menu; browse search searchable sort orderable visibility persist pagination 20 → Menampilkan {from}-{to} dari {total} |
| E2E-02 | e2e | `test/e2e/letter-builder-master-protect.spec.ts` (refine master-data-protect) | ERR-01/04/05/07, ALT-01/02, EC-06, AC-002/003 | Given pegawai + relation child When DELETE referenced table → 409 ReferenceList modal bukan Server Error: click Trash → NPopconfirm → DELETE 409 → assert data-testid=conflict-references visible NTag 409 Lihat link → Tutup list remain; column 409; 403 Viewer vs Admin; empty CTA |
| E2E-03 | e2e | `test/e2e/letter-builder-component.spec.ts` (new) | Step 8-9, FR-007/014, BR-003, AC-002 | Given create Kop right-click binding + Daftar looping item.* When delete Kop dipakai Template → 409 → ReferenceList template:SK NTag 409 → delete Template dulu → delete Kop 200; blocking isLooping BR-003 400 |
| E2E-04 | e2e | `test/e2e/letter-builder-template.spec.ts` (new) | Step 10-12, FR-008..011, BR-002/005, AC-003/006 | Given Builder 3-pane When drag Kop+Daftar + embed requirement master/manual/system + looping pilih semua + auto-form + preview HTML/PDF (skip 500 Chrome absen) + publish BR-002 + version bump 1→2 Then delete Template dipakai steps → 409 → ReferenceList steps/administrations |
| E2E-05 | e2e | `test/e2e/letter-builder-wizard.spec.ts` (new) | Step 13-15, UC-06/07/10, FR-012/013, BR-004/005, AC-006, EC-02 | Given create Adm 2 steps + wizard NSteps guided When isi data step1 + mapping + Tambah Step N + review pagebreak + PDF → save run version snapshot → menu per surat → document_number duplicate 409 warning inline |
| E2E-06 | e2e | `test/e2e/letter-builder-errors.spec.ts` (new) | ERR-01..10, ALT-05/06, EC-01..10, BR-007/008, AC-004/007/008 | Given various auth states When 401 token hilang → /login; Viewer →403 single data-testid=access-denied; 404 slug NEmpty+Kembali; 500 PDF Coba lagi tanpa reset data; div-by-zero FR-006; rename relation EC-04 invalid badge; upload >5MB; mobile +Binding fallback; reduced-motion 0.01ms |

- Unit: `npm run test:unit` — semua UT PASS (228 existing + UT-06 new ≥80% logic baru)
- Nuxt: `npm run test:nuxt` — semua NT PASS (67 existing + NT-01 conflict 409 variant visible, data-testid single length 1)
- E2E: `npm run test:e2e` — semua E2E PASS HEADLESS=1 Chromium, video retain-on-failure, SLOWMO 0, reuseExistingServer:true :3000 — 409 live via $fetch Bearer admin@admin.com
- Coverage: User Flow 16/16 (100%), AC 8/8 (100%), BR 8/8 (100%), EC 10/10 (100%), ERR-01..10 (100%)

## Verification Plan (QA)

### Automated (wajib lolos)

- [ ] Typecheck (`npx vue-tsc --noEmit` dari `apps/web/`) — 0 error — `error.ts` union typed, no `any` leak
- [ ] Unit (`npm run test:unit`) — traceability UT-01..06 → FR/BR/DR/INV → 228+ existing + UT-06 new 100%
- [ ] Nuxt (`npm run test:nuxt`) — traceability NT-01..04 → UI States (loading/empty/error/success/validation/permissionDenied/conflict409/draft/invalidBinding) → 67+ existing PASS
- [ ] API/Integration (via unit service direct :memory:): all GET/POST/PUT/DELETE + 409 duplicate/references + 400 Zod + 404 + 401/403 matrix `requireApiAccess method+URL matchUrlPattern` PASS
- [ ] E2E (`npm run test:e2e` HEADLESS=1 chromium) — E2E-01..06 PASS retries 2, video retain-on-failure:
  - `letter-builder-master.spec` — happy master definisi→browse→row→schema
  - `letter-builder-master-protect.spec` — **delete referenced → 409 + ReferenceList modal bukan Server Error** — assertion `page.getByTestId('conflict-references')`
  - `letter-builder-component.spec` — **bug pemicu DELETE /api/doc-components/:id 409 → ReferenceList template:SK**
  - `letter-builder-template.spec` — builder drag+keyboard + publish BR-002 + delete 409 steps
  - `letter-builder-wizard.spec` — administrasi 2 steps + wizard NSteps + document_number 409
  - `letter-builder-errors.spec` — 401→/login +403 single+404 slug+500 PDF retry+div-by-zero+mobile +Binding
- [ ] Storybook build (`npm run build-storybook` dari `apps/web/`) — sukses Vite 10.28s chunks LetterBuilder 9 files + foundation 3 files di `storybook-static/index.json`
- [ ] Build (`npm run build` dari `apps/web/`) — sukses 20.1MB baseline, `npx nuxt prepare` + db 12+ master + doc_* tables auto-sync

### Manual / QA Checklist

- [ ] **Database verification** — 16 EntitySchemas `appEntities` + appMigrations Baseline + DropDynamic + CreateMasterTables + CreatePersuratanTables + `isMasterPhysicalTable` ignore mst_*, UNIQUE name/slug/code/document_number, FK CASCADE vs RESTRICT — DR/INV PASS via UT-01..05
- [ ] **Permission verification** — 401/403 matrix per API table — viewer Read → GET 200 DELETE 403 + rbac-denied 1→1 (`grep -rn addEventListener.*rbac-denied` 1 hit); Admin Write → 200/409 sesuai proteksi — NT-04 + E2E-06
- [ ] **Business Rules verification** — BR-001 slug regex UT 400; BR-002 publish guard UT+NT badge + E2E publish; BR-003 loop item.* UT 400 + NT invalid badge; BR-004 refs 409 UT+NT conflict + E2E live; BR-005 version bump UT re-fetch version+1; BR-006 is_searchable/orderable 400 + document_number 409 UT+E2E; BR-007 div-by-zero null+warning UT+E2E; BR-008 upload 5MB/1MB DocNode limit 400 UT+NT
- [ ] **Edge Cases verification** — EC-01 draft autosave banner; EC-02 500 row cap warning; EC-03 image hilang placeholder; EC-04 rename target invalid badge; EC-05 mobile +Binding 44px; EC-06 100 col cap; EC-07 select_multiple JSON; EC-08 PDF timeout retry; EC-09 409 race 404; EC-10 exact-match — UT-01 + review — all EC-01..10 PASS via NT-01..03 + E2E-03..06
- [ ] **States verification** — loading NSpin/NSkeleton + empty NEmpty+CTA pill primary + error NAlert+Coba lagi retry tanpa reset + success Berhasil + validation NFormItem + NAlert summary + permissionDenied single data-testid=access-denied + **conflict 409 ReferenceList data-testid=conflict-references + NTag 409 + Lihat** + draft + invalid binding — NT States variants + Storybook LetterBuilder/States a11y PASS
- [ ] **409 fix manual replay** — reproduksi exact bug DELETE /api/doc-components/xx: buat Component X, Template Y embed X, `curl DELETE` → 409 JSON data:{references:["template:Y"]} Content-Type json bukan HTML; UI /dashboard/components klik Trash → NPopconfirm → confirm → NModal ReferenceList template:Y NTag 409 bukan Server Error toast; tutup list remain; hapus Template → delete Component 200 success
- [ ] **Responsive verification** — desktop 1280 3-pane 260|1fr|320 vs tablet 768 drawer vs mobile 375 NTabs + 44px binding + toolbar column wrap — wireframe desktop/tablet/mobile.svg + Storybook viewport addon PASS — AC-D06 08 tidak regresi
- [ ] **Accessibility verification** — keyboard Tab→+Buat→form→Simpan→Trash→NPopconfirm Enter→ReferenceList Tab→Tutup Esc + focus trap NModal/NDrawer + NSteps aria-current + aria-grabbed + aria-label icon-only + live region toast + contrast 18:1/4.6:1 AA + prefers-reduced-motion 0.01ms — Storybook a11y 0 critical
- [ ] **UI/UX verification** — pixel-perfect vs 08 mockup + Storybook stories letter-builder (Naive UI direct import + Tailwind bg-[#f6f5f4] border-[#e6e6e6] text-[#0075de] + NConfigProvider themeOverrides) + foundation DataTable 320/160 + PageShell head16×20 body24 radius12 + sidebar 220/72 #0075de — no hard-coded outside token, no NDescriptions, h(NIcon) Carbon konsisten
- [ ] **Storybook verification** — npm run storybook :6006 LetterBuilder/* 9 stories × variants + foundation/* + controls + viewport + a11y; build-storybook sukses chunks LetterBuilder di storybook-static
- [ ] **User Flow verification** — Steps 16 + ALT 6 + ERR 10 + Flow→UI/API mapping ada AC-001..008 dan ada E2E-01..06 PASS + traceability User Flow ↔ AC ↔ Test ID 100% (Test Plan table)
- [ ] **Acceptance verification** — AC-001..008 GWT PASS + grep remove References 7 hits + frontend isConflictError/getConflictReferences + ReferenceList import 3+ places — tasks/task-logs.md updated

## Risk Assessment

| Risk | Impact | Mitigation | Related User Flow / AC |
|------|--------|------------|------------------------|
| `findReferences` includes false-positive bila nama template mengandung quotes/spesial karakter | Medium — 409 tidak muncul atau muncul salah tempat | Keep exact quoted match + UT EC-10 untuk substring "Kop" vs "Kop Surat" + review JSON.parse traversal sebagai consider future | Step 16, AC-002, EC-10 |
| `error.response` shape mismatch ($fetch h3 vs axios) → ReferenceList modal tidak muncul, fallback ke generic toast Server Error | High — bug pemicu tetap terasa | Helper `getConflictReferences` handle 5 shapes fallback + unit test both shapes + NT mock both `error.response.data.data` and `error.data` | Step 16, AC-002/003, UT-06/NT-01 |
| NPopconfirm → NModal double-modal UX jarring | Low — user klik confirm lalu modal baru | Keep NPopconfirm as guard then 409 modal — documented as Penyesuaian dari design di domain-api-ui.md; alternatively single NDialog confirm that switches to ReferenceList bila 409 | Step 16, AC-002 |
| Puppeteer Chrome missing → PDF E2E timeout 30s or E2E fail | Medium — CI red but not code bug | Unit mock `setBrowserLauncher` fake launcher + E2E skip when chrome missing via `test.skip` + contract verify via unit (existing 5 pass/1 skip precedent) | ERR-09, AC-004, E2E-04/05 |
| LocalStorage key collision `datatable-*` vs `master-data:slug:visibility` | Low — visibility not persist | Use distinct keys `localStorage:master-data:<slug>:visibility` vs `datatable-*` existing foundation keys — try/catch JSON.parse guard | Step 4-5, AC-005, ALT-03 |
| ReferenceList string[] vs structured Reference[] type mismatch → TS error | Low — build fail vue-tsc | Pages parse string[] refs → Reference[] via `refs.map(r => {const [type,name]=r.split(':'); return {type,name,slug:name,href:mapHref(type,name)}})` — typed helper | Step 16, AC-002/003 |
| Builder 3-pane wiring LoopingPicker not used → test NT-03 brittle | Low — Storybook regression still PASS but wizard E2E missing looping pilih semua | Document LoopingPicker as story-only helper fallback; keep HTML5 draggable native as design cover both; add LoopingPicker import only if trivial | FR-010, AC-006 |
| E2E parallel file race (master-data-protect delete parent before child) → 200 vs 409 flake | Medium — flaky E2E | Ensure each E2E self-sufficient table name (`e2e_parent` vs `e2e_*` unique per test) + cleanup child before parent; device HEADLESS reuseExistingServer true but testIsolation per file | EC-09, AC-003 |

## Estimated Effort

- Files to create: 5 (doc-components.service.test UT-01, master-data.service.test UT-03, letter-builder-conflict NT-01, letter-builder-component E2E-03, optional template/wizard/errors E2E 3 files skeleton) + docs
- Files to modify: 10 (runs 409 data, master-data column 409 data, error.ts helper, components.vue, templates/index.vue, administrations.vue, MasterTableDataTable.vue, MasterTableForm.vue, task-logs.md, error.test.ts)
- Files to verify (no change): 8 (doc-components.service, doc-templates.service, expression.service, pdf.service, master-operation.ts, ReferenceList.vue, AccessDeniedAlert.vue, stories 9 files)
- Estimated time: 8 hours (backend audit 1h, helper 1h, frontend wiring 3h, tests 2h, verify/build/storybook/e2e 1h)
- Fase: FASE 2 — Implementation (Fix DELETE 409 + Hardening 05-07 + Wiring) — no migration, no new entity, no permission matrix change

## Execution Order

1. Backend audit: uniform 409 createError data passthrough (Step 1) → findReferences hardening (Step 2) — verify grep 7 hits
2. Helper: app/utils/error.ts 409 extractors (Step 5) — unit test UT-06 — vue-tsc 0
3. Frontend wiring primary fix: components.vue + MasterTableDataTable.vue 409 modal (Step 6) — NT-01 mock conflict visible — E2E-02 live 409 not Server Error
4. Secondary wiring: templates/index.vue + MasterTableForm.vue + administrations.vue (Step 6) — all 409 shapes
5. Wiring 400/404/500 seragam (Step 7) — NT inline validation + 404 NEmpty+Kembali + pdf retry
6. Operations & PDF hardening audit (Step 4) + responsive/persistence (Step 8) — no code, just verify
7. Tests: UT-01 doc-components + UT-03 master-data whitelist/refs + UT-04 administrations already + NT-01 conflict + E2E-03 component bug pemicu + E2E-04/05/06 templates/wizard/errors skeletons (Step 9) — run test:unit + test:nuxt
8. Storybook + build verification: npm run build-storybook + npm run build + vue-tsc — LetterBuilder 9 files regression
9. E2E headed/HEADLESS manual replay: curl DELETE 409 JSON + UI Trash→ReferenceList modal → deref delete 200 + gate check task-logs Implemented [x]
10. Docs: tasks/task-logs.md Detail per Task 09 + tasks/README.md + CHANGE LOG

## Assumptions / Open Questions (decided by /auto-task)

- 409 visual = `NAlert type="warning"` kuning #FFFBEB/#FDE68A (bukan error merah) — decided by /auto-task reason: spec verification.md Open Questions Q1 prefers warning agar beda dari 500 error; story conflict.svg juga warning; kode prop type="warning" — if review prefers error, one prop change.
- `findReferences` exact-match via `includes('"componentId":"<name>"')` retained vs JSON.parse traversal — decided by /auto-task reason: perf O(n) vs O(n*m) + existing test EC-10 prevents false-positive via quoted delimiter; traversal not needed for 1MB cap.
- Helper handles 5 error shapes (axios vs $fetch) — decided by /auto-task reason: bug root was `error.response.data.data.references` undefined fallback to generic message; helper tries `e.response.data.data.references || e.data.references || e.response.data.references || e.data.data.references || e.response.data.data.data.references`.
- `LoopingPicker.vue` + `IDRInput.vue` remain story-only helpers for 09 — decided by /auto-task reason: builder wiring already via `NTree` + `formatIDR` reuse; swapping to components not required to pass AC-005/006 gate, reduces risk; story regression still PASS.
- `runs/index.post.ts` fix adds `data` passthrough — decided by /auto-task reason: currently missing `data` field in catch would turn duplicate document_number 409 into 500 fallback without refs; must add to match spec domain-api-ui DELETE 409 contract.
- `MasterDataService.syncColumns` column remove 409 missing `data:{references}` — decided by /auto-task fix to add `error.data = { references: refs }` before throw, for frontend ReferenceList display.
- No global 409 interceptor — decided by /auto-task reason: spec explicitly says per-page modal for context, 403 global via rbac-denied event; adding global 409 would duplicate warning non-contextual.
- `@vueuse/core` / `vue-draggable-plus` not installed 09 — decided by /auto-task reason: fallback HTML5 draggable native already design-ready per assumption in verification.md; install optional only if helpers materially improve `useStorage`/`useDraggable` without token change.

## Related Knowledge

- `AGENTS.md` — EntitySchema plain-object service, Zod DTO, defineEventHandler, useApi Bearer, Tailwind no-preflight, h(NIcon)
- `docs/PRD.md` § RBAC + Table Browse + API/Routes + Seed (RBAC-Only after 01)
- `docs/architecture.md` § RBAC Architecture + Table Browse DataTable kanonis 320/160 + PageShell + Storybook Foundation + AppLayout 220/72
- `docs/database.md` § 16 EntitySchemas (9 RBAC + MasterTable/Column + DocComponent/Template/Administration/AdminStep/Document) + isMasterPhysicalTable drift ignore
- `docs/design-system.md` § Notion tokens #0075de/f6f5f4/e6e6e6 Inter radius 12/16 pill full
- `tasks/08-letter-builder-ux-improvement-ui-design/*` — FASE 1 acuan pixel-perfect
- Code canonical: `server/services/{doc-components,doc-templates,master-data,administrations,expression,renderer,pdf}.service.ts` + `server/dto/{master-data,persuratan}.dto.ts` + `app/utils/error.ts` + `app/stores/{master-data,persuratan}.ts`

