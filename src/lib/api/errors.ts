/**
 * The single error type for every backend failure.
 *
 * The backend returns real HTTP status codes. There is no `{status: "error"}`
 * field to inspect — if you find code checking for one, it is dead code from
 * the old contract.
 */

export type ApiErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "server"
  | "network";

const KIND_BY_STATUS: Record<number, ApiErrorKind> = {
  401: "unauthenticated",
  403: "forbidden",
  404: "not_found",
  409: "validation",
  417: "validation",
  429: "rate_limited",
};

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  /** The raw response body, for debugging. Never render this. */
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = KIND_BY_STATUS[status] ?? (status >= 500 ? "server" : "server");
    this.payload = payload;
  }

  /** True when the user simply needs to sign in again. */
  get isAuthFailure(): boolean {
    return this.kind === "unauthenticated";
  }

  /** True when the message is safe and useful to show on a form. */
  get isUserFacing(): boolean {
    return this.kind === "validation" || this.kind === "forbidden" || this.kind === "rate_limited";
  }
}

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/**
 * Extract the human-readable message Frappe intended for the user.
 *
 * Frappe stashes it in `_server_messages`: a JSON string containing an array of
 * JSON strings, each an object with a `message` key. It is as awkward as it
 * sounds, and it is the only place a translated, user-facing message appears.
 */
function serverMessage(payload: any): string | null {
  const raw = payload?._server_messages;
  if (typeof raw !== "string") return null;

  try {
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length === 0) return null;

    const first = entries[0];
    const parsed = typeof first === "string" ? JSON.parse(first) : first;
    const message = (parsed as { message?: unknown })?.message;
    return typeof message === "string" ? stripHtml(message) : null;
  } catch {
    return null;
  }
}

/** Frappe messages may contain markup; forms want plain text. */
function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `exception` looks like "frappe.exceptions.ValidationError: Guardian mobile is
 * required". Keep the part after the class name; never show the class name.
 */
function exceptionMessage(payload: any): string | null {
  const raw = payload?.exception;
  if (typeof raw !== "string" || !raw) return null;
  const tail = raw.split(":").slice(1).join(":").trim();
  return tail || null;
}

export function toApiError(status: number, payload: unknown): ApiError {
  // A 500 may carry an internal message; never surface it.
  const message =
    status >= 500
      ? GENERIC_MESSAGE
      : serverMessage(payload) ?? exceptionMessage(payload) ?? GENERIC_MESSAGE;

  return new ApiError(status, message, payload);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
