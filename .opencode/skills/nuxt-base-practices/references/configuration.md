# Nuxt Configuration

## nuxt.config.ts

File konfigurasi utama di root project. Gunakan `.ts` untuk IDE hints.

```ts
export default defineNuxtConfig({
  // konfigurasi di sini
})
```

## Environment Overrides

```ts
export default defineNuxtConfig({
  $production: {
    routeRules: {
      '/**': { isr: true },
    },
  },
  $development: {
    // konfigurasi dev
  },
  $env: {
    staging: {
      // konfigurasi staging
    },
  },
})
```

Jalankan dengan: `nuxt build --envName staging`

## runtimeConfig

Untuk environment variables (private & public tokens):

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys (server-side only)
    apiSecret: '123',
    // Public keys (client-side juga)
    public: {
      apiBase: '/api',
    },
  },
})
```

Override dengan env var: `NUXT_API_SECRET=api_secret_token`

Akses di komponen:
```ts
const runtimeConfig = useRuntimeConfig()
```

## app.config.ts

Untuk public tokens yang ditentukan saat build time (tidak bisa di-override dengan env var):

```ts
export default defineAppConfig({
  title: 'Hello Nuxt',
  theme: {
    dark: true,
    colors: {
      primary: '#ff0000',
    },
  },
})
```

Akses di komponen:
```ts
const appConfig = useAppConfig()
```

## Perbandingan runtimeConfig vs app.config

| Feature | runtimeConfig | app.config |
|---------|---------------|------------|
| Client-side | Hydrated | Bundled |
| Environment variables | Ya | Tidak |
| Reactive | Ya | Ya |
| Types support | Partial | Ya |
| Hot module replacement | Tidak | Ya |
| Non-primitive JS types | Tidak | Ya |

## External Configuration Files

| Name | Config File | How To Configure |
|------|-------------|------------------|
| Nitro | `nitro.config.ts` | `nitro` key di nuxt.config |
| PostCSS | `postcss.config.js` | `postcss` key di nuxt.config |
| Vite | `vite.config.ts` | `vite` key di nuxt.config |
| webpack | `webpack.config.ts` | `webpack` key di nuxt.config |

## Vue Configuration

### Dengan Vite
```ts
export default defineNuxtConfig({
  vite: {
    vue: {
      customElement: true,
    },
    vueJsx: {
      mergeProps: true,
    },
  },
})
```

### Experimental Vue Features
```ts
export default defineNuxtConfig({
  vue: {
    propsDestructure: true,
  },
})
```
