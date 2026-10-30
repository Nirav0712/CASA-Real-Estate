import { getAuthHeaders } from '@/lib/api-auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface SeoOverviewData {
  totalEligible: number;
  validSeo: number;
  pagesMissingMetadata: number;
  pendingApproval: number;
  rejectedCount: number;
  criticalIssues: number;
  highIssues: number;
  duplicateTitles: number;
  duplicateDescriptions: number;
  redirectsCount: number;
  avgScore: number;
  sitemapAutoRegen: boolean;
  approvalMode: string;
  productionDomain: string;
}

export interface SeoMetadataItem {
  _id: string;
  id?: string;
  entityType: 'PROPERTY' | 'PAGE' | 'LOCATION' | 'CATEGORY' | 'PROJECT' | 'BLOG' | 'CUSTOM';
  entityId?: string;
  pageType: string;
  pagePath: string;
  canonicalUrl: string;
  slug?: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword?: string;
  relatedKeywords?: string[];
  robotsIndex: boolean;
  robotsFollow: boolean;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
  twitterCardType?: string;
  structuredData?: Record<string, any>;
  generationMode: string;
  generationStatus: string;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  generatedAt?: string;
  seoScore: number;
  validationErrors?: Array<{ code: string; message: string; severity: string }>;
  fieldLocks?: {
    metaTitle?: boolean;
    metaDescription?: boolean;
    canonicalUrl?: boolean;
    openGraph?: boolean;
    structuredData?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SeoSettingsData {
  websiteName: string;
  productionDomain: string;
  defaultTitleSuffix: string;
  defaultDescription: string;
  defaultOgImage: string;
  defaultLocale: string;
  templates: {
    homepageTitleTemplate: string;
    homepageDescTemplate: string;
    propertyTitleTemplate: string;
    propertyDescTemplate: string;
    locationTitleTemplate: string;
    locationDescTemplate: string;
    categoryTitleTemplate: string;
    categoryDescTemplate: string;
    fallbackTitleTemplate: string;
    fallbackDescTemplate: string;
  };
  automation: {
    autoGenerateOnCreate: boolean;
    autoRegenerateOnUpdate: boolean;
    approvalMode: 'AUTOMATIC' | 'MANUAL';
    aiEnabled: boolean;
  };
  indexing: {
    defaultRobotsIndex: boolean;
    defaultRobotsFollow: boolean;
    noindexEmptyLocations: boolean;
    soldPropertyPolicy: string;
  };
  sitemap: {
    autoRegenerateSitemap: boolean;
    excludePrivateAndDraft: boolean;
    batchSize: number;
  };
  robotsTxt: {
    customDirectives: string;
  };
}

export interface SeoAuditIssueItem {
  _id: string;
  url: string;
  entityType: string;
  entityId?: string;
  issueType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  recommendedFix: string;
  resolved: boolean;
  createdAt?: string;
}

export interface SeoRedirectItem {
  _id: string;
  oldPath: string;
  newPath: string;
  oldSlug?: string;
  newSlug?: string;
  entityType: string;
  statusCode: number;
  isActive: boolean;
  createdAt?: string;
}

export async function getSeoOverview(): Promise<SeoOverviewData> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/overview`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch SEO overview');
  return json;
}

export async function getSeoSettings(): Promise<SeoSettingsData> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/settings`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch SEO settings');
  return json;
}

export async function updateSeoSettings(payload: Partial<SeoSettingsData>): Promise<SeoSettingsData> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/settings`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to update SEO settings');
  return json;
}

export async function getSeoMetadataList(params: {
  entityType?: string;
  approvalStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: SeoMetadataItem[]; total: number; page: number; limit: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.entityType && params.entityType !== 'ALL') query.set('entityType', params.entityType);
  if (params.approvalStatus && params.approvalStatus !== 'ALL') query.set('approvalStatus', params.approvalStatus);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/seo/admin/metadata?${query.toString()}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch SEO metadata list');
  return json;
}

export async function getSeoMetadataById(id: string): Promise<SeoMetadataItem> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/metadata/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch metadata item');
  return json;
}

export async function updateSeoMetadata(id: string, payload: Partial<SeoMetadataItem>): Promise<SeoMetadataItem> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/metadata/${id}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to update metadata');
  return json;
}

export async function approveSeoMetadata(id: string): Promise<SeoMetadataItem> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/metadata/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to approve SEO metadata');
  return json;
}

export async function rejectSeoMetadata(id: string, reason: string): Promise<SeoMetadataItem> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/metadata/${id}/reject`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to reject SEO metadata');
  return json;
}

export async function regenerateSeoMetadata(id: string): Promise<SeoMetadataItem> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/metadata/${id}/regenerate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to regenerate SEO metadata');
  return json;
}

export async function runFullSiteAudit(): Promise<{ scanned: number; issuesFound: number }> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/audits/run`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to trigger site audit');
  return json;
}

export async function getAuditIssues(params: {
  severity?: string;
  resolved?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ items: SeoAuditIssueItem[]; total: number; page: number; limit: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.severity && params.severity !== 'ALL') query.set('severity', params.severity);
  if (params.resolved !== undefined) query.set('resolved', params.resolved.toString());
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/seo/admin/audits/issues?${query.toString()}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch audit issues');
  return json;
}

export async function resolveAuditIssue(id: string): Promise<SeoAuditIssueItem> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/audits/issues/${id}/resolve`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to resolve audit issue');
  return json;
}

export async function getSeoRedirects(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ items: SeoRedirectItem[]; total: number; page: number; limit: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE_URL}/seo/admin/redirects?${query.toString()}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch redirects');
  return json;
}

export async function createSeoRedirect(payload: {
  oldPath: string;
  newPath: string;
  oldSlug?: string;
  newSlug?: string;
}): Promise<SeoRedirectItem> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/redirects`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to create redirect');
  return json;
}

export async function deleteSeoRedirect(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/seo/admin/redirects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || 'Failed to delete redirect');
  return json;
}
