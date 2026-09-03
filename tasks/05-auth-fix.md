# 05 — Auth Flow, Token Persistence & Content Loading Fix

## Overview

Setelah login, user navigasi ke Guard/Role/Permission → konten tidak muncul. Refresh di `/dashboard` juga tidak auto-redirect ke login jika token expired. Root cause utama: **semua entity store (`guards.ts`, `roles.ts`, `permissions.ts`, `users.ts`) melakukan `$fetch` TANPA header `Authorization`**, padahal server API memerlukannya. Akibatnya semua data table menerima 401 Unauthorized.

**Goal**: Perbaiki auth flow end-to-end: token tersimpan & terkirim, konten navigasi berjalan, auto-logout on refresh, tidak ada flashing.

---

## Root Cause Analysis

### CRITICAL: Entity stores tidak kirim Authorization header

**Files**: `stores/guards.ts:30,48,63,78`, `stores/roles.ts:30,48,63,78`, `stores/permissions.ts:30,48,63,78`, `stores/users.ts:30,48,63,78`, `stores/settings.ts:57,73,88`

Semua `$fetch` call di entity stores TIDAK menyertakan `headers: { Authorization: 'Bearer ...' }`. Contoh di `guards.ts:30`:
```typescript
const response = await $fetch<PaginatedResponse<Guard>>('/api/guards', { params: query as any })
// ❌ Tidak ada Authorization header
```

Sementara setiap API endpoint memerlukan header tersebut:
```typescript
// server/api/guards/index.get.ts:7-9
const auth = getHeader(event, 'authorization')
if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
```

**Impact**: Setelah login, navigasi ke Guard/Role/Permission → data tidak muncul, error 401. Navigasi ke page lain juga terkena karena setiap page memanggil `store.fetchAll()` di `onMounted`.

### HIGH: Guest middleware tidak redirect & desync store

**File**: `app/middleware/auth.ts:10-14`

```typescript
if (to.meta.guest && token) {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('user')
  return  // ❌ Tidak navigateTo(), tidak clear Pinia store
}
```

- localStorage di-clear, tapi Pinia `authStore.token` masih ada → split brain
- User di `/login` dengan token masih ada di memory

### HIGH: SSR auth enforcement tidak ada

**File**: `app/middleware/auth.ts:2`

`if (import.meta.server) return` — middleware skip di server, protected pages SSR dengan `authStore.user = null`.

### MEDIUM: Redundant fetchProfile() di setiap page

**Files**: `dashboard/index.vue:18-19`, `guards.vue:36-38`, `roles.vue`, `permissions.vue`, `users.vue`, `profile.vue`, `settings.vue`

Setiap navigasi antar dashboard page memanggil `fetchProfile()` → duplicate HTTP requests, loading flash.

### MEDIUM: useMessage() di SSR

**Files**: `GuardTable.vue:16`, `RoleTable.vue:16`, `PermissionTable.vue:16`, `settings.vue:12`, `profile.vue:21`

`useMessage()` dijalankan saat SSR setup, tapi `NMessageProvider` hanya available setelah client hydration.

---

## Implementation Plan

### Phase 1: Fix Entity Stores — Authorization Header (CRITICAL)

**Priority**: CRITICAL
**Est. Files**: 5 (modify existing stores)

#### 1.1 Tambah Authorization header ke semua entity stores

Tambahkan `headers: { Authorization: \`Bearer ${useAuthStore().token}\` }` ke semua `$fetch` call di:

| Store | Methods | File |
|-------|---------|------|
| `guards.ts` | `fetchAll`, `create`, `update`, `remove` | `stores/guards.ts:30,48,63,78` |
| `roles.ts` | `fetchAll`, `create`, `update`, `remove` | `stores/roles.ts:30,48,63,78` |
| `permissions.ts` | `fetchAll`, `create`, `update`, `remove` | `stores/permissions.ts:30,48,63,78` |
| `users.ts` | `fetchAll`, `create`, `update`, `remove` | `stores/users.ts:30,48,63,78` |
| `settings.ts` | `fetchAll`, `update`, `delete` | `stores/settings.ts:57,73,88` |

