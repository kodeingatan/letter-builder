# Task 38 — Concept Parity & Final Verification Sweep

## Status

TODO

## Objective

Menutup sisa gap concept tingkat major/minor (component rollback parity, validasi namespace `{{component.*}}`/`{{administration.*}}`, komentar/stub basi, inkonsistensi kecil lintas modul) dan menjalankan verifikasi akhir menyeluruh bahwa seluruh concept `docs/dynamic-administration` terimplementasi penuh dan desain lebih baik — memenuhi poin (4)–(6) input pengguna.

## Context

Setelah Tasks 25–37, gap kritis (richtext, expression, preview, fondasi, UX modul) tertutup. Tersisa dari audit: component versioning view-only (tanpa rollback seperti template), `SYSTEM_KEYS` hanya 3 kunci tanpa namespace `component`/`administration` khusus sehingga typo gagal diam-diam saat render, komentar basi ("Task 20", "Task 19", "Task 16/17"), inkonsistensi kecil (copy versi draft v0 vs v1, `"2s / 5d"`, currency fallback IDR, cache menu 30 dtk, preview koleksi 1-blob). Task ini single (tanpa pasangan design karena perubahannya kecil + mengacu design 26) dan menjadi gerbang DONE roadmap.

**Keputusan alignment 2026-09-11 (K-01…K-04, mengikat task ini)**: katalog v2, runtime-penuh + `step_field`, nested `component` + cycle alert — lihat `raw/spec-v2-statamic-alignment.md` dan `wiki/administration-runtime`. Sweep akhir memverifikasi keempatnya di samping parity rollback.

## Scope

### In Scope

- Component rollback-to-draft (paritas template) ATAU keputusan tertulis forward-only + alasan (menutup Open Question Task 25)
- Validasi bind-time untuk `component.*`/`administration.*` (whitelist/namespacing + pesan jelas; tanpa mengubah bahasa `data.*` yang sudah enforced)
- Sapu komentar/stub/copy basi di seluruh modul; samakan copy versi draft; ganti kode `"2s / 5d"` dengan label terbaca
- Verifikasi akhir: 31 concept fully-implemented (bukti dua sisi), regression suite penuh, audit trail GAP tertutup
- Keputusan tercatat untuk: administration rollback (forward-only vs parity), cache menu, preview koleksi

### Out of Scope

- Fitur baru di luar concept; redesign besar (sudah di 26–37); perubahan non-goal PRD

## Dependencies

- Tasks 25–37 (semua pendahulu harus DONE; task ini verifikatornya)
- `docs/dynamic-administration/wiki/index.md` (definisi selesai per concept)

## User Flow

> MANDATORY — flow verifikator + sisa perbaikan kecil.

### Diagram

```text
[Entry] → {Rollback component} --(confirm)--> {Draft}   [Entry] → {Bind namespaced} --(typo)--> {Inline error}
[Entry] → {Sweep copy/stub} --> {Bersih}   [Entry] → {Verify 31 concepts} --> {DONE roadmap}
```

### Steps

| Step | Actor | Aksi | Halaman / API | Hasil |
|------|-------|------|---------------|-------|
| 1 | Designer | Rollback component version | Drawer → `rollback` + confirm | Draft dari versi |
| 2 | Designer | Bind `component.*`/`administration.*` salah | BindingTab → validasi bind-time | Error jelas sebelum render |
| 3 | Verifikator | Sapu copy/stub basi | Seluruh UI | Bersih |
| 4 | Verifikator | Uji 31 concept + regression | Semua suite + live | Fully + hijau |

### Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan |
|----|----------|-------|------------|
| ALT-01 | Rollback diputuskan forward-only | Keputusan → dokumen | Alasan tertulis, bukan gap |
| ERR-01 | Validasi namespace menolak ref lama valid | Validator → pesan | Migrasi/alias + panduan |

### Flow → UI Mapping

| Flow Step | Halaman | Component | State |
|-----------|---------|-----------|-------|
| Step 1 | component drawer | Timeline + confirm | success/error |
| Step 2 | BindingTab | Inline namespace error | invalid |
| Step 3–4 | seluruh aplikasi | — | — |

### Flow → API Mapping

| Flow Step | HTTP Method | Server Route | Validasi |
|-----------|-------------|--------------|----------|
| Step 1 | POST | `/api/components/:id/rollback/:version` (baru, paritas template) | Version exists |
| Step 2 | PUT/GET | bindings existing (validator diperketat) | Namespace schema |

## Requirements

> MANDATORY.

### Tujuan Fitur

- REQ-G01: Tidak ada gap concept tersisa tanpa keputusan tertulis; roadmap dinyatakan DONE dengan bukti.

