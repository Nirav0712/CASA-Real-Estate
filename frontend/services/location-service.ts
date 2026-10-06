import { fetchApi } from '@/lib/api-client';
import {
  LocationItem,
  LocationAutocompleteItem,
  LocationType,
} from '@/types';

export interface LocationSearchParams {
  q?: string;
  type?: LocationType;
  parentId?: string;
  countryCode?: string;
  stateCode?: string;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

export async function fetchLocations(params?: LocationSearchParams): Promise<LocationItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.parentId) searchParams.set('parentId', params.parentId);
  if (params?.countryCode) searchParams.set('countryCode', params.countryCode);
  if (params?.stateCode) searchParams.set('stateCode', params.stateCode);
  if (params?.isFeatured !== undefined) searchParams.set('isFeatured', String(params.isFeatured));
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const res = await fetchApi<any>(`/locations${queryStr}`);
  if (res.error || !res.data) {
    return [];
  }
  return Array.isArray(res.data) ? res.data : res.data.items || [];
}

export async function fetchLocationTree(): Promise<LocationItem[]> {
  const res = await fetchApi<LocationItem[]>('/locations/tree');
  if (res.error || !res.data) {
    return [];
  }
  return res.data;
}

export async function fetchLocationAutocomplete(
  q: string,
  type?: LocationType,
  parentId?: string,
  limit = 10,
): Promise<LocationAutocompleteItem[]> {
  if (!q || !q.trim()) return [];

  const searchParams = new URLSearchParams();
  searchParams.set('q', q.trim());
  if (type) searchParams.set('type', type);
  if (parentId) searchParams.set('parentId', parentId);
  searchParams.set('limit', String(limit));

  const res = await fetchApi<LocationAutocompleteItem[]>(
    `/locations/autocomplete?${searchParams.toString()}`,
  );
  if (res.error || !res.data) {
    return [];
  }
  return res.data;
}

export async function fetchLocationChildren(parentId?: string): Promise<LocationItem[]> {
  const endpoint = parentId ? `/locations/${parentId}/children` : '/locations';
  const res = await fetchApi<LocationItem[]>(endpoint);
  if (res.error || !res.data) {
    return [];
  }
  return Array.isArray(res.data) ? res.data : (res.data as any).items || [];
}

export async function fetchLocationById(id: string): Promise<LocationItem | null> {
  const res = await fetchApi<LocationItem>(`/locations/${id}`);
  if (res.error || !res.data) {
    return null;
  }
  return res.data;
}

export async function fetchLocationBySlug(slug: string): Promise<LocationItem | null> {
  const res = await fetchApi<LocationItem>(`/locations/slug/${slug}`);
  if (res.error || !res.data) {
    return null;
  }
  return res.data;
}
