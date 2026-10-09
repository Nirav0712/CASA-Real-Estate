import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/auth.enums';
import {
  SearchPropertiesDto,
  PropertySortOption,
  ListingFreshnessOption,
} from './dto/search-properties.dto';

const INITIAL_SEED_CATEGORIES = [
  { code: 'HOUSE', name: 'House / Home', description: 'Independent villas, kothis, duplexes, bungalows', sortOrder: 1 },
  { code: 'APARTMENT', name: 'Apartment', description: 'Multistorey apartments, high-rises, penthouses', sortOrder: 2 },
  { code: 'FLATS', name: 'Flats', description: 'Builder floors, budget society flats', sortOrder: 3 },
  { code: 'PLOTTING_LAND', name: 'Plotting Land', description: 'Approved layout residential plots, gated townships', sortOrder: 4 },
  { code: 'SMALL_LAND', name: 'Small Land', description: 'Small farmettes, homestead land parcels under 1 acre', sortOrder: 5 },
  { code: 'BIG_LAND', name: 'Big Land', description: 'Large commercial/agricultural tracts, highway frontages', sortOrder: 6 },
  { code: 'SHOP', name: 'Shop', description: 'Retail shops, high-street storefronts, showrooms', sortOrder: 7 },
  { code: 'WAREHOUSE', name: 'Warehouse', description: 'Logistics hubs, cold storage, industrial godowns', sortOrder: 8 },
  { code: 'LEASE', name: 'Lease', description: 'Commercial office floors, turnkey corporate spaces', sortOrder: 9 },
  { code: 'LITIGATED', name: 'Litigated', description: 'Court-disclosed assets, SARFAESI bank auctions', sortOrder: 10 },
];

const INITIAL_SEED_PROPERTIES = [
  {
    id: 'prop-dev-1',
    referenceId: 'CASA-PROP-1001',
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
      priceUnit: 'TOTAL',
      isNegotiable: true,
      maintenance: 4500,
      securityDeposit: 0,
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      city: 'Lucknow',
      locality: 'Gomti Nagar Extension',
      landmark: 'Near Ekana Stadium',
      pincode: '226010',
      coordinates: [80.9984, 26.8526],
    },
    specs: {
      bedrooms: 4,
      bathrooms: 5,
      area: 3200,
      areaUnit: 'SQ_FT',
      carpetArea: 3000,
      carpetAreaSqFt: 3200,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'SEMI_FURNISHED',
      facing: 'North-East',
      parking: '2 Covered Cars',
      floorLevel: 'G+2 Floors',
      floorNumber: 'G+2 Floors',
      totalFloors: 3,
      propertyAge: '0-1 years',
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
      coverImage:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      ],
      videos: [],
    },
    advertiser: {
      name: 'Verma Estates & Consulting',
      phone: '+919925843599',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
      agencyName: 'Verma Luxury Properties',
    },
    status: 'PUBLISHED',
    isPublished: true,
    publishedAt: new Date(),
    isFeatured: true,
    ownerId: 'usr-admin-seed',
  },
  {
    id: 'prop-dev-2',
    referenceId: 'CASA-PROP-1002',
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
    },
    category: 'Apartment',
    listingType: 'SALE',
    price: {
      amount: 9200000,
      currency: 'INR',
      priceUnit: 'TOTAL',
      isNegotiable: false,
      maintenance: 3200,
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      city: 'Lucknow',
      locality: 'Shaheed Path',
      landmark: 'Near Lulu Mall',
      pincode: '226030',
      coordinates: [80.985, 26.812],
    },
    specs: {
      bedrooms: 3,
      bathrooms: 3,
      area: 1850,
      areaUnit: 'SQ_FT',
      carpetArea: 1650,
      carpetAreaSqFt: 1850,
      constructionStatus: 'READY_TO_MOVE',
      furnishing: 'FURNISHED',
      facing: 'East',
      parking: '1 Covered, 1 Open',
      floorNumber: '14th of 22',
      totalFloors: 22,
      propertyAge: '1-3 years',
    },
    amenities: [
      'Swimming Pool & Jacuzzi',
      'Modern Gymnasium',
      '24/7 Security & Video Intercom',
      'High-Speed Elevators',
    ],
    media: {
      thumbnailUrl:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      coverImage:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      ],
      videos: [],
    },
    advertiser: {
      name: 'Skyline Realty Partners',
      phone: '+919876543210',
      isVerifiedAgent: true,
      role: 'VERIFIED_AGENT',
      agencyName: 'Skyline Capital Assets',
    },
    status: 'PUBLISHED',
    isPublished: true,
    publishedAt: new Date(),
    isFeatured: true,
    ownerId: 'usr-admin-seed',
  },
  {
    id: 'prop-dev-3',
    referenceId: 'CASA-PROP-1003',
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
      priceUnit: 'PER_MONTH',
      isNegotiable: true,
      maintenance: 5000,
      securityDeposit: 255000,
      rentPeriod: 'MONTHLY',
    },
    location: {
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      city: 'Lucknow',
      locality: 'Hazratganj Main Market',
      landmark: 'Opposite GPO',
      pincode: '226001',
      coordinates: [80.9462, 26.8467],
    },
    specs: {
      area: 850,
      areaUnit: 'SQ_FT',
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
      coverImage:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      ],
      videos: [],
    },
    advertiser: {
      name: 'Alok Dixit Properties',
      phone: '+919925843599',
      isVerifiedAgent: true,
      role: 'PROPERTY_OWNER',
    },
    status: 'PUBLISHED',
    isPublished: true,
    publishedAt: new Date(),
    isFeatured: false,
    ownerId: 'usr-admin-seed',
  },
];

