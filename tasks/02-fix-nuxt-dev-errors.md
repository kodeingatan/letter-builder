# 02 — Fix Nuxt Dev Errors

## Overview

Project `business-managenet-system/app/` mengalami error saat `npm run dev`. Error utama: **`localStorage is not defined`** saat SSR, ditambah beberapa isu terkait konversi dari Vue 3 + Vite ke Nuxt 4.

**Source**: `~/Laboratorium/Bisnis Digital/business-managenet-system/app/`
**Command**: `npm run dev` → http://localhost:3000

---

## Error Log (Captured)

```
ERROR 500 — localStorage is not defined
  at app/middleware/auth.global.ts:5:16

WARN  [NUXT_B3011] Two component files resolving to the same name BaseButton:
  - components/base/Button/index.ts
  - components/base/Button/Button.vue

WARN  Duplicated imports (30+ warnings):
  - shared/types/index.ts re-exports types that individual files also export
```

---

## Root Cause Analysis

### Error 1: `localStorage is not defined` (CRITICAL — blocks all pages)

**File**: `app/middleware/auth.global.ts:2`

```typescript
// BROKEN: Runs during SSR where localStorage doesn't exist
const token = localStorage.getItem('accessToken')
```

**Cause**: Global middleware runs on both server (SSR) and client. `localStorage` is browser-only.

**Fix**: Guard with `import.meta.client` or make middleware client-only.

### Error 2: `AuthLayout` component not found (CRITICAL — blocks login/register)

**Files**: `app/pages/login.vue:48`, `app/pages/register.vue:75`

```vue
<!-- BROKEN: AuthLayout component doesn't exist -->
<AuthLayout title="Selamat Datang" subtitle="Masuk ke akun Anda" image-position="left">
```

**Cause**: Pages use `<AuthLayout>` as a component wrapper, but no component named `AuthLayout` exists. The auth layout is in `layouts/auth.vue` (Nuxt layout system). Additionally, pages also set `definePageMeta({ layout: 'auth' })` — contradictory (double-wrapping).

**Fix**: Remove `<AuthLayout>` wrapper from templates. Keep `definePageMeta({ layout: 'auth' })`. Move title/subtitle props into `layouts/auth.vue` via `definePageMeta` or route meta.

### Error 3: Pinia stores not auto-imported (HIGH — blocks all pages)

**Files**: All pages/layouts use `useAuthStore()`, `useSettingsStore()` without import.

**Cause**: Nuxt 4 does NOT auto-import from `stores/` directory. Only composables in `composables/` are auto-imported.

**Fix**: Either:
- (A) Add `imports: { dirs: ['stores'] }` to `nuxt.config.ts` — **chosen approach** (minimal change)
- (B) Add explicit `import { useAuthStore } from '~/stores/auth'` to every file (verbose, error-prone)

### Error 4: Duplicate BaseButton component name (MEDIUM — warning)

**Files**: `components/base/Button/index.ts` and `components/base/Button/Button.vue`

**Cause**: Nuxt auto-imports `Button.vue` as `BaseButton` (from dir name). The `index.ts` also exports `Button`. Two files resolve to `BaseButton`.

**Fix**: Rename `index.ts` export or exclude it from Nuxt's component scanning.

### Error 5: `$fetch` response wrapping mismatch (MEDIUM — runtime errors)

**Files**: All Pinia stores (e.g., `stores/users.ts:30-31`)

```typescript
// Store expects:
const response = await $fetch<{ data: PaginatedResponse<User> }>('/api/users')
users.value = response.data.data  // Double .data

// Server returns (from users.service.ts):
return { data: sanitized, total, page, limit, totalPages }
// No outer { data: ... } wrapper
```

**Fix**: Change store types to match actual server response:
- `$fetch<PaginatedResponse<User>>('/api/users')` → `response.data`
- Or wrap server responses in `{ data: ... }` consistently

### Error 6: `window.dispatchEvent` in useApi.ts (MEDIUM — SSR crash)

**File**: `app/composables/useApi.ts:26-29`

```typescript
// Crashes during SSR
window.dispatchEvent(new CustomEvent('rbac-denied', { ... }))
```

**Fix**: Guard with `import.meta.client`.

