# Anti-Patterns

## 1. ❌ Testing Implementation Details

```ts
// ❌ Bad: Tests CSS class
expect(button).toHaveClass('btn-primary')

// ✅ Good: Tests user-visible state
await expect(button).toBeVisible()
await expect(button).toBeEnabled()
```

## 2. ❌ Using CSS/XPath Selectors

```ts
// ❌ Bad: Fragile
page.locator('button.btn.primary')
page.locator('//button[@type="submit"]')

// ✅ Good: Resilient
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
```

## 3. ❌ Manual Assertions

```ts
// ❌ Bad: No auto-wait
expect(await page.getByText('welcome').isVisible()).toBe(true)

// ✅ Good: Auto-waits
await expect(page.getByText('welcome')).toBeVisible()
```

## 4. ❌ Hardcoded Waits

```ts
// ❌ Bad
await page.waitForTimeout(5000)

// ✅ Good: Wait for condition
await expect(page.getByText('loaded')).toBeVisible()
await page.waitForURL('**/dashboard')
```

## 5. ❌ Tests Depend on Each Other

```ts
// ❌ Bad
test('creates item', async ({ page }) => { /* ... */ })
test('edits item', async ({ page }) => {
  // Depends on previous test creating the item
})

// ✅ Good: Each test is independent
test('edits item', async ({ page }) => {
  // Create and edit in same test
})
```

## 6. ❌ Testing Third-Party Services

```ts
// ❌ Bad: Tests external API
const res = await fetch('https://api.stripe.com/...')

// ✅ Good: Mock the response
await page.route('**/api/stripe', route => route.fulfill({
  status: 200,
  body: JSON.stringify({ success: true }),
}))
```

## 7. ❌ Ignoring Test Isolation

```ts
// ❌ Bad: Mutates global state
test('test 1', async ({ page }) => {
  localStorage.setItem('key', 'value')
})

// ✅ Good: Clean state
test('test 1', async ({ page }) => {
  await page.goto('/page')
  // State is fresh
})
```

## 8. ❌ Not Using Web-First Assertions

```ts
// ❌ Bad: Checking immediately
const text = await page.getByText('welcome').textContent()
expect(text).toBe('Welcome')

// ✅ Good: Auto-retry
await expect(page.getByText('welcome')).toHaveText('Welcome')
```

## 9. ❌ Excessive `@apply` in Tests

```ts
// ❌ Bad: Testing CSS
await expect(button).toHaveCSS('background-color', 'rgb(59, 130, 246)')

// ✅ Good: Testing state
await expect(button).toBeVisible()
```

## 10. ❌ Flaky Selectors

```ts
// ❌ Bad: Position-based
page.locator('div:nth-child(3)')

// ✅ Good: Content-based
page.getByRole('listitem').filter({ hasText: 'Item 3' })
```

## 11. ❌ Not Cleaning Up

```ts
// ❌ Bad: Leaves test data
test('creates user', async ({ page }) => {
  await page.goto('/users/new')
  await page.getByLabel('Name').fill('Test')
  await page.getByRole('button', { name: 'Save' }).click()
})

// ✅ Good: Cleanup in afterEach
test.afterEach(async ({ page }) => {
  await page.goto('/users')
  await page.getByText('Test').click()
  await page.getByRole('button', { name: 'Delete' }).click()
})
```

## 12. ❌ Mixing Runtime and E2E in Same File

```ts
// ❌ Bad
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

// These cannot be in the same file!
```

## Summary

| Anti-Pattern | Better |
|-------------|--------|
| Testing implementation | Testing user behavior |
| CSS/XPath selectors | Role/label/text selectors |
| Manual assertions | Web-first assertions |
| Hardcoded waits | Condition-based waits |
| Dependent tests | Independent tests |
| Testing third-party | Mocking third-party |
| Ignoring isolation | Clean state per test |
| Flaky selectors | Content-based selectors |
| Not cleaning up | Cleanup in afterEach |
| Mixing runtime/E2E | Separate files |
