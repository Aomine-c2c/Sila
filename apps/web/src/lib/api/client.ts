/**
 * NEXORA API Client
 * Central HTTP client for all NEXORA backend calls.
 * Reads token from auth store automatically.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token getter — injected so we don't import the store server-side
let _getToken: (() => string | null) | null = null;

export function configureApiClient(getToken: () => string | null) {
  _getToken = getToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = _getToken?.();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = { detail: res.statusText };
    }
    const errorBody = data as { detail?: string; message?: string } | null;
    const detail = errorBody?.detail ?? errorBody?.message ?? `API Error: ${res.status}`;
    throw new ApiError(res.status, data, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
