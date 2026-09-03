# Test Isolation

## Browser Context Isolation

Each test gets its own BrowserContext (equivalent to a new browser profile):
- Isolated cookies
- Isolated localStorage
- Isolated sessionStorage
- Isolated data

```ts
test('first test', async ({ page }) => {
  // page has its own context
})

test('second test', async ({ page }) => {
  // page is completely isolated from first test
})
```

## Test Hooks

### beforeEach / afterEach
```ts
test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com')
  })

  test('test 1', async ({ page }) => {
    // Already on homepage
  })

  test('test 2', async ({ page }) => {
    // Also on homepage
  })
})
```

### beforeAll / afterAll
```ts
test.describe('suite', () => {
  test.beforeAll(async () => {
    // Runs once before all tests in this describe
  })

  test.afterAll(async () => {
    // Runs once after all tests in this describe
  })
})
```

## Global Setup

```ts
// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
})

// global-setup.ts
export default async function globalSetup() {
  // Runs once before all tests
}
```

## State Isolation Patterns

### Fresh State Per Test
```ts
test('creates item', async ({ page }) => {
  await page.goto('/items/new')
  await page.getByLabel('Name').fill('Test Item')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Item created')).toBeVisible()
})
```

### Shared Auth State
```ts
// Use setup project for shared auth
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
})
```

## Nuxt Runtime Environment

- Global Nuxt app initialized before tests
- Plugins and `app.vue` code runs
- Do NOT mutate global state
- If you must, reset after test

```ts
// ✅ Good
test('test', async () => {
  // Use isolated state
})

// ❌ Bad
test('test', async () => {
  // Mutates global state that affects other tests
})
```
