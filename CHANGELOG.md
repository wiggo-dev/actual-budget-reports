# Changelog

## 0.2.6

### Patch Changes

- f88ce71: Toggle spending donut categories from the legend; snappier animation and tighter legend layout

## 0.2.5

### Patch Changes

- a0a4b3e: Fix preset save on non-HTTPS hosts (crypto.randomUUID secure-context)

## 0.2.4

### Patch Changes

- 8d1ba88: Publish and track a :release floating image tag in GHCR compose

## 0.2.3

### Patch Changes

- 070b874: Fix Docker /data volume permissions so presets save; restore favicon.ico; surface settings save errors

## 0.2.2

### Patch Changes

- Custom favicon (non-Vercel) and CI typegen before typecheck

## 0.2.1

### Fixes

- CI lint failures from `react-hooks/set-state-in-effect` in reports provider
- Publish multi-arch Docker images (`linux/amd64` and `linux/arm64`)

## 0.2.0

### Minor Changes

- Rename and update existing account presets; dual timeframes, shareable URL state, and spending trend chart

## 0.1.1

### Fixes

- Docker image builds on Node 22 (pnpm 11 requirement)
- Install native build tools during image dependency install for `better-sqlite3`

## 0.1.0

### Features

- Next.js dashboard with shadcn/ui charts backed by Actual Budget
- Reports: net worth, balances, spending, income vs expenses, budget vs actual, cash flow
- Account exclude-lists, named presets, on/off-budget grouping
- Timeframe filter (3 / 6 / 12 / 24 months / all time)
- Docker image + Compose; GHCR publish on GitHub Release
- Conventional commits (commitlint) and Changesets
