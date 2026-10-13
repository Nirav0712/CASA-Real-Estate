import { getAuthHeaders } from '@/lib/api-auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface AdminNotificationItem {
  id: string;
  rawId?: string;
  type: 'INQUIRY' | 'MODERATION' | 'KYC' | 'BILLING' | 'SYSTEM';
  badgeLabel: string;
  title: string;
  desc: string;
  time: string;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  propertyTitle?: string;
  propertyId?: string;
  priority?: string;
  status?: string;
  isRead: boolean;
  link?: string;
}

export interface AdminNotificationResponse {
  data: AdminNotificationItem[];
  unreadCount: number;
  total: number;
  timestamp: string;
}

export async function getAdminNotifications(params?: {
  limit?: number;
  type?: string;
  unreadOnly?: boolean;
}): Promise<AdminNotificationResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.type && params.type !== 'ALL') query.append('type', params.type);
  if (params?.unreadOnly) query.append('unreadOnly', 'true');

  const res = await fetch(`${API_BASE_URL}/admin/notifications?${query.toString()}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message || json?.error || 'Failed to fetch admin notifications');
  }

  const payload = json?.data !== undefined ? json.data : json;
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
  const unreadCount = typeof payload?.unreadCount === 'number' ? payload.unreadCount : list.filter((n: any) => !n.isRead).length;

  return {
    data: list,
    unreadCount,
    total: payload?.total || list.length,
    timestamp: payload?.timestamp || new Date().toISOString(),
  };
}

export async function markAdminNotificationRead(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message || json?.error || 'Failed to mark notification as read');
  }
  return json;
}

export async function markAllAdminNotificationsRead(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/notifications/mark-all-read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message || json?.error || 'Failed to mark all as read');
  }
  return json;
}
