# Unit Testing with @nuxt/test-utils

## Overview

- Use **Vitest** as test runner (only supported runtime)
- Tests in `test/unit/` for Node environment
- Tests in `test/nuxt/` for Nuxt runtime environment
- Use `mountSuspended` for components needing Nuxt context

## Directory Structure

```
test/
├── unit/
│   └── utils.test.ts        # Pure logic, no Nuxt
├── nuxt/
│   ├── components.test.ts   # Components with auto-imports
│   └── composables.test.ts  # Composables needing Nuxt
└── e2e/
    └── ssr.test.ts           # End-to-end tests
```

## Running Tests

```bash
# All tests
npx vitest

# Unit tests only
npx vitest --project unit

# Nuxt tests only
npx vitest --project nuxt

# Watch mode
npx vitest --watch
```

## Opting Out of Nuxt Environment

Per file (only in simple setup with `environment: 'nuxt'`):
```ts
// @vitest-environment node
import { test } from 'vitest'

test('my test', () => {
  // Runs without Nuxt environment
})
```

## Naming Convention

- Nuxt runtime tests: `*.nuxt.spec.ts` or `*.nuxt.test.ts`
- E2E tests: `*.e2e.spec.ts` or `*.e2e.test.ts`
- Unit tests: `*.test.ts` or `*.spec.ts`

## Important Notes

- `@nuxt/test-utils/runtime` and `@nuxt/test-utils/e2e` CANNOT be used in the same file
- A global Nuxt app is initialized before tests run (plugins, `app.vue`)
- Do NOT mutate global state in tests, or reset afterwards
- Use `happy-dom` (default) or `jsdom` for DOM environment
