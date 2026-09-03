# Installation

## Dependencies

### Playwright + Nuxt (E2E)
```bash
npm install -D @playwright/test @nuxt/test-utils
```

### Vitest + @nuxt/test-utils (Unit/Nuxt)
```bash
npm install -D @nuxt/test-utils vitest @vue/test-utils happy-dom playwright-core
```

### Vitest + @vue/test-utils Only (Unit)
```bash
npm install -D vitest @vue/test-utils happy-dom @vitejs/plugin-vue
```

## Browser Installation
```bash
npx playwright install --with-deps
# Or specific browser only
npx playwright install chromium --with-deps
```

## Configuration Files

### playwright.config.ts
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
})
```

### vitest.config.ts
```ts
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
          name: 'e2e',
          include: ['test/e2e/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
```

### Simple vitest.config.ts (All Nuxt)
```ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
  },
})
```

### nuxt.config.ts
```ts
export default defineNuxtConfig({
  modules: ['@nuxt/test-utils/module'],
})
```

## Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:unit": "vitest --project unit",
    "test:nuxt": "vitest --project nuxt"
  }
}
```
