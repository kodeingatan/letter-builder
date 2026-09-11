# Task 36 — Advanced Expression Functions UI Design (Wireframe / Mockup / Prototype)

## Status

TODO

## Objective

Menghasilkan wireframe, mockup hi-fi, dan prototype interaktif untuk fungsi ekspresi lanjutan (SUM, COUNT, MIN, MAX, ROUND, DATE_FORMAT, CONCAT, ELSE) plus palet fungsi + uji ekspresi inline di titik authoring (kolom computed, inspector condition, BindingTab expression) sebagai acuan Task 37.

## Context

Engine v1 hanya arithmetic/concat/comparison + `IF` (`grammar.ts`, `interpreter.ts`); wiki menjanjikan SUM/ROUND/DATE_FORMAT dkk sebagai "nantinya" — audit mengonfirmasi semuanya absen (gap kritis #2: pricing computed, format tanggal template tidak bisa dibuat). Authoring ekspresi kini berupa `NInput` mentah tanpa panduan maupun umpan balik. Task ini mendesain bahasa + UX authoringnya; implementasi di Task 37.

## Scope

### In Scope

- Wireframe: palet fungsi (daftar + signature + contoh), editor ekspresi dengan highlight/validasi inline + tombol uji (input sampel → hasil/error), daftar konteks tersedia (`data.*`, `item.*`, `system`, `user.*`), pesan error yang menunjuk posisi
- Mockup hi-fi + prototype (bangun `SUM(harga*jumlah)` → uji → pakai di computed/condition/binding)
- Spesifikasi fungsi v2 yang didesain: nama, signature, contoh, batas (timeout/depth/length preserved)
- Deliverables: Figma/HTML + Storybook (`ExpressionEditor`, `FunctionPalette`, `ExpressionTester`)

### Out of Scope

- Implementasi parser/interpreter (Task 37); perubahan kontrak evaluasi selain fungsi baru
- Query agregat lintas-tabel berat (batas desain didokumentasikan)

## Dependencies

- `docs/design-system.md`, `docs/PRD.md`
- Task 25 (GAP-C expression kritis), Tasks 26/27 (fondasi)

## User Flow

> MANDATORY — acuan Task 37.

### Diagram

```text
[Entry] → {Expression editor} --(pick function)--> {Palette} --(compose)--> {Inline validate}
    │--(test)--> {Sample → result/error} --(apply)--> {Computed/Condition/Binding}
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | Designer | Buka editor ekspresi | Column computed / inspector / binding | Palet + konteks |
| 2 | Designer | Susun ekspresi | Editor | Validasi inline + posisi error |
| 3 | Designer | Uji dengan sampel | Tester | Hasil atau error jelas |
| 4 | Designer | Terapkan | Form induk | Tersimpan + dipakai render |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Fungsi butuh agregat koleksi | Tester → contoh `item.*` | Contoh + batas |
| ERR-01 | Sintaks/ref tak dikenal | Editor → Inline | Posisi + saran |
| ERR-02 | Timeout/depth | Tester → error | Batas dijelaskan |

## UI

> MANDATORY — 10 sub-bagian.

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| (inline) | Expression editor | Designer | Palet + uji + konteks | `wireframe/expression.png` |

### Layout

- Editor + palet samping + panel uji bawah; konsisten di 3 titik pakai (computed, condition, binding)

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| `ExpressionEditor.vue` | `app/components/common/` | Input + highlight + error posisi | valid/invalid/testing |
| `FunctionPalette.vue` | `app/components/common/` | Daftar fungsi + contoh | default/filtered |
| `ExpressionTester.vue` | `app/components/common/` | Sampel → hasil | success/error/timeout |

### Interaction

- Pilih fungsi → sisip template signature; ketik → validasi debounce (API `validate`); uji → API `evaluate` sampel
- Prototype link: (diisi saat design)

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop | Editor + palet berdampingan | `wireframe/desktop.png` |
| Mobile | Palet jadi drawer/accordion | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Editing/Valid/Invalid/Testing/Success/Error | Fondasi 26 | NInput/NAlert/NSpin/NCode | `mockup/states.png` |

### Accessibility

- Palet keyboard + label; error diumumkan live region; kontras token

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe | Figma / PNG | `docs/wireframes/expression-functions/` | TODO |
| Mockup | Figma / PNG | `docs/mockups/expression-functions/` | TODO |
| Prototype | Figma / HTML | `docs/prototypes/expression-functions/` atau Storybook | TODO |

### Design Tokens Check

- [ ] theme, Inter, radius, spacing, ikon Carbon

## Acceptance Criteria (Design)

> MANDATORY.

### AC-D01 — Fungsi terdokumentasi visual

Given reviewer membuka palet

When memilih fungsi v2

Then signature + contoh + batas tampil.

### AC-D02 — Uji jujur

Given reviewer menguji ekspresi

When sampel benar/salah/berat

Then hasil / error posisi / batas dijelaskan.

### AC-D03 — Konsisten 3 titik

Given reviewer di computed/condition/binding

When membuka editor

Then pengalaman identik.

## Tasks (Design)

> MANDATORY.

### Discovery

- [ ] Audit titik authoring ekspresi existing + endpoint validate/evaluate
- [ ] Spesifikasi fungsi v2 (signature/contoh/batas) + mapping User Flow

### Wireframe

- [ ] Low-fi editor + palet + tester + mobile + states

### Mockup

- [ ] Hi-fi + tokens + states

### Prototype

- [ ] Interaktif + review + iterasi

### Handoff

- [ ] Spec fungsi + assets + `Status: DONE` sebelum Task 37

## Verification (Design)

- [ ] Design System, Responsive, Accessibility, User Flow coverage, peer review (+ review keamanan: tanpa eval/Function)

## Assumptions

- Sandbox existing (timeout/depth/length, tanpa eval) tidak dilonggarkan; fungsi baru tunduk padanya.
- Agregat lintas-tabel dibatasi sesuai kemampuan engine (didokumentasikan, bukan query bebas).

## Open Questions

- Daftar final fungsi v2: apakah ELSE/COUNT/MIN/MAX/CONCAT semuanya v2 atau bertahap?
- Agregat koleksi: sintaks `SUM(collection.field)` vs helper `item.*`?

## Related Knowledge

- `docs/PRD.md` (non-goal bertahap), `docs/design-system.md`
- Wiki: `expression-engine`, `unified-data-language`, `computed-field`, `column-type-catalog` (sintaks operasi), `core-concept` (lapisan 3+12)
- Tasks 25, 26/27, 37

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First, untuk Task 37, gap kritis #2).
