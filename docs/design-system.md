# Design System

## Overview

Design system menggunakan **Naive UI** sebagai komponen utama dengan Tailwind CSS sebagai pelengkap untuk spacing/utility classes. Semua token didefinisikan melalui Naive UI `GlobalThemeOverrides`.

---

## Color Palette

### Primary

| Token           | Hex         | Usage                  |
| --------------- | ----------- | ---------------------- |
| Primary 50      | `#EFF6FF`   | Background hover/light |
| Primary 100     | `#DBEAFE`   | Soft background        |
| Primary 200     | `#BFDBFE`   | Border light           |
| Primary 300     | `#93C5FD`   | Disabled state         |
| Primary 400     | `#60A5FA`   | Secondary button       |
| **Primary 500** | **`#3B82F6`** | **Main Brand Color** |
| Primary 600     | `#2563EB`   | Button Hover           |
| Primary 700     | `#1D4ED8`   | Active                 |
| Primary 800     | `#1E40AF`   | Strong emphasis        |
| Primary 900     | `#1E3A8A`   | Dark Mode              |

### Natural (Gray)

| Token    | Hex       |
| -------- | --------- |
| Gray 50  | `#F9FAFB` |
| Gray 100 | `#F3F4F6` |
| Gray 200 | `#E5E7EB` |
| Gray 300 | `#D1D5DB` |
| Gray 400 | `#9CA3AF` |
| Gray 500 | `#6B7280` |
| Gray 600 | `#4B5563` |
| Gray 700 | `#374151` |
| Gray 800 | `#1F2937` |
| Gray 900 | `#111827` |

### Semantic Colors

| Token   | Hex       | Usage       |
| ------- | --------- | ----------- |
| Success | `#22C55E` | Success     |
| Warning | `#F59E0B` | Warning     |
| Error   | `#EF4444` | Error       |
| Info    | `#0EA5E9` | Information |

### Background

| Token      | Hex       |
| ---------- | --------- |
| Background | `#FFFFFF` |
| Surface    | `#F8FAFC` |
| Card       | `#FFFFFF` |
| Sidebar    | `#F9FAFB` |

### Border

| Token   | Hex       |
| ------- | --------- |
| Default | `#E5E7EB` |
| Focus   | `#3B82F6` |
| Divider | `#F3F4F6` |

---

## Typography

| Token   | Size | Line Height | Weight   |
| ------- | ---- | ----------- | -------- |
| Display | 32px | 40px        | Bold     |
| H1      | 28px | 36px        | Bold     |
| H2      | 24px | 32px        | Bold     |
| H3      | 20px | 28px        | Semibold |
| H4      | 18px | 26px        | Semibold |
| H5      | 16px | 24px        | Medium   |
| H6      | 14px | 20px        | Medium   |
| Body    | 14px | 20px        | Regular  |
| Small   | 13px | 18px        | Regular  |
| Caption | 12px | 16px        | Regular  |

---

## Spacing

| Token | Value |
| ----- | ----- |
| xs    | 2px   |
| sm    | 4px   |
| md    | 8px   |
| lg    | 12px  |
| xl    | 16px  |
| 2xl   | 24px  |
| 3xl   | 32px  |

---

## Border Radius

| Token | Value  |
| ----- | ------ |
| xs    | 2px    |
| sm    | 4px    |
| md    | 6px    |
| lg    | 8px    |
| xl    | 12px   |
| Full  | 9999px |

---

## Component Dimensions

### Component Height

| Component      | Height |
| -------------- | ------ |
| Button Small   | 28px   |
| Button Default | 32px   |
| Button Large   | 36px   |
| Input          | 32px   |
| Select         | 32px   |
| Badge          | 20px   |
| Tag            | 20px   |
| Switch         | 18px   |
| Checkbox       | 16px   |
| Radio          | 16px   |

### Button Padding

| Size    | Padding  |
| ------- | -------- |
| Small   | `0 10px` |
| Default | `0 12px` |
| Large   | `0 16px` |

### Icon Size

| Token | Size |
| ----- | ---- |
| xs    | 12px |
| sm    | 14px |
| md    | 16px |
| lg    | 20px |
| xl    | 24px |

---

## Container

| Token          | Value |
| -------------- | ----- |
| Card Padding   | 12px  |
| Modal Padding  | 16px  |
| Drawer Padding | 16px  |
| Form Gap       | 12px  |
| Section Gap    | 20px  |

---

