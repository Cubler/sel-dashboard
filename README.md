# Industrial Data Monitoring Dashboard

## Overview

A production-ready single-page application built with **Vite + Vue 3** that connects to an industrial device API to visualise and manage real-time symbol values. The app authenticates via Basic Auth → Bearer token, polls up to 50 symbols concurrently using `Promise.allSettled`, accumulates a 5-minute client-side history, and presents the data in a sortable/filterable table with per-symbol detail modals and live line charts.

A Vite dev-server plugin stands in for the physical device (`192.168.3.2`), which is not reachable externally. The same mock runs identically in local development and `vite preview` — no service-worker setup, no environment gating.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | **Vue 3** with TypeScript strict mode |
| Build tool | **Vite 7** |
| Routing | **Vue Router 5** |
| State management | **Pinia** (composition-API stores) + module-level composable singletons |
| HTTP client | **Axios** with request/response interceptors |
| Testing | **Vitest** + `@vue/test-utils` + `happy-dom` |
| E2E testing | **Playwright** |
| Charts | **Chart.js 4** (raw API — not vue-chartjs — for lifecycle control) |
| Styling | **Tailwind CSS** (`darkMode: 'class'`) |

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
```

### Development server

```bash
npm run dev
# → http://localhost:5173
```

Default credentials (mock server):

| Field | Value |
|---|---|
| Server URL | `https://192.168.3.2` (any valid URL works with the mock) |
| Username | `testuser` |
| Password | `testpass` |

### Testing

```bash
npm run test                  # run all unit/component tests once
npm run test:coverage         # run tests + generate coverage report
```

Coverage report is written to `coverage/index.html`.

```bash
# E2E tests (requires dev server running on port 5173)
npx playwright test tests/e2e/
```

### Production build

```bash
npm run build     # Vite builds frontend into dist/
npm run preview   # serve dist/ locally with mock API (port 4173)
npm run start     # Node.js production server (requires VITE_DEVICE_IP)
```

### Docker

```bash
docker-compose up --build
# → http://localhost:3000
```

To point at the real industrial device:

```yaml
# docker-compose.yml
environment:
  - VITE_DEVICE_IP=192.168.3.2
  - NODE_TLS_REJECT_UNAUTHORIZED=0   # device uses a self-signed certificate
```

---

## Architecture

### Project structure

```
sel-dashboard/
├── src/                            Vue 3 SPA source
│   ├── services/
│   │   ├── apiService.ts           SELApiService class — axios, interceptors, token lifecycle
│   │   └── storageService.ts       Typed localStorage wrapper (namespaced under "sel:")
│   ├── stores/
│   │   └── preferences.ts          Pinia store — theme (light/dark/auto), autoStartPolling
│   ├── composables/
│   │   ├── usePolling.ts           Reusable setInterval composable with concurrent-call guard
│   │   ├── useSymbolPolling.ts     Auth + symbol data + history — module-level singleton state
│   │   └── useToast.ts             Toast notification queue (module-level singleton)
│   ├── components/
│   │   ├── LoginForm.vue           Basic Auth form with per-field validation
│   │   ├── SymbolTable.vue         Table — search (300 ms debounce), sort, pagination, CSV export
│   │   ├── SymbolDetailModal.vue   Focus-trapped modal — live value, history chart, quality detail
│   │   ├── ConnectionIndicator.vue Animated status dot + live "Last updated: Xs ago" clock
│   │   ├── ErrorDisplay.vue        Dismissible error banner (reusable)
│   │   ├── ConfirmDialog.vue       Modal confirmation dialog (reusable)
│   │   ├── ToastNotification.vue   Auto-dismissing toast stack (bottom-right)
│   │   └── UserMenu.vue            Settings dropdown — theme toggle, auto-start preference
│   ├── utils/
│   │   ├── qualityHelpers.ts       getSymbolStatus() — 30 s / 60 s thresholds
│   │   ├── dateHelpers.ts          formatRelativeTime(), formatTimestamp(), formatFullTimestamp()
│   │   └── csvExport.ts            Export filtered+sorted view, quotes comma-containing values
│   ├── pages/
│   │   ├── login.vue               Mounts LoginForm
│   │   └── dashboard.vue           Orchestrates polling, ConnectionIndicator, SymbolTable
│   ├── types/api.ts                All TypeScript interfaces
│   ├── router.ts                   Vue Router config + beforeEach auth guard
│   └── main.ts                     App bootstrap — Pinia, router, session + theme restore
│
├── server/                         Dev server mock + production server
│   ├── mock-plugin.ts              Vite plugin — serves mock /api/* in dev and vite preview
│   ├── prod-server.mjs             Node.js production server — static files + device proxy
│   └── utils/mockData.ts           12 INS mock symbols with varying quality/range/jitter
│
├── tests/                          97 unit and component tests (Vitest) + 3 E2E (Playwright)
│   ├── components/
│   ├── composables/
│   ├── e2e/
│   ├── services/
│   └── utils/
│
├── Dockerfile                      Multi-stage — node:20-alpine builder → node:20-alpine runtime
├── docker-compose.yml
└── .env.example                    Documents VITE_DEVICE_IP
```

