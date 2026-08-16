# Final Local Runtime Fixes

This package includes two runtime fixes found during local full-stack testing:

1. **Manager dashboard React crash** — backend submissions include `operator` as an object (`{id,name,email}`), while the UI expects a display string. The frontend API normalization now exposes `operator` as the operator's name/email and preserves the original object as `operatorUser`.
2. **Stale SSE authentication tickets** — the service worker previously cached `/api/*` GET responses, which could replay an expired `/events/ticket` response and cause SSE `401 Unauthorized`. API requests are now never cached, the service-worker cache version is bumped, old caches are removed on activation, and service-worker updates bypass the browser HTTP cache.

The Vite WebSocket/HMR warning seen during development is separate from the application runtime crash; it does not cause the Manager dashboard blank screen. If HMR is unavailable, restarting `npm run dev` is sufficient for development.

## Verification performed in this environment

- All plain `.js` files pass `node --check`.
- The known React rendering failure was traced to `ManagerDashboard` data shape and fixed at the API normalization boundary.
- The stale SSE ticket was traced to service-worker API caching and fixed at the service-worker layer.
- The package intentionally excludes `node_modules`, `.env`, and build artifacts.

The backend package does not ship a `package-lock.json`; use `npm install` inside `backend` (not `npm ci`).
