---
name: test-base-practices
description: >
  Best practices untuk testing Vue 3 + Nuxt menggunakan Playwright (E2E) dan Vitest + @nuxt/test-utils (unit/component testing). Mencakup installation, configuration, locators, assertions, fixtures, page object models, CI/CD, dan debugging.
---

# Testing Best Practices (Playwright + Nuxt)

Panduan testing untuk project Vue 3 + Nuxt menggunakan Playwright (E2E) dan Vitest + @nuxt/test-utils (unit/component).

## Kapan Skill Ini Digunakan

- Menulis test E2E dengan Playwright
- Menulis unit test dengan Vitest + @nuxt/test-utils
- Menulis component test dengan mountSuspended/renderSuspended
- Mocking Nuxt imports, components, endpoints
- Setup CI/CD untuk testing
- Debugging test yang gagal

## Kapan TIDAK Digunakan

- Testing non-Nuxt projects (gunakan Playwright biasa)
- Visual regression testing (butuh setup khusus)
- Load testing / performance testing

## Dependencies

```bash
# E2E (Playwright + Nuxt)
npm install -D @playwright/test @nuxt/test-utils

# Unit/Component (Vitest + @nuxt/test-utils)
npm install -D @nuxt/test-utils vitest @vue/test-utils happy-dom playwright-core

# Browser
npx playwright install --with-deps
```

## Struktur Test

```
test/
├── unit/              # Pure logic, Node environment
│   └── utils.test.ts
├── nuxt/              # Components/composables with Nuxt context
│   ├── components.nuxt.spec.ts
│   └── composables.nuxt.spec.ts
└── e2e/               # End-to-end tests
    └── ssr.test.ts
```

## Configuration

### vitest.config.ts (Multi-Project)
```ts
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
```

### playwright.config.ts
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
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
```

## Core Patterns

### Unit Testing (Vitest)
```ts
import { describe, it, expect } from 'vitest'
import { formatDate } from '~/utils/format'

describe('formatDate', () => {
  it('formats date correctly', () => {
    expect(formatDate(new Date('2024-01-15'))).toBe('15 Januari 2024')
  })
})
```

### Component Testing (mountSuspended)
```ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { MyComponent } from '#components'

it('renders correctly', async () => {
  const component = await mountSuspended(MyComponent, {
    props: { title: 'Hello' },
  })
  expect(component.text()).toContain('Hello')
})
```

### E2E Testing (Playwright + @nuxt/test-utils)
```ts
import { test, expect } from '@nuxt/test-utils/playwright'

test('homepage', async ({ page, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  await expect(page.getByRole('heading')).toHaveText('Welcome')
})
```

### Mocking Nuxt Imports
```ts
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useState', () => {
  return () => ({ value: 'mocked' })
})
```

### Mocking Endpoints
```ts
import { registerEndpoint } from '@nuxt/test-utils/runtime'

registerEndpoint('/api/users', () => ({
  users: [{ id: 1, name: 'John' }],
}))
```

## Locator Best Practices (Playwright)

### Priority Order
```ts
// 1. Role (preferred)
page.getByRole('button', { name: 'Submit' })

// 2. Label
page.getByLabel('Email')

// 3. Text
page.getByText('Welcome')

// 4. Test ID (last resort)
page.getByTestId('submit-btn')
```

### Chaining & Filtering
```ts
await page
  .getByRole('listitem')
  .filter({ hasText: 'Product' })
  .getByRole('button', { name: 'Add to cart' })
  .click()
```

## Assertion Best Practices

```ts
// ✅ Web-first (auto-waits)
await expect(page.getByText('welcome')).toBeVisible()
await expect(page).toHaveURL('/dashboard')

// ❌ Manual (no wait)
expect(await page.getByText('welcome').isVisible()).toBe(true)
```

## Checklist Sebelum Implementasi

- [ ] Dependencies terinstall (`@playwright/test`, `@nuxt/test-utils`, `vitest`)
- [ ] Browser terinstall (`npx playwright install --with-deps`)
- [ ] Config files ada (`vitest.config.ts`, `playwright.config.ts`)
- [ ] Test directory structure sudah benar
- [ ] `@nuxt/test-utils/module` di nuxt.config (opsional, untuk DevTools)

## Checklist Sesudah Implementasi

- [ ] Test bisa jalan (`npx vitest`, `npx playwright test`)
- [ ] Tidak ada test yang skip tanpa alasan
- [ ] Mocking tidak mengganggu test lain
- [ ] Test terisolasi (tidak depend on test lain)
- [ ] CI/CD pipeline sudah include test

## Anti-Patterns

| Anti-Pattern | Lebih Baik |
|-------------|-----------|
| Testing implementation details | Testing user behavior |
| CSS/XPath selectors | Role/label/text selectors |
| Manual assertions | Web-first assertions |
| Hardcoded waits | Condition-based waits |
| Dependent tests | Independent tests |
| Testing third-party | Mocking third-party |
| Not cleaning up | Cleanup in afterEach |
| Mixing runtime/E2E | Separate files |

## Perintah Berguna

```bash
# Vitest
npx vitest                    # Run all tests
npx vitest --project unit     # Unit tests only
npx vitest --project nuxt     # Nuxt tests only
npx vitest --watch            # Watch mode

# Playwright
npx playwright test           # Run all E2E tests
npx playwright test --debug   # Debug mode
npx playwright test --ui      # UI mode
npx playwright codegen URL    # Generate locators
npx playwright show-report    # View HTML report
npx playwright show-trace trace.zip  # View trace
```

## References

```bash
ls .opencode/skills/test-base-practices/references/
```

Key references:
- `official-documentation.md` — Links to official docs
- `installation.md` — Dependencies & config setup
- `configuration.md` — Vitest & Playwright configuration
- `unit-testing.md` — Unit testing with @nuxt/test-utils
- `component-testing.md` — mountSuspended, renderSuspended, mocking
- `e2e-testing.md` — E2E testing setup & APIs
- `playwright-locators.md` — Locator strategies
- `playwright-assertions.md` — Assertion patterns
- `playwright-actions.md` — Playwright actions
- `playwright-fixtures.md` — Custom fixtures
- `test-isolation.md` — Test isolation patterns
- `best-practices.md` — Best practices
- `anti-patterns.md` — Anti-patterns to avoid
- `page-object-models.md` — Page Object Model pattern
- `ci-cd.md` — CI/CD setup
- `common-patterns.md` — Common test patterns
- `debugging.md` — Debugging techniques
