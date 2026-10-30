const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface PublicSeoMetadata {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  relatedKeywords?: string[];
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
  twitterCardType?: string;
  structuredData?: Record<string, any>;
  seoScore?: number;
}

/**
 * Fetch dynamic SEO metadata from centralized backend SEO engine
 */
export async function getPublicPageSeo(
  path: string,
  slug?: string,
): Promise<PublicSeoMetadata | null> {
  try {
    const query = new URLSearchParams();
    if (path) query.set('path', path);
    if (slug) query.set('slug', slug);

    const res = await fetch(`${API_BASE_URL}/seo/public/metadata?${query.toString()}`, {
      next: { revalidate: 3600 }, // 1 hour ISR cache
    });

    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (!json || !json.metaTitle) return null;

    return json;
  } catch {
    // Non-blocking fallback for resilient rendering
    return null;
  }
}
