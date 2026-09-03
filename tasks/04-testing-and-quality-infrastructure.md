# 04 — Testing & Quality Infrastructure

## Overview

Project sudah memiliki seluruh halaman, stores, components, server API, dan middleware (hasil tasks 01-03). Yang belum ada:

1. **Testing infrastructure** — tidak ada `test/` directory, `vitest.config.ts`, `playwright.config.ts`
2. **anime.js client plugin** — package terinstall tapi belum ada plugin
3. **Composable testing** — fungsi bisnis belum terisolasi untuk testing
4. **E2E flow testing** — belum ada test untuk login → dashboard → CRUD flows

**Goal**: Setup infrastruktur testing lengkap (unit + E2E), pisahkan logic ke functions/composables yang testable, pastikan semua flow berjalan.

---

## Current State Analysis

### Sudah Ada
| Layer | Status | Files |
|-------|--------|-------|
| Pages (12) | ✅ | login, register, dashboard/* |
| Stores (6) | ✅ | auth, users, roles, permissions, guards, settings |
| Components | ✅ | features/users/*, common/*, base/*, features/logging/* |
| Layouts | ✅ | auth.vue, default.vue |
| Composables | ⚠️ | useApi, useAuthorization, useDataTable (butuh ekstraksi lebih) |
| Server API | ✅ | 35+ routes, services, entities, DTOs |
| Middleware | ✅ | auth.ts |
| anime.js | ⚠️ | Package installed, no client plugin |
| Tailwind | ✅ | Configured via @tailwindcss/vite |
| Testing | ❌ | Tidak ada test directory, config, atau tests |

### Belum Ada / Perlu Diperbaiki
1. `test/` directory structure (unit, nuxt, e2e)
2. `vitest.config.ts` & `playwright.config.ts`
3. `plugins/animejs.client.ts`
4. Composable `useUsersStore`, `useRolesStore`, dll — logic perlu diekstrak ke functions
5. Unit test untuk stores, composables, utils
6. E2E test untuk auth flow, CRUD flows
7. `app/utils/` — helper functions belum ada test

---

## Best Practices Applied

### From loaded skills:

| Skill | Application |
|-------|-------------|
| **nuxt-base-practices** | Auto-imports, `useFetch`/`$fetch`, `<NuxtLink>`, `definePageMeta`, SSR guards |
| **naiveui-practices** | Direct import, `h()` render, `FormInst`, `row-key`, `useMessage/useDialog`, theme centralized |
| **animejs-base-practices** | Client-only plugin, template refs, cleanup on unmount, `prefers-reduced-motion` |
| **tailwind-base-practices** | CSS-first `@theme`, no preflight (Naive UI), utility classes inline |
| **test-base-practices** | `vitest` + `@nuxt/test-utils`, `playwright`, `mountSuspended`, role-based locators |
| **vue-best-practices** | Composition API + `<script setup>`, composables for logic, focused components, typed props/emits |

---

## Implementation Plan

### Phase 1: Setup Testing Infrastructure

**Priority**: HIGH

#### 1.1 Install dependencies

```bash
npm install -D vitest @nuxt/test-utils @vue/test-utils happy-dom
npx playwright install --with-deps
```

> `@playwright/test` dan `@nuxt/test-utils` sudah ada di package.json. Cek apakah `vitest`, `@vue/test-utils`, `happy-dom` perlu ditambah.

#### 1.2 Create `vitest.config.ts`

**File**: `app/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
```

#### 1.3 Create `playwright.config.ts`

**File**: `app/playwright.config.ts`

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  use: {
    nuxt: {
      rootDir: fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

#### 1.4 Create test directory structure

```
app/test/
├── unit/
│   ├── utils/
│   │   ├── error.test.ts
│   │   ├── url-matcher.test.ts
│   │   └── icons.test.ts
│   └── composables/
│       └── useAuthorization.test.ts
├── nuxt/
│   ├── components/
│   │   ├── AuthForm.nuxt.spec.ts
│   │   ├── FormField.nuxt.spec.ts
│   │   └── DataTable.nuxt.spec.ts
│   └── composables/
│       └── useDataTable.nuxt.spec.ts
└── e2e/
    ├── auth.spec.ts
    ├── users-crud.spec.ts
    └── roles-crud.spec.ts
```

#### 1.5 Add npm scripts

**File**: `app/package.json` — tambah scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --project unit",
    "test:nuxt": "vitest --project nuxt",
    "test:e2e": "playwright test",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

### Phase 2: Ekstraksi Logic ke Functions (Testable)

**Priority**: HIGH

> **Prinsip**: Setiap fungsi bisnis harus terpisah dari UI, bisa di-import dan di-test secara independent.

#### 2.1 Ekstrak `useUsersStore` logic ke composable

**File baru**: `app/app/composables/useUsersData.ts`

```ts
// Fungsi murni untuk data transformation & validation
export function validateUserPayload(data: CreateUserPayload) { ... }
export function formatUserDisplayName(user: User) { ... }
export function filterUsersByRole(users: User[], roleName: string) { ... }
```

> Store tetap di `stores/users.ts`, tapi logic bisnis diekstrak ke functions yang bisa di-test tanpa store.

#### 2.2 Ekstrak `useRolesStore` logic

**File baru**: `app/app/composables/useRolesData.ts`

```ts
export function validateRolePayload(data: CreateRolePayload) { ... }
export function findRoleByName(roles: Role[], name: string) { ... }
```

#### 2.3 Ekstrak `usePermissionsStore` logic

**File baru**: `app/app/composables/usePermissionsData.ts`

```ts
export function validatePermissionPayload(data: CreatePermissionPayload) { ... }
export function groupPermissionsByGuard(permissions: Permission[]) { ... }
```

#### 2.4 Ekstrak `useGuardsStore` logic

**File baru**: `app/app/composables/useGuardsData.ts`

```ts
export function validateGuardPayload(data: CreateGuardPayload) { ... }
export function findGuardByPath(guards: Guard[], path: string) { ... }
```

---

### Phase 3: anime.js Client Plugin

**Priority**: MEDIUM

#### 3.1 Create plugin

**File baru**: `app/app/plugins/animejs.client.ts`

```ts
import * as anime from 'animejs'

export default defineNuxtPlugin(() => ({
  provide: { anime },
}))
```

#### 3.2 Create reusable animation composable

**File baru**: `app/app/composables/usePageTransition.ts`

```ts
export function usePageTransition() {
  const { $anime } = useNuxtApp()

  function fadeInUp(el: Element) {
    if (!import.meta.client) return
    $anime.animate(el, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      ease: 'outExpo',
    })
  }

  function staggerFadeIn(els: Element[]) {
    if (!import.meta.client) return
    $anime.animate(els, {
      opacity: [0, 1],
      translateY: [15, 0],
      delay: $anime.stagger(80),
      duration: 400,
      ease: 'outCubic',
    })
  }

  return { fadeInUp, staggerFadeIn }
}
```

---

### Phase 4: Unit Tests

**Priority**: HIGH

#### 4.1 Utility tests

**File**: `app/test/unit/utils/error.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '~/utils/error'

describe('getErrorMessage', () => {
  it('extracts message from Error object', () => {
    expect(getErrorMessage(new Error('test'), 'fallback')).toBe('test')
  })
  it('returns fallback for unknown error', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback')
  })
})
```

**File**: `app/test/unit/utils/url-matcher.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { matchUrl, extractPathParams } from '~/utils/url-matcher'

describe('matchUrl', () => {
  it('matches exact paths', () => {
    expect(matchUrl('/api/users', '/api/users')).toBe(true)
  })
  it('matches parameterized paths', () => {
    expect(matchUrl('/api/users/123', '/api/users/:id')).toBe(true)
  })
  it('does not match different paths', () => {
    expect(matchUrl('/api/users', '/api/roles')).toBe(false)
  })
})
```

#### 4.2 Composable tests

**File**: `app/test/unit/composables/useAuthorization.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { useAuthorization } from '~/composables/useAuthorization'

// Mock useAuthStore
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    user: { value: { roles: [{ roleName: 'Admin' }] } },
  }),
}))

describe('useAuthorization', () => {
  it('hasRole returns true for matching role', () => {
    const { hasRole } = useAuthorization()
    expect(hasRole('Admin')).toBe(true)
  })
  it('hasRole returns false for non-matching role', () => {
    const { hasRole } = useAuthorization()
    expect(hasRole('Super Admin')).toBe(false)
  })
})
```

#### 4.3 Extracted function tests

**File**: `app/test/unit/composables/useUsersData.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { formatUserDisplayName, filterUsersByRole } from '~/composables/useUsersData'

describe('formatUserDisplayName', () => {
  it('combines first and last name', () => {
    expect(formatUserDisplayName({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe')
  })
})

describe('filterUsersByRole', () => {
  it('filters users by role name', () => {
    const users = [
      { id: 1, roles: [{ roleName: 'Admin' }] },
      { id: 2, roles: [{ roleName: 'User' }] },
    ]
    expect(filterUsersByRole(users as any, 'Admin')).toHaveLength(1)
  })
})
```

---

### Phase 5: Component Tests (mountSuspended)

**Priority**: HIGH

**File**: `app/test/nuxt/components/FormField.nuxt.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FormField from '~/components/common/FormField/FormField.vue'

describe('FormField', () => {
  it('renders label', async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: 'Email', path: 'email' },
    })
    expect(wrapper.text()).toContain('Email')
  })
})
```

**File**: `app/test/nuxt/components/DataTable.nuxt.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DataTable from '~/components/common/DataTable/DataTable.vue'

describe('DataTable', () => {
  it('renders data rows', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: {
        columns: [{ key: 'name', title: 'Name' }],
        data: [{ name: 'John' }, { name: 'Jane' }],
        loading: false,
        page: 1,
        limit: 10,
        total: 2,
      },
    })
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Jane')
  })
})
```

---

### Phase 6: E2E Tests (Playwright)

**Priority**: HIGH

#### 6.1 Auth flow

**File**: `app/test/e2e/auth.spec.ts`

```ts
import { test, expect } from '@nuxt/test-utils/playwright'

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })
    await expect(page.getByRole('heading', { name: /selamat datang/i })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('shows validation error on empty submit', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page.getByText('Email wajib diisi')).toBeVisible()
  })

  test('login with valid credentials redirects to dashboard', async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })
    await page.getByLabel('Email').fill('admin@admin.com')
    await page.getByLabel('Password').fill('P455w0rd!!!')
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('unauthenticated access redirects to login', async ({ page, goto }) => {
    await goto('/dashboard', { waitUntil: 'hydration' })
    await expect(page).toHaveURL('/login')
  })
})
```

#### 6.2 Users CRUD flow

**File**: `app/test/e2e/users-crud.spec.ts`

```ts
import { test, expect } from '@nuxt/test-utils/playwright'

test.describe('Users CRUD', () => {
  test.beforeEach(async ({ page, goto }) => {
    await goto('/login', { waitUntil: 'hydration' })
    await page.getByLabel('Email').fill('admin@admin.com')
    await page.getByLabel('Password').fill('P455w0rd!!!')
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('users page loads with data table', async ({ page, goto }) => {
    await goto('/dashboard/users', { waitUntil: 'hydration' })
    await expect(page.getByRole('button', { name: /add user/i })).toBeVisible()
  })

  test('create user flow opens modal', async ({ page, goto }) => {
    await goto('/dashboard/users', { waitUntil: 'hydration' })
    await page.getByRole('button', { name: /add user/i }).click()
    await expect(page.getByText('Create User')).toBeVisible()
  })
})
```

---

### Phase 7: Animation Integration

**Priority**: LOW

#### 7.1 Apply page transitions

**File**: `app/app/pages/dashboard/index.vue` — tambah animasi:

```ts
const { fadeInUp, staggerFadeIn } = usePageTransition()
const cardsRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (cardsRef.value) {
    staggerFadeIn(cardsRef.value.children)
  }
})
```

#### 7.2 Apply auth form animation

**File**: `app/app/pages/login.vue` — gunakan composable alih-alih CSS keyframes:

```ts
const { fadeInUp } = usePageTransition()
const formContent = ref<HTMLElement | null>(null)

onMounted(() => {
  if (formContent.value) fadeInUp(formContent.value)
})
```

---

### Phase 8: Verification & Testing

**Priority**: CRITICAL

#### 8.1 Run all tests

```bash
# Unit tests
npx vitest --project unit

# Nuxt component tests
npx vitest --project nuxt

# E2E tests
npx playwright test

# All at once
npm run test
```

#### 8.2 Manual UI testing checklist

| Page | Action | Expected |
|------|--------|----------|
| `/login` | Buka halaman | Form muncul dengan image panel |
| `/login` | Submit kosong | Validasi error muncul |
| `/login` | Login valid | Redirect ke `/dashboard` |
| `/dashboard` | Buka halaman | User info + quick actions muncul |
| `/dashboard/users` | Buka halaman | DataTable dengan user list |
| `/dashboard/users` | Click "Add User" | Modal form muncul |
| `/dashboard/roles` | Buka halaman | DataTable dengan role list |
| `/dashboard/permissions` | Buka halaman | DataTable dengan permission list |
| `/dashboard/guards` | Buka halaman | DataTable dengan guard list |
| `/dashboard/activity-logs` | Buka halaman | Log table muncul |
| `/dashboard/system-logs` | Buka halaman | Log files list |
| `/dashboard/settings` | Buka halaman | Settings form muncul |
| `/dashboard/profile` | Buka halaman | Profile info + edit form |

#### 8.3 Flow testing

```
Login → Dashboard → Users → Create User → Edit User → Delete User → Logout
Login → Dashboard → Roles → Create Role → Edit Role → Delete Role → Logout
Login → Dashboard → Permissions → Create → Edit → Delete → Logout
Login → Dashboard → Guards → Create → Edit → Delete → Logout
```

---

## Execution Order

| Phase | Priority | Est. Files | Description |
|-------|----------|------------|-------------|
| 1 | HIGH | 4 | Setup testing infrastructure (vitest, playwright, directory) |
| 2 | HIGH | 4 | Ekstraksi logic ke testable functions |
| 3 | MEDIUM | 2 | anime.js client plugin + composable |
| 4 | HIGH | 4 | Unit tests (utils, composables, functions) |
| 5 | HIGH | 2 | Component tests (mountSuspended) |
| 6 | HIGH | 3 | E2E tests (auth, users, roles) |
| 7 | LOW | 2 | Apply animations to pages |
| 8 | CRITICAL | 0 | Verify semua tests passing + manual testing |

**Total new files**: ~21
**Total modified files**: ~5 (package.json, existing pages untuk animation)
**Estimated effort**: 3-4 hours

---

## File Naming Convention

- Unit test: `*.test.ts` (murni logic, node environment)
- Nuxt test: `*.nuxt.spec.ts` (component/composable dengan Nuxt context)
- E2E test: `*.spec.ts` (Playwright, browser environment)
- Composable: `use{Feature}.ts` (function-based, testable)
- Plugin: `{name}.client.ts` (client-only)

---

## Anti-Patterns to Avoid

| ❌ Avoid | ✅ Better |
|---------|-----------|
| Testing implementation details | Testing user behavior |
| CSS selectors in E2E | Role/label/text selectors |
| Manual `await page.isVisible()` | Web-first `expect(...).toBeVisible()` |
| Hardcoded waits | Condition-based waits |
| Logic embedded in components | Extracted to composable/functions |
| Global import naive-ui | Direct import per component |
| `import { ref } from 'vue'` di `<script setup>` | Auto-import (hapus explicit import) |

---

## Post-Implementation: Remaining Work (Non-blocking)

1. **Storybook stories** — existing stories perlu di-update sesuai component changes
2. **TypeScript strict mode** — pastikan tidak ada `any` type
3. **Accessibility audit** — Naive UI components sudah accessible, tapi perlu verify
4. **Performance** — virtual scroll untuk large datasets (1000+ rows)
5. **Dark mode** — belum ada toggle dark mode di UI
