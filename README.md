# DealFlow Monorepo

This repository contains the DealFlow frontend (React), n8n workflows, and MySQL schema migrations. The project now ships with a Docker Compose setup so you can run the entire stack locally with a single command on Windows, macOS, or Linux.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.0 or later (tested on Windows 11 Pro)
- At least 6 GB of free RAM while the stack is running

## Quick Start

1. **Configure environment variables**

   Copy `.env.docker` (already tracked) to a personal override if you need to change any secrets or ports:

   ```powershell
   Copy-Item .env.docker .env.local
   ```

   Update the values in `.env.local` and then point Docker Compose at it by setting `COMPOSE_ENV_FILE=.env.local` or passing `--env-file`. The defaults work out of the box for local testing.

2. **(Optional) Configure automatic source sync**

   By default Docker Compose downloads the repository declared by `APP_BUILD_CONTEXT` and hands it to both image builds. The
   Dockerfiles themselves will then clone that same repository (using `APP_GIT_REPO`/`APP_GIT_REF`) into the container images so
   n8n and the frontend have consistent sources. Update the URLs in `.env.docker` with your actual Git remote. If you prefer to
   build from an existing checkout on your machine, change `APP_BUILD_CONTEXT=.` and set `APP_SOURCE_STRATEGY=local` before
   running `docker compose`.

3. **Build and start the stack**

   ```powershell
   docker compose --env-file .env.docker up --build
   ```

   The command will:

   - Launch MySQL 8.0 and run `migrations/01_initial_schema.sql` automatically.
   - Clone the DealFlow repository (when `APP_SOURCE_STRATEGY=git`), then build an n8n image with the required custom libraries (`jsonwebtoken`, `mysql2`), import all workflows on boot, and start the n8n server on <http://localhost:5678>.
   - Clone the DealFlow repository (when `APP_SOURCE_STRATEGY=git`), install frontend dependencies, and start the Vite dev server on <http://localhost:5173> with hot reloading enabled.

3. **Log in**

   After the containers are healthy, open <http://localhost:5173>. Use the seeded admin account:

   - **Email:** `admin@dealflow.com`
   - **Password:** `password` (change via n8n once user management workflow is connected)

## Services & Ports

| Service   | Host Port | Container Port | Notes |
|-----------|-----------|----------------|-------|
| Frontend  | 5173      | 5173           | Vite dev server with hot reload |
| n8n       | 5678      | 5678           | REST API & workflow UI |
| MySQL     | 3307      | 3306           | Change `DB_PORT_HOST` in `.env.docker` if 3307 is in use |

All services share the `dealflow` Docker network so you can use container hostnames (`db`, `n8n`) in code and workflows.

## Source Synchronisation

During the image build phase the `sync-source.sh` helper either copies the local repository into the image (strategy `local`) or
clones the remote Git repository/branch specified in `.env.docker` (strategy `git`). The helper script is baked into each image
so even a minimal host checkout that only contains `docker-compose.yml` can bootstrap successfully. The synced contents are
staged in `/workspace`, giving both the frontend build and the n8n bootstrap command a consistent source tree inside the
containers.

Custom n8n helpers from `n8n/functions` and workflows from `n8n/workflows` are copied into the persistent volumes on every
container start before the n8n process runs. This keeps the imported workflows up to date with the Git source.

## Useful Commands

- **Stop the stack:**
  ```powershell
  docker compose down
  ```
- **Rebuild after code changes:**
  ```powershell
  docker compose --env-file .env.docker up --build
  ```
- **Inspect container logs:**
  ```powershell
  docker compose logs -f frontend
  docker compose logs -f n8n
  docker compose logs -f db
  ```

## Data Persistence

Four named volumes keep your data between restarts:

- `mysql_data` – MySQL data files
- `n8n_data` – n8n configuration, credentials, and runtime state
- `n8n_workflows` – Imported workflow definitions synced from Git/local source
- `n8n_extensions` – Custom function modules copied into the runtime

Remove the volumes with `docker compose down -v` if you want a clean slate.

## Troubleshooting

- If the frontend cannot reach n8n, ensure the `VITE_API_URL` in your env file points to `http://n8n:5678` **inside Docker** or `http://localhost:5678` when accessed from the host.
- The workflows are re-imported on each container start with `--overwrite`, so edits made through the n8n UI will persist in the mounted volume (`n8n_data`) but remember to export them back into `n8n/workflows` for version control.

## Next Steps

- Wire up CI to run `docker compose config` to verify future changes.
- Add Playwright smoke tests that run against the composed environment.
- Parameterize secrets through a secure secret store once deploying beyond local development.

