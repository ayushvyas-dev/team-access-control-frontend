const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: {
      fieldErrors: Record<string, string[]>;
      formErrors: string[];
    },
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit & { skipAuth?: boolean },
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options || {};

  // Helper to safely parse JSON or return null on empty body (204, 304)
  const parseResponseBody = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const executeFetch = async () => {
    return fetch(`${BASE_URL}${path}`, {
      cache: "no-store", // Prevent 304 caching issues on dynamic data
      ...fetchOptions,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions?.headers,
      },
    });
  };

  let res = await executeFetch();

  if (res.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshTokens();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (!refreshed) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const isAuthPage = ["/login", "/register", "/verify-email"].includes(
          currentPath,
        );
        if (!isAuthPage) {
          window.location.href = "/login";
        }
      }
      throw new ApiError("Session expired", 401);
    }

    // Retry original request once
    res = await executeFetch();
  }

  const body = await parseResponseBody(res);

  // Consider 2xx and 304 as valid non-error statuses
  const isSuccess = res.ok || res.status === 304;

  if (!isSuccess) {
    const errorMessage =
      (body && typeof body === "object" && body.message) || "Request failed";
    const errors = body && typeof body === "object" ? body.errors : undefined;

    throw new ApiError(errorMessage, res.status, errors);
  }

  return body as T;
}
