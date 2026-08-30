# Ra'y (رأي)

A SurveyHeart-style survey and feedback platform scoped to restaurant chains. A **Brand**
owns many **RestaurantBranches**, designs **Surveys**, and gets a stable QR code / link per
(survey, branch) pair. Anonymous customers scan the code and submit **Responses**; the brand
gets a detailed analytics dashboard.

This is a sibling project to a separate restaurant *ordering* platform living in another
branch of this repo — unrelated, no shared code.

## Architecture

```
Platform
 └─ Brand (many)
     ├─ BrandUser (OWNER / MANAGER, MANAGER scoped to specific branches)
     ├─ RestaurantBranch (many)
     └─ Survey (many)
         ├─ Question (9 types, ordered)
         │   └─ QuestionOption (choice types only)
         ├─ SurveyBranchLink (one per branch, the QR/copy-link source)
         └─ Response (branch-attributed, anonymous)
             └─ Answer (one per question, type-validated JSON)
```

- **Backend**: Node.js + Express + TypeScript, PostgreSQL via Prisma, zod validation, JWT
  auth (short-lived access token, httpOnly rotating refresh cookie backed by a
  `RefreshToken` table).
- **Frontend**: React 18 + TypeScript + Vite + Tailwind (RTL via logical properties only),
  TanStack Query, Zustand, react-i18next (Arabic default, English toggle), Recharts,
  `qrcode.react`.
- **Multi-tenancy**: every brand-scoped query filters by the `brandId` from the JWT, never
  a client-supplied id. A Manager is further scoped to specific branches via
  `BrandUserBranch`.
- **Public surface**: `/r/:token` (survey response) and its API routes are the one part of
  the system reachable without logging in — kept in a physically separate module from the
  brand/admin routers, and validated + rate-limited accordingly.

## Question types

`SHORT_TEXT`, `LONG_TEXT`, `SINGLE_CHOICE`, `MULTI_CHOICE`, `DROPDOWN`, `RATING` (configurable
star count, or a slider/numeric variant), `NPS`, `YES_NO`, `DATE`.

## Setup

Requires Node 20+ and a PostgreSQL 16 instance (either `docker compose up -d`, or point
`DATABASE_URL` at a local install).

```bash
npm install
npm run db:up          # starts Postgres via docker-compose (skip if using a local instance)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run db:migrate
npm run db:seed
npm run dev             # backend on :4000, frontend on :5173
```

Or all at once: `npm run setup` (install → db up → wait → migrate → seed).

## Environment variables

**`backend/.env`** (see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `CORS_ORIGIN` | Frontend origin allowed to call the API with credentials |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets — generate real values beyond local dev (`openssl rand -base64 48`) |
| `ACCESS_TOKEN_TTL_MINUTES` / `REFRESH_TOKEN_TTL_DAYS` | Token lifetimes |
| `PUBLIC_SURVEY_BASE_URL` | Frontend origin the `/r/:token` link is built from |

**`frontend/.env`** (see `frontend/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Leave empty in local dev — Vite proxies `/api` to the backend |

## Seeded accounts

All seeded accounts share the password **`Passw0rd!`**.

| Role | Email | Notes |
|---|---|---|
| Platform admin | `admin@rai.demo` | `/admin/login` |
| Zeitoun Kitchen — Owner | `owner@zeitoun.demo` | 6 branches (Cairo, Giza, Alexandria) |
| Zeitoun Kitchen — Manager | `manager@zeitoun.demo` | Scoped to Downtown Cairo + Nasr City only |
| Qishta Café — Owner | `owner@qishta.demo` | 4 branches (Cairo, Giza, Mansoura); Owner-only, no Manager seeded |

Seeded data includes 5 surveys spanning every status (`DRAFT`, `PUBLISHED`, `CLOSED`) and
scope (`ALL_BRANCHES`, `SPECIFIC_BRANCHES`), with 268 responses total across the two
published surveys — realistically skewed (weighted rating distribution, NPS correlated with
rating, bilingual free-text samples) rather than uniform random, so every chart in the
analytics dashboard has real shape. Re-running `npm run db:seed` wipes and regenerates the
same dataset deterministically (fixed RNG seed).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Backend + frontend, concurrently |
| `npm run build` | Production build, both workspaces |
| `npm run lint` | ESLint, both workspaces |
| `npm run db:migrate` / `db:seed` / `db:reset` / `db:studio` | Prisma workflows |
| `npm run e2e` | Playwright golden-path suite (`npm run dev` must already be running) |

## Testing

`e2e/golden-path.spec.ts` covers: brand signup → create branches → build a survey with a
mix of question types → publish → open its QR/link page → submit a response anonymously
(no auth, a separate browser context) → confirm it lands in analytics with correct branch
attribution → export CSV → platform admin suspends the brand → confirm the brand's owner can
no longer log in. Plus a mobile-viewport pass on the public `/r/:token` page and a
bilingual/RTL default-language check.

A manual authorization-boundary pass (Manager can't see or query another branch's data even
by explicit id, one brand can never reach another brand's surveys/reports, the public API
enforces `PUBLISHED`-only regardless of whether a token is guessed) was run against the live
API alongside the automated suite.

## Out of scope (deliberate)

- **File-upload questions** — the one place an anonymous, unauthenticated respondent would
  write binary data; a real risk surface the reference product itself paywalls.
- **Conditional branching / skip logic** — every respondent sees every question in order.
- **Real push/email notifications** — Manager invites are one-time links shared manually,
  not emailed.
- **PDF export** — CSV and Excel only; no print-optimized report view.
- **Real-time updates** — survey responses accumulate over time with no live-tracking
  equivalent to an active order, so TanStack Query refetch is sufficient; no Socket.io.
