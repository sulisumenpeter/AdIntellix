import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    userAgent: 'Playwright',
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: './.playwright/user.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        userAgent: devices['Desktop Chrome'].userAgent + ' Playwright'
      },
      dependencies: ['setup'],
    },
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { storageState: { cookies: [], origins: [] } }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
