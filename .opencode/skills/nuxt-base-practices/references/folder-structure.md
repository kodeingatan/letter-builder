# Nuxt Directory Structure

## Root Directory

Berisi `nuxt.config.ts` sebagai file konfigurasi utama.

## App Directory (`app/`)

Direktori utama aplikasi Nuxt:

- **`assets/`**: aset yang di-process oleh build tool (gambar, CSS, font)
- **`components/`**: Vue components (auto-imported)
- **`composables/`**: Vue composables (auto-imported)
- **`layouts/`**: layout wrapper untuk pages
- **`middleware/`**: route middleware (before navigate)
- **`pages/`**: file-based routing
- **`plugins/`**: Vue plugins
- **`utils/`**: utility functions (auto-imported)

### File Penting di app/
- **`app.vue`**: root component
- **`app.config.ts`**: reactive configuration
- **`error.vue`**: error page

## Public Directory (`public/`)

File statis yang di-serve langsung tanpa di-process. Cocok untuk:
- `robots.txt`
- `favicon.ico`
- Image yang tidak perlu di-optimasi

## Server Directory (`server/`)

Server-side code:

- **`api/`**: API routes (Nitro)
- **`routes/`**: server routes (misal: `/sitemap.xml`)
- **`middleware/`**: server middleware
- **`plugins/`**: server plugins
- **`utils/`**: server utilities

## Shared Directory (`shared/`)

Code yang bisa digunakan di Vue app DAN Nitro server.

## Test Directory (`test/`)

Tempat untuk unit test, Nuxt runtime test, dan end-to-end test.

## Content Directory (`content/`)

Untuk Nuxt Content module (file-based CMS dengan Markdown).

## Modules Directory (`modules/`)

Local modules untuk extend Nuxt.

## Layers Directory (`layers/`)

Reusable code, components, composables, dan configurations.

## Nuxt Files

- **`nuxt.config.ts`**: main configuration
- **`.nuxtrc`**: alternative configuration syntax
- **`.nuxtignore`**: ignore files during build
