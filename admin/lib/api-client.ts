export function getAdminApiBaseUrl(): string {
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

export const API_BASE_URL = getAdminApiBaseUrl();

export async function fetchAdminApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<{ data: T | null; raw?: any; error: string | null; isBackendAvailable: boolean; status?: number }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    // Auto-attach stored admin access token if running in client environment and Authorization header is not set
    if (typeof window !== 'undefined' && !headers['Authorization'] && !headers['authorization']) {
      const storedToken = localStorage.getItem('casa_admin_access_token');
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: options?.credentials || 'include',
      headers,
      next: { revalidate: 0 },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        (json && (json.message || json.error)) || `API error: ${res.status} ${res.statusText}`;
      const parsedError = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg;
      if (res.status === 401 && typeof window !== 'undefined') {
        const lower = String(parsedError).toLowerCase();
        if (lower.includes('deactivated') || lower.includes('suspended')) {
          try {
            localStorage.removeItem('casa_admin_access_token');
            localStorage.removeItem('casa_admin_user');
          } catch {
            // ignore
          }
        }
      }
      return {
        data: null,
        error: parsedError,
        isBackendAvailable: true,
        status: res.status,
      };
    }

    // Preserve the full response if it contains queue/paginated metadata like items, counts, metrics, or pagination
    const hasQueueMetadata = Boolean(json && (json.items || json.counts || json.metrics || json.pagination));
    const dataToReturn = (hasQueueMetadata || json?.data === undefined) ? json : json.data;

    return {
      data: dataToReturn as T,
      raw: json,
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