### Key design decisions

**1. Vite plugin mock instead of MSW**

The mock API (`server/mock-plugin.ts`) runs as a Vite `configureServer` / `configurePreviewServer` middleware. This means the same mock handler runs in both `npm run dev` and `npm run preview` with zero extra processes and no environment gating. When `VITE_DEVICE_IP` is set, the plugin proxies `/api/*` requests to the real device instead.

**2. `Promise.allSettled` for batch polling**

`fetchAllValues()` fires one `GET /api/symbols/:name` per symbol concurrently. Using `Promise.all` would abort all updates the moment any single symbol times out or returns 4xx. `Promise.allSettled` lets the succeeding symbols update normally while the failing symbol retains its last known value. `connectionStatus.isConnected` is derived from whether at least one symbol succeeded.

**3. Module-level singleton state in `useSymbolPolling`**

Auth state, symbol data, history, and connection status live as module-level `ref`/`reactive` values inside `useSymbolPolling.ts` — not in a Pinia store. Every caller shares the same refs, making cross-component access straightforward without injecting a store. Pinia is used only for user preferences (theme, auto-start), which genuinely benefit from DevTools support and plugin compatibility.

**4. Client-side rolling history**

There is no history API endpoint. `addToHistory()` appends a `SymbolHistoryPoint` on every successful poll and prunes in two ways: entries older than 5 minutes (`Date.now() - 300_000`) and a hard cap of 50 points. `SymbolDetailModal` shows an empty-state message until ≥ 2 points exist, then updates the Chart.js instance in-place via `chart.update('none')` to avoid animation flicker on every tick.

**5. Token expiry timestamp tracking**

`SELApiService` stores both the token string and its expiry epoch (`Date.now() + expiresIn * 1000`) via `storageService`. `isTokenValid()` checks existence *and* `Date.now() < tokenExpiry` — not just presence. On page refresh, `main.ts` calls `useSymbolPolling().init()` before mounting, restoring the session if the stored token is still valid.

**6. Mock vs. real device switching**

Set `VITE_DEVICE_IP=192.168.3.2` in the environment. The Vite plugin and production server both intercept `/api/*` requests and proxy them to `https://[IP]/api/v1/*`, translating paths (`/api/symbols` → `/api/v1/logic-engine/symbols`). When the env var is absent, all requests fall through to the mock handlers — no code changes required.

---

## Features Implemented

- [x] Basic Auth → Bearer token authentication with automatic header injection
- [x] Token storage in memory + `localStorage` (via `storageService`), restored on page refresh
- [x] Automatic logout on 401 responses from authenticated endpoints
- [x] Symbol dashboard — sortable, searchable table (debounced 300 ms), paginated (10/25/50)
- [x] Real-time polling at 1 s / 2 s / 5 s / 10 s (configurable, start/stop controls)
- [x] Symbol status indicators — Active (< 30 s), Stale (30–60 s), Inactive (> 60 s)
- [x] Client-side 5-minute rolling history (max 50 points per symbol)
- [x] Symbol detail modal with live-updating value, metadata, quality breakdown, and history chart
- [x] Connection status indicator with live "Last updated: Xs ago" display
- [x] Toast notifications for poll errors (auto-dismiss after 4 s)
- [x] Confirmation dialog on logout
- [x] CSV export of the current filtered + sorted view
- [x] Theme support — Light / Dark / Auto (follows OS preference), persisted to `localStorage`
- [x] Auto-start polling preference, persisted to `localStorage`
- [x] Responsive layout (768 px minimum)
- [x] Accessibility — ARIA roles, `aria-modal`, focus trapping in modals, keyboard navigation
- [x] 97 unit and component tests, 84% statement coverage (threshold: 70%)
- [x] 3 Playwright E2E tests covering modal close interactions
- [x] Docker support — multi-stage `node:20-alpine` image, `docker-compose.yml`

---

## Known Issues / Future Improvements

- **Polling volume** — 50 symbols at 1 s = 50 HTTP requests/second. A production improvement would be a server-side aggregation endpoint or WebSocket push, reducing client-server chatter by ~50×.
- **Full-page reload on session expiry** — the 401 handler in `apiService.ts` uses `window.location.replace('/login')`. Injecting the Vue Router instance would allow a soft navigation instead.
- **Production mock** — `server/prod-server.mjs` has no mock fallback; `VITE_DEVICE_IP` must be set when running the Docker image. Use `npm run preview` for local smoke-testing the built app with mock data.
- **No i18n** — English only.
- **No WebSocket support** — polling only.

---

## Time Spent

Approximately 10 hours.

---

## Questions or Notes

- The application works fully out of the box without the physical device. Mock credentials (`testuser` / `testpass`) work in development and `vite preview`.
- The mock server returns 12 `INS`-type symbols, all with varied quality (`good` / `questionable` / `invalid`) and range states (`normal` / `high` / `low`) to exercise the detail modal's quality and range display paths.
