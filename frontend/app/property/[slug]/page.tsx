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

  const title = `${property.title.en} — ${formatPrice(
    property.price.amount,
    property.price.currency,
  )} | CASA`;

  const description =
    property.description.en ||
    `${property.category} for ${property.listingType.toLowerCase()} in ${property.location.locality}, ${property.location.city}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: property.media.thumbnailUrl,
          width: 1200,
          height: 630,
          alt: property.title.en,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [property.media.thumbnailUrl],
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

  return (
    <PropertyDetailView
      property={property}
      similarProperties={similarProperties}
      source={source}
    />
  );
}