**Contoh implementasi** (`guards.ts:30`):
```typescript
import { useAuthStore } from '~/stores/auth'

// Di dalam fetchAll():
const authStore = useAuthStore()
const response = await $fetch<PaginatedResponse<Guard>>('/api/guards', {
  params: query as any,
  headers: { Authorization: `Bearer ${authStore.token}` },
})
```

**Pattern yang sama untuk semua store & semua method** (`create`, `update`, `remove`).

#### 1.2 Alternatif: Refactor ke useApi composable (RECOMMENDED)

`composables/useApi.ts` sudah memiliki axios interceptor yang自动 attach token. Tapi目前 tidak ada yang menggunakannya.

**Pilihan**: Refactor semua store untuk menggunakan `useApi()` alih-alih `$fetch` langsung. Ini lebih maintainable karena:
- Token attachment di satu tempat
- Auto-logout on 401 sudah ada di interceptor
- Tidak perlu ulang header di setiap method

**Contoh refactor** (`guards.ts`):
```typescript
import { useApi } from '~/composables/useApi'

export const useGuardsStore = defineStore('guards', () => {
  const api = useApi()

  async function fetchAll(params?: Partial<QueryGuard>) {
    loading.value = true
    try {
      const query = { ... }
      const response = await api.get<PaginatedResponse<Guard>>('/guards', { params })
      // ...
    }
  }
})
```

**Decision**: Pilih mana? (1) Quick fix: tambah header manual ke semua store, atau (2) Refactor ke useApi. Kedua opsi diselesaikan di phase ini.

---

### Phase 2: Fix Auth Middleware (HIGH)

**Priority**: HIGH
**Est. Files**: 1 (modify existing)

**File**: `app/middleware/auth.ts`

#### 2.1 Fix guest middleware — redirect + clear store

```typescript
if (to.meta.guest && token) {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('user')
  // Clear Pinia store juga
  const authStore = useAuthStore()
  authStore.logout()
  return navigateTo('/dashboard')  // Redirect ke dashboard
}
```

#### 2.2 Use Pinia store alih-alih raw localStorage

```typescript
// Sebelumnya:
const token = localStorage.getItem('accessToken')

// Sesudahnya:
const authStore = useAuthStore()
const token = authStore.token
```

Ini menghapus dual source of truth.

#### 2.3 Enforce auth di SSR (opsional, butuh server-side token validation)

Opsi A: Biarkan `<ClientOnly>` handle (current behavior) — simple tapi ada flash.
Opsi B: Validasi token di server middleware, set `event.context.user` lalu pass ke page. — Tapi ini requires page-level handling untuk SSR auth state.

**Decision**: Opsi A (current) dulu karena layout sudah di `<ClientOnly>`. Flash minimal.

---

### Phase 3: Fix fetchProfile Redundancy (MEDIUM)

**Priority**: MEDIUM
**Est. Files**: 6 (modify existing pages)

#### 3.1 Hapus fetchProfile() dari semua page

Hapus `onMounted(async () => { await authStore.fetchProfile() })` dari:
- `dashboard/index.vue:18-19`
- `guards.vue:36-38`
- `roles.vue:36-38`
- `permissions.vue:36-38`
- `users.vue:36-38`
- `profile.vue` 
- `settings.vue:27`

#### 3.2 Pindahkan ke layout atau plugin

**Pilihan A**: Panggil `fetchProfile()` sekali di `layouts/default.vue` `onMounted`.
**Pilihan B**: Panggil di `app.vue` atau Nuxt plugin yang running sekali saat app mount.

**Recommended**: Pilihan A — `layouts/default.vue` already wrapped in `<ClientOnly>`, tinggal tambah:
```typescript
onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchProfile()
  }
})
```

