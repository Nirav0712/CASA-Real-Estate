import { fetchAdminApi } from '@/lib/api-client';
import { LocationRecord, CreateLocationInput, LocationType } from '@/types';

export interface LocationQueryParams {
  q?: string;
  type?: LocationType;
  parentId?: string;
  countryCode?: string;
  stateCode?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedLocationsResponse {
  items: LocationRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function getAdminLocations(params?: LocationQueryParams): Promise<{
  data: PaginatedLocationsResponse | null;
  error: string | null;
}> {
  const searchParams = new URLSearchParams();
  if (params?.q && params.q.trim()) searchParams.set('q', params.q.trim());
  if (params?.type) searchParams.set('type', params.type);
  if (params?.parentId) searchParams.set('parentId', params.parentId);
  if (params?.countryCode) searchParams.set('countryCode', params.countryCode);
  if (params?.stateCode) searchParams.set('stateCode', params.stateCode);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params?.isFeatured !== undefined) searchParams.set('isFeatured', String(params.isFeatured));
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const result = await fetchAdminApi<any>(`/admin/locations${queryStr}`);

  if (result.error) {
    return { data: null, error: result.error };
  }

  if (result.data) {
    return {
      data: {
        items: result.data.items || result.data || [],
        total: result.data.pagination?.total ?? (Array.isArray(result.data) ? result.data.length : 0),
        page: result.data.pagination?.page ?? 1,
        limit: result.data.pagination?.limit ?? 20,
        pages: result.data.pagination?.pages ?? 1,
      },
      error: null,
    };
  }

  return { data: null, error: 'No data returned from server' };
}

export async function getAdminLocationTree(): Promise<{
  tree: LocationRecord[];
  error: string | null;
}> {
  const result = await fetchAdminApi<LocationRecord[]>('/admin/locations/tree');
  if (result.error) {
    return { tree: [], error: result.error };
  }
  return { tree: result.data || [], error: null };
}

export async function getAdminLocationById(id: string): Promise<{
  location: LocationRecord | null;
  error: string | null;
}> {
  const result = await fetchAdminApi<LocationRecord>(`/admin/locations/${id}`);
  return { location: result.data, error: result.error };
}

export async function createAdminLocation(input: CreateLocationInput): Promise<{
  location: LocationRecord | null;
  error: string | null;
}> {
  const result = await fetchAdminApi<LocationRecord>('/admin/locations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return { location: result.data, error: result.error };
}

export async function updateAdminLocation(
  id: string,
  input: Partial<CreateLocationInput>,
): Promise<{
  location: LocationRecord | null;
  error: string | null;
}> {
  const result = await fetchAdminApi<LocationRecord>(`/admin/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return { location: result.data, error: result.error };
}

export async function activateAdminLocation(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const result = await fetchAdminApi<any>(`/admin/locations/${id}/activate`, {
    method: 'PATCH',
  });
  return { success: !result.error, error: result.error };
}

export async function deactivateAdminLocation(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const result = await fetchAdminApi<any>(`/admin/locations/${id}/deactivate`, {
    method: 'PATCH',
  });
  return { success: !result.error, error: result.error };
}

export async function deleteAdminLocation(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const result = await fetchAdminApi<any>(`/admin/locations/${id}`, {
    method: 'DELETE',
  });
  return { success: !result.error, error: result.error };
}

export async function getPublicLocationChildren(parentId?: string): Promise<{
  children: LocationRecord[];
  error: string | null;
}> {
  const endpoint = parentId ? `/locations/${parentId}/children` : '/locations';
  const result = await fetchAdminApi<LocationRecord[]>(endpoint);
  return { children: result.data || [], error: result.error };
}
