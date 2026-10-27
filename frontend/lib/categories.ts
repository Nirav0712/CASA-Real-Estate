import {
  Home,
  Building,
  MapPin,
  Store,
  KeyRound,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import { Locale } from './translations';

export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  localizedNames: Record<Locale, string>;
  description: Record<Locale, string>;
  icon: LucideIcon;
  count: string;
  group: 'Residential' | 'Commercial' | 'Land' | 'Special';
  badgeColor?: string;
}

export const CASA_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'house-home',
    name: 'House / Home',
    slug: 'house-home',
    localizedNames: {
      en: 'House / Home',
      hi: 'घर / विला',
      ar: 'منزل / فيلا',
      ur: 'مکان / ولا',
    },
    description: {
      en: 'Independent houses, villas, builder floors, duplexes, and row houses.',
      hi: 'स्वतंत्र घर, विला, बिल्डर फ्लोर और रो हाउस।',
      ar: 'منازل مستقلة وفلل وأدوار سكنية فاخرة.',
      ur: 'خود مختار مکانات، ولاز اور بلڈر فلورز۔',
    },
    icon: Home,
    count: '2,420+ Ads',
    group: 'Residential',
  },
  {
    id: 'apartment-flat',
    name: 'Apartment / Flat',
    slug: 'apartment-flat',
    localizedNames: {
      en: 'Apartment / Flat',
      hi: 'अपार्टमेंट / फ्लैट',
      ar: 'شقق سكنية وفلات',
      ur: 'اپارٹمنٹس اور فلیٹس',
    },
    description: {
      en: 'Multi-storey condominiums, flats, studio apartments, and luxury gated society homes.',
      hi: 'बहुमंजिला सोसायटी, फ्लैट्स और लक्जरी गेटेड अपार्टमेंट्स।',
      ar: 'شقق سكنية وأبراج سكنية في مجمعات متكاملة الخدمات.',
      ur: 'کثیر منزلہ سوسائٹیز، فلیٹس اور لگژری اپارٹمنٹس۔',
    },
    icon: Building,
    count: '6,830+ Ads',
    group: 'Residential',
  },
  {
    id: 'plot',
    name: 'Plot',
    slug: 'plot',
    localizedNames: {
      en: 'Plot',
      hi: 'प्लॉट / भूखंड',
      ar: 'أراضي ومخططات',
      ur: 'پلاٹس اور اراضی',
    },
    description: {
      en: 'Approved residential plotted layouts, commercial land parcels, and acreage.',
      hi: 'स्वीकृत आवासीय भूखंड, कमर्शियल लैंड और बड़े भूखंड।',
      ar: 'أراضي مقسمة ومعتمدة ومخططات سكنية وتجارية.',
      ur: 'منظور شدہ رہائشی پلاٹس اور کمرشل اراضی۔',
    },
    icon: MapPin,
    count: '1,530+ Ads',
    group: 'Land',
  },
  {
    id: 'shop-warehouse',
    name: 'Shop / Warehouse',
    slug: 'shop-warehouse',
    localizedNames: {
      en: 'Shop / Warehouse',
      hi: 'दुकान / वेयरहाउस (गोदाम)',
      ar: 'محلات ومستودعات',
      ur: 'دکانیں اور گودام',
    },
    description: {
      en: 'Retail stores, commercial showrooms, storage facilities, and logistics godowns.',
      hi: 'रिटेल स्टोर्स, कमर्शियल शोरूम, भंडारण गोदाम और लॉजिस्टिक्स डिपो।',
      ar: 'محلات تجارية ومعارض ومستودعات تخزين ومراكز لوجستية.',
      ur: 'ریٹیل دکانیں، کمرشل شو رومز اور اسٹوریج گودام۔',
    },
    icon: Store,
    count: '955+ Ads',
    group: 'Commercial',
  },
  {
    id: 'lease',
    name: 'Lease',
    slug: 'lease',
    localizedNames: {
      en: 'Lease',
      hi: 'लीज संपत्तियां',
      ar: 'عقود إيجار طويلة الأجل',
      ur: 'طویل مدتی لیز',
    },
    description: {
      en: 'Long-term corporate leases, commercial office floors, and turnkey institutional spaces.',
      hi: 'दीर्घकालिक कॉर्पोरेट लीज, कमर्शियल ऑफिस और आईटी पार्क।',
      ar: 'عقارات للإيجار طويل الأجل والمكاتب والمقرات المؤسسية.',
      ur: 'کارپوریٹ لیز، دفتری عمارات اور کمرشل پروجیکٹس۔',
    },
    icon: KeyRound,
    count: '410+ Ads',
    group: 'Commercial',
  },
  {
    id: 'litigated',
    name: 'Litigated',
    slug: 'litigated',
    localizedNames: {
      en: 'Litigated',
      hi: 'न्यायाधीन / नीलामी संपत्ति (Litigated)',
      ar: 'عقارات قضائية ومزادات',
      ur: 'عدالتی تنازعات اور نیلامی',
    },
    description: {
      en: 'Dispute resolution, court settlement, or bank SARFAESI auctions with verified legal disclosures.',
      hi: 'विवाद समाधान, कोर्ट सेटलमेंट या बैंक नीलामी के तहत पूर्ण प्रकटीकरण वाली संपत्तियां।',
      ar: 'عقارات تخضع لتسويات قضائية أو مزادات بنكية مع إفصاحات كاملة.',
      ur: 'عدالتی یا بینک نیلامی کے تحت قانونی طور پر واضح شرائط والی پراپرٹیز۔',
    },
    icon: Scale,
    count: '85+ Ads',
    group: 'Special',
  },
  {
    id: 'pg',
    name: 'PG (Paying Guest)',
    slug: 'pg',
    localizedNames: {
      en: 'PG (Paying Guest)',
      hi: 'पीजी / पेइंग गेस्ट',
      ar: 'سكن ضيوف / كوليفينج',
      ur: 'پی جی اور ہاسٹل',
    },
    description: {
      en: 'Paying guest accommodation, student housing, and co-living rooms with meal options.',
      hi: 'पेइंग गेस्ट आवास, छात्र आवास और को-लिविंग स्पेस।',
      ar: 'أماكن إقامة للضيوف وسكن طلاب ومساحات معيشة مشتركة.',
      ur: 'طلباء اور پروفیشنلز کے لیے پی جی اور ہاسٹل کی سہولیات۔',
    },
    icon: Home,
    count: '320+ Ads',
    group: 'Residential',
  },
];

