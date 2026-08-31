# Changelog

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
