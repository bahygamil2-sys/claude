import { rateLimit } from "express-rate-limit";
import { ApiError } from "./ApiError";

function handler() {
  throw ApiError.tooManyRequests();
}

/** Brute-force deterrent on the one endpoint that accepts a password over the wire. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
