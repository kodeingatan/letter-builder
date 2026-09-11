import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { fileURLToPath } from 'node:url'

const appDir = fileURLToPath(new URL('./app', import.meta.url))
const serverDir = fileURLToPath(new URL('./server', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~': appDir,
      '@': fileURLToPath(new URL('./shared', import.meta.url)),
      '~~': serverDir,
    },
  },
  test: {
    hookTimeout: 60000,
    testTimeout: 30000,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          hookTimeout: 60000,
          testTimeout: 30000,
        },
      }),
    ],
  },
})
