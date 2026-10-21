export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return 'https://snow-cod-326067.hostingersite.com/api/v1';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://snow-cod-326067.hostingersite.com/api/v1';
  }
  return 'http://localhost:5000/api/v1';
}

export const API_BASE_URL = getApiBaseUrl();

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null; isBackendAvailable: boolean; status?: number }> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    // Auto-attach stored access token if running in client environment and Authorization header is not set
    if (typeof window !== 'undefined' && !headers['Authorization'] && !headers['authorization']) {
      const storedToken = localStorage.getItem('casa_access_token');
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      credentials: options?.credentials || 'include',
      headers,
      cache: options?.cache || (options?.method && options.method !== 'GET' ? 'no-store' : 'default'),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        (json && (json.message || json.error)) || `API error: ${res.status} ${res.statusText}`;
      return {
        data: null,
        error: Array.isArray(errorMsg) ? errorMsg[0] : errorMsg,
        isBackendAvailable: true,
        status: res.status,
      };
    }

    return {
      data: (json?.data !== undefined ? json.data : json) as T,
      error: null,
      isBackendAvailable: true,
      status: res.status,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network request failed';
    return {
      data: null,
      error: errorMsg,
      isBackendAvailable: false,
    };
  }
}
