# Task 25 — UI/UX Audit & Concept Alignment (Audit Gate)

## Status

TODO

## Objective

Memformalkan audit UI/UX sistem berjalan dan kesesuaiannya terhadap `docs/dynamic-administration/` menjadi laporan audit + backlog gap yang mengikat, sebagai gerbang (gate) sebelum semua task redesign 26–38 dimulai.

## Context

Input pengguna menuntut, berurutan: (1) cek UI/UX sistem sekarang, (2) cek kesesuaian dengan `docs/dynamic-administration`, (3) improve UI/UX, (4) implementasikan semua yang ada di concept, (5) desain lebih baik, (6) pastikan benar dan ter-update penuh. Task ini menutup poin (1) dan (2) secara tertulis dan terverifikasi. Tasks 07–24 sudah DONE (fungsionalitas inti selesai); yang belum terjawab adalah kualitas UX dan kelengkapan concept. Tanpa baseline audit yang disetujui, redesign (26–33) dan penutupan gap concept (34–38) tidak memiliki kriteria selesai yang objektif.

## Scope

### In Scope

- Audit langsung (jalankan dev server + klik semua modul sebagai Designer dan Operator)
- Verifikasi/konfirmasi 15 temuan UI/UX prioritas dan 10 gap concept dari audit awal `/gen-tasks`
- Laporan audit tertulis + backlog gap bernomor (GAP-UI-01…, GAP-C-01…) yang dipetakan ke tasks 26–38
- Penetapan definisi "selaras concept" per artikel wiki (kriteria penerimaan per concept)

### Out of Scope

- Perubahan kode aplikasi (desain di 26/28/30/32/34/36, implementasi di 27/29/31/33/35/37/38)
- Perubahan `docs/` permanen selain lampiran laporan audit
- Penambahan fitur baru di luar concept

## Dependencies

- Tasks 07–24 (sistem yang diaudit) — tidak diubah, hanya dibaca
- `docs/dynamic-administration/wiki/index.md` + 31 artikel wiki (27 fondasi + `core-concept`, `statamic-reference`, `column-type-catalog`, `administration-runtime`) — acuan kebenaran concept
- `docs/dynamic-administration/README.md` + `raw/spec-v2-statamic-alignment.md` (keputusan K-01…K-04) — acuan target v2
- `docs/design-system.md`, `docs/PRD.md` — acuan standar

## User Flow

> MANDATORY — flow sistem (auditor, bukan end-user). Tidak ada UI baru; flow ini menjelaskan proses audit.

### Diagram

