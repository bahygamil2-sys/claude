# Sufra (سُفرة)

A full-stack, bilingual (Arabic/English) restaurant ordering platform in the
style of Talabat: a customer-facing ordering site, a restaurant owner
dashboard, an admin/operations dashboard, live Socket.io updates, and
Google Maps order tracking.

**UI language**: Arabic (RTL) is the default; every screen has a full
English (LTR) mirror via a toggle in the header. This isn't just translated
strings — layouts physically mirror using CSS logical properties.

## What's mocked or simulated

This is a demo/portfolio build, so a few things that would normally need a
real third-party account are deliberately faked:

- **Payments** — Cash on Delivery is real (it's just a flag), and "Card" is a
  mock form that always succeeds. No real payment processor is integrated.
- **Delivery tracking** — there are no real drivers or GPS devices. Once an
  order goes "Out for Delivery," the backend simulates a driver marker
  moving from the restaurant to the delivery address over ~3 minutes and
  pushes the position over Socket.io. The map, ETA, and live badge are real;
  the vehicle isn't.
- **Google Maps** — the frontend reads `VITE_GOOGLE_MAPS_API_KEY` from the
  environment. If it's unset or invalid, the tracking page degrades
  gracefully to a status timeline and raw coordinates instead of breaking.

## Tech stack

| | |
|---|---|
| Backend | Node.js, Express, TypeScript, PostgreSQL + Prisma, Socket.io, zod, JWT (httpOnly rotating refresh cookie) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, TanStack Query, Zustand, Recharts, `@react-google-maps/api`, react-i18next |
| Repo | npm workspaces (`backend`, `frontend`), Playwright for E2E |

## Prerequisites

- Node.js 20+
- PostgreSQL 16, reachable via a connection string — either:
  - **Docker**: `docker-compose.yml` at the repo root spins up a `postgres:16-alpine` container, or
  - **A local Postgres install**: create a database and point `DATABASE_URL` at it (see below).

## Setup

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then bring up Postgres and initialize the schema + seed data. If you're
using the bundled Docker Compose service:

```bash
npm run db:up        # docker compose up -d (postgres)
npm run db:migrate    # prisma migrate dev
npm run db:seed       # seeds categories, restaurants, menus, users, orders
```

If you're pointing at a Postgres install you already have running, skip
`db:up`, set `DATABASE_URL` in `backend/.env` to match it, and run just the
migrate + seed steps. (`npm run setup` does install + `db:up` + migrate +
seed in one shot, for the Docker path.)

## Running the app

```bash
npm run dev
```

This runs the backend (`http://localhost:4000`) and frontend
(`http://localhost:5173`) concurrently. Open the frontend URL — the API and
Socket.io are proxied through Vite in dev, so there's nothing else to point
at each other.

## Environment variables

**`backend/.env`** (see `backend/.env.example` for the full annotated list):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `CORS_ORIGIN` | Frontend origin allowed to call the API with credentials |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets — generate real random values (`openssl rand -base64 48`) outside local dev |
| `ACCESS_TOKEN_TTL_MINUTES` / `REFRESH_TOKEN_TTL_DAYS` | Token lifetimes |
| `TRACKING_SIM_DURATION_SECONDS` / `TRACKING_SIM_TICK_MS` | Driver-tracking simulation timing |

**`frontend/.env`** (see `frontend/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Get your own key at [console.cloud.google.com/google/maps-apis](https://console.cloud.google.com/google/maps-apis) — enable the **Maps JavaScript API**. Leave empty to use the no-key fallback on the tracking page. |
| `VITE_API_BASE_URL` | Leave empty in local dev; Vite proxies `/api` and `/socket.io` to the backend. |

## Seeded accounts

The seed script creates 1 admin, 8 restaurant owners (2 of whom own two
restaurants each), and 10 customers — all sharing one password:

**Password for every seeded account: `Passw0rd!`**

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@sufra.demo` | Full access to `/admin` |
| Restaurant Owner | `owner1@sufra.demo` … `owner8@sufra.demo` | `/restaurant-dashboard`; owner1 and owner2 each own two restaurants |
| Customer | `customer1@sufra.demo` … `customer10@sufra.demo` | Each has 1–2 saved addresses |

Seed data also includes: 8 cuisine categories, 10 restaurants across 3
cities (Cairo, Dubai, Riyadh) — one `PENDING` and one `SUSPENDED`, the rest
`APPROVED` — around 110 menu items with option groups, 5 drivers, and ~70
backdated orders spanning every status (for the reports/dashboards to have
something to show). Re-running `npm run db:seed` wipes and regenerates all
of this from scratch, which is the easiest way to reset the database to a
known state.

## Running the E2E tests

The Playwright suite in `e2e/` exercises the customer ordering flow, the
restaurant owner dashboard, and the admin dashboard against a real,
running instance of the app — it doesn't mock the backend. Prerequisites:

1. `npm run dev` running in another terminal (backend + frontend up).
2. The database migrated and seeded (`npm run db:seed`) — the suite logs
   in as the seeded accounts above and depends on that data existing.

Then:

```bash
npm run e2e        # headless run
npm run e2e:ui     # interactive UI mode
```

The suite creates one real order and one throwaway category as part of its
assertions; re-run `npm run db:seed` afterward if you want a clean slate
before continuing manual testing.

## Project structure

```
backend/
  prisma/           schema.prisma, migrations, seed.ts
  src/
    modules/         one folder per domain (auth, restaurants, menu, orders, reports, admin, ...)
    sockets/          Socket.io server, room auth, event emitters
    middleware/, lib/, config/
frontend/
  src/
    features/         one folder per screen/domain, colocated with its API hooks
    components/        shared design-system pieces (Button, Modal, charts, filters, ...)
    layouts/, routes/, store/ (Zustand), i18n/ (ar/en locale JSON), hooks/, lib/
e2e/                  Playwright golden-path specs
```

## Scripts reference

Run from the repo root unless noted.

| Command | What it does |
|---|---|
| `npm run dev` | Backend + frontend, concurrently |
| `npm run build` | Production build of both workspaces |
| `npm run lint` | ESLint across both workspaces |
| `npm run db:up` / `db:down` | Start/stop the Docker Postgres container |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Wipe and reseed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run e2e` / `e2e:ui` | Run the Playwright suite |
| `npm run typecheck -w backend` / `-w frontend` | Type-check one workspace |