## Detail View (Read Detail)

Standar layout untuk semua tampilan **read detail** (drawer sidebar, inline card). Menggantikan `NDescriptions` (table layout) dengan format vertikal **label → value** yang lebih mudah dibaca.

### Pattern

```html
<div class="detail-view">
  <div class="detail-field">
    <span class="detail-label">{LABEL}</span>
    <span class="detail-value">{VALUE}</span>
  </div>
</div>
```

### CSS Tokens (Scoped)

| Class | Property | Value |
|-------|----------|-------|
| `.detail-view` | display | `flex` |
| `.detail-view` | flex-direction | `column` |
| `.detail-field` | padding | `12px 0` |
| `.detail-field` | border-bottom | `1px solid rgba(0,0,0,0.06)` |
| `.detail-field:last-child` | border-bottom | `none` |
| `.detail-label` | display | `block` |
| `.detail-label` | font-size | `11px` |
| `.detail-label` | font-weight | `600` |
| `.detail-label` | text-transform | `uppercase` |
| `.detail-label` | letter-spacing | `0.05em` |
| `.detail-label` | color | `#94a3b8` |
| `.detail-label` | margin-bottom | `4px` |
| `.detail-value` | display | `block` |
| `.detail-value` | font-size | `14px` |
| `.detail-value` | font-weight | `500` |
| `.detail-value` | color | `#1e293b` |
| `.detail-value` | line-height | `1.5` |
| `.detail-value` | word-break | `break-word` |

### Modifiers

| Class | Usage |
|-------|-------|
| `.detail-value--text` | Long text content. `font-weight: 400; color: #334155` |
| `.detail-value--mono` | IDs, timestamps, IPs, code paths. `font-family: SF Mono/Fira Code/Menlo/Consolas; font-size: 13px` |
| `.detail-value--code` | JSON metadata, raw content. `bg: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px` |
| `.detail-value--dark` | Stack traces, dark code blocks. `bg: #1e293b; border: #334155; pre color: #e2e8f0` |

### Action Buttons

Jika detail view memiliki action buttons (Edit, Open in VS Code, Copy, dll):
- Letakkan di **footer drawer** (`<template #footer>`) ATAU inline setelah field terakhir
- Gunakan `NSpace` atau flex container dengan `gap: 8px`
- Jangan hapus action buttons yang sudah ada

```html
<!-- Inline actions (e.g., code link buttons) -->
<div class="detail-field">
  <span class="detail-label">Source Code</span>
  <span class="detail-value detail-value--mono">{path}:{line}</span>
  <div class="detail-actions">
    <NButton size="small" type="primary" secondary>Open in VS Code</NButton>
    <NButton size="small">Copy Path</NButton>
  </div>
</div>
```

### Visual Reference

```
LABEL (11px, uppercase, slate-400, semibold)
Value (14px, slate-800, medium weight)
─────────────────────────────────────────
```

### Implementation Checklist

Semua detail views **WAJIB** menggunakan pola ini:

| Component | File | Status |
|-----------|------|--------|
| Activity Log Detail | `views/ActivityLogsPage.vue` | Done |
| User Detail | `features/users/components/UserDetailDrawer.vue` | Done |
| Role Detail | `features/users/components/RoleDetailDrawer.vue` | Done |
| Permission Detail | `features/users/components/PermissionDetailDrawer.vue` | Done |
| Guard Detail | `features/users/components/GuardDetailDrawer.vue` | Done |
| Profile Info | `views/DashboardPage.vue` | Done |
| System Log Detail | `features/logging/components/LogDetailDrawer.vue` | Done |

**Larangan**: Gunakan `NDescriptions` / `NDescriptionsItem` untuk detail views. Gunakan pola `.detail-view` di atas.

---

## Table

### Dimensions

| Item          | Value |
| ------------- | ----- |
| Row Height    | 36px  |
| Cell Padding  | 8px   |
| Header Height | 40px  |

### Required Features

Semua tabel di sistem **WAJIB** memiliki fitur berikut:

