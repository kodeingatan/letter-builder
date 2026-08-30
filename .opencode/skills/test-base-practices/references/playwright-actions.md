# Playwright Actions

## Navigation

```ts
await page.goto('https://example.com')
await page.goBack()
await page.goForward()
await page.reload()
```

## Interactions

### Click
```ts
await page.getByRole('button', { name: 'Submit' }).click()
await page.getByRole('button', { name: 'Submit' }).click({ force: true })
await page.getByRole('button', { name: 'Submit' }).dblclick()
await page.getByRole('button', { name: 'Submit' }).click({ button: 'right' })
```

### Fill (Input)
```ts
await page.getByLabel('Name').fill('John')
await page.getByLabel('Name').clear()
await page.getByLabel('Name').pressSequentially('John')
```

### Check/Uncheck
```ts
await page.getByRole('checkbox', { name: 'Accept' }).check()
await page.getByRole('checkbox', { name: 'Accept' }).uncheck()
```

### Select
```ts
await page.getByLabel('Country').selectOption('US')
await page.getByLabel('Country').selectOption({ label: 'United States' })
```

### Hover
```ts
await page.getByRole('button', { name: 'Menu' }).hover()
```

### Focus
```ts
await page.getByLabel('Name').focus()
```

### Keyboard
```ts
await page.getByLabel('Name').press('Enter')
await page.getByLabel('Name').press('Control+A')
await page.keyboard.type('Hello')
```

### File Upload
```ts
await page.getByLabel('Upload').setInputFiles('file.txt')
await page.getByLabel('Upload').setInputFiles(['file1.txt', 'file2.txt'])
await page.getByLabel('Upload').setInputFiles([]) // clear
```

### Drag and Drop
```ts
await page.getByRole('button', { name: 'Drag me' }).dragTo(
  page.getByRole('button', { name: 'Drop here' })
)
```

## Waiting

```ts
// Wait for URL
await page.waitForURL('**/dashboard')

// Wait for selector
await page.waitForSelector('.loaded')

// Wait for function
await page.waitForFunction(() => window.loaded === true)

// Wait for timeout (avoid when possible)
await page.waitForTimeout(1000)
```

## Dialogs

```ts
page.on('dialog', async dialog => {
  await dialog.accept()
  // or await dialog.dismiss()
})
```

## Screenshots

```ts
await page.screenshot({ path: 'screenshot.png' })
await page.screenshot({ fullPage: true })
await page.locator('.element').screenshot({ path: 'element.png' })
```

## Evaluation

```ts
const result = await page.evaluate(() => {
  return document.title
})

const result = await page.evaluate(() => {
  return window.innerWidth
})
```
