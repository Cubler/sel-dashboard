# Industrial Data Monitoring Dashboard

## Overview

A production-ready single-page application built with **Nuxt 4 (Vue 3)** that connects to an industrial device API to visualise and manage real-time symbol values. The app authenticates via Basic Auth → Bearer token, polls up to 50 symbols concurrently, accumulates a 5-minute client-side history, and presents the data in a sortable/filterable table with per-symbol detail modals and live line charts.

Nuxt's built-in Nitro server routes stand in for the physical device (`192.168.3.2`), which is not reachable externally. The same mock works identically in local development, Vitest, and the Docker production container — no service-worker setup, no environment gating.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | **Nuxt 4** (Vue 3) with TypeScript strict mode |
| Build tool | Vite via Nitro (Nuxt's built-in SSR/SPA bundler) |
| State management | **Pinia** (composition-API stores) |
| HTTP client | **Axios** with request/response interceptors |
| Testing | **Vitest** + `@vue/test-utils` + `@nuxt/test-utils` |
| Charts | **Chart.js 4** (raw API — not vue-chartjs — for lifecycle control) |
| Styling | **Tailwind CSS** (`darkMode: 'class'`) |
| Internationalization | Not implemented |

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
# → http://localhost:3000
```

Default credentials (mock server):

| Field | Value |
|---|---|
| Server URL | `https://192.168.3.2` (any value works with mock) |
| Username | `testuser` |
| Password | `testpass` |

### Testing

```bash
npm run test              # run all tests once
npm run test:coverage     # run tests + generate coverage report
```

Coverage report is written to `coverage/index.html`.

### Production build

```bash
npm run build     # Nitro bundles app + server into .output/
npm run preview   # serve .output/ locally
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
  - NUXT_PUBLIC_DEVICE_IP=192.168.3.2
  - NODE_TLS_REJECT_UNAUTHORIZED=0   # device uses a self-signed certificate
```

---

## Architecture

### Project structure

```
sel-dashboard/
├── server/                         Nitro server (mock API + real-device proxy)
│   ├── api/
│   │   ├── auth/token.get.ts       GET /api/auth/token  (Basic Auth → Bearer)
│   │   └── symbols/
│   │       ├── index.get.ts        GET /api/symbols
│   │       └── [name].get.ts       GET /api/symbols/:name  (value with jitter)
│   ├── middleware/realDevice.ts    Proxies /api/* → https://[IP]/api/v1/* when DEVICE_IP set
│   └── utils/mockData.ts           18 mock symbols (12 INS + 6 non-INS), random jitter
│
├── app/                            Vue 3 SPA (Nuxt srcDir)
│   ├── services/
│   │   ├── apiService.ts           SELApiService class — axios, interceptors, token lifecycle
│   │   └── storageService.ts       Typed localStorage wrapper
│   ├── stores/
│   │   ├── auth.ts                 isAuthenticated, login(), logout()
│   │   ├── symbols.ts              symbols[], symbolValues Map, symbolHistory Map, polling interval
│   │   └── preferences.ts          theme (light/dark/auto), autoStartPolling
│   ├── composables/
│   │   └── usePolling.ts           Reusable setInterval composable with concurrent-call guard
│   ├── components/
│   │   ├── LoginForm.vue           Basic Auth form with per-field validation
│   │   ├── SymbolTable.vue         Table — search (300 ms debounce), sort, pagination, CSV export
│   │   ├── SymbolDetailModal.vue   Focus-trapped modal — live value, history chart, quality detail
│   │   ├── SymbolHistoryChart.vue  Chart.js line chart, updates in-place without flicker
│   │   ├── ConnectionIndicator.vue Animated status dot with live relative-time clock
│   │   ├── PollingControls.vue     Start/stop + interval selector
│   │   ├── UserMenu.vue            Settings dropdown — theme toggle, auto-start preference
│   │   ├── StatusBadge.vue         Active / Stale / Inactive pill
│   │   └── QualityBadge.vue        Good / Questionable / Invalid pill
│   ├── utils/
│   │   ├── qualityHelpers.ts       getSymbolStatus() — 30 s / 60 s thresholds
│   │   ├── dateHelpers.ts          formatRelativeTime(), formatTimestamp(), formatFullTimestamp()
│   │   └── csvExport.ts            Export filtered+sorted view, quotes comma-containing values
│   └── pages/
│       ├── login.vue               Mounts LoginForm
│       └── dashboard.vue           Orchestrates polling lifecycle, ConnectionIndicator, SymbolTable
│
├── tests/                          157 tests across services, stores, composables, utils, components
├── Dockerfile                      Multi-stage — node:20-alpine builder → node:20-alpine runtime
├── docker-compose.yml
└── .env.example                    Documents NUXT_PUBLIC_DEVICE_IP
```

### Key design decisions

**1. Nuxt server routes instead of MSW**

MSW requires a service worker (browser-only) and a separate Node.js integration for Vitest — two different setups that can diverge. Nuxt server routes (`server/api/`) are plain Nitro event handlers that run in the same process in every environment: `npm run dev`, `vitest`, and `docker-compose up`. The mock data is defined once and is always available with no environment gating.

**2. `Promise.allSettled` for batch polling**

`fetchAllValues()` fires one `GET /api/symbols/:name` per symbol concurrently. Using `Promise.all` would abort all 50 updates the moment any single symbol times out or returns a 4xx. `Promise.allSettled` lets the 49 succeeding symbols update normally; the failing symbol simply retains its last known value in the Map. `connectionStatus.isConnected` is derived from whether *at least one* symbol succeeded.

**3. Client-side rolling history**

There is no history API endpoint. `addToHistory()` in the symbols store appends a `SymbolHistoryPoint` on every successful poll and prunes in two ways: entries older than 5 minutes (`Date.now() - 300_000`) and a hard cap of 50 points — whichever fires first. The `SymbolHistoryChart` component shows an empty-state message until ≥ 2 points exist, then updates the Chart.js instance in-place via `chart.update('none')` to avoid animation flicker on every tick.

**4. Token expiry timestamp tracking**

`SELApiService` stores both the token string and its expiry epoch (`Date.now() + expiresIn * 1000`). `isTokenValid()` checks existence *and* `Date.now() < tokenExpiry` — not just presence. Both values are persisted to `localStorage` so a page refresh within the 1-hour window stays authenticated. The `auth.client.ts` Nuxt plugin calls `auth.init()` before the first route guard fires, restoring the session if the stored token is still valid.

**5. Switching from mock to real device**

Set `NUXT_PUBLIC_DEVICE_IP=192.168.3.2` in the environment. The `server/middleware/realDevice.ts` Nitro middleware intercepts every `/api/*` request and proxies it to `https://[IP]/api/v1/*`, translating paths (`/api/symbols` → `/api/v1/logic-engine/symbols`). Because the device uses a self-signed TLS certificate, also set `NODE_TLS_REJECT_UNAUTHORIZED=0`. When the env var is absent, all requests fall through to the built-in mock routes — no code changes required.

---

## Features Implemented

- [x] Basic Auth → Bearer token authentication with automatic header injection
- [x] Token storage in memory + `localStorage`, restored on page refresh
- [x] Automatic logout on 401 responses from authenticated endpoints
- [x] Symbol dashboard — sortable, searchable table (debounced 300 ms), paginated (10/25/50)
- [x] Real-time polling at 1 s / 2 s / 5 s / 10 s (configurable, start/stop controls)
- [x] Symbol status indicators — Active (< 30 s), Stale (30–60 s), Inactive (> 60 s)
- [x] Client-side 5-minute rolling history (max 50 points per symbol)
- [x] Symbol detail modal with live-updating value, metadata, quality breakdown, and history chart
- [x] Connection status indicator with live relative-time display
- [x] CSV export of the current filtered + sorted view
- [x] Theme support — Light / Dark / Auto (follows OS preference), persisted to `localStorage`
- [x] Auto-start polling preference, persisted to `localStorage`
- [x] Responsive layout (768 px minimum)
- [x] Accessibility — ARIA roles, `aria-modal`, focus trapping in modals, keyboard navigation
- [x] 157 unit and component tests, 91 % statement coverage (threshold: 70 %)
- [x] Docker support — multi-stage `node:20-alpine` image, `docker-compose.yml`

---

## Known Issues / Future Improvements

- **Mock data only** — `192.168.3.2` is a private LAN address. All data is generated by `server/utils/mockData.ts`. Set `NUXT_PUBLIC_DEVICE_IP` to connect to a real device.
- **Polling volume** — 50 symbols at 1 s = 50 HTTP requests/second. A production improvement would be a server-side aggregation endpoint or WebSocket push, reducing client-server chatter by ~50×.
- **Full-page reload on session expiry** — the 401 handler in `apiService.ts` uses `window.location.replace('/login')`. Injecting the Vue Router instance would allow a soft navigation instead.
- **No i18n** — English only.
- **No WebSocket support** — polling only.
- **No E2E tests** — Vitest unit/component tests only. Playwright would cover the full auth → dashboard → polling → modal flow.

---

## Time Spent

Approximately 10 hours.

---

## Questions or Notes

- The application works fully out of the box without the physical device. Mock credentials (`testuser` / `testpass`) work in development, test, and Docker production builds.
- The mock generates 12 `INS`-type symbols and 6 non-`INS` symbols to demonstrate that the client-side `Type === 'INS'` filter is working correctly.
- `lockfileVersion 3` in `package-lock.json` was regenerated inside a `node:20-alpine` container to ensure `npm ci` is reproducible inside Docker (local toolchain is Node 22 / npm 11).
