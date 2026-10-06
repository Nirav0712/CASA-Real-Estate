import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import {
  LocationType,
  ALLOWED_PARENT_TYPES,
  LOCATION_HIERARCHY_ORDER,
} from './enums/location-type.enum';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  QueryLocationDto,
  AutocompleteLocationDto,
  NearbyLocationDto,
} from './dto/query-location.dto';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { AuditLog, AuditLogDocument } from '../admin/schemas/audit-log.schema';

@Injectable()
export class LocationsService implements OnModuleInit {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedInitialLocations();
    } catch (err: any) {
      this.logger.warn(`Initial location seed skipped or deferred: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // SLUG HELPER
  // ---------------------------------------------------------------------------
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  // ---------------------------------------------------------------------------
  // CREATE LOCATION
  // ---------------------------------------------------------------------------
  async createLocation(
    dto: CreateLocationDto,
    actor?: { id: string; name?: string; role?: string },
  ): Promise<LocationDocument> {
    const type = dto.type;
    let parent: LocationDocument | null = null;
    let ancestorIds: Types.ObjectId[] = [];

    // 1. Hierarchy validation
    if (type === LocationType.COUNTRY) {
      if (dto.parentId) {
        throw new BadRequestException('A COUNTRY location cannot have a parent.');
      }
    } else {
      if (!dto.parentId) {
        throw new BadRequestException(`A location of type ${type} requires a valid parent.`);
      }
      if (!Types.ObjectId.isValid(dto.parentId)) {
        throw new BadRequestException('Invalid parentId format.');
      }
      parent = await this.locationModel.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent location with ID "${dto.parentId}" not found.`);
      }

      const allowedParents = ALLOWED_PARENT_TYPES[type];
      if (allowedParents && !allowedParents.includes(parent.type)) {
        throw new ConflictException(
          `Invalid hierarchy: A ${type} location can only belong to a [${allowedParents.join(
            ', ',
          )}] parent, but the selected parent is a ${parent.type}.`,
        );
      }

      ancestorIds = [...(parent.ancestorIds || []), parent._id as Types.ObjectId];
    }

    // 2. Slug determination & Uniqueness Check
    const rawSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    const parentIdObj = dto.parentId ? new Types.ObjectId(dto.parentId) : null;

    const existingConflict = await this.locationModel.findOne({
      $or: [
        { slug: rawSlug, parentId: parentIdObj },
        {
          name: { $regex: new RegExp(`^${dto.name.trim()}$`, 'i') },
          parentId: parentIdObj,
        },
      ],
    });

    if (existingConflict) {
      throw new ConflictException(
        `Location "${dto.name}" with slug "${rawSlug}" already exists under this parent hierarchy.`,
      );
    }

    // 3. Inherit codes if omitted
    const countryCode = dto.countryCode || parent?.countryCode || (type === LocationType.COUNTRY ? dto.countryCode : undefined);
    const stateCode = dto.stateCode || parent?.stateCode;
    const districtCode = dto.districtCode || parent?.districtCode;
    const cityCode = dto.cityCode || parent?.cityCode;

    // 4. Geo handling
    let geo: any = undefined;
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      geo = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude], // GeoJSON is [lng, lat]
      };
    }

    const created = await this.locationModel.create({
      name: dto.name.trim(),
      slug: rawSlug,
      type: dto.type,
      parentId: parentIdObj,
      ancestorIds,
      countryCode: countryCode?.toUpperCase(),
      stateCode: stateCode?.toUpperCase(),
      districtCode,
      cityCode,
      pincode: dto.pincode?.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      geo,
      aliases: dto.aliases || [],
      localizedNames: dto.localizedNames || { en: dto.name.trim() },
      description: dto.description?.trim(),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : false,
      sortOrder: dto.sortOrder || 0,
      seo: dto.seo || {},
      metadata: dto.metadata || {},
      createdBy: actor?.id ? new Types.ObjectId(actor.id) : undefined,
    });

    // 5. Audit log
    if (actor?.id) {
      await this.logAudit({
        action: 'LOCATION_CREATED',
        actorUserId: actor.id,
        actorName: actor.name || 'Admin',
        actorRole: actor.role || 'ADMIN',
        targetEntity: 'LOCATION',
        targetEntityId: created._id.toString(),
        newValue: {
          name: created.name,
          type: created.type,
          slug: created.slug,
          parentId: created.parentId?.toString(),
        },
      });
    }

    return created;
  }

  // ---------------------------------------------------------------------------
  // UPDATE LOCATION
  // ---------------------------------------------------------------------------
  async updateLocation(
    id: string,
    dto: UpdateLocationDto,
    actor?: { id: string; name?: string; role?: string },
  ): Promise<LocationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location ID.');
    }

    const location = await this.locationModel.findById(id);
    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found.`);
    }

    const previousValue = location.toObject();
    let parentChanged = false;
    let newParent: LocationDocument | null = null;
    let newAncestorIds = location.ancestorIds;

    // 1. Parent/Hierarchy validation if parentId is provided
    if (dto.parentId !== undefined) {
      const currentParentIdStr = location.parentId ? location.parentId.toString() : null;
      const targetParentIdStr = dto.parentId ? dto.parentId : null;

      if (currentParentIdStr !== targetParentIdStr) {
        parentChanged = true;
        const targetType = dto.type || location.type;

        if (targetType === LocationType.COUNTRY) {
          if (dto.parentId) {
            throw new BadRequestException('A COUNTRY location cannot have a parent.');
          }
          location.parentId = null;
          newAncestorIds = [];
        } else {
          if (!dto.parentId) {
            throw new BadRequestException(`A ${targetType} location must have a valid parent.`);
          }
          if (dto.parentId === id) {
            throw new BadRequestException('A location cannot be its own parent.');
          }

          newParent = await this.locationModel.findById(dto.parentId);
          if (!newParent) {
            throw new NotFoundException(`Target parent location "${dto.parentId}" not found.`);
          }

          // Circular check: new parent cannot be a descendant of current location
          if (newParent.ancestorIds && newParent.ancestorIds.some((ancId) => ancId.toString() === id)) {
            throw new ConflictException('Circular hierarchy detected: cannot set a descendant location as a parent.');
          }

          const allowedParents = ALLOWED_PARENT_TYPES[targetType];
          if (allowedParents && !allowedParents.includes(newParent.type)) {
            throw new ConflictException(
              `Invalid hierarchy: A ${targetType} location can only belong to a [${allowedParents.join(
                ', ',
              )}] parent, but target parent is ${newParent.type}.`,
            );
          }

          location.parentId = newParent._id as Types.ObjectId;
          newAncestorIds = [...(newParent.ancestorIds || []), newParent._id as Types.ObjectId];
        }
      }
    }

    // 2. Slug check if name or slug updated
    if (dto.slug || dto.name) {
      const slugToCheck = dto.slug ? this.slugify(dto.slug) : dto.name ? this.slugify(dto.name) : location.slug;
      const parentToCheck = location.parentId;

      const conflict = await this.locationModel.findOne({
        _id: { $ne: location._id },
        slug: slugToCheck,
        parentId: parentToCheck,
      });

      if (conflict) {
        throw new ConflictException(`Slug "${slugToCheck}" is already taken under this parent.`);
      }
      location.slug = slugToCheck;
    }

    // 3. Update scalar fields
    if (dto.name !== undefined) location.name = dto.name.trim();
    if (dto.type !== undefined) location.type = dto.type;
    if (dto.countryCode !== undefined) location.countryCode = dto.countryCode.toUpperCase();
    if (dto.stateCode !== undefined) location.stateCode = dto.stateCode.toUpperCase();
    if (dto.districtCode !== undefined) location.districtCode = dto.districtCode;
    if (dto.cityCode !== undefined) location.cityCode = dto.cityCode;
    if (dto.pincode !== undefined) location.pincode = dto.pincode.trim();
    if (dto.description !== undefined) location.description = dto.description.trim();
    if (dto.isActive !== undefined) location.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) location.isFeatured = dto.isFeatured;
    if (dto.sortOrder !== undefined) location.sortOrder = dto.sortOrder;
    if (dto.aliases !== undefined) location.aliases = dto.aliases;
    if (dto.localizedNames !== undefined) location.localizedNames = dto.localizedNames as any;
    if (dto.seo !== undefined) location.seo = dto.seo as any;
    if (dto.metadata !== undefined) location.metadata = dto.metadata;

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      location.latitude = dto.latitude;
      location.longitude = dto.longitude;
      location.geo = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    location.ancestorIds = newAncestorIds;
    if (actor?.id) {
      location.updatedBy = new Types.ObjectId(actor.id);
    }

    await location.save();

    // 4. If parent changed, recursively update all descendants' ancestorIds
    if (parentChanged) {
      await this.recalculateDescendantAncestors(location._id as Types.ObjectId, newAncestorIds);
      if (actor?.id) {
        await this.logAudit({
          action: 'LOCATION_HIERARCHY_CHANGED',
          actorUserId: actor.id,
          actorName: actor.name || 'Admin',
          actorRole: actor.role || 'ADMIN',
          targetEntity: 'LOCATION',
          targetEntityId: location._id.toString(),
          previousValue: { parentId: previousValue.parentId },
          newValue: { parentId: location.parentId },
        });
      }
    }

    // 5. Audit log
    if (actor?.id) {
      await this.logAudit({
        action: 'LOCATION_UPDATED',
        actorUserId: actor.id,
        actorName: actor.name || 'Admin',
        actorRole: actor.role || 'ADMIN',
        targetEntity: 'LOCATION',
        targetEntityId: location._id.toString(),
        previousValue,
        newValue: location.toObject(),
      });
    }

    return location;
  }

  // Recursive ancestor synchronizer for child trees
  private async recalculateDescendantAncestors(
    parentId: Types.ObjectId,
    parentAncestorIds: Types.ObjectId[],
  ): Promise<void> {
    const children = await this.locationModel.find({ parentId });
    const nextAncestors = [...parentAncestorIds, parentId];

    for (const child of children) {
      child.ancestorIds = nextAncestors;
      await child.save();
      await this.recalculateDescendantAncestors(child._id as Types.ObjectId, nextAncestors);
    }
  }

  // ---------------------------------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // ---------------------------------------------------------------------------
  async activateLocation(
    id: string,
    actor?: { id: string; name?: string; role?: string },
  ): Promise<LocationDocument> {
    return this.updateLocation(id, { isActive: true }, actor);
  }

  async deactivateLocation(
    id: string,
    actor?: { id: string; name?: string; role?: string },
  ): Promise<LocationDocument> {
    return this.updateLocation(id, { isActive: false }, actor);
  }

  // ---------------------------------------------------------------------------
  // SAFE DELETE LOCATION
  // ---------------------------------------------------------------------------
  async deleteLocation(
    id: string,
    actor?: { id: string; name?: string; role?: string },
  ): Promise<{ message: string; deletedId: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location ID.');
    }

    const location = await this.locationModel.findById(id);
    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found.`);
    }

    // 1. Check if location has child locations
    const childrenCount = await this.locationModel.countDocuments({ parentId: location._id });
    if (childrenCount > 0) {
      throw new ConflictException(
        `Cannot delete location "${location.name}" because it contains ${childrenCount} child location(s). Please remove or reassign child locations first or deactivate it.`,
      );
    }

    // 2. Check if properties reference this location
    const propertyCount = await this.propertyModel.countDocuments({
      $or: [
        { 'location.locality': { $regex: new RegExp(`^${location.name}$`, 'i') } },
        { 'location.city': { $regex: new RegExp(`^${location.name}$`, 'i') } },
        { 'location.district': { $regex: new RegExp(`^${location.name}$`, 'i') } },
        { 'location.state': { $regex: new RegExp(`^${location.name}$`, 'i') } },
        { 'location.localityId': location._id.toString() },
        { 'location.cityId': location._id.toString() },
        { 'location.stateId': location._id.toString() },
      ],
    });

    if (propertyCount > 0) {
      throw new ConflictException(
        `This location is currently referenced by ${propertyCount} property listing(s) and cannot be hard-deleted. Please deactivate the location instead.`,
      );
    }

    await this.locationModel.findByIdAndDelete(id);

    if (actor?.id) {
      await this.logAudit({
        action: 'LOCATION_DELETED',
        actorUserId: actor.id,
        actorName: actor.name || 'Admin',
        actorRole: actor.role || 'ADMIN',
        targetEntity: 'LOCATION',
        targetEntityId: id,
        previousValue: location.toObject(),
      });
    }

    return {
      message: `Location "${location.name}" successfully deleted.`,
      deletedId: id,
    };
  }

  // ---------------------------------------------------------------------------
  // GET LOCATION BY ID / SLUG
  // ---------------------------------------------------------------------------
  async getLocationById(id: string): Promise<LocationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location ID.');
    }
    const loc = await this.locationModel.findById(id).populate('parentId', 'name slug type');
    if (!loc) {
      throw new NotFoundException(`Location with ID "${id}" not found.`);
    }
    return loc;
  }

  async getLocationBySlug(slug: string): Promise<LocationDocument> {
    const loc = await this.locationModel
      .findOne({ slug: this.slugify(slug) })
      .populate('parentId', 'name slug type');
    if (!loc) {
      throw new NotFoundException(`Location with slug "${slug}" not found.`);
    }
    return loc;
  }

  // ---------------------------------------------------------------------------
  // GET CHILDREN
  // ---------------------------------------------------------------------------
  async getChildren(parentId?: string, onlyActive = true): Promise<LocationDocument[]> {
    const filter: any = {};
    if (parentId && parentId !== 'root' && parentId !== 'null') {
      if (!Types.ObjectId.isValid(parentId)) {
        throw new BadRequestException('Invalid parentId format.');
      }
      filter.parentId = new Types.ObjectId(parentId);
    } else {
      filter.parentId = null; // Countries/Root
    }

    if (onlyActive) {
      filter.isActive = true;
    }

    return this.locationModel.find(filter).sort({ sortOrder: 1, name: 1 });
  }

  // ---------------------------------------------------------------------------
  // GET HIERARCHY / PATH
  // ---------------------------------------------------------------------------
  async getHierarchy(id: string): Promise<{
    location: LocationDocument;
    ancestors: LocationDocument[];
    fullPath: string;
    breadcrumb: Array<{ id: string; name: string; slug: string; type: string }>;
  }> {
    const location = await this.getLocationById(id);
    let ancestors: LocationDocument[] = [];

    if (location.ancestorIds && location.ancestorIds.length > 0) {
      ancestors = await this.locationModel
        .find({ _id: { $in: location.ancestorIds } })
        .sort({ sortOrder: 1 });
      // Sort in correct ancestor order
      const ancestorMap = new Map(ancestors.map((a) => [a._id.toString(), a]));
      ancestors = location.ancestorIds
        .map((aId) => ancestorMap.get(aId.toString()))
        .filter(Boolean) as LocationDocument[];
    }

    const chain = [...ancestors, location];
    const breadcrumb = chain.map((node) => ({
      id: node._id.toString(),
      name: node.name,
      slug: node.slug,
      type: node.type,
    }));

    // Full path string e.g. "Satellite, Ahmedabad, Gujarat, India"
    const fullPath = [...chain].reverse().map((n) => n.name).join(', ');

    return {
      location,
      ancestors,
      fullPath,
      breadcrumb,
    };
  }

  // ---------------------------------------------------------------------------
  // SEARCH LOCATIONS (PAGINATED)
  // ---------------------------------------------------------------------------
  async searchLocations(dto: QueryLocationDto, adminView = false): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const filter: any = {};

    if (!adminView && dto.isActive === undefined) {
      filter.isActive = true;
    } else if (dto.isActive !== undefined) {
      filter.isActive = dto.isActive;
    }

    if (dto.type) filter.type = dto.type;
    if (dto.countryCode) filter.countryCode = dto.countryCode.toUpperCase();
    if (dto.stateCode) filter.stateCode = dto.stateCode.toUpperCase();
    if (dto.isFeatured !== undefined) filter.isFeatured = dto.isFeatured;

    if (dto.parentId) {
      if (dto.parentId === 'root' || dto.parentId === 'null') {
        filter.parentId = null;
      } else if (Types.ObjectId.isValid(dto.parentId)) {
        filter.parentId = new Types.ObjectId(dto.parentId);
      }
    }

    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: this.slugify(q), $options: 'i' } },
        { aliases: { $regex: q, $options: 'i' } },
        { pincode: { $regex: q, $options: 'i' } },
        { 'localizedNames.hi': { $regex: q, $options: 'i' } },
        { 'localizedNames.ar': { $regex: q, $options: 'i' } },
        { 'localizedNames.ur': { $regex: q, $options: 'i' } },
      ];
    }

    const page = Number(dto.page) || 1;
    const limit = Math.min(Number(dto.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.locationModel
        .find(filter)
        .populate('parentId', 'name slug type')
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.locationModel.countDocuments(filter),
    ]);

    // Attach property listing counts for admin view
    let enrichedItems = items;
    if (adminView) {
      enrichedItems = await Promise.all(
        items.map(async (item: any) => {
          const propertyCount = await this.propertyModel.countDocuments({
            $or: [
              { 'location.locality': { $regex: new RegExp(`^${item.name}$`, 'i') } },
              { 'location.city': { $regex: new RegExp(`^${item.name}$`, 'i') } },
              { 'location.district': { $regex: new RegExp(`^${item.name}$`, 'i') } },
              { 'location.state': { $regex: new RegExp(`^${item.name}$`, 'i') } },
              { 'location.localityId': item._id.toString() },
              { 'location.cityId': item._id.toString() },
            ],
          });
          const childrenCount = await this.locationModel.countDocuments({ parentId: item._id });
          return {
            ...item,
            propertyCount,
            childrenCount,
          };
        }),
      );
    }

    return {
      items: enrichedItems,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  // ---------------------------------------------------------------------------
  // AUTOCOMPLETE
  // ---------------------------------------------------------------------------
  async autocomplete(dto: AutocompleteLocationDto): Promise<any[]> {
    const filter: any = { isActive: true };

    if (dto.type) filter.type = dto.type;
    if (dto.parentId && Types.ObjectId.isValid(dto.parentId)) {
      filter.parentId = new Types.ObjectId(dto.parentId);
    }

    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      filter.$or = [
        { name: { $regex: `^${q}`, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { aliases: { $regex: q, $options: 'i' } },
        { pincode: { $regex: `^${q}`, $options: 'i' } },
        { 'localizedNames.hi': { $regex: q, $options: 'i' } },
      ];
    }

    const limit = Math.min(Number(dto.limit) || 10, 30);
    const locations = await this.locationModel
      .find(filter)
      .populate('parentId', 'name slug type stateCode')
      .populate('ancestorIds', 'name type')
      .sort({ isFeatured: -1, sortOrder: 1, name: 1 })
      .limit(limit)
      .lean();

    return locations.map((loc: any) => {
      const ancestors = loc.ancestorIds || [];
      const parentName = loc.parentId?.name;
      const state = ancestors.find((a: any) => a.type === LocationType.STATE)?.name || loc.stateCode;
      const city = ancestors.find((a: any) => a.type === LocationType.CITY)?.name;

      const fullPath = [loc.name, city, state]
        .filter(Boolean)
        .filter((val, idx, self) => self.indexOf(val) === idx)
        .join(', ');

      return {
        id: loc._id.toString(),
        name: loc.name,
        slug: loc.slug,
        type: loc.type,
        pincode: loc.pincode,
        stateCode: loc.stateCode,
        parentName,
        city,
        state,
        fullPath,
        latitude: loc.latitude,
        longitude: loc.longitude,
        isFeatured: loc.isFeatured,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // NEARBY LOCATIONS (GEOSPATIAL)
  // ---------------------------------------------------------------------------
  async getNearby(dto: NearbyLocationDto): Promise<any[]> {
    const lat = Number(dto.lat);
    const lng = Number(dto.lng);
    const radiusKm = Number(dto.radius) || 10;
    const limit = Math.min(Number(dto.limit) || 10, 50);

    const radiusInRadians = radiusKm / 6378.1; // Earth radius in km

    const filter: any = {
      isActive: true,
      geo: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      },
    };

    if (dto.type) filter.type = dto.type;

    const locations = await this.locationModel
      .find(filter)
      .populate('parentId', 'name slug type')
      .limit(limit)
      .lean();

    return locations.map((loc: any) => ({
      id: loc._id.toString(),
      name: loc.name,
      slug: loc.slug,
      type: loc.type,
      pincode: loc.pincode,
      latitude: loc.latitude,
      longitude: loc.longitude,
      parentName: loc.parentId?.name,
    }));
  }

  // ---------------------------------------------------------------------------
  // LOCATION TREE (ADMIN & PUBLIC)
  // ---------------------------------------------------------------------------
  async getTree(onlyActive = true): Promise<any[]> {
    const filter: any = {};
    if (onlyActive) {
      filter.isActive = true;
    }

    const allLocations = await this.locationModel
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Map each item and build child graph
    const map = new Map<string, any>();
    const roots: any[] = [];

    allLocations.forEach((loc: any) => {
      map.set(loc._id.toString(), {
        ...loc,
        id: loc._id.toString(),
        children: [],
      });
    });

    allLocations.forEach((loc: any) => {
      const node = map.get(loc._id.toString());
      if (loc.parentId && map.has(loc.parentId.toString())) {
        map.get(loc.parentId.toString()).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  // ---------------------------------------------------------------------------
  // SEED INITIAL LOCATIONS (IDEMPOTENT)
  // ---------------------------------------------------------------------------
  async seedInitialLocations(): Promise<void> {
    const hasAhmedabad = await this.locationModel.findOne({ slug: 'ahmedabad' });
    if (hasAhmedabad) {
      return; // Already populated
    }

    this.logger.log('Seeding initial location hierarchy (India, Gujarat, UP, Maharashtra, Karnataka)...');

    // 1. Country: India
    let india = await this.locationModel.findOne({ slug: 'india' });
    if (!india) {
      india = await this.locationModel.create({
        name: 'India',
        slug: 'india',
        type: LocationType.COUNTRY,
        countryCode: 'IN',
        ancestorIds: [],
        localizedNames: { en: 'India', hi: 'भारत', ar: 'الهند', ur: 'ہندوستان' },
        aliases: ['Bharat', 'Hindustan'],
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });
    }

    // 2. States
    let gujarat = await this.locationModel.findOne({ slug: 'gujarat' });
    if (!gujarat) {
      gujarat = await this.locationModel.create({
        name: 'Gujarat',
        slug: 'gujarat',
        type: LocationType.STATE,
        parentId: india._id,
        ancestorIds: [india._id],
        countryCode: 'IN',
        stateCode: 'GJ',
        localizedNames: { en: 'Gujarat', hi: 'गुजरात' },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });
    }

    let uttarPradesh = await this.locationModel.findOne({ slug: 'uttar-pradesh' });
    if (!uttarPradesh) {
      uttarPradesh = await this.locationModel.create({
        name: 'Uttar Pradesh',
        slug: 'uttar-pradesh',
        type: LocationType.STATE,
        parentId: india._id,
        ancestorIds: [india._id],
        countryCode: 'IN',
        stateCode: 'UP',
        localizedNames: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश' },
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      });
    }

    let maharashtra = await this.locationModel.findOne({ slug: 'maharashtra' });
    if (!maharashtra) {
      maharashtra = await this.locationModel.create({
        name: 'Maharashtra',
        slug: 'maharashtra',
        type: LocationType.STATE,
        parentId: india._id,
        ancestorIds: [india._id],
        countryCode: 'IN',
        stateCode: 'MH',
        localizedNames: { en: 'Maharashtra', hi: 'महाराष्ट्र' },
        isActive: true,
        isFeatured: true,
        sortOrder: 3,
      });
    }

    let karnataka = await this.locationModel.findOne({ slug: 'karnataka' });
    if (!karnataka) {
      karnataka = await this.locationModel.create({
        name: 'Karnataka',
        slug: 'karnataka',
        type: LocationType.STATE,
        parentId: india._id,
        ancestorIds: [india._id],
        countryCode: 'IN',
        stateCode: 'KA',
        localizedNames: { en: 'Karnataka', hi: 'कर्नाटक' },
        isActive: true,
        isFeatured: true,
        sortOrder: 4,
      });
    }

    // 3. Gujarat -> Ahmedabad District & City
    const ahmedabadDist = await this.locationModel.create({
      name: 'Ahmedabad',
      slug: 'ahmedabad-district',
      type: LocationType.DISTRICT,
      parentId: gujarat._id,
      ancestorIds: [india._id, gujarat._id],
      countryCode: 'IN',
      stateCode: 'GJ',
      districtCode: 'AHM',
      isActive: true,
      sortOrder: 1,
    });

    const ahmedabadCity = await this.locationModel.create({
      name: 'Ahmedabad',
      slug: 'ahmedabad',
      type: LocationType.CITY,
      parentId: ahmedabadDist._id,
      ancestorIds: [india._id, gujarat._id, ahmedabadDist._id],
      countryCode: 'IN',
      stateCode: 'GJ',
      districtCode: 'AHM',
      cityCode: 'AMD',
      aliases: ['Amdavad', 'Ahmadabad'],
      localizedNames: { en: 'Ahmedabad', hi: 'अहमदाबाद', ar: 'أحمد آباد', ur: 'احمد آباد' },
      latitude: 23.0225,
      longitude: 72.5714,
      geo: { type: 'Point', coordinates: [72.5714, 23.0225] },
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
    });

    // Ahmedabad Localities
    const ahmLocalities = [
      { name: 'Satellite', slug: 'satellite', pincode: '380015', lat: 23.0305, lng: 72.5178 },
      { name: 'Bodakdev', slug: 'bodakdev', pincode: '380054', lat: 23.0416, lng: 72.5085 },
      { name: 'Vastrapur', slug: 'vastrapur', pincode: '380015', lat: 23.035, lng: 72.5293 },
      { name: 'Prahlad Nagar', slug: 'prahlad-nagar', pincode: '380015', lat: 23.0125, lng: 72.5106 },
      { name: 'Navrangpura', slug: 'navrangpura', pincode: '380009', lat: 23.0372, lng: 72.5613 },
      { name: 'SG Highway', slug: 'sg-highway', pincode: '380054', lat: 23.052, lng: 72.505 },
    ];

    for (const loc of ahmLocalities) {
      await this.locationModel.create({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: ahmedabadCity._id,
        ancestorIds: [india._id, gujarat._id, ahmedabadDist._id, ahmedabadCity._id],
        countryCode: 'IN',
        stateCode: 'GJ',
        districtCode: 'AHM',
        cityCode: 'AMD',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
        geo: { type: 'Point', coordinates: [loc.lng, loc.lat] },
        isActive: true,
        isFeatured: true,
      });
    }

    // 4. Uttar Pradesh -> Lucknow District & City
    const lucknowDist = await this.locationModel.create({
      name: 'Lucknow',
      slug: 'lucknow-district',
      type: LocationType.DISTRICT,
      parentId: uttarPradesh._id,
      ancestorIds: [india._id, uttarPradesh._id],
      countryCode: 'IN',
      stateCode: 'UP',
      districtCode: 'LKO',
      isActive: true,
      sortOrder: 1,
    });

    const lucknowCity = await this.locationModel.create({
      name: 'Lucknow',
      slug: 'lucknow',
      type: LocationType.CITY,
      parentId: lucknowDist._id,
      ancestorIds: [india._id, uttarPradesh._id, lucknowDist._id],
      countryCode: 'IN',
      stateCode: 'UP',
      districtCode: 'LKO',
      cityCode: 'LKO',
      localizedNames: { en: 'Lucknow', hi: 'लखनऊ', ar: 'لكهنؤ', ur: 'لکھنؤ' },
      latitude: 26.8467,
      longitude: 80.9462,
      geo: { type: 'Point', coordinates: [80.9462, 26.8467] },
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
    });

    // Lucknow Localities
    const lkoLocalities = [
      { name: 'Gomti Nagar', slug: 'gomti-nagar', pincode: '226010', lat: 26.8532, lng: 80.9984 },
      { name: 'Hazratganj', slug: 'hazratganj', pincode: '226001', lat: 26.8489, lng: 80.9442 },
      { name: 'Alambagh', slug: 'alambagh', pincode: '226005', lat: 26.8122, lng: 80.9022 },
      { name: 'Indira Nagar', slug: 'indira-nagar', pincode: '226016', lat: 26.8833, lng: 80.9833 },
      { name: 'Mahanagar', slug: 'mahanagar', pincode: '226006', lat: 26.8778, lng: 80.9528 },
      { name: 'Vibhuti Khand', slug: 'vibhuti-khand', pincode: '226010', lat: 26.868, lng: 81.002 },
      { name: 'Sushant Golf City', slug: 'sushant-golf-city', pincode: '226030', lat: 26.782, lng: 81.011 },
    ];

    for (const loc of lkoLocalities) {
      await this.locationModel.create({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: lucknowCity._id,
        ancestorIds: [india._id, uttarPradesh._id, lucknowDist._id, lucknowCity._id],
        countryCode: 'IN',
        stateCode: 'UP',
        districtCode: 'LKO',
        cityCode: 'LKO',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
        geo: { type: 'Point', coordinates: [loc.lng, loc.lat] },
        isActive: true,
        isFeatured: true,
      });
    }

    // 5. UP -> Noida
    const gbnDist = await this.locationModel.create({
      name: 'Gautam Buddha Nagar',
      slug: 'gautam-buddha-nagar',
      type: LocationType.DISTRICT,
      parentId: uttarPradesh._id,
      ancestorIds: [india._id, uttarPradesh._id],
      countryCode: 'IN',
      stateCode: 'UP',
      districtCode: 'GBN',
      isActive: true,
      sortOrder: 2,
    });

    const noidaCity = await this.locationModel.create({
      name: 'Noida',
      slug: 'noida',
      type: LocationType.CITY,
      parentId: gbnDist._id,
      ancestorIds: [india._id, uttarPradesh._id, gbnDist._id],
      countryCode: 'IN',
      stateCode: 'UP',
      districtCode: 'GBN',
      cityCode: 'NOI',
      latitude: 28.5355,
      longitude: 77.391,
      geo: { type: 'Point', coordinates: [77.391, 28.5355] },
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
    });

    const noidaLocalities = [
      { name: 'Sector 62', slug: 'sector-62', pincode: '201309', lat: 28.62, lng: 77.36 },
      { name: 'Sector 150', slug: 'sector-150', pincode: '201310', lat: 28.44, lng: 77.48 },
      { name: 'Sector 18', slug: 'sector-18', pincode: '201301', lat: 28.57, lng: 77.32 },
      { name: 'Sector 137', slug: 'sector-137', pincode: '201305', lat: 28.51, lng: 77.40 },
    ];

    for (const loc of noidaLocalities) {
      await this.locationModel.create({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: noidaCity._id,
        ancestorIds: [india._id, uttarPradesh._id, gbnDist._id, noidaCity._id],
        countryCode: 'IN',
        stateCode: 'UP',
        districtCode: 'GBN',
        cityCode: 'NOI',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
        geo: { type: 'Point', coordinates: [loc.lng, loc.lat] },
        isActive: true,
        isFeatured: true,
      });
    }

    // 6. Maharashtra -> Mumbai City
    const mumbaiDist = await this.locationModel.create({
      name: 'Mumbai Suburban',
      slug: 'mumbai-suburban',
      type: LocationType.DISTRICT,
      parentId: maharashtra._id,
      ancestorIds: [india._id, maharashtra._id],
      countryCode: 'IN',
      stateCode: 'MH',
      districtCode: 'MUM',
      isActive: true,
    });

    const mumbaiCity = await this.locationModel.create({
      name: 'Mumbai',
      slug: 'mumbai',
      type: LocationType.CITY,
      parentId: mumbaiDist._id,
      ancestorIds: [india._id, maharashtra._id, mumbaiDist._id],
      countryCode: 'IN',
      stateCode: 'MH',
      districtCode: 'MUM',
      cityCode: 'BOM',
      aliases: ['Bombay'],
      localizedNames: { en: 'Mumbai', hi: 'मुंबई', ar: 'مومباي', ur: 'ممبئی' },
      latitude: 19.076,
      longitude: 72.8777,
      geo: { type: 'Point', coordinates: [72.8777, 19.076] },
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
    });

    const mumLocalities = [
      { name: 'Bandra West', slug: 'bandra-west', pincode: '400050', lat: 19.0596, lng: 72.8295 },
      { name: 'Andheri West', slug: 'andheri-west', pincode: '400058', lat: 19.1363, lng: 72.8277 },
      { name: 'Worli', slug: 'worli', pincode: '400018', lat: 19.0144, lng: 72.8155 },
      { name: 'Powai', slug: 'powai', pincode: '400076', lat: 19.1176, lng: 72.906 },
    ];

    for (const loc of mumLocalities) {
      await this.locationModel.create({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: mumbaiCity._id,
        ancestorIds: [india._id, maharashtra._id, mumbaiDist._id, mumbaiCity._id],
        countryCode: 'IN',
        stateCode: 'MH',
        districtCode: 'MUM',
        cityCode: 'BOM',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
        geo: { type: 'Point', coordinates: [loc.lng, loc.lat] },
        isActive: true,
        isFeatured: true,
      });
    }

    // 7. Karnataka -> Bengaluru City
    const blrDist = await this.locationModel.create({
      name: 'Bengaluru Urban',
      slug: 'bengaluru-urban',
      type: LocationType.DISTRICT,
      parentId: karnataka._id,
      ancestorIds: [india._id, karnataka._id],
      countryCode: 'IN',
      stateCode: 'KA',
      districtCode: 'BLR',
      isActive: true,
    });

    const blrCity = await this.locationModel.create({
      name: 'Bengaluru',
      slug: 'bengaluru',
      type: LocationType.CITY,
      parentId: blrDist._id,
      ancestorIds: [india._id, karnataka._id, blrDist._id],
      countryCode: 'IN',
      stateCode: 'KA',
      districtCode: 'BLR',
      cityCode: 'BLR',
      aliases: ['Bangalore', 'Bangaluru'],
      localizedNames: { en: 'Bengaluru', hi: 'बेंगलुरु', ar: 'بنغالور', ur: 'بنگلور' },
      latitude: 12.9716,
      longitude: 77.5946,
      geo: { type: 'Point', coordinates: [77.5946, 12.9716] },
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
    });

    const blrLocalities = [
      { name: 'Whitefield', slug: 'whitefield', pincode: '560066', lat: 12.9698, lng: 77.7499 },
      { name: 'Indiranagar', slug: 'indiranagar', pincode: '560038', lat: 12.9784, lng: 77.6408 },
      { name: 'Koramangala', slug: 'koramangala', pincode: '560034', lat: 12.9352, lng: 77.6245 },
      { name: 'HSR Layout', slug: 'hsr-layout', pincode: '560102', lat: 12.9121, lng: 77.6446 },
    ];

    for (const loc of blrLocalities) {
      await this.locationModel.create({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: blrCity._id,
        ancestorIds: [india._id, karnataka._id, blrDist._id, blrCity._id],
        countryCode: 'IN',
        stateCode: 'KA',
        districtCode: 'BLR',
        cityCode: 'BLR',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
        geo: { type: 'Point', coordinates: [loc.lng, loc.lat] },
        isActive: true,
        isFeatured: true,
      });
    }

    this.logger.log('Initial location hierarchy seeded successfully with 35+ verified micro-markets.');
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOG HELPER
  // ---------------------------------------------------------------------------
  private async logAudit(entry: {
    action: string;
    actorUserId: string;
    actorName: string;
    actorRole: string;
    targetEntity: string;
    targetEntityId?: string;
    previousValue?: any;
    newValue?: any;
    reason?: string;
  }): Promise<void> {
    try {
      await this.auditLogModel.create({
        action: entry.action,
        actorUserId: entry.actorUserId,
        actorName: entry.actorName,
        actorRole: entry.actorRole,
        targetEntity: entry.targetEntity,
        targetEntityId: entry.targetEntityId,
        previousValue: entry.previousValue,
        newValue: entry.newValue,
        reason: entry.reason,
        timestamp: new Date(),
        metadata: { module: 'LOCATIONS_PHASE_11' },
      });
    } catch (err: any) {
      this.logger.error(`Failed to write location audit log: ${err.message}`);
    }
  }
}
