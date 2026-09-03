# Component Testing with @nuxt/test-utils

## mountSuspended

Mount any Vue component within the Nuxt environment, with async setup and access to Nuxt plugin injections.

```ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { SomeComponent } from '#components'

it('can mount some component', async () => {
  const component = await mountSuspended(SomeComponent)
  expect(component.text()).toMatchInlineSnapshot(
    '"This is an auto-imported component"',
  )
})
```

### Options
- Inherits all `@vue/test-utils` `mount` options
- `route`: initial route (default `/`), or `false` to skip route change

### Mount App
```ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import App from '~/app.vue'

it('can mount an app', async () => {
  const component = await mountSuspended(App, { route: '/test' })
  expect(component.html()).toMatchInlineSnapshot(`...`)
})
```

## renderSuspended

Render using `@testing-library/vue` for Testing Library integration.

```ts
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { SomeComponent } from '#components'
import { screen } from '@testing-library/vue'

it('can render some component', async () => {
  await renderSuspended(SomeComponent)
  expect(screen.getByText('This is an auto-imported component')).toBeDefined()
})
```

### Requirements
- Install `@testing-library/vue`
- Enable testing globals in Vitest config

### Options
- Inherits `@testing-library/vue` render options
- `route`: initial route (default `/`)

## mockNuxtImport

Mock Nuxt auto-imports. Only once per mocked import per test file.

```ts
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useState', () => {
  return () => {
    return { value: 'mocked storage' }
  }
})
```

### With Original Implementation
```ts
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { useState } from '#imports'

mockNuxtImport<typeof useState>('useState', (original) => {
  return (...args) => {
    return { ...original('some-key'), value: 'mocked state' }
  }
})
```

### Dynamic Mocks Between Tests
```ts
import { vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { useStateMock } = vi.hoisted(() => {
  return {
    useStateMock: vi.fn(() => {
      return { value: 'mocked storage' }
    }),
  }
})

mockNuxtImport('useState', () => useStateMock)

// In test:
useStateMock.mockImplementation(() => ({ value: 'something else' }))
```

## mockComponent

Mock Nuxt components by name or path.

```ts
import { mockComponent } from '@nuxt/test-utils/runtime'

mockComponent('MyComponent', {
  props: { value: String },
  setup(props) { /* ... */ },
})

// Or with factory function
mockComponent('~/components/my-component.vue', () => {
  return defineComponent({ setup(props) { /* ... */ } })
})

// Or SFC redirect
mockComponent('MyComponent', () => import('./MockComponent.vue'))
```

### Notes
- Factory function is hoisted — cannot reference local variables
- Import Vue APIs inside factory: `const { ref, h } = await import('vue')`

## registerEndpoint

Create mock Nitro endpoints for component testing.

```ts
import { registerEndpoint } from '@nuxt/test-utils/runtime'

registerEndpoint('/api/users', () => ({
  users: [{ id: 1, name: 'John' }],
}))
```

### Custom Method
```ts
registerEndpoint('/api/users', {
  method: 'POST',
  handler: () => ({ success: true }),
})
```

### Options
- `handler`: event handler function
- `method`: HTTP method (GET, POST, etc.)
- `once`: if true, handler is removed after first use

### Testing External API Calls
```ts
// Use baseURL override for external APIs
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      baseURL: process.env.NODE_ENV === 'test' ? '' : 'https://api.example.com',
    },
  },
})
```

## Built-In Mocks

```ts
// vitest.config.ts
export default defineVitestConfig({
  test: {
    environmentOptions: {
      nuxt: {
        mock: {
          intersectionObserver: true, // default
          indexedDb: true,            // uses fake-indexeddb
        },
      },
    },
  },
})
```
