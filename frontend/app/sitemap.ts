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

  const majorCities: MetadataRoute.Sitemap = [
    'ahmedabad',
    'surat',
    'vadodara',
    'rajkot',
    'gandhinagar',
    'mumbai',
    'pune',
    'bengaluru',
    'hyderabad',
    'delhi-ncr',
    'lucknow',
    'kolkata',
  ].map((city) => ({
    url: `${BASE_URL}/locations/${city}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE_URL}/properties?limit=500&status=PUBLISHED`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const items = Array.isArray(data) ? data : data?.properties || data?.items || [];
      propertyRoutes = items
        .filter((p: any) => p.status === 'PUBLISHED' && p.isPublished !== false)
        .map((p: any) => ({
          url: `${BASE_URL}/property/${p.slug || p.id || p._id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        }));
    }
  } catch {
    // Graceful fallback during static build
  }

  return [...staticRoutes, ...majorCities, ...propertyRoutes];
}
