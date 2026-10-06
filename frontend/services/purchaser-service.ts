import { fetchApi } from '@/lib/api-client';
import {
  PurchaserDashboardData,
  PurchaserProfile,
  SavedPropertyItem,
  RecentlyViewedItem,
  PurchaserEnquiryItem,
  Property,
  PaginatedResponse,
  PurchaserPreferences,
} from '@/types';

export interface UpdatePurchaserProfilePayload {
  name?: string;
  email?: string;
  avatar?: string;
  preferredLanguage?: string;
  preferredCity?: string;
  preferredLocation?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredCategory?: string;
  preferredListingType?: string;
  bedrooms?: number;
  furnishing?: string;
}

/**
 * 1. Get Aggregated Purchaser Dashboard Data
 */
export async function getPurchaserDashboard(): Promise<PurchaserDashboardData> {
  const res = await fetchApi<PurchaserDashboardData>('/purchaser/dashboard');
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to load purchaser dashboard');
  }
  return res.data;
}

/**
 * 2. Get Purchaser Profile
 */
export async function getPurchaserProfile(): Promise<PurchaserProfile> {
  const res = await fetchApi<PurchaserProfile>('/purchaser/profile');
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to fetch purchaser profile');
  }
  return res.data;
}

/**
 * 3. Update Purchaser Profile
 */
export async function updatePurchaserProfile(
  payload: UpdatePurchaserProfilePayload,
): Promise<{ success: boolean; message: string; user: PurchaserProfile }> {
  const res = await fetchApi<{ success: boolean; message: string; user: PurchaserProfile }>(
    '/purchaser/profile',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to update profile');
  }
  return res.data;
}

/**
 * 4. Get Paginated Saved Properties
 */
export async function getSavedProperties(
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedResponse<SavedPropertyItem>> {
  const res = await fetchApi<PaginatedResponse<SavedPropertyItem>>(
    `/purchaser/saved-properties?page=${page}&limit=${limit}`,
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to fetch saved properties');
  }
  return res.data;
}

/**
 * 5. Get Quick Array of Saved Property IDs
 */
export async function getSavedPropertyIds(): Promise<string[]> {
  const res = await fetchApi<string[]>('/purchaser/saved-properties/ids');
  if (res.error || !res.data) {
    return [];
  }
  return res.data;
}

/**
 * 6. Check if Property is Saved
 */
export async function isPropertySaved(propertyId: string): Promise<boolean> {
  const res = await fetchApi<{ isSaved: boolean }>(
    `/purchaser/saved-properties/${encodeURIComponent(propertyId)}/status`,
  );
  return !!res.data?.isSaved;
}

/**
 * 7. Save Property to Favorites
 */
export async function saveProperty(
  propertyId: string,
): Promise<{ success: boolean; message: string; savedId?: string }> {
  const res = await fetchApi<{ success: boolean; message: string; savedId?: string }>(
    `/purchaser/saved-properties/${encodeURIComponent(propertyId)}`,
    { method: 'POST' },
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to save property');
  }
  return res.data;
}

/**
 * 8. Remove Property from Favorites
 */
export async function unsaveProperty(
  propertyId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetchApi<{ success: boolean; message: string }>(
    `/purchaser/saved-properties/${encodeURIComponent(propertyId)}`,
    { method: 'DELETE' },
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to remove saved property');
  }
  return res.data;
}

/**
 * 9. Record Recently Viewed Property
 */
export async function recordRecentlyViewed(propertyId: string): Promise<void> {
  try {
    await fetchApi(`/purchaser/recently-viewed/${encodeURIComponent(propertyId)}`, {
      method: 'POST',
    });
  } catch {
    // Silent fail for non-blocking view tracking
  }
}

/**
 * 10. Get Recently Viewed Properties
 */
export async function getRecentlyViewed(limit: number = 20): Promise<RecentlyViewedItem[]> {
  const res = await fetchApi<RecentlyViewedItem[]>(`/purchaser/recently-viewed?limit=${limit}`);
  if (res.error || !res.data) {
    return [];
  }
  return res.data;
}

/**
 * 11. Get Paginated Purchaser Enquiries
 */
export async function getPurchaserEnquiries(params?: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}): Promise<PaginatedResponse<PurchaserEnquiryItem>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.status && params.status !== 'ALL') query.append('status', params.status);
  if (params?.q) query.append('q', params.q);

  const res = await fetchApi<PaginatedResponse<PurchaserEnquiryItem>>(
    `/purchaser/enquiries?${query.toString()}`,
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to load enquiries');
  }
  return res.data;
}

/**
 * 12. Get Single Purchaser Enquiry Details
 */
export async function getPurchaserEnquiryById(id: string): Promise<PurchaserEnquiryItem> {
  const res = await fetchApi<PurchaserEnquiryItem>(`/purchaser/enquiries/${id}`);
  if (res.error || !res.data) {
    throw new Error(res.error || 'Enquiry not found or access denied');
  }
  return res.data;
}

/**
 * 13. Cancel Purchaser Enquiry
 */
export async function cancelPurchaserEnquiry(
  id: string,
  reason?: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetchApi<{ success: boolean; message: string }>(
    `/purchaser/enquiries/${id}/cancel`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    },
  );
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to cancel enquiry');
  }
  return res.data;
}

/**
 * 14. Get Property Recommendations
 */
export async function getPurchaserRecommendations(limit: number = 6): Promise<Property[]> {
  const res = await fetchApi<Property[]>(`/purchaser/recommendations?limit=${limit}`);
  if (res.error || !res.data) {
    return [];
  }
  return res.data;
}
