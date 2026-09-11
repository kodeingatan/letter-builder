# Task 37 — Advanced Expression Functions Implementation

## Status

TODO

## Objective

Mengimplementasikan fungsi ekspresi lanjutan (sesuai spec Task 36) di grammar/tokenizer/parser/interpreter plus `ExpressionEditor`/`FunctionPalette`/`ExpressionTester` di 3 titik authoring — dengan sandbox keamanan dipertahankan — menutup gap kritis #2.

## Context

Engine v1 (`server/utils/expressions/`: grammar, tokenizer, parser, interpreter, `extractRefs/validate/evaluate`; endpoint `validate`/`evaluate`; dipakai computed + binding + condition + token + dokumen) hanya punya arithmetic/concat/comparison + `IF`. Wiki dan kebutuhan nyata (total harga, format tanggal, agregat) menuntut lebih. Spec fungsi + UX datang dari Task 36.

## Scope

### In Scope

- Grammar + fungsi baru sesuai spec 36 (implementasi bertahap bila diputuskan, dengan jejak jelas)
- `validate`/`evaluate` tetap kompatibel; error berposisi; batas timeout/depth/length ditegakkan per fungsi baru
- Komponen authoring di 3 titik (column computed form, NodeInspector condition, BindingTab expression) memakai komponen bersama 36
- Uji keamanan: tanpa eval/Function, prototype-pollution ditolak, konteks path whitelist
- Dokumentasi fungsi (help inline + docs singkat)

### Out of Scope

- Query agregat lintas-tabel bebas (di luar batas engine); richtext (35); perubahan pipeline selain konsumsi hasil

## Dependencies

- `tasks/36-expression-functions-ui-design.md` — (WAJIB: spec fungsi + prototype)
- Tasks 26/27 (fondasi), Task 09 (kontrak engine v1)

## User Flow

> MANDATORY — KONSISTEN dengan Task 36.

### Diagram

```text
[Entry] → {Editor+palette} --(compose)--> {POST /api/expressions/validate} --(valid)--> {POST evaluate sample}
  --(apply)--> {Save computed/condition/binding} --(render)--> {Hasil benar}
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Designer | Susun ekspresi | Editor → `POST validate` | Valid/posisi error |
| 2 | Designer | Uji sampel | Editor → `POST evaluate` | Hasil/error/batas |
| 3 | Designer | Terapkan | DTO existing + fungsi baru | Tersimpan |
| 4 | Sistem | Render/evaluasi | Engine (computed/binding/condition) | Nilai benar + aman |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Agregat koleksi | Tester → contoh | Batas dijelaskan |
| ERR-01 | Ref tak dikenal/tipe salah | Validate → 422 posisi | Inline + saran |
| ERR-02 | Timeout/depth/length | Evaluate → error | Batas + retry ringan |

### Flow → UI Mapping

| Flow Step | Halaman (36) | Component | State |
|-----------|--------------|-----------|-------|
| Step 1–2 | inline editor | Editor+Palette+Tester | valid/invalid/testing |
| Step 3 | form induk | existing + badge fungsi | saved |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1 | POST | `/api/expressions/validate` | Expression DTO + grammar v2 |
| Step 2 | POST | `/api/expressions/evaluate` | Sampel + sandbox |
| Step 3 | PUT/POST | bindings/columns/templates existing | DTO existing |

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Designer dapat memakai fungsi lanjutan dengan aman dan teruji di semua titik ekspresi.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Designer | Authoring ekspresi | Designer+ |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Designer | Total + format tanggal + agregat | Nilai benar | Step 1–4 |
| UC-02 | Designer | Ekspresi salah/berat | Error posisi/batas | Step 1–2 |

### Functional Requirements

- FR-001: Fungsi v2 sesuai spec 36 lolos validate + evaluate — Step 1–2.
- FR-002: Error menunjuk posisi + saran — Step 1.
- FR-003: 3 titik authoring memakai komponen bersama — Step 1–3.
- FR-004: Konsumen existing (computed/binding/condition/token) memakai fungsi baru tanpa perubahan kontrak — Step 4.

### Business Rules

- BR-001: Tanpa `eval`/`Function`; timeout/depth/length + whitelist konteks tetap.
- BR-002: Fungsi baru deterministik + murni (tanpa I/O/side-effect).
- BR-003: Compat mundur: ekspresi v1 tetap valid dan sama hasilnya.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Div-by-zero / null propagation | Error/nilai terdefinisi konsisten | Step 2/4 |
| EC-02 | Koleksi kosong untuk agregat | Nilai default terdokumentasi | Step 2 |
| EC-03 | Payload raksasa | Batas length + 422 | ERR-02 |

## Domain

> MANDATORY.

### Entities

N/A — engine murni (tanpa entity baru). Grammar/fungsi adalah kode + spec, bukan data.

### Relationships

N/A.

### States

N/A — evaluasi stateless (input → `{value, error}`).

### Domain Rules

- DR-001: Kontrak error `{value, error}` Task 09 dipertahankan untuk semua fungsi baru.

### Invariants

- INV-001: Evaluasi tidak pernah melempar (selalu struktur hasil) dan tidak pernah I/O.

### Data Model

N/A — tidak ada migration.

## API

> MANDATORY.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/expressions/validate` | POST | JWT | Designer | Validasi grammar v2 + posisi | Step 1 |
| 2 | `/api/expressions/evaluate` | POST | JWT | Designer | Evaluasi sampel + batas | Step 2 |

