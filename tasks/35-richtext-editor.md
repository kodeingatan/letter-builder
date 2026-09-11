# Task 35 — Rich Text Editor Implementation

## Status

TODO

## Objective

Mengimplementasikan editor rich text sungguhan mengacu design Task 34 untuk kolom `richtext`, teks template, dan requirement `richtext` — dengan sanitasi berlapis dipertahankan dan tanpa `document.execCommand`.

## Context

Backend dan pipeline sudah render HTML mentah + sanitasi (`pipeline.ts` alias + `sanitizeOutputHtml`, `CompositionNodeView v-html`, sanitizer server). Yang hilang hanya sisi authoring (textarea + `execCommand`). Task ini menutup gap kritis #1. Keputusan teknologi (library vs native) datang dari Task 34; implementasi mengikuti keputusan itu.

## Scope

### In Scope

- `RichTextEditor` + `RichTextViewer` dipakai di `DynamicForm` (`richtext`), canvas text node, requirement `richtext`, dan titik render yang kini `v-html` mentah
- Toolbar sesuai 34, paste-guard, image upload/browse via storage existing, source-HTML toggle tervalidasi
- Sanitasi 3 lapis dipertahankan (client paste + server save + server validate/render); tanpa `execCommand` di mana pun
- Validasi server `richtext` tetap string HTML tersanitasi (perketat bila diputuskan: tolak payload berbahaya dengan 422 + pesan)

### Out of Scope

- Layout print-ready (non-goal); fungsi ekspresi baru (37); perubahan pipeline selain viewer

## Dependencies

- `tasks/34-richtext-editor-ui-design.md` — (WAJIB: keputusan teknologi + prototype)
- Tasks 26/27 (fondasi), Task 28/29 (konteks form)

## User Flow

> MANDATORY — KONSISTEN dengan Task 34.

### Diagram

