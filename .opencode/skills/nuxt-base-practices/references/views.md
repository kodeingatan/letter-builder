# Nuxt Views

## app.vue

Entry point aplikasi. Render content untuk semua route.

```vue
<template>
  <div>
    <h1>Welcome to the homepage</h1>
  </div>
</template>
```

## Components

Reusable UI pieces. Auto-imported dari `app/components/`.

```vue
<!-- app/app.vue -->
<template>
  <div>
    <h1>Welcome to the homepage</h1>
    <AppAlert>
      This is an auto-imported component.
    </AppAlert>
  </div>
</template>
```

## Pages

Views untuk route spesifik. Setiap file di `app/pages/` = 1 route.

```vue
<!-- app/pages/index.vue -->
<template>
  <div>
    <h1>Welcome to the homepage</h1>
  </div>
</template>
```

**Penting**: Tambahkan `<NuxtPage />` di `app.vue` atau hapus `app.vue` untuk default entry.

## Layouts

Wrapper pages dengan UI common (header, footer, sidebar).

```vue
<!-- app/app.vue -->
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

```vue
<!-- app/layouts/default.vue -->
<template>
  <div>
    <AppHeader />
    <slot />
    <AppFooter />
  </div>
</template>
```

### Best Practice
- Jika hanya 1 layout, gunakan `app.vue` dengan `<NuxtPage />` saja
- Gunakan layouts hanya jika ada beberapa layout berbeda

## Extending HTML Template

Gunakan Nitro plugin untuk modifikasi HTML:

```ts
// server/plugins/extend-html.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    html.head.push(`<meta name="description" content="My custom description" />`)
  })
})
```
