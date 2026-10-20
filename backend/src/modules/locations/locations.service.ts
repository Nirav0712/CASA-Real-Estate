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
    // Run initial location sync non-blocking so NestJS opens port 5000 immediately
    setImmediate(async () => {
      try {
        const count = await this.locationModel.countDocuments();
        if (count >= 40) {
          this.logger.log(`Location hierarchy already populated (${count} nodes). Boot seed skipped.`);
          return;
        }
        await this.seedWorldLocations();
      } catch (err: any) {
        this.logger.warn(`Initial location seed deferred: ${err.message}`);
      }
    });
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
    const limit = Math.min(Number(dto.limit) || 20, 500);
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
    await this.seedWorldLocations();
  }

  private async legacySeed(): Promise<void> {
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

    // -------------------------------------------------------------------------
    // 7. GLOBAL DESTINATIONS: UAE, USA, UK, SAUDI ARABIA
    // -------------------------------------------------------------------------
    let uae = await this.locationModel.findOne({ slug: 'united-arab-emirates' });
    if (!uae) {
      uae = await this.locationModel.create({
        name: 'United Arab Emirates',
        slug: 'united-arab-emirates',
        type: LocationType.COUNTRY,
        countryCode: 'AE',
        ancestorIds: [],
        localizedNames: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', hi: 'संयुक्त अरब अमीरात', ur: 'متحدہ عرب امارات' },
        aliases: ['UAE', 'Emirates'],
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      });

      const dubaiEmirate = await this.locationModel.create({
        name: 'Dubai',
        slug: 'dubai-emirate',
        type: LocationType.STATE,
        parentId: uae._id,
        ancestorIds: [uae._id],
        countryCode: 'AE',
        stateCode: 'DXB',
        localizedNames: { en: 'Dubai', ar: 'دبي', hi: 'दुबई' },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });

      const dubaiCity = await this.locationModel.create({
        name: 'Dubai',
        slug: 'dubai',
        type: LocationType.CITY,
        parentId: dubaiEmirate._id,
        ancestorIds: [uae._id, dubaiEmirate._id],
        countryCode: 'AE',
        stateCode: 'DXB',
        cityCode: 'DXB',
        localizedNames: { en: 'Dubai', ar: 'دبي', hi: 'दुबई', ur: 'دبئی' },
        latitude: 25.2048,
        longitude: 55.2708,
        geo: { type: 'Point', coordinates: [55.2708, 25.2048] },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });

      const dxbLocalities = [
        { name: 'Downtown Dubai', slug: 'downtown-dubai', lat: 25.1972, lng: 55.2744 },
        { name: 'Dubai Marina', slug: 'dubai-marina', lat: 25.0805, lng: 55.1403 },
        { name: 'Palm Jumeirah', slug: 'palm-jumeirah', lat: 25.1124, lng: 55.139 },
        { name: 'Business Bay', slug: 'business-bay', lat: 25.1837, lng: 55.2666 },
      ];

      for (const loc of dxbLocalities) {
        await this.locationModel.create({
          name: loc.name,
          slug: loc.slug,
          type: LocationType.LOCALITY,
          parentId: dubaiCity._id,
          ancestorIds: [uae._id, dubaiEmirate._id, dubaiCity._id],
          countryCode: 'AE',
          stateCode: 'DXB',
          cityCode: 'DXB',
          latitude: loc.lat,
          longitude: loc.lng,
          geo: { type: 'Point', coordinates: [loc.lng, loc.lat] },
          isActive: true,
          isFeatured: true,
        });
      }

      const abuDhabiEmirate = await this.locationModel.create({
        name: 'Abu Dhabi',
        slug: 'abu-dhabi-emirate',
        type: LocationType.STATE,
        parentId: uae._id,
        ancestorIds: [uae._id],
        countryCode: 'AE',
        stateCode: 'AUH',
        localizedNames: { en: 'Abu Dhabi', ar: 'أبو ظبي', hi: 'अबू धाबी' },
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      });

      await this.locationModel.create({
        name: 'Abu Dhabi',
        slug: 'abu-dhabi',
        type: LocationType.CITY,
        parentId: abuDhabiEmirate._id,
        ancestorIds: [uae._id, abuDhabiEmirate._id],
        countryCode: 'AE',
        stateCode: 'AUH',
        cityCode: 'AUH',
        localizedNames: { en: 'Abu Dhabi', ar: 'أبو ظبي', hi: 'अबू धाबी', ur: 'ابوظہبی' },
        latitude: 24.4539,
        longitude: 54.3773,
        geo: { type: 'Point', coordinates: [54.3773, 24.4539] },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });
    }

    let usa = await this.locationModel.findOne({ slug: 'united-states' });
    if (!usa) {
      usa = await this.locationModel.create({
        name: 'United States',
        slug: 'united-states',
        type: LocationType.COUNTRY,
        countryCode: 'US',
        ancestorIds: [],
        localizedNames: { en: 'United States', hi: 'संयुक्त राज्य अमेरिका', ar: 'الولايات المتحدة', ur: 'ریاستہائے متحدہ امریکہ' },
        aliases: ['USA', 'America'],
        isActive: true,
        isFeatured: true,
        sortOrder: 3,
      });

      const california = await this.locationModel.create({
        name: 'California',
        slug: 'california',
        type: LocationType.STATE,
        parentId: usa._id,
        ancestorIds: [usa._id],
        countryCode: 'US',
        stateCode: 'CA',
        localizedNames: { en: 'California' },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });

      await this.locationModel.create({
        name: 'San Francisco',
        slug: 'san-francisco',
        type: LocationType.CITY,
        parentId: california._id,
        ancestorIds: [usa._id, california._id],
        countryCode: 'US',
        stateCode: 'CA',
        cityCode: 'SFO',
        latitude: 37.7749,
        longitude: -122.4194,
        geo: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });

      const newYorkState = await this.locationModel.create({
        name: 'New York',
        slug: 'new-york-state',
        type: LocationType.STATE,
        parentId: usa._id,
        ancestorIds: [usa._id],
        countryCode: 'US',
        stateCode: 'NY',
        localizedNames: { en: 'New York' },
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      });

      await this.locationModel.create({
        name: 'New York City',
        slug: 'new-york-city',
        type: LocationType.CITY,
        parentId: newYorkState._id,
        ancestorIds: [usa._id, newYorkState._id],
        countryCode: 'US',
        stateCode: 'NY',
        cityCode: 'NYC',
        latitude: 40.7128,
        longitude: -74.006,
        geo: { type: 'Point', coordinates: [-74.006, 40.7128] },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });
    }

    let uk = await this.locationModel.findOne({ slug: 'united-kingdom' });
    if (!uk) {
      uk = await this.locationModel.create({
        name: 'United Kingdom',
        slug: 'united-kingdom',
        type: LocationType.COUNTRY,
        countryCode: 'GB',
        ancestorIds: [],
        localizedNames: { en: 'United Kingdom', hi: 'यूनाइटेड किंगडम', ar: 'المملكة المتحدة', ur: 'برطانیہ' },
        aliases: ['UK', 'Britain', 'Great Britain'],
        isActive: true,
        isFeatured: true,
        sortOrder: 4,
      });

      const england = await this.locationModel.create({
        name: 'England',
        slug: 'england',
        type: LocationType.STATE,
        parentId: uk._id,
        ancestorIds: [uk._id],
        countryCode: 'GB',
        stateCode: 'ENG',
        localizedNames: { en: 'England' },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });

      await this.locationModel.create({
        name: 'London',
        slug: 'london',
        type: LocationType.CITY,
        parentId: england._id,
        ancestorIds: [uk._id, england._id],
        countryCode: 'GB',
        stateCode: 'ENG',
        cityCode: 'LON',
        latitude: 51.5074,
        longitude: -0.1278,
        geo: { type: 'Point', coordinates: [-0.1278, 51.5074] },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      });
    }

    this.logger.log('Initial location hierarchy seeded successfully with global micro-markets.');
  }

  // ---------------------------------------------------------------------------
  // HELPER TO SAFELY ENSURE LOCATION NODE (IDEMPOTENT & RETRY-SAFE)
  // ---------------------------------------------------------------------------
  private async ensureLocationNode(data: {
    name: string;
    slug: string;
    type: LocationType;
    parentId?: any;
    ancestorIds?: any[];
    countryCode?: string;
    stateCode?: string;
    districtCode?: string;
    cityCode?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    localizedNames?: Record<string, string>;
    aliases?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
  }): Promise<LocationDocument> {
    const orConditions: any[] = [{ slug: data.slug }];
    if (data.type === LocationType.COUNTRY) {
      if (data.countryCode) orConditions.push({ countryCode: data.countryCode.toUpperCase() });
      orConditions.push({ name: new RegExp(`^${data.name.trim()}$`, 'i'), type: LocationType.COUNTRY });
    } else {
      orConditions.push({
        name: new RegExp(`^${data.name.trim()}$`, 'i'),
        parentId: data.parentId || null,
        type: data.type,
      });
    }

    let existing = await this.locationModel.findOne({ $or: orConditions });
    if (existing) {
      const updates: any = {};
      if (data.pincode && existing.pincode !== data.pincode) updates.pincode = data.pincode;
      if (data.countryCode && !existing.countryCode) updates.countryCode = data.countryCode;
      if (data.stateCode && !existing.stateCode) updates.stateCode = data.stateCode;
      if (data.cityCode && !existing.cityCode) updates.cityCode = data.cityCode;
      if (data.localizedNames && (!existing.localizedNames || Object.keys(existing.localizedNames).length === 0)) {
        updates.localizedNames = data.localizedNames;
      }
      if (data.aliases && data.aliases.length > 0 && (!existing.aliases || existing.aliases.length === 0)) {
        updates.aliases = data.aliases;
      }
      if (Object.keys(updates).length > 0) {
        await this.locationModel.updateOne({ _id: existing._id }, { $set: updates });
        existing = await this.locationModel.findById(existing._id);
      }
      return existing!;
    }

    const geo =
      data.latitude !== undefined && data.longitude !== undefined
        ? { type: 'Point', coordinates: [data.longitude, data.latitude] }
        : undefined;

    return await this.locationModel.create({
      name: data.name,
      slug: data.slug,
      type: data.type,
      parentId: data.parentId || undefined,
      ancestorIds: data.ancestorIds || [],
      countryCode: data.countryCode?.toUpperCase(),
      stateCode: data.stateCode?.toUpperCase(),
      districtCode: data.districtCode,
      cityCode: data.cityCode,
      pincode: data.pincode?.trim(),
      latitude: data.latitude,
      longitude: data.longitude,
      geo,
      aliases: data.aliases || [],
      localizedNames: data.localizedNames || { en: data.name },
      isActive: data.isActive !== undefined ? data.isActive : true,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : false,
      sortOrder: data.sortOrder || 0,
    });
  }

  // ---------------------------------------------------------------------------
  // SEED COMPREHENSIVE WORLDWIDE LOCATIONS
  // Countries -> States -> Cities -> Localities (with detailed Pincodes)
  // ---------------------------------------------------------------------------
  async seedWorldLocations(): Promise<{ totalNodes: number; countries: string[] }> {
    this.logger.log('Syncing comprehensive worldwide locations (India, UAE, USA, UK, Canada, Saudi Arabia, Singapore, Australia)...');

    // 1. INDIA (IN)
    const india = await this.ensureLocationNode({
      name: 'India',
      slug: 'india',
      type: LocationType.COUNTRY,
      countryCode: 'IN',
      ancestorIds: [],
      localizedNames: { en: 'India', hi: 'भारत', ar: 'الهند', ur: 'ہندوستان' },
      aliases: ['Bharat', 'Hindustan'],
      isFeatured: true,
      sortOrder: 1,
    });

    // 1.1 Gujarat
    const gujarat = await this.ensureLocationNode({
      name: 'Gujarat',
      slug: 'gujarat',
      type: LocationType.STATE,
      parentId: india._id,
      ancestorIds: [india._id],
      countryCode: 'IN',
      stateCode: 'GJ',
      localizedNames: { en: 'Gujarat', hi: 'गुजरात' },
      isFeatured: true,
      sortOrder: 1,
    });

    const ahmedabadDist = await this.ensureLocationNode({
      name: 'Ahmedabad',
      slug: 'ahmedabad-district',
      type: LocationType.DISTRICT,
      parentId: gujarat._id,
      ancestorIds: [india._id, gujarat._id],
      countryCode: 'IN',
      stateCode: 'GJ',
      districtCode: 'AHM',
      sortOrder: 1,
    });

    const ahmedabadCity = await this.ensureLocationNode({
      name: 'Ahmedabad',
      slug: 'ahmedabad',
      type: LocationType.CITY,
      parentId: ahmedabadDist._id,
      ancestorIds: [india._id, gujarat._id, ahmedabadDist._id],
      countryCode: 'IN',
      stateCode: 'GJ',
      districtCode: 'AHM',
      cityCode: 'AMD',
      localizedNames: { en: 'Ahmedabad', hi: 'अहमदाबाद' },
      aliases: ['Amdavad', 'Karnavati'],
      latitude: 23.0225,
      longitude: 72.5714,
      isFeatured: true,
      sortOrder: 1,
    });

    const ahmLocalities = [
      { name: 'Satellite', slug: 'satellite-ahmedabad', pincode: '380015', lat: 23.03, lng: 72.51 },
      { name: 'Bodakdev', slug: 'bodakdev-ahmedabad', pincode: '380054', lat: 23.04, lng: 72.50 },
      { name: 'Vastrapur', slug: 'vastrapur-ahmedabad', pincode: '380015', lat: 23.03, lng: 72.52 },
      { name: 'SG Highway', slug: 'sg-highway-ahmedabad', pincode: '380051', lat: 23.05, lng: 72.51 },
      { name: 'Prahlad Nagar', slug: 'prahlad-nagar-ahmedabad', pincode: '380015', lat: 23.01, lng: 72.50 },
      { name: 'Thaltej', slug: 'thaltej-ahmedabad', pincode: '380059', lat: 23.05, lng: 72.51 },
      { name: 'Navrangpura', slug: 'navrangpura-ahmedabad', pincode: '380009', lat: 23.03, lng: 72.55 },
      { name: 'Maninagar', slug: 'maninagar-ahmedabad', pincode: '380008', lat: 22.99, lng: 72.60 },
    ];
    for (const loc of ahmLocalities) {
      await this.ensureLocationNode({
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
      });
    }

    const gandhinagarCity = await this.ensureLocationNode({
      name: 'Gandhinagar',
      slug: 'gandhinagar',
      type: LocationType.CITY,
      parentId: gujarat._id,
      ancestorIds: [india._id, gujarat._id],
      countryCode: 'IN',
      stateCode: 'GJ',
      cityCode: 'GNR',
      latitude: 23.2156,
      longitude: 72.6369,
      isFeatured: true,
      sortOrder: 2,
    });
    const gnrLocalities = [
      { name: 'GIFT City', slug: 'gift-city-gandhinagar', pincode: '382355', lat: 23.16, lng: 72.68 },
      { name: 'Kudasan', slug: 'kudasan-gandhinagar', pincode: '382421', lat: 23.18, lng: 72.62 },
      { name: 'Sector 11', slug: 'sector-11-gandhinagar', pincode: '382011', lat: 23.22, lng: 72.65 },
    ];
    for (const loc of gnrLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: gandhinagarCity._id,
        ancestorIds: [india._id, gujarat._id, gandhinagarCity._id],
        countryCode: 'IN',
        stateCode: 'GJ',
        cityCode: 'GNR',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const suratCity = await this.ensureLocationNode({
      name: 'Surat',
      slug: 'surat',
      type: LocationType.CITY,
      parentId: gujarat._id,
      ancestorIds: [india._id, gujarat._id],
      countryCode: 'IN',
      stateCode: 'GJ',
      cityCode: 'SUR',
      latitude: 21.1702,
      longitude: 72.8311,
      sortOrder: 3,
    });
    const suratLocalities = [
      { name: 'Vesu', slug: 'vesu-surat', pincode: '395007', lat: 21.14, lng: 72.77 },
      { name: 'Adajan', slug: 'adajan-surat', pincode: '395009', lat: 21.19, lng: 72.79 },
    ];
    for (const loc of suratLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: suratCity._id,
        ancestorIds: [india._id, gujarat._id, suratCity._id],
        countryCode: 'IN',
        stateCode: 'GJ',
        cityCode: 'SUR',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 1.2 Maharashtra
    const maharashtra = await this.ensureLocationNode({
      name: 'Maharashtra',
      slug: 'maharashtra',
      type: LocationType.STATE,
      parentId: india._id,
      ancestorIds: [india._id],
      countryCode: 'IN',
      stateCode: 'MH',
      localizedNames: { en: 'Maharashtra', hi: 'महाराष्ट्र' },
      isFeatured: true,
      sortOrder: 2,
    });

    const mumbaiCity = await this.ensureLocationNode({
      name: 'Mumbai',
      slug: 'mumbai',
      type: LocationType.CITY,
      parentId: maharashtra._id,
      ancestorIds: [india._id, maharashtra._id],
      countryCode: 'IN',
      stateCode: 'MH',
      cityCode: 'BOM',
      localizedNames: { en: 'Mumbai', hi: 'मुंबई' },
      aliases: ['Bombay'],
      latitude: 19.076,
      longitude: 72.8777,
      isFeatured: true,
      sortOrder: 1,
    });
    const mumLocalities = [
      { name: 'Bandra West', slug: 'bandra-west-mumbai', pincode: '400050', lat: 19.05, lng: 72.83 },
      { name: 'Andheri West', slug: 'andheri-west-mumbai', pincode: '400053', lat: 19.13, lng: 72.82 },
      { name: 'Worli', slug: 'worli-mumbai', pincode: '400018', lat: 19.01, lng: 72.81 },
      { name: 'Juhu', slug: 'juhu-mumbai', pincode: '400049', lat: 19.10, lng: 72.82 },
      { name: 'Powai', slug: 'powai-mumbai', pincode: '400076', lat: 19.11, lng: 72.90 },
      { name: 'Lower Parel', slug: 'lower-parel-mumbai', pincode: '400013', lat: 18.99, lng: 72.82 },
    ];
    for (const loc of mumLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: mumbaiCity._id,
        ancestorIds: [india._id, maharashtra._id, mumbaiCity._id],
        countryCode: 'IN',
        stateCode: 'MH',
        cityCode: 'BOM',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const puneCity = await this.ensureLocationNode({
      name: 'Pune',
      slug: 'pune',
      type: LocationType.CITY,
      parentId: maharashtra._id,
      ancestorIds: [india._id, maharashtra._id],
      countryCode: 'IN',
      stateCode: 'MH',
      cityCode: 'PNQ',
      latitude: 18.5204,
      longitude: 73.8567,
      sortOrder: 2,
    });
    const puneLocalities = [
      { name: 'Hinjewadi', slug: 'hinjewadi-pune', pincode: '411057', lat: 18.59, lng: 73.73 },
      { name: 'Koregaon Park', slug: 'koregaon-park-pune', pincode: '411001', lat: 18.53, lng: 73.89 },
      { name: 'Baner', slug: 'baner-pune', pincode: '411045', lat: 18.55, lng: 73.78 },
      { name: 'Wakad', slug: 'wakad-pune', pincode: '411057', lat: 18.59, lng: 73.76 },
    ];
    for (const loc of puneLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: puneCity._id,
        ancestorIds: [india._id, maharashtra._id, puneCity._id],
        countryCode: 'IN',
        stateCode: 'MH',
        cityCode: 'PNQ',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 1.3 Karnataka
    const karnataka = await this.ensureLocationNode({
      name: 'Karnataka',
      slug: 'karnataka',
      type: LocationType.STATE,
      parentId: india._id,
      ancestorIds: [india._id],
      countryCode: 'IN',
      stateCode: 'KA',
      localizedNames: { en: 'Karnataka', hi: 'कर्नाटक' },
      isFeatured: true,
      sortOrder: 3,
    });

    const blrCity = await this.ensureLocationNode({
      name: 'Bengaluru',
      slug: 'bengaluru',
      type: LocationType.CITY,
      parentId: karnataka._id,
      ancestorIds: [india._id, karnataka._id],
      countryCode: 'IN',
      stateCode: 'KA',
      cityCode: 'BLR',
      localizedNames: { en: 'Bengaluru', hi: 'बेंगलुरु' },
      aliases: ['Bangalore'],
      latitude: 12.9716,
      longitude: 77.5946,
      isFeatured: true,
      sortOrder: 1,
    });
    const blrLocalities = [
      { name: 'Indiranagar', slug: 'indiranagar-bangalore', pincode: '560038', lat: 12.97, lng: 77.64 },
      { name: 'Whitefield', slug: 'whitefield-bangalore', pincode: '560066', lat: 12.96, lng: 77.74 },
      { name: 'Koramangala', slug: 'koramangala-bangalore', pincode: '560034', lat: 12.93, lng: 77.62 },
      { name: 'HSR Layout', slug: 'hsr-layout-bangalore', pincode: '560102', lat: 12.91, lng: 77.63 },
      { name: 'Electronic City', slug: 'electronic-city-bangalore', pincode: '560100', lat: 12.84, lng: 77.66 },
    ];
    for (const loc of blrLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: blrCity._id,
        ancestorIds: [india._id, karnataka._id, blrCity._id],
        countryCode: 'IN',
        stateCode: 'KA',
        cityCode: 'BLR',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 1.4 Delhi NCR
    const delhiNcr = await this.ensureLocationNode({
      name: 'Delhi NCR',
      slug: 'delhi-ncr',
      type: LocationType.STATE,
      parentId: india._id,
      ancestorIds: [india._id],
      countryCode: 'IN',
      stateCode: 'DL',
      localizedNames: { en: 'Delhi NCR', hi: 'दिल्ली एनसीआर' },
      isFeatured: true,
      sortOrder: 4,
    });

    const newDelhiCity = await this.ensureLocationNode({
      name: 'New Delhi',
      slug: 'new-delhi',
      type: LocationType.CITY,
      parentId: delhiNcr._id,
      ancestorIds: [india._id, delhiNcr._id],
      countryCode: 'IN',
      stateCode: 'DL',
      cityCode: 'DEL',
      latitude: 28.6139,
      longitude: 77.209,
      isFeatured: true,
      sortOrder: 1,
    });
    const delLocalities = [
      { name: 'Connaught Place', slug: 'connaught-place-delhi', pincode: '110001', lat: 28.63, lng: 77.21 },
      { name: 'South Extension', slug: 'south-extension-delhi', pincode: '110049', lat: 28.56, lng: 77.22 },
      { name: 'Vasant Kunj', slug: 'vasant-kunj-delhi', pincode: '110070', lat: 28.52, lng: 77.15 },
      { name: 'Saket', slug: 'saket-delhi', pincode: '110017', lat: 28.52, lng: 77.21 },
    ];
    for (const loc of delLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: newDelhiCity._id,
        ancestorIds: [india._id, delhiNcr._id, newDelhiCity._id],
        countryCode: 'IN',
        stateCode: 'DL',
        cityCode: 'DEL',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const gurugramCity = await this.ensureLocationNode({
      name: 'Gurugram',
      slug: 'gurugram',
      type: LocationType.CITY,
      parentId: delhiNcr._id,
      ancestorIds: [india._id, delhiNcr._id],
      countryCode: 'IN',
      stateCode: 'HR',
      cityCode: 'GGN',
      aliases: ['Gurgaon'],
      latitude: 28.4595,
      longitude: 77.0266,
      sortOrder: 2,
    });
    const ggnLocalities = [
      { name: 'DLF Phase 5', slug: 'dlf-phase-5-gurugram', pincode: '122009', lat: 28.45, lng: 77.09 },
      { name: 'Cyber City', slug: 'cyber-city-gurugram', pincode: '122002', lat: 28.49, lng: 77.08 },
      { name: 'Golf Course Road', slug: 'golf-course-road-gurugram', pincode: '122002', lat: 28.46, lng: 77.10 },
    ];
    for (const loc of ggnLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: gurugramCity._id,
        ancestorIds: [india._id, delhiNcr._id, gurugramCity._id],
        countryCode: 'IN',
        stateCode: 'HR',
        cityCode: 'GGN',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 1.5 Uttar Pradesh
    const uttarPradesh = await this.ensureLocationNode({
      name: 'Uttar Pradesh',
      slug: 'uttar-pradesh',
      type: LocationType.STATE,
      parentId: india._id,
      ancestorIds: [india._id],
      countryCode: 'IN',
      stateCode: 'UP',
      localizedNames: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश' },
      sortOrder: 5,
    });

    const noidaCity = await this.ensureLocationNode({
      name: 'Noida',
      slug: 'noida',
      type: LocationType.CITY,
      parentId: uttarPradesh._id,
      ancestorIds: [india._id, uttarPradesh._id],
      countryCode: 'IN',
      stateCode: 'UP',
      cityCode: 'NOI',
      latitude: 28.5355,
      longitude: 77.391,
      isFeatured: true,
      sortOrder: 1,
    });
    const noidaLocalities = [
      { name: 'Sector 62', slug: 'sector-62-noida', pincode: '201309', lat: 28.62, lng: 77.36 },
      { name: 'Sector 150', slug: 'sector-150-noida', pincode: '201310', lat: 28.44, lng: 77.48 },
      { name: 'Sector 18', slug: 'sector-18-noida', pincode: '201301', lat: 28.57, lng: 77.32 },
      { name: 'Sector 137', slug: 'sector-137-noida', pincode: '201305', lat: 28.51, lng: 77.40 },
    ];
    for (const loc of noidaLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: noidaCity._id,
        ancestorIds: [india._id, uttarPradesh._id, noidaCity._id],
        countryCode: 'IN',
        stateCode: 'UP',
        districtCode: 'GBN',
        cityCode: 'NOI',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const lucknowCity = await this.ensureLocationNode({
      name: 'Lucknow',
      slug: 'lucknow',
      type: LocationType.CITY,
      parentId: uttarPradesh._id,
      ancestorIds: [india._id, uttarPradesh._id],
      countryCode: 'IN',
      stateCode: 'UP',
      cityCode: 'LKO',
      latitude: 26.8467,
      longitude: 80.9462,
      sortOrder: 2,
    });
    const lkoLocalities = [
      { name: 'Gomti Nagar', slug: 'gomti-nagar-lucknow', pincode: '226010', lat: 26.85, lng: 81.0 },
      { name: 'Hazratganj', slug: 'hazratganj-lucknow', pincode: '226001', lat: 26.84, lng: 80.94 },
    ];
    for (const loc of lkoLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: lucknowCity._id,
        ancestorIds: [india._id, uttarPradesh._id, lucknowCity._id],
        countryCode: 'IN',
        stateCode: 'UP',
        cityCode: 'LKO',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 2. UNITED ARAB EMIRATES (AE)
    const uae = await this.ensureLocationNode({
      name: 'United Arab Emirates',
      slug: 'united-arab-emirates',
      type: LocationType.COUNTRY,
      countryCode: 'AE',
      ancestorIds: [],
      localizedNames: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', hi: 'संयुक्त अरब अमीरात', ur: 'متحدہ عرب امارات' },
      aliases: ['UAE', 'Emirates'],
      isFeatured: true,
      sortOrder: 2,
    });

    const dubaiState = await this.ensureLocationNode({
      name: 'Dubai',
      slug: 'dubai-emirate',
      type: LocationType.STATE,
      parentId: uae._id,
      ancestorIds: [uae._id],
      countryCode: 'AE',
      stateCode: 'DXB',
      localizedNames: { en: 'Dubai', ar: 'دبي', hi: 'दुबई' },
      isFeatured: true,
      sortOrder: 1,
    });

    const dubaiCity = await this.ensureLocationNode({
      name: 'Dubai City',
      slug: 'dubai',
      type: LocationType.CITY,
      parentId: dubaiState._id,
      ancestorIds: [uae._id, dubaiState._id],
      countryCode: 'AE',
      stateCode: 'DXB',
      cityCode: 'DXB',
      localizedNames: { en: 'Dubai', ar: 'دبي', hi: 'दुबई', ur: 'دبئی' },
      latitude: 25.2048,
      longitude: 55.2708,
      isFeatured: true,
      sortOrder: 1,
    });

    const dxbLocalities = [
      { name: 'Downtown Dubai', slug: 'downtown-dubai', pincode: '337-1500', lat: 25.1972, lng: 55.2744 },
      { name: 'Dubai Marina', slug: 'dubai-marina', pincode: '393-234', lat: 25.0805, lng: 55.1403 },
      { name: 'Palm Jumeirah', slug: 'palm-jumeirah', pincode: '393-541', lat: 25.1124, lng: 55.139 },
      { name: 'Business Bay', slug: 'business-bay', pincode: '337-124', lat: 25.1837, lng: 55.2666 },
      { name: 'Jumeirah Village Circle', slug: 'jvc-dubai', pincode: '393-782', lat: 25.055, lng: 55.205 },
      { name: 'Dubai Hills Estate', slug: 'dubai-hills-estate', pincode: '337-440', lat: 25.11, lng: 55.24 },
      { name: 'DIFC', slug: 'difc-dubai', pincode: '337-111', lat: 25.21, lng: 55.28 },
    ];
    for (const loc of dxbLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: dubaiCity._id,
        ancestorIds: [uae._id, dubaiState._id, dubaiCity._id],
        countryCode: 'AE',
        stateCode: 'DXB',
        cityCode: 'DXB',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const abuDhabiState = await this.ensureLocationNode({
      name: 'Abu Dhabi',
      slug: 'abu-dhabi-emirate',
      type: LocationType.STATE,
      parentId: uae._id,
      ancestorIds: [uae._id],
      countryCode: 'AE',
      stateCode: 'AUH',
      localizedNames: { en: 'Abu Dhabi', ar: 'أبو ظبي', hi: 'अबू धाबी' },
      sortOrder: 2,
    });
    const abuDhabiCity = await this.ensureLocationNode({
      name: 'Abu Dhabi City',
      slug: 'abu-dhabi',
      type: LocationType.CITY,
      parentId: abuDhabiState._id,
      ancestorIds: [uae._id, abuDhabiState._id],
      countryCode: 'AE',
      stateCode: 'AUH',
      cityCode: 'AUH',
      latitude: 24.4539,
      longitude: 54.3773,
      sortOrder: 1,
    });
    const auhLocalities = [
      { name: 'Al Reem Island', slug: 'al-reem-island-abu-dhabi', pincode: '00000', lat: 24.49, lng: 54.40 },
      { name: 'Yas Island', slug: 'yas-island-abu-dhabi', pincode: '00000', lat: 24.50, lng: 54.60 },
      { name: 'Saadiyat Island', slug: 'saadiyat-island-abu-dhabi', pincode: '00000', lat: 24.53, lng: 54.43 },
    ];
    for (const loc of auhLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: abuDhabiCity._id,
        ancestorIds: [uae._id, abuDhabiState._id, abuDhabiCity._id],
        countryCode: 'AE',
        stateCode: 'AUH',
        cityCode: 'AUH',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 3. UNITED STATES (US)
    const usa = await this.ensureLocationNode({
      name: 'United States',
      slug: 'united-states',
      type: LocationType.COUNTRY,
      countryCode: 'US',
      ancestorIds: [],
      localizedNames: { en: 'United States', hi: 'संयुक्त राज्य अमेरिका', ar: 'الولايات المتحدة', ur: 'ریاستہائے متحدہ امریکہ' },
      aliases: ['USA', 'America'],
      isFeatured: true,
      sortOrder: 3,
    });

    const california = await this.ensureLocationNode({
      name: 'California',
      slug: 'california',
      type: LocationType.STATE,
      parentId: usa._id,
      ancestorIds: [usa._id],
      countryCode: 'US',
      stateCode: 'CA',
      isFeatured: true,
      sortOrder: 1,
    });

    const losAngelesCity = await this.ensureLocationNode({
      name: 'Los Angeles',
      slug: 'los-angeles',
      type: LocationType.CITY,
      parentId: california._id,
      ancestorIds: [usa._id, california._id],
      countryCode: 'US',
      stateCode: 'CA',
      cityCode: 'LAX',
      latitude: 34.0522,
      longitude: -118.2437,
      isFeatured: true,
      sortOrder: 1,
    });
    const laLocalities = [
      { name: 'Beverly Hills', slug: 'beverly-hills-ca', pincode: '90210', lat: 34.0736, lng: -118.4004 },
      { name: 'Santa Monica', slug: 'santa-monica-ca', pincode: '90401', lat: 34.0195, lng: -118.4912 },
      { name: 'Downtown Los Angeles', slug: 'downtown-la-ca', pincode: '90012', lat: 34.0537, lng: -118.2427 },
      { name: 'Hollywood', slug: 'hollywood-ca', pincode: '90028', lat: 34.0928, lng: -118.3287 },
    ];
    for (const loc of laLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: losAngelesCity._id,
        ancestorIds: [usa._id, california._id, losAngelesCity._id],
        countryCode: 'US',
        stateCode: 'CA',
        cityCode: 'LAX',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const sanFranciscoCity = await this.ensureLocationNode({
      name: 'San Francisco',
      slug: 'san-francisco',
      type: LocationType.CITY,
      parentId: california._id,
      ancestorIds: [usa._id, california._id],
      countryCode: 'US',
      stateCode: 'CA',
      cityCode: 'SFO',
      latitude: 37.7749,
      longitude: -122.4194,
      sortOrder: 2,
    });
    const sfoLocalities = [
      { name: 'Financial District', slug: 'financial-district-sfo', pincode: '94104', lat: 37.79, lng: -122.40 },
      { name: 'SoMa', slug: 'soma-sfo', pincode: '94103', lat: 37.77, lng: -122.41 },
    ];
    for (const loc of sfoLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: sanFranciscoCity._id,
        ancestorIds: [usa._id, california._id, sanFranciscoCity._id],
        countryCode: 'US',
        stateCode: 'CA',
        cityCode: 'SFO',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const newYorkState = await this.ensureLocationNode({
      name: 'New York',
      slug: 'new-york-state',
      type: LocationType.STATE,
      parentId: usa._id,
      ancestorIds: [usa._id],
      countryCode: 'US',
      stateCode: 'NY',
      isFeatured: true,
      sortOrder: 2,
    });

    const nycCity = await this.ensureLocationNode({
      name: 'New York City',
      slug: 'new-york-city',
      type: LocationType.CITY,
      parentId: newYorkState._id,
      ancestorIds: [usa._id, newYorkState._id],
      countryCode: 'US',
      stateCode: 'NY',
      cityCode: 'NYC',
      aliases: ['NYC', 'Big Apple'],
      latitude: 40.7128,
      longitude: -74.006,
      isFeatured: true,
      sortOrder: 1,
    });
    const nycLocalities = [
      { name: 'Manhattan Midtown', slug: 'manhattan-midtown-nyc', pincode: '10001', lat: 40.7484, lng: -73.9857 },
      { name: 'Upper East Side', slug: 'upper-east-side-nyc', pincode: '10021', lat: 40.7736, lng: -73.9566 },
      { name: 'Tribeca', slug: 'tribeca-nyc', pincode: '10013', lat: 40.7163, lng: -74.0086 },
      { name: 'Brooklyn Heights', slug: 'brooklyn-heights-nyc', pincode: '11201', lat: 40.696, lng: -73.9933 },
    ];
    for (const loc of nycLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: nycCity._id,
        ancestorIds: [usa._id, newYorkState._id, nycCity._id],
        countryCode: 'US',
        stateCode: 'NY',
        cityCode: 'NYC',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const texasState = await this.ensureLocationNode({
      name: 'Texas',
      slug: 'texas-state',
      type: LocationType.STATE,
      parentId: usa._id,
      ancestorIds: [usa._id],
      countryCode: 'US',
      stateCode: 'TX',
      sortOrder: 3,
    });
    const austinCity = await this.ensureLocationNode({
      name: 'Austin',
      slug: 'austin-tx',
      type: LocationType.CITY,
      parentId: texasState._id,
      ancestorIds: [usa._id, texasState._id],
      countryCode: 'US',
      stateCode: 'TX',
      cityCode: 'ATX',
      latitude: 30.2672,
      longitude: -97.7431,
      sortOrder: 1,
    });
    const atxLocalities = [
      { name: 'Downtown Austin', slug: 'downtown-austin-tx', pincode: '78701', lat: 30.27, lng: -97.74 },
      { name: 'The Domain', slug: 'the-domain-austin-tx', pincode: '78758', lat: 30.40, lng: -97.72 },
    ];
    for (const loc of atxLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: austinCity._id,
        ancestorIds: [usa._id, texasState._id, austinCity._id],
        countryCode: 'US',
        stateCode: 'TX',
        cityCode: 'ATX',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const floridaState = await this.ensureLocationNode({
      name: 'Florida',
      slug: 'florida-state',
      type: LocationType.STATE,
      parentId: usa._id,
      ancestorIds: [usa._id],
      countryCode: 'US',
      stateCode: 'FL',
      sortOrder: 4,
    });
    const miamiCity = await this.ensureLocationNode({
      name: 'Miami',
      slug: 'miami-fl',
      type: LocationType.CITY,
      parentId: floridaState._id,
      ancestorIds: [usa._id, floridaState._id],
      countryCode: 'US',
      stateCode: 'FL',
      cityCode: 'MIA',
      latitude: 25.7617,
      longitude: -80.1918,
      sortOrder: 1,
    });
    const miaLocalities = [
      { name: 'Brickell', slug: 'brickell-miami-fl', pincode: '33131', lat: 25.76, lng: -80.19 },
      { name: 'Miami Beach', slug: 'miami-beach-fl', pincode: '33139', lat: 25.79, lng: -80.13 },
    ];
    for (const loc of miaLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: miamiCity._id,
        ancestorIds: [usa._id, floridaState._id, miamiCity._id],
        countryCode: 'US',
        stateCode: 'FL',
        cityCode: 'MIA',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 4. UNITED KINGDOM (GB)
    const uk = await this.ensureLocationNode({
      name: 'United Kingdom',
      slug: 'united-kingdom',
      type: LocationType.COUNTRY,
      countryCode: 'GB',
      ancestorIds: [],
      localizedNames: { en: 'United Kingdom', hi: 'यूनाइटेड किंगडम', ar: 'المملكة المتحدة', ur: 'برطانیہ' },
      aliases: ['UK', 'Britain', 'Great Britain'],
      isFeatured: true,
      sortOrder: 4,
    });

    const england = await this.ensureLocationNode({
      name: 'England',
      slug: 'england',
      type: LocationType.STATE,
      parentId: uk._id,
      ancestorIds: [uk._id],
      countryCode: 'GB',
      stateCode: 'ENG',
      sortOrder: 1,
    });

    const londonCity = await this.ensureLocationNode({
      name: 'London',
      slug: 'london',
      type: LocationType.CITY,
      parentId: england._id,
      ancestorIds: [uk._id, england._id],
      countryCode: 'GB',
      stateCode: 'ENG',
      cityCode: 'LON',
      latitude: 51.5074,
      longitude: -0.1278,
      isFeatured: true,
      sortOrder: 1,
    });
    const lonLocalities = [
      { name: 'Westminster & Mayfair', slug: 'westminster-mayfair-london', pincode: 'SW1A 1AA', lat: 51.50, lng: -0.14 },
      { name: 'Kensington & Chelsea', slug: 'kensington-chelsea-london', pincode: 'W8 5TT', lat: 51.50, lng: -0.19 },
      { name: 'Canary Wharf', slug: 'canary-wharf-london', pincode: 'E14 5HP', lat: 51.505, lng: -0.02 },
      { name: 'City of London', slug: 'city-of-london', pincode: 'EC2N 2DB', lat: 51.51, lng: -0.09 },
    ];
    for (const loc of lonLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: londonCity._id,
        ancestorIds: [uk._id, england._id, londonCity._id],
        countryCode: 'GB',
        stateCode: 'ENG',
        cityCode: 'LON',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const manchesterCity = await this.ensureLocationNode({
      name: 'Manchester',
      slug: 'manchester',
      type: LocationType.CITY,
      parentId: england._id,
      ancestorIds: [uk._id, england._id],
      countryCode: 'GB',
      stateCode: 'ENG',
      cityCode: 'MAN',
      latitude: 53.4808,
      longitude: -2.2426,
      sortOrder: 2,
    });
    const manLocalities = [
      { name: 'Manchester City Centre', slug: 'manchester-city-centre', pincode: 'M1 1AD', lat: 53.48, lng: -2.24 },
      { name: 'Salford Quays', slug: 'salford-quays-manchester', pincode: 'M50 3AZ', lat: 53.47, lng: -2.28 },
    ];
    for (const loc of manLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: manchesterCity._id,
        ancestorIds: [uk._id, england._id, manchesterCity._id],
        countryCode: 'GB',
        stateCode: 'ENG',
        cityCode: 'MAN',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 5. CANADA (CA)
    const canada = await this.ensureLocationNode({
      name: 'Canada',
      slug: 'canada',
      type: LocationType.COUNTRY,
      countryCode: 'CA',
      ancestorIds: [],
      localizedNames: { en: 'Canada', fr: 'Canada' },
      sortOrder: 5,
    });

    const ontario = await this.ensureLocationNode({
      name: 'Ontario',
      slug: 'ontario',
      type: LocationType.STATE,
      parentId: canada._id,
      ancestorIds: [canada._id],
      countryCode: 'CA',
      stateCode: 'ON',
      sortOrder: 1,
    });

    const torontoCity = await this.ensureLocationNode({
      name: 'Toronto',
      slug: 'toronto',
      type: LocationType.CITY,
      parentId: ontario._id,
      ancestorIds: [canada._id, ontario._id],
      countryCode: 'CA',
      stateCode: 'ON',
      cityCode: 'YTO',
      latitude: 43.6532,
      longitude: -79.3832,
      isFeatured: true,
      sortOrder: 1,
    });
    const ytoLocalities = [
      { name: 'Downtown Toronto', slug: 'downtown-toronto', pincode: 'M5V 2T6', lat: 43.65, lng: -79.38 },
      { name: 'Yorkville', slug: 'yorkville-toronto', pincode: 'M4W 1A1', lat: 43.67, lng: -79.39 },
    ];
    for (const loc of ytoLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: torontoCity._id,
        ancestorIds: [canada._id, ontario._id, torontoCity._id],
        countryCode: 'CA',
        stateCode: 'ON',
        cityCode: 'YTO',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const bc = await this.ensureLocationNode({
      name: 'British Columbia',
      slug: 'british-columbia',
      type: LocationType.STATE,
      parentId: canada._id,
      ancestorIds: [canada._id],
      countryCode: 'CA',
      stateCode: 'BC',
      sortOrder: 2,
    });
    const vancouverCity = await this.ensureLocationNode({
      name: 'Vancouver',
      slug: 'vancouver',
      type: LocationType.CITY,
      parentId: bc._id,
      ancestorIds: [canada._id, bc._id],
      countryCode: 'CA',
      stateCode: 'BC',
      cityCode: 'YVR',
      latitude: 49.2827,
      longitude: -123.1207,
      sortOrder: 1,
    });
    const yvrLocalities = [
      { name: 'Downtown Vancouver', slug: 'downtown-vancouver', pincode: 'V6B 1A1', lat: 49.28, lng: -123.12 },
      { name: 'Yaletown', slug: 'yaletown-vancouver', pincode: 'V6Z 1Y6', lat: 49.27, lng: -123.12 },
    ];
    for (const loc of yvrLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: vancouverCity._id,
        ancestorIds: [canada._id, bc._id, vancouverCity._id],
        countryCode: 'CA',
        stateCode: 'BC',
        cityCode: 'YVR',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 6. SAUDI ARABIA (SA)
    const saudiArabia = await this.ensureLocationNode({
      name: 'Saudi Arabia',
      slug: 'saudi-arabia',
      type: LocationType.COUNTRY,
      countryCode: 'SA',
      ancestorIds: [],
      localizedNames: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', hi: 'सऊदी अरब' },
      aliases: ['KSA', 'Saudi'],
      sortOrder: 6,
    });

    const riyadhRegion = await this.ensureLocationNode({
      name: 'Riyadh Region',
      slug: 'riyadh-region',
      type: LocationType.STATE,
      parentId: saudiArabia._id,
      ancestorIds: [saudiArabia._id],
      countryCode: 'SA',
      stateCode: 'RUH',
      sortOrder: 1,
    });
    const riyadhCity = await this.ensureLocationNode({
      name: 'Riyadh',
      slug: 'riyadh',
      type: LocationType.CITY,
      parentId: riyadhRegion._id,
      ancestorIds: [saudiArabia._id, riyadhRegion._id],
      countryCode: 'SA',
      stateCode: 'RUH',
      cityCode: 'RUH',
      latitude: 24.7136,
      longitude: 46.6753,
      isFeatured: true,
      sortOrder: 1,
    });
    const ruhLocalities = [
      { name: 'Al Olaya', slug: 'al-olaya-riyadh', pincode: '12211', lat: 24.70, lng: 46.68 },
      { name: 'Al Malqa', slug: 'al-malqa-riyadh', pincode: '13524', lat: 24.81, lng: 46.61 },
      { name: 'Al Nakheel', slug: 'al-nakheel-riyadh', pincode: '12384', lat: 24.74, lng: 46.63 },
    ];
    for (const loc of ruhLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: riyadhCity._id,
        ancestorIds: [saudiArabia._id, riyadhRegion._id, riyadhCity._id],
        countryCode: 'SA',
        stateCode: 'RUH',
        cityCode: 'RUH',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 7. SINGAPORE (SG)
    const singapore = await this.ensureLocationNode({
      name: 'Singapore',
      slug: 'singapore',
      type: LocationType.COUNTRY,
      countryCode: 'SG',
      ancestorIds: [],
      localizedNames: { en: 'Singapore', zh: '新加坡', ms: 'Singapura' },
      sortOrder: 7,
    });

    const singaporeCentral = await this.ensureLocationNode({
      name: 'Central Region',
      slug: 'singapore-central-region',
      type: LocationType.STATE,
      parentId: singapore._id,
      ancestorIds: [singapore._id],
      countryCode: 'SG',
      stateCode: 'SIN',
      sortOrder: 1,
    });
    const singaporeCity = await this.ensureLocationNode({
      name: 'Singapore City',
      slug: 'singapore-city',
      type: LocationType.CITY,
      parentId: singaporeCentral._id,
      ancestorIds: [singapore._id, singaporeCentral._id],
      countryCode: 'SG',
      stateCode: 'SIN',
      cityCode: 'SIN',
      latitude: 1.3521,
      longitude: 103.8198,
      isFeatured: true,
      sortOrder: 1,
    });
    const sgLocalities = [
      { name: 'Marina Bay', slug: 'marina-bay-singapore', pincode: '018956', lat: 1.28, lng: 103.85 },
      { name: 'Orchard Road', slug: 'orchard-road-singapore', pincode: '238897', lat: 1.30, lng: 103.83 },
      { name: 'Raffles Place & CBD', slug: 'raffles-place-singapore', pincode: '048616', lat: 1.28, lng: 103.85 },
      { name: 'Sentosa Cove', slug: 'sentosa-cove-singapore', pincode: '098269', lat: 1.24, lng: 103.83 },
    ];
    for (const loc of sgLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: singaporeCity._id,
        ancestorIds: [singapore._id, singaporeCentral._id, singaporeCity._id],
        countryCode: 'SG',
        stateCode: 'SIN',
        cityCode: 'SIN',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    // 8. AUSTRALIA (AU)
    const australia = await this.ensureLocationNode({
      name: 'Australia',
      slug: 'australia',
      type: LocationType.COUNTRY,
      countryCode: 'AU',
      ancestorIds: [],
      sortOrder: 8,
    });

    const nsw = await this.ensureLocationNode({
      name: 'New South Wales',
      slug: 'new-south-wales',
      type: LocationType.STATE,
      parentId: australia._id,
      ancestorIds: [australia._id],
      countryCode: 'AU',
      stateCode: 'NSW',
      sortOrder: 1,
    });
    const sydneyCity = await this.ensureLocationNode({
      name: 'Sydney',
      slug: 'sydney',
      type: LocationType.CITY,
      parentId: nsw._id,
      ancestorIds: [australia._id, nsw._id],
      countryCode: 'AU',
      stateCode: 'NSW',
      cityCode: 'SYD',
      latitude: -33.8688,
      longitude: 151.2093,
      isFeatured: true,
      sortOrder: 1,
    });
    const sydLocalities = [
      { name: 'Sydney CBD', slug: 'sydney-cbd', pincode: '2000', lat: -33.86, lng: 151.20 },
      { name: 'Bondi Beach', slug: 'bondi-beach-sydney', pincode: '2026', lat: -33.89, lng: 151.27 },
      { name: 'Parramatta', slug: 'parramatta-sydney', pincode: '2150', lat: -33.81, lng: 151.00 },
    ];
    for (const loc of sydLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: sydneyCity._id,
        ancestorIds: [australia._id, nsw._id, sydneyCity._id],
        countryCode: 'AU',
        stateCode: 'NSW',
        cityCode: 'SYD',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const victoria = await this.ensureLocationNode({
      name: 'Victoria',
      slug: 'victoria-state',
      type: LocationType.STATE,
      parentId: australia._id,
      ancestorIds: [australia._id],
      countryCode: 'AU',
      stateCode: 'VIC',
      sortOrder: 2,
    });
    const melbourneCity = await this.ensureLocationNode({
      name: 'Melbourne',
      slug: 'melbourne',
      type: LocationType.CITY,
      parentId: victoria._id,
      ancestorIds: [australia._id, victoria._id],
      countryCode: 'AU',
      stateCode: 'VIC',
      cityCode: 'MEL',
      latitude: -37.8136,
      longitude: 144.9631,
      sortOrder: 1,
    });
    const melLocalities = [
      { name: 'Melbourne CBD', slug: 'melbourne-cbd', pincode: '3000', lat: -37.81, lng: 144.96 },
      { name: 'Southbank', slug: 'southbank-melbourne', pincode: '3006', lat: -37.82, lng: 144.96 },
      { name: 'Docklands', slug: 'docklands-melbourne', pincode: '3008', lat: -37.81, lng: 144.94 },
    ];
    for (const loc of melLocalities) {
      await this.ensureLocationNode({
        name: loc.name,
        slug: loc.slug,
        type: LocationType.LOCALITY,
        parentId: melbourneCity._id,
        ancestorIds: [australia._id, victoria._id, melbourneCity._id],
        countryCode: 'AU',
        stateCode: 'VIC',
        cityCode: 'MEL',
        pincode: loc.pincode,
        latitude: loc.lat,
        longitude: loc.lng,
      });
    }

    const totalCount = await this.locationModel.countDocuments();
    this.logger.log(`Worldwide location hierarchy synced successfully. Total nodes in DB: ${totalCount}`);
    return {
      totalNodes: totalCount,
      countries: ['India', 'United Arab Emirates', 'United States', 'United Kingdom', 'Canada', 'Saudi Arabia', 'Singapore', 'Australia'],
    };
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

  async addCustomLocation(dto: {
    name: string;
    type: LocationType;
    parentId?: string;
    cityName?: string;
    stateName?: string;
  }): Promise<LocationDocument> {
    const cleanName = dto.name?.trim();
    if (!cleanName) {
      throw new BadRequestException('Location name is required');
    }

    const type = dto.type || LocationType.AREA;
    let parentId: Types.ObjectId | null = null;
    let ancestorIds: Types.ObjectId[] = [];

    if (dto.parentId && Types.ObjectId.isValid(dto.parentId)) {
      const parent = await this.locationModel.findById(dto.parentId);
      if (parent) {
        parentId = parent._id as Types.ObjectId;
        ancestorIds = [...(parent.ancestorIds || []), parentId];
      }
    }

    if (!parentId && dto.cityName) {
      const cityNode = await this.locationModel.findOne({
        name: new RegExp(`^${dto.cityName.trim()}$`, 'i'),
        type: { $in: [LocationType.CITY, LocationType.DISTRICT] },
      });
      if (cityNode) {
        parentId = cityNode._id as Types.ObjectId;
        ancestorIds = [...(cityNode.ancestorIds || []), parentId];
      }
    }

    const slug = this.slugify(cleanName);
    const existing = await this.locationModel.findOne({
      $or: [
        { name: new RegExp(`^${cleanName}$`, 'i'), parentId: parentId || null },
        { slug, parentId: parentId || null },
      ],
    });

    if (existing) {
      return existing;
    }

    const newLoc = new this.locationModel({
      name: cleanName,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      type,
      parentId,
      ancestorIds,
      isActive: true,
      sortOrder: 100,
    });

    return newLoc.save();
  }
}
