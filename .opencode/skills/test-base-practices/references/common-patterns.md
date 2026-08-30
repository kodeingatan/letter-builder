# Common Patterns

## Login Helper

```ts
export async function login(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard')
}
```

## Form Submission

```ts
test('submit form', async ({ page }) => {
  await page.goto('/form')
  
  await page.getByLabel('Name').fill('John')
  await page.getByLabel('Email').fill('john@example.com')
  await page.getByLabel('Country').selectOption('US')
  await page.getByRole('checkbox', { name: 'Accept terms' }).check()
  
  await page.getByRole('button', { name: 'Submit' }).click()
  
  await expect(page.getByText('Form submitted successfully')).toBeVisible()
})
```

## Table Verification

```ts
test('verify table data', async ({ page }) => {
  await page.goto('/users')
  
  const rows = page.getByRole('row')
  await expect(rows).toHaveCount(5) // header + 4 data rows
  
  await expect(rows.nth(1).getByText('John')).toBeVisible()
  await expect(rows.nth(1).getByText('john@example.com')).toBeVisible()
})
```

## API Mocking

```ts
test('mock API response', async ({ page }) => {
  await page.route('**/api/users', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]),
  }))
  
  await page.goto('/users')
  await expect(page.getByText('John')).toBeVisible()
  await expect(page.getByText('Jane')).toBeVisible()
})
```

## File Upload

```ts
test('upload file', async ({ page }) => {
  await page.goto('/upload')
  
  await page.getByLabel('Upload file').setInputFiles({
    name: 'test.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('file content'),
  })
  
  await expect(page.getByText('File uploaded')).toBeVisible()
})
```

## Responsive Testing

```ts
test('mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
  await expect(page.getByRole('navigation')).toBeHidden()
})
```

## Drag and Drop

```ts
test('drag and drop', async ({ page }) => {
  await page.goto('/drag-drop')
  
  await page.getByRole('button', { name: 'Item 1' }).dragTo(
    page.getByRole('region', { name: 'Drop Zone' })
  )
  
  await expect(page.getByRole('region', { name: 'Drop Zone' }).getByText('Item 1')).toBeVisible()
})
```

## Authentication with Storage State

```ts
// Save auth state
test('save auth', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  
  await page.context().storageState({ path: 'auth.json' })
})

// Use auth state
test.use({ storageState: 'auth.json' })
test('already logged in', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Welcome')).toBeVisible()
})
```

## Multiple Browser Testing

```ts
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
})
```
