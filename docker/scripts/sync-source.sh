#!/bin/bash
set -euo pipefail

TARGET_DIR_NAME="$1"
STRATEGY="${2:-local}"
REPO_URL="${3:-}"
GIT_REF="${4:-main}"

APP_SOURCE_ROOT="${APP_SOURCE_ROOT:-/workspace}"
LOCAL_ROOT="/tmp/local"
GIT_ROOT="/tmp/git-src"

if [ -z "$TARGET_DIR_NAME" ]; then
  echo "Target directory name is required" >&2
  exit 1
fi

mkdir -p "${APP_SOURCE_ROOT}/${TARGET_DIR_NAME}"

if [ "$STRATEGY" = "git" ]; then
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
  rm -rf "${APP_SOURCE_ROOT:?}/${TARGET_DIR_NAME}"/*
  cp -a "$GIT_ROOT/${TARGET_DIR_NAME}/." "${APP_SOURCE_ROOT}/${TARGET_DIR_NAME}/"
  rm -rf "$GIT_ROOT"
else
  if [ ! -d "$LOCAL_ROOT/${TARGET_DIR_NAME}" ]; then
    echo "Local fallback directory ${LOCAL_ROOT}/${TARGET_DIR_NAME} not found" >&2
    exit 1
  fi
  echo "[sync-source] Using local build context for ${TARGET_DIR_NAME}"
  rm -rf "${APP_SOURCE_ROOT:?}/${TARGET_DIR_NAME}"/*
  cp -a "$LOCAL_ROOT/${TARGET_DIR_NAME}/." "${APP_SOURCE_ROOT}/${TARGET_DIR_NAME}/"
fi

rm -rf "$LOCAL_ROOT/${TARGET_DIR_NAME}" 2>/dev/null || true

