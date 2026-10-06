const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api/v1';

export async function fetchAdminApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null; isBackendAvailable: boolean; status?: number }> {
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
