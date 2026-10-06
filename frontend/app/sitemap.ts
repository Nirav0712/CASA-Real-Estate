import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://casa-real-estate-mocha.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/properties',
    '/compare',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const majorCities = [
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
  ].map((city) => ({
    url: `${BASE_URL}/locations/${city}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...majorCities];
}
