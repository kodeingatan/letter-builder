# 03 — Fix Auth Response Shape Mismatch (Login Error)

## Overview

Login gagal dengan error: **`Cannot read properties of undefined (reading 'accessToken')`**.

API server mengembalikan response yang benar:
```json
{ "accessToken": "eyJ...", "user": { ... } }
```

Tapi store client mengakses `response.data.accessToken` — padahal response tidak memiliki wrapper `{ data: ... }`.

**Root cause**: Type parameter `$fetch<{ data: AuthResponse }>` tidak cocok dengan bentuk response server yang flat.

---

## Root Cause Analysis

### File: `app/app/stores/auth.ts`

| Method | Store Type | Server Returns | Mismatch? |
|--------|-----------|----------------|-----------|
| `login()` | `$fetch<{ data: AuthResponse }>` | `{ accessToken, user }` flat | **YA** |
| `register()` | `$fetch<{ data: AuthResponse }>` | `{ accessToken, user }` flat | **YA** |
| `fetchProfile()` | `$fetch<{ data: User }>` | `User` object flat | **YA** |
| `updateProfile()` | `$fetch<{ data: User }>` | `User` object flat | **YA** |
| `changePassword()` | `$fetch` (untyped) | `{ message }` | OK |

**Mekanisme crash**:
1. `$fetch` mengembalikan `{ accessToken, user }` (flat)
2. Store mengakses `response.data.accessToken`
3. `response.data` = `undefined` (karena tidak ada wrapper `data`)
4. `undefined.accessToken` → **CRASH**

### Stores lainnya — TIDAK ada masalah

| Store | Status | Keterangan |
|-------|--------|------------|
| `users.ts` | OK | Server return `{ data, total, page, limit, totalPages }` → cocok dengan `PaginatedResponse<T>` |
| `roles.ts` | OK | Sama seperti users |
| `permissions.ts` | OK | Sama seperti users |
| `guards.ts` | OK | Sama seperti users |
| `settings.ts` | OK | Return `Setting[]` array, typed correctly |

### Server API Routes — Tidak perlu diubah

Semua API route mengembalikan hasil service langsung tanpa wrapper `{ data: ... }`:
- `auth/login.post.ts` → `return await AuthService.login(data)` → `{ accessToken, user }`
- `auth/register.post.ts` → `return await AuthService.register(data)` → `{ accessToken, user }`
- `auth/profile.get.ts` → `return await AuthService.getProfile(userId)` → `User` object
- `auth/profile.patch.ts` → `return await AuthService.updateProfile(userId, data)` → `User` object

---

## Implementation Plan

### Phase 1: Fix `login()` method

**File**: `app/app/stores/auth.ts`

**Current (broken)**:
```typescript
const response = await $fetch<{ data: AuthResponse }>('/api/auth/login', {
  method: 'POST',
  body: payload,
})
token.value = response.data.accessToken
user.value = response.data.user
if (import.meta.client) {
  localStorage.setItem('accessToken', response.data.accessToken)
}
saveUserToStorage(response.data.user)
return response.data
```

**Fix**:
```typescript
const response = await $fetch<AuthResponse>('/api/auth/login', {
  method: 'POST',
  body: payload,
})
token.value = response.accessToken
user.value = response.user
if (import.meta.client) {
  localStorage.setItem('accessToken', response.accessToken)
}
saveUserToStorage(response.user)
return response
```

---

### Phase 2: Fix `register()` method

**File**: `app/app/stores/auth.ts`

**Current (broken)**:
```typescript
const response = await $fetch<{ data: AuthResponse }>('/api/auth/register', {
  method: 'POST',
  body: payload,
})
token.value = response.data.accessToken
user.value = response.data.user
if (import.meta.client) {
  localStorage.setItem('accessToken', response.data.accessToken)
}
saveUserToStorage(response.data.user)
return response.data
```

