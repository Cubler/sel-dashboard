# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173
npm run build        # production build → dist/
npm run preview      # serve dist/ locally with mock API
npm run start        # production Node.js server (requires VITE_DEVICE_IP)

npm run test                                              # run all Vitest unit/component tests
npm run test:coverage                                     # tests + coverage report → coverage/index.html
npx vitest run tests/utils/dateHelpers.test.ts            # run a single test file

npx playwright test tests/e2e/modal-close.spec.ts         # run E2E tests (requires dev server running on 5173)

npm run lint
npm run format
```

**Dev login credentials (mock server):**
- Server URL: any valid URL (e.g. `http://localhost:5173`)
- Username: `testuser` / Password: `testpass`

## Architecture

### Data flow

```
LoginForm → apiService.authenticate() → POST /api/auth/token
         → Bearer token stored in memory + localStorage

SymbolPolling composable (module-level singleton refs)
  → fetchSymbols()    → GET /api/symbols  (filtered to INS type client-side)
  → fetchAllValues()  → Promise.allSettled(GET /api/symbols/:name × N)
                      → updates symbolValues Map + appends to symbolHistory Map
  → usePolling()      → setInterval wrapper with concurrent-call guard
```

All application state lives in `app/composables/useSymbolPolling.ts` as module-level `ref`/`reactive` values — not in a Pinia store. The composable is a shared singleton; every caller gets the same refs. The Pinia stores (`preferences.ts`) only hold UI preferences (theme, autoStartPolling).

### Mock vs. real device

`server/mock-plugin.ts` is a Vite plugin that registers middleware on the dev server (and on `vite preview`). When `VITE_DEVICE_IP` is set it proxies `/api/*` to `https://[IP]/api/v1/*` with path translation; otherwise it serves mock data. The production Docker server (`server/prod-server.mjs`) always requires `VITE_DEVICE_IP` — it proxies to the real device and has no mock fallback.

Path translations:
- `/api/auth/token` → `/api/v1/auth/token`
- `/api/symbols` → `/api/v1/logic-engine/symbols`
- `/api/symbols/:name` → `/api/v1/logic-engine/symbols/:name`

The device uses a self-signed TLS cert; set `NODE_TLS_REJECT_UNAUTHORIZED=0` alongside `VITE_DEVICE_IP`.

### Auth lifecycle

`app/main.ts` calls `useSymbolPolling().init()` before `app.mount()`, which checks `apiService.isTokenValid()` (token present + not expired) and restores `isAuthenticated` from localStorage. The Vue Router `beforeEach` guard in `app/router.ts` then redirects unauthenticated users to `/login`.

Token expiry is tracked as an epoch ms value (`Date.now() + expiresIn * 1000`) stored in localStorage alongside the token string. The 401 response interceptor in `apiService.ts` clears the token and hard-navigates to `/login` via `window.location.replace`.

### History accumulation

No history endpoint exists. `addToHistory()` in the composable appends on every successful poll tick and prunes to the last 5 minutes OR 50 points, whichever is smaller. `SymbolDetailModal` shows an empty state until ≥ 2 points exist, then updates a Chart.js instance in-place via `chart.update('none')` to avoid flicker.

### Component imports

All page files (`app/pages/`) must explicitly import their child components — there is no auto-import. The `~/` alias resolves to `app/` (configured in both `vite.config.ts` and `vitest.config.ts`).

### Testing

Unit/component tests use Vitest with `environment: 'happy-dom'`. E2E tests use Playwright against the running dev server on port 5173. The `tests/e2e/` directory is excluded from Vitest's `test.exclude` so both runners can coexist.

To close `SymbolDetailModal` in tests: click the panel container (centering wrapper) rather than the `.bg-black/50` backdrop element, which is obscured in the DOM order.
