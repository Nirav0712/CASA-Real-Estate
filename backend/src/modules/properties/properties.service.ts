import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Property, PropertyDocument, PropertyStructureType } from './schemas/property.schema';
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
      if (
        propCount === 0 &&
        (process.env.NODE_ENV === 'test' || process.env.SEED_DEV_PROPERTIES === 'true')
      ) {
        this.logger.log('Seeding initial verified properties into MongoDB Atlas for test environment...');
        await this.propertyModel.insertMany(INITIAL_SEED_PROPERTIES);
        this.logger.log('✅ Verified properties seeded successfully into MongoDB Atlas.');
      }
    } catch (err: any) {
      this.logger.warn(`Database seeding note: ${err?.message}`);
    }
  }

  // ==========================================
  // MULTI-UNIT & PLOTTED DEVELOPMENT HELPERS
  // ==========================================

  validatePropertyUnits(structureType?: string, units?: any[]) {
    if (!units || !Array.isArray(units) || units.length === 0) {
      return;
    }

    if (structureType === PropertyStructureType.PLOTTED_DEVELOPMENT || structureType === 'PLOTTED_DEVELOPMENT') {
      const seenPlots = new Set<string>();
      for (const [index, unit] of units.entries()) {
        const plotNo = (unit.plotNumber || unit.unitNumber || '').toString().trim().toLowerCase();
        if (!plotNo) {
          throw new BadRequestException(`Plot at index ${index + 1} is missing a plot number.`);
        }
        if (seenPlots.has(plotNo)) {
          throw new BadRequestException(
            `Duplicate plot number "${unit.plotNumber || unit.unitNumber}" detected in this plotted project. Plot numbers must be unique within the layout.`,
          );
        }
        seenPlots.add(plotNo);

        if (unit.price !== undefined && Number(unit.price) < 0) {
          throw new BadRequestException(`Plot "${unit.plotNumber || unit.unitNumber}" cannot have a negative price.`);
        }
      }
    } else {
      // Building / Complex units with floor numbers
      const seenUnits = new Set<string>();
      for (const [index, unit] of units.entries()) {
        const unitNo = (unit.unitNumber || '').toString().trim().toLowerCase();
        if (!unitNo) {
          throw new BadRequestException(`Unit at index ${index + 1} is missing a unit number.`);
        }
        const floor = (unit.floorNumber !== undefined && unit.floorNumber !== null)
          ? String(unit.floorNumber).trim().toLowerCase()
          : 'default';
        const tower = (unit.towerName || '').toString().trim().toLowerCase();
        const key = `${tower}:${floor}:${unitNo}`;
        if (seenUnits.has(key)) {
          throw new BadRequestException(
            `Duplicate unit number "${unit.unitNumber}" detected on floor "${unit.floorNumber || 'G'}". Units on the same floor and tower must have unique unit numbers.`,
          );
        }
        seenUnits.add(key);

        if (unit.price !== undefined && Number(unit.price) < 0) {
          throw new BadRequestException(`Unit "${unit.unitNumber}" cannot have a negative price.`);
        }
      }
    }
  }

  async syncChildUnits(parent: any, user?: AuthenticatedUser) {
    if (!parent || !parent.isParentProject || !Array.isArray(parent.units) || parent.units.length === 0) {
      return;
    }

    const currentUnitIds = new Set<string>();

    for (let i = 0; i < parent.units.length; i++) {
      const unit = parent.units[i];
      const unitId = unit.unitId || `unit-${i + 1}-${Date.now()}`;
      unit.unitId = unitId;
      currentUnitIds.add(unitId);

      const childId = `${parent.id}-${unitId}`;
      const childReferenceId = `${parent.referenceId || 'CASA'}-${(unit.unitNumber || unit.plotNumber || `U${i + 1}`).toString().replace(/[^a-zA-Z0-9]/g, '')}`;
      const unitIdentifier = (unit.unitNumber || unit.plotNumber || `unit-${i + 1}`)
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const childSlug = `${parent.slug}-${unitIdentifier}`;

      const titleEn = unit.unitNumber || unit.plotNumber
        ? `${unit.unitType || 'Unit'} ${unit.unitNumber || unit.plotNumber} at ${parent.projectDetails?.projectName || parent.title?.en || 'Complex'}`
        : `Unit ${i + 1} at ${parent.projectDetails?.projectName || parent.title?.en || 'Complex'}`;

      const descEn = `${unit.unitType || 'Unit'} ${unit.unitNumber || unit.plotNumber || ''} on floor ${unit.floorNumber || 'G'} in ${parent.projectDetails?.projectName || parent.title?.en || ''}. ${parent.description?.en || ''}`;

      const isRental = unit.listingType === 'RENT' || unit.listingType === 'COMMERCIAL_LEASE';
      const priceAmount = isRental ? (Number(unit.monthlyRent) || Number(unit.price) || 0) : (Number(unit.price) || 0);

      const isAvail = unit.availabilityStatus === 'AVAILABLE' || unit.availabilityStatus === 'UNDER_OFFER' || unit.availabilityStatus === 'RESERVED';
      const childStatus = unit.availabilityStatus === 'SOLD' || unit.availabilityStatus === 'RENTED'
        ? 'SOLD_OR_RENTED'
        : (parent.status || 'DRAFT');
      const childIsPublished = Boolean(parent.isPublished && isAvail);

      const childDoc: any = {
        id: childId,
        referenceId: childReferenceId,
        slug: childSlug,
        ownerId: parent.ownerId,
        advertiserId: parent.advertiserId,
        createdBy: parent.createdBy || user?.id || 'system',
        updatedBy: user?.id || parent.updatedBy || 'system',
        title: { en: titleEn },
        description: { en: descEn },
        category: parent.category,
        subcategory: unit.unitType || parent.subcategory,
        listingType: unit.listingType || parent.listingType,
        price: {
          amount: priceAmount,
          currency: 'INR',
          priceUnit: isRental ? 'PER_MONTH' : 'TOTAL',
          isNegotiable: true,
          pricePerSqFt: unit.pricePerSqFt,
          monthlyRent: unit.monthlyRent,
          securityDeposit: unit.securityDeposit,
          maintenance: unit.maintenanceCharges || 0,
          preferredTenantType: unit.preferredTenantType,
          bachelorPreferences: unit.bachelorPreferences,
        },
        location: parent.location,
        specs: {
          area: unit.carpetArea || unit.builtUpArea || unit.plotArea || parent.specs?.area,
          areaUnit: unit.areaUnit || parent.specs?.areaUnit || 'SQ_FT',
          carpetArea: unit.carpetArea || unit.plotArea,
          carpetAreaSqFt: unit.carpetArea || unit.plotArea,
          builtUpArea: unit.builtUpArea,
          superBuiltUpArea: unit.superBuiltUpArea,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          balconies: unit.balconies,
          facing: unit.facing || parent.specs?.facing,
          furnishing: unit.furnishing || parent.specs?.furnishing,
          floorNumber: unit.floorNumber,
          floorLevel: unit.floorNumber ? `Floor ${unit.floorNumber}` : undefined,
          totalFloors: parent.projectDetails?.totalFloors || parent.specs?.totalFloors,
          possessionStatus: unit.possessionStatus || parent.specs?.possessionStatus,
          availableFrom: unit.availableFrom,
          // Plots
          plotDimensions: unit.plotLength && unit.plotWidth ? `${unit.plotLength} x ${unit.plotWidth} ft` : undefined,
          plotLength: unit.plotLength,
          plotBreadth: unit.plotWidth,
          cornerPlot: unit.cornerPlot,
          openSides: unit.openSides,
          roadWidthFt: unit.roadWidth,
        },
        amenities: Array.isArray(unit.amenities) && unit.amenities.length > 0 ? unit.amenities : (parent.amenities || []),
        media: {
          thumbnailUrl: unit.photos && unit.photos.length > 0 ? unit.photos[0] : (parent.media?.thumbnailUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'),
          coverImage: unit.photos && unit.photos.length > 0 ? unit.photos[0] : parent.media?.coverImage,
          images: unit.photos && unit.photos.length > 0 ? unit.photos : (parent.media?.images || []),
          videos: parent.media?.videos || [],
        },
        advertiser: parent.advertiser,
        rera: unit.unitRera?.reraNumber ? unit.unitRera : (parent.projectDetails?.projectRera || parent.rera),
        reraNumber: unit.unitRera?.reraNumber || parent.projectDetails?.projectRera?.reraNumber || parent.reraNumber,
        structureType: parent.structureType || 'INDEPENDENT',
        isParentProject: false,
        isChildUnit: true,
        parentPropertyId: parent.id,
        parentSlug: parent.slug,
        unitDetails: unit,
        status: childStatus,
        isPublished: childIsPublished,
        publishedAt: childIsPublished ? (parent.publishedAt || new Date()) : undefined,
      };

      await this.propertyModel.findOneAndUpdate(
        { $or: [{ id: childId }, { parentPropertyId: parent.id, 'unitDetails.unitId': unitId }] },
        { $set: childDoc },
        { upsert: true, new: true },
      );
    }

    // Remove any child units that were deleted from parent's unit list
    await this.propertyModel.deleteMany({
      parentPropertyId: parent.id,
      'unitDetails.unitId': { $nin: Array.from(currentUnitIds) },
    });

    this.logger.log(`✅ Synchronized ${currentUnitIds.size} child units for parent project "${parent.slug}" (${parent.id})`);
  }

  async updateUnitAvailability(
    propertyId: string,
    unitId: string,
    availabilityStatus: string,
    user?: AuthenticatedUser,
  ) {
    const validStatuses = ['AVAILABLE', 'UNDER_OFFER', 'SOLD', 'RENTED', 'RESERVED'];
    const normalizedStatus = (availabilityStatus || '').toUpperCase();
    if (!validStatuses.includes(normalizedStatus)) {
      throw new BadRequestException(
        `Invalid availability status "${availabilityStatus}". Allowed: ${validStatuses.join(', ')}`,
      );
    }

    const parent = await this.propertyModel.findOne({
      $or: [{ id: propertyId }, { slug: propertyId }, { 'units.unitId': unitId }],
    });

    if (!parent) {
      throw new NotFoundException(`Parent property for unit "${unitId}" not found.`);
    }

    const isPrivileged =
      user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
    if (user && !isPrivileged) {
      const isOwner =
        parent.ownerId === user.id ||
        parent.advertiserId === user.id ||
        parent.createdBy === user.id;
      if (!isOwner) {
        throw new ForbiddenException('You do not have permission to update this unit availability.');
      }
    }

    // Update inside parent.units array
    let matchedUnit: any = null;
    if (Array.isArray(parent.units)) {
      for (const u of parent.units) {
        if (u.unitId === unitId || u.unitNumber === unitId) {
          u.availabilityStatus = normalizedStatus;
          matchedUnit = u;
          break;
        }
      }
      parent.availableUnits = parent.units.filter((u) => u.availabilityStatus === 'AVAILABLE').length;
      parent.markModified('units');
      await parent.save();
    }

    // Update child unit document if exists
    const isAvail = normalizedStatus === 'AVAILABLE' || normalizedStatus === 'UNDER_OFFER' || normalizedStatus === 'RESERVED';
    const childStatus = normalizedStatus === 'SOLD' || normalizedStatus === 'RENTED'
      ? 'SOLD_OR_RENTED'
      : (parent.status || 'DRAFT');
    const childIsPublished = Boolean(parent.isPublished && isAvail);

    await this.propertyModel.updateOne(
      {
        $or: [
          { id: `${parent.id}-${unitId}` },
          { parentPropertyId: parent.id, 'unitDetails.unitId': unitId },
          { parentPropertyId: parent.id, 'unitDetails.unitNumber': unitId },
        ],
      },
      {
        $set: {
          'unitDetails.availabilityStatus': normalizedStatus,
          status: childStatus,
          isPublished: childIsPublished,
        },
      },
    );

    this.logger.log(`✅ Unit "${unitId}" availability updated to ${normalizedStatus} in project "${parent.id}"`);

    return {
      success: true,
      message: `Unit availability set to ${normalizedStatus}`,
      unit: matchedUnit,
      parentPropertyId: parent.id,
      availableUnits: parent.availableUnits,
      totalUnits: parent.totalUnits,
    };
  }

  async findUnitsByParentId(parentId: string) {
    const parent = await this.propertyModel.findOne({
      $or: [{ id: parentId }, { slug: parentId }],
    }).lean();

    if (!parent) {
      throw new NotFoundException(`Property with ID "${parentId}" not found.`);
    }

    if (parent.units && parent.units.length > 0) {
      return {
        parent: {
          id: parent.id,
          slug: parent.slug,
          title: parent.title,
          projectDetails: parent.projectDetails,
          structureType: parent.structureType,
        },
        units: parent.units,
        totalUnits: parent.units.length,
        availableUnits: parent.units.filter((u: any) => u.availabilityStatus === 'AVAILABLE').length,
      };
    }

    // Fallback: query child units
    const childUnits = await this.propertyModel.find({ parentPropertyId: parent.id }).lean();
    return {
      parent: {
        id: parent.id,
        slug: parent.slug,
        title: parent.title,
        projectDetails: parent.projectDetails,
        structureType: parent.structureType,
      },
      units: childUnits.map((c) => c.unitDetails || c),
      totalUnits: childUnits.length,
      availableUnits: childUnits.filter((c: any) => c.unitDetails?.availabilityStatus === 'AVAILABLE' || c.isPublished).length,
    };
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
    area?: string;
    subArea?: string;
    society?: string;
    hasVideo?: boolean | string;
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

      if (query.hasVideo === true || query.hasVideo === 'true') {
        filter.status = { $in: ['PUBLISHED', 'ACTIVE'] };
        filter.isPublished = true;
        filter.$or = [
          { 'media.videoUrl': { $exists: true, $nin: ['', null] } },
          { videoUrl: { $exists: true, $nin: ['', null] } },
          { 'media.videos.0': { $exists: true, $nin: ['', null] } },
        ];
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

      if (query.area && query.area !== 'all') {
        const areaRegex = new RegExp(query.area.trim(), 'i');
        filter.$or = [
          ...(filter.$or || []),
          { 'location.area': areaRegex },
          { 'location.locality': areaRegex },
        ];
      }

      if (query.subArea && query.subArea !== 'all') {
        filter['location.subArea'] = new RegExp(query.subArea.trim(), 'i');
      }

      if (query.society && query.society !== 'all') {
        filter['location.society'] = new RegExp(query.society.trim(), 'i');
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

      // 3b. Subcategory Filter
      if (dto.subcategory && dto.subcategory !== 'all') {
        const subClean = dto.subcategory.trim();
        filter.subcategory = new RegExp(`^${subClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      }

      // 4. Listing Type Filter (SALE / RENT / LEASE / PG_COLIVING / COMMERCIAL_LEASE)
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

      if (dto.area && dto.area !== 'all') {
        const areaRegex = new RegExp(dto.area.trim(), 'i');
        filter.$or = [
          ...(filter.$or || []),
          { 'location.area': areaRegex },
          { 'location.locality': areaRegex },
        ];
      }

      if (dto.subArea && dto.subArea !== 'all') {
        filter['location.subArea'] = new RegExp(dto.subArea.trim(), 'i');
      }

      if (dto.society && dto.society !== 'all') {
        filter['location.society'] = new RegExp(dto.society.trim(), 'i');
      }

      if (dto.hasVideo) {
        filter.status = { $in: ['PUBLISHED', 'ACTIVE'] };
        filter.isPublished = true;
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { 'media.videoUrl': { $exists: true, $nin: ['', null] } },
            { videoUrl: { $exists: true, $nin: ['', null] } },
            { 'media.videos.0': { $exists: true, $nin: ['', null] } },
          ],
        });
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

      if (dto.possessionStatus && dto.possessionStatus !== 'all') {
        filter['specs.possessionStatus'] = new RegExp(`^${dto.possessionStatus.trim()}$`, 'i');
      }

      if (dto.preferredTenantType && dto.preferredTenantType !== 'all') {
        filter['price.preferredTenantType'] = new RegExp(`^${dto.preferredTenantType.trim()}$`, 'i');
      }

      if (dto.bachelorPreferences && dto.bachelorPreferences !== 'all') {
        filter['price.bachelorPreferences'] = new RegExp(`^${dto.bachelorPreferences.trim()}$`, 'i');
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

      // 11b. RERA Compliance Filters
      if (dto.reraVerifiedOnly || dto.reraStatus === 'VERIFIED') {
        filter.$or = [
          ...(filter.$or || []),
          { 'rera.verificationStatus': 'VERIFIED' },
          { 'advertiser.isVerifiedAgent': true, reraNumber: { $exists: true, $ne: '' } },
        ];
      } else if (dto.reraStatus === 'REGISTERED') {
        filter.$or = [
          ...(filter.$or || []),
          { 'rera.reraRegistered': 'YES' },
          { reraNumber: { $exists: true, $ne: '' } },
        ];
      } else if (dto.reraStatus && dto.reraStatus !== 'all') {
        filter['rera.verificationStatus'] = dto.reraStatus.toUpperCase();
      }

      // 11c. Multi-Unit & Structure Filters
      if (dto.structureType && dto.structureType !== 'all') {
        filter.structureType = dto.structureType.toUpperCase();
      }
      if (dto.isParentProject !== undefined) {
        filter.isParentProject = dto.isParentProject;
      }
      if (dto.isChildUnit !== undefined) {
        filter.isChildUnit = dto.isChildUnit;
      }
      if (dto.parentPropertyId) {
        filter.parentPropertyId = dto.parentPropertyId;
      }
      if (dto.floorNumber && dto.floorNumber !== 'all') {
        filter.$or = [
          ...(filter.$or || []),
          { 'specs.floorNumber': dto.floorNumber },
          { 'unitDetails.floorNumber': dto.floorNumber },
        ];
      }
      if (dto.unitType && dto.unitType !== 'all') {
        const uTypeRegex = new RegExp(dto.unitType.trim(), 'i');
        filter.$or = [
          ...(filter.$or || []),
          { 'unitDetails.unitType': uTypeRegex },
          { subcategory: uTypeRegex },
        ];
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

      if (dto.hasVideo && (!dto.sort || dto.sort === PropertySortOption.NEWEST)) {
        sortObj = { publishedAt: -1, createdAt: -1 };
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

      let resultProperty: any = { ...property };

      if (property.isChildUnit && property.parentPropertyId) {
        const parent = await this.propertyModel
          .findOne({ $or: [{ id: property.parentPropertyId }, { slug: property.parentPropertyId }] })
          .select('id slug referenceId title location projectDetails advertiser rera isPublished status structureType')
          .lean();
        if (parent) {
          resultProperty.parentProject = parent;
        }
      } else if (property.isParentProject) {
        if (!resultProperty.units || resultProperty.units.length === 0) {
          const childUnits = await this.propertyModel
            .find({ parentPropertyId: property.id })
            .select('id slug referenceId title price specs unitDetails status isPublished listingType')
            .lean();
          resultProperty.units = childUnits.map((c) => c.unitDetails || c);
        }
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
        return this.entitlementsService.redactContactData(resultProperty, hasContactPermission);
      }

      return resultProperty;
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
        ? {
            amount: dto.price,
            currency: 'INR',
            priceUnit: 'TOTAL',
            isNegotiable: true,
          }
        : {
            amount: Number(dto.price?.amount || 0),
            currency: dto.price?.currency || 'INR',
            priceUnit: dto.price?.priceUnit || 'TOTAL',
            isNegotiable: dto.price?.isNegotiable !== undefined ? dto.price.isNegotiable : true,
            maintenance: Number(dto.price?.maintenance || 0),
            maintenancePayer: dto.price?.maintenancePayer || 'OWNER',
            securityDeposit: Number(dto.price?.securityDeposit || 0),
            rentPeriod: dto.price?.rentPeriod,
            bookingAmount: dto.price?.bookingAmount ? Number(dto.price.bookingAmount) : undefined,
            pricePerSqFt: dto.price?.pricePerSqFt ? Number(dto.price.pricePerSqFt) : undefined,
            leaseDurationMonths: dto.price?.leaseDurationMonths ? Number(dto.price.leaseDurationMonths) : undefined,
            noticePeriodMonths: dto.price?.noticePeriodMonths ? Number(dto.price.noticePeriodMonths) : undefined,
            lockInPeriodMonths: dto.price?.lockInPeriodMonths ? Number(dto.price.lockInPeriodMonths) : undefined,
            rentEscalationPercentage: dto.price?.rentEscalationPercentage ? Number(dto.price.rentEscalationPercentage) : undefined,
            preferredTenantType: dto.price?.preferredTenantType,
            bachelorPreferences: dto.price?.bachelorPreferences,
            brokerageAmount: dto.price?.brokerageAmount ? Number(dto.price.brokerageAmount) : undefined,
            pgPricingModel: dto.price?.pgPricingModel,
            occupancyType: dto.price?.occupancyType,
            mealsIncluded: Boolean(dto.price?.mealsIncluded),
            foodPreferences: dto.price?.foodPreferences,
            genderAccommodation: dto.price?.genderAccommodation,
            includedFacilities: Array.isArray(dto.price?.includedFacilities) ? dto.price.includedFacilities : [],
          };

    const locObj =
      typeof dto.location === 'string'
        ? {
            state: 'Uttar Pradesh',
            district: 'Lucknow',
            city: 'Lucknow',
            locality: dto.location,
            area: dto.location,
            subArea: '',
            society: '',
            coordinates: [80.9462, 26.8467] as [number, number],
          }
        : {
            state: dto.location?.state || 'Uttar Pradesh',
            district: dto.location?.district || dto.location?.city || 'Lucknow',
            city: dto.location?.city || 'Lucknow',
            locality: dto.location?.area || dto.location?.locality || 'Area',
            area: dto.location?.area || dto.location?.locality || 'Area',
            subArea: dto.location?.subArea || '',
            society: dto.location?.society || '',
            landmark: dto.location?.landmark,
            pincode: dto.location?.pincode,
            coordinates: dto.location?.coordinates || [80.9462, 26.8467],
            countryId: dto.location?.countryId,
            stateId: dto.location?.stateId,
            districtId: dto.location?.districtId,
            cityId: dto.location?.cityId,
            localityId: dto.location?.localityId,
            areaId: dto.location?.areaId,
            subAreaId: dto.location?.subAreaId,
            societyId: dto.location?.societyId,
          };

    const mediaObj = {
      thumbnailUrl:
        dto.media?.thumbnailUrl ||
        dto.thumbnailUrl ||
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      coverImage: dto.media?.coverImage || dto.coverImage,
      images: dto.media?.images || dto.images || [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      ],
      videos: dto.media?.videos || dto.videos || [],
      videoUrl: dto.media?.videoUrl || dto.videoUrl || '',
      videoType: dto.media?.videoType || dto.videoType || 'LOCAL',
      videoThumbnail: dto.media?.videoThumbnail || dto.videoThumbnail,
      isReelFormat: dto.media?.isReelFormat !== undefined ? dto.media.isReelFormat : true,
      primaryMediaType: dto.media?.primaryMediaType || (dto.media?.videoUrl || dto.videoUrl ? 'VIDEO' : 'IMAGE'),
    };

    const advertiserObj = dto.advertiser || {
      name: user?.name || dto.advertiserName || 'myproperty Property Owner',
      phone: user?.mobile || dto.advertiserPhone || '+917359237870',
      email: user?.email,
      isVerifiedAgent: user?.isVerifiedAgent || false,
      role: user?.role || 'PROPERTY_OWNER',
    };

    // Safe default: Owners/agents always start as DRAFT
    // Even if Admin creates, unless explicitly requested, draft or submitted
    const isDirectAdmin =
      user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

    const hasVideoAttached = Boolean(
      dto.media?.videoUrl ||
      dto.videoUrl ||
      (dto.media?.videos && dto.media.videos.length > 0) ||
      dto.media?.isReelFormat
    );

    const initialStatus =
      isDirectAdmin && (dto.status === 'PUBLISHED' || dto.status === 'ACTIVE')
        ? dto.status
        : dto.status === 'PENDING_REVIEW' || dto.status === 'SUBMITTED'
        ? 'PENDING_REVIEW'
        : 'DRAFT';
    const isPublished = initialStatus === 'PUBLISHED' || initialStatus === 'ACTIVE';

    const ownerId = user?.id || dto.ownerId || 'usr-anon';

    // RERA handling & compliance
    const reraInput = dto.rera || {};
    const rawReraNumber = (dto.reraNumber || reraInput.reraNumber || '').trim();
    const reraRegistered =
      reraInput.reraRegistered ||
      reraInput.isReraRegistered ||
      (rawReraNumber ? 'YES' : 'NOT_APPLICABLE');

    let verificationStatus = 'NOT_APPLICABLE';
    if (reraRegistered === 'YES') {
      verificationStatus = isDirectAdmin && reraInput.verificationStatus ? reraInput.verificationStatus : 'PENDING';
    }

    const reraObj = {
      reraRegistered,
      isReraRegistered: reraRegistered,
      reraNumber: rawReraNumber || undefined,
      reraState: reraInput.reraState || reraInput.state || undefined,
      reraAuthority: reraInput.reraAuthority || reraInput.authority || undefined,
      authority: reraInput.reraAuthority || reraInput.authority || undefined,
      reraProjectName: reraInput.reraProjectName || reraInput.projectName || undefined,
      projectName: reraInput.reraProjectName || reraInput.projectName || undefined,
      certificateUrl: reraInput.certificateUrl || undefined,
      verificationStatus,
      exemptionReason: reraInput.exemptionReason || undefined,
      verifiedBy: verificationStatus === 'VERIFIED' ? (user?.id || 'admin') : undefined,
      verifiedAt: verificationStatus === 'VERIFIED' ? new Date() : undefined,
      auditHistory: [
        {
          action: 'CREATED',
          actorId: user?.id || 'system',
          actorRole: user?.role || 'PROPERTY_OWNER',
          newStatus: verificationStatus,
          notes: reraRegistered === 'YES' ? 'Listing RERA record initiated.' : 'Marked not applicable or exempt.',
          timestamp: new Date(),
        },
      ],
    };

    const structureType = dto.structureType || PropertyStructureType.INDEPENDENT;
    const hasUnits = Array.isArray(dto.units) && dto.units.length > 0;
    const isParentProject = dto.isParentProject !== undefined
      ? Boolean(dto.isParentProject)
      : (structureType !== PropertyStructureType.INDEPENDENT && hasUnits);
    const isChildUnit = Boolean(dto.isChildUnit);

    if (hasUnits) {
      this.validatePropertyUnits(structureType, dto.units);
    }

    const totalUnits = hasUnits ? dto.units.length : (dto.totalUnits || 0);
    const availableUnits = hasUnits
      ? dto.units.filter((u: any) => u.availabilityStatus === 'AVAILABLE').length
      : (dto.availableUnits || totalUnits);

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
      subcategory: dto.subcategory || undefined,
      listingType: dto.listingType || 'SALE',
      price: priceObj,
      location: locObj,
      specs: dto.specs || {},
      amenities: dto.amenities || ['24/7 Security', 'Water Supply'],
      media: mediaObj,
      advertiser: advertiserObj,
      rera: reraObj,
      reraNumber: rawReraNumber || undefined,
      status: initialStatus,
      isPublished,
      publishedAt: isPublished ? new Date() : undefined,
      isFeatured: isDirectAdmin && dto.isFeatured ? true : false,
      structureType,
      isParentProject,
      isChildUnit,
      parentPropertyId: dto.parentPropertyId,
      parentSlug: dto.parentSlug,
      projectDetails: dto.projectDetails || {},
      unitDetails: dto.unitDetails,
      units: hasUnits ? dto.units : [],
      totalUnits,
      availableUnits,
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

    if (isParentProject && hasUnits) {
      await this.syncChildUnits(created, user);
    }

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

  async findMyProperties(userId: string, user?: AuthenticatedUser) {
    if (!userId) {
      throw new BadRequestException('User ID is required to fetch owned properties');
    }
    const query: any = {
      $or: [{ ownerId: userId }, { advertiserId: userId }, { createdBy: userId }],
    };

    if (user?.role === UserRole.BROKER_AGENT || user?.accountType === 'BROKER_AGENT') {
      query.$or.push({ assignedAgentId: userId });
    }

    const properties = await this.propertyModel
      .find(query)
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
      // Security Check: Non-admins cannot self-certify RERA as VERIFIED
      if (updateDto.rera) {
        if (updateDto.rera.verificationStatus === 'VERIFIED') {
          updateDto.rera.verificationStatus = existing.rera?.verificationStatus || 'PENDING';
        }
        delete updateDto.rera.verifiedBy;
        delete updateDto.rera.verifiedAt;
      }
    }

    // Keep root reraNumber and rera.reraNumber in sync
    if (updateDto.reraNumber !== undefined || updateDto.rera?.reraNumber !== undefined) {
      const num = (updateDto.reraNumber || updateDto.rera?.reraNumber || '').trim();
      updateDto.reraNumber = num || undefined;
      if (updateDto.rera) {
        updateDto.rera.reraNumber = num || undefined;
      }
    }

    // Multi-unit validation & statistics
    if (updateDto.units || updateDto.structureType) {
      const targetStructure = updateDto.structureType || existing.structureType || PropertyStructureType.INDEPENDENT;
      const targetUnits = updateDto.units || existing.units || [];
      this.validatePropertyUnits(targetStructure, targetUnits);
      if (updateDto.units) {
        updateDto.totalUnits = updateDto.units.length;
        updateDto.availableUnits = updateDto.units.filter((u: any) => u.availabilityStatus === 'AVAILABLE').length;
      }
    }

    // Location & Media updates
    if (updateDto.location && typeof updateDto.location === 'object') {
      const area = updateDto.location.area || updateDto.location.locality;
      updateDto.location.locality = area || existing.location?.locality;
      updateDto.location.area = area || existing.location?.area;
      if (updateDto.location.subArea !== undefined) updateDto.location.subArea = updateDto.location.subArea;
      if (updateDto.location.society !== undefined) updateDto.location.society = updateDto.location.society;
    }

    if (updateDto.media && typeof updateDto.media === 'object') {
      if (updateDto.media.videoUrl !== undefined) {
        updateDto.media.isReelFormat = updateDto.media.isReelFormat !== undefined ? updateDto.media.isReelFormat : true;
        if (updateDto.media.videoUrl && !updateDto.media.primaryMediaType) {
          updateDto.media.primaryMediaType = 'VIDEO';
        }
      }
    }

    // Set updatedBy
    if (user) {
      updateDto.updatedBy = user.id;
    }

    const updated = await this.propertyModel
      .findOneAndUpdate(query, { $set: updateDto }, { new: true })
      .lean();

    if (updated && updated.isParentProject && Array.isArray(updated.units)) {
      await this.syncChildUnits(updated, user);
    }

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

    // Indian RERA rules validation: if declared RERA registered, require registration number before submission
    if (property.rera?.reraRegistered === 'YES' || property.rera?.isReraRegistered === 'YES') {
      const regNum = (property.rera.reraNumber || property.reraNumber || '').trim();
      if (!regNum) {
        throw new BadRequestException(
          'A valid RERA registration number is mandatory for RERA-registered listings before review submission.',
        );
      }
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
    this.logger.log(`📥 Property "${property.id}" submitted for myproperty moderation by ${user.name || user.id}`);

    return {
      success: true,
      message: 'Your property has been submitted for myproperty review.',
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

        if (existing.isParentProject) {
          await this.propertyModel.updateMany(
            { parentPropertyId: existing.id },
            { $set: { status: 'ARCHIVED', isPublished: false, archivedAt: new Date() } },
          );
        }

        return { success: true, message: 'Published property has been archived safely.' };
      }
    }

    // Hard delete draft or admin deletion
    if (existing.isParentProject) {
      await this.propertyModel.deleteMany({ parentPropertyId: existing.id });
    }

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

  async uploadVideoFile(file: any, user: AuthenticatedUser) {
    if (!file) {
      throw new BadRequestException('Please select a video file to upload.');
    }

    // 1. Validation: Mime Type and Extension
    const allowedMimeTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/ogg',
      'video/x-m4v',
    ];
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.ogg', '.m4v'];
    const originalName = (file.originalname || '').toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => originalName.endsWith(ext));
    const hasValidMime = allowedMimeTypes.includes((file.mimetype || '').toLowerCase());

    if (!hasValidExt && !hasValidMime) {
      throw new BadRequestException(
        'Unsupported video file format. Supported video formats are MP4, WebM, and MOV.',
      );
    }

    // 2. Validation: Max File Size (100 MB)
    const maxBytes = 100 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `Video file exceeds maximum allowed size of 100MB. (Uploaded size: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      );
    }

    // 3. Persistent cloud storage credentials verification
    const ikPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const ikPublicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const ikUrlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/casa';
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    // A. ImageKit Cloud Storage
    if (ikPrivateKey && ikPrivateKey !== 'your_imagekit_private_key') {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${ikPrivateKey}:`).toString('base64');
        const formData = new FormData();
        const blob = new Blob([file.buffer], { type: file.mimetype || 'video/mp4' });
        formData.append('file', blob, file.originalname);
        formData.append('fileName', `${Date.now()}-${file.originalname}`);
        formData.append('folder', '/casa/properties/videos');

        const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = (await uploadRes.json().catch(() => ({}))) as any;
          throw new Error(errData?.message || `ImageKit upload HTTP ${uploadRes.status}`);
        }

        const data: any = await uploadRes.json();
        this.logger.log(`🎬 Video uploaded to ImageKit CDN: ${data.url} (${file.originalname})`);
        return {
          url: data.url,
          videoType: 'LOCAL',
          provider: 'imagekit',
          originalName: file.originalname,
          size: file.size,
        };
      } catch (err: any) {
        this.logger.error(`ImageKit upload failed: ${err?.message}`);
        throw new BadRequestException(`ImageKit cloud upload failed: ${err?.message}`);
      }
    }

    // B. Cloudinary Cloud Storage
    if (cloudinaryUrl) {
      try {
        const uriParts = new URL(cloudinaryUrl);
        const apiKey = uriParts.username;
        const apiSecret = uriParts.password;
        const cloudName = uriParts.hostname;
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
        const timestamp = Math.floor(Date.now() / 1000);

        const crypto = await import('crypto');
        const signatureStr = `folder=casa/properties/videos&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

        const formData = new FormData();
        const blob = new Blob([file.buffer], { type: file.mimetype || 'video/mp4' });
        formData.append('file', blob, file.originalname);
        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);
        formData.append('folder', 'casa/properties/videos');

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = (await uploadRes.json().catch(() => ({}))) as any;
          throw new Error(errData?.error?.message || `Cloudinary upload HTTP ${uploadRes.status}`);
        }

        const data: any = await uploadRes.json();
        this.logger.log(`🎬 Video uploaded to Cloudinary: ${data.secure_url}`);
        return {
          url: data.secure_url,
          videoType: 'LOCAL',
          provider: 'cloudinary',
          originalName: file.originalname,
          size: file.size,
        };
      } catch (err: any) {
        this.logger.error(`Cloudinary upload failed: ${err?.message}`);
        throw new BadRequestException(`Cloudinary upload failed: ${err?.message}`);
      }
    }

    // C. Missing cloud storage credentials
    this.logger.warn(
      '⚠️ Direct video file upload attempted, but persistent cloud storage credentials are not configured.',
    );
    throw new ServiceUnavailableException(
      'Direct video upload requires persistent cloud media storage configuration. Missing required environment variables: IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_URL_ENDPOINT (or AWS_S3_BUCKET / CLOUDINARY_URL). Please configure these in backend/.env to enable direct video file storage, or use a YouTube Short or Instagram Reel URL.',
    );
  }
}
