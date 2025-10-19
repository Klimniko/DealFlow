FROM n8nio/n8n:1.45.1

USER root
RUN apk add --no-cache bash git

ARG APP_SOURCE_STRATEGY=local
ARG APP_GIT_REPO=
ARG APP_GIT_REF=main

ENV APP_SOURCE_ROOT=/workspace
WORKDIR ${APP_SOURCE_ROOT}

COPY docker/scripts/sync-source.sh /usr/local/bin/sync-source
RUN chmod +x /usr/local/bin/sync-source

COPY n8n /tmp/local/n8n

RUN sync-source n8n "$APP_SOURCE_STRATEGY" "$APP_GIT_REPO" "$APP_GIT_REF"

RUN rm -rf /tmp/local

RUN mkdir -p /data/workflows /home/node/.n8n/custom \
  && chown -R node:node /data /home/node/.n8n

USER node
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
