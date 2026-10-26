import { fetchApi, getApiBaseUrl } from '@/lib/api-client';
import {
  Property,
  SearchPropertiesParams,
  PaginatedResponse,
  FeaturedPropertyRequest,
  CreateFeaturedRequestPayload,
} from '@/types';

// Fake/demo mock dataset removed - live MongoDB Atlas database is the sole source of truth
export const DEV_FALLBACK_PROPERTIES: Property[] = [];

// ==========================================
// LOCATION-BASED PRIORITIZATION HELPER
// ==========================================

export function sortPropertiesByLocation(
  properties: Property[],
  targetCity?: string,
  targetState?: string
): Property[] {
  if (!targetCity && !targetState) return properties;

  const normCity = (targetCity || '').toLowerCase().trim();
  const normState = (targetState || '').toLowerCase().trim();

  return [...properties].sort((a, b) => {
    const aCity = (a.location?.city || '').toLowerCase().trim();
    const bCity = (b.location?.city || '').toLowerCase().trim();
    const aState = (a.location?.state || '').toLowerCase().trim();
    const bState = (b.location?.state || '').toLowerCase().trim();

    // 1. Exact city match gets top priority
    const aCityMatch = Boolean(normCity && normCity !== 'all' && (aCity === normCity || aCity.includes(normCity) || normCity.includes(aCity)));
    const bCityMatch = Boolean(normCity && normCity !== 'all' && (bCity === normCity || bCity.includes(normCity) || normCity.includes(bCity)));
    if (aCityMatch && !bCityMatch) return -1;
    if (!aCityMatch && bCityMatch) return 1;

    // 2. State match gets second priority
    const aStateMatch = Boolean(normState && normState !== 'all' && (aState === normState || aState.includes(normState) || normState.includes(aState)));
    const bStateMatch = Boolean(normState && normState !== 'all' && (bState === normState || bState.includes(normState) || normState.includes(bState)));
    if (aStateMatch && !bStateMatch) return -1;
    if (!aStateMatch && bStateMatch) return 1;

    // 3. Keep featured first within same priority
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;

    return 0;
  });
}

// ==========================================
// PUBLIC MARKETPLACE SERVICES
// ==========================================

export async function getFeaturedProperties(options?: {
  userCity?: string;
  userState?: string;
}): Promise<{
  properties: Property[];
  source: 'api';
}> {
  // 1. Try to fetch properties explicitly marked as featured
  const result = await fetchApi<Property[]>('/properties?featured=true', { cache: 'no-store' });
  if (result.isBackendAvailable && result.data && Array.isArray(result.data) && result.data.length > 0) {
    const sorted = sortPropertiesByLocation(result.data, options?.userCity, options?.userState);
    return { properties: sorted, source: 'api' };
  }

  // 2. If no properties are specifically marked featured, fetch active published properties
  // from MongoDB Atlas (sorted with featured first, newest first) so real listings appear dynamically
  const allResult = await fetchApi<Property[]>('/properties', { cache: 'no-store' });
  if (allResult.isBackendAvailable && allResult.data && Array.isArray(allResult.data) && allResult.data.length > 0) {
    const sorted = sortPropertiesByLocation(allResult.data, options?.userCity, options?.userState);
    return { properties: sorted, source: 'api' };
  }

  // 3. If no published properties exist in database, return empty array (never fake listings)
  return { properties: [], source: 'api' };
}

export interface GetPropertiesFilterOptions {
  category?: string;
  type?: string;
  listingType?: string;
  country?: string;
  state?: string;
  city?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  q?: string;
  featured?: boolean;
  hasVideo?: boolean;
  userCity?: string;
  userState?: string;
}

