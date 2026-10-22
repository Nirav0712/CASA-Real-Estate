import { fetchApi, getApiBaseUrl } from '@/lib/api-client';
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
  {
    id: 'prop-dev-ahm-1',
    slug: 'luxury-4bhk-contemporary-villa-bodakdev-ahmedabad',
    title: {
      en: 'Luxury 4 BHK Contemporary Villa & Private Terrace',
      hi: 'बोडकदेव में 4 बीएचके लक्जरी विला और प्राइवेट छत',
      ar: 'فيلا فاخرة 4 غرف نوم مع تراس خاص في بوداكدف',
      ur: 'بودک دیو میں 4 بی ایچ کے پرتعیش ولا',
    },
    description: {
      en: 'Exquisite architectural masterpiece in Bodakdev featuring Italian marble flooring, double-height ceiling, private landscaped lawn, modular German kitchen, and private parking. Walking distance from SG Highway.',
      hi: 'एसजी हाईवे के पास प्रीमियम विला, इटैलियन मार्बल फ्लोरिंग और प्राइवेट लॉन के साथ।',
      ar: 'تحفة معمارية استثنائية مع أرضيات رخامية وتشطيبات فاخرة وحديقة خاصة بالقرب من طريق إس جي.',
      ur: 'اٹالین ماربل اور پرائیویٹ لان کے ساتھ شاندار ولا۔',
    },
    category: 'House / Home',
    listingType: 'SALE',
    price: {
      amount: 32500000,
      currency: 'INR',
      isNegotiable: true,
    },
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Ahmedabad',
      city: 'Ahmedabad',
      locality: 'Bodakdev, SG Highway',
      coordinates: [72.5074, 23.0378],
    },
    specs: {
      bedrooms: 4,
      bathrooms: 5,
      carpetAreaSqFt: 3800,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'FURNISHED',
      facing: 'North-East',
      parking: '3 Covered Cars',
      floorNumber: 'G+2 Floors',
      totalFloors: 3,
    },
    amenities: [
      'Private Landscaped Lawn',
      '24/7 Gated Security & Smart CCTV',
      'Solar Power Setup',
      'Italian Marble Throughout',
      'Clubhouse with Swimming Pool',
      'Electric Vehicle (EV) Charging Station',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Gujarat Apex Realty',
      phone: '+919925843531',
      isVerifiedAgent: true,
      agencyName: 'Ahmedabad Premier Brokerage',
    },
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-dev-ahm-2',
    slug: '2bhk-flat-shine-superb-apartments-gota-ahmedabad',
    title: {
      en: '2 BHK Modern Flat in Shine Superb Apartments, Gota',
      hi: 'शाइन सुपर्ब अपार्टमेंट्स, गोटा में 2 बीएचके फ्लैट',
      ar: 'شقة 2 غرف نوم حديثة في مجمع شاين سوبرب، غوتا أحمد أباد',
      ur: 'گوٹا احمد آباد میں 2 بی ایچ کے جدید فلیٹ',
    },
    description: {
      en: 'Bright and airy 2 BHK apartment with modular fittings, spacious balconies, uninterrupted water supply, landscaped children play area, and close proximity to SG Highway and Vandematram.',
      hi: 'गोटा में वन्देमातरम के पास 2 बीएचके आधुनिक फ्लैट, बेहतरीन बालकनी और पार्किंग के साथ।',
      ar: 'شقة مريحة مؤلفة من غرفتي نوم مع مطبخ حديث وشرفة واسعة ومرافق عائلية متكاملة.',
      ur: 'احمد آباد میں تمام سہولیات سے آراستہ پرکشش 2 بی ایچ کے فلیٹ۔',
    },
    category: 'Apartment',
    listingType: 'SALE',
    price: {
      amount: 6800000,
      currency: 'INR',
      isNegotiable: true,
    },
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Ahmedabad',
      city: 'Ahmedabad',
      locality: 'Gota, SG Highway',
      coordinates: [72.5401, 23.1118],
    },
    specs: {
      bedrooms: 2,
      bathrooms: 2,
      carpetAreaSqFt: 1150,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'SEMI_FURNISHED',
      facing: 'East',
      parking: '1 Reserved Covered Parking',
      floorNumber: '7th of 14',
      totalFloors: 14,
    },
    amenities: [
      'High-Speed Elevators',
      'Children Play Garden',
      '24x7 Security & Intercom',
      'Covered Car Parking',
      'Community Hall & Gym',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Patel Brothers Realty',
      phone: '+919925843531',
      isVerifiedAgent: true,
      agencyName: 'Verified Ahmedabad Broker',
    },
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-dev-ahm-3',
    slug: 'corporate-commercial-office-prahlad-nagar-ahmedabad',
    title: {
      en: 'Prime Grade-A Commercial Office in Prahlad Nagar Boulevard',
      hi: 'प्रह्लाद नगर में ग्रेड-ए कमर्शियल ऑफिस स्पेस',
      ar: 'مكتب تجاري حديث من الدرجة الأولى في برهلاد نجار أحمد أباد',
      ur: 'پرہلاد نگر میں پرائم کمرشل آفس اسپیس',
    },
    description: {
      en: 'Plug-and-play corporate commercial space on 100ft road Prahlad Nagar, featuring reception lobby, conference suite, high-speed fiber internet, and 100% DG power backup.',
      hi: 'प्रह्लाद नगर 100 फीट रोड पर सुसज्जित कॉर्पोरेट ऑफिस स्पेस।',
      ar: 'مكتب مجهز بالكامل للشركات في أرقى شوارع الأعمال في أحمد أباد.',
      ur: 'کارپوریٹ کمپنیوں کے لیے بہترین لیس دفتر۔',
    },
    category: 'Office',
    listingType: 'RENT',
    price: {
      amount: 95000,
      currency: 'INR',
      isNegotiable: true,
    },
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Ahmedabad',
      city: 'Ahmedabad',
      locality: 'Prahlad Nagar Corporate Road',
      coordinates: [72.5085, 23.0076],
    },
    specs: {
      carpetAreaSqFt: 1450,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'FURNISHED',
      floorNumber: '5th of 12',
      totalFloors: 12,
    },
    amenities: [
      'Centrally Air Conditioned',
      '3 Dedicated Basement Parkings',
      '24/7 Access & Turnstiles',
      'High-Speed Elevators',
      'Conference & Cafeteria Zone',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Nirav Real Estate Advisory',
      phone: '+919925843531',
      isVerifiedAgent: true,
    },
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-dev-ahm-4',
    slug: 'neelkanth-park-1-apartment-memnagar-ahmedabad',
    title: {
      en: 'Neelkanth Park-1 Premium 3 BHK Apartment, Memnagar',
      hi: 'नीलकंठ पार्क-1 मेमनगर में 3 बीएचके प्रीमियम फ्लैट',
      ar: 'شقة نيلكانت بارك-1 الفاخرة 3 غرف في ميمنجار',
      ur: 'نیل کنٹھ پارک-1 میمنگر میں 3 بی ایچ کے فلیٹ',
    },
    description: {
      en: 'Beautifully maintained 3 BHK residence in Neelkanth Park-1, Memnagar. Close to Gujarat University, Drive-In Cinema, and top healthcare hubs. Features reserved parking and green landscape.',
      hi: 'मेमनगर में प्राइम लोकेशन पर स्थित 3 बीएचके फ्लैट।',
      ar: 'شقة سكنية ممتازة بالقرب من دور السينما والجامعات والمراكز الصحية.',
      ur: 'میمنگر میں 3 بی ایچ کے فلیٹ بہترین پوزیشن پر۔',
    },
    category: 'Apartment',
    listingType: 'SALE',
    price: {
      amount: 9200000,
      currency: 'INR',
      isNegotiable: true,
    },
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Ahmedabad',
      city: 'Ahmedabad',
      locality: 'Memnagar, Drive-In Road',
      coordinates: [72.5293, 23.0543],
    },
    specs: {
      bedrooms: 3,
      bathrooms: 3,
      carpetAreaSqFt: 1650,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'SEMI_FURNISHED',
      facing: 'North',
      parking: '1 Covered Car Parking',
      floorNumber: '3rd of 7',
      totalFloors: 7,
    },
    amenities: [
      'Gated Society Security',
      'Reserved Parking Slot',
      'Continuous 24h Water Supply',
      'Landscaped Garden',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Memnagar Property Network',
      phone: '+919925843531',
      isVerifiedAgent: true,
    },
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-dev-vad-1',
    slug: 'ultra-luxury-4bhk-duplex-villa-alkapuri-vadodara',
    title: {
      en: 'Ultra-Luxury 4 BHK Duplex Villa in Alkapuri, Vadodara',
      hi: 'अलकापुरी, वडोदरा में 4 बीएचके अल्ट्रा-लक्जरी डुप्लेक्स विला',
      ar: 'فيلا دوبلكس فاخرة للغاية 4 غرف نوم في ألكابوري فادودارا',
      ur: 'الکاپوری وڈودرا میں 4 بی ایچ کے لگژری ولا',
    },
    description: {
      en: 'Exclusive duplex villa nestled in the elite neighborhood of Alkapuri, Vadodara. Boasts designer landscaped backyard, double-height foyer, servant quarters, and imported fittings.',
      hi: 'वडोदरा के पॉश अलकापुरी क्षेत्र में डिजाइनर डुप्लेक्स विला।',
      ar: 'فيلا مميزة في أرقى أحياء فادودارا مع حديقة خاصة وتشطيبات مستوردة.',
      ur: 'وڈودرا کے پوش علاقے میں شاندار ڈوپلیکس ولا۔',
    },
    category: 'House / Home',
    listingType: 'SALE',
    price: {
      amount: 19500000,
      currency: 'INR',
      isNegotiable: true,
    },
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Vadodara',
      city: 'Vadodara',
      locality: 'Alkapuri, RC Dutt Road',
      coordinates: [73.1812, 22.3107],
    },
    specs: {
      bedrooms: 4,
      bathrooms: 4,
      carpetAreaSqFt: 3100,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'FURNISHED',
      facing: 'East',
      parking: '2 Covered Cars',
      floorNumber: 'G+1 Floors',
      totalFloors: 2,
    },
    amenities: [
      'Private Landscaped Backyard',
      '24/7 Gated Security & CCTV',
      'Solar Rooftop Grid',
      'Clubhouse & Badminton Court',
      'Servant Room with Attached Bath',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Vadodara Heritage Estates',
      phone: '+919925843531',
      isVerifiedAgent: true,
      agencyName: 'Vadodara Certified Agency',
    },
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-dev-vad-2',
    slug: '3bhk-contemporary-garden-apartment-vasna-bhayli-vadodara',
    title: {
      en: '3 BHK Contemporary Garden Facing Apartment, Vasna-Bhayli',
      hi: 'वासना-भायली, वडोदरा में 3 बीएचके गार्डन फेसिंग अपार्टमेंट',
      ar: 'شقة عصرية 3 غرف تطل على الحديقة في فاسنا بهايلي فادودارا',
      ur: 'واسنا بھائلی وڈودرا میں 3 بی ایچ کے اپارٹمنٹ',
    },
    description: {
      en: 'Sun-drenched 3 BHK apartment in the rapidly growing Vasna-Bhayli urban corridor of Vadodara. Features sprawling garden views, modular kitchen, and clubhouse access.',
      hi: 'वडोदरा के वासना-भायली रोड पर 3 बीएचके सुंदर अपार्टमेंट।',
      ar: 'شقة سكنية عصرية مع إطلالة خلابة ونادي صحي متكامل في فادودارا.',
      ur: 'وڈودرا میں پرسکون ماحول میں 3 بی ایچ کے خوبصورت اپارٹمنٹ۔',
    },
    category: 'Apartment',
    listingType: 'SALE',
    price: {
      amount: 7200000,
      currency: 'INR',
      isNegotiable: false,
    },
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Vadodara',
      city: 'Vadodara',
      locality: 'Vasna-Bhayli Road',
      coordinates: [73.1362, 22.2854],
    },
    specs: {
      bedrooms: 3,
      bathrooms: 3,
      carpetAreaSqFt: 1550,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'SEMI_FURNISHED',
      facing: 'North',
      parking: '1 Covered Car Parking',
      floorNumber: '5th of 11',
      totalFloors: 11,
    },
    amenities: [
      'Landscaped Central Park',
      'Swimming Pool & Toddler Pool',
      'Modern Gym & Yoga Deck',
      'Multi-tier Security Intercom',
      '24/7 Power Backup',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Sayaji City Realtors',
      phone: '+919925843531',
      isVerifiedAgent: true,
    },
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prop-dev-vad-3',
    slug: 'high-footfall-commercial-showroom-gotri-akota-vadodara',
    title: {
      en: 'High Footfall Corner Commercial Showroom, Gotri Road',
      hi: 'गोत्री रोड, वडोदरा पर हाई-फुटफॉल कमर्शियल शोरूम',
      ar: 'معرض تجاري ركني مميز على طريق غوتري فادودارا',
      ur: 'گوتری روڈ وڈودرا پر شاندار کمرشل شو روم',
    },
    description: {
      en: 'Wide frontage commercial showroom on Gotri Main Road near Akota junction. Ideal for retail stores, banking branch, electronics, or clinic.',
      hi: 'गोत्री मुख्य मार्ग पर विस्तृत फ्रंट वाला कमर्शियल शोरूम।',
      ar: 'معرض تجاري بموقع استراتيجي ممتاز على الشارع الرئيسي في فادودارا.',
      ur: 'وڈودرا کے مصروف تجارتی مرکز میں دکان اور شو روم۔',
    },
    category: 'Shop',
    listingType: 'RENT',
    price: {
      amount: 65000,
      currency: 'INR',
      isNegotiable: true,
    },
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Vadodara',
      city: 'Vadodara',
      locality: 'Gotri Road, Akota Junction',
      coordinates: [73.1554, 22.3129],
    },
    specs: {
      carpetAreaSqFt: 980,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'UNFURNISHED',
      floorNumber: 'Ground Floor',
      totalFloors: 5,
    },
    amenities: [
      '30ft Road-Facing Glass Frontage',
      'Heavy 3-Phase Electric Connection',
      'Customer Parking in Front',
      '24/7 Security',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    advertiser: {
      name: 'Gujarat Commercial Ventures',
      phone: '+919925843531',
      isVerifiedAgent: true,
    },
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: new Date().toISOString(),
  },
];

