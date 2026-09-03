# Nuxt Error Handling

## Sumber Error

1. Vue rendering lifecycle (SSR & CSR)
2. Server/client startup errors
3. Nitro server lifecycle errors
4. JS chunk download errors

## Vue Errors

```ts
// plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // handle error
  }

  nuxtApp.hook('vue:error', (error, instance, info) => {
    // handle error
  })
})
```

## Error Page

Buat `error.vue` di source directory:

```vue
<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError,
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div>
    <h2>{{ error?.status }}</h2>
    <button @click="handleError">Clear errors</button>
  </div>
</template>
```

## Error Utils

### useError
```ts
const error = useError()
```

### createError
```ts
throw createError({
  status: 404,
  statusText: 'Page Not Found',
})
```

- Server-side: trigger full-screen error page
- Client-side: non-fatal error (set `fatal: true` untuk full-screen)

### showError
```ts
showError('Something went wrong')
```

### clearError
```ts
await clearError({ redirect: '/' })
```

## NuxtErrorBoundary

Handle client-side errors tanpa full error page:

```vue
<template>
  <NuxtErrorBoundary @error="someErrorLogger">
    <template #error="{ error, clearError }">
      Error: {{ error }}
      <button @click="clearError">Clear</button>
    </template>
  </NuxtErrorBoundary>
</template>
```

## Best Practices

- Gunakan `vue:error` hook untuk global error reporting
- Gunakan `createError` untuk throw errors
- Gunakan `NuxtErrorBoundary` untuk error isolation
- Handle chunk loading errors (auto-reload by default)
- Jangan expose error details di production
