import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://casa-real-estate-mocha.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/properties',
          '/property/',
          '/locations/',
          '/agents/',
          '/compare',
        ],
        disallow: [
          '/dashboard/',
          '/api/',
          '/_next/',
          '/private/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
