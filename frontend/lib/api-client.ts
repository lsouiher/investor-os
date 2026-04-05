const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearAuthAndRedirect();
    throw new ApiError("UNAUTHORIZED", "Session expired");
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      "NON_JSON_RESPONSE",
      `Server returned an unexpected response (${res.status} ${res.statusText})`
    );
  }

  const json: ApiResponse<T> = await res.json();

  if (isErrorResponse(json)) {
    throw new ApiError(json.error.code, json.error.message, json.error.details);
  }

  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

export { ApiError };