```text
[Entry] → {Editor} --(input)--> {POST/PUT /api/data/:table} --(422?)--> {Inline}
  --(saved)--> {Viewer = render identik}   --(paste)--> {Sanitized + notice}
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Operator | Edit richtext | Row form → `POST/PUT /api/data/:table` | HTML tersimpan |
| 2 | Operator | Paste/upload | Editor (client + storage) | Aman + tersimpan |
| 3 | Operator | Lihat hasil | Browse/detail/dokumen | Identik tersanitasi |
| 4 | Designer | Edit teks template | Canvas | Draft konsisten |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Mode source | Editor → toggle | Validasi HTML |
| ERR-01 | HTML berbahaya | Save → 422/strip | Pesan + konten aman |
| ERR-02 | Upload gagal | Editor → retry | URL manual fallback |

### Flow → UI Mapping

| Flow Step | Halaman (34) | Component | State |
|-----------|--------------|-----------|-------|
| Step 1–2 | row form | `RichTextEditor` | editing/source/uploading/error |
| Step 3 | browse/detail/doc | `RichTextViewer` | default/empty |
| Step 4 | canvas | inline rich | draft |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1 | POST/PUT | `/api/data/:tableName/*` | HTML tersanitasi (Zod + sanitizer) |
| Step 2 | POST | `/api/settings/upload` atau storage existing | File rules existing |

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Authoring dan rendering richtext WYSIWYG, aman, dan konsisten di seluruh modul.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Operator | Isi richtext | `Data:{table}:Write` |
| Designer | Teks template | Designer+ |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Operator | Format + gambar + simpan | Render identik | Step 1–3 |
| UC-02 | Operator | Paste berbahaya | Distrip + notice | Step 2 |
| UC-03 | Designer | Edit teks di canvas | Konsisten editor | Step 4 |

### Functional Requirements

- FR-001: Toolbar + paste-guard + upload sesuai 34 — Step 1–2.
- FR-002: Viewer memakai sanitizer sama dengan pipeline — Step 3.
- FR-003: Tanpa `execCommand` di codebase editor — seluruh flow.
- FR-004: Payload berbahaya ditolak/disanitasi dengan pesan jelas — ERR-01.

### Business Rules

- BR-001: Tidak ada HTML tak tersanitasi yang dirender (`v-html` mentah diganti viewer).
- BR-002: Sandbox keamanan expression/render existing tidak dilonggarkan.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | HTML besar/melebihi batas | Batas + pesan jelas | ERR-01 |
| EC-02 | Gambar eksternal ber-hotlink | Allowlist sanitizer berlaku + unduh-lokal opsional | Step 2 |
| EC-03 | Browser tanpa fitur editor | Fallback textarea + notice | Step 1 |

## Domain

> MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| GlobalTableColumn (existing) | `richtext` tetap string HTML | type=richtext |
| GlobalTableRow (existing) | values berisi HTML tersanitasi | values JSON |

Tidak ada entity/atribut baru (perilaku type diperkaya di presentasi + validasi).

### Relationships

N/A — tidak berubah.

### States

N/A — stateless konten.

### Domain Rules

- DR-001: `richtext` tetap string; tidak ada tabel/kolom baru.

### Invariants

- INV-001: Semua HTML tersimpan lolos sanitizer server.

### Data Model

N/A — tidak ada migration (konten existing berupa teks polos tetap valid).

## API

> MANDATORY.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/data/:tableName/*` | POST/PUT | JWT | `Data:{table}` | Simpan HTML tersanitasi | Step 1 |
| 2 | Storage upload existing | POST | JWT | existing | Gambar editor | Step 2 |

Pengetatan validasi HTML (422) mengikuti keputusan 34; detail mengikuti DTO existing + sanitizer.

## UI

> MANDATORY. Mereferensikan Task 34.

### Referensi Design

- Design task: `tasks/34-richtext-editor-ui-design.md`
- Wireframe/Mockup/Prototype: `docs/{wireframes,mockups,prototypes}/richtext-editor/` / Storybook

### Halaman / Layout / Components / Interaction / Responsive / States / Accessibility

Sesuai design 34. Deviasi dicatat dengan alasan.

## Acceptance Criteria

> MANDATORY.

### AC-001 — WYSIWYG identik

Given Operator format + gambar + simpan

When melihat hasil

Then render identik dan aman.

### AC-002 — Paste dan upload aman

Given paste berbahaya / upload gagal

When terjadi

Then strip + notice / retry + fallback.

### AC-003 — Tanpa legacy

Given codebase editor

When diperiksa

Then tanpa `execCommand`, tanpa `v-html` mentah untuk richtext.

## Tasks

> MANDATORY.

### Backend

- [ ] Perketat validasi/sanitasi `richtext` (422 + pesan) sesuai 34
- [ ] Unit tests sanitasi/validasi (`test:unit`)

### Frontend

- [ ] `RichTextEditor` + `RichTextViewer` + dialog image sesuai 34
- [ ] Ganti textarea `richtext` (row form, requirement, canvas) + `v-html` mentah terkait
- [ ] Hapus `execCommand`; paste-guard; source toggle
- [ ] Unit (`test:unit`/`test:nuxt`) + E2E (`test:e2e`) mengacu User Flow (termasuk serangan XSS sampel)

### Cross-Cutting

- [ ] RBAC tidak berubah; konsistensi dengan `tasks/34-*.md`

### Test Plan (QA)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | `tests/unit/richtext/*.test.ts` | Sanitasi, batas, strip | FR-004, AC-002 |
| NT-01 | Nuxt — Component | `app/components/**/*.test.ts` | Toolbar, paste, states | Step 1–2, AC-001 |
| E2E-01 | E2E — Happy path | `tests/e2e/richtext-editor.spec.ts` | Ketik→simpan→render identik | Step 1–3, AC-001 |
| E2E-02 | E2E — Alternate | `tests/e2e/richtext-editor.alt.spec.ts` | XSS paste, upload gagal, source | ERR-01/02, AC-002 |

- [ ] Coverage Flow/AC/BR/EC 100%

## Verification (QA)

### Automated

- [ ] `vue-tsc`, `test:unit`, `test:nuxt`, `test:e2e`, `build` PASS

### Manual / QA Checklist

- [ ] Serangan XSS sampel (script/event-handler/hotlink) dinetralkan; states/responsive/a11y sesuai 34; pixel-perfect 34; traceability penuh

## Assumptions

- Keputusan teknologi dari 34 final sebelum implementasi.
- Data `richtext` existing (teks polos) tetap valid dan tampil benar di viewer.

## Open Questions

- (Diwarisi 34; ditutup saat design DONE.)

## Related Knowledge

- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`
- `tasks/34-richtext-editor-ui-design.md` (WAJIB), Tasks 07–12/15/20 (kontrak terkait)
- Wiki: rich-text-template, column-type-catalog (richtext), rendering-engine, core-concept

## Change Log

### Initial

- Task generated from Core Concept (FASE 2 — mengacu Task 34, gap kritis #1).
