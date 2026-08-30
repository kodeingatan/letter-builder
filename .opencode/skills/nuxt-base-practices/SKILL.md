---
name: nuxt-base-practices
description: Best practices untuk menggunakan Nuxt.js framework pada project Vue 3 full-stack. Mencakup installation, configuration, routing, data fetching, state management, server (Nitro), styling, error handling, dan production recommendations.
metadata:
  author: opencode
  version: "1.0"
  category: frontend
  framework: nuxt
---

# Nuxt.js Best Practices

## Tujuan Skill

Menyediakan panduan komprehensif untuk开发、maintenance、dan optimization Nuxt.js application sesuai best practices resmi.

## Kapan Skill Digunakan

- Saat membuat project Nuxt baru
- Saat refactor komponen, routing, atau state management
- Saat implementasi data fetching patterns
- Saat setup server routes dan API
- Saat debug error handling
- Saat optimize performance
- Saat deploy ke production

## Kapan Skill TIDAK Digunakan

- Untuk Vue.js vanilla (tanpa Nuxt)
- Untuk framework lain (Next.js, Remix, dll)
- Untuk pure backend tanpa frontend

## Workflow Penggunaan

1. **Baca masalah** → identifikasi konteks Nuxt yang terlibat
2. **Konsultasi references** → lihat folder `references/` untuk detail
3. **Terapkan best practices** → ikuti pola yang benar
4. **Hindari anti-patterns** → cek daftar anti-patterns
5. **Verifikasi** → pastikan tidak ada error

## Checklist Sebelum Implementasi

- [ ] Apakah ini Nuxt project (bukan Vue vanilla)?
- [ ] Apakah ada `nuxt.config.ts` di root?
- [ ] Apakah menggunakan Composition API dengan `<script setup>`?
- [ ] Apakah sudah cek references untuk topik spesifik?
- [ ] Apakah ada pattern serupa di codebase yang bisa di-reuse?

## Checklist Sesudah Implementasi

- [ ] Tidak ada manual imports untuk auto-imported items
- [ ] State management menggunakan `useState` atau Pinia (bukan `ref` global)
- [ ] Data fetching menggunakan `useFetch`/`useAsyncData` (bukan `$fetch` di setup)
- [ ] Routing menggunakan `<NuxtLink>` (bukan `<router-link>`)
- [ ] Error handling terimplementasi dengan benar
- [ ] Tidak ada secrets yang exposed ke client

## Best Practices

### Project Structure
- Gunakan `app/` directory untuk semua source code
- Pisahkan concerns: pages, components, composables, server
- Manfaatkan auto-imports untuk components dan composables
- Gunakan `shared/` untuk code client & server

### Components & Composables
- Auto-import dari `app/components/` dan `app/composables/`
- Gunakan PascalCase untuk component names
- Pattern `useX()` untuk composables
- Jangan define state di luar setup function

### Routing
- Manfaatkan file-based routing
- Gunakan `<NuxtLink>` untuk navigasi
- Implement route middleware untuk auth/guard
- Gunakan `definePageMeta` untuk page metadata

### Data Fetching
- Gunakan `useFetch` atau `useAsyncData` untuk SSR-safe fetching
- Hindari `$fetch` di setup function
- Gunakan `lazy` untuk non-blocking navigation
- Gunakan `pick`/`transform` untuk minimize payload
- Berikan explicit key untuk sharing data

### State Management
- `useState` untuk simple shared state
- Pinia untuk complex state management
- Jangan simpan non-serializable data

### Server (Nitro)
- Pisahkan API logic di `server/api/`
- Gunakan `server/middleware/` untuk server middleware
- Manfaatkan `routeRules` untuk hybrid rendering
- Gunakan `runtimeConfig` untuk environment variables

### Error Handling
- Buat `error.vue` untuk custom error page
- Gunakan `NuxtErrorBoundary` untuk error isolation
- Implement global error handler dengan `vue:error` hook

### Performance
- Manfaatkan code splitting (default aktif)
- Gunakan `<NuxtLink>` untuk prefetch
- Optimize images dengan `@nuxt/image`
- Compress CSS/JS

### Security
- Jangan expose private keys ke client
- Gunakan `runtimeConfig` untuk secrets
- Implement CSRF protection
- Validate input di server-side

## Conventions

- Gunakan `<script setup lang="ts">` untuk semua komponen
- Gunakan `ref()` atau `reactive()` untuk local state
- Gunakan `useState()` untuk shared state
- Gunakan `computed()` untuk derived state
- Gunakan `watch()` atau `watchEffect()` untuk side effects
- Gunakan `onMounted()` untuk client-side logic
- Gunakan `callOnce()` untuk one-time initialization
- Gunakan `navigateTo()` untuk programmatic navigation
- Gunakan `useRoute()` untuk akses route info
- Gunakan `useRouter()` untuk navigation methods

## Anti-Patterns (WAJIB Dihindari)

### ❌ Component Patterns
- Import components manual (auto-import sudah aktif)
- Gunakan Options API (Composition API lebih baik)
- Define state di luar setup function

### ❌ State Patterns
- Simpan non-serializable data di state (Date, Function)
- Shared state tanpa unique key

### ❌ Data Fetching Patterns
- Pakai `$fetch` di setup function (double fetch)
- Pakai `useAsyncData` untuk side effects
- Lazy load semua data (hanya untuk non-critical)

### ❌ Routing Patterns
- Gunakan `<router-link>` (gunakan `<NuxtLink>`)
- Hardcode route paths (gunakan named routes)

### ❌ Server Patterns
- Letakkan client code di server
- Expose secrets ke client
- Skip input validation

### ❌ Error Handling Patterns
- Throw error tanpa status
- Ignore error values dari composables

## Internal References

Untuk detail lebih lanjut, lihat folder `references/`:

- `references/official-documentation.md` - Ringkasan dokumentasi resmi
- `references/installation.md` - Panduan instalasi
- `references/configuration.md` - Konfigurasi nuxt.config.ts
- `references/folder-structure.md` - Struktur direktori
- `references/views.md` - Components, pages, layouts
- `references/routing.md` - File-based routing dan middleware
- `references/state-management.md` - useState dan Pinia
- `references/data-fetching.md` - useFetch, useAsyncData, $fetch
- `references/server.md` - Nitro server dan API routes
- `references/styling.md` - CSS, preprocessors, PostCSS
- `references/error-handling.md` - Error pages dan utils
- `references/best-practices.md` - Best practices lengkap
- `references/anti-patterns.md` - Anti-patterns yang harus dihindari

## Instruksi untuk AI

**WAJIB** mengikuti best practices yang telah dipelajari:

1. **Selalu gunakan Composition API** dengan `<script setup lang="ts">`
2. **Selalu gunakan auto-imports** untuk components dan composables
3. **Selalu gunakan `useFetch`/`useAsyncData`** untuk data fetching di setup
4. **Selalu gunakan `<NuxtLink>`** untuk navigasi
5. **Selalu gunakan `useState`** untuk shared state
6. **Selalu handle errors** dengan benar
7. **Jangan pernah expose secrets** ke client-side
8. **Jangan pernah gunakan `$fetch`** di setup function
9. **Jangan pernah define state** di luar setup function
10. **Selalu cek anti-patterns** sebelum implementasi
