/**
 * Shared paths, ports and URLs for the E2E harness.
 *
 * Imported by playwright.config.ts and global-setup.ts, which both run in the
 * Node process before any test file is loaded.
 */
import * as path from 'path';

/** Repository root, two levels up from tests/web-frontend. */
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const BACKEND_DIR = path.join(REPO_ROOT, 'backend');
export const FRONTEND_DIR = path.join(REPO_ROOT, 'frontend');

/**
 * Deliberately NOT the dev ports (8000 / 5173).
 *
 * The suite wipes and reseeds its database on every run, so it must never end
 * up talking to a Django the developer happens to have running against
 * backend/db.sqlite3. Its own stack on spare ports makes that impossible;
 * the frontend is pointed at it via VITE_API_URL.
 */
export const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT || 8011);
export const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT || 5183);

export const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${BACKEND_PORT}`;
export const BASE_URL = process.env.BASE_URL || `http://localhost:${FRONTEND_PORT}`;
export const API_URL = `${BACKEND_URL}/api/`;

/** Throwaway state, kept out of the working copy's db.sqlite3 and media/. */
const E2E_TMP = path.join(__dirname, '.e2e-tmp');
export const E2E_DB_PATH = process.env.E2E_DB_PATH || path.join(E2E_TMP, 'e2e.sqlite3');
export const E2E_MEDIA_ROOT = process.env.E2E_MEDIA_ROOT || path.join(E2E_TMP, 'media');

/** Where global-setup writes the per-role storage states. */
export const AUTH_DIR = path.join(__dirname, 'playwright', '.auth');