---

## Implementation Plan

### Phase 1: Fix Critical SSR Error (localStorage)

**Priority**: CRITICAL
**File**: `app/middleware/auth.global.ts`

**Action**: Wrap entire middleware body with `import.meta.client` guard:

```typescript
export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return  // Skip SSR

  const token = localStorage.getItem('accessToken')
  // ... rest of middleware
})
```

**Alternative** (cleaner): Create `auth.client.ts` middleware instead of `auth.global.ts`:
- Rename to `auth.global.client.ts` (Nuxt convention: client-only global middleware)
- Or split: keep global middleware simple, add `.client.ts` suffix

**Chosen approach**: Use `import.meta.client` guard (simpler, keeps file name).

**Verification**: `curl http://localhost:3000/login` should return HTML (not 500 error).

---

### Phase 2: Fix AuthLayout Component Resolution

**Priority**: CRITICAL
**Files**: `app/pages/login.vue`, `app/pages/register.vue`, `app/layouts/auth.vue`

**Current state**:
- `login.vue` line 10: `definePageMeta({ layout: 'auth', middleware: 'auth' })`
- `login.vue` line 48: `<AuthLayout title="Selamat Datang" subtitle="..." image-position="left">`
- `layouts/auth.vue`: Accepts `title`, `subtitle`, `imagePosition` props

**Problem**: `definePageMeta({ layout: 'auth' })` wraps page in `layouts/auth.vue`, THEN the template also wraps content in `<AuthLayout>` component (which doesn't exist).

**Fix** (two options):

**Option A** (Use layout system properly):
1. Remove `<AuthLayout>` wrapper from `login.vue` and `register.vue` templates
2. Move title/subtitle into route meta: `definePageMeta({ layout: 'auth', layoutProps: { title: 'Selamat Datang', subtitle: '...' } })`
3. Update `layouts/auth.vue` to accept props from route meta

**Option B** (Use component instead of layout):
1. Remove `layout: 'auth'` from `definePageMeta`
2. Create `components/common/AuthLayout.vue` component that accepts title/subtitle/imagePosition
3. Keep using `<AuthLayout>` in templates

**Chosen**: Option A (cleaner Nuxt pattern).

**Detailed changes**:

1. **`app/pages/login.vue`**:
   - Remove `<AuthLayout>` and `</AuthLayout>` wrapper (lines 48, 85)
   - Update `definePageMeta`:
     ```typescript
     definePageMeta({
       layout: 'auth',
       layoutProps: {
         title: 'Selamat Datang',
         subtitle: 'Masuk ke akun Anda',
         imagePosition: 'left',
       },
     })
     ```

2. **`app/pages/register.vue`**:
   - Same pattern: remove `<AuthLayout>` wrapper, add `layoutProps`

3. **`app/layouts/auth.vue`**:
   - Accept props from Nuxt layout system (check if `definePageMeta` passes layoutProps)
   - Nuxt 4: layout props are passed via `definePageMeta({ layout: { name: 'auth', props: {...} } })`
   - OR use `useRoute().meta` to access layout props

**Verification**: Login page renders correctly with image panel + form.

---

### Phase 3: Fix Pinia Auto-Imports

**Priority**: HIGH
**File**: `app/nuxt.config.ts`

**Action**: Add `imports.dirs` to include `stores/`:

```typescript
export default defineNuxtConfig({
  // ... existing config
  imports: {
    dirs: ['stores'],
  },
})
```

**Verification**: All pages load without "useAuthStore is not defined" errors.

---

### Phase 4: Fix Duplicate BaseButton

**Priority**: MEDIUM
**File**: `app/components/base/Button/index.ts`

**Action**: Remove or rename. Since Nuxt auto-imports `Button.vue` as `BaseButton`, the `index.ts` barrel export creates a conflict.

**Fix**: Delete `components/base/Button/index.ts` (it's redundant — Nuxt auto-imports the `.vue` file directly).

**Verification**: No more `[NUXT_B3011]` warning.

---

### Phase 5: Fix $fetch Response Wrapping

**Priority**: MEDIUM
**Files**: All Pinia stores (`stores/users.ts`, `stores/roles.ts`, `stores/permissions.ts`, `stores/guards.ts`, `stores/settings.ts`)

**Current (broken)**:
```typescript
const response = await $fetch<{ data: PaginatedResponse<User> }>('/api/users')
users.value = response.data.data  // ❌ Double .data
```

**Fix**: Match actual server response shape:

```typescript
// For list endpoints (users, roles, permissions, guards):
const response = await $fetch<PaginatedResponse<User>>('/api/users', { params })
users.value = response.data  // ✅ Server returns { data, total, page, limit, totalPages }

// For single-item endpoints:
const response = await $fetch<User>('/api/users/1')
// response IS the user (no wrapper)
```

**Affected stores**: `users.ts`, `roles.ts`, `permissions.ts`, `guards.ts`, `settings.ts`

**Verification**: CRUD pages load data correctly, no "Cannot read property 'data' of undefined" errors.

---

### Phase 6: Fix SSR-sensitive Code in Composables

**Priority**: MEDIUM
**Files**: `app/composables/useApi.ts`

**Fix**: Guard `window` usage:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.logout()
      navigateTo('/login')
    }
    if (error.response?.status === 403 && import.meta.client) {
      window.dispatchEvent(
        new CustomEvent('rbac-denied', {
          detail: { message: error.response?.data?.message || 'Access denied' },
        })
      )
    }
    return Promise.reject(error)
  },
)
```

**Verification**: No SSR crash from `window` reference.

---

### Phase 7: Clean Up Duplicate Type Exports

**Priority**: LOW
**File**: `app/shared/types/index.ts`

**Action**: Remove re-exports from `index.ts` that are already exported from individual files. Or simplify `index.ts` to be the single barrel export and have individual files only define types (not export).

**Chosen**: Keep individual files as source of truth, remove duplicates from `index.ts`:

```typescript
// shared/types/index.ts — only re-export types NOT in individual files
// Remove: User, Role, Permission, etc. (already in their own files)
// Keep: only cross-cutting types if any
```

**Verification**: No more "Duplicated imports" warnings.

---

### Phase 8: Verify & Test

**Steps**:

1. Kill existing `nuxt dev` process
2. Delete `.nuxt/` cache: `rm -rf .nuxt`
3. Run `npm run dev`
4. Test pages:
   - `curl -s http://localhost:3000/` → should redirect to `/login`
   - `curl -s http://localhost:3000/login` → should return HTML (not 500)
   - `curl -s http://localhost:3000/register` → should return HTML
   - `curl -s http://localhost:3000/api/settings` → should return JSON
