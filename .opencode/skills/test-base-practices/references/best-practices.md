# Best Practices

## Testing Philosophy

### Test User-Visible Behavior
- Test what users see and interact with
- Avoid testing implementation details (function names, CSS classes, arrays)
- Focus on rendered output

### Isolation
- Each test should be independent
- No test should depend on another
- Use `beforeEach` for common setup
- Use `beforeAll` for expensive setup (build, deploy)

### Avoid Testing Third-Party Dependencies
- Don't test external sites or APIs you don't control
- Mock third-party responses with `page.route()`

```ts
await page.route('**/api/external', route => route.fulfill({
  status: 200,
  body: JSON.stringify({ data: 'mocked' }),
}))
```

## Locator Best Practices

### Prefer User-Facing Attributes
```ts
// ✅ Good
page.getByRole('button', { name: 'submit' })
page.getByLabel('Email')
page.getByText('Welcome')

// ❌ Bad
page.locator('button.submit-btn')
page.locator('//button[@type="submit"]')
```

### Use Chaining and Filtering
```ts
// ✅ Good
await page
  .getByRole('listitem')
  .filter({ hasText: 'Product 2' })
  .getByRole('button', { name: 'Add to cart' })
  .click()
```

### Use Codegen for Locators
```bash
npx playwright codegen playwright.dev
```

## Assertion Best Practices

### Use Web-First Assertions
```ts
// ✅ Good - auto-waits
await expect(page.getByText('welcome')).toBeVisible()

// ❌ Bad - no wait
expect(await page.getByText('welcome').isVisible()).toBe(true)
```

### Use Soft Assertions for Multiple Checks
```ts
await expect.soft(page.getByTestId('name')).toHaveText('John')
await expect.soft(page.getByTestId('email')).toHaveText('john@example.com')
await expect.soft(page.getByTestId('status')).toHaveText('Active')
```

## Test Organization

### Directory Structure
```
test/
├── unit/           # Pure logic, Node environment
├── nuxt/           # Nuxt runtime tests
└── e2e/            # End-to-end tests
```

### File Naming
- `*.test.ts` or `*.spec.ts`
- Nuxt-specific: `*.nuxt.spec.ts`
- E2E: `*.e2e.spec.ts`

### Group Related Tests
```ts
test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows form fields', async ({ page }) => { /* ... */ })
  test('validates empty form', async ({ page }) => { /* ... */ })
  test('logs in successfully', async ({ page }) => { /* ... */ })
})
```

## Debugging

### Local Debugging
```bash
# Playwright inspector
npx playwright test --debug

# Specific test
npx playwright test example.spec.ts:9 --debug

# UI Mode
npx playwright test --ui
```

### CI Debugging
- Use trace viewer instead of videos/screenshots
- Traces configured on first retry of failed test

```bash
# Generate traces
npx playwright test --trace on

# View traces
npx playwright show-report
```

## Performance

### Parallel Execution
```ts
test.describe.configure({ mode: 'parallel' })
```

### Sharding on CI
```bash
npx playwright test --shard=1/3
```

### Optimize Browser Downloads
```bash
# CI - install only needed browser
npx playwright install chromium --with-deps
```

## Linting

### TypeScript
- Use `@typescript-eslint/no-floating-promises` rule
- Run `tsc --noEmit` on CI

### No Manual Waits
```ts
// ❌ Bad
await page.waitForTimeout(1000)

// ✅ Good - wait for specific condition
await expect(page.getByText('loaded')).toBeVisible()
```
