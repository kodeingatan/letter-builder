import { defineConfig, devices } from '@playwright/test'

// Headed by default so the browser window is visible while testing.
// Set HEADLESS=1 (or CI=true) to run without a display, e.g. on servers.
const headed = process.env.HEADLESS !== '1' && process.env.CI !== 'true'

// Slow motion (ms) only applies in headed mode so each step is easy to follow.
// Tune with SLOWMO_MS=0 for full speed.
const slowMo = headed ? Number(process.env.SLOWMO_MS ?? 100) : 0

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: !headed,
    launchOptions: {
      slowMo,
    },
    viewport: { width: 1280, height: 720 },
    video: 'retain-on-failure',
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