### Users / Actors

| Actor | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| Designer | Rollback + bind namespaced | Designer+ |
| Verifikator | Sweep akhir | SysAdmin |

### Use Cases

| ID | Actor | Skenario | Hasil | Flow Step |
|----|-------|----------|-------|-----------|
| UC-01 | Designer | Rollback component ke v1 | Draft = salinan v1, history utuh | Step 1 |
| UC-02 | Designer | Salah ketik namespace | Error bind-time, bukan render kosong | Step 2 |
| UC-03 | Verifikator | Verifikasi 31 concept | Semua fully + bukti | Step 4 |

### Functional Requirements

- FR-001: Component rollback paritas template ATAU keputusan forward-only tertulis — Step 1.
- FR-002: Typo namespace gagal cepat dengan pesan (tidak render kosong diam-diam) — Step 2.
- FR-003: Nol copy "Task N"/stub basi/kode kripti di UI — Step 3.
- FR-004: 31/31 concept fully-implemented dengan bukti dua sisi — Step 4.
- FR-005 (K-01): `datetime`/`time`/`select-multiple` terdaftar + ter-render + tervalidasi end-to-end.
- FR-006 (K-02): Runtime steps ter-freeze + tercakup complete atomic + teraudit.
- FR-007 (K-03): Loop requirement terdeteksi → alert + blokir render (tanpa batas depth).
- FR-008 (K-04): Konvensi `step_field` berjalan di wizard, binding, preview, dan render.

### Business Rules

- BR-001: Rollback = copy-to-draft (history immutable), sama seperti template.
- BR-002: Pengetatan validator tidak boleh memblokir ref valid existing (uji regresi binding).
- BR-003: Keputusan "tidak diimplementasikan" hanya sah bila tertulis + beralasan (non-goal/deferral eksplisit).

### Edge Cases

| ID | Kondisi | Penanganan | Flow ID |
|----|---------|------------|---------|
| EC-01 | Rollback versi yang sudah dihapus | 404 jelas | Step 1 |
| EC-02 | Ref lama `{{pegawai.nip}}` existing | Alias/panduan migrasi, bukan blokir diam | Step 2 |
| EC-03 | Regresi suite gagal | Hentikan DONE, perbaiki di task pemilik | Step 4 |

## Domain

> MANDATORY.

### Entities

| Entity | Deskripsi | Atribut Kunci |
|--------|-----------|---------------|
| ComponentVersion (existing) | History immutable | componentId, version |
| TemplateBinding (existing) | Validator diperketat | sourceRef, expression |

Perubahan: endpoint rollback component (service + route baru, pola salin template); validator namespace (aturan, bukan kolom). Tidak ada kolom baru → tidak ada migration (jika ternyata perlu, catat + migration aditif).

### Relationships

```text
Component ──1:N── ComponentVersion (existing; + rollback read path)
```

### States

| State | Deskripsi | Transisi Diizinkan |
|-------|-----------|--------------------|
| DRAFT/PUBLISHED (component) | existing | + rollback-to-draft (paritas) |

### Domain Rules

- DR-001: Rollback tidak menghapus/mengubah versi history mana pun.

### Invariants

- INV-001: Binding valid sebelum task ini tetap valid sesudahnya (kecuali yang memang typo — dibuktikan).

### Data Model

N/A — tidak ada migration yang direncanakan (rollback memakai tabel existing; validator tanpa kolom).

## API

> MANDATORY.

### Endpoint Overview

| # | Server Route | HTTP Method | Auth | Permission | Deskripsi | Flow Step |
|---|--------------|-------------|------|------------|-----------|-----------|
| 1 | `/api/components/:id/rollback/:version` | POST | JWT | Designer | Rollback paritas template | Step 1 |
| 2 | `/api/templates/:id/bindings` | PUT/GET | JWT | Designer | Validator namespace ketat | Step 2 |

### Detail per Endpoint

#### Rollback — POST /api/components/:id/rollback/:version

- **Request**: params `id`, `version`; tanpa body.
- **Response**: `{ "draft": {...}, "fromVersion": N }` (draft = salinan versi).
- **Validation (Zod)**: id/version positif; versi harus ada (404 bila tidak).
- **Error**: 404 versi tak ada; 401 tanpa token; 403 tanpa permission; 409 bila draft terkunci (bila berlaku).
- **Authentication**: JWT; **Authorization**: Designer+ (paritas template rollback).

Validator namespace: schema menolak ref di luar namespace terdaftar dengan pesan + saran (detail mengikuti keputusan Task 25/36).

## UI

> MANDATORY. Mengacu design 26 (fondasi) — tidak ada design baru.

