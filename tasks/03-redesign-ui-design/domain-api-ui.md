<!-- tasks/03-redesign-ui-design/domain-api-ui.md — FASE 1 -->

## UI

> MANDATORY — 10 sub-bagian wajib + deliverables. Token: `app/utils/naiveui-theme.ts` (Notion: primary `#0075de`, hover `#0069c4`, pressed `#005bab`, canvas `#f6f5f4`, hairline `#e6e6e6`, Inter + tracking, radius xs4/sm5/md8/lg12/xl16/full).

### Halaman

| Route | Halaman | Akses | Deskripsi | Wireframe Ref |
|-------|---------|-------|-----------|---------------|
| `/login` | Login | Guest | Auth Card + pill CTA + link register | `wireframes/auth.png` |
| `/register` | Register | Guest | Auth Card + 6 field + pill CTA | `wireframes/auth.png` |
| `/dashboard` | Dashboard | Auth | Hero band `#213183` + 4 stat card + recent users | `wireframes/dashboard.png` |
| `/dashboard/users` | User List | Auth+perm | PageShell + DataTable + UserModal/Drawer + role Badge Pill | `wireframes/list.png` |
| `/dashboard/roles` | Role List | Auth+perm | Idem + guard/permission assignment | `wireframes/list.png` |
| `/dashboard/permissions` | Permission List | Auth+perm | Idem + methods/URLs | `wireframes/list.png` |
| `/dashboard/guards` | Guard List | Auth+perm | Idem + allow/deny URLs | `wireframes/list.png` |
| `/dashboard/activity-logs` | Activity Logs | Auth+perm | Filter + stats + Badge Pill level + drawer | `wireframes/logs.png` |
| `/dashboard/system-logs` | System Logs | Auth+perm | File selector + tabel + drawer | `wireframes/logs.png` |
| `/dashboard/settings` | Settings | Auth+perm | Key-value form + upload card | `wireframes/settings.png` |
| `/dashboard/profile` | Profile | Auth self | 2 card (info + password) | `wireframes/profile.png` |

### Layout

- Navigasi: sidebar App-Shell Row 220/72 (indikator aktif primary bar + tint `#e8f2fd`), group label string, leaf `<a href>` + `router.push` (native right-click preserved).
- Struktur halaman: PageShell (`breadcrumb` → `header title 20px Semibold tracking −0.125px` → `toolbar DataTable` → `konten` → `pagination`) radius lg12, body padding 24px, border hairline.
- Dashboard: hero band full-bleed `#213183` (satu momen gelap) + headline Display 40px/700/−1px putih + 4 stat feature-card + recent users card.
- Halaman: canvas `#f6f5f4`, kartu `#ffffff` hairline; whitespace sebagai grouping utama (gap section 28–32px, bukan rules).
- Grid & spacing: token `docs/design-system.md` (xxs4–xxl32).

### Components

| Component | Lokasi (rencana) | Deskripsi | State Variant |
|-----------|-------------------|-----------|---------------|
| `AuthCard` (refine `AuthForm.vue`) | `app/components/common/AuthForm/` | Card xl16 hairline + Level-1 shadow, field 4px, pill CTA | default, validation, loading |
| `DashboardHero` (baru) | `app/components/features/dashboard/` | Band `#213183` + Display headline + CTA pair | default |
| `BadgePill` (baru) | `app/components/common/BadgePill/` | Eyebrow pill (role/level/kategori), semantic varian | default |
| `EmptyStateCard` (baru) | `app/components/common/EmptyStateCard/` | Frame `#f6f5f4` xl16 + caption + CTA | default |
| `Toast` (wrap `useMessage`) | existing | Surface putih xl16, small text | success, error |
| `ModalCard` (pola `*FormModal`) | `app/components/features/users/` | Radius xl16 + Level-2 shadow, focus trap | default, validation |
| `AppShellRow` (pola `AppLayout`) | `app/components/layout/` | Row sm5 + indikator primary | default, active |
| `DataTable` (refine) | `app/components/common/DataTable/` | Header eyebrow + bg `#f6f5f4`, cell `12px 16px`, row hairline | loading, empty, error |

### Interaction

