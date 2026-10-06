import { fetchApi } from '@/lib/api-client';
import { Property, SearchPropertiesParams, PaginatedResponse } from '@/types';

// Controlled development fallback dataset if backend API is offline
export const DEV_FALLBACK_PROPERTIES: Property[] = [
  {
    id: 'prop-dev-1',
    slug: 'luxury-4bhk-contemporary-villa-gomti-nagar',
    title: {
      en: 'Luxury 4 BHK Contemporary Villa with Private Garden',
      hi: 'प्राइवेट गार्डन के साथ 4 बीएचके लक्जरी समकालीन विला',
      ar: 'فيلا فاخرة 4 غرف نوم مع حديقة خاصة',
      ur: 'پرائیویٹ گارڈن کے ساتھ 4 بی ایچ کے لگژری ولا',
    },
    description: {
      en: 'Modern architectural masterpiece featuring open-plan living, Italian marble floors, modular German kitchen, expansive rooftop lounge, and smart home automation. Situated in a prestigious gated community with 24/7 private security.',
      hi: 'ओपन-प्लान लिविंग, इटैलियन मार्बल फ्लोर, मॉड्यूलर किचन और स्मार्ट होम ऑटोमेशन से सुसज्जित आधुनिक विला।',
      ar: 'تحفة معمارية معاصرة تضم مساحات معيشة مفتوحة وأرضيات رخام إيطالية ومطبخ ألماني مجهز بالكامل.',
      ur: 'اوپن پلان لیونگ، اطالوی ماربل فرش اور سمارٹ ہوم آٹومیشن کے ساتھ شاندار ولا۔',
    },
    category: 'House / Home',
    listingType: 'SALE',
    price: {
      amount: 18500000,
      currency: 'INR',
      isNegotiable: true,
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      city: 'Lucknow',
      locality: 'Gomti Nagar Extension',
      coordinates: [80.9984, 26.8526],
    },
    specs: {
      bedrooms: 4,
      bathrooms: 5,
      carpetAreaSqFt: 3200,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'SEMI_FURNISHED',
      facing: 'North-East',
      parking: '2 Covered Cars',
      floorNumber: 'G+2 Floors',
      totalFloors: 3,
    },
    amenities: [
      'Private Landscaped Garden',
      '24/7 Gated Security & CCTV',
      'Solar Water Heating System',
      'Italian Marble Flooring',
      'Clubhouse & Gym Access',
      '100% Power Backup',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Verma Estates & Consulting',
      phone: '+919925843599',
      isVerifiedAgent: true,
      agencyName: 'Verma Luxury Properties',
    },
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-dev-2',
    slug: 'premium-3bhk-highrise-apartment-golf-view',
    title: {
      en: '3 BHK High-Rise Apartment with Panoramic Skyline Views',
      hi: 'पैनोरामिक दृश्यों के साथ 3 बीएचके हाई-राइज अपार्टमेंट',
      ar: 'شقة 3 غرف نوم بإطلالة بانورامية رائعة على المدينة',
      ur: 'شاندار پینورامک مناظر کے ساتھ 3 بی ایچ کے اپارٹمنٹ',
    },
    description: {
      en: 'Spacious flat in high-end gated township with Olympic-size swimming pool, expansive clubhouse, tennis court, double basement parking, and scenic green views.',
      hi: 'प्रीमियम गेटेड टाउनशिप में स्विमिंग पूल और क्लब हाउस के साथ आधुनिक 3 बीएचके फ्लैट।',
      ar: 'شقة واسعة في مجمع سكني راقي مزود بمسبح أولمبي ونادي صحي وملاعب ومواقف سيارات خاصة.',
      ur: 'تیراکی پول اور کلب ہاؤس کے ساتھ پرتعیش ٹاؤن شپ میں 3 بی ایچ کے فلیٹ۔',
    },
    category: 'Apartment',
    listingType: 'SALE',
    price: {
      amount: 9200000,
      currency: 'INR',
      isNegotiable: false,
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      city: 'Lucknow',
      locality: 'Shaheed Path',
      coordinates: [80.985, 26.812],
    },
    specs: {
      bedrooms: 3,
      bathrooms: 3,
      carpetAreaSqFt: 1850,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'FURNISHED',
      facing: 'East',
      parking: '1 Covered, 1 Open',
      floorNumber: '14th of 22',
      totalFloors: 22,
    },
    amenities: [
      'Swimming Pool & Jacuzzi',
      'Modern Gymnasium',
      '24/7 Security & Video Intercom',
      'High-Speed Elevators',
      'Covered Car Parking',
      'Children Play Zone',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Skyline Realty Partners',
      phone: '+919876543210',
      isVerifiedAgent: true,
      agencyName: 'Skyline Capital Assets',
    },
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-dev-3',
    slug: 'prime-corner-commercial-retail-showroom-hazratganj',
    title: {
      en: 'Prime Corner Commercial Showroom Space in High Street',
      hi: 'हज़रतगंज में मुख्य कमर्शियल कॉर्नर शोरूम स्पेस',
      ar: 'معرض تجاري ركني مميز في شارع التسوق الرئيسي',
      ur: 'مرکزی کمرشل کارنر شو روم سپیس',
    },
    description: {
      en: 'High footfall ground floor commercial retail shop with 35ft double-height glass frontage directly facing the premier commercial market boulevard.',
      hi: 'मुख्य बाजार मार्ग पर 35 फीट ग्लास फ्रंटेज वाली हाई-फुटफॉल कमर्शियल दुकान।',
    },
    category: 'Shop',
    listingType: 'RENT',
    price: {
      amount: 85000,
      currency: 'INR',
      isNegotiable: true,
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      city: 'Lucknow',
      locality: 'Hazratganj Main Market',
      coordinates: [80.9462, 26.8467],
    },
    specs: {
      carpetAreaSqFt: 850,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'UNFURNISHED',
      floorNumber: 'Ground Floor',
      totalFloors: 4,
    },
    amenities: ['Double Height Ceiling', 'Heavy Power Load', 'Dedicated Customer Parking', 'Main Road Facing'],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Alok Dixit Properties',
      phone: '+919925843599',
      isVerifiedAgent: true,
    },
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: new Date().toISOString(),
  },
];

