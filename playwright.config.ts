import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './web/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  webServer: [
    { command: 'npm run dev:backend', url: 'http://127.0.0.1:3000/health', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev:web', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
  ],
});
