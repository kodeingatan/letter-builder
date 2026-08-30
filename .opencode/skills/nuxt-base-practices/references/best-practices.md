# Nuxt Best Practices

## Project Structure

- Gunakan `app/` directory untuk semua source code
- Pisahkan concerns: pages, components, composables, server
- Gunakan `shared/` untuk code yang dipakai client & server

## Components

- Auto-import dari `app/components/`
- Gunakan PascalCase untuk component names
- Buat reusable components di folder terpisah

## Composables

- Auto-import dari `app/composables/`
- Gunakan pattern `useX()` untuk composables
- Jangan define state di luar setup function

## Routing

- Manfaatkan file-based routing
- Gunakan `<NuxtLink>` untuk navigasi
- Implement route middleware untuk auth/guard
- Gunakan `definePageMeta` untuk page metadata

## Data Fetching

- Gunakan `useFetch` atau `useAsyncData` untuk SSR-safe fetching
- Hindari `$fetch` di setup function (causes double fetch)
- Gunakan `lazy` option untuk non-blocking navigation
- Gunakan `pick` atau `transform` untuk minimize payload
- Berikan explicit key untuk sharing data antar components

## State Management

- Gunakan `useState` untuk simple shared state
- Gunakan Pinia untuk complex state management
- Jangan simpan non-serializable data di state

## Server

- Pisahkan API logic di `server/api/`
- Gunakan `server/middleware/` untuk server-side middleware
- Manfaatkan `routeRules` untuk hybrid rendering
- Gunakan `runtimeConfig` untuk environment variables

## Error Handling

- Buat `error.vue` untuk custom error page
- Gunakan `NuxtErrorBoundary` untuk error isolation
- Implement global error handler dengan `vue:error` hook

## Performance

- Manfaatkan code splitting (default aktif)
- Gunakan `<NuxtLink>` untuk prefetch
- Optimize images dengan `@nuxt/image`
- Gunakan CDN untuk static assets
- Compress CSS/JS

## Security

- Jangan expose private keys ke client
- Gunakan `runtimeConfig` untuk secrets
- Implement CSRF protection
- Validate user input di server-side
- Gunakan HTTPS

## TypeScript

- Gunakan `.ts` untuk nuxt.config
- Manfaatkan auto-generated types
- Gunakan strict mode di tsconfig

## Testing

- Unit test untuk composables dan utilities
- E2E test untuk critical flows
- Gunakan Vitest sebagai test runner

## Deployment

- Gunakan `nuxt build` untuk production
- Test dengan `nuxt preview` sebelum deploy
- Manfaatkan Nitro presets untuk target platform
