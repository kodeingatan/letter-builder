# Debugging

## Local Debugging

### Playwright Inspector
```bash
# Debug all tests
npx playwright test --debug

# Debug specific test
npx playwright test example.spec.ts:9 --debug
```

### UI Mode
```bash
npx playwright test --ui
```
- Watch mode
- Live step view
- Time travel debugging
- Trace integration

### VS Code Extension
- Install Playwright extension
- Right-click test → Run/Debug
- Click locators to highlight in browser

## Traces

### Generate Traces
```bash
# Always (heavy)
npx playwright test --trace on

# On first retry (recommended for CI)
# playwright.config.ts
export default defineConfig({
  retries: 2,
  use: {
    trace: 'on-first-retry',
  },
})
```

### View Traces
```bash
npx playwright show-trace trace.zip
```

### Trace Features
- Timeline view
- DOM snapshots for each action
- Network requests
- Console logs
- Step-by-step execution

## HTML Report

```bash
# Generate and open
npx playwright test
npx playwright show-report
```

### Features
- Filter by browser
- Filter by status (passed/failed/skipped/flaky)
- View errors and attachments
- See step-by-step execution

## Console Logging

```ts
test('debug test', async ({ page }) => {
  page.on('console', msg => console.log(msg.text()))
  page.on('pageerror', err => console.error(err))
  
  await page.goto('/')
  // Console output will appear in terminal
})
```

## Screenshots on Failure

```ts
// playwright.config.ts
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
  },
})
```

## Videos

```ts
// playwright.config.ts
export default defineConfig({
  use: {
    video: 'on-first-retry',
  },
})
```

## Debug Tips

1. Use `--headed` to see browser
2. Use `--debug` for inspector
3. Use `--ui` for interactive mode
4. Use traces for CI failures
5. Add `page.pause()` for breakpoint
6. Check console for errors
7. Use `npx playwright codegen` for locators
