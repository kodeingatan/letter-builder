# Nuxt Data Fetching

## 3 Tools Utama

### 1. `$fetch`
Simplest network request. Auto-imported globally.

```ts
async function addTodo() {
  const todo = await $fetch('/api/todos', {
    method: 'POST',
    body: { /* data */ },
  })
}
```

**Catatan**: Tidak ada deduplication atau navigation prevention. Gunakan untuk client-side interactions atau bersama `useAsyncData`.

### 2. `useFetch`
Wrapper `$fetch` untuk SSR-safe fetching. Fetch hanya sekali di universal rendering.

```vue
<script setup lang="ts">
const { data } = await useFetch('/api/data')
</script>
```

### 3. `useAsyncData`
Seperti `useFetch` tapi lebih fine-grained control.

```vue
<script setup lang="ts">
const { data, error } = await useAsyncData('users', () => myGetFunction('users'))
</script>
```

## Mengapa Perlu useFetch/useAsyncData?

Jika pakai `$fetch` di setup function:
- Data fetch 2x (server + client hydration)
- Hydration issues
- Increased time to interactivity

## Return Values

- `data`: hasil async function
- `refresh`/`execute`: manual refetch
- `clear`: reset data ke undefined
- `error`: error object jika fetch gagal
- `status`: `"idle"`, `"pending"`, `"success"`, `"error"`

## Options Penting

### Lazy
Navigation tidak menunggu data resolve:
```ts
const { status, data } = useFetch('/api/posts', { lazy: true })
```

Atau gunakan `useLazyFetch`.

### Client-only
Hanya fetch di client-side:
```ts
const { data } = useFetch('/api/comments', { server: false })
```

### Minimize Payload
Pilih field yang dibutuhkan:
```ts
const { data } = await useFetch('/api/mountains/1', {
  pick: ['title', 'description'],
})
```

### Caching & Keys
- `useFetch`: auto-generate key dari URL + options + location
- `useAsyncData`: gunakan first argument sebagai key

```ts
// Share data antar component
const { data } = await useAsyncData('users', () => fetchUsers())

// Independent instances
const { data: u1 } = await useAsyncData('users-1', () => fetchUsers())
const { data: u2 } = await useAsyncData('users-2', () => fetchUsers())
```

### Watch
Refetch saat reactive value berubah:
```ts
const id = ref(1)
const { data } = await useFetch('/api/users', { watch: [id] })
```

### Computed URL
```ts
const { data } = useLazyFetch(() => `/api/users/${id.value}`, {
  immediate: false,
})
```

### Not Immediate
Tidak langsung fetch:
```ts
const { data, execute } = await useFetch('/api/comments', { immediate: false })
```

## Passing Headers & Cookies

```ts
const headers = useRequestHeaders(['cookie'])
const { data } = await useFetch('/api/me', { headers })
```

## Parallel Requests

```ts
const { data } = await useAsyncData((_nuxtApp, { signal }) => {
  return Promise.all([
    $fetch('/api/comments', { signal }),
    $fetch('/api/author/12', { signal }),
  ])
})
```
