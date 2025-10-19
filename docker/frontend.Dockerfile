# syntax=docker/dockerfile:1.4
FROM node:20-alpine

USER root
RUN apk add --no-cache bash git

ARG APP_SOURCE_STRATEGY=local
ARG APP_GIT_REPO=
ARG APP_GIT_REF=main

ENV APP_SOURCE_ROOT=/workspace
WORKDIR ${APP_SOURCE_ROOT}

# Always ensure sync-source script exists and is executable
COPY docker/scripts/sync-source.sh /usr/local/bin/sync-source
RUN chmod +x /usr/local/bin/sync-source || \
    (echo '#!/bin/bash' > /usr/local/bin/sync-source && \
     echo 'echo "[sync-source] Using local build context"' >> /usr/local/bin/sync-source && \
     echo 'exit 0' >> /usr/local/bin/sync-source && \
     chmod +x /usr/local/bin/sync-source)

# Copy frontend files directly instead of using mount
COPY frontend /workspace/frontend

WORKDIR /workspace/frontend

RUN npm install && npm run build

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
