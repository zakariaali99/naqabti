#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e
# Fail the pipeline (e.g. tar | ssh) if any stage fails, not just the last one
set -o pipefail

# Change directory to the repository root to ensure relative paths work
cd "$(dirname "$0")/.."

# Check if .env.deploy exists
if [ ! -f .env.deploy ]; then
  echo "Error: .env.deploy file not found!"
  echo "Please copy .env.deploy.example to .env.deploy and configure it with your remote server details:"
  echo "  cp .env.deploy.example .env.deploy"
  exit 1
fi

# Load deployment configurations
echo "Loading deployment configurations from .env.deploy..."
# Read file line by line, ignoring comments and empty lines
while IFS= read -r line || [ -n "$line" ]; do
  # Strip leading/trailing whitespace
  line=$(echo "$line" | xargs)
  # Skip comments and empty lines
  [[ "$line" =~ ^#.*$ ]] && continue
  [[ -z "$line" ]] && continue
  # Export the variable
  export "$line"
done < .env.deploy

# Ensure required configurations are present
if [ -z "$DEPLOY_HOST" ]; then
  echo "Error: DEPLOY_HOST is not set in .env.deploy"
  exit 1
fi

if [ -z "$DEPLOY_USER" ]; then
  echo "Error: DEPLOY_USER is not set in .env.deploy"
  exit 1
fi

if [ -z "$DEPLOY_PATH" ]; then
  echo "Error: DEPLOY_PATH is not set in .env.deploy"
  exit 1
fi

# Use default SSH port 22 if not set
DEPLOY_PORT="${DEPLOY_PORT:-22}"

echo "-----------------------------------------"
echo "Executing build:prod..."
echo "-----------------------------------------"
npm run build:prod

echo "-----------------------------------------"
echo "Deploying backend using tar over ssh (shared hosting has no rsync)..."
echo "-----------------------------------------"
echo "Target server: ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH} (SSH Port: ${DEPLOY_PORT})"
echo "-----------------------------------------"

# tar has no --delete equivalent, so wipe the remote statics dir first —
# it's pure collectstatic build output, safe to clear, and doing so keeps
# stale hashed JS/CSS bundles from a prior build from piling up remotely.
ssh -p ${DEPLOY_PORT} "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${DEPLOY_PATH} && rm -rf ${DEPLOY_PATH}/statics"

# Stream backend/ as a tar archive over ssh and extract it remotely.
# Exclude list mirrors the previous rsync excludes:
# - .env: Do NOT overwrite the production environment settings with local env settings
# - node_modules, __pycache__, *.pyc/.pyo/.pyd: local/build cruft not needed on the server
# - .git, .github: Git repository data
# - .DS_Store: macOS metadata files
tar czf - -C backend \
  --exclude=".env" \
  --exclude="node_modules" \
  --exclude="__pycache__" \
  --exclude="*.pyc" \
  --exclude="*.pyo" \
  --exclude="*.pyd" \
  --exclude=".git" \
  --exclude=".github" \
  --exclude=".DS_Store" \
  . | ssh -p ${DEPLOY_PORT} "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${DEPLOY_PATH} && tar xzf - -C ${DEPLOY_PATH}"

echo "-----------------------------------------"
echo "Running migrations and collecting static files..."
echo "-----------------------------------------"
ssh -p ${DEPLOY_PORT} "${DEPLOY_USER}@${DEPLOY_HOST}" "
  source ${DEPLOY_PATH}/../.env 2>/dev/null || true
  cd ${DEPLOY_PATH}
  /home/naqabtil/virtualenv/niqabaty/backend/3.11/bin/python manage.py migrate --noinput
  /home/naqabtil/virtualenv/niqabaty/backend/3.11/bin/python manage.py collectstatic --noinput
"

echo "-----------------------------------------"
echo "Restarting Django app (Passenger)..."
echo "-----------------------------------------"
ssh -p ${DEPLOY_PORT} "${DEPLOY_USER}@${DEPLOY_HOST}" "
  mkdir -p ${DEPLOY_PATH}/tmp
  touch ${DEPLOY_PATH}/tmp/restart.txt
"

echo "-----------------------------------------"
echo "Deployment completed successfully!"
echo "-----------------------------------------"
