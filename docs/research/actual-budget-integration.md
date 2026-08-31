# Actual Budget integration for Node.js / Next.js

Research date: 2026-08-31. Primary sources only.

## 1. Official API packages

| Package                                                            | Status                      | Notes                                                                    |
| ------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------ |
| [`@actual-app/api`](https://www.npmjs.com/package/@actual-app/api) | **Official** (Node.js only) | Current: v26.8.1. Requires Node ≥20. Depends on native `better-sqlite3`. |
| `@actualbudget/api`                                                | **Does not exist**          | Common misnomer.                                                         |

**Sources:**

- [Using the API](https://actualbudget.org/docs/api/)
- [packages/api on GitHub](https://github.com/actualbudget/actual/tree/master/packages/api)
- [package.json (engines, deps)](https://github.com/actualbudget/actual/blob/master/packages/api/package.json)

**Important:** Actual does **not** expose HTTP/REST endpoints. The npm package runs the full budget engine locally (headless UI). There is an **experimental** browser build (WASM SQLite + Web Worker) with the same method surface, but it requires cross-origin isolation headers (`COOP: same-origin`, `COEP: require-corp`) and HTTPS. See [Using the API → Browser](https://actualbudget.org/docs/api/).

## 2. How to connect

Actual is **local-first**: the sync server stores opaque budget blobs; all querying/mutation runs in the client (Node API or browser).

### Remote server (typical for multi-device / hosted)

```js
await api.init({
  dataDir: "/path/to/cache", // local SQLite cache (required for persistence)
  serverURL: "http://localhost:5006",
  password: "<server-login-password>",
});
await api.downloadBudget("<sync-id>", { password: "<e2e-password>" }); // e2e only if enabled
```

- **Sync ID:** Settings → Advanced → Sync ID.
- **E2E password:** separate from server password; pass to `downloadBudget` when encryption is on.
- **`sync()`:** push/pull changes after mutations.
- **`shutdown()`:** close budget and release resources — call before process exit.
- **Version alignment:** match `@actual-app/api` major/minor to `actual-server` version to avoid migration errors (`out-of-sync-migrations` error code).

**Sources:** [Using the API](https://actualbudget.org/docs/api/), [Syncing Across Devices](https://actualbudget.org/docs/getting-started/sync/)

### Local-only (no network)

```js
await api.init({ dataDir: "/path/to/cache" }); // omit serverURL
await api.loadBudget({ syncId: "<local-budget-id>" });
```

If `serverURL` is omitted, only locally cached budgets are accessible.

### File import/export

- `importBudget(input, { type: 'actual' | 'ynab4' | 'ynab5' })` — import `.zip` export or YNAB.
- `exportBudget()` — export current budget as `.zip` bytes.
- `runImport(name, fn)` — bulk create new budget (importers).

**Source:** [API Reference → Misc](https://actualbudget.org/docs/api/reference)

## 3. Available data

Full method list: [API Reference](https://actualbudget.org/docs/api/reference).

| Domain                                    | Key methods                                                                                                                 | Notes                                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Accounts**                              | `getAccounts`, `getAccountBalance(id, cutoff?)`, CRUD                                                                       | `Account` has `offbudget`, `balance_current` (bank sync). Balance as of date via `getAccountBalance` or ActualQL. |
| **Transactions**                          | `getTransactions(accountId, start, end)`, `addTransactions`, `importTransactions`, `updateTransaction`, `deleteTransaction` | Amounts are integers (e.g. cents). Split transactions supported.                                                  |
| **Categories / groups**                   | `getCategories`, `getCategoryGroups`, CRUD                                                                                  | Envelope budget fields via `getBudgetMonth`.                                                                      |
| **Budget (envelope)**                     | `getBudgetMonth`, `getBudgetMonths`, `setBudgetAmount`, carryover/hold helpers                                              | Monthly category budgeted/spent/balance.                                                                          |
| **Payees, tags, rules, schedules, notes** | Full CRUD                                                                                                                   | Automation/scheduling data available.                                                                             |
| **Bank sync**                             | `runBankSync({ accountId })`                                                                                                | GoCardless, SimpleFIN, Pluggy — server-side tokens.                                                               |
| **Ad-hoc queries**                        | `runQuery(q(...))` via **ActualQL**                                                                                         | Same query engine as the UI. [ActualQL overview](https://actualbudget.org/docs/api/actual-ql/).                   |
| **Preferences**                           | `getPreferences()`                                                                                                          | Currency, date format, etc.                                                                                       |

### Net worth over time

**No dedicated API.** Compute from transaction sums:

```js
const { q, runQuery } = require("@actual-app/api");
// All accounts, balance as of a date
const { data } = await runQuery(
  q("transactions")
    .filter({ date: { $lte: "2024-03-31" } })
    .groupBy("account.id")
    .select(["account.id", "account.name", { balance: { $sum: "$amount" } }])
);
```

Or per-account: `getAccountBalance(id, cutoffDate)`. For net-worth time series, run ActualQL (or `getAccountBalance`) at multiple cutoffs. Filter `offbudget` accounts as needed. Use `splits: 'inline'` (default) when summing to avoid double-counting split parents.

**Sources:** [ActualQL](https://actualbudget.org/docs/api/actual-ql/), [GitHub #2189 / getAccountBalance](https://github.com/actualbudget/actual/issues/2189)

## 4. Deployment considerations

### Actual Server (sync hub)

Official Docker images:

- [`actualbudget/actual-server`](https://hub.docker.com/r/actualbudget/actual-server) / `ghcr.io/actualbudget/actual-server`
- Default port **5006**; persist `/data` volume (`server-files/`, `user-files/`).

```bash
docker run -d -p 5006:5006 -v /path/to/data:/data actualbudget/actual-server:latest
```

**Source:** [Docker install docs](https://actualbudget.org/docs/install/docker), [Server config](https://actualbudget.org/docs/config/)

### Node.js / Next.js app consuming `@actual-app/api`

| Concern                    | Recommendation                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Where API runs**         | Server-side only (Next.js Route Handlers, separate Node service). Never expose server password or E2E key to the browser.                                                                                    |
| **Persistent cache**       | Mount `dataDir` volume; budget SQLite lives here between restarts.                                                                                                                                           |
| **Native module**          | `better-sqlite3` — use glibc base image (`node:20`, not `-alpine`) or ensure build tools for Alpine.                                                                                                         |
| **Version lock**           | Pin `@actual-app/api@<server-version>`.                                                                                                                                                                      |
| **Concurrent access**      | Avoid multiple processes opening the same budget simultaneously; community gateways (below) enforce single connection.                                                                                       |
| **No official REST layer** | Wrap SDK yourself, or use third-party HTTP gateways (unofficial): [actual-http-api](https://github.com/jhonderson/actual-http-api), [actual-budget-agent](https://github.com/mwdavisii/actual-budget-agent). |

### Browser-in-Next.js (experimental)

Possible via `@actual-app/api` browser entry, but requires COOP/COEP on every page and still needs user credentials in-browser — generally unsuitable for a trusted backend pattern.

## 5. Authentication & security model

Two independent secrets:

| Secret                      | Purpose                        | Where used                                 |
| --------------------------- | ------------------------------ | ------------------------------------------ |
| **Server password**         | Authenticate to sync server    | `api.init({ password })`                   |
| **E2E encryption password** | Decrypt budget blob (optional) | `api.downloadBudget(syncId, { password })` |

**Server-side storage (sync server):**

- `account.sqlite` — hashed server password, budget file list, session tokens ([config docs](https://actualbudget.org/docs/config/)).
- `user-files/` — budget blobs (encrypted if E2E enabled).

**Server login methods** (`ACTUAL_LOGIN_METHOD`): `password` (default), `header` (`x-actual-password`, trusted proxies only), `openid` (preview). Restrict via `ACTUAL_ALLOWED_LOGIN_METHODS`.

**E2E encryption:** budget data encrypted client-side before upload; server cannot read it. Bank sync tokens are **not** covered by E2E — stored separately on server ([sync docs](https://actualbudget.org/docs/getting-started/sync/), [settings](https://actualbudget.org/docs/settings/)).

**API error codes** (machine-readable): `invalid-password`, `token-expired`, `unauthorized`, `budget-not-found`, `missing-key`, `decrypt-failure`, etc. ([Using the API → Errors](https://actualbudget.org/docs/api/))

**Architecture implication for Next.js:** treat Actual credentials as secrets in env/secrets manager; proxy read/write through your own authenticated API with its own auth (session/JWT), not Actual's password.

## Recommended architecture (summary)

```
[Browser] → [Next.js API routes / Node service] → [@actual-app/api + dataDir volume]
                                                      ↓ sync
                                              [actual-server :5006]
```

- Official path: Node backend + `@actual-app/api` + self-hosted `actual-server`.
- No first-party REST API; build a thin wrapper or adopt a community gateway if non-Node clients need access.
- Net worth / custom reports: ActualQL or `getAccountBalance` — plan compute in your service layer.
