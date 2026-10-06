import { fetchApi } from '@/lib/api-client';

export interface BackendHealth {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: {
    status: string;
    connected: boolean;
  };
}

export async function checkBackendHealth(): Promise<{
  isOnline: boolean;
  health: BackendHealth | null;
}> {
  const result = await fetchApi<BackendHealth>('/health', {
    cache: 'no-store',
  });

  if (result.isBackendAvailable && result.data) {
    return {
      isOnline: true,
      health: result.data,
    };
  }

  return {
    isOnline: false,
    health: null,
  };
}
