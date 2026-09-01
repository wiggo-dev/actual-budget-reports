---
"actual-budget-reports": patch
---

Fix health endpoint failing under Next.js by reading the Actual API version from a server-only module instead of requiring `@actual-app/api/package.json`.