Kontrak existing diperluas dengan fungsi baru; rate-limit existing dipertahankan/disesuaikan bila perlu (didokumentasikan).

## UI

> MANDATORY. Mereferensikan Task 36.

### Referensi Design

- Design task: `tasks/36-expression-functions-ui-design.md`
- Wireframe/Mockup/Prototype: `docs/{wireframes,mockups,prototypes}/expression-functions/` / Storybook

### Halaman / Layout / Components / Interaction / Responsive / States / Accessibility

Sesuai design 36 (`ExpressionEditor`, `FunctionPalette`, `ExpressionTester` di 3 titik). Deviasi dicatat.

## Acceptance Criteria

> MANDATORY.

### AC-001 — Fungsi bekerja

Given ekspresi fungsi v2 + sampel

When validate + evaluate

Then hasil benar sesuai spec 36.

### AC-002 — Error jujur

Given ekspresi salah/berat

When diperiksa

Then posisi/saran/batas jelas.

### AC-003 — Aman dan kompatibel

Given serangan (pollution, raksasa, rekursi) dan ekspresi v1

When diuji

Then ditolak/dibatasi; v1 tetap sama.

### AC-004 — Konsisten 3 titik

Given computed/condition/binding

When editor dibuka

Then pengalaman identik + tersimpan.

## Tasks

> MANDATORY.

### Backend

- [ ] Grammar/tokenizer/parser/interpreter fungsi v2 + error posisi + batas
- [ ] `validate`/`evaluate` kompatibel + rate-limit + dokumentasi fungsi
- [ ] Konsumen (computed/binding/condition/render) tanpa perubahan kontrak
- [ ] Unit tests keamanan + kompatibilitas (`test:unit`)

### Frontend

- [ ] Komponen bersama 36 di 3 titik authoring
- [ ] Unit (`test:unit`/`test:nuxt`) + E2E (`test:e2e`) mengacu User Flow

### Cross-Cutting

- [ ] RBAC Designer tidak berubah; konsistensi dengan `tasks/36-*.md`

### Test Plan (QA)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | `tests/unit/expressions/*.test.ts` | Tiap fungsi + batas + serangan | FR-001, BR-001/003, AC-001/003 |
| UT-02 | Unit | `tests/unit/expressions/compat.test.ts` | v1 compat | BR-003, AC-003 |
| NT-01 | Nuxt — Component | `app/components/**/*.test.ts` | Editor/palette/tester states | Step 1–2, AC-004 |
| E2E-01 | E2E — Happy path | `tests/e2e/expression-functions.spec.ts` | Susun→uji→terapkan→render | Step 1–4, AC-001/004 |
| E2E-02 | E2E — Alternate | `tests/e2e/expression-functions.alt.spec.ts` | Error posisi, batas, permission | ERR-01/02, AC-002 |

- [ ] Coverage Flow/AC/BR/EC 100%

## Verification (QA)

### Automated

- [ ] `vue-tsc`, `test:unit`, `test:nuxt`, `test:e2e`, `build` PASS

### Manual / QA Checklist

- [ ] Serangan + batas + kompatibilitas; states/responsive/a11y sesuai 36; pixel-perfect 36; traceability penuh

## Assumptions

- Daftar final fungsi v2 dari 36; bila bertahap, jejak fungsi tunda dicatat di Open Questions 36.

## Open Questions

- (Diwarisi 36; ditutup saat design DONE.)

## Related Knowledge

- `docs/PRD.md`, `docs/architecture.md`, `docs/design-system.md`
- `tasks/36-expression-functions-ui-design.md` (WAJIB), Task 09 (engine v1)
- Wiki: expression-engine, unified-data-language, computed-field, column-type-catalog, core-concept

## Change Log

### Initial

- Task generated from Core Concept (FASE 2 — mengacu Task 36, gap kritis #2).