| Feature | Description | Component |
|---------|-------------|-----------|
| **Global Search** | Pencarian global across semua kolom. Input harus lebar minimal `320px` agar teks terlihat jelas. | `NInput` with prefix icon `Search` |
| **Field-Specific Search** | Dropdown untuk memilih kolom tertentu yang ingin dicari. Default: "All Fields". | `NSelect` (filterable, width: `160px`) |
| **Column Visibility** | Toggle show/hide kolom. Persist ke localStorage. | `NPopover` + `NCheckbox` items |
| **Sorting** | Klik header kolom untuk sort ASC/DESC. | `NDataTable` sorter prop |
| **Pagination** | Navigasi halaman dengan page selector. | `NDataTable` built-in pagination |
| **Page Size** | Pilihan jumlah baris per halaman: 10, 20, 50, 100. Default: 20. | `NDataTable` page-sizes |
| **Refresh/Reload** | Tombol refresh untuk fetch ulang data tanpa reset state. | `NButton` with `Restart` icon |

### Search Input Specification

**KENDALA YANG HARUS DIPERBAIKI**: Input search sebelumnya terlalu pendek dan input tidak terlihat.

| Property | Value | Description |
|----------|-------|-------------|
| Min Width | `320px` | Agar placeholder dan input terlihat jelas |
| Max Width | `flex-1` (sisa ruang) | Mengisi ruang yang tersedia |
| Height | `32px` | Sesuai standar Naive UI |
| Placeholder | `Search {entity}...` | Context-aware placeholder |
| Clearable | `true` | Tombol X untuk clear |
| Prefix Icon | `Search` (Carbon) | Icon di sebelah kiri input |
| Debounce | `300ms` | Delay sebelum fetch data |

**Layout Search Bar**:
```
┌──────────────────────────────────────────────────────────┐
│ [Search icon] Search activity logs...          [X clear] │  ← NInput (flex-1, min 320px)
│ [All Fields ▼]                            [Reset] [⚙️]  │  ← NSelect + NButton + NPopover
└──────────────────────────────────────────────────────────┘
```

### Toolbar Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Search input (flex-1)] [Search Field Select] [Reset] [Settings]│  ← Toolbar row
│                                                                 │
│ [Action buttons: Create, Export, etc.]           [Page info]    │  ← Optional secondary row
└─────────────────────────────────────────────────────────────────┘
```

### Sort Indicators
- **Unsorted**: No indicator (column header text only)
- **Ascending**: ↑ arrow (Carbon `ArrowUp` icon, 14px, Primary 500 color)
- **Descending**: ↓ arrow (Carbon `ArrowDown` icon, 14px, Primary 500 color)
- **Transition**: 150ms ease-out color change on hover

### Column Visibility Toggle
- **Trigger**: NPopover with checkbox items
- **Icon**: Carbon `Settings` icon
- **Position**: Toolbar right side, next to refresh button
- **Behavior**: Toggle visibility immediately, persist in localStorage

### Search Field Selector
- **Component**: NSelect (filterable, small size)
- **Default**: "All Fields" option
- **Position**: Toolbar left side, adjacent to search input
- **Width**: 160px fixed

### Pagination Text
- **Format**: "Showing {from}-{to} of {total}"
- **Position**: Below table, left-aligned
- **Style**: `text-sm text-gray-500`

### Loading State
- **Component**: NSpin with `show` prop
- **Overlay**: Semi-transparent white background
- **Position**: Absolute overlay on table

### Empty State
- **Component**: NEmpty
- **Description**: "No {entity} found"
- **Position**: Centered in table body

### Error State
- **Component**: NAlert
- **Type**: error
- **Position**: Above table, full width
- **Dismissable**: Yes (close button)

---

## System Logs Design

### Log Levels

Sistem harus mendukung semua standar log levels:

| Level | Color | Icon | Description |
|-------|-------|------|-------------|
| `TRACE` | `#6B7280` (Gray) | `Information` | Detail trace information |
| `DEBUG` | `#3B82F6` (Blue) | `Bug` | Debugging information |
| `INFO` | `#22C55E` (Green) | `CheckmarkFilled` | General information |
| `NOTICE` | `#0EA5E9` (Sky) | `Warning` | Normal but significant |
| `WARNING` | `#F59E0B` (Amber) | `Warning` | Warning conditions |
| `ERROR` | `#EF4444` (Red) | `Error` | Error conditions |
| `CRITICAL` | `#DC2626` (Red Dark) | `ErrorFilled` | Critical failure |
| `FATAL` | `#991B1B` (Red Darkest) | `Misuse` | Fatal, system will stop |
| `EMERGENCY` | `#7F1D1D` (Red Ultra) | `Power` | System unusable |

### Log Level Badge

```vue
<NTag :type="levelType" size="small" :bordered="false">
  {{ level }}
</NTag>
```

