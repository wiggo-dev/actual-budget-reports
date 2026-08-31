# Actual Budget Reports

Self-hosted finance reporting for [Actual Budget](https://actualbudget.org). Charts and reports with account filtering, powered by `@actual-app/api`.

**Image:** `ghcr.io/wiggo-dev/actual-budget-reports`

## Features

- Net worth over time
- Account balances (on-budget / off-budget)
- Spending by category
- Income vs expenses
- Budget vs actual
- Cash flow
- Account exclude-lists and named presets
- Timeframe filter (3 / 6 / 12 / 24 months / all time)

Homelab-friendly: no in-app login. Put a reverse proxy in front if you expose it beyond your LAN.

## Install (Docker / GHCR)

### Prerequisites

- Docker with Compose
- An [Actual Budget](https://actualbudget.org/docs/install/) sync server you can reach from the reports container
- Your budget **Sync ID** (Actual → Settings → Advanced → Sync ID)
- Your Actual **server password**
- Optional: E2E encryption password, if enabled on the budget

### 1. Create a directory and env file

```bash
mkdir actual-budget-reports && cd actual-budget-reports
```

Create a `.env` file:

```bash
ACTUAL_SERVER_URL=http://actual-server:5006
ACTUAL_SERVER_PASSWORD=your-server-password
ACTUAL_SYNC_ID=your-sync-id
ACTUAL_E2E_PASSWORD=
```

| Variable                 | Notes                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACTUAL_SERVER_URL`      | URL of Actual from **inside Docker**. Use `http://actual-server:5006` if Actual is on the same Compose network, or `http://host.docker.internal:5006` / your LAN IP if Actual runs elsewhere. |
| `ACTUAL_SERVER_PASSWORD` | Password for actual-server                                                                                                                                                                    |
| `ACTUAL_SYNC_ID`         | Settings → Advanced → Sync ID                                                                                                                                                                 |
| `ACTUAL_E2E_PASSWORD`    | Only if end-to-end encryption is on; otherwise leave empty                                                                                                                                    |

### 2a. Reports only (you already run Actual)

```bash
curl -fsSL -o docker-compose.yml \
  https://raw.githubusercontent.com/wiggo-dev/actual-budget-reports/main/docker-compose.ghcr.yml

docker compose up -d
```

Open http://localhost:3000

### 2b. Full stack (Actual + reports)

```bash
curl -fsSL -o docker-compose.yml \
  https://raw.githubusercontent.com/wiggo-dev/actual-budget-reports/main/docker-compose.yml
curl -fsSL -o .env.example \
  https://raw.githubusercontent.com/wiggo-dev/actual-budget-reports/main/.env.example

cp .env.example .env
# edit .env — set ACTUAL_SERVER_PASSWORD and ACTUAL_SYNC_ID
# (ACTUAL_SERVER_URL is already set for the compose network)

docker compose up -d --build
```

1. Open Actual at http://localhost:5006 and create / import your budget if needed
2. Copy the Sync ID into `.env` and restart: `docker compose up -d`
3. Open reports at http://localhost:3000

### Image tags

`docker-compose.ghcr.yml` tracks `:release` (latest non-prerelease). After a new GitHub Release:

```bash
docker compose pull && docker compose up -d
```

Floating tags do not update a running container by themselves — you still need to pull.

To pin a reproducible deploy instead:

```yaml
image: ghcr.io/wiggo-dev/actual-budget-reports:0.2.3
```

Published images are multi-arch (`linux/amd64` and `linux/arm64`).

### Reverse proxy

Expose only the reports app (port 3000) behind Traefik, Caddy, nginx, Authelia, etc. Do not expose Actual credentials to the browser — they stay in container env.

## Local development

Requires **Node 22+** and **pnpm**.

```bash
git clone https://github.com/wiggo-dev/actual-budget-reports.git
cd actual-budget-reports
pnpm install
pnpm approve-builds better-sqlite3   # first time only (native SQLite)

cp .env.example .env
# edit .env:
#   ACTUAL_SERVER_URL=http://localhost:5006
#   ACTUAL_SERVER_PASSWORD=...
#   ACTUAL_SYNC_ID=...

pnpm dev
```

Open http://localhost:3000

Local cache and settings live under `.data/` (gitignored). Docker uses `/data` inside the container.

### Useful scripts

| Command                     | Purpose          |
| --------------------------- | ---------------- |
| `pnpm dev`                  | Dev server       |
| `pnpm build` / `pnpm start` | Production build |
| `pnpm typecheck`            | TypeScript       |
| `pnpm lint`                 | ESLint           |

## Environment variables

| Variable                 | Default (local)       | Description                         |
| ------------------------ | --------------------- | ----------------------------------- |
| `ACTUAL_SERVER_URL`      | —                     | Actual sync server URL              |
| `ACTUAL_SERVER_PASSWORD` | —                     | Server login password               |
| `ACTUAL_SYNC_ID`         | —                     | Budget sync ID                      |
| `ACTUAL_E2E_PASSWORD`    | —                     | E2E decrypt password (optional)     |
| `ACTUAL_DATA_DIR`        | `.data/actual-cache`  | Local budget cache                  |
| `SETTINGS_PATH`          | `.data/settings.json` | Presets and account filters         |
| `SYNC_INTERVAL_MS`       | `300000`              | Min ms between Actual syncs (5 min) |
| `PORT`                   | `3000`                | HTTP port                           |

Docker Compose sets `ACTUAL_DATA_DIR` / `SETTINGS_PATH` to `/data/...` automatically.

## Releases & GHCR

Images publish to GHCR when a **GitHub Release** is published:

```
ghcr.io/wiggo-dev/actual-budget-reports:X.Y.Z
ghcr.io/wiggo-dev/actual-budget-reports:release   # latest non-prerelease
ghcr.io/wiggo-dev/actual-budget-reports:latest    # same as :release
```

Versioning uses Conventional Commits + Changesets:

```bash
pnpm changeset          # record a bump
pnpm changeset version  # apply bump + changelog
git push && git push --tags
# then publish a GitHub Release from the tag
```

## License

Private / as configured on the repository.