5. Open browser:
   - Login page renders with image panel + form
   - Login with seeded user works
   - Dashboard loads after login
   - Sidebar menu renders correctly
   - All CRUD pages load without errors

---

## Execution Order

| Phase | Priority | Est. Files | Description |
|-------|----------|------------|-------------|
| 1 | CRITICAL | 1 | Fix localStorage SSR error |
| 2 | CRITICAL | 3 | Fix AuthLayout component resolution |
| 3 | HIGH | 1 | Fix Pinia store auto-imports |
| 4 | MEDIUM | 1 | Fix duplicate BaseButton |
| 5 | MEDIUM | 5 | Fix $fetch response wrapping |
| 6 | MEDIUM | 1 | Fix SSR-sensitive window usage |
| 7 | LOW | 1 | Clean up duplicate type exports |
| 8 | — | 0 | Verify all fixes work |

**Total files to modify**: ~12
**Estimated effort**: 1-2 hours

---

## Post-Fix: Remaining Issues (Non-blocking)

These are issues found during analysis that don't block `npm run dev` but should be addressed later:

1. **Security**: Settings GET endpoint has no auth check (`server/api/settings/index.get.ts`)
2. **Security**: Path traversal risk in storage endpoint (`server/api/storage/[...path].get.ts`)
3. **Data integrity**: `synchronize: true` in production database config
4. **Hardcoded JWT secret**: `default-secret-change-me` used as fallback
5. **Client-only RBAC**: No server-side role/permission enforcement (only client-side via `useAuthorization`)
6. **Duplicate URL matcher**: Two different implementations in `utils/url-matcher.ts` (client vs server)