```text
[Entry] → {Siapkan matrix audit} --(jalankan)--> {Audit per modul} --(selesai)--> {Skor vs concept} --(disetujui)--> {Backlog GAP-*} 
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Auditor | Jalankan dev server, login sebagai Designer dan Operator | `/login`, dev server | Dua sesi peran siap |
| 2 | Auditor | Telusuri tiap modul (Global Table → Component → Template → Administration → Run → Document + menu + dashboard + auth) | `/dashboard/*` | Catatan per modul + screenshot |
| 3 | Auditor | Uji tiap state (loading/empty/error/validation/403) dan tiap breakpoint | Semua halaman | State terpetakan |
| 4 | Auditor | Nilai tiap artikel wiki (31) sebagai fully/partially/not-implemented | Wiki + kode | Skor alignment |
| 5 | Auditor | Terbitkan laporan + backlog GAP + definisi selaras | `tasks/25-*.md` lampiran | Gate untuk 26–38 |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Temuan baru di luar 25 temuan awal | Audit → triase | Tambah GAP baru + petakan ke task yang tepat |
| ERR-01 | Dev server tidak jalan / DB korup | Setup → perbaiki | Reset `db.sqlite`, restart, ulangi |

### Flow → UI Mapping

N/A — tidak ada UI baru. Auditor memakai UI existing apa adanya.

### Flow → API Mapping

N/A — audit bersifat observasional; tidak ada endpoint baru.

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Menghasilkan baseline tertulis kondisi UI/UX dan alignment concept yang menjadi acuan objektif tasks 26–38.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Auditor (Designer+Operator) | Menjalankan audit end-to-end dua peran | Akun Designer dan Operator |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Auditor | Menelusuri golden path table→component→template→admin→run→doc+PDF sebagai Designer lalu Operator | Semua langkah terdokumentasi + screenshot | Step 2 |
| UC-02 | Auditor | Memicu tiap error/empty/403 state | Perilaku state tercatat | Step 3 |
| UC-03 | Auditor | Menilai 31 artikel wiki vs implementasi | Skor per concept | Step 4 |

### Functional Requirements

- FR-001: Laporan audit mencakup semua modul: Global Table (+columns, data, relations, computed, CSV), Component, Template+editor, Administration+steps, Runner, Documents, Navigation, Dashboard, Auth — mengcover Step 2.
- FR-002: Setiap temuan mencantumkan bukti `file:line` atau langkah reproduksi — mengcover Step 2–3.
- FR-003: Setiap artikel wiki (31) diberi status fully/partially/not-implemented dengan bukti — mengcover Step 4.
- FR-004: Setiap gap mendapat ID (GAP-UI-01…, GAP-C-01…) dan dipetakan ke tepat satu task 26–38 — mengcover Step 5.
- FR-005: Laporan mendefinisikan kriteria "selaras concept" per concept yang belum selaras — mengcover Step 5.

### Business Rules

- BR-001: Tidak ada perubahan kode aplikasi dalam task ini (audit murni observasional).
- BR-002: Temuan yang tidak dapat direproduksi dua kali tidak masuk backlog (masuk appendix flake).
- BR-003: Skor "fully implemented" mensyaratkan bukti backend DAN frontend.

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Audit menemukan bug kritis (data loss, 500) | Hentikan, laporkan segera, catat sebagai GAP-C kritis | Step 2 |
| EC-02 | Perbedaan pendapat "selaras vs belum" | Catat di Open Questions, putuskan dengan kriteria tertulis | Step 4 |

## Domain

> MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| AuditFinding | Satu temuan UI/UX | id, modul, bukti, severity |
| ConceptScore | Penilaian satu artikel wiki | concept, status, bukti backend, bukti frontend |
| GapItem | Backlog terpetakan | id (GAP-*), task target, kriteria selesai |

### Relationships

```text
AuditFinding ──N:1── Task (26–38, target perbaikan)
ConceptScore ──N:1── Task (26–38, penutup gap)
```

- REL-01: Setiap GapItem menunjuk tepat satu task pelaksana (tidak mengambang).

### States

N/A — artefak dokumentasi, bukan runtime state machine.

### Domain Rules

- DR-001: Severity memakai skala critical/major/minor yang sama dengan audit awal.
- DR-002: Baseline temuan awal (15 UI + 10 concept gap dari `/gen-tasks`) wajib dikonfirmasi satu per satu (confirmed / corrected / rejected + alasan).

### Invariants

- INV-001: Setiap task 26–38 harus dapat ditelusuri ke ≥1 GapItem (tidak ada task tanpa justifikasi audit).

### Data Model

N/A — tidak ada perubahan database. Bukti audit disimpan sebagai lampiran markdown di task file (appendix).

## API

> MANDATORY.

N/A — No API. Task audit tidak menambah/mengubah endpoint. Alasan: observasional, memakai API existing.

## UI

> MANDATORY.

N/A — No UI (audit task, bukan feature). Alasan: deliverable adalah laporan + backlog di dalam file task ini (appendix), bukan antarmuka pengguna. Semua convention UI tidak berlaku.

## Acceptance Criteria

> MANDATORY.

### AC-001 — Cakupan modul audit lengkap

Given auditor memulai audit

When menelusuri modul

Then 9 area tercakup: global-table, columns, table-data, components, templates+editor, administrations, runs, documents, navigation+dashboard+auth.

### AC-002 — Temuan awal terkonfirmasi

Given 15 temuan UI/UX + 10 gap concept dari audit awal

When audit langsung selesai

Then tiap item berstatus confirmed/corrected/rejected dengan bukti.

### AC-003 — Skor 31 concept

Given wiki 31 artikel (27 fondasi + 4 baru: core-concept, statamic-reference, column-type-catalog, administration-runtime)

When penilaian selesai

Then tiap artikel berstatus fully/partially/not-implemented dengan bukti backend+frontend.

### AC-004 — Backlog terpetakan penuh

Given semua gap terkonfirmasi

When backlog diterbitkan

Then tiap GAP-* menunjuk tepat satu task 26–38 dan punya kriteria selesai.

### AC-005 — Gate untuk redesign

Given backlog selesai

When tasks 26–38 dimulai

Then tiap task dapat menelusuri scope-nya ke GapItem (INV-001).

## Tasks

> MANDATORY.

### Backend

N/A — tidak ada perubahan backend.

### Frontend

N/A — tidak ada perubahan frontend.

### Audit (pengganti Backend/Frontend untuk task ini)

- [ ] Setup: dev server + akun Designer dan Operator + matrix audit kosong
- [ ] Audit Global Table (list, columns tab, table-data browse, relations, computed display, CSV import/export)
- [ ] Audit Component (list, form, requirements, preview single/collection, versions)
- [ ] Audit Template (list, composition editor, context menu, inspector, BindingTab 5 sources, timeline/rollback)
- [ ] Audit Administration (list, workflow editor, step cards, pins, versions, archive)
- [ ] Audit Runner (starter, wizard, preview pane, review step, My Runs, cancel/resume)
- [ ] Audit Documents (list, filter, detail, drift badge, PDF/HTML, reissue)
- [ ] Audit Navigation + Dashboard + Auth (generated menu, highlight, dead-link, locale, responsive)
- [ ] Skor 31 artikel wiki + definisi "selaras" per concept yang belum selaras (termasuk 4 artikel v2 + raw spec-v2)
- [ ] Terbitkan GAP-UI-* dan GAP-C-* + mapping ke tasks 26–38 + lampirkan di file ini

### Cross-Cutting

- [ ] Konsistensi temuan dengan `docs/design-system.md` (token, pola DataTable, detail-view)
- [ ] Tidak ada file kode aplikasi yang diubah (`git status` bersih kecuali task file)

### Test Plan (QA)

N/A — task audit tidak menghasilkan automated tests. Verifikasi bersifat manual: checklist AC-001…AC-005 di atas dievaluasi oleh reviewer (peer review laporan). Alasan: deliverable adalah dokumen, bukan kode.

## Verification (QA)

### Automated

N/A — tidak ada kode, tidak ada test suite yang dijalankan (selain dev server untuk audit langsung).

### Manual / QA Checklist

- [ ] 9 area modul tercakup dengan bukti (AC-001)
- [ ] 25 temuan awal berstatus confirmed/corrected/rejected (AC-002)
- [ ] 31 concept berskor dengan bukti dua sisi (AC-003)
- [ ] Backlog GAP lengkap + mapping 1:1 ke task (AC-004, INV-001)
- [ ] `git status` menunjukkan hanya task file yang berubah

## Assumptions

- Audit awal `/gen-tasks` (15 temuan UI/UX + 10 gap concept dengan bukti `file:line`) dianggap akurat sebagai hipotesis awal; task ini mengkonfirmasi, bukan mengulang dari nol.
- Golden path Designer→Operator sudah terbukti di Task 22 (coverage 10/10).

## Open Questions

- Apakah locale target aplikasi Indonesia atau Inggris (temuan auth ID vs dashboard EN)? — diputuskan di Task 26, dicatat di sini sebagai GAP-UI.
- Apakah component rollback dan administration rollback diwajibkan untuk parity dengan template rollback? — diputuskan di Task 38.

## Related Knowledge

- `docs/dynamic-administration/wiki/index.md` (+ 31 artikel: 27 fondasi + 4 v2)
- `docs/dynamic-administration/README.md`, `raw/spec-v2-statamic-alignment.md` (K-01…K-04)
- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`
- `.ua/knowledge-graph.json` (peta concept + relasi)
- Tasks 07–24 (sistem yang diaudit), tasks 26–38 (konsumen backlog)

## Change Log

### Initial

- Audit-gate task generated from Core Concept (cek UI/UX + kesesuaian concept).
