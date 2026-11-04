import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { request, type FullConfig } from '@playwright/test';

import {
  AUTH_DIR,
  BACKEND_DIR,
  BACKEND_URL,
  BASE_URL,
  E2E_DB_PATH,
  E2E_MEDIA_ROOT,
} from './e2e.env';
import { USERS, type Role } from './fixtures/users';

const PYTHON = process.env.E2E_PYTHON || 'python3';

/**
 * Reset the E2E database and mint one storage state per seeded role.
 *
 * Runs after Playwright has started (or reused) the webServers, so the schema
 * is already migrated by the backend webServer command.
 */
async function globalSetup(_config: FullConfig) {
  seedDatabase();
  await mintStorageStates();
}

function seedDatabase() {
  if (process.env.E2E_SKIP_SEED) {
    console.log('[e2e] E2E_SKIP_SEED set — reusing the existing database.');
    return;
  }

  fs.mkdirSync(path.dirname(E2E_DB_PATH), { recursive: true });
  fs.mkdirSync(E2E_MEDIA_ROOT, { recursive: true });

  const env = {
    ...process.env,
    DJANGO_DB_NAME: E2E_DB_PATH,
    DJANGO_MEDIA_ROOT: E2E_MEDIA_ROOT,
    EMAIL_BACKEND: 'django.core.mail.backends.locmem.EmailBackend',
  };

  console.log(`[e2e] Seeding ${E2E_DB_PATH}`);
  // migrate first: when BACKEND_URL points at an already-running server the
  // webServer block was skipped, so nothing else has created the schema.
  execFileSync(PYTHON, ['manage.py', 'migrate', '--noinput'], {
    cwd: BACKEND_DIR,
    env,
    stdio: 'inherit',
  });
  execFileSync(PYTHON, ['manage.py', 'seed_e2e_data', '--reset'], {
    cwd: BACKEND_DIR,
    env,
    stdio: 'inherit',
  });
}

async function mintStorageStates() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const context = await request.newContext({ baseURL: BACKEND_URL });

  try {
    for (const user of Object.values(USERS)) {
      const response = await context.post('/api/auth/login/', {
        data: { username: user.email, password: user.password },
      });

      if (!response.ok()) {
        throw new Error(
          `[e2e] Could not log in ${user.email} against ${BACKEND_URL} ` +
            `(${response.status()}). The backend on that port is not the one ` +
            `seeded at ${E2E_DB_PATH}. Body: ${await response.text()}`,
        );
      }

      const { access, refresh } = await response.json();
      writeStorageState(user.role, access, refresh);
    }
  } finally {
    await context.dispose();
  }

  console.log(`[e2e] Wrote storage states for ${Object.keys(USERS).length} roles.`);
}

/**
 * The app reads its session out of localStorage: `access_token` / `refresh_token`
 * (see frontend/src/api/client.ts). `i18nextLng` is pinned to English because
 * every assertion in the suite is text-based and the app defaults to Arabic.
 *
 * The access token lives only 1 minute (SIMPLE_JWT.ACCESS_TOKEN_LIFETIME), so
 * most specs start with an expired one. That is intentional: it exercises the
 * 401 -> refresh -> retry interceptor against the real backend, and the 7-day
 * refresh token keeps the session alive.
 */
function writeStorageState(role: Role, access: string, refresh: string) {
  const state = {
    cookies: [],
    origins: [
      {
        origin: BASE_URL,
        localStorage: [
          { name: 'access_token', value: access },
          { name: 'refresh_token', value: refresh },
          { name: 'i18nextLng', value: 'en' },
        ],
      },
    ],
  };

  fs.writeFileSync(storageStatePath(role), JSON.stringify(state, null, 2));
}

export function storageStatePath(role: Role) {
  return path.join(AUTH_DIR, `${role}.json`);
}

export default globalSetup;
