export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError("BAD_REQUEST", message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError("UNAUTHORIZED", message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError("FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new ApiError("NOT_FOUND", message);
  }
  static conflict(message = "Conflict") {
    return new ApiError("CONFLICT", message);
  }
  static validation(message = "Validation error", details?: unknown) {
    return new ApiError("VALIDATION_ERROR", message, details);
  }
  static tooManyRequests(message = "Too many requests") {
    return new ApiError("TOO_MANY_REQUESTS", message);
  }
}