| Level | NTag Type |
|-------|-----------|
| TRACE | `default` |
| DEBUG | `default` |
| INFO | `info` |
| NOTICE | `info` |
| WARNING | `warning` |
| ERROR | `error` |
| CRITICAL | `error` |
| FATAL | `error` |
| EMERGENCY | `error` |

### Log Table Columns

| Column | Key | Width | Sortable | Description |
|--------|-----|-------|----------|-------------|
| Timestamp | `timestamp` | 200px | Yes | ISO format timestamp |
| Level | `level` | 100px | Yes | Log level badge |
| Context | `context` | 150px | Yes | Logger context/service name |
| Message | `message` | flex-1 | No | Log message (ellipsis + tooltip) |
| Actions | `actions` | 120px | No | Detail + Code buttons |

### Log Detail Drawer

Drawer untuk melihat detail log entry:

| Section | Content |
|---------|---------|
| **Timestamp** | Full ISO timestamp + relative time (e.g., "2 hours ago") |
| **Level** | Colored badge |
| **Context** | Service/module name |
| **Message** | Full message, no truncation |
| **Stack Trace** | Pre-formatted code block (if available) |
| **Metadata** | JSON viewer with syntax highlighting |
| **Raw Line** | Original log line for debugging |

### Code Link Action

**Fitur untuk mengarahkan ke kode sumber:**

| Action | Description | Implementation |
|--------|-------------|----------------|
| **Open in VS Code** | Buka file di VS Code dengan baris spesifik | `vscode://file/{path}:{line}` URI scheme |
| **Copy Path** | Salin path file ke clipboard | `navigator.clipboard.writeText()` |
| **Copy Line** | Salin nomor baris | `navigator.clipboard.writeText()` |

**VS Code URI Format**:
```
vscode://file/{absolutePath}:{lineNumber}
```

**Contoh**:
```
vscode://file/home/afdal/project/server/src/modules/auth/auth.service.ts:42
```

**Pattern Detection** (untuk extract path dari stack trace):
```regex
at\s+(?:(?:\S+\s+\()?(\/[^\s:]+):(\d+):\d+\)?)|(?:at\s+(\/[^\s:]+):(\d+))
```

### Log File Selector

| Property | Value |
|----------|-------|
| Component | `NSelect` |
| Width | `300px` |
| Display | `{filename} ({size} KB)` |
| Default | First file in list |
| Refresh | Auto-refresh on file change |

### Log Statistics Bar

Tampilan statistik di atas table:

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ Total: 1,234│ INFO: 800   │ WARN: 200   │ ERROR: 30   │ DEBUG: 204  │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

Each stat is an `NStatistic` component with colored label matching log level.

---

## Layout Dimensions

### Sidebar

| Item        | Value |
| ----------- | ----- |
| Width       | 220px |
| Collapse    | 72px  |
| Item Height | 36px  |

### Navbar

| Item   | Value |
| ------ | ----- |
| Height | 52px  |

---

## Sidebar Navigation

### Menu Item Link Behavior

Setiap menu item (leaf node) dirender sebagai `<a>` tag dengan atribut `href`, bukan `<button>` atau `<div>`.

| Behavior | Implementation |
|----------|---------------|
| Left click | SPA navigation via `router.push()` (preventDefault) |
| Right click | Browser native "Open link in new tab" |
| Ctrl+Click | Browser native open in new tab |
| Middle click | Browser native open in new tab |
| Submenu group | String label (bukan link) |

### Render Pattern

```typescript
// Leaf menu item (punya route)
label: () =>
  h('a', {
    href: '/dashboard/users',
    onClick: (e) => { e.preventDefault(); router.push('/dashboard/users') },
    style: 'text-decoration: none; color: inherit;',
  }, 'User')

// Group submenu (tidak punya route sendiri)
label: 'User Management'  // plain string
```

### Design Rationale

- `<a>` tag memberikan UX browser native (right-click menu, middle-click, Ctrl+click)
- `e.preventDefault()` + `router.push()` mempertahankan SPA behavior untuk left click
- `href` tetap di-set agar URL addressable dan shareable

---

## Responsive

### Device Reference

| Device           | Width       |
| ---------------- | ----------- |
| Mobile           | 320–639px   |
| Tablet Portrait  | 640–767px   |
| Tablet Landscape | 768–1023px  |
| Laptop           | 1024–1279px |
| Desktop          | 1280–1535px |
| Large Desktop    | ≥1536px     |

### Container Width

