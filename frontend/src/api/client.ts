export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions<T> = {
  method?: HttpMethod;
  body?: T;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

type ApiError = Error & {
  status: number;
  code?: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export async function apiFetch<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const { method = 'GET', body, signal, headers = {} } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error: ApiError = new Error('API request failed') as ApiError;
    error.status = response.status;
    try {
      const payload = await response.json();
      error.message = payload.message ?? error.message;
      error.code = payload.code;
    } catch (parseError) {
      console.error('Failed to parse error response', parseError);
    }
    throw error;
  }

  if (response.status === 204) {
    return null as TResponse;
  }

  return (await response.json()) as TResponse;
}
