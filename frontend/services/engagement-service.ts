import { fetchApi } from '@/lib/api-client';

export interface WishlistItem {
  _id: string;
  userId: string;
  propertyId: any;
  notes?: string;
  createdAt: string;
}

export interface SavedSearch {
  _id: string;
  userId: string;
  name?: string;
  keyword?: string;
  filters: {
    purpose?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    city?: string;
    locality?: string;
    amenities?: string[];
    [key: string]: any;
  };
  alertsEnabled: boolean;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface SiteVisitItem {
  _id: string;
  buyerId: any;
  propertyId: any;
  agentId: any;
  preferredDate: string;
  preferredTimeSlot: string;
  buyerName: string;
  buyerMobile: string;
  buyerEmail?: string;
  message?: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'REJECTED';
  rescheduledDate?: string;
  rescheduledTimeSlot?: string;
  agentNotes?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface ConversationItem {
  _id: string;
  participants: any[];
  otherParticipant?: any;
  propertyContext?: {
    propertyId: string;
    title: string;
    price: number;
    image?: string;
    slug?: string;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageItem {
  _id: string;
  conversationId: string;
  senderId: any;
  receiverId: any;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  userId: any;
  propertyId?: any;
  agentId?: any;
  rating: number;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  createdAt: string;
}

export interface AgentAnalytics {
  overview: {
    totalLeads: number;
    newLeads: number;
    contacted: number;
    followUp: number;
    qualified: number;
    interested: number;
    siteVisits: number;
    negotiations: number;
    converted: number;
    lost: number;
    conversionRate: number;
  };
  leadsBySource: Array<{ _id: string; count: number }>;
  leadsByProperty: Array<{ _id: string; title: string; count: number }>;
  monthlyLeads: Array<{ _id: string; count: number }>;
  funnel: Array<{ stage: string; count: number; rate: number }>;
}

export const EngagementService = {
  // 15.1 Wishlist
  async getWishlist(page = 1, limit = 20) {
    const res = await fetchApi<any>(`/wishlist?page=${page}&limit=${limit}`);
    return { success: !res.error, data: res.data?.items || res.data || [] };
  },

  async addToWishlist(propertyId: string, notes?: string) {
    const res = await fetchApi<any>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ propertyId, notes }),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async removeFromWishlist(propertyId: string) {
    const res = await fetchApi<any>(`/wishlist/${propertyId}`, {
      method: 'DELETE',
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async checkWishlist(propertyId: string) {
    const res = await fetchApi<any>(`/wishlist/check/${propertyId}`);
    return { success: !res.error, isSaved: !!res.data?.isSaved };
  },

  // 15.2 & 15.3 Saved Searches & Alerts
  async getSavedSearches() {
    const res = await fetchApi<any>('/saved-searches');
    return { success: !res.error, data: (res.data?.items || res.data || []) as SavedSearch[] };
  },

  async createSavedSearch(payload: { name?: string; keyword?: string; filters: any; alertsEnabled?: boolean }) {
    const res = await fetchApi<any>('/saved-searches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async updateSavedSearch(id: string, payload: { name?: string; alertsEnabled?: boolean; filters?: any }) {
    const res = await fetchApi<any>(`/saved-searches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async deleteSavedSearch(id: string) {
    const res = await fetchApi<any>(`/saved-searches/${id}`, {
      method: 'DELETE',
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  // 15.4 Notification Center
  async getNotifications(page = 1, limit = 30) {
    const res = await fetchApi<any>(`/notifications?page=${page}&limit=${limit}`);
    return { success: !res.error, data: (res.data?.items || res.data || []) as NotificationItem[] };
  },

  async getUnreadNotificationCount() {
    const res = await fetchApi<any>('/notifications/unread-count');
    return { success: !res.error, count: res.data?.unreadCount || 0 };
  },

  async markNotificationRead(id: string) {
    const res = await fetchApi<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return { success: !res.error, data: res.data };
  },

  async markAllNotificationsRead() {
    const res = await fetchApi<any>('/notifications/read-all', {
      method: 'PATCH',
    });
    return { success: !res.error, data: res.data };
  },

  async deleteNotification(id: string) {
    const res = await fetchApi<any>(`/notifications/${id}`, {
      method: 'DELETE',
    });
    return { success: !res.error, data: res.data };
  },

  // 15.6 Site Visits
  async requestSiteVisit(payload: {
    propertyId: string;
    preferredDate: string;
    preferredTime: string;
    buyerPhone?: string;
    notes?: string;
  }) {
    const res = await fetchApi<any>('/site-visits', {
      method: 'POST',
      body: JSON.stringify({
        propertyId: payload.propertyId,
        preferredDate: payload.preferredDate,
        preferredTimeSlot: payload.preferredTime,
        buyerMobile: payload.buyerPhone,
        message: payload.notes,
      }),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async getMySiteVisits(role?: 'BUYER' | 'AGENT') {
    const endpoint = role ? `/site-visits?role=${role}` : '/site-visits';
    const res = await fetchApi<any>(endpoint);
    return { success: !res.error, data: (res.data?.items || res.data || []) as SiteVisitItem[] };
  },

  async updateSiteVisitStatus(id: string, status: string, notes?: string, rescheduledDate?: string, rescheduledTime?: string) {
    const res = await fetchApi<any>(`/site-visits/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        agentNotes: notes,
        rescheduledDate,
        rescheduledTimeSlot: rescheduledTime,
      }),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  // 15.7 Messaging / Chat
  async getConversations() {
    const res = await fetchApi<any>('/conversations');
    return { success: !res.error, data: (res.data?.items || res.data || []) as ConversationItem[] };
  },

  async getOrCreateConversation(recipientId: string, propertyId?: string) {
    const res = await fetchApi<any>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipientId, propertyId }),
    });
    return { success: !res.error, data: res.data as ConversationItem, error: res.error };
  },

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const res = await fetchApi<any>(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return { success: !res.error, data: (res.data?.items || res.data || []) as MessageItem[] };
  },

  async sendMessage(conversationId: string, content: string) {
    const res = await fetchApi<any>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return { success: !res.error, data: res.data as MessageItem, error: res.error };
  },

  // 15.8 Agent Analytics
  async getAgentAnalytics() {
    const res = await fetchApi<any>('/agent/analytics/conversion');
    return { success: !res.error, data: res.data as AgentAnalytics, error: res.error };
  },

  // 15.9 Reviews
  async getPropertyReviews(propertyId: string) {
    const res = await fetchApi<any>(`/reviews/property/${propertyId}`);
    return { success: !res.error, data: (res.data?.items || res.data || []) as Review[] };
  },

  async submitReview(payload: { propertyId?: string; agentId?: string; rating: number; comment?: string }) {
    const res = await fetchApi<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  // 15.10 Reports & Comparison
  async submitPropertyReport(payload: { propertyId: string; reason: string; description: string }) {
    const res = await fetchApi<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: !res.error, data: res.data, error: res.error };
  },

  async compareProperties(propertyIds: string[]) {
    const res = await fetchApi<any>('/compare', {
      method: 'POST',
      body: JSON.stringify({ propertyIds }),
    });
    return { success: !res.error, data: res.data || [], error: res.error };
  },
};
