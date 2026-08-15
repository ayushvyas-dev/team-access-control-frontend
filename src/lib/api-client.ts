const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: { fieldErrors: Record<string, string[]>; formErrors: string[] }
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options || {};

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions?.headers,
    },
  });

  if (res.status === 401 && !skipAuth) {
    // Deduplicate concurrent refresh attempts
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshTokens();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (!refreshed) {
      // Only redirect if not already on an auth page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = ['/login', '/register', '/verify-email'].includes(currentPath);
        if (!isAuthPage) {
          window.location.href = '/login';
        }
      }
      throw new ApiError('Session expired', 401);
    }

    // Retry original request once
    const retryRes = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
    });

    const retryBody = await retryRes.json();
    if (!retryRes.ok) {
      throw new ApiError(retryBody.message || 'Request failed', retryRes.status, retryBody.errors);
    }
    return retryBody as T;
  }

  const body = await res.json();

  if (!res.ok) {
    throw new ApiError(body.message || 'Request failed', res.status, body.errors);
  }

  return body as T;
}
