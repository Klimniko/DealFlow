# syntax=docker/dockerfile:1.4
FROM n8nio/n8n:1.45.1

USER root
RUN apk add --no-cache bash git

ARG APP_SOURCE_STRATEGY=local
ARG APP_GIT_REPO=
ARG APP_GIT_REF=main

ENV APP_SOURCE_ROOT=/workspace
WORKDIR ${APP_SOURCE_ROOT}

# Copy the sync-source script (create fallback if missing)
COPY docker/scripts/sync-source.sh /usr/local/bin/sync-source
RUN if [ ! -f /usr/local/bin/sync-source ]; then \
      echo '#!/bin/bash' > /usr/local/bin/sync-source && \
      echo 'echo "[sync-source] Using local build context"' >> /usr/local/bin/sync-source && \
      echo 'exit 0' >> /usr/local/bin/sync-source; \
    fi && \
    chmod +x /usr/local/bin/sync-source

# Copy your n8n source locally
COPY n8n /workspace/n8n

# Make sure folders exist and are writable
RUN mkdir -p /data/workflows /home/node/.n8n/custom \
  && chown -R node:node /data /home/node/.n8n /workspace

USER node
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
