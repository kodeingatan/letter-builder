# End-to-End Testing with @nuxt/test-utils

## Overview

Supports Vitest, Jest, Cucumber, and Playwright as test runners.

## Setup

Every `describe` block needs `setup()`:

```ts
import { describe, test } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('My test', async () => {
  await setup({
    // options
  })

  test('my test', () => {
    // ...
  })
})
```

## Setup Options

### Nuxt Config
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rootDir` | `string` | `'.'` | Path to Nuxt app |
| `configFile` | `string` | `'nuxt.config'` | Config file name |

### Timings
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `setupTimeout` | `number` | `120000` | Setup timeout (ms) |
| `teardownTimeout` | `number` | `30000` | Teardown timeout (ms) |

### Features
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `build` | `boolean` | `true` | Run build step |
| `server` | `boolean` | `true` | Launch test server |
| `port` | `number` | `undefined` | Server port |
| `host` | `string` | `undefined` | Target URL (skip build) |
| `browser` | `boolean` | `false` | Launch browser |
| `browserOptions.type` | `string` | - | `chromium`, `firefox`, or `webkit` |
| `browserOptions.launch` | `object` | - | Playwright launch options |
| `runner` | `string` | `'vitest'` | Test runner |

## APIs

### $fetch(url)
Get HTML of server-rendered page:
```ts
import { $fetch } from '@nuxt/test-utils/e2e'
const html = await $fetch('/')
```

### fetch(url)
Get full response:
```ts
import { fetch } from '@nuxt/test-utils/e2e'
const res = await fetch('/')
const { body, headers } = res
```

### url(path)
Get full URL with port:
```ts
import { url } from '@nuxt/test-utils/e2e'
const pageUrl = url('/page') // http://localhost:6840/page
```

### createPage(url)
Create Playwright page instance:
```ts
import { createPage } from '@nuxt/test-utils/e2e'
const page = await createPage('/page')
// Full Playwright API available
```

## Testing Against External Host

```ts
import { createPage, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('login page', async () => {
  await setup({
    host: 'http://localhost:8787',
  })

  it('displays fields', async () => {
    const page = await createPage('/login')
    expect(await page.getByTestId('email').isVisible()).toBe(true)
  })
})
```

## With Vitest Runner

```ts
import { describe, test, expect } from 'vitest'
import { $fetch, url } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({ server: true })

  test('renders page', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Welcome')
  })

  test('has correct url', () => {
    expect(url('/')).toContain('http://localhost')
  })
})
```

## With Playwright Test Runner

```ts
import { expect, test } from '@nuxt/test-utils/playwright'

test('test', async ({ page, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  await expect(page.getByRole('heading')).toHaveText('Welcome to Playwright!')
})
```
