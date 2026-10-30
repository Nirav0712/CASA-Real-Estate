import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertyBySlug, getSimilarProperties } from '@/services/property-service';
import { getPublicPageSeo } from '@/services/seo-service';
import { PropertyDetailView } from '@/features/properties/property-detail-view';
import { formatPrice } from '@/lib/utils';

interface PropertyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://casa-real-estate-mocha.vercel.app';

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [{ property }, seo] = await Promise.all([
    getPropertyBySlug(slug),
    getPublicPageSeo(`/property/${slug}`, slug),
  ]);

  if (!property) {
    return {
      title: 'Property Not Found | MyProperty',
      description: 'The requested property listing was not found on MyProperty.',
      robots: { index: false, follow: false },
    };
  }

  const localizedTitle =
    typeof property.title === 'string'
      ? property.title
      : property.title.en || 'Verified Real Estate Listing';

  const formattedPrice = formatPrice(
    property.price.amount,
    property.price.currency,
  );

  // Use centralized SEO record if available, otherwise compute standard title
  const finalTitle = seo?.metaTitle || `${localizedTitle} — ${formattedPrice} | MyProperty`;
  const finalDescription =
    seo?.metaDescription ||
    (typeof property.description === 'string'
      ? property.description
      : property.description?.en) ||
    `${property.category} for ${property.listingType.toLowerCase()} in ${property.location.locality}, ${property.location.city}. Verified by MyProperty.`;

  const canonicalUrl = seo?.canonicalUrl || `${BASE_URL}/property/${property.slug}`;
  const imageUrl = seo?.openGraphImage || property.media?.thumbnailUrl || `${BASE_URL}/og-image.jpg`;

  const isEligible =
    (property.status === 'PUBLISHED' || property.status === 'SOLD_OR_RENTED') &&
    property.isPublished !== false;
  const shouldIndex = isEligible && (seo?.robotsIndex !== undefined ? seo.robotsIndex : property.status === 'PUBLISHED');

  return {
    title: finalTitle,
    description: finalDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: shouldIndex,
      follow: isEligible && seo?.robotsFollow !== false,
      googleBot: {
        index: shouldIndex,
        follow: isEligible && seo?.robotsFollow !== false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: seo?.openGraphTitle || finalTitle,
      description: seo?.openGraphDescription || finalDescription,
      url: canonicalUrl,
      type: 'website',
      siteName: 'MyProperty Marketplace',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: localizedTitle,
        },
      ],
    },
    twitter: {
      card: (seo?.twitterCardType as any) || 'summary_large_image',
      title: seo?.openGraphTitle || finalTitle,
      description: seo?.openGraphDescription || finalDescription,
      images: [imageUrl],
    },
  };
}

export default async function PropertyDetailPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const [{ property, source }, seo] = await Promise.all([
    getPropertyBySlug(slug),
    getPublicPageSeo(`/property/${slug}`, slug),
  ]);

  if (!property) {
    notFound();
  }

  const similarProperties = await getSimilarProperties(
    property.category,
    property.slug,
  );

  const localizedTitle =
    typeof property.title === 'string'
      ? property.title
      : property.title.en || 'Real Estate Property';

  const localizedDescription =
    typeof property.description === 'string'
      ? property.description
      : property.description?.en || '';

  // Fallback JSON-LD Structured Data Schema if not provided by SEO engine
  const fallbackJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: property.location?.city || 'Properties',
            item: `${BASE_URL}/locations/${(property.location?.city || 'india').toLowerCase()}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: localizedTitle,
            item: `${BASE_URL}/property/${property.slug}`,
          },
        ],
      },
      {
        '@type': 'RealEstateListing',
        name: localizedTitle,
        description: localizedDescription,
        url: `${BASE_URL}/property/${property.slug}`,
        image: property.media.images || [property.media.thumbnailUrl],
        offers: {
          '@type': 'Offer',
          price: property.price.amount,
          availability:
            property.status === 'SOLD_OR_RENTED'
              ? 'https://schema.org/SoldOut'
              : 'https://schema.org/InStock',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: property.location.locality,
          addressLocality: property.location.city,
          addressRegion: property.location.state,
          addressCountry: 'IN',
        },
        numberOfBedrooms: property.specs?.bedrooms,
        numberOfBathroomsTotal: property.specs?.bathrooms,
        floorSize: property.specs?.carpetAreaSqFt
          ? {
              '@type': 'QuantitativeValue',
              value: property.specs.carpetAreaSqFt,
              unitCode: 'FTK',
            }
          : undefined,
      },
    ],
  };

  const finalStructuredData = seo?.structuredData || fallbackJsonLd;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(finalStructuredData) }}
      />
      <PropertyDetailView
        property={property}
        similarProperties={similarProperties}
        source={source}
      />
    </>
  );
}
