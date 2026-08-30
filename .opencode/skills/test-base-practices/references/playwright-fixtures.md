# Playwright Fixtures

## Built-in Fixtures

```ts
import { test, expect } from '@playwright/test'

test('example', async ({ page, browser, context, request }) => {
  // page - isolated page per test
  // browser - browser instance
  // context - isolated browser context
  // request - API request context
})
```

## Custom Fixtures

### Extend Test
```ts
import { test as base, expect } from '@playwright/test'

const test = base.extend<{ myFixture: string }>({
  myFixture: async ({}, use) => {
    const fixture = 'my value'
    await use(fixture)
    // cleanup after test
  },
})

test('uses fixture', async ({ myFixture }) => {
  expect(myFixture).toBe('my value')
})
```

### Page with Setup
```ts
const test = base.extend({
  page: async ({ page }, use) => {
    // Setup
    await page.goto('/login')
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await use(page)

    // Teardown (optional)
  },
})
```

### Auth Fixture
```ts
import { test as base, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
}

const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await login(page)
    await use(page)
  },
})
```

## Nuxt Test Fixtures

### @nuxt/test-utils/playwright
```ts
import { expect, test } from '@nuxt/test-utils/playwright'

test('nuxt test', async ({ page, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  await expect(page).toHaveTitle('My App')
})
```

### Custom Nuxt Fixture
```ts
import { test as base } from '@nuxt/test-utils/playwright'

const test = base.extend({
  // Custom fixture extending Nuxt fixtures
})

test.use({
  nuxt: {
    rootDir: '.',
  },
})
```

## Worker-Scoped Fixtures

```ts
const test = base.extend<{}, { workerFixture: string }>({
  workerFixture: [async ({}, use) => {
    const value = 'shared across tests in same worker'
    await use(value)
  }, { scope: 'worker' }],
})
```

## Test Options

```ts
test.use({
  actionTimeout: 10000,
  navigationTimeout: 30000,
  viewport: { width: 1280, height: 720 },
  baseURL: 'http://localhost:3000',
  extraHTTPHeaders: {
    'Authorization': 'Bearer token',
  },
})
```
