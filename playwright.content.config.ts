import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/content',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4323',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4323 --ignore-lock',
    url: 'http://127.0.0.1:4323/',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ASTRO_DEV_BACKGROUND: '0',
    },
  },
});
