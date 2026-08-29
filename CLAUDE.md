# Ra'y (رأي) — restaurant chain survey & feedback platform

A SurveyHeart-style survey builder scoped to restaurant brands: a Brand owns
many RestaurantBranches; a Brand designs Surveys; each (Survey, Branch) pair
gets a stable QR code / link; anonymous customers scan it and submit
Responses; the Brand gets a detailed analytics dashboard. See
`/root/.claude/plans/ancient-wiggling-pillow.md` (or the repo's README once
written) for the full architecture.

This is a sibling project to a separate restaurant *ordering* platform in
another branch of this same repo — unrelated, no shared code.

## Conventions (read before writing code in either workspace)

- **Bilingual fields**: every user-facing DB field that holds text has a twin
  `field`/`fieldAr` pair (e.g. `Brand.name`/`Brand.nameAr`,
  `Question.label`/`Question.labelAr`). Never add a single-language field for
  anything a respondent or brand user will read.
- **RTL via logical properties only**: Tailwind classes must be
  `ms-*/me-*/ps-*/pe-*/text-start/text-end/border-e/border-s`, etc. — never
  `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right`. Arabic is the default
  language (`dir="rtl"` on `<html>`); English is a toggle that flips
  `dir`/`lang`. A component built with physical-direction classes will look
  correct in the default state and silently break the moment someone toggles
  language — there is no visual signal it's wrong until you actually check
  both directions.
- **`useLocalized()` hook**: pick the right side of a bilingual field with
  `pick(item.field, item.fieldAr)` (returns `fieldAr` when the current
  language is `ar`), never `item.field` directly in UI code.
- **Auth**: access token short-lived, kept in memory only (Zustand, not
  persisted) — never localStorage. Refresh token is an httpOnly, rotating
  cookie backed by a `RefreshToken` table (so it can be revoked and reuse can
  be detected), not a bare stateless JWT.
- **Multi-tenancy boundary**: every brand-scoped query filters by the
  `brandId` taken from the authenticated JWT — never from a client-supplied
  id/param. This is the single control that makes Brand→Branch isolation
  real; treat any code path that skips it as a bug, not a style issue.
- **Public (unauthenticated) routes** live in their own `modules/public/*`
  module, physically separate from every brand- and admin-authenticated
  module — its router never imports `authenticate`/`requireBrandUser`, and
  return hand-shaped DTOs — never a raw Prisma object spread — since this is
  the one part of the system anyone on the internet can call without logging
  in.
- **No Socket.io / real-time** in this project (unlike the sibling ordering
  platform) — survey responses have no live-tracking equivalent; TanStack
  Query refetch is sufficient. Don't add it without a concrete need.
- **Money isn't a concept here** — no Decimal/currency handling patterns
  apply; ignore that class of concern entirely.
