# Playwright Locators

## Philosophy

Locators are the primary way to find elements. They auto-wait and retry before actions.

## Locator Strategies (Priority Order)

### 1. Role (Preferred)
```ts
page.getByRole('button', { name: 'submit' })
page.getByRole('link', { name: 'Get started' })
page.getByRole('heading', { name: 'Welcome' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('listitem')
```

### 2. Text
```ts
page.getByText('Welcome')
page.getByText('Submit', { exact: true })
page.getByText(/welcome/i) // regex
```

### 3. Label
```ts
page.getByLabel('Username')
page.getByLabel('Password')
```

### 4. Placeholder
```ts
page.getByPlaceholder('Search...')
```

### 5. Alt Text (Images)
```ts
page.getByAltText('Logo')
```

### 6. Title
```ts
page.getByTitle('Close')
```

### 7. Test ID (Last Resort)
```ts
page.getByTestId('submit-button')
```

## Chaining & Filtering

### Chain
```ts
const product = page.getByRole('listitem').filter({ hasText: 'Product 2' })
```

### Filter
```ts
await page
  .getByRole('listitem')
  .filter({ hasText: 'Product 2' })
  .getByRole('button', { name: 'Add to cart' })
  .click()
```

### Nth
```ts
page.getByRole('listitem').nth(2)
page.getByRole('listitem').first()
page.getByRole('listitem').last()
```

## Locator Types

### CSS Selectors (Avoid)
```ts
// ❌ Bad - fragile
page.locator('button.buttonIcon.episode-actions-later')

// ✅ Good
page.getByRole('button', { name: 'submit' })
```

### XPath (Avoid)
```ts
// ❌ Bad
page.locator('//button[@class="submit"]')

// ✅ Good
page.getByRole('button', { name: 'submit' })
```

## Auto-Generated Locators

Use codegen to find best locators:
```bash
npx playwright codegen playwright.dev
```

## Element State Assertions

```ts
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()
await expect(locator).toBeEnabled()
await expect(locator).toBeDisabled()
await expect(locator).toBeChecked()
await expect(locator).toHaveValue('text')
await expect(locator).toHaveText('text')
await expect(locator).toContainText('text')
await expect(locator).toHaveAttribute('href', '/home')
await expect(locator).toHaveCount(3)
```
