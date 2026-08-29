import { rateLimit } from "express-rate-limit";
import { ApiError } from "./ApiError";

// A synchronous throw here is caught by Express's own dispatcher and forwarded
// to errorHandler, same as any other middleware — no need to shape the 429
// response by hand.
function handler() {
  throw ApiError.tooManyRequests();
}

/** GET .../surveys/:token — generous, since page reloads/retries are normal; still deters token-scanning scripts. */
export const publicFetchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** POST .../responses — the one unauthenticated write in the system, so the tightest limit in the app. */
export const publicSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
