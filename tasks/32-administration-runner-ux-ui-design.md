# Task 32 — Administration & Runner UX UI Design (Wireframe / Mockup / Prototype)

## Status

TODO

## Objective

Menghasilkan wireframe, mockup hi-fi, dan prototype interaktif untuk redesign UX Administration (workflow editor, steps, versions) dan Runner (starter, wizard, review, My Runs) plus Documents (list, detail, drift, reissue) sebagai acuan implementation Task 33.

## Context

Alur administration→run→document bekerja (Tasks 17–19) tetapi UX-nya memiliki lubang operator: drawer administration tanpa style, langkah published tanpa tooltip, form tanpa `NForm` rules, pin versi gagal diam-diam, navigasi tanpa dirty-guard, wizard sukses mendarat tanpa tautan dokumen, review menampilkan JSON mentah, `NStep` tak keyboard-aksesibel, preview pane stub teks ("arrives with Task 20" padahal API ada), filter tanpa label, tombol PDF disabled tanpa tooltip + toast unreachable, detail `.detail-view` menyimpang, link re-issue `href="#"`, drift badge tanpa tooltip, `DocumentPreview` mati. Fondasi 26/27 diasumsikan selesai.

**Keputusan alignment K-02/K-04 (2026-09-11, mengikat task ini)**: model **runtime penuh** — operator dapat menambah step baru dengan memilih template saat menjalankan (steps predefined = kerangka awal; run mem-freeze pilihan); field step memakai konvensi **`step_field`** (`{{data.<step>.<field>}}`). Lihat `wiki/administration-runtime`.

## Scope

### In Scope

- Wireframe: workflow editor (validasi inline, dirty-guard, pin versi eksplisit), wizard (navigasi step aksesibel, autosave jujur, review terbaca-operator, preview dokumen nyata via render API, complete → tautan dokumen), My Runs (filter berlabel, scope discoverable), documents (filter berlabel, kolom searchable, detail konsisten, drift tooltip, reissue aman), starter (peringatan draft/archived jelas)
- Mockup hi-fi + prototype (jalankan administration sampai dokumen terbit sebagai Operator)
- Deliverables: Figma/HTML + Storybook (StepCard, WizardStep, ReviewSummary, DriftBadge)

### Out of Scope

- Perubahan kontrak run/complete/documents/render API
- Editor richtext (35), fungsi ekspresi (37)

## Dependencies

- `docs/design-system.md`, `docs/PRD.md`
- Task 25 (GAP-UI administration/runner/documents), Tasks 26/27 (fondasi)

## User Flow

> MANDATORY — acuan Task 33.

### Diagram

```text
[Entry] → {Admin detail} --(edit steps)--> {Dirty guard} --> {Save}
[Entry] → {Starter} --(start)--> {Wizard step} --(save draft)--> {Next} --(review+preview)--> {Complete} --> {Documents links}
    │--(tambah step: pilih template)--> {Step runtime} --(isi binding step_field)--> {Next}
[Entry] → {My Runs} --(filter)--> {Runs}   [Entry] → {Documents} --(filter)--> {Detail} --(reissue+confirm)--> {New doc}
```

### Steps

| Step | Actor | Aksi | Halaman / Component | Hasil |
|------|-------|------|---------------------|-------|
| 1 | Designer | Edit steps + pin versi | Admin detail | Valid + tersimpan; dirty dijaga |
| 2 | Operator | Mulai run | Starter | Wizard step 1 |
| 3 | Operator | Isi tiap step (field `step_field`) | Wizard + autosave | Draf tersimpan |
| 3b | Operator | Tambah step baru (pilih template) | Wizard + template picker | Step runtime ter-freeze di run |
| 4 | Operator | Review + preview dokumen | Review | Ringkasan terbaca + render nyata |
| 5 | Operator | Complete | Wizard | Tautan dokumen hasil |
| 6 | Operator | Lihat My Runs / Documents | List + filter | Data + reissue aman |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI |
|----|----------|-------|---------------|
| ALT-01 | Run dibatalkan/dilanjutkan | Wizard → Cancel/Resume | `NPopconfirm` + resume data |
| ALT-02 | Dokumen drift versi | Detail → Badge | Tooltip + snapshot stabil |
| ERR-01 | Step invalid | Complete → blocker | Lompat ke step + pesan |
| ERR-02 | Pin versi gagal load | Step → fallback | Penjelasan latest-only |
| ERR-03 | PDF belum tersedia | Detail → info | Alert + tombol ber-tooltip |