| Breakpoint | Max Width |
| ---------- | --------- |
| sm         | 640px     |
| md         | 768px     |
| lg         | 1024px    |
| xl         | 1280px    |
| 2xl        | 1536px    |

### Grid System

| Device  | Columns |
| ------- | ------- |
| Mobile  | 4       |
| Tablet  | 8       |
| Desktop | 12      |

### Container Padding

| Device  | Padding |
| ------- | ------- |
| Mobile  | 16px    |
| Tablet  | 24px    |
| Desktop | 32px    |

### Responsive Typography

| Token | Mobile | Tablet | Desktop |
| ----- | ------ | ------ | ------- |
| H1    | 32px   | 40px   | 48px    |
| H2    | 28px   | 32px   | 36px    |
| H3    | 24px   | 28px   | 30px    |
| H4    | 20px   | 24px   | 24px    |
| Body  | 14px   | 16px   | 16px    |
| Small | 12px   | 14px   | 14px    |

---

## Icons

### Icon Library
- **Library**: `@vicons/carbon` (Carbon Design System)
- **Wrapper**: Naive UI `NIcon`
- **Render Pattern**: `h(NIcon, null, { default: () => h(IconName) })`

### Icon Sizes (mapped to component context)

| Context | Size | Icon Token |
|---------|------|------------|
| Button Small | 14px | sm |
| Button Default | 16px | md |
| Button Large | 20px | lg |
| Menu Item | 16px | md |
| Dropdown Item | 16px | md |
| Input Prefix | 16px | md |
| Card Header | 20px | lg |

### Button Icons (Standard Mapping)

| Button Action | Icon | Import |
|---------------|------|--------|
| Sign In / Login | `Login` | `@vicons/carbon` |
| Sign Up / Register | `UserAvatar` | `@vicons/carbon` |
| Add / Create | `Add` | `@vicons/carbon` |
| Edit | `Edit` | `@vicons/carbon` |
| Delete | `TrashCan` | `@vicons/carbon` |
| Search | `Search` | `@vicons/carbon` |
| Refresh | `Restart` | `@vicons/carbon` |
| Export / Download | `Download` | `@vicons/carbon` |
| Import / Upload | `Upload` | `@vicons/carbon` |
| Settings | `Settings` | `@vicons/carbon` |
| Back / Arrow Left | `ArrowLeft` | `@vicons/carbon` |
| Forward / Arrow Right | `ArrowRight` | `@vicons/carbon` |
| Close | `Close` | `@vicons/carbon` |
| Check / Confirm | `Checkmark` | `@vicons/carbon` |

### Menu Item Icons (Current Mapping)

| Menu Item | Icon | Import |
|-----------|------|--------|
| Dashboard | `Grid` | `@vicons/carbon` |
| User Management | `UserMultiple` | `@vicons/carbon` |
| User | `User` | `@vicons/carbon` |
| Guard | `Security` | `@vicons/carbon` |
| Role | `UserRole` | `@vicons/carbon` |
| Permissions | `Document` | `@vicons/carbon` |
| Profile | `UserAvatar` | `@vicons/carbon` |
| Logout | `Logout` | `@vicons/carbon` |

---

## Animations

### Library
- **Primary**: CSS Transitions & Vue `<Transition>`
- **Optional**: `anime.js` (lightweight, ~17KB gzipped)

### Animation Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| Fast | 150ms | ease-out | Hover effects, button states |
| Normal | 250ms | ease-in-out | Page transitions, card reveals |
| Slow | 350ms | ease-in-out | Modal/drawer enter/leave |
| Bounce | 400ms | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Emphasis, notifications |

### Page Transitions

| Transition | Enter | Leave | Usage |
|------------|-------|-------|-------|
| Fade | opacity 0→1 | opacity 1→0 | Default page transition |
| Slide-Up | translateY(20px)→0 + opacity | reverse | Dashboard content |
| Slide-Left | translateX(20px)→0 + opacity | reverse | Sidebar content |
| Scale | scale(0.95)→1 + opacity | reverse | Cards, modals |

### Micro-Interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| Button | hover | scale(1.02) + shadow increase |
| Button | click | scale(0.98) then scale(1) |
| Card | mount | slideUp 250ms staggered |
| Menu Item | hover | background-color 150ms |
| Menu Item | active | border-left 250ms |
| Input | focus | border-color 200ms |
| Alert | mount | slideDown 250ms + fade |
| Dropdown | enter | scale(0.95)→1 + opacity |
| Toast | enter | slideInRight 300ms |
| Toast | leave | slideOutRight 200ms |