// ==========================================
// LOCATION-BASED PRIORITIZATION HELPER
// ==========================================

export function sortPropertiesByLocation(
  properties: Property[],
  targetCity?: string,
  targetState?: string
): Property[] {
  if (!targetCity && !targetState) return properties;

  const normCity = (targetCity || '').toLowerCase().trim();
  const normState = (targetState || '').toLowerCase().trim();

  return [...properties].sort((a, b) => {
    const aCity = (a.location?.city || '').toLowerCase().trim();
    const bCity = (b.location?.city || '').toLowerCase().trim();
    const aState = (a.location?.state || '').toLowerCase().trim();
    const bState = (b.location?.state || '').toLowerCase().trim();

    // 1. Exact city match gets top priority
    const aCityMatch = Boolean(normCity && normCity !== 'all' && (aCity === normCity || aCity.includes(normCity) || normCity.includes(aCity)));
    const bCityMatch = Boolean(normCity && normCity !== 'all' && (bCity === normCity || bCity.includes(normCity) || normCity.includes(bCity)));
    if (aCityMatch && !bCityMatch) return -1;
    if (!aCityMatch && bCityMatch) return 1;

    // 2. State match gets second priority
    const aStateMatch = Boolean(normState && normState !== 'all' && (aState === normState || aState.includes(normState) || normState.includes(aState)));
    const bStateMatch = Boolean(normState && normState !== 'all' && (bState === normState || bState.includes(normState) || normState.includes(bState)));
    if (aStateMatch && !bStateMatch) return -1;
    if (!aStateMatch && bStateMatch) return 1;

    // 3. Keep featured first within same priority
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;

    return 0;
  });
}