## UI

> MANDATORY — 10 sub-bagian.

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/dashboard/docs/administrations/:id` | Admin detail | Designer | Steps + versions + docs | `wireframe/admin-detail.png` |
| `/dashboard/docs/run/:id` | Starter | Operator | Ringkasan + mulai | `wireframe/starter.png` |
| `/dashboard/docs/runs/:id` | Wizard | Operator | Steps + review + preview | `wireframe/wizard.png` |
| `/dashboard/docs/runs` | My Runs | Operator | Filter + scope | `wireframe/my-runs.png` |
| `/dashboard/docs/documents*` | Documents | Operator | Filter + detail + reissue | `wireframe/documents.png` |

### Layout

- PageShell + breadcrumb di semua halaman; wizard dengan `NSteps` aksesibel + panel preview berdampingan (modal di mobile)

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| StepCard + WorkflowEditor | `features/administrations/` | Validasi + dirty + pin | valid/invalid/dirty |
| Wizard + ReviewSummary | `features/runs/` | Review operator + preview render | blocker/ready/done |
| RunsTable + DocumentsTable | `features/runs/`, `features/documents/` | Filter berlabel + search benar | loading/empty/error |
| DriftBadge + Preview | `features/documents/` | Tooltip + iframe sandbox | drift/clean/pending |

### Interaction

- Dirty-guard saat tinggalkan editor belum simpan; complete → tautan dokumen (bukan toast saja)
- Preview render nyata memanggil `POST /api/render/preview` (bukan stub teks)
- Prototype link: (diisi saat design)

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Wizard + preview berdampingan | `wireframe/desktop.png` |
| Tablet/Mobile | Preview modal; tabel scroll | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading/Empty/Error/Success/Validation/403 | Fondasi 26 | Sesuai 26 | `mockup/states.png` |

### Accessibility

- `NStep` keyboard + ARIA; review terbaca screen-reader; ikon-only berlabel; reduced-motion

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe | Figma / PNG | `docs/wireframes/admin-runner-ux/` | TODO |
| Mockup | Figma / PNG | `docs/mockups/admin-runner-ux/` | TODO |
| Prototype | Figma / HTML | `docs/prototypes/admin-runner-ux/` atau Storybook | TODO |

### Design Tokens Check

- [ ] theme, Inter, radius, spacing, ikon Carbon

## Acceptance Criteria (Design)

> MANDATORY.

### AC-D01 — Wizard operator-terbaca

Given reviewer menjalankan prototype wizard

When sampai tambah-step.runtime + review + complete

Then picker template tersedia, field tampil namespaced `step.field`, ringkasan terbaca (bukan JSON), preview render nyata, complete memberi tautan dokumen.

### AC-D02 — Editor aman

Given reviewer mengedit steps

When validasi gagal / tinggalkan kotor / pin gagal

Then pesan inline, dirty-guard, fallback dijelaskan.

### AC-D03 — Documents jujur

Given reviewer membuka documents

When filter/drift/PDF/reissue

Then label jelas, drift ber-tooltip, PDF ber-tooltip, reissue konfirmasi, link real-href.

## Tasks (Design)

> MANDATORY.

### Discovery

- [ ] Audit halaman & states existing
- [ ] Mapping User Flow → halaman

### Wireframe

- [ ] Low-fi semua halaman + breakpoint + states

### Mockup

- [ ] Hi-fi + tokens + states

### Prototype

- [ ] Interaktif full-run + review + iterasi

### Handoff

- [ ] Assets + spec + `Status: DONE` sebelum Task 33

## Verification (Design)

- [ ] Design System, Responsive, Accessibility, User Flow coverage, peer review

## Assumptions

- Kontrak run/documents/render API tidak berubah; preview memakai `POST /api/render/preview` existing.
- Kebijakan reissue (admin-gated) tidak berubah.

## Open Questions

- Preview render di wizard: otomatis per step atau tombol eksplisit (biaya render)?
- Review menampilkan semua step sekaligus atau per-step accordion?

## Related Knowledge

- `docs/PRD.md`, `docs/design-system.md`, wiki `administration`, `step`, `multi-template-administration`, `administration-runtime` (runtime penuh + `step_field`), `runtime-flow`, `rendering-engine`, `core-concept` (§4 golden path)
- Tasks 25, 26/27, 33

## Change Log

### Initial

- UI design task generated (FASE 1 — UI-First, untuk Task 33).