// Mapping for legacy categories to standard 7 categories
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  // Plotting Land, Small Land, Big Land -> Plot
  'plotting land': 'plot',
  'plotting-land': 'plot',
  'small land': 'plot',
  'small-land': 'plot',
  'big land': 'plot',
  'big-land': 'plot',
  'land': 'plot',
  'agricultural land': 'plot',
  'residential plot': 'plot',
  'commercial plot': 'plot',

  // Flats, Apartment -> Apartment / Flat
  'flats': 'apartment-flat',
  'flat': 'apartment-flat',
  'apartment': 'apartment-flat',
  'apartments': 'apartment-flat',
  'builder floor': 'apartment-flat',
  'penthouse': 'apartment-flat',

  // Shop, Warehouse -> Shop / Warehouse
  'shop': 'shop-warehouse',
  'shops': 'shop-warehouse',
  'warehouse': 'shop-warehouse',
  'warehouses': 'shop-warehouse',
  'godown': 'shop-warehouse',
  'showroom': 'shop-warehouse',

  // House / Home
  'house': 'house-home',
  'home': 'house-home',
  'villa': 'house-home',
  'villas': 'house-home',

  // Lease
  'commercial lease': 'lease',
  'office space': 'lease',
  'commercial office space': 'lease',

  // Litigated
  'auction': 'litigated',
  'bank auction': 'litigated',

  // PG
  'paying guest': 'pg',
  'co-living': 'pg',
  'hostel': 'pg',
};

export function getAllCategories(): CategoryDefinition[] {
  return CASA_CATEGORIES;
}

export function getCategoryBySlug(slugOrName: string): CategoryDefinition | undefined {
  if (!slugOrName) return undefined;
  const clean = slugOrName.trim().toLowerCase();

  // 1. Direct match by slug or canonical name
  const direct = CASA_CATEGORIES.find(
    (c) => c.slug.toLowerCase() === clean || c.name.toLowerCase() === clean,
  );
  if (direct) return direct;

  // 2. Legacy category alias mapping
  const mappedSlug = LEGACY_CATEGORY_MAP[clean];
  if (mappedSlug) {
    return CASA_CATEGORIES.find((c) => c.slug === mappedSlug);
  }

  // 3. Fallback partial match
  return CASA_CATEGORIES.find(
    (c) => clean.includes(c.slug) || c.slug.includes(clean) || clean.includes(c.name.toLowerCase()),
  );
}

export function getCategoryLabel(categoryNameOrSlug: string, locale: Locale = 'en'): string {
  const cat = getCategoryBySlug(categoryNameOrSlug);
  if (cat && cat.localizedNames[locale]) {
    return cat.localizedNames[locale];
  }
  return categoryNameOrSlug;
}
