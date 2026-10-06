const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://snow-cod-326067.hostingersite.com/api/v1';

export interface OperationsOverview {
  operationalQueues: {
    pendingPropertyApprovals: number;
    pendingAgentVerifications: number;
    activePaidPromotions: number;
    pendingFollowUpTasks: number;
    totalRegisteredUsers: number;
  };
  systemHealth: string;
  lastEvaluatedAt: string;
}

export interface FunnelIntelligence {
  stages: Array<{ name: string; count: number; dropOffPercentage: number }>;
  metrics: {
    viewToEnquiryRate: string;
    enquiryToVisitRate: string;
    visitToConversionRate: string;
    averageResponseTimeHours: number;
  };
}

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

export class AdminIntelligenceService {
  static async getOperationsOverview(token: string): Promise<OperationsOverview | null> {
    try {
      const url = `${API_BASE_URL}/admin/intelligence/operations-overview`;
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

  static async getConversionFunnel(token: string): Promise<FunnelIntelligence | null> {
    try {
      const url = `${API_BASE_URL}/market-intelligence/funnel`;
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

  static async getPricingIntelligence(city?: string): Promise<PricingIntelligence | null> {
    try {
      const url = `${API_BASE_URL}/market-intelligence/pricing${city ? `?city=${encodeURIComponent(city)}` : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }
}