import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class PropertiesService implements OnModuleInit {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async onModuleInit() {
    await this.seedDatabaseIfEmpty();
  }

  private async seedDatabaseIfEmpty() {
    try {
      const catCount = await this.categoryModel.countDocuments();
      if (catCount === 0) {
        this.logger.log('Seeding canonical categories into MongoDB Atlas...');
        await this.categoryModel.insertMany(INITIAL_SEED_CATEGORIES);
        this.logger.log('✅ Canonical categories seeded successfully.');
      }

      const propCount = await this.propertyModel.countDocuments();
      if (propCount === 0) {
        this.logger.log('Seeding initial verified properties into MongoDB Atlas...');
        await this.propertyModel.insertMany(INITIAL_SEED_PROPERTIES);
        this.logger.log('✅ Verified properties seeded successfully into MongoDB Atlas.');
      } else {
        // Ensure any existing ACTIVE seed items also have isPublished=true
        await this.propertyModel.updateMany(
          { status: { $in: ['ACTIVE', 'PUBLISHED'] }, isPublished: { $ne: true } },
          { $set: { isPublished: true, status: 'PUBLISHED' } },
        );
      }
    } catch (err: any) {
      this.logger.warn(`Database seeding note: ${err?.message}`);
    }
  }

  // ==========================================
  // PUBLIC PROPERTY APIS
  // ==========================================

  async findAll(query: {
    category?: string;
    type?: string;
    country?: string;
    state?: string;
    city?: string;
    q?: string;
    featured?: boolean | string;
    status?: string;
    minPrice?: number | string;
    maxPrice?: number | string;
    bedrooms?: number | string;
    limit?: number | string;
    skip?: number | string;
    page?: number | string;
  }) {
    try {
      const filter: any = {};

      // Strict public visibility invariant: ONLY published items visible to public
      if (query.status && ['PUBLISHED', 'ACTIVE'].includes(query.status.toUpperCase())) {
        filter.status = query.status.toUpperCase();
      } else {
        filter.status = { $in: ['PUBLISHED', 'ACTIVE'] };
      }
      filter.isPublished = true;

      if (query.featured === true || query.featured === 'true') {
        filter.isFeatured = true;
      }

      if (query.type && query.type !== 'all') {
        filter.listingType = new RegExp(`^${query.type}$`, 'i');
      }

      if (query.category && query.category !== 'all') {
        const catNormalized = query.category.trim();
        filter.category = new RegExp(catNormalized, 'i');
      }

      if (query.country && query.country !== 'all') {
        filter['location.country'] = new RegExp(query.country.trim(), 'i');
      }

      if (query.state && query.state !== 'all') {
        filter['location.state'] = new RegExp(query.state.trim(), 'i');
      }

      if (query.city && query.city !== 'all') {
        filter['location.city'] = new RegExp(query.city.trim(), 'i');
      }

      if (query.minPrice || query.maxPrice) {
        filter['price.amount'] = {};
        if (query.minPrice) filter['price.amount'].$gte = Number(query.minPrice);
        if (query.maxPrice) filter['price.amount'].$lte = Number(query.maxPrice);
      }

      if (query.bedrooms && query.bedrooms !== 'all') {
        filter['specs.bedrooms'] = Number(query.bedrooms);
      }

      if (query.q && query.q.trim()) {
        const searchRegex = new RegExp(query.q.trim(), 'i');
        filter.$or = [
          { 'title.en': searchRegex },
          { 'title.hi': searchRegex },
          { 'description.en': searchRegex },
          { 'location.locality': searchRegex },
          { 'location.city': searchRegex },
          { 'location.state': searchRegex },
          { 'location.country': searchRegex },
          { category: searchRegex },
        ];
      }

      const limit = query.limit ? Number(query.limit) : 50;
      const page = query.page ? Math.max(1, Number(query.page)) : 1;
      const skip = query.skip ? Number(query.skip) : (page - 1) * limit;

      const [total, properties] = await Promise.all([
        this.propertyModel.countDocuments(filter),
        this.propertyModel
          .find(filter)
          .sort({ isFeatured: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      return properties;
    } catch (err: any) {
      this.logger.error(`Failed to query properties: ${err?.message}`);
      return [];
    }
  }

  /**
   * Phase 07 — Dedicated Multi-Facet Search & Discovery Engine
   */
  async search(dto: SearchPropertiesDto) {
    try {
      const filter: any = {};

      // 1. Invariant: Public Discovery ONLY returns strictly published listings
      filter.status = { $in: ['PUBLISHED', 'ACTIVE'] };
      filter.isPublished = true;

      // 2. Keyword Search across multilingual title, description, location, category, referenceId
      if (dto.q && dto.q.trim()) {
        const qTrim = dto.q.trim();
        const searchRegex = new RegExp(qTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { 'title.en': searchRegex },
          { 'title.hi': searchRegex },
          { 'description.en': searchRegex },
          { 'description.hi': searchRegex },
          { 'location.locality': searchRegex },
          { 'location.city': searchRegex },
          { 'location.district': searchRegex },
          { 'location.state': searchRegex },
          { 'location.country': searchRegex },
          { category: searchRegex },
          { referenceId: searchRegex },
        ];
      }

      // 3. Category Filter
      if (dto.category && dto.category !== 'all') {
        const catClean = dto.category.trim();
        filter.category = new RegExp(`^${catClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      }

      // 4. Listing Type Filter (SALE / RENT / LEASE)
      if (dto.listingType && dto.listingType !== 'all') {
        filter.listingType = new RegExp(`^${dto.listingType.trim()}$`, 'i');
      }

      // 5. Hierarchical Location Filters (Legacy Names + Normalized IDs)
      if (dto.countryId) {
        filter['location.countryId'] = dto.countryId;
      } else if (dto.country && dto.country !== 'all') {
        filter['location.country'] = new RegExp(dto.country.trim(), 'i');
      }

      if (dto.stateId) {
        filter['location.stateId'] = dto.stateId;
      } else if (dto.state && dto.state !== 'all') {
        filter['location.state'] = new RegExp(dto.state.trim(), 'i');
      }

      if (dto.districtId) {
        filter['location.districtId'] = dto.districtId;
      } else if (dto.district && dto.district !== 'all') {
        filter['location.district'] = new RegExp(dto.district.trim(), 'i');
      }

      if (dto.cityId) {
        filter['location.cityId'] = dto.cityId;
      } else if (dto.city && dto.city !== 'all') {
        filter['location.city'] = new RegExp(dto.city.trim(), 'i');
      }

      if (dto.localityId) {
        filter['location.localityId'] = dto.localityId;
      } else if (dto.locality && dto.locality !== 'all') {
        filter['location.locality'] = new RegExp(dto.locality.trim(), 'i');
      }

      if (dto.pincodeId) {
        filter['location.pincodeId'] = dto.pincodeId;
      } else if (dto.pincode && dto.pincode.trim()) {
        filter['location.pincode'] = dto.pincode.trim();
      }

      if (dto.locationId) {
        filter.$or = [
          ...(filter.$or || []),
          { 'location.localityId': dto.locationId },
          { 'location.cityId': dto.locationId },
          { 'location.districtId': dto.locationId },
          { 'location.stateId': dto.locationId },
          { 'location.countryId': dto.locationId },
        ];
      }

      // 6. Numeric Price Range
      if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
        filter['price.amount'] = {};
        if (dto.minPrice !== undefined && !isNaN(Number(dto.minPrice))) {
          filter['price.amount'].$gte = Number(dto.minPrice);
        }
        if (dto.maxPrice !== undefined && !isNaN(Number(dto.maxPrice))) {
          filter['price.amount'].$lte = Number(dto.maxPrice);
        }
      }

      // 7. Area Range (Sq.Ft)
      if (dto.minArea !== undefined || dto.maxArea !== undefined) {
        const areaCondition: any = {};
        if (dto.minArea !== undefined && !isNaN(Number(dto.minArea))) {
          areaCondition.$gte = Number(dto.minArea);
        }
        if (dto.maxArea !== undefined && !isNaN(Number(dto.maxArea))) {
          areaCondition.$lte = Number(dto.maxArea);
        }
        filter['specs.carpetAreaSqFt'] = areaCondition;
      }

      // 8. Specifications (Bedrooms, Bathrooms, Furnishing, Facing, Construction, Age)
      if (dto.bedrooms !== undefined && !isNaN(Number(dto.bedrooms))) {
        const b = Number(dto.bedrooms);
        if (b >= 5) {
          filter['specs.bedrooms'] = { $gte: 5 };
        } else if (b > 0) {
          filter['specs.bedrooms'] = b;
        }
      }

      if (dto.bathrooms !== undefined && !isNaN(Number(dto.bathrooms))) {
        const bath = Number(dto.bathrooms);
        if (bath >= 4) {
          filter['specs.bathrooms'] = { $gte: 4 };
        } else if (bath > 0) {
          filter['specs.bathrooms'] = bath;
        }
      }

      if (dto.constructionStatus && dto.constructionStatus !== 'all') {
        filter['specs.constructionStatus'] = new RegExp(`^${dto.constructionStatus.trim()}$`, 'i');
      }

      if (dto.furnishing && dto.furnishing !== 'all') {
        filter['specs.furnishing'] = new RegExp(`^${dto.furnishing.trim()}$`, 'i');
      }

      if (dto.facing && dto.facing !== 'all') {
        filter['specs.facing'] = new RegExp(`^${dto.facing.trim()}$`, 'i');
      }

      if (dto.propertyAge && dto.propertyAge !== 'all') {
        filter['specs.propertyAge'] = new RegExp(`^${dto.propertyAge.trim()}$`, 'i');
      }

      // 9. Amenities (AND-logic filtering)
      if (dto.amenities && dto.amenities.trim()) {
        const amenitiesList = dto.amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
        if (amenitiesList.length > 0) {
          filter.amenities = { $all: amenitiesList };
        }
      }

      // 10. Listing Freshness Filter
      if (dto.freshness && dto.freshness !== ListingFreshnessOption.ALL) {
        const now = Date.now();
        let msOffset = 0;
        if (dto.freshness === ListingFreshnessOption.TODAY) msOffset = 24 * 60 * 60 * 1000;
        else if (dto.freshness === ListingFreshnessOption.LAST_3_DAYS) msOffset = 3 * 24 * 60 * 60 * 1000;
        else if (dto.freshness === ListingFreshnessOption.LAST_7_DAYS) msOffset = 7 * 24 * 60 * 60 * 1000;
        else if (dto.freshness === ListingFreshnessOption.LAST_30_DAYS) msOffset = 30 * 24 * 60 * 60 * 1000;

        if (msOffset > 0) {
          const thresholdDate = new Date(now - msOffset);
          filter.$or = [
            { publishedAt: { $gte: thresholdDate } },
            { createdAt: { $gte: thresholdDate } },
          ];
        }
      }

      // 11. Featured Filter
      if (dto.featured === true) {
        filter.isFeatured = true;
      }

      // 12. Sorting Options
      let sortObj: any = { isFeatured: -1, publishedAt: -1, createdAt: -1 };
      switch (dto.sort) {
        case PropertySortOption.OLDEST:
          sortObj = { publishedAt: 1, createdAt: 1 };
          break;
        case PropertySortOption.PRICE_LOW:
          sortObj = { 'price.amount': 1, createdAt: -1 };
          break;
        case PropertySortOption.PRICE_HIGH:
          sortObj = { 'price.amount': -1, createdAt: -1 };
          break;
        case PropertySortOption.AREA_LOW:
          sortObj = { 'specs.carpetAreaSqFt': 1, 'specs.area': 1, createdAt: -1 };
          break;
        case PropertySortOption.AREA_HIGH:
          sortObj = { 'specs.carpetAreaSqFt': -1, 'specs.area': -1, createdAt: -1 };
          break;
        case PropertySortOption.FEATURED:
          sortObj = { isFeatured: -1, publishedAt: -1, createdAt: -1 };
          break;
        case PropertySortOption.NEWEST:
        default:
          sortObj = { isFeatured: -1, publishedAt: -1, createdAt: -1 };
          break;
      }

      // 13. Pagination Parameters
      const page = Math.max(1, Number(dto.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(dto.limit) || 12));
      const skip = (page - 1) * limit;

      // Projection excluding private moderation details
      const projection = {
        moderation: 0,
        adminRemark: 0,
        rejectionReason: 0,
        moderationRemarks: 0,
      };

      const [total, items] = await Promise.all([
        this.propertyModel.countDocuments(filter),
        this.propertyModel
          .find(filter, projection)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (err: any) {
      this.logger.error(`Search error: ${err?.message}`);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  }

  async findBySlug(slug: string, user?: AuthenticatedUser, ip?: string) {
    try {
      const query: any = {
        $or: [{ slug }, { id: slug }],
      };
      if (isValidObjectId(slug)) {
        query.$or.push({ _id: slug });
      }

      const property = await this.propertyModel.findOne(query).lean();

      if (!property) {
        throw new NotFoundException(`Property with identifier "${slug}" not found`);
      }

      // Check contact visibility via entitlements
      let hasContactPermission = false;
      if (user) {
        if (user.platformRole === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN' || user.platformRole === 'ADMIN') {
          hasContactPermission = true;
        } else if (this.entitlementsService) {
          const viewResult = await this.entitlementsService.trackAndValidatePropertyView(
            user.id,
            (property as any)._id ? (property as any)._id.toString() : (property as any).id,
            ip || '127.0.0.1',
          );
          hasContactPermission = viewResult.contactVisible;
        }
      }

      if (this.entitlementsService) {
        return this.entitlementsService.redactContactData(property, hasContactPermission);
      }

      return property;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException(`Property with identifier "${slug}" not found`);
    }
  }

  async findById(id: string, user?: AuthenticatedUser, ip?: string) {
    return this.findBySlug(id, user, ip);
  }

  // ==========================================
  // AGENT & PROPERTY OWNER WORKFLOW (PROTECTED)
  // ==========================================

  async createProperty(dto: any, user?: AuthenticatedUser) {
    const titleEn = typeof dto.title === 'string' ? dto.title : dto.title?.en || 'New Property Listing';
    const slug =
      dto.slug ||
      titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
        '-' +
        Date.now().toString().slice(-5);

    const id = dto.id || `prop-${Date.now()}`;
    const referenceId = dto.referenceId || `CASA-${Date.now().toString().slice(-6)}`;

    const titleObj =
      typeof dto.title === 'string'
        ? { en: dto.title }
        : dto.title || { en: 'New Property Listing' };

    const descObj =
      typeof dto.description === 'string'
        ? { en: dto.description }
        : dto.description || { en: 'Detailed property description.' };

    const priceObj =
      typeof dto.price === 'number'
        ? { amount: dto.price, currency: 'INR', priceUnit: 'TOTAL', isNegotiable: true }
        : {
            amount: Number(dto.price?.amount || 0),
            currency: dto.price?.currency || 'INR',
            priceUnit: dto.price?.priceUnit || 'TOTAL',
            isNegotiable: dto.price?.isNegotiable !== undefined ? dto.price.isNegotiable : true,
            maintenance: Number(dto.price?.maintenance || 0),
            securityDeposit: Number(dto.price?.securityDeposit || 0),
            rentPeriod: dto.price?.rentPeriod,
          };

    const locObj =
      typeof dto.location === 'string'
        ? {
            state: 'Uttar Pradesh',
            district: 'Lucknow',
            city: 'Lucknow',
            locality: dto.location,
            coordinates: [80.9462, 26.8467] as [number, number],
          }
        : {
            state: dto.location?.state || 'Uttar Pradesh',
            district: dto.location?.district || 'Lucknow',
            city: dto.location?.city || 'Lucknow',
            locality: dto.location?.locality || 'Lucknow City',
            landmark: dto.location?.landmark,
            pincode: dto.location?.pincode,
            coordinates: dto.location?.coordinates || [80.9462, 26.8467],
          };

    const mediaObj = dto.media || {
      thumbnailUrl:
        dto.thumbnailUrl ||
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      coverImage: dto.coverImage,
      images: dto.images || [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      ],
      videos: dto.videos || [],
    };

    const advertiserObj = dto.advertiser || {
      name: user?.name || dto.advertiserName || 'CASA Property Owner',
      phone: user?.mobile || dto.advertiserPhone || '+917359237870',
      email: user?.email,
      isVerifiedAgent: user?.isVerifiedAgent || false,
      role: user?.role || 'PROPERTY_OWNER',
    };

    // Safe default: Owners/agents always start as DRAFT
    // Even if Admin creates, unless explicitly requested, draft or submitted
    const isDirectAdmin =
      user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

    const initialStatus = isDirectAdmin && dto.status ? dto.status : 'DRAFT';
    const isPublished = initialStatus === 'PUBLISHED';

    const ownerId = user?.id || dto.ownerId || 'usr-anon';

    const propertyRecord = {
      id,
      referenceId,
      slug,
      ownerId,
      advertiserId: ownerId,
      createdBy: user?.id || 'system',
      updatedBy: user?.id || 'system',
      title: titleObj,
      description: descObj,
      category: dto.category || 'House / Home',
      listingType: dto.listingType || 'SALE',
      price: priceObj,
      location: locObj,
      specs: dto.specs || {},
      amenities: dto.amenities || ['24/7 Security', 'Water Supply'],
      media: mediaObj,
      advertiser: advertiserObj,
      status: initialStatus,
      isPublished,
      publishedAt: isPublished ? new Date() : undefined,
      isFeatured: isDirectAdmin && dto.isFeatured ? true : false,
      moderation: {
        riskScore: 'LOW',
        history: [
          {
            action: 'CREATED',
            actorId: user?.id || 'system',
            actorRole: user?.role || 'PROPERTY_OWNER',
            newStatus: initialStatus,
            timestamp: new Date(),
          },
        ],
      },
    };

    const created = await this.propertyModel.create(propertyRecord);
    this.logger.log(`✅ Property created in MongoDB Atlas: ${created.slug} (${created.id}) by ${ownerId}`);

    // Update category listing count
    await this.categoryModel
      .updateOne({ name: propertyRecord.category }, { $inc: { totalListings: 1 } })
      .catch(() => {});

    return created;
  }

  // Backward compatibility alias for public create endpoint
  async create(createPropertyDto: any) {
    return this.createProperty(createPropertyDto);
  }

  async findMyProperties(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required to fetch owned properties');
    }
    const properties = await this.propertyModel
      .find({
        $or: [{ ownerId: userId }, { advertiserId: userId }, { createdBy: userId }],
      })
      .sort({ createdAt: -1 })
      .lean();

    return properties;
  }

  async findMyPropertyById(id: string, userId: string) {
    const query: any = {
      $and: [
        { $or: [{ id }, { slug: id }] },
        { $or: [{ ownerId: userId }, { advertiserId: userId }, { createdBy: userId }] },
      ],
    };
    if (isValidObjectId(id)) {
      query.$and[0].$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query).lean();
    if (!property) {
      throw new NotFoundException(`Property "${id}" not found or unauthorized.`);
    }
    return property;
  }

  async updateProperty(id: string, updateDto: any, user?: AuthenticatedUser) {
    const query: any = { $or: [{ id }, { slug: id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const existing = await this.propertyModel.findOne(query);
    if (!existing) {
      throw new NotFoundException(`Property "${id}" not found for update`);
    }

    const isPrivileged =
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.MODERATOR;

    // Security Check: Non-privileged users can only edit their own listings
    if (user && !isPrivileged) {
      const isOwner =
        existing.ownerId === user.id ||
        existing.advertiserId === user.id ||
        existing.createdBy === user.id;

      if (!isOwner) {
        throw new ForbiddenException('You do not have permission to modify this property.');
      }

      // Security Check: Non-admins cannot alter status to APPROVED or PUBLISHED directly
      if (updateDto.status && ['APPROVED', 'PUBLISHED', 'ACTIVE'].includes(updateDto.status)) {
        delete updateDto.status;
      }
      if (updateDto.isPublished !== undefined) {
        delete updateDto.isPublished;
      }
      if (updateDto.isFeatured !== undefined) {
        delete updateDto.isFeatured;
      }
      if (updateDto.ownerId) {
        delete updateDto.ownerId;
      }
    }

    // Set updatedBy
    if (user) {
      updateDto.updatedBy = user.id;
    }

    const updated = await this.propertyModel
      .findOneAndUpdate(query, { $set: updateDto }, { new: true })
      .lean();

    return updated;
  }

  // Backward compatibility alias for controller
  async update(id: string, updateDto: any) {
    return this.updateProperty(id, updateDto);
  }

  async submitProperty(id: string, user: AuthenticatedUser) {
    const query: any = { $or: [{ id }, { slug: id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const property = await this.propertyModel.findOne(query);
    if (!property) {
      throw new NotFoundException(`Property "${id}" not found`);
    }

    const isPrivileged =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.MODERATOR;

    const isOwner =
      property.ownerId === user.id ||
      property.advertiserId === user.id ||
      property.createdBy === user.id;

    if (!isPrivileged && !isOwner) {
      throw new ForbiddenException('You cannot submit another user’s property.');
    }

    // Status state validation
    if (
      property.status !== 'DRAFT' &&
      property.status !== 'REJECTED' &&
      property.status !== 'UNPUBLISHED'
    ) {
      throw new BadRequestException(
        `Cannot submit property in status "${property.status}". Allowed from DRAFT, REJECTED, or UNPUBLISHED.`,
      );
    }

    const previousStatus = property.status;
    property.status = 'PENDING_REVIEW';
    property.isPublished = false;

    property.moderation = {
      ...(property.moderation || {}),
      previousStatus,
      history: [
        ...(property.moderation?.history || []),
        {
          action: 'SUBMITTED',
          actorId: user.id,
          actorRole: user.role,
          previousStatus,
          newStatus: 'PENDING_REVIEW',
          timestamp: new Date(),
        },
      ],
    };

    await property.save();
    this.logger.log(`📥 Property "${property.id}" submitted for CASA moderation by ${user.name || user.id}`);

    return {
      success: true,
      message: 'Your property has been submitted for CASA review.',
      property,
    };
  }

  async deleteProperty(id: string, user?: AuthenticatedUser) {
    const query: any = { $or: [{ id }, { slug: id }] };
    if (isValidObjectId(id)) {
      query.$or.push({ _id: id });
    }

    const existing = await this.propertyModel.findOne(query);
    if (!existing) {
      throw new NotFoundException(`Property "${id}" not found`);
    }

    const isPrivileged =
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN;

    if (user && !isPrivileged) {
      const isOwner =
        existing.ownerId === user.id ||
        existing.advertiserId === user.id ||
        existing.createdBy === user.id;

      if (!isOwner) {
        throw new ForbiddenException('You cannot delete another user’s property.');
      }

      // If already published, soft-delete to ARCHIVED
      if (existing.status === 'PUBLISHED' || existing.isPublished) {
        existing.status = 'ARCHIVED';
        existing.isPublished = false;
        existing.archivedAt = new Date();
        await existing.save();
        return { success: true, message: 'Published property has been archived safely.' };
      }
    }

    // Hard delete draft or admin deletion
    await this.propertyModel.findOneAndDelete(query);
    return { success: true, message: 'Property deleted successfully from database.' };
  }

  // Backward compatibility alias
  async delete(id: string) {
    return this.deleteProperty(id);
  }

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  async findAllCategories() {
    const categories = await this.categoryModel.find().sort({ sortOrder: 1 }).lean();
    if (!categories || categories.length === 0) {
      return INITIAL_SEED_CATEGORIES.map((c, i) => ({ ...c, id: `cat-${i + 1}`, isActive: true, totalListings: 0 }));
    }
    return categories;
  }

  async createCategory(dto: { name: string; code?: string; description?: string }) {
    const code =
      dto.code ||
      dto.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const existing = await this.categoryModel.findOne({
      $or: [{ code }, { name: dto.name }],
    });

    if (existing) {
      throw new BadRequestException(`Category with code "${code}" or name "${dto.name}" already exists`);
    }

    const count = await this.categoryModel.countDocuments();
    const created = await this.categoryModel.create({
      code,
      name: dto.name,
      description: dto.description || `${dto.name} real estate category`,
      totalListings: 0,
      isActive: true,
      sortOrder: count + 1,
    });

    this.logger.log(`✅ New category created in MongoDB Atlas: ${created.name} (${created.code})`);
    return created;
  }

  async deleteCategory(id: string) {
    await this.categoryModel.findOneAndDelete({
      $or: [{ _id: id }, { code: id }, { name: id }],
    });
    return { success: true, message: 'Category removed successfully' };
  }

  async toggleCategoryStatus(id: string) {
    const cat = await this.categoryModel.findOne({
      $or: [{ _id: id }, { code: id }, { name: id }],
    });
    if (!cat) throw new NotFoundException('Category not found');
    cat.isActive = !cat.isActive;
    await cat.save();
    return cat;
  }
}