// ==========================================
// PUBLIC MARKETPLACE SERVICES
// ==========================================

export async function getFeaturedProperties(): Promise<{
  properties: Property[];
  source: 'api' | 'fallback_dev';
}> {
  const result = await fetchApi<Property[]>('/properties?featured=true');
  if (result.isBackendAvailable && result.data && Array.isArray(result.data) && result.data.length > 0) {
    return { properties: result.data, source: 'api' };
  }
  const fallbackFeatured = DEV_FALLBACK_PROPERTIES.filter((p) => p.isFeatured);
  return { properties: fallbackFeatured, source: 'fallback_dev' };
}

export async function getProperties(params?: {
  category?: string;
  type?: string;
  city?: string;
  q?: string;
  featured?: boolean;
}): Promise<{
  properties: Property[];
  source: 'api' | 'fallback_dev';
}> {
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }
  if (params?.type && params.type !== 'all') {
    searchParams.set('type', params.type);
  }
  if (params?.city && params.city !== 'all') {
    searchParams.set('city', params.city);
  }
  if (params?.q && params.q.trim()) {
    searchParams.set('q', params.q.trim());
  }
  if (params?.featured) {
    searchParams.set('featured', 'true');
  }

  const endpoint = `/properties${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const result = await fetchApi<Property[]>(endpoint);

  if (result.isBackendAvailable && result.data && Array.isArray(result.data)) {
    return { properties: result.data, source: 'api' };
  }

  // Fallback filtering in memory
  let filtered = [...DEV_FALLBACK_PROPERTIES];

  if (params?.featured) {
    filtered = filtered.filter((p) => p.isFeatured);
  }

  if (params?.category && params.category !== 'all') {
    const catQuery = params.category.toLowerCase().replace(/[\s\/-]+/g, '');
    filtered = filtered.filter((p) => {
      const propCat = p.category.toLowerCase().replace(/[\s\/-]+/g, '');
      return propCat.includes(catQuery) || catQuery.includes(propCat);
    });
  }

  if (params?.type && params.type !== 'all') {
    filtered = filtered.filter(
      (p) => p.listingType.toLowerCase() === params.type?.toLowerCase(),
    );
  }

  if (params?.city && params.city !== 'all') {
    filtered = filtered.filter(
      (p) => (p.location?.city || 'Lucknow').toLowerCase() === params.city?.toLowerCase(),
    );
  }

  if (params?.q && params.q.trim()) {
    const q = params.q.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        (p.title?.en || '').toLowerCase().includes(q) ||
        (p.location?.locality || '').toLowerCase().includes(q) ||
        (p.location?.city || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q),
    );
  }

  return { properties: filtered, source: 'fallback_dev' };
}

/**
 * Phase 07 — Multi-Facet Public Property Search & Discovery
 */
export async function searchProperties(params?: SearchPropertiesParams): Promise<PaginatedResponse<Property>> {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.set(key, String(value));
      }
    });
  }

  const endpoint = `/properties/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const result = await fetchApi<PaginatedResponse<Property>>(endpoint);

  if (result.isBackendAvailable && result.data && Array.isArray(result.data.data)) {
    return result.data;
  }

  // Fallback pagination
  const fallbackRes = await getProperties({
    category: params?.category,
    type: params?.listingType,
    city: params?.city,
    q: params?.q,
    featured: params?.featured === true || params?.featured === 'true',
  });

  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 12;
  const start = (page - 1) * limit;
  const pagedItems = fallbackRes.properties.slice(start, start + limit);
  const total = fallbackRes.properties.length;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: pagedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getPropertyBySlug(slug: string): Promise<{
  property: Property | null;
  source: 'api' | 'fallback_dev';
}> {
  const result = await fetchApi<Property>(`/properties/${slug}`);
  if (result.isBackendAvailable && result.data) {
    return { property: result.data, source: 'api' };
  }

  const matched = DEV_FALLBACK_PROPERTIES.find((p) => p.slug === slug);
  return { property: matched || null, source: 'fallback_dev' };
}