- Trigger: sidebar row → halaman; `+ Buat` → Modal Card; submit → Toast → re-fetch; hapus → `NPopconfirm`/`NDialog`.
- Flow: validate → inline error → submit → toast `Berhasil` → redirect/re-fetch (lihat User Flow Step 1–11).
- Konfirmasi: destruktif via `NDialog`, tanpa dead-end (empty selalu + CTA).
- Transisi/animasi: token 150/250/350ms + stagger list; hormati `prefers-reduced-motion` (0.01ms).
- Prototype link: Storybook `http://localhost:6006` (`apps/web/stories/redesign/`).

### Responsive Behavior

| Breakpoint | Perilaku | Wireframe Ref |
|------------|----------|---------------|
| Desktop (≥1024px) | Sidebar 220, tabel penuh, toolbar flex-row, dashboard NGrid 3 | `wireframe/desktop.png` |
| Tablet (768–1023px) | Sidebar 72, kolom hide via visibility toggle, toolbar wrap, hero stack | `wireframe/tablet.png` |
| Mobile (<768px) | Sidebar drawer, toolbar column, tabel scroll-x, modal full-width, CTA full-width (min 44px hit) | `wireframe/mobile.png` |

### States

| State | Tampilan | Komponen Naive UI | Mockup Ref |
|-------|----------|-------------------|------------|
| Loading | `NSpin` overlay + `NSkeleton` | `NSpin`, `NSkeleton` | `mockup/loading.png` |
| Empty | Empty-State Card + `Belum ada data` + CTA | `NEmpty` via `#empty` slot | `mockup/empty.png` |
| Error | `NAlert` full-width + `Coba lagi` | `NAlert` | `mockup/error.png` |
| Success | Toast `Berhasil` | `useMessage()` | `mockup/success.png` |
| Validation | Inline field error | `NFormItem` feedback | `mockup/validation.png` |
| Permission Denied | Floating single `NAlert` 4s | `NAlert` + `rbac-denied` | `mockup/403.png` |

### Accessibility

- Keyboard: semua aksi via keyboard, focus trap di modal/drawer, tab order logis, touch target min 44px mobile.
- ARIA: `aria-label` icon-only button, `aria-current="page"` breadcrumb leaf, `aria-hidden` ikon dekoratif, live region untuk toast/alert.
- Kontras & font: ink/canvas ~18:1, primary/putih ~4.6:1 (AA); Inter + tracking eksplisit.
- Reduced motion: `prefers-reduced-motion` → 0.01ms.
- Screen reader: label form + live region feedback; cek via addon a11y Storybook.

### Wireframe & Mockup Deliverables

| Deliverable | Format | Lokasi | Status |
|-------------|--------|--------|--------|
| Wireframe low-fi (11 halaman × 3 breakpoint + states) | PNG | `tasks/03-redesign-ui-design/wireframes/` | TODO |
| Mockup hi-fi (Naive UI + Tailwind + token Notion) | PNG + Vue | `tasks/03-redesign-ui-design/mockups/` + `app/components/...` | TODO |
| Prototype interaktif | Storybook langsung di project | `apps/web/stories/redesign/*.stories.ts` (`npm run storybook` :6006) | TODO |
| Storybook build | Static | `npm run build-storybook` | TODO |

> **Aturan Storybook (WAJIB FASE 1)**: prototype = komponen Vue nyata (Naive UI direct import, Tailwind utility, token `naiveui-theme.ts` Notion) + stories `apps/web/stories/redesign/` (diusulkan: `AuthCard`, `DashboardHero`, `BadgePill`, `EmptyStateCard`, `ToastState`, `ModalCard`, `AppShellRow`, `DataTableNotion`). Verifikasi: `npm run storybook` :6006 & `npm run build-storybook` sukses. Stories `foundation/` existing tidak boleh regresi.

### Design Tokens Check

- [ ] Warna `naiveui-theme.ts` Notion (primary `#0075de`, hover `#0069c4`, pressed `#005bab`, body `#f6f5f4`, border `#e6e6e6`, radius 8/4, Inter)
- [ ] Typography Inter + tracking (Display −1px … H3 −0.125px) + eyebrow header/badge
- [ ] Radius xs4/sm5/md8/lg12/xl16/full (input 4px, button 8px, card 12px, CTA pill, modal 16px)
- [ ] Spacing xxs4–xxl32 + whitespace sebagai grouping
- [ ] Icon `@vicons/carbon` via `h(NIcon, null, { default: () => h(IconName) })`
- [ ] Sticker palette hanya dekoratif (hero/dashboard ilustrasi, category dot) — tidak untuk CTA/struktur
- [ ] Storybook stories me-render dengan `NConfigProvider` + `themeOverrides`