### Vue Transition Classes

```css
/* Fade */
.fade-enter-active, .fade-leave-active { transition: opacity 250ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Slide-Up */
.slide-up-enter-active, .slide-up-leave-active { transition: all 250ms ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(20px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }

/* Slide-Left */
.slide-left-enter-active, .slide-left-leave-active { transition: all 250ms ease; }
.slide-left-enter-from { opacity: 0; transform: translateX(20px); }
.slide-left-leave-to { opacity: 0; transform: translateX(-10px); }

/* Scale */
.scale-enter-active, .scale-leave-active { transition: all 250ms ease; }
.scale-enter-from { opacity: 0; transform: scale(0.95); }
.scale-leave-to { opacity: 0; transform: scale(0.95); }
```

### Stagger Animation Pattern
Untuk list items (table rows, menu items, cards):
```css
.stagger-item { animation: slideUp 250ms ease backwards; }
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
/* ... dst */
```

### Reduced Motion
Semua animasi harus menghormati `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Notes

- **Naive UI** adalah komponen utama — gunakan `GlobalThemeOverrides` untuk customisasi tema
- **Tailwind CSS** hanya untuk utility classes (spacing, display, flexbox) yang tidak tersedia di Naive UI
- Semua komponen harus dibungkus dengan `NConfigProvider`
- Gunakan direct import per komponen, jangan global import
- Gunakan `v-model:value` untuk form components
- Gunakan `on-update:*` pattern untuk event handlers

---

## Authorization UI Patterns

### Access Denied Alert

When user lacks permission for an action:

| Element | Component | Usage |
|---------|-----------|-------|
| Access Denied Alert | `NAlert` type="error" | Shown when 403 returned from API |
| Alert Title | "Access Denied" | Bold heading |
| Alert Description | "You don't have permission to perform this action" | Body text |
| Alert Icon | `Locked` from `@vicons/carbon` | Left icon |
| Dismissable | `true` | Close button available |

### Conditional Rendering

```vue
<!-- Hide button if user lacks permission -->
<NButton v-if="hasPermission('User Management')" @click="createUser">
  Add User
</NButton>

<!-- Hide menu item if user lacks role -->
<NMenuItem v-if="hasAnyRole(['Admin', 'Super Admin'])" key="users">
  User Management
</NMenuItem>
```

### Route Guard Pattern

```typescript
// router/index.ts
meta: { 
  requiresAuth: true,
  requiredRole: 'Admin',        // Optional: require specific role
  requiredPermission: 'User Management'  // Optional: require specific permission
}
```

### Error Response Handling

| HTTP Status | Client Action | UI Feedback |
|-------------|---------------|-------------|
| 401 | Clear token, redirect `/login` | "Session expired" message |
| 403 | Show access denied alert | "Access denied" NAlert |
| 404 | Show not found page | "Resource not found" |
| 500 | Show error alert | "Server error" NAlert |

---

## Profile Page

### Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/auth/profile` | Bearer | Update profil sendiri (firstName, lastName, email, username) |
| PATCH | `/api/auth/password` | Bearer | Ganti password (currentPassword, newPassword, confirmPassword) |

### Layout

```
AppLayout
├── NCard "Profile Information"
│   ├── NForm (firstName, lastName, email, username)
│   └── NButton "Save Changes"
│
└── NCard "Change Password"
    ├── NForm (currentPassword, newPassword, confirmPassword)
    └── NButton "Change Password"
```

### Form Fields

**Profile Information**:

| Field | Component | Validation | Pre-filled |
|-------|-----------|------------|------------|
| First Name | NInput | required, max 100 | Yes |
| Last Name | NInput | required, max 100 | Yes |
| Email | NInput (email) | valid email, unique | Yes |
| Username | NInput | min 3, max 30, alphanumeric + underscore, unique | Yes |

**Change Password**:

| Field | Component | Validation |
|-------|-----------|------------|
| Current Password | NInput (password) | required |
| New Password | NInput (password) | min 8, uppercase + lowercase + number |
| Confirm Password | NInput (password) | must match new password |

### Access

- Dari dropdown header: klik "Profile" → navigasi ke `/dashboard/profile`
- Tidak perlu `@Roles` atau `@Permissions` — semua user yang login bisa akses
- Self-service: user hanya bisa edit data sendiri