**Note**: `activity-logs.vue` dan `system-logs.vue` sudah tidak panggil `fetchProfile()` — ini konsisten setelah perubahan.

---

### Phase 4: Fix useMessage SSR Issue (MEDIUM)

**Priority**: MEDIUM
**Est. Files**: 5 (modify existing components)

#### 4.1 Wrap useMessage() dengan guard

Di semua component yang menggunakan `useMessage()`:

**Files**: `GuardTable.vue:16`, `RoleTable.vue:16`, `PermissionTable.vue:16`, `settings.vue:12`, `profile.vue:21`

```typescript
// Sebelumnya:
const message = useMessage()

// Sesudahnya (opsi 1 — wrapper):
const message = import.meta.client ? useMessage() : null

// Atau (opsi 2 — inject pattern):
let message: ReturnType<typeof useMessage> | null = null
onMounted(() => { message = useMessage() })
```

**Recommended**: Opsi 1 karena lebih clean. Tapi cek apakah Naive UI `useMessage()` throw saat tidak ada provider di server. Jika tidak throw (returns undefined), bisa skip.

---

### Phase 5: Fix Settings/Profile useMessage (MEDIUM)

**Priority**: MEDIUM
**Est. Files**: 2 (modify existing)

**File**: `settings.vue:12`, `profile.vue:21`

`useMessage()` dijalankan di `<script setup>` top-level. Ini execute saat SSR. Wrap dengan `onMounted` atau gunakan pattern yang sama dengan Phase 4.

---

### Phase 6: Verification (CRITICAL)

**Priority**: CRITICAL

#### 6.1 Manual testing flow

```
1. Buka /dashboard tanpa login → harus redirect ke /login
2. Login → dashboard muncul dengan user info
3. Klik Guard → data table muncul (tidak 401)
4. Klik Role → data table muncul
5. Klik Permission → data table muncul
6. Klik Users → data table muncul
7. Refresh /dashboard → tetap di /dashboard (authenticated)
8. Clear localStorage → refresh → redirect ke /login
```

#### 6.2 E2E test tambahan

Tambah test case di `test/e2e/crud.spec.ts`:
- Test navigasi antar page tidak corrupt state
- Test refresh di /dashboard tetap login
- Test clear localStorage + redirect ke /login

---

## Execution Order

| Phase | Priority | Est. Files | Description |
|-------|----------|------------|-------------|
| 1 | CRITICAL | 5 | Fix entity stores — tambah Authorization header |
| 2 | HIGH | 1 | Fix auth middleware — redirect, clear store |
| 3 | MEDIUM | 7 | Hapus redundant fetchProfile(), pindah ke layout |
| 4 | MEDIUM | 5 | Fix useMessage() SSR guard |
| 5 | MEDIUM | 2 | Fix settings/profile useMessage |
| 6 | CRITICAL | 0 | Verify all flows |

**Total modified files**: ~15
**Total new files**: 0 (phase 1 refactor ke useApi bisa tambah 1-2 util files)
**Estimated effort**: 1-2 hours

---

## Decisions Needed

1. **Phase 1**: Quick fix (header manual) atau refactor ke `useApi`? → Quick fix lebih cepat, refactor lebih maintainable
2. **Phase 2**: SSR auth enforcement? → Skip dulu, `<ClientOnly>` sudah handle
3. **Phase 4**: `useMessage()` guard approach? → Opsi 1 (import.meta.client guard)

---

## Anti-Patterns to Avoid

| ❌ Avoid | ✅ Better |
|---------|-----------|
| Raw `localStorage.getItem()` di middleware | Gunakan Pinia store sebagai single source of truth |
| `fetchProfile()` di setiap page | Panggil sekali di layout |
| `$fetch` tanpa Authorization header di protected endpoints | Selalu sertakan token via store/composable |
| `useMessage()` di SSR context | Guard dengan `import.meta.client` atau `onMounted` |
