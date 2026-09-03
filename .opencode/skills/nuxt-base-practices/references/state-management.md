# Nuxt State Management

## useState Composable

SSR-friendly `ref` replacement. Value preserved setelah SSR (client-side hydration) dan shared across components.

```vue
<script setup lang="ts">
const counter = useState('counter', () => Math.round(Math.random() * 1000))
</script>

<template>
  <div>
    Counter: {{ counter }}
    <button @click="counter++">+</button>
    <button @click="counter--">-</button>
  </div>
</template>
```

## Best Practices

### Jangan define state di luar setup
```ts
// ❌ SALAH - shared across requests di server, memory leak
export const myState = ref({})

// ✅ BENAR - gunakan composable pattern
export const useMyState = () => useState('my-state', () => ({}))
```

### Data harus serializable
Karena di-serialize ke JSON, jangan simpan:
- Classes
- Functions
- Symbols

## Inisialisasi State dengan Async Data

```vue
<script setup lang="ts">
const websiteConfig = useState('config')
await callOnce(async () => {
  websiteConfig.value = await $fetch('https://my-cms.com/api/website-config')
})
</script>
```

## Shared State dengan Composable

```ts
// composables/states.ts
export const useColor = () => useState<string>('color', () => 'pink')
```

```vue
<script setup lang="ts">
const color = useColor()
</script>
```

## Pinia Integration

```ts
// stores/website.ts
export const useWebsiteStore = defineStore('websiteStore', {
  state: () => ({
    name: '',
    description: '',
  }),
  actions: {
    async fetch() {
      const infos = await $fetch('https://api.nuxt.com/modules/pinia')
      this.name = infos.name
      this.description = infos.description
    },
  },
})
```

```vue
<script setup lang="ts">
const website = useWebsiteStore()
await callOnce(website.fetch)
</script>
```

## Clear State

Gunakan `clearNuxtState` untuk invalidate cached state secara global.
