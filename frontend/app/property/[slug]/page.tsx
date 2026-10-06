import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertyBySlug, getSimilarProperties } from '@/services/property-service';
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
  const { property } = await getPropertyBySlug(slug);

  if (!property) {
    return {
      title: 'Property Not Found | CASA Real Estate',
      description: 'The requested property listing was not found on CASA.',
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

  const title = `${localizedTitle} — ${formattedPrice} | CASA`;

  const description =
    (typeof property.description === 'string'
      ? property.description
      : property.description?.en) ||
    `${property.category} for ${property.listingType.toLowerCase()} in ${property.location.locality}, ${property.location.city}. Verified by CASA.`;

  const canonicalUrl = `${BASE_URL}/property/${property.slug}`;
  const imageUrl = property.media.thumbnailUrl || `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: property.status === 'PUBLISHED',
      follow: true,
      googleBot: {
        index: property.status === 'PUBLISHED',
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'CASA Real Estate Marketplace',
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
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PropertyDetailPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const { property, source } = await getPropertyBySlug(slug);

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

  // JSON-LD Structured Data Schema
  const jsonLd = {
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
          priceCurrency: property.price.currency || 'INR',
          availability: 'https://schema.org/InStock',
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailView
        property={property}
        similarProperties={similarProperties}
        source={source}
      />
    </>
  );
}
