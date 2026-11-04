# Niqabaty

Django backend serving a React (Vite) single-page app, deployed to cPanel shared
hosting behind Phusion Passenger.

- `frontend/` — React 18 + Vite + HeroUI SPA
- `backend/` — Django project (settings in `backend/backend/settings.py`)
- `mobile/` — Flutter app
- `scripts/` — deploy and i18n tooling

## Build

```bash
npm run dist
```

That chains four steps, and the order matters:

1. `build:frontend` — `tsc` typecheck, then `vite build` → `frontend/dist/`
2. `collect:static` — `manage.py collectstatic` → `backend/statics/`
3. `sync:template` — copies `backend/statics/index.html` → `backend/templates/index.html`
4. `dist-zip` — packages `backend/` into `dist.zip` at the repo root

Step 2 reads `frontend/dist` via `STATICFILES_DIRS`, so the frontend must be built
in the same working tree — the two halves cannot be built in isolation.

`dist.zip` deliberately excludes `.env`, `db.sqlite3*`, `media/` and `__pycache__`,
so unzipping it on the server cannot clobber production secrets, the live database,
or user uploads. Server-side `media/` is the source of truth and is never pushed
from a local machine.

## Deployment

Pushes to `main` build and deploy automatically via `.gitlab-ci.yml`. The `build`
job produces `dist.zip`; the `deploy` job `scp`s it to the server, unzips it over
the app directory, runs migrations, and touches `tmp/restart.txt` to restart
Passenger. Merge requests run `build` only.

`scripts/deploy.sh` remains available for local or emergency deploys. It reads
`.env.deploy` (untracked — copy `.env.deploy.example`) and streams `backend/` over
`tar | ssh` instead of using the zip.

### CI/CD variables

Set these under **Settings → CI/CD → Variables** in GitLab. Values match the
untracked `.env.deploy`; note that `.env.deploy.example` carries stale placeholders
and should not be trusted for the host or port.

| Key | Type | Value | Notes |
| --- | --- | --- | --- |
| `DEPLOY_HOST` | Variable | `naqabti.ly` | SSH host |
| `DEPLOY_USER` | Variable | `naqabtil` | cPanel account |
| `DEPLOY_PORT` | Variable | `6934` | non-standard SSH port |
| `DEPLOY_PATH` | Variable | `/home/naqabtil/naqabaty` | app root, **no trailing slash** |
| `REMOTE_PYTHON` | Variable | `/home/naqabtil/virtualenv/niqabaty/backend/3.11/bin/python` | server virtualenv interpreter |
| `SSH_PRIVATE_KEY` | **File** | contents of the deploy private key | |
| `SSH_KNOWN_HOSTS` | **File** | output of `ssh-keyscan -p 6934 naqabti.ly` | |

Both SSH entries must be **File** type, not Variable — masking mangles multi-line
values. The pipeline treats them as paths (`ssh-add "$SSH_PRIVATE_KEY"`), which only
works for File-type variables.

If you mark the variables **protected**, `main` must also be a protected branch;
otherwise the deploy job reads them as empty and fails at the `scp`.

The two spellings of the project name on the server are both correct and must not
be normalised: `naqabaty` in `DEPLOY_PATH`, `niqabaty` in the virtualenv path.

### Deploy key setup (one time)

```bash
ssh-keygen -t ed25519 -C "gitlab-ci@niqabaty" -f ~/.ssh/niqabaty_ci -N ""
ssh-copy-id -i ~/.ssh/niqabaty_ci.pub -p 6934 naqabtil@naqabti.ly
ssh-keyscan -p 6934 naqabti.ly > /tmp/niqabaty_known_hosts
```

Paste `~/.ssh/niqabaty_ci` into `SSH_PRIVATE_KEY` and `/tmp/niqabaty_known_hosts`
into `SSH_KNOWN_HOSTS`. If the host only accepts keys through cPanel's SSH Access
page, upload `niqabaty_ci.pub` there and click **Authorize**.

## Local development

```bash
# frontend
cd frontend && npm ci && npm run dev      # :5173, proxies /api → :8000

# backend
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate && python manage.py runserver
```

The frontend uses **npm**, not pnpm, and `frontend/package-lock.json` is committed —
use `npm ci` so peer resolution stays honest. All `@heroui/*` packages are pinned to
the exact versions bundled by `@heroui/react`; adding one with a caret range will
float it ahead of that set and break `npm ci` with an `ERESOLVE` peer conflict.
