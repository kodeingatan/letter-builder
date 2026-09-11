export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  future: { compatibilityVersion: 4 },

  modules: ['@pinia/nuxt'],

  imports: {
    dirs: ['stores'],
  },

  components: {
    dirs: [
      { path: '~/components/base', prefix: '' },
      { path: '~/components/common', prefix: '' },
      { path: '~/components/features', prefix: '' },
      { path: '~/components/layout', prefix: '' },
    ],
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [(await import('@tailwindcss/vite')).default()],
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    public: {
      apiBase: '/api',
    },
  },

  app: {
    head: {
      title: 'Letter Builder System',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Letter Builder System — aplikasi administrasi persuratan otomatis untuk pemerintahan dan perusahaan' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  nitro: {
    externals: {
      inline: ['better-sqlite3'],
    },
  },

  typescript: {
    strict: true,
  },
})
