# Nuxt Routing

## File-System Routing

Setiap file di `app/pages/` membuat route otomatis.

### Contoh Struktur

```
pages/
├── about.vue        → /about
├── index.vue        → /
└── posts/
    └── [id].vue     → /posts/:id
```

## Navigation

Gunakan `<NuxtLink>` untuk link antar pages:

```vue
<template>
  <nav>
    <ul>
      <li><NuxtLink to="/about">About</NuxtLink></li>
      <li><NuxtLink to="/posts/1">Post 1</NuxtLink></li>
    </ul>
  </nav>
</template>
```

- Render `<a>` tag dengan `href`
- Prefetch otomatis saat viewport (client-side)
- Transisi in-JavaScript (no full-page refresh)

## Route Parameters

Akses params dengan `useRoute()`:

```vue
<script setup lang="ts">
const route = useRoute()
console.log(route.params.id) // akses /posts/1 → "1"
</script>
```

## Route Middleware

Jalankan code sebelum navigate ke route.

### 3 Jenis Middleware

1. **Anonymous/inline**: langsung di page
2. **Named**: di `app/middleware/` (auto-loaded)
3. **Global**: di `app/middleware/` dengan suffix `.global`

### Contoh Auth Middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  if (isAuthenticated() === false) {
    return navigateTo('/login')
  }
})
```

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})
</script>
```

**Catatan**: Route middleware berbeda dengan server middleware.

## Route Validation

Validasi route dengan `validate` di `definePageMeta()`:

```vue
<script setup lang="ts">
definePageMeta({
  validate(route) {
    return typeof route.params.id === 'string' && /^\d+$/.test(route.params.id)
  },
})
</script>
```

Return `false` → 404 error. Return `status`/`statusText` untuk custom error.

## Code Splitting

Default: aktif. Setiap page di-load secara dynamic.

Non-aktifkan jika perlu (jarang diperlukan):
```ts
export default defineNuxtConfig({
  vite: {
    $client: {
      build: {
        rolldownOptions: {
          output: {
            codeSplitting: false,
          },
        },
      },
    },
  },
})
```