**Fix**:
```typescript
const response = await $fetch<AuthResponse>('/api/auth/register', {
  method: 'POST',
  body: payload,
})
token.value = response.accessToken
user.value = response.user
if (import.meta.client) {
  localStorage.setItem('accessToken', response.accessToken)
}
saveUserToStorage(response.user)
return response
```

---

### Phase 3: Fix `fetchProfile()` method

**File**: `app/app/stores/auth.ts`

**Current (broken)**:
```typescript
const response = await $fetch<{ data: User }>('/api/auth/profile', {
  headers: { Authorization: `Bearer ${token.value}` },
})
user.value = response.data
saveUserToStorage(response.data)
return response.data
```

**Fix**:
```typescript
const response = await $fetch<User>('/api/auth/profile', {
  headers: { Authorization: `Bearer ${token.value}` },
})
user.value = response
saveUserToStorage(response)
return response
```

---

### Phase 4: Fix `updateProfile()` method

**File**: `app/app/stores/auth.ts`

**Current (broken)**:
```typescript
const response = await $fetch<{ data: User }>('/api/auth/profile', {
  method: 'PATCH',
  body: payload,
  headers: { Authorization: `Bearer ${token.value}` },
})
user.value = response.data
saveUserToStorage(response.data)
return response.data
```

**Fix**:
```typescript
const response = await $fetch<User>('/api/auth/profile', {
  method: 'PATCH',
  body: payload,
  headers: { Authorization: `Bearer ${token.value}` },
})
user.value = response
saveUserToStorage(response)
return response
```

---

### Phase 5: Hapus import type yang tidak diperlukan

**File**: `app/app/stores/auth.ts`

`AuthResponse` masih diperlukan untuk typing `$fetch` return. Import tetap dipertahankan.

---

### Phase 6: Verifikasi semua stores

**Checklist**:
- [ ] `stores/auth.ts` — login, register, fetchProfile, updateProfile sudah diperbaiki
- [ ] `stores/users.ts` — tidak ada perubahan (sudah benar)
- [ ] `stores/roles.ts` — tidak ada perubahan (sudah benar)
- [ ] `stores/permissions.ts` — tidak ada perubahan (sudah benar)
- [ ] `stores/guards.ts` — tidak ada perubahan (sudah benar)
- [ ] `stores/settings.ts` — tidak ada perubahan (sudah benar)

---

### Phase 7: Test login flow

**Steps**:
1. Restart dev server: `npm run dev`
2. Buka `http://localhost:3000/login`
3. Login dengan `admin@admin.com` / `P455w0rd!!!`
4. Verifikasi: redirect ke `/dashboard` tanpa error
5. Verifikasi: user data muncul di sidebar/header
6. Test register flow juga
7. Test profile update

---

## Execution Order

| Phase | Priority | Files | Description |
|-------|----------|-------|-------------|
| 1 | CRITICAL | `stores/auth.ts` | Fix `login()` — hapus `.data` wrapper |
| 2 | CRITICAL | `stores/auth.ts` | Fix `register()` — hapus `.data` wrapper |
| 3 | CRITICAL | `stores/auth.ts` | Fix `fetchProfile()` — hapus `.data` wrapper |
| 4 | CRITICAL | `stores/auth.ts` | Fix `updateProfile()` — hapus `.data` wrapper |
| 5 | LOW | `stores/auth.ts` | Bersihkan import jika perlu |
| 6 | — | `stores/*.ts` | Verifikasi semua stores lain tidak ada masalah |
| 7 | — | — | Test login, register, profile update |

**Total files to modify**: 1 (`app/app/stores/auth.ts`)
**Estimated effort**: 15 menit

---

## Catatan

- Perubahan HANYA di `stores/auth.ts` — tidak ada perubahan di server
- Type `AuthResponse` di `shared/types/auth.ts` sudah benar (定义 `{ accessToken, user }`)
- Semua stores lainnya sudah benar — tidak perlu diubah
- Response server sudah konsisten — tidak perlu diubah
