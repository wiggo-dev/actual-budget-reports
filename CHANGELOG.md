# Changelog

## 1.5.4

### Patch Changes

- c58903c: Bump @actual-app/api to 26.9.0 to match Actual server 26.9.x.

## 1.5.3

### Patch Changes

- 249192a: Fix Docker health check by resolving the Actual API version from process.cwd() instead of import.meta.url in the standalone bundle.

## 1.5.2

### Patch Changes

- b063be9: Fix Docker health check by resolving the Actual API version from the standalone bundle layout.

## 1.5.1

### Patch Changes

- a65bba8: Fix theme hydration after 1.5.0 by reading cached preferences with useSyncExternalStore.

## 1.5.0

### Minor Changes

- fc70bd5: Add light, dark, and system theme modes with persisted preferences and dashboard dark styling.

## 1.4.0

### Minor Changes

- 89154c8: Add an upcoming scheduled transactions overview card and let users show or hide overview modules with persisted preferences.

## 1.3.0

### Minor Changes

- 4f6812e: Add category-group spending aggregation with expand-to-category drill-down, and collapse the overview accounts tile by default.
- 4f6812e: Add year-over-year comparison for net worth, cash flow, and spending trends, plus a stacked on/off-budget composition view for net worth.

### Patch Changes

- 7e6f4d5: Remove the `/prototype` mock dashboard variants now that the bento overview with sidebar is the live UI.

## 1.2.0

### Minor Changes

- 10b54d4: Add category and category-group exclude filters for spending reports, with preset persistence and clearer unsaved-preset UI. Keep chart size stable while report data refreshes in the background.

## 1.1.0

### Minor Changes

- 620dfe3: Add custom date ranges for trend and spending report scopes, with URL round-trip and validation in the sidebar.

## 1.0.3

### Patch Changes

- Add CSV export for report views, privacy mode to blur sensitive values, and move refresh/privacy controls to the main toolbar.

## 1.0.2

### Patch Changes

- 99e0142: Fix health endpoint failing under Next.js by reading the Actual API version from a server-only module instead of requiring `@actual-app/api/package.json`.

## 1.0.1

### Patch Changes

- 31ae076: Extend the health endpoint with sync metadata and API/server version compatibility, and add unit tests for timeframe, filter, and spending helpers.
- 31ae076: Add mobile navigation drawer and responsive dashboard layout.
- 0bbaf85: Show last sync time in the sidebar with stale and error states, and add a sync status API.

## 1.0.0

### Major Changes

- 8bb14e7: Complete v1 reporting: transfer-aware cash flow and income, budget vs actual filters, payee spending with transaction drill-down, overview savings rate, and Vitest coverage in CI.

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
