import { DEFAULT_LOCALE, isLocale, type Locale } from "./locale";
import { translate } from "./translate";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

function isErrorResponse<T>(res: ApiResponse<T>): res is ApiErrorResponse {
  return "error" in res;
}

class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function clearAuthAndRedirect(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// The interface language, for code outside React. <html lang> is the source: the server
// renders it and the language switch keeps it current.
function currentLocale(): Locale {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "";
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

// Every request announces the interface language, so the server can answer in it before it
// knows who is asking (sign-in, registration, password reset).
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof document !== "undefined" && document.documentElement.lang) {
    headers["Accept-Language"] = document.documentElement.lang;
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// Public calls where a 401 answers the attempt itself, not a lost session
const AUTH_ATTEMPTS = new Set(["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"]);

interface RequestOptions {
  /** On a 401, only throw: keep the visitor on the page instead of sending them to /login. */
  stayOnUnauthorized?: boolean;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  // A refused sign-in is a 401 too, and its message (wrong email or password) belongs on the
  // form: it falls through below. Any other 401 means the session is gone.
  if (res.status === 401 && !AUTH_ATTEMPTS.has(path)) {
    if (!options.stayOnUnauthorized) clearAuthAndRedirect();
    throw new ApiError("UNAUTHORIZED", translate(currentLocale(), "error.session_expired"));
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      "NON_JSON_RESPONSE",
      translate(currentLocale(), "error.unexpected_response", { status: `${res.status} ${res.statusText}` })
    );
  }

  const json: ApiResponse<T> = await res.json();

  if (isErrorResponse(json)) {
    throw new ApiError(json.error.code, json.error.message, json.error.details);
  }

  return json.data;
}

/** Like request(), but keeps the whole envelope for endpoints that add fields next to `data`. */
async function requestEnvelope<T, M extends object = Record<string, unknown>>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiSuccessResponse<T> & M> {
  const res = await fetch(`${BASE_URL}${path}`, { method, headers: buildHeaders(), body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401) {
    clearAuthAndRedirect();
    throw new ApiError("UNAUTHORIZED", translate(currentLocale(), "error.session_expired"));
  }
  const json = (await res.json()) as ApiResponse<T> & M;
  if (isErrorResponse(json)) {
    throw new ApiError(json.error.code, json.error.message, json.error.details);
  }
  return json;
}

/** Poll until `done(value)` is true; resolves the last value, rejects after `maxAttempts`. */
export async function poll<T>(
  fetchOnce: () => Promise<T>,
  done: (value: T) => boolean,
  { intervalMs = 3000, maxAttempts = 100 }: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const value = await fetchOnce();
    if (done(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new ApiError("TIMEOUT", translate(currentLocale(), "error.timeout"));
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  getEnvelope: <T, M extends object = Record<string, unknown>>(path: string) =>
    requestEnvelope<T, M>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, body, options),
  del: <T>(path: string) => request<T>("DELETE", path),
};

export { ApiError };
