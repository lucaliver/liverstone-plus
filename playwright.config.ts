import { defineConfig, devices } from '@playwright/test';

/** Browser smoke tests. They drive the dev server, which exposes `window.__combat` / `window.__game`. */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    ...devices['iPhone 13'],
    browserName: 'chromium',
  },
  webServer: {
    command: 'npx vite --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
  },
});
