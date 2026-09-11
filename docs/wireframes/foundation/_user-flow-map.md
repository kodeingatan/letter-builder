# User Flow → Halaman/Component Mapping (Task 26)

> Mapping mandatory untuk ACUAN Task 27. Flow → UI dan Flow → API (existing, no new endpoint).

## Diagram (dari task 26)

```
[Entry] → {List page} --(search/filter/sort)--> {List filtered} --(error)--> {Error alert + retry}
    │                         │
    │--(empty)--> {Empty + CTA}│--(403)--> {Single 403 pattern}
    │
[Entry] → {Sidebar} --(collapse)--> {Collapsed} --(navigate)--> {Active highlight}
    │
[Entry] → {Dashboard} --(shortcut)--> {Module}
    │
[Entry] → {Login} --(fail)--> {Inline error} --(success)--> {Dashboard}
```

## Steps

| Step | Actor | Aksi | Halaman / Component (design 26) | Hasil | Wireframe | Mockup | Prototype screen | AC |
|------|-------|------|----------------------------------|-------|-----------|--------|------------------|----|
| 1 | Designer | Buka halaman list | `/dashboard/*` → `PageShell.vue` (header + breadcrumb + actions) + `DataTable.vue` | Header + breadcrumb + tabel tampil, no dead-end | `list-shell.png`, `desktop.png` | `list-shell.png` | `prototype: list` | AC-D01 |
| 2 | Designer | Ketik search / ubah filter / sort | Toolbar `DataTable` (`NInput` 320px + `NSelect` 160px) — debounce 300ms → `GET /api/*` | Hasil terfilter | `datatable-toolbar.png` | `datatable.png` | `prototype: search demo` | AC-D02 |
| 3 | Designer | Klik Refresh | Toolbar `NButton Restart` — refetch tanpa reset `search/sort/page` | Data refetch, state preserved | `datatable-toolbar.png` | `datatable.png` | `prototype: refresh` | AC-D02 |
| 4a | Designer | Lihat empty | List page `NEmpty + CTA` (`Buat Data Pertama`) | CTA visible, tidak kosong | `states.png` | `empty.png` | `prototype: empty toggle` | AC-D01, ALT-01 |
| 4b | Designer | Lihat error | List page `NAlert type=error + Retry` (slot error DataTable) | Alert + retry tanpa reset | `states.png` | `error.png`, `loading.png` | `prototype: error injection` | AC-D02, ERR-01 |
| 4c | Designer | Lihat 403 | Any → `AccessDeniedAlert` tunggal floating global | Tepat satu alert, tidak ganda | `states.png` | `403.png` | `prototype: 403 trigger` | AC-D03, ERR-02 |
| 4d | Guest | Lihat validasi gagal | Form/auth `NFormItem` feedback inline | Pesan inline, focus first error | `auth.png` | `validation.png` | `prototype: login fail` | ERR-03 |
| 5 | Operator | Collapse sidebar, navigasi | `layouts/default.vue` sider 220/72 + `NMenu` active highlight + `<a href>` | Highlight benar di semua route dinamis (`data-table-*`, `persuratan-*`, `documents/:id` …) | `sidebar.png`, `tablet.png`, `mobile.png` | `sidebar.png` | `prototype: sidebar collapse` | AC-D04 |
| 6 | Operator | Buka dashboard | `/dashboard` shortcuts dinamis `navigationStore.dataEntries/persuratanEntries` + `Documents` | Shortcut sesuai permission; empty state `Minta akses` jika 0 modul | `dashboard.png` | `dashboard.png` | `prototype: dashboard switcher` | AC-D04 |
| 7a | Guest | Login gagal | `/login` `POST /api/auth/login` 401 → inline `NAlert` + `NFormItem` | Inline error, tidak redirect | `auth.png` | `auth.png` + `validation.png` | `prototype: login fail` | AC-D04 |
| 7b | Guest | Login berhasil | `/login` 200 → redirect `/dashboard` + toast `Masuk berhasil` | Redirect + toast `useMessage` | `auth.png` | `auth.png` + `success.png` | `prototype: login success` | AC-D04 |