export async function getProperties(params?: GetPropertiesFilterOptions): Promise<{
  properties: Property[];
  source: 'api' | 'fallback_dev';
}> {
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }
  const typeVal = params?.listingType || params?.type;
  if (typeVal && typeVal !== 'all') {
    searchParams.set('listingType', typeVal);
    searchParams.set('type', typeVal);
  }
  if (params?.country && params.country !== 'all') {
    searchParams.set('country', params.country);
  }
  if (params?.state && params.state !== 'all') {
    searchParams.set('state', params.state);
  }
  if (params?.city && params.city !== 'all') {
    searchParams.set('city', params.city);
  }
  if (params?.minPrice !== undefined && params.minPrice !== '') {
    searchParams.set('minPrice', String(params.minPrice));
  }
  if (params?.maxPrice !== undefined && params.maxPrice !== '') {
    searchParams.set('maxPrice', String(params.maxPrice));
  }
  if (params?.q && params.q.trim()) {
    searchParams.set('q', params.q.trim());
  }
  if (params?.featured) {
    searchParams.set('featured', 'true');
  }
  if (params?.hasVideo) {
    searchParams.set('hasVideo', 'true');
  }

  const endpoint = `/properties${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const result = await fetchApi<Property[]>(endpoint, { cache: 'no-store' });

  if (result.isBackendAvailable && result.data && Array.isArray(result.data)) {
    const sorted = sortPropertiesByLocation(
      result.data,
      params?.city && params.city !== 'all' ? params.city : params?.userCity,
      params?.state && params.state !== 'all' ? params.state : params?.userState
    );
    return { properties: sorted, source: 'api' };
  }

  // Never return fake/demo properties to the live platform
  return { properties: [], source: 'api' };
}

/**
 * Phase 07 — Multi-Facet Public Property Search & Discovery
 */
export async function searchProperties(params?: SearchPropertiesParams): Promise<PaginatedResponse<Property>> {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.set(key, String(value));
      }
    });
  }

  const endpoint = `/properties/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const result = await fetchApi<PaginatedResponse<Property>>(endpoint, { cache: 'no-store' });

  if (result.isBackendAvailable && result.data && Array.isArray(result.data.data)) {
    return result.data;
  }

  // Never return fake/demo properties to the live platform
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 12;
  return {
    data: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export async function getPropertyBySlug(slug: string): Promise<{
  property: Property | null;
  source: 'api';
}> {
  const result = await fetchApi<Property>(`/properties/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (result.isBackendAvailable && result.data) {
    return { property: result.data, source: 'api' };
  }

  return { property: null, source: 'api' };
}

export async function getSimilarProperties(
  category: string,
  excludeSlug: string,
): Promise<Property[]> {
  const res = await getProperties({ category });
  return res.properties.filter((p) => p.slug !== excludeSlug).slice(0, 3);
}

// ==========================================
// OWNER & AGENT DASHBOARD SERVICES
// ==========================================

export async function createProperty(payload: any): Promise<Property> {
  const result = await fetchApi<Property>('/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to create property in database.');
  }

  return result.data;
}

export async function getMyProperties(): Promise<Property[]> {
  const result = await fetchApi<Property[]>('/properties/user/my');
  if (result.isBackendAvailable && result.data && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

export async function getMyPropertyById(id: string): Promise<Property> {
  const result = await fetchApi<Property>(`/properties/user/my/${encodeURIComponent(id)}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch property.');
  }
  return result.data;
}

export async function updateProperty(id: string, payload: any): Promise<Property> {
  const result = await fetchApi<Property>(`/properties/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to update property.');
  }

  return result.data;
}

export async function submitPropertyForApproval(id: string): Promise<{ success: boolean; message: string; property: Property }> {
  const result = await fetchApi<{ success: boolean; message: string; property: Property }>(
    `/properties/${encodeURIComponent(id)}/submit`,
    {
      method: 'POST',
    },
  );

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to submit property for moderation.');
  }

  return result.data;
}

export async function deleteProperty(id: string): Promise<{ success: boolean; message: string }> {
  const result = await fetchApi<{ success: boolean; message: string }>(
    `/properties/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to delete property.');
  }

  return result.data;
}

export async function uploadPropertyVideo(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ url: string; videoType: string; originalName?: string; size?: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    const apiBase = getApiBaseUrl();

    xhr.open('POST', `${apiBase}/properties/upload-video`);

    // Attach auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('casa_access_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      let resp: any = null;
      try {
        resp = JSON.parse(xhr.responseText);
      } catch {
        resp = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const data = resp?.data !== undefined ? resp.data : resp;
        resolve(data);
      } else {
        const errorMsg =
          resp?.message || resp?.error || `Upload failed with status ${xhr.status}`;
        const finalMsg = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg;
        reject(new Error(finalMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during video upload. Please check your connection.'));
    };

    xhr.send(formData);
  });
}

export async function createFeaturedRequest(
  payload: CreateFeaturedRequestPayload,
): Promise<{ success: boolean; message: string; request: FeaturedPropertyRequest }> {
  const result = await fetchApi<{ success: boolean; message: string; request: FeaturedPropertyRequest }>(
    '/properties/featured-requests',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to submit featured property request.');
  }
  return result.data;
}

export async function getMyFeaturedRequests(): Promise<FeaturedPropertyRequest[]> {
  const result = await fetchApi<FeaturedPropertyRequest[]>('/properties/featured-requests/my');
  if (result.isBackendAvailable && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

