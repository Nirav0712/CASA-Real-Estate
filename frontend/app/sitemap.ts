import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://casa-real-estate-mocha.vercel.app';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/properties',
    '/compare',
    '/pricing',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  let propertyRoutes: MetadataRoute.Sitemap = [];
  let locationRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${API_BASE_URL}/properties?limit=500&status=PUBLISHED`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const items = Array.isArray(data) ? data : data?.properties || data?.items || [];
      const publishedItems = items.filter((p: any) => p.status === 'PUBLISHED' && p.isPublished !== false);

      propertyRoutes = publishedItems.map((p: any) => ({
        url: `${BASE_URL}/property/${p.slug || p.id || p._id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));

      // Extract unique cities that actually possess verified published property inventory
      const activeCities: string[] = Array.from(
        new Set<string>(
          publishedItems
            .map((p: any) => (p.location?.city || '').toLowerCase().trim())
            .filter((c: string) => c.length > 1)
        )
      );

      locationRoutes = activeCities.map((city: string) => ({
        url: `${BASE_URL}/locations/${encodeURIComponent(city.replace(/\s+/g, '-'))}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Graceful fallback during static build
  }

  // Fallback to primary metro hubs only if API was unreachable during build
  if (locationRoutes.length === 0) {
    locationRoutes = ['ahmedabad', 'mumbai', 'delhi', 'bangalore'].map((city) => ({
      url: `${BASE_URL}/locations/${city}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  }

  return [...staticRoutes, ...locationRoutes, ...propertyRoutes];
}
