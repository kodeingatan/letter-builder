# Nuxt Anti-Patterns

## Component Patterns

### ❌ Jangan import components manual
```vue
<!-- SALAH -->
<script>
import MyComponent from '~/components/MyComponent.vue'
</script>

<!-- BENAR: auto-imported -->
<template>
  <MyComponent />
</template>
```

### ❌ Jangan gunakan Options API
```vue
<!-- SALAH -->
<script>
export default {
  data() {
    return { count: 0 }
  }
}
</script>

<!-- BENAR: Composition API -->
<script setup lang="ts">
const count = ref(0)
</script>
```

## State Management Patterns

### ❌ Jangan define state di luar setup
```ts
// SALAH - shared across requests, memory leak
export const myState = ref({})

// BENAR - composable pattern
export const useMyState = () => useState('my-state', () => ({}))
```

### ❌ Jangan simpan non-serializable data
```ts
// SALAH
const state = useState('data', () => ({
  date: new Date(), // ❌ Date object
  fn: () => {},     // ❌ Function
}))

// BENAR
const state = useState('data', () => ({
  date: new Date().toISOString(), // ✅ String
  // fn dihapus atau dipindah ke composable
}))
```

## Data Fetching Patterns

### ❌ Jangan pakai $fetch di setup
```vue
<!-- SALAH - double fetch -->
<script setup lang="ts">
const data = await $fetch('/api/data')
</script>

<!-- BENAR -->
<script setup lang="ts">
const { data } = await useFetch('/api/data')
</script>
```

### ❌ Jangan pakai useAsyncData untuk side effects
```ts
// SALAH - bisa cause repeated execution
await useAsyncData(() => offersStore.getOffer(route.params.slug))

// BENAR - gunakan callOnce
await callOnce(() => offersStore.getOffer(route.params.slug))
```

## Routing Patterns

### ❌ Jangan gunakan router-link bawaan
```vue
<!-- SALAH -->
<router-link to="/about">About</router-link>

<!-- BENAR -->
<NuxtLink to="/about">About</NuxtLink>
```

### ❌ Jangan hardcode route paths
```ts
// SALAH
navigateTo('/dashboard')

// BENAR - gunakan named routes
navigateTo({ name: 'dashboard' })
```

## Server Patterns

### ❌ Jangan letakkan client code di server
```ts
// server/api/test.ts
// ❌ SALAH
console.log(document) // document hanya ada di client

// ✅ BENAR
return { message: 'Hello' }
```

### ❌ Jangan expose secrets
```ts
// ❌ SALAH
export default defineEventHandler(() => {
  return {
    apiKey: process.env.API_KEY // exposed ke client!
  }
})

// ✅ BENAR - gunakan runtimeConfig
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  return {
    // jangan return apiKey
  }
})
```

## Performance Patterns

### ❌ Jangan lazy load semua
```ts
// ❌ SALAH - semua data di-lazy
const { data } = useFetch('/api/data', { lazy: true })

// ✅ BENAR - lazy hanya jika perlu
const { data } = useFetch('/api/data') // default: not lazy
// Gunakan lazy untuk non-critical data
const { data: comments } = useFetch('/api/comments', { lazy: true })
```

### ❌ Jangan fetch di watch tanpa dedupe
```ts
// ❌ SALAH - fetch setiap kali id berubah
const id = ref(1)
const { data } = await useFetch(`/api/users/${id.value}`, {
  watch: [id],
})

// ✅ BENAR - gunakan computed URL
const { data } = await useFetch(() => `/api/users/${id.value}`)
```

## Error Handling Patterns

### ❌ Jangan throw error tanpa status
```ts
// ❌ SALAH
throw new Error('Something went wrong')

// ✅ BENAR
throw createError({
  status: 500,
  message: 'Something went wrong',
})
```

### ❌ Jangan ignore errors
```ts
// ❌ SALAH
const { data } = await useFetch('/api/data')

// ✅ BENAR
const { data, error } = await useFetch('/api/data')
if (error.value) {
  // handle error
}
```
