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

function extractArray<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function extractItem<T>(data: any): T | null {
  if (!data) return null;
  if (data.data !== undefined && data.data !== null) return data.data;
  return data;
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
  searchParams.set('limit', String(params?.limit || 200));

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const res = await fetchApi<any>(`/locations${queryStr}`);
  if (res.error || !res.data) {
    return [];
  }
  return extractArray<LocationItem>(res.data);
}

export async function fetchLocationTree(): Promise<LocationItem[]> {
  const res = await fetchApi<any>('/locations/tree');
  if (res.error || !res.data) {
    return [];
  }
  return extractArray<LocationItem>(res.data);
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

  const res = await fetchApi<any>(
    `/locations/autocomplete?${searchParams.toString()}`,
  );
  if (res.error || !res.data) {
    return [];
  }
  return extractArray<LocationAutocompleteItem>(res.data);
}

export async function fetchLocationChildren(parentId?: string): Promise<LocationItem[]> {
  const endpoint = parentId ? `/locations/${parentId}/children` : '/locations';
  const res = await fetchApi<any>(endpoint);
  if (res.error || !res.data) {
    return [];
  }
  return extractArray<LocationItem>(res.data);
}

export async function fetchLocationById(id: string): Promise<LocationItem | null> {
  const res = await fetchApi<any>(`/locations/${id}`);
  if (res.error || !res.data) {
    return null;
  }
  return extractItem<LocationItem>(res.data);
}

export async function fetchLocationBySlug(slug: string): Promise<LocationItem | null> {
  const res = await fetchApi<any>(`/locations/slug/${slug}`);
  if (res.error || !res.data) {
    return null;
  }
  return extractItem<LocationItem>(res.data);
}

export async function addCustomLocation(payload: {
  name: string;
  type: string;
  parentId?: string;
  cityName?: string;
  stateName?: string;
}): Promise<LocationItem | null> {
  const res = await fetchApi<any>('/locations/add-custom', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.error || !res.data) {
    return null;
  }
  return extractItem<LocationItem>(res.data);
}

