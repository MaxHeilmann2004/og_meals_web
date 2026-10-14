import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results/playwright',
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Use the built test app below so browser workers do not contend on Nuxt/Vite HMR.
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    colorScheme: 'light',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'wide',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1200 },
      },
    },
  ],
  webServer: [
    {
      command: 'node tests/e2e/mock-backend.mjs',
      url: 'http://127.0.0.1:4174/verification',
      reuseExistingServer: false,
    },
    {
      command: 'NUXT_TEST_MODE=true NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4174 pnpm build:test && NUXT_TEST_MODE=true NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4174 HOST=127.0.0.1 PORT=4173 node .output/server/index.mjs',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
