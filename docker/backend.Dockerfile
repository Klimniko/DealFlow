# syntax=docker/dockerfile:1.4
FROM node:20-alpine

USER root
RUN apk add --no-cache bash git

ARG APP_SOURCE_STRATEGY=local
ARG APP_GIT_REPO=
ARG APP_GIT_REF=main

ENV APP_SOURCE_ROOT=/workspace
WORKDIR ${APP_SOURCE_ROOT}

COPY docker/scripts/sync-source.sh /usr/local/bin/sync-source
RUN chmod +x /usr/local/bin/sync-source || \
    (echo '#!/bin/bash' > /usr/local/bin/sync-source && \
     echo 'echo "[sync-source] Using local build context"' >> /usr/local/bin/sync-source && \
     echo 'exit 0' >> /usr/local/bin/sync-source && \
     chmod +x /usr/local/bin/sync-source)

COPY tsconfig.base.json ./
COPY backend/package.json backend/package.json
WORKDIR /workspace/backend
RUN npm install

COPY backend /workspace/backend
RUN npm run build && npm prune --omit=dev

EXPOSE 4000
CMD ["node", "dist/index.js"]
