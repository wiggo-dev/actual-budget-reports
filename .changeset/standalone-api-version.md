---
"actual-budget-reports": patch
---

Fix Docker health check by resolving the Actual API version from process.cwd() instead of import.meta.url in the standalone bundle.
