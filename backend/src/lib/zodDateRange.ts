import { z } from "zod";

const BARE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A bare "YYYY-MM-DD" dateFrom means "from the start of that day" — plain coercion already does that. */
export const dateFromField = z.coerce.date().optional();

/**
 * A bare "YYYY-MM-DD" dateTo means "through the end of that day", not midnight at its start —
 * otherwise a caller filtering "up to today" would see today's own orders excluded.
 * A full timestamp is left untouched.
 */
export const dateToField = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    const iso = BARE_DATE_RE.test(val) ? `${val}T23:59:59.999Z` : val;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? undefined : date;
  })
  .pipe(z.date().optional());