// ==========================================
// PUBLIC MARKETPLACE SERVICES
// ==========================================

export async function getFeaturedProperties(options?: {
  userCity?: string;
  userState?: string;
}): Promise<{
  properties: Property[];
  source: 'api' | 'fallback_dev';
}> {
  const result = await fetchApi<Property[]>('/properties?featured=true');
  if (result.isBackendAvailable && result.data && Array.isArray(result.data) && result.data.length > 0) {
    const sorted = sortPropertiesByLocation(result.data, options?.userCity, options?.userState);
    return { properties: sorted, source: 'api' };
  }
  const fallbackFeatured = DEV_FALLBACK_PROPERTIES.filter((p) => p.isFeatured);
  const sorted = sortPropertiesByLocation(fallbackFeatured, options?.userCity, options?.userState);
  return { properties: sorted, source: 'fallback_dev' };
}

export interface GetPropertiesFilterOptions {
  category?: string;
  type?: string;
  listingType?: string;
  country?: string;
  state?: string;
  city?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  q?: string;
  featured?: boolean;
  hasVideo?: boolean;
  userCity?: string;
  userState?: string;
}

export async function getProperties(params?: GetPropertiesFilterOptions): Promise<{
  properties: Property[];
  source: 'api' | 'fallback_dev';
}> {
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }
  const typeVal = params?.listingType || params?.type;
  if (typeVal && typeVal !== 'all') {
    searchParams.set('listingType', typeVal);
    searchParams.set('type', typeVal);
  }
  if (params?.country && params.country !== 'all') {
    searchParams.set('country', params.country);
  }
  if (params?.state && params.state !== 'all') {
    searchParams.set('state', params.state);
  }
  if (params?.city && params.city !== 'all') {
    searchParams.set('city', params.city);
  }
  if (params?.minPrice !== undefined && params.minPrice !== '') {
    searchParams.set('minPrice', String(params.minPrice));
  }
  if (params?.maxPrice !== undefined && params.maxPrice !== '') {
    searchParams.set('maxPrice', String(params.maxPrice));
  }
  if (params?.q && params.q.trim()) {
    searchParams.set('q', params.q.trim());
  }
  if (params?.featured) {
    searchParams.set('featured', 'true');
  }
  if (params?.hasVideo) {
    searchParams.set('hasVideo', 'true');
  }

  const endpoint = `/properties${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const result = await fetchApi<Property[]>(endpoint, { cache: 'no-store' });

  if (result.isBackendAvailable && result.data && Array.isArray(result.data)) {
    const sorted = sortPropertiesByLocation(
      result.data,
      params?.city && params.city !== 'all' ? params.city : params?.userCity,
      params?.state && params.state !== 'all' ? params.state : params?.userState
    );
    return { properties: sorted, source: 'api' };
  }

  // Fallback filtering in memory
  let filtered = [...DEV_FALLBACK_PROPERTIES];

  if (params?.hasVideo) {
    filtered = filtered.filter(
      (p) => Boolean(p.media?.videoUrl || (p as any).videoUrl || (p.media?.videos && p.media.videos.length > 0))
    );
  }

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

  if (typeVal && typeVal !== 'all') {
    filtered = filtered.filter(
      (p) => p.listingType?.toLowerCase() === typeVal.toLowerCase()
    );
  }

  if (params?.country && params.country !== 'all') {
    const cQuery = params.country.toLowerCase().replace(/[\s-]+/g, '');
    filtered = filtered.filter((p) => {
      const propCountry = (p.location?.country || 'India').toLowerCase().replace(/[\s-]+/g, '');
      return propCountry.includes(cQuery) || cQuery.includes(propCountry);
    });
  }

  if (params?.state && params.state !== 'all') {
    const sQuery = params.state.toLowerCase().replace(/[\s-]+/g, '');
    filtered = filtered.filter((p) => {
      const propState = (p.location?.state || '').toLowerCase().replace(/[\s-]+/g, '');
      return propState.includes(sQuery) || sQuery.includes(propState);
    });
  }

  if (params?.city && params.city !== 'all') {
    const ctQuery = params.city.toLowerCase().replace(/[\s-]+/g, '');
    filtered = filtered.filter((p) => {
      const propCity = (p.location?.city || '').toLowerCase().replace(/[\s-]+/g, '');
      return propCity.includes(ctQuery) || ctQuery.includes(propCity);
    });
  }

  if (params?.minPrice !== undefined && params.minPrice !== '') {
    filtered = filtered.filter((p) => (p.price?.amount || 0) >= Number(params.minPrice));
  }

  if (params?.maxPrice !== undefined && params.maxPrice !== '') {
    filtered = filtered.filter((p) => (p.price?.amount || 0) <= Number(params.maxPrice));
  }

  if (params?.q && params.q.trim()) {
    const q = params.q.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        (p.title?.en || '').toLowerCase().includes(q) ||
        (p.location?.locality || '').toLowerCase().includes(q) ||
        (p.location?.city || '').toLowerCase().includes(q) ||
        (p.location?.state || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }

  const sorted = sortPropertiesByLocation(
    filtered,
    params?.city && params.city !== 'all' ? params.city : params?.userCity,
    params?.state && params.state !== 'all' ? params.state : params?.userState
  );

  return { properties: sorted, source: 'fallback_dev' };
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
  const result = await fetchApi<PaginatedResponse<Property>>(endpoint, { cache: 'no-store' });

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

export async function uploadPropertyVideo(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ url: string; videoType: string; originalName?: string; size?: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    const apiBase = getApiBaseUrl();

    xhr.open('POST', `${apiBase}/properties/upload-video`);

    // Attach auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('casa_access_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      let resp: any = null;
      try {
        resp = JSON.parse(xhr.responseText);
      } catch {
        resp = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const data = resp?.data !== undefined ? resp.data : resp;
        resolve(data);
      } else {
        const errorMsg =
          resp?.message || resp?.error || `Upload failed with status ${xhr.status}`;
        const finalMsg = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg;
        reject(new Error(finalMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during video upload. Please check your connection.'));
    };

    xhr.send(formData);
  });
}
