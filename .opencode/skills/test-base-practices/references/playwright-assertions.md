# Playwright Assertions

## Web-First Assertions

Playwright assertions auto-wait and retry until condition is met.

```ts
// ✅ Good - auto-waits
await expect(page.getByText('welcome')).toBeVisible()

// ❌ Bad - manual check, no wait
expect(await page.getByText('welcome').isVisible()).toBe(true)
```

## Locator Assertions

| Assertion | Description |
|-----------|-------------|
| `toBeChecked()` | Checkbox is checked |
| `toBeEnabled()` | Control is enabled |
| `toBeVisible()` | Element is visible |
| `toBeHidden()` | Element is hidden |
| `toContainText()` | Element contains text |
| `toHaveAttribute()` | Element has attribute |
| `toHaveCount()` | List has given length |
| `toHaveText()` | Element matches text |
| `toHaveValue()` | Input has value |
| `toHaveClass()` | Element has class |
| `toHaveCSS()` | Element has CSS property |
| `toHaveId()` | Element has ID |
| `toHaveJSProperty()` | Element has JS property |
| `toHaveScreenshot()` | Visual comparison |
| `toHaveTitle()` | Page has title |
| `toHaveURL()` | Page has URL |

## Page Assertions

```ts
await expect(page).toHaveTitle(/Playwright/)
await expect(page).toHaveURL('https://playwright.dev/')
await expect(page).toHaveURL(/playwright/)
```

## Generic Assertions

```ts
expect(success).toBeTruthy()
expect(count).toBe(3)
expect(items).toContain('apple')
expect(data).toEqual({ name: 'test' })
```

## Soft Assertions

Continue test even on failure:
```ts
await expect.soft(page.getByTestId('status')).toHaveText('Success')
await page.getByRole('link', { name: 'next page' }).click()
```

## Visual Comparisons

```ts
await expect(page).toHaveScreenshot('homepage.png')
await expect(locator).toHaveScreenshot()
```

## Common Patterns

### Form Submission
```ts
await page.getByRole('button', { name: 'Submit' }).click()
await expect(page.getByText('Success')).toBeVisible()
```

### Navigation
```ts
await page.getByRole('link', { name: 'About' }).click()
await expect(page).toHaveURL('/about')
```

### List Validation
```ts
await expect(page.getByRole('listitem')).toHaveCount(5)
```

### Input Value
```ts
await page.getByLabel('Name').fill('John')
await expect(page.getByLabel('Name')).toHaveValue('John')
```