### Referensi Design

- Design task: `tasks/26-design-system-refresh-ui-design.md` (pola confirm, inline error, timeline)
- Tidak ada wireframe baru (perubahan kecil mengikuti pola existing yang sudah didesain di 26/30).

### Halaman

| Route | Halaman | Akses | Deskripsi | Status Design |
|-------|---------|-------|-----------|---------------|
| Component drawer | Version timeline + rollback | Designer | Paritas template timeline | Pola dari 26 |
| BindingTab | Namespace inline error | Designer | Validasi bind-time | Pola dari 26/30 |

### Layout / Components / Interaction / Responsive / States / Accessibility

Mengikuti pola 26 (konfirmasi destruktif, inline error berposisi, live region). Deviasi dicatat.

## Acceptance Criteria

> MANDATORY.

### AC-001 — Rollback paritas

Given Designer rollback component ke v1

When dikonfirmasi

Then draft = salinan v1 dan history utuh.

### AC-002 — Namespace gagal cepat

Given ref namespace typo

When bind/divalidasi

Then error bind-time jelas (bukan render kosong).

### AC-003 — Bersih

Given seluruh UI diperiksa

When dicari copy Task-N/stub/kode kripti

Then nol temuan.

### AC-004 — 31/31 + hijau

Given 31 concept + full suite

When diverifikasi

Then semua fully dengan bukti; unit+nuxt+e2e+build hijau.

## Tasks

> MANDATORY.

### Backend

- [ ] Component rollback service + route + DTO + registrasi permission/activity-log
- [ ] Validator namespace `component.*`/`administration.*` + pesan + uji regresi ref valid
- [ ] Unit tests (`test:unit`)

### Frontend

- [ ] Timeline rollback component + confirm; inline namespace error; sapu copy/stub; label `"2s/5d"` + copy versi
- [ ] Unit (`test:unit`/`test:nuxt`) + E2E (`test:e2e`) mengacu User Flow

### Cross-Cutting

- [ ] Keputusan tertulis: administration rollback, cache menu, preview koleksi, currency fallback
- [ ] Sweep akhir 31 concept (bukti dua sisi) + regression penuh + update `tasks/task-logs.md` + tutup Open Questions 25
- [ ] Konsistensi dengan `tasks/26-*.md` (pola) dan kontrak Tasks 13/16

### Test Plan (QA)

| ID | Jenis Test | File (rencana) | Mengcover | User Flow Step / AC |
|----|------------|----------------|-----------|---------------------|
| UT-01 | Unit | `tests/unit/components/rollback.test.ts` | Copy-to-draft, history utuh | FR-001, AC-001 |
| UT-02 | Unit | `tests/unit/bindings/namespace.test.ts` | Whitelist + pesan + regresi valid | FR-002, AC-002 |
| NT-01 | Nuxt — Component | `app/components/**/*.test.ts` | Timeline + inline error states | Step 1–2, AC-001/002 |
| E2E-01 | E2E — Happy path | `tests/e2e/concept-parity.spec.ts` | Rollback + bind + render | Step 1–2, AC-001/002 |
| E2E-02 | E2E — Sweep | `tests/e2e/concept-parity.sweep.spec.ts` | Golden path 31-concept regression | Step 4, AC-004 |

- [ ] Coverage Flow/AC/BR/EC 100%

## Verification (QA)

### Automated

- [ ] `vue-tsc`, `test:unit`, `test:nuxt`, `test:e2e`, `build` PASS (regression penuh)

### Manual / QA Checklist

- [ ] Permission rollback (Designer vs viewer 403); BR/EC bertest; 31-concept evidence table; nol temuan sweep; traceability penuh; `task-logs.md` final

## Assumptions

- Pola rollback template dapat dipakai ulang langsung untuk component.
- Bahasa `data.*` tidak berubah; namespace baru hanya menambah ketegasan, bukan sintaks baru.

## Open Questions

- Administration rollback: parity atau forward-only resmi? (diputuskan di sini bila belum di 25)
- Ref lama non-namespaced: alias permanen atau jendela migrasi?

## Related Knowledge

- `docs/PRD.md`, `docs/architecture.md`, `docs/database.md`, `docs/design-system.md`
- `tasks/26-design-system-refresh-ui-design.md` (pola UI), Tasks 13/16 (kontrak versioning/binding), 25 (gate), 30–37
- Wiki: semua 31 artikel + `raw/spec-v2-statamic-alignment.md` (sweep akhir) + `core-concept` (§6 peta status), `statamic-reference`, `column-type-catalog`, `administration-runtime`

## Change Log

### Initial

- Final-sweep task generated from Core Concept (paritas + DONE roadmap).
