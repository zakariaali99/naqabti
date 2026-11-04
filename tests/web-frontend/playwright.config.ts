import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import {
  API_URL,
  BACKEND_DIR,
  BACKEND_PORT,
  BACKEND_URL,
  BASE_URL,
  E2E_DB_PATH,
  E2E_MEDIA_ROOT,
  FRONTEND_DIR,
  FRONTEND_PORT,
} from './e2e.env';

/**
 * The suite runs against a real Django backend on a throwaway SQLite database
 * seeded by `manage.py seed_e2e_data`. See global-setup.ts and README.md.
 *
 * Both servers run on non-default ports so a dev stack on 8000/5173 is never
 * touched — the frontend is pointed at the E2E backend through VITE_API_URL.
 */
/* The backend webServer starts before globalSetup, and SQLite won't create its
 * file inside a directory that doesn't exist yet. */
fs.mkdirSync(path.dirname(E2E_DB_PATH), { recursive: true });
fs.mkdirSync(E2E_MEDIA_ROOT, { recursive: true });

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  /* Every spec shares one database, so they never run concurrently. */
  workers: 1,
  timeout: 60_000,

  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['junit', { outputFile: 'results.xml' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* Video needs Playwright's bundled ffmpeg, which a `--with-deps chromium`
     * install may not have fetched; the trace is enough for local debugging. */
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Set E2E_CHROME_CHANNEL=chrome to drive an installed Google Chrome
         * instead of Playwright's bundled build. */
        channel: process.env.E2E_CHROME_CHANNEL || undefined,
      },
    },
    /* Cross-browser runs are opt-in: `npx playwright test --project=firefox`. */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: [
    {
      command: `python3 manage.py migrate --noinput && python3 manage.py runserver ${BACKEND_PORT} --noreload`,
      cwd: BACKEND_DIR,
      /* academic-degrees is AllowAny, so a response here means the API is up. */
      url: `${BACKEND_URL}/api/academic-degrees/`,
      /* Never reuse: a stranger on this port would get its data wiped. */
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        DJANGO_DB_NAME: E2E_DB_PATH,
        DJANGO_MEDIA_ROOT: E2E_MEDIA_ROOT,
        EMAIL_BACKEND: 'django.core.mail.backends.locmem.EmailBackend',
        DEBUG: 'True',
        SECRET_KEY: 'e2e-insecure-key',
      },
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      cwd: FRONTEND_DIR,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        VITE_API_URL: API_URL,
      },
    },
  ],

  outputDir: path.join(__dirname, 'test-results'),
});
