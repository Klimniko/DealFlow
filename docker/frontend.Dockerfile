FROM node:20-alpine

USER root
RUN apk add --no-cache bash git

ARG APP_SOURCE_STRATEGY=local
ARG APP_GIT_REPO=
ARG APP_GIT_REF=main

ENV APP_SOURCE_ROOT=/workspace
WORKDIR ${APP_SOURCE_ROOT}

COPY docker/scripts/sync-source.sh /usr/local/bin/sync-source
RUN chmod +x /usr/local/bin/sync-source

COPY frontend /tmp/local/frontend

RUN sync-source frontend "$APP_SOURCE_STRATEGY" "$APP_GIT_REPO" "$APP_GIT_REF"

RUN rm -rf /tmp/local

RUN chown -R node:node ${APP_SOURCE_ROOT}

USER node

WORKDIR ${APP_SOURCE_ROOT}/frontend
RUN npm install

ENV VITE_API_URL=http://localhost:5678
ENV VITE_APP_ENV=docker

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
