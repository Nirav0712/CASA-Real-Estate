import {
  Home,
  Building,
  Layers,
  MapPin,
  Trees,
  Maximize2,
  Store,
  Warehouse,
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
      en: 'Independent houses, villas, builder floors, and row houses.',
      hi: 'स्वतंत्र घर, विला, बिल्डर फ्लोर और रो हाउस।',
      ar: 'منازل مستقلة وفلل وأدوار سكنية فاخرة.',
      ur: 'خود مختار مکانات، ولاز اور بلڈر فلورز۔',
    },
    icon: Home,
    count: '1,420+ Ads',
    group: 'Residential',
  },
  {
    id: 'apartment',
    name: 'Apartment',
    slug: 'apartment',
    localizedNames: {
      en: 'Apartment',
      hi: 'अपार्टमेंट्स',
      ar: 'شقق سكنية',
      ur: 'اپارٹمنٹس',
    },
    description: {
      en: 'Multi-storey condominiums and luxury gated society apartments.',
      hi: 'बहुमंजिला सोसायटी और लक्जरी गेटेड अपार्टमेंट्स।',
      ar: 'شقق سكنية في مجمعات متكاملة الخدمات.',
      ur: 'کثیر منزلہ سوسائٹیز اور لگژری اپارٹمنٹس۔',
    },
    icon: Building,
    count: '4,150+ Ads',
    group: 'Residential',
  },
  {
    id: 'flats',
    name: 'Flats',
    slug: 'flats',
    localizedNames: {
      en: 'Flats',
      hi: 'फ्लैट्स',
      ar: 'شقق مدمجة',
      ur: 'فلیٹس',
    },
    description: {
      en: '1 BHK, 2 BHK, and 3 BHK budget-friendly residential flats.',
      hi: '1, 2 और 3 बीएचके किफायती आवासीय फ्लैट्स।',
      ar: 'شقق سكنية مجهزة ومناسبة للميزانية.',
      ur: '1، 2 اور 3 بی ایچ کے رہائشی فلیٹس۔',
    },
    icon: Layers,
    count: '2,680+ Ads',
    group: 'Residential',
  },
  {
    id: 'plotting-land',
    name: 'Plotting Land',
    slug: 'plotting-land',
    localizedNames: {
      en: 'Plotting Land',
      hi: 'प्लॉटिंग लैंड',
      ar: 'أراضي تقسيم سكني',
      ur: 'پلاٹنگ لینڈ',
    },
    description: {
      en: 'Approved residential plotted layouts with road access and utilities.',
      hi: 'सड़क एवं बिजली-पानी सुविधा युक्त स्वीकृत आवासीय भूखंड।',
      ar: 'أراضي مقسمة ومعتمدة للبناء مع الخدمات.',
      ur: 'سڑکوں اور بنیادی سہولیات سے آراستہ رہائشی پلاٹس۔',
    },
    icon: MapPin,
    count: '980+ Ads',
    group: 'Land',
  },
  {
    id: 'small-land',
    name: 'Small Land',
    slug: 'small-land',
    localizedNames: {
      en: 'Small Land',
      hi: 'छोटी जमीन (Small Land)',
      ar: 'أراضي صغيرة / قطع أراضي',
      ur: 'چھوٹی اراضی',
    },
    description: {
      en: 'Compact parcels, farmettes, and corner plots under 1 acre.',
      hi: '1 एकड़ से कम के छोटे भूखंड और फार्मेट्स।',
      ar: 'قطع أراضي صغيرة أقل من فدان مناسبة للمشاريع الخاصة.',
      ur: '1 ایکڑ سے کم رقبے پر مشتمل چھوٹے قطعات اراضی۔',
    },
    icon: Trees,
    count: '340+ Ads',
    group: 'Land',
  },
  {
    id: 'big-land',
    name: 'Big Land',
    slug: 'big-land',
    localizedNames: {
      en: 'Big Land',
      hi: 'बड़ी जमीन / कृषि भूमि',
      ar: 'أراضي زراعية واستثمارية واسعة',
      ur: 'بڑی زرعی و صنعتی اراضی',
    },
    description: {
      en: 'Large agricultural holdings, industrial zones, and highway acreage.',
      hi: 'बड़े कृषि क्षेत्र, औद्योगिक क्षेत्र और हाईवे से लगे बड़े भूखंड।',
      ar: 'مساحات واسعة للاستثمار الزراعي والصناعي ومشاريع التطوير.',
      ur: 'وسیع زرعی اراضی، صنعتی زونز اور ہائی وے ایکڑز۔',
    },
    icon: Maximize2,
    count: '210+ Ads',
    group: 'Land',
  },
  {
    id: 'shop',
    name: 'Shop',
    slug: 'shop',
    localizedNames: {
      en: 'Shop',
      hi: 'दुकान / शोरूम',
      ar: 'محل تجاري / معرض',
      ur: 'دکان / شو روم',
    },
    description: {
      en: 'Retail stores, commercial showrooms, and market corner shops.',
      hi: 'रिटेल स्टोर्स, कमर्शियल शोरूम और मार्केट की दुकानें।',
      ar: 'محلات تجارية ومعارض على الشوارع الرئيسية ومراكز التسوق.',
      ur: 'ریٹیل دکانیں، کمرشل شو رومز اور مارکیٹ شاپس۔',
    },
    icon: Store,
    count: '760+ Ads',
    group: 'Commercial',
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    slug: 'warehouse',
    localizedNames: {
      en: 'Warehouse',
      hi: 'वेयरहाउस / गोदाम',
      ar: 'مستودع / مخازن لوجستية',
      ur: 'گودام / ویئر ہاؤس',
    },
    description: {
      en: 'Storage facilities, cold storage, and logistics dispatch depots.',
      hi: 'भंडारण गोदाम, कोल्ड स्टोरेज और लॉजिस्टिक्स डिपो।',
      ar: 'مستودعات تخزين ومراكز لوجستية مجهزة لشحن البضائع.',
      ur: 'اسٹوریج فیسیلٹیز، کولڈ اسٹوریج اور لاجسٹکس ڈپوز۔',
    },
    icon: Warehouse,
    count: '195+ Ads',
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
      en: 'Long-term corporate leases, institutional spaces, and IT parks.',
      hi: 'दीर्घकालिक कॉर्पोरेट लीज, संस्थागत जगहें और आईटी पार्क।',
      ar: 'عقارات للإيجار طويل الأجل والمقرات المؤسسية والشركات.',
      ur: 'کارپوریٹ لیز، دفتری عمارات اور آئی ٹی پارکس۔',
    },
    icon: KeyRound,
    count: '310+ Ads',
    group: 'Commercial',
  },
  {
    id: 'litigated',
    name: 'Litigated',
    slug: 'litigated',
    localizedNames: {
      en: 'Litigated',
      hi: 'न्यायाधीन / नीलामी संपत्ति (Litigated)',
      ar: 'عقارات قضائية / مزادات',
      ur: 'عدالتی تنازعات / نیلامی',
    },
    description: {
      en: 'Properties under dispute resolution, court settlement, or bank auctions with clear disclosures.',
      hi: 'विवाद समाधान, कोर्ट सेटलमेंट या बैंक नीलामी के तहत पूर्ण प्रकटीकरण वाली संपत्तियां।',
      ar: 'عقارات تخضع لتسويات قضائية أو مزادات بنكية مع إفصاحات كاملة.',
      ur: 'عدالتی یا بینک نیلامی کے تحت قانونی طور پر واضح شرائط والی پراپرٹیز۔',
    },
    icon: Scale,
    count: '65+ Ads',
    group: 'Special',
  },
];

export function getAllCategories(): CategoryDefinition[] {
  return CASA_CATEGORIES;
}

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return CASA_CATEGORIES.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === slug.toLowerCase(),
  );
}

export function getCategoryLabel(categoryNameOrSlug: string, locale: Locale = 'en'): string {
  const cat = getCategoryBySlug(categoryNameOrSlug);
  if (cat && cat.localizedNames[locale]) {
    return cat.localizedNames[locale];
  }
  return categoryNameOrSlug;
}
