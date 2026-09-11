# Prototype Interaction Spec — Foundation (Task 26)

> Merujuk `docs/wireframes/foundation/_user-flow-map.md` + `docs/wireframes/foundation/index.html` + `docs/mockups/foundation/index.html` + prototype `docs/prototypes/foundation/index.html`.

## Keputusan Kunci (dari Audit Matrix)

- **Locale**: ID — semua copy (`Selamat Datang`, `Masuk`, `Daftar`, `Belum ada data`, `Gagal memuat data`, `Akses Ditolak`, `Segarkan`, `Atur Ulang`, `Segarkan menu`). Task 27 mengganti `Welcome back!` → `Selamat Datang Kembali`.
- **403 tunggal**: floating global Teleport top-right — `app/components/common/AccessDeniedAlert.vue` (satu instance, `data-testid="access-denied"`). Hapus `addEventListener('rbac-denied')` per halaman di Task 27. Verifikasi: `querySelectorAll('[data-testid=access-denied"].show').length ===1`.
- **Sidebar**: `NLayoutSider :width=220 :collapsed-width=72` (bukan 240/64), token #3B82F6, distinct Dokumen icons, `resolveActiveKey` regex `data-table-*`, `persuratan-*`, `runs/:id`, `documents/:id`.

## Interaction per User Flow

| Step | Trigger | Debounce / Duration | Handler | Hasil | Prototipe kontrol |
|------|---------|---------------------|---------|-------|-------------------|
| 2 Search | `NInput` `@update:value` | **300ms debounce** (`setTimeout` di `DataTable.vue:108`) | `emit('search', value)` → `GET /api/*?search=` | Tabel terfilter, pagination reset ke page 1, tidak ada flicker | Ketik di search — list menyaring setelah 300ms |
| 3 Refresh | `NButton Restart` `aria-label="Segarkan data"` | — | `emit('refresh')` → refetch `GET` dengan query existing (search/sort/page dipertahankan) — **tanpa reset** | Data refetch, toast `Data dimuat ulang.` | Tombol Segarkan — loading overlay 0.6s lalu toast, query tetap |
| 4a Empty | `data.length===0 && !loading && !error` | — | `NEmpty description="Belum ada data"` + CTA `+ Buat Global Table Pertama` (slot empty) | Tidak dead-end (BR-002) | Kontrol Empty — tabel hilang, NEmpty+CTA muncul |
| 4b Error | `error: string\|null` prop | — | `NAlert type="error" closable` + `<NButton @click="retry">Coba lagi</NButton>` di atas tabel (slot error) | Alert full-width, retry tanpa reset | Kontrol Error — NAlert+retry, tombol retry kembali ke list |
| 4c 403 | `useApi.ts:25` `dispatch 'rbac-denied'` → `AccessDeniedAlert` | slideIn 300ms ease-out, auto-dismiss 4000ms, closable | Hanya satu instance floating global | Kontrol 403 — floating muncul, tidak ada inline duplikat |
| 5 Collapse | Sider trigger / state `collapsed` | 250ms ease (NLayoutSider transition) | `collapsed ? 72 : 220`, icon-only tooltip | Label tooltip, highlight tetap | Kontrol Collapse / double-click sider |
| 5 Navigate | `renderMenuLabel` `<a href>` + `preventDefault`+`router.push` | 150ms hover | `resolveActiveKey` regex highlight | Active benar di semua route dinamis + native right-click/Ctrl+Click | Klik menu Pegawai/Run/Surat |
| 6 Dashboard | `navigationStore.fetch()` → `GET /api/navigation` (30s cache) | — | Shortcuts per `dataEntries/persuratanEntries`; empty → `NEmpty` + `Minta Akses` (EC-01) | 3 varian designer/operator/empty | Select Dashboard peran |
| 7 Login fail | `POST /api/auth/login` 401 | — | `NAlert error` di atas form + `NFormItem` `validate` inline `Email wajib diisi` + focus first invalid | Tidak redirect | Isi salah → Masuk di prototype login |
| 7 Login success | 200 + `setToken` | — | `navigateTo('/dashboard')` + `useMessage` success | Redirect + toast `Masuk berhasil` | Isi `admin@admin.com` / `P455w0rd!!!` → Masuk |