## Alternate & Error Flows

| ID | Skenario | Jalur | Penanganan UI (design) | Wireframe | Mockup | Prototype |
|----|----------|-------|------------------------|-----------|--------|-----------|
| ALT-01 | Data kosong | List → Empty | `NEmpty description="Belum ada data"` + `NButton type=primary` CTA | `states.png` | `empty.png` | empty toggle |
| ERR-01 | Fetch gagal | List → Error | `NAlert type=error` `Gagal memuat data` + `NButton Retry` (slot error) | `states.png` | `error.png` | error injection |
| ERR-02 | 403 Forbidden | Any → 403 tunggal | Floating global `NAlert` `Akses Ditolak` (Teleport) — **tidak** inline+global ganda | `states.png` | `403.png` | 403 trigger (count=1) |
| ERR-03 | Validasi gagal | Form/auth → Inline | `NFormItem` feedback `Email wajib diisi` + focus | `auth.png` | `validation.png` | login validation |

## Flow → UI Mapping (untuk Task 27)

| Flow Step | Halaman (dari UI 26) | Component (rencana Task 27) | State | File implement |
|-----------|----------------------|------------------------------|-------|----------------|
| Step 1–4b | `/dashboard/*` | `PageShell.vue`, `DataTable.vue` (+ error slot) | loading → empty/error/success + pagination + column toggle | `app/components/layout/PageShell.vue` (baru), `app/components/common/DataTable/DataTable.vue` (kanonis) |
| Step 4c | Any | `AccessDeniedAlert.vue` (tunggal) | visible/dismissed | `app/components/common/AccessDeniedAlert.vue` (rapikan) |
| Step 5 | Sidebar | `layouts/default.vue` | active/collapsed | `app/layouts/default.vue:331` fix 220/72 + token + highlight |
| Step 6 | `/dashboard` | shortcuts (`dashboard/index.vue`) | designer/operator/empty | `app/pages/dashboard/index.vue:50` dinamis via `navigationStore` |
| Step 7 | `/login`+`/register` | `AuthForm` + `layouts/auth.vue` | validation/error/success | `app/pages/login.vue:13`/`register.vue:13` + `auth.vue` |

## Flow → API Mapping (existing, no new endpoint)

| Flow Step | HTTP | Server Route | Validasi | Catatan |
|-----------|------|--------------|----------|---------|
| Step 1–3 | GET | `/api/*` existing (`/api/global-tables`, `/api/data/:tableName`, `/api/components`, `/api/templates`, `/api/administrations`, `/api/documents`, `/api/users`, `/api/roles`, `/api/permissions`, `/api/guards`, `/api/activity-logs`, `/api/system-logs`) | `QuerySchema` existing (`page/limit/search/searchField/sortBy/sortOrder`) | Tidak berubah (DR-001 Task 27) |
| Step 5 | GET | `/api/navigation` (`navigation.service.ts:16` + cache 30s) | `Bearer` | Sumber shortcut dashboard |
| Step 7 | POST | `/api/auth/login` (`auth.dto.ts`) | `LoginSchema` (email+password) | Guest; 401→inline, 200→set token+redirect |

## Invariants untuk Prototype QA

- BR-001 Task 27: 0 warna off-token (`indigo` hits =0) — cek di wireframe/mockup/prototype.
- BR-002: Tidak ada halaman me-render konten kosong tanpa pesan/aksi (dead-end) — `NEmpty+CTA` atau `NAlert+retry`.
- BR-003: Satu event 403 → tepat satu feedback (bukan triple-floating+inline+listener).
- DR-001: Tidak ada kontrak API/schema DB berubah.
- INV-001: RBAC matrix existing tetap lolos.
