import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx nuxi dev --port 3000',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
})
