# DealFlow Monorepo

This repository bundles the DealFlow React frontend, a Node.js API, reusable n8n workflows, and MySQL migrations. The project ships with a Docker Compose setup tested on Windows 11 Pro so you can run the full stack (database, API, n8n, and frontend) with a single command.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.0 or later
- At least 6 GB of free RAM while the stack is running

## Quick Start

1. **Configure environment variables**

   The repo includes a working `.env.docker`. Adjust the values if you need different ports or secrets:

   ```powershell
   Copy-Item .env.docker .env.local
   ```

   Then either set `COMPOSE_ENV_FILE=.env.local` or run `docker compose --env-file .env.local ...` to use your overrides. The default `.env.docker` is safe to use for local testing out of the box.

2. **(Optional) Configure source sync strategy**

   The Dockerfiles embed a `sync-source.sh` helper. By default we copy the local checkout (`APP_SOURCE_STRATEGY=local`) into each build so only this folder is required on the host. If you prefer the images to clone a remote Git repository, set `APP_SOURCE_STRATEGY=git` and specify `APP_GIT_REPO` / `APP_GIT_REF` in the build args before running Compose.

3. **Build and start everything**

   ```powershell
   docker compose --env-file .env.docker up --build
   ```

   Compose will:

   - Start MySQL 8.0, run `migrations/01_initial_schema.sql`, and expose it on `localhost:3307`.
   - Build the Node.js API service, install dependencies, compile TypeScript, and run it on `http://localhost:4000` with JWT + cookie auth, RBAC enforcement, and MySQL connectivity.
   - Build the Vite frontend (React + TypeScript) and run it on `http://localhost:5173` with hot reload.
   - Build n8n with the bundled workflows/functions and expose it on `http://localhost:5678` for AI-driven proposal generation via webhook.

4. **Log in**

   Once all services report healthy, open <http://localhost:5173> and authenticate with the seeded admin user:

   - **Email:** `admin@dealflow.com`
   - **Password:** `password`

## Services & Ports

| Service  | Host Port | Container Port | Notes |
|----------|-----------|----------------|-------|
| API      | 4000      | 4000           | Node.js backend providing auth, Organizations, RFx, and proposal webhook endpoints |
| Frontend | 5173      | 5173           | Vite dev server with hot reload |
| n8n      | 5678      | 5678           | Used for AI workflows; the API forwards proposal requests here |
| MySQL    | 3307      | 3306           | Change `DB_PORT_HOST` in `.env.docker` if 3307 is occupied |

All containers share the `dealflow` Docker network so you can reference them by hostname (`api`, `db`, `n8n`) from within the cluster.

## Environment Overview

Key variables defined in `.env.docker`:

- **Database:** `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`
- **API:** `API_PORT`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `CORS_ORIGIN`, `N8N_PROPOSAL_WEBHOOK_URL`
- **Frontend:** `VITE_API_URL` (defaults to `http://localhost:4000`)
- **n8n:** `N8N_HOST`, `N8N_WEBHOOK_URL`, `N8N_ENCRYPTION_KEY`

Update these as needed for your environment before running Compose.

## Source Synchronisation

During each image build the `sync-source.sh` helper copies the current repository into `/workspace` inside the container. This keeps the frontend, API, and n8n assets in sync even when you only distribute the Docker assets. The n8n container copies workflows from `/workspace/n8n/workflows` and helper functions from `/workspace/n8n/functions` into persistent volumes on every boot so you always run the Git-tracked versions.

## Useful Commands

- **Stop the stack:**
  ```powershell
  docker compose down
  ```
- **Rebuild after code changes:**
  ```powershell
  docker compose --env-file .env.docker up --build
  ```
- **Tail logs:**
  ```powershell
  docker compose logs -f api
  docker compose logs -f frontend
  docker compose logs -f n8n
  docker compose logs -f db
  ```

## Data Persistence

Named volumes keep state across restarts:

- `mysql_data` – MySQL data files
- `n8n_data` – n8n configuration, credentials, and runtime state
- `n8n_workflows` – Imported workflow definitions synced from Git/local source
- `n8n_extensions` – Custom function modules copied into the runtime

Remove them with `docker compose down -v` for a clean slate.

## Troubleshooting

- If the frontend reports auth failures, ensure the API container is healthy and that `VITE_API_URL` points to the API host/port accessible from the browser.
- For 401 errors in the browser console, verify cookies are set (the API issues httpOnly cookies on `*.dealflow.local` if you configure a domain).
- If proposal generation fails, confirm the API `N8N_PROPOSAL_WEBHOOK_URL` targets the running n8n webhook endpoint (the default uses the internal hostname `http://n8n:5678/...`).

## Next Steps

- Wire up CI to run `docker compose config` and the API unit tests once the pipeline is available.
- Add Playwright smoke tests against the composed environment.
- Replace static secrets in `.env.docker` with a secure secret store for non-local environments.
