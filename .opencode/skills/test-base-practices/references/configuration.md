# Configuration

## Vitest Configuration

### Multi-Project Setup
```ts
// vitest.config.ts
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
      {
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      },
    ],
  },
})
```

### Simple Nuxt-Only Setup
```ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: '.',
        domEnvironment: 'happy-dom', // or 'jsdom'
        mock: {
          intersectionObserver: true,
          indexedDb: false,
        },
        overrides: {
          // Nuxt config overrides
        },
      },
    },
  },
})
```

## Playwright Configuration

### With @nuxt/test-utils
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
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'html' : 'list',
})
```

### With Test-File Config Override
```ts
import { test, expect } from '@nuxt/test-utils/playwright'

test.use({
  nuxt: {
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
  },
})

test('test', async ({ page, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  await expect(page.getByRole('heading')).toHaveText('Welcome')
})
```

## Environment Variables

### .env.test
```
API_URL=http://localhost:3001
NODE_ENV=test
```

### Using in Tests
```ts
const apiUrl = process.env.API_URL
```

## Timeout Configuration

### Vitest
```ts
export default defineConfig({
  test: {
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
```

### Playwright
```ts
export default defineConfig({
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  retries: 2,
})
```
