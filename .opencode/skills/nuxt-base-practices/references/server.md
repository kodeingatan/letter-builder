# Nuxt Server (Nitro)

## Powered by Nitro

Nuxt server menggunakan Nitro engine:
- Full control server-side
- Universal deployment (any provider)
- Hybrid rendering

## Server Endpoints & Middleware

```ts
// server/api/test.ts
export default defineEventHandler(async (event) => {
  // handle request
  return { hello: 'world' }
})
```

Support: `text`, `json`, `html`, `stream`

### Features
- Hot module replacement
- Auto-import (sama seperti Vue parts)

## Universal Deployment

15+ presets untuk cloud providers:
- Cloudflare Workers
- Netlify Functions
- Vercel Cloud
- Deno
- Bun
- Node.js
- Dan lainnya

## Hybrid Rendering dengan routeRules

```ts
export default defineNuxtConfig({
  routeRules: {
    // Pre-rendered untuk SEO
    '/': { prerender: true },
    // Cached 1 jam
    '/api/*': { cache: { maxAge: 60 * 60 } },
    // Redirect
    '/old-page': {
      redirect: { to: '/new-page', statusCode: 302 },
    },
  },
})
```

### Route Rules yang Tersedia
- `prerender`: pre-render route
- `cache`: cache response
- `redirect`: redirect ke route lain
- `ssr`: enable/disable SSR
- `appMiddleware`: control app middleware
- `noScripts`: disable scripts

## Server Middleware

Berbeda dengan route middleware (Vue side). Server middleware jalan di Nitro server.

```
server/middleware/
├── log.ts
└── auth.ts
```

## Server Plugins

```
server/plugins/
├── error-handler.ts
└── extend-html.ts
```

## Server Utils

```
server/utils/
├── helpers.ts
└── validators.ts
```

## Best Practices

- Pisahkan server code dari client code
- Gunakan `server/api/` untuk API endpoints
- Gunakan `server/middleware/` untuk server-side middleware
- Gunakan `runtimeConfig` untuk environment variables
- Gunakan `routeRules` untuk hybrid rendering
