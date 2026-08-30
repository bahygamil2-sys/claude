# Branch Sales Dashboard

Internal multi-brand restaurant sales dashboard, replacing a manual Excel workflow. A **Brand**
owns many **RestaurantBranches**; **Users** (ADMIN / EDITOR / VIEWER) enter or import daily sales
per branch, and compare them (day-vs-day, month-vs-month, one branch or several, one or more
brands) through filters instead of hand-built spreadsheet pivots.

This is a sibling project to two unrelated apps living on other branches of this same repo (a
restaurant *ordering* platform, and a *survey/feedback* platform) — unrelated, no shared code,
started from a fresh orphan branch (`claude/branch-sales-dashboard`). A separate GitHub repo was
the first choice, but the connected GitHub App has no account-level "create repository"
permission — confirmed by a failed attempt, not assumed — so this lives here instead, as a third
orphan branch on the same terms as the other two.

## Non-negotiable rules (violating these reproduces bugs already found in the source data)

- **Never persist a computed total, percentage, or comparison.** `DailyBranchSales.amount` and
  `DailyChannelSales.*` are the only stored numbers; every total/%/comparison is computed from
  them at query time, always. The source Excel workbooks this app replaces had pre-built summary
  sheets that silently drifted out of sync with the real daily data — proven concretely (a
  monthly comparison sheet was short by exactly one day's figure). Don't recreate that failure
  mode by caching an aggregate anywhere.
- **Money is `Decimal`, never `Float`** (Prisma `@db.Decimal(12,2)`) — years of daily figures get
  summed; float drift is a real failure mode at that horizon, not a theoretical one.
- **Dates are plain calendar dates**, `@db.Date` in Postgres, `YYYY-MM-DD` on the wire — no
  timezone component anywhere in the data model or API contract.
- **Nothing hardcodes "this year."** Date pickers, filters, and any range logic must work for
  2050 as naturally as for 2026 — this was an explicit requirement, not a nice-to-have.
- **A branch's absence before it opened is not zero.** `RestaurantBranch.openedAt` is real; a
  branch simply has no rows before that date. Never synthesize a zero row for a not-yet-open
  branch — it would corrupt any average/comparison that includes it.
- **Import is never blind**, including re-imports: upload → parse → preview/diff → explicit
  confirm → commit. A parsed preview must show every branch-column match decision (exact / fuzzy
  needing confirmation / new-branch needing confirmation) and a real value-level diff for
  anything that already has data — never just a row count.

## Tech stack

Same proven stack as the two sibling projects, reused for consistency and lower risk: Node.js +
Express + TypeScript backend, PostgreSQL via Prisma, zod validation, JWT auth (short-lived access
token kept in memory only on the frontend — Zustand, never localStorage — httpOnly rotating
refresh cookie backed by a `RefreshToken` table, revocable). React 18 + TypeScript + Vite +
Tailwind frontend, TanStack Query, Zustand, react-i18next (Arabic-only for v1 — this is an
internal tool for an Arabic-speaking team, not customer-facing like the sibling projects, so no
English bundle is built yet, but every string still routes through i18n keys so adding one later
is a translation pass, not a rebuild), Recharts, `exceljs` for both the import parser and
CSV/XLSX export.

**RTL note**: Tailwind logical properties only (`ms-*/me-*/ps-*/pe-*/text-start/text-end/border-e`
— never `ml-/mr-/left-/right-`). Recharts charts need a local `dir="ltr"` wrapper regardless of
app language — an inherited `dir="rtl"` from `<html>` breaks recharts' Y-axis tick text-anchor
math and clips Arabic labels to their last glyph (found and fixed on the sibling survey-platform
project); Arabic letter shaping is a font/script property, not a CSS-direction one, so the text
still renders correctly inside an LTR-forced chart wrapper.

## RBAC

Single global role per user: `ADMIN` (everything, all brands, user management), `EDITOR` (sales
data + branch management, scoped to assigned brands), `VIEWER` (read-only dashboard, scoped to
assigned brands). Non-admin scope lives in `UserBrandAccess` (userId, brandId) — a user assigned
to a brand sees every branch under it; there is no finer per-branch carve-out. Every scoped
query/write resolves the caller's accessible brand-id set server-side from JWT + role +
`UserBrandAccess` and rejects (403, naming the offending id) anything outside it — never a silent
partial filter.

## Full plan

`/root/.claude/plans/ancient-wiggling-pillow.md` has the full design: data model, API surface,
import pipeline, comparison engine request/response shape, and phased execution order. Consult it
before diverging from an established pattern.
