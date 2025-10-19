# syntax=docker/dockerfile:1.4
FROM node:20-alpine

USER root
RUN apk add --no-cache bash git

ARG APP_SOURCE_STRATEGY=git
ARG APP_GIT_REPO=
ARG APP_GIT_REF=main

ENV APP_SOURCE_ROOT=/workspace
WORKDIR ${APP_SOURCE_ROOT}

RUN --mount=type=bind,source=docker/scripts/sync-source.sh,target=/tmp/sync-source.sh,ro,optional <<'EOF'
set -euo pipefail
if [ -f /tmp/sync-source.sh ]; then
  install -m 755 /tmp/sync-source.sh /usr/local/bin/sync-source
else
  cat <<'SCRIPT' >/usr/local/bin/sync-source
#!/bin/bash
set -euo pipefail

TARGET_DIR_NAME="${1:-}"
STRATEGY="${2:-local}"
REPO_URL="${3:-}"
GIT_REF="${4:-main}"

if [ -z "$TARGET_DIR_NAME" ]; then
  echo "Target directory name is required" >&2
  exit 1
fi

APP_SOURCE_ROOT="${APP_SOURCE_ROOT:-/workspace}"
LOCAL_ROOT="${LOCAL_SOURCE_ROOT:-/tmp/local}"
GIT_ROOT="${GIT_SOURCE_ROOT:-/tmp/git-src}"

mkdir -p "${APP_SOURCE_ROOT}/${TARGET_DIR_NAME}"

cleanup() {
  rm -rf "$GIT_ROOT" 2>/dev/null || true
  rm -rf "$LOCAL_ROOT/${TARGET_DIR_NAME}" 2>/dev/null || true
}
trap cleanup EXIT

case "$STRATEGY" in
  git)
    if [ -z "$REPO_URL" ]; then
      echo "APP_GIT_REPO must be provided when APP_SOURCE_STRATEGY=git" >&2
      exit 1
    fi
    echo "[sync-source] Cloning ${REPO_URL} (${GIT_REF})"
    rm -rf "$GIT_ROOT"
    git clone --depth 1 --branch "$GIT_REF" "$REPO_URL" "$GIT_ROOT"
    if [ ! -d "$GIT_ROOT/${TARGET_DIR_NAME}" ]; then
      echo "Repository does not contain directory ${TARGET_DIR_NAME}" >&2
      exit 1
    fi
    rm -rf "${APP_SOURCE_ROOT:?}/${TARGET_DIR_NAME}"/* 2>/dev/null || true
    cp -a "$GIT_ROOT/${TARGET_DIR_NAME}/." "${APP_SOURCE_ROOT}/${TARGET_DIR_NAME}/"
    ;;
  local)
    if [ ! -d "$LOCAL_ROOT/${TARGET_DIR_NAME}" ]; then
      echo "Local fallback directory ${LOCAL_ROOT}/${TARGET_DIR_NAME} not found" >&2
      exit 1
    fi
    echo "[sync-source] Using local build context for ${TARGET_DIR_NAME}"
    rm -rf "${APP_SOURCE_ROOT:?}/${TARGET_DIR_NAME}"/* 2>/dev/null || true
    cp -a "$LOCAL_ROOT/${TARGET_DIR_NAME}/." "${APP_SOURCE_ROOT}/${TARGET_DIR_NAME}/"
    ;;
  *)
    echo "Unknown APP_SOURCE_STRATEGY '${STRATEGY}'. Supported: git, local" >&2
    exit 1
    ;;
esac
SCRIPT
  chmod +x /usr/local/bin/sync-source
fi
EOF

RUN mkdir -p /tmp/local/frontend
RUN --mount=type=bind,source=frontend,target=/tmp/local/frontend,ro,optional \
    sync-source frontend "$APP_SOURCE_STRATEGY" "$APP_GIT_REPO" "$APP_GIT_REF"

RUN chown -R node:node ${APP_SOURCE_ROOT}

USER node

WORKDIR ${APP_SOURCE_ROOT}/frontend
RUN npm install

ENV VITE_API_URL=http://localhost:5678
ENV VITE_APP_ENV=docker

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
