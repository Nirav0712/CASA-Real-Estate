import { Property } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://snow-cod-326067.hostingersite.com/api/v1';

export interface PricingIntelligence {
  disclaimer: string;
  city: string;
  category: string;
  listingType: string;
  totalActiveListings: number;
  averagePrice: number;
  medianPriceEstimate: number;
  minPrice: number;
  maxPrice: number;
  estimatedPricePerSqFt: number;
  priceDistribution: Array<{ label: string; percentage: number }>;
}

export interface RecommendationResponse {
  success: boolean;
  reason: string;
  count: number;
  data: Property[];
}

export interface BuyerIntent {
  score: number;
  level: 'LOW' | 'WARM' | 'HOT' | 'VERY_HOT';
  signals: Record<string, any>;
  lastEvaluatedAt: string;
}

export class IntelligenceService {
  static async getRecommendations(params?: {
    propertyId?: string;
    city?: string;
    limit?: number;
  }): Promise<RecommendationResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.propertyId) searchParams.append('propertyId', params.propertyId);
      if (params?.city) searchParams.append('city', params.city);
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const url = `${API_BASE_URL}/recommendations/properties?${searchParams.toString()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return { success: false, reason: '', count: 0, data: [] };
      return res.json();
    } catch {
      return { success: false, reason: '', count: 0, data: [] };
    }
  }

  static async getPricingIntelligence(city?: string): Promise<PricingIntelligence | null> {
    try {
      const url = `${API_BASE_URL}/market-intelligence/pricing${city ? `?city=${encodeURIComponent(city)}` : ''}`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  static async getBuyerIntent(token: string): Promise<BuyerIntent | null> {
    try {
      const url = `${API_BASE_URL}/buyer/intent`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }
}
