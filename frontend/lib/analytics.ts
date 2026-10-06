import { fetchApi } from './api-client';

export type MarketplaceEventType =
  | 'PROPERTY_VIEW'
  | 'PROPERTY_SEARCH'
  | 'PROPERTY_FILTER'
  | 'PROPERTY_SAVE'
  | 'PROPERTY_UNSAVE'
  | 'SEARCH_SAVED'
  | 'SEARCH_ALERT_TRIGGERED'
  | 'ENQUIRY_CREATED'
  | 'CONTACT_AGENT'
  | 'CALL_REQUEST'
  | 'WHATSAPP_CLICK'
  | 'CHAT_STARTED'
  | 'MESSAGE_SENT'
  | 'SITE_VISIT_REQUESTED'
  | 'SITE_VISIT_CONFIRMED'
  | 'PROPERTY_SHARED'
  | 'PROPERTY_COMPARED'
  | 'REVIEW_SUBMITTED'
  | 'REPORT_SUBMITTED';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sId = localStorage.getItem('casa_session_id');
  if (!sId) {
    sId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('casa_session_id', sId);
  }
  return sId;
}

export function getDeviceCategory(): string {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export async function trackMarketplaceEvent(
  eventType: MarketplaceEventType,
  payload?: {
    propertyId?: string;
    location?: { city?: string; locality?: string; state?: string };
    metadata?: Record<string, any>;
  },
) {
  try {
    const sessionId = getSessionId();
    const device = getDeviceCategory();
    const referrer = typeof document !== 'undefined' ? document.referrer : undefined;

    // Fire and forget
    fetchApi('/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        eventType,
        sessionId,
        propertyId: payload?.propertyId,
        location: payload?.location,
        metadata: payload?.metadata || {},
        device,
        referrer,
      }),
    }).catch(() => {
      // Ignore network analytics errors quietly
    });
  } catch {
    // Ignore
  }
}
