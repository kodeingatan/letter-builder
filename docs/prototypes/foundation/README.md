# Prototype — Foundation Interaktif

> Task 26 — Design System Refresh · Status: **DONE** · 2026-09-11

## File

| File | Deskripsi |
|------|-----------|
| `index.html` | **Prototype interaktif** — sidebar 220/72, PageShell, DataTable kanonis (search 320 + select 160 + Refresh + error slot), 6 states, dashboard per peran, login ID — tanpa backend |
| `_prototype-spec.md` | Spec interaksi (debounce 300ms, refresh tanpa reset, motion tokens, a11y, responsive) |
| `../wireframes/foundation/index.html` | Wireframes low-fi (acuan) |
| `../mockups/foundation/index.html` | Mockups hi-fi (acuan pixel-perfect) |
| `../../stories/foundation/` | Storybook stories (PageShell, DataTable, AccessDeniedAlert, Dashboard) |

## Cara Pakai

1. Buka `index.html` di browser (double-click atau `npx serve docs/prototypes/foundation`).
2. Gunakan **Kontrol QA** di bawah konten untuk uji semua 7 User Flow steps.
3. Atau klik langsung: search, Refresh, sidebar menu, Dashboard peran, Login.

## Kontrol QA (di bawah prototype)

| Kontrol | Mengcover | Ekspektasi |
|---------|-----------|------------|
| List | Step 1 (shell) | Header+breadcrumb+tabel tampil |
| Empty | ALT-01 + AC-D01 | NEmpty + CTA (tidak dead-end) |
| Error | ERR-01 + AC-D02 | NAlert + Coba lagi → List |
| Loading | States | NSpin overlay |
| 403 Tunggal | ERR-02 + AC-D03 | Floating global 1 instance (bukan ganda) |
| Collapse 220↔72 | Step 5 + AC-D04 | Width 220↔72 + highlight regex |
| Dashboard select | Step 6 | Designer/Operator/Empty via /api/navigation mock |
| Login | Step 7 + AC-D04 + ERR-03 | Fail inline, success toast + redirect |

## Interaksi Manual

- **Search**: ketik `pegawai` → tunggu 300ms → filtered (mock rows). `Atur Ulang` menghapus filter.
- **Refresh**: isi search `pegawai` → Segarkan → tetap `pegawai` (tanpa reset) + toast `Data dimuat ulang.`
- **Error**: kontrol Error → NAlert → Coba lagi → kembali List.
- **403**: Picu 403 (header atau kontrol) → floating `Akses Ditolak` top-right slide-in 300ms, auto-dismiss 4s, `data-testid="access-denied"` length 1.
- **Sidebar**: klik Pegawai / Surat Tugas / Components → active highlight biru (#EFF6FF border #BFDBFE). Collapse → 72px icon-only + tooltip. Double-click sider juga toggle.
- **Dashboard**: pilih Dashboard → select peran Designer/Operator/Empty → shortcuts berubah (mock navigationStore).
- **Login**: pilih Login → isi salah → `Email wajib diisi` / `Email atau password salah` → isi `admin@admin.com` / `P455w0rd!!!` → `Masuk berhasil`.

## Verifikasi User Flow (checklist reviewer)

- [ ] Steps 1→3: search 320px + Refresh tanpa reset + error slot + retry
- [ ] Step 4: empty/error/403/validation semua ter-render tanpa dead-end
- [ ] Step 5: collapse + navigate semua route dinamis + `<a href>` right-click
- [ ] Step 6: dashboard 3 varian per peran
- [ ] Step 7: login fail→inline, success→redirect + toast ID
- [ ] Responsive 320/768/1024 (resize browser) — toolbar wrap→stack, tabel scroll-x, sider collapse
- [ ] A11y: Tab, aria-label, aria-hidden, live region, reduced-motion
- [ ] 0 indigo (token #3B82F6)

## Link

- Figma: — (HTML prototype sebagai pengganti Figma; link Figma diisi jika ada, else HTML ini adalah prototype)
- Storybook: `npm run storybook -- --port 6006` → Foundation / PageShell / DataTable / AccessDeniedAlert / DashboardShortcuts
- Wireframes: `../../wireframes/foundation/index.html`
- Mockups: `../../mockups/foundation/index.html`
