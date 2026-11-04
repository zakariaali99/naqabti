# Web frontend E2E tests

Playwright specs that drive the real app against a **real Django backend on a
throwaway SQLite database**. A broken serializer, permission or migration fails
a test here — that is the point of not mocking the API.

## Run it

```bash
cd tests/web-frontend
npm ci
npx playwright install --with-deps chromium

npm test                # chromium, the whole suite
npm run test:journeys   # just the two user journeys
npm run test:headed     # watch it happen
npm run test:ui         # Playwright's UI mode
npm run report          # open the last HTML report
```

Nothing else needs to be running. Playwright starts its own Django and Vite,
and stops them when the run ends.

If `playwright install` can't reach the CDN, drive an installed Google Chrome
instead of the bundled build:

```bash
E2E_CHROME_CHANNEL=chrome npm test
```

### It does not touch your dev stack

The E2E servers listen on **8011 (Django) and 5183 (Vite)**, not 8000/5173, and
`reuseExistingServer` is off. The frontend is pointed at the E2E API through
`VITE_API_URL`. Your `backend/db.sqlite3`, your `backend/media/` and whatever
you have running on the dev ports are all left alone — the suite writes only to
`tests/web-frontend/.e2e-tmp/` (gitignored).

Override with `E2E_BACKEND_PORT`, `E2E_FRONTEND_PORT`, `E2E_DB_PATH`,
`E2E_MEDIA_ROOT`, or point the whole thing at an existing deployment with
`BASE_URL` + `BACKEND_URL` + `E2E_SKIP_SEED=1`.

## Layout

```
e2e.env.ts        ports, URLs and paths shared by the config and setup
global-setup.ts   reseeds the database, mints one storageState per role
fixtures/
  users.ts        the seeded cast — mirrors seed_e2e_data.py
  auth.ts         test.extend: adminPage / managerPage / doctor*Page, adminApi
pages/            page objects (LoginPage, MemberMembershipPage, …)
tests/
  journeys/       the two end-to-end user journeys
  auth/           login form behaviour, permission/role UI (mocked)
```

## Fixtures

`import { test, expect } from '../../fixtures/auth'` gives you:

| Fixture | What it is |
|---|---|
| `adminPage` | page signed in as the superuser |
| `managerPage` | page signed in as the manager of branch `E2EM` |
| `doctorApprovedPage` / `doctorPendingPage` / `doctorAppliedPage` | pages signed in as the seeded doctors |
| `adminApi` | REST helper for arranging state and asserting what the server stored |

`newAuthedPage(browser, email)` opens a page as any account — the journey specs
use it with a doctor they just created, so no test depends on another's
leftovers.

Prefer creating your own doctor over mutating a seeded one:

```ts
const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
const doctor = await adminApi.createDoctor({
  email: `doctor.mycase.${Date.now()}@e2e.test`,
  branchId: branch.id,
  approvalStatus: 'approved',
});
const { context, page } = await newAuthedPage(browser, doctor.email);
```

## The seeded data

Created by `backend/niqabaty/management/commands/seed_e2e_data.py`, wiped and
rebuilt at the start of every run. Password for every account: `Passw0rd!`.

| Account | Role |
|---|---|
| `admin@e2e.test` | superuser |
| `manager@e2e.test` | manages branch `E2EM`, in the Manager group |
| `doctor.approved@e2e.test` | approved, no membership |
| `doctor.pending@e2e.test` | awaiting admin approval |
| `doctor.applied@e2e.test` | approved, holds a pending application |
| `doctor.otherbranch@e2e.test` | in branch `E2EO` — invisible to the manager |

Membership types: `E2E Annual` (500 LYD / 12 months, any degree),
`E2E PhD Annual` (PhD only — must not be offered to a Bachelor doctor),
`E2E Student`.

Seed it by hand if you want to poke around:

```bash
cd backend
DJANGO_DB_NAME=/tmp/e2e.sqlite3 python3 manage.py migrate --noinput
DJANGO_DB_NAME=/tmp/e2e.sqlite3 python3 manage.py seed_e2e_data --reset
```

`--reset` refuses to run against `backend/db.sqlite3` unless you pass `--force`.

## Writing specs

- **Select by `data-testid`, not by text.** The app is bilingual AR/EN; the
  storage states pin `i18nextLng=en`, but copy changes shouldn't break tests.
  Add a testid to the component when you need a new hook.
- **Assert on the server too.** A green UI over a bad write is the failure mode
  mocked tests can't catch — use `adminApi` to check what was actually stored.
- **Specs run serially** (`workers: 1`) because they share one database.

### About the 1-minute access token

`SIMPLE_JWT.ACCESS_TOKEN_LIFETIME` is one minute, so a reused `storageState`
usually carries an expired token. That is fine and somewhat useful: it puts the
401 → `auth/token/refresh/` → retry interceptor in `frontend/src/api/client.ts`
under test on real traffic. The 7-day refresh token keeps the session alive.

## Backend tests

API-level coverage lives in `backend/niqabaty/tests/` — see the README there.