## Transisi / Animasi (Token)

| Token | Duration | Easing | Usage | Prototipe |
|-------|----------|--------|-------|-----------|
| Fast | 150ms | ease-out | hover, button scale, menu hover | `.btn:hover` scale(1.02), menu hover bg |
| Normal | 250ms | ease | page, card reveal, NAlert slideDown, sider width | sider `width 250ms ease`, page `page-enter 250ms` |
| Slow | 350ms | ease-in-out | modal/drawer, toast slide-in | toast `300ms ease` (Slow-), drawer 350ms |
| Reduced | 0.01ms | — | `@media (prefers-reduced-motion: reduce)` | media query di prototype |

Implementasi `usePageTransition` (Task 27): `fadeInUp` (opacity 0→1, translateY 20→0, 500ms outExpo) untuk page, `staggerFadeIn` (delay stagger 80) untuk cards/rows. Jika tidak dipakai → hapus dependensi animejs mati.

## Validasi alur (QA Checklist di Prototype)

- [ ] Step 1→2: ketik search → 300ms → filtered, pagination info update.
- [ ] Step 3: isi search `pegawai` → Segarkan → tetap filtered `pegawai` (tidak reset).
- [ ] Step 4a/b/c: Empty → CTA ada; Error → NAlert+retry → List; 403 → tepat satu alert (`$$('[data-testid=access-denied"].show').length===1`).
- [ ] Step 5: Collapse 220↔72 → navigate `/dashboard/data/pegawai` → highlight `data-table-pegawai` active (bukan dashboard).
- [ ] Step 6: Dashboard Designer → 3 Data + 2 Persuratan; Operator → 1+1; Empty → NEmpty + panduan (tidak kosong).
- [ ] Step 7: Login kosong → validation inline; salah → inline NAlert; benar → toast + redirect dashboard; link Daftar/Masuk warna #3B82F6.
- [ ] Toolbar ukuran: search computed width ≥320px (cek `getComputedStyle(input).minWidth`), select 160px.
- [ ] Keyboard: Tab urutan search → select → Segarkan → Atur Ulang → ⚙ → tabel header sortable → pagination → CTA (focus visible).
- [ ] ARIA: icon-only buttons `aria-label`, dekorasi `aria-hidden`, toast/alert `role="status"/"alert"` `aria-live`.

## Responsive

| Breakpoint | Sider | Toolbar | Table | Dashboard columns | Form |
|------------|-------|---------|-------|-------------------|------|
| Desktop ≥1024 | 220 terbuka | row: search flex-1 + select 160 + buttons | 12 kolom | 3 | grid 2 |
| Tablet 768–1023 | collapse 72 (atau overlay) | wrap: search full-row, field+buttons baris 2 | scroll-x | 2 | grid 2 |
| Mobile <768 | overlay collapse → translateX(-100%) until toggle | stack: search full-width, field+buttons baris 2, tabel scroll-x/card | card per row | 1 | full-width |

## Handoff untuk Task 27

- **PageShell.vue** baru `app/components/layout/` — props `title`, `breadcrumbs`, slot `actions` + `default`; padding 20px, NCard-like shadow.
- **DataTable kanonis** `app/components/common/DataTable/DataTable.vue` — props baru `error`, `refreshing`, `onRetry`; toolbar 320/160+Restart+Reset+Settings; semua icons via `h(NIcon)`; slot `empty` CTA; live story di `stories/foundation/`.
- **AccessDeniedAlert** tunggal — keep Teleport global, hapus 4 per-page listeners.
- **Dashboard** `app/pages/dashboard/index.vue` — ganti hard-coded RBAC cards → `navigationStore` projection + empty state.
- **Auth** `app/pages/login.vue`/`register.vue` + `layouts/auth.vue` — satu locale ID + autocomplete + token link.
- **Sidebar** `app/layouts/default.vue:331/341/375` — 220/72 + token + distinct icons + highlight regex + aria-label.
- **Motion** — aktifkan `usePageTransition` di layout atau hapus jika mati, tokenisasi keyframes.