export async function getSimilarProperties(
  category: string,
  excludeSlug: string,
): Promise<Property[]> {
  const res = await getProperties({ category });
  return res.properties.filter((p) => p.slug !== excludeSlug).slice(0, 3);
}

// ==========================================
// OWNER & AGENT DASHBOARD SERVICES
// ==========================================

export async function createProperty(payload: any): Promise<Property> {
  const result = await fetchApi<Property>('/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to create property in database.');
  }

  return result.data;
}

export async function getMyProperties(): Promise<Property[]> {
  const result = await fetchApi<Property[]>('/properties/user/my');
  if (result.isBackendAvailable && result.data && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

export async function getMyPropertyById(id: string): Promise<Property> {
  const result = await fetchApi<Property>(`/properties/user/my/${encodeURIComponent(id)}`);
  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch property.');
  }
  return result.data;
}

export async function updateProperty(id: string, payload: any): Promise<Property> {
  const result = await fetchApi<Property>(`/properties/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to update property.');
  }

  return result.data;
}

export async function submitPropertyForApproval(id: string): Promise<{ success: boolean; message: string; property: Property }> {
  const result = await fetchApi<{ success: boolean; message: string; property: Property }>(
    `/properties/${encodeURIComponent(id)}/submit`,
    {
      method: 'POST',
    },
  );

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to submit property for moderation.');
  }

  return result.data;
}

export async function deleteProperty(id: string): Promise<{ success: boolean; message: string }> {
  const result = await fetchApi<{ success: boolean; message: string }>(
    `/properties/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );

  if (!result.isBackendAvailable || result.error || !result.data) {
    throw new Error(result.error || 'Failed to delete property.');
  }

  return result.data;
}
