/**
 * The single HTTP client. Every backend call goes through here.
 *
 * Replaces `src/api/client.js` and `src/services/apiClient.js`, which had
 * different CSRF storage keys, different env vars, and different error handling.
 *
 * Session model:
 *   - the session lives in an HttpOnly cookie; `credentials: "include"` sends it
 *   - the CSRF token is held **in memory**, never in localStorage
 *   - there is no `X-Frappe-Session-Id` and no `X-Frappe-Site-Name`; both were
 *     removed server-side, and the former made the session XSS-exfiltratable
 */

import { ApiError, toApiError } from "./errors";

/** Empty = same-origin. In dev the Vite proxy forwards /api to Frappe. */
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const DEFAULT_TIMEOUT_MS = 20_000;

// -- CSRF ------------------------------------------------------------------

let csrfToken: string | null = null;

/** Set from the `csrf_token` field of any auth response. */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

// -- unauthenticated handling ---------------------------------------------

type UnauthenticatedHandler = () => void;
let onUnauthenticated: UnauthenticatedHandler | null = null;

/**
 * Register what should happen on a 401 — typically clearing app state and
 * routing to the login screen. Keeps redirect policy out of the transport.
 */
export function setUnauthenticatedHandler(handler: UnauthenticatedHandler | null): void {
  onUnauthenticated = handler;
}

// -- core ------------------------------------------------------------------

interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // Frappe requires a CSRF token on everything that is not a GET.
  if (method !== "GET" && csrfToken) {
    headers["X-Frappe-CSRF-Token"] = csrfToken;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    if ((cause as Error)?.name === "AbortError") {
      throw new ApiError(0, "The request timed out. Please check your connection.");
    }
    throw new ApiError(0, "Could not reach the server. Please check your connection.", cause);
  } finally {
    clearTimeout(timeout);
  }

  const payload = await readBody(response);

  if (!response.ok) {
    const error = toApiError(response.status, payload);
    if (error.isAuthFailure) {
      setCsrfToken(null);
      onUnauthenticated?.();
    }
    throw error;
  }

  return unwrap<T>(payload);
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

/**
 * Frappe wraps a whitelisted method's return value in `message`, and a resource
 * route's in `data`. Exactly one unwrap, here — never at a call site.
 */
function unwrap<T>(payload: any): T {
  if (payload && typeof payload === "object") {
    if ("message" in payload) return payload.message as T;
    if ("data" in payload) return payload.data as T;
  }
  return payload as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};

/** Call a whitelisted backend method: `/api/method/<dotted.path>`. */
export function callMethod<T>(
  method: string,
  params?: object,
  httpMethod: "GET" | "POST" = "POST",
): Promise<T> {
  if (httpMethod === "GET") {
    const query = toQueryString(params);
    return http.get<T>(`/api/method/${method}${query}`);
  }
  return http.post<T>(`/api/method/${method}`, params ?? {});
}

export function toQueryString(params?: object): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, typeof value === "string" ? value : JSON.stringify(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
