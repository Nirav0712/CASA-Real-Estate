import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi } from '@/lib/api-client';
import { PropertyCard } from '@/features/properties/property-card';
import { Container, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Building,
  Home,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface CityPageProps {
  params: Promise<{ city: string }>;
}

const CITY_METADATA_MAP: Record<string, { name: string; state: string; description: string; localities: string[]; averageSqFt: number }> = {
  ahmedabad: {
    name: 'Ahmedabad',
    state: 'Gujarat',
    description: 'Ahmedabad is Gujarat’s premier commercial and residential hub, known for world-class infrastructure along SG Highway, GIFT City corridor, and prime neighborhoods.',
    localities: ['Bodakdev', 'Satellite', 'Vastrapur', 'Prahlad Nagar', 'Bopal', 'Shela', 'Thaltej', 'Gota'],
    averageSqFt: 6200,
  },
  surat: {
    name: 'Surat',
    state: 'Gujarat',
    description: 'Surat is India’s diamond and textile capital, showcasing rapid urban growth, riverside developments, and thriving residential projects.',
    localities: ['Vesu', 'Piplod', 'Adajan', 'Althan', 'Pal', 'Varachha'],
    averageSqFt: 5400,
  },
  vadodara: {
    name: 'Vadodara',
    state: 'Gujarat',
    description: 'The cultural capital of Gujarat, Vadodara combines educational excellence with balanced industrial and residential real estate investment.',
    localities: ['Alkapuri', 'Vasna-Bhayli', 'Gotri', 'Manjalpur', 'Karelibaug'],
    averageSqFt: 4500,
  },
  mumbai: {
    name: 'Mumbai',
    state: 'Maharashtra',
    description: 'India’s financial capital offering high-appreciation residential apartments, luxury coastal high-rises, and prime commercial corridors.',
    localities: ['Andheri', 'Bandra', 'Powai', 'Goregaon', 'Thane', 'Navi Mumbai'],
    averageSqFt: 18500,
  },
  pune: {
    name: 'Pune',
    state: 'Maharashtra',
    description: 'A major IT and educational metropolis with thriving residential townships, green suburbs, and high rental yields.',
    localities: ['Hinjawadi', 'Baner', 'Wakad', 'Kharadi', 'Viman Nagar', 'Kothrud'],
    averageSqFt: 7800,
  },
};

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const cityKey = city.toLowerCase();
  const cityInfo = CITY_METADATA_MAP[cityKey] || {
    name: city.charAt(0).toUpperCase() + city.slice(1),
    state: 'India',
    description: `Discover top verified properties, apartments, and plots for sale and rent in ${city}.`,
    localities: [],
    averageSqFt: 5000,
  };

  const title = `Properties in ${cityInfo.name}, ${cityInfo.state} | Buy & Rent on CASA`;
  const description = `Explore verified residential apartments, villas, and commercial real estate for sale and rent in ${cityInfo.name}. Verified agent listings and direct owner properties.`;
  const canonicalUrl = `https://casa-real-estate-mocha.vercel.app/locations/${cityKey}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'CASA Real Estate Marketplace',
      images: [
        {
          url: 'https://casa-real-estate-mocha.vercel.app/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `Real Estate in ${cityInfo.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CityLocationPage({ params }: CityPageProps) {
  const { city } = await params;
  const cityKey = city.toLowerCase();
  const cityInfo = CITY_METADATA_MAP[cityKey] || {
    name: city.charAt(0).toUpperCase() + city.slice(1),
    state: 'India',
    description: `Explore verified listings across ${city}.`,
    localities: ['Central', 'North', 'South', 'West'],
    averageSqFt: 5500,
  };

  // Fetch properties for this city
  const res = await fetchApi<any>(`/properties?city=${encodeURIComponent(cityInfo.name)}&limit=9`);
  const properties = res.data?.items || res.data || [];

  // FAQs for structured schema
  const faqs = [
    {
      question: `What is the average property price per sq.ft in ${cityInfo.name}?`,
      answer: `As of current market trends, residential properties in ${cityInfo.name} average approximately ₹${cityInfo.averageSqFt.toLocaleString()} per sq.ft, depending on prime locality, amenities, and developer reputation.`,
    },
    {
      question: `Are properties on CASA in ${cityInfo.name} RERA verified?`,
      answer: `Yes, CASA requires all builder projects and authorized agents in ${cityInfo.name} to display verified RERA registration numbers and compliance documentation before publishing.`,
    },
    {
      question: `Can I schedule a physical site visit in ${cityInfo.name}?`,
      answer: `Absolutely. You can click 'Book a Site Visit' on any listing in ${cityInfo.name} to schedule an in-person tour with the verified coordinator or agent.`,
    },
  ];

  // Structured Data (JSON-LD)
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
            item: 'https://casa-real-estate-mocha.vercel.app',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Locations',
            item: 'https://casa-real-estate-mocha.vercel.app/properties',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: cityInfo.name,
            item: `https://casa-real-estate-mocha.vercel.app/locations/${cityKey}`,
          },
        ],
      },
      {
        '@type': 'Place',
        name: `${cityInfo.name}, ${cityInfo.state}`,
        description: cityInfo.description,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-casa-canvas py-8">
        <Container>
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-casa-text-muted mb-6 overflow-x-auto whitespace-nowrap"
          >
            <Link href="/" className="hover:text-casa-brand transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link href="/properties" className="hover:text-casa-brand transition-colors">
              Locations
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-casa-text-primary font-semibold">{cityInfo.name}</span>
          </nav>

          {/* Hero Banner for Location */}
          <div className="bg-gradient-to-br from-casa-surface to-casa-canvas border border-casa-border-light rounded-3xl p-6 sm:p-10 mb-10 shadow-subtle">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-casa-brand/10 text-casa-brand text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>{cityInfo.state} Marketplace</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-casa-text-primary tracking-tight">
                Real Estate & Properties in {cityInfo.name}
              </h1>
              <p className="text-sm sm:text-base text-casa-text-secondary leading-relaxed">
                {cityInfo.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-casa-text-primary font-medium">
                <span className="flex items-center gap-1.5 bg-casa-surface px-3 py-1.5 rounded-xl border border-casa-border-light">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Avg: ₹{cityInfo.averageSqFt.toLocaleString()}/sq.ft</span>
                </span>
                <span className="flex items-center gap-1.5 bg-casa-surface px-3 py-1.5 rounded-xl border border-casa-border-light">
                  <ShieldCheck className="w-4 h-4 text-casa-brand" />
                  <span>100% Verified Listings</span>
                </span>
              </div>
            </div>
          </div>

          {/* Popular Localities Quick Links */}
          {cityInfo.localities.length > 0 && (
            <div className="mb-10 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-casa-text-primary">
                Top Localities in {cityInfo.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {cityInfo.localities.map((loc) => (
                  <Link
                    key={loc}
                    href={`/properties?city=${encodeURIComponent(cityInfo.name)}&locality=${encodeURIComponent(loc)}`}
                    className="px-3.5 py-1.5 rounded-xl bg-casa-surface border border-casa-border-light text-xs font-semibold text-casa-text-secondary hover:text-casa-brand hover:border-casa-brand/40 transition-all shadow-2xs"
                  >
                    {loc}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* City Properties Grid */}
          <div className="space-y-6 mb-16">
            <div className="flex items-center justify-between border-b border-casa-border-light pb-4">
              <div>
                <h2 className="text-xl font-bold text-casa-text-primary">
                  Featured Properties in {cityInfo.name}
                </h2>
                <p className="text-xs text-casa-text-secondary mt-0.5">
                  Browse the latest residential flats, villas, and commercial spaces.
                </p>
              </div>

              <Link href={`/properties?city=${encodeURIComponent(cityInfo.name)}`}>
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                  <span>View All in {cityInfo.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-16 bg-casa-surface border border-dashed border-casa-border-light rounded-2xl">
                <Building className="w-12 h-12 text-casa-text-muted mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-bold text-casa-text-primary">No active listings yet in {cityInfo.name}</h3>
                <p className="text-xs text-casa-text-secondary max-w-sm mx-auto mt-1 mb-4">
                  Be the first to list your residential or commercial property in {cityInfo.name}.
                </p>
                <Link href="/dashboard/properties/new">
                  <Button className="bg-casa-brand text-white text-xs">Post Property</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop: any) => (
                  <PropertyCard key={prop.id || prop._id} property={prop} />
                ))}
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-casa-surface border border-casa-border-light rounded-3xl p-6 sm:p-8 space-y-6 shadow-subtle">
            <div>
              <h2 className="text-lg font-bold text-casa-text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-casa-brand" />
                <span>Frequently Asked Questions — {cityInfo.name} Real Estate</span>
              </h2>
              <p className="text-xs text-casa-text-secondary mt-0.5">
                Key insights for homebuyers, tenants, and investors in {cityInfo.name}.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-casa-canvas border border-casa-border-light space-y-1.5"
                >
                  <h3 className="font-bold text-xs text-casa-text-primary">
                    {faq.question}
                  </h3>
                  <p className="text-xs text-casa-text-secondary leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
