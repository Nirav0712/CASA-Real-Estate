import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { LocationsService } from './locations.service';
import { Location } from './schemas/location.schema';
import { LocationType } from './enums/location-type.enum';
import { Property } from '../properties/schemas/property.schema';
import { AuditLog } from '../admin/schemas/audit-log.schema';

describe('LocationsService', () => {
  let service: LocationsService;
  let mockLocationModel: any;
  let mockPropertyModel: any;
  let mockAuditLogModel: any;

  const mockCountryId = new Types.ObjectId();
  const mockStateId = new Types.ObjectId();
  const mockDistrictId = new Types.ObjectId();
  const mockCityId = new Types.ObjectId();
  const mockLocalityId = new Types.ObjectId();

  const mockCountry = {
    _id: mockCountryId,
    name: 'India',
    slug: 'india',
    type: LocationType.COUNTRY,
    parentId: null,
    ancestorIds: [],
    countryCode: 'IN',
    isActive: true,
    toObject: () => ({ name: 'India', slug: 'india' }),
    save: jest.fn(),
  };

  const mockState = {
    _id: mockStateId,
    name: 'Gujarat',
    slug: 'gujarat',
    type: LocationType.STATE,
    parentId: mockCountryId,
    ancestorIds: [mockCountryId],
    countryCode: 'IN',
    stateCode: 'GJ',
    isActive: true,
    toObject: () => ({ name: 'Gujarat', slug: 'gujarat' }),
    save: jest.fn(),
  };

  const mockDistrict = {
    _id: mockDistrictId,
    name: 'Ahmedabad',
    slug: 'ahmedabad-district',
    type: LocationType.DISTRICT,
    parentId: mockStateId,
    ancestorIds: [mockCountryId, mockStateId],
    countryCode: 'IN',
    stateCode: 'GJ',
    isActive: true,
    toObject: () => ({ name: 'Ahmedabad', slug: 'ahmedabad-district' }),
    save: jest.fn(),
  };

  const mockCity = {
    _id: mockCityId,
    name: 'Ahmedabad',
    slug: 'ahmedabad',
    type: LocationType.CITY,
    parentId: mockDistrictId,
    ancestorIds: [mockCountryId, mockStateId, mockDistrictId],
    countryCode: 'IN',
    stateCode: 'GJ',
    cityCode: 'AMD',
    isActive: true,
    toObject: () => ({ name: 'Ahmedabad', slug: 'ahmedabad' }),
    save: jest.fn(),
  };

  const mockLocality = {
    _id: mockLocalityId,
    name: 'Satellite',
    slug: 'satellite',
    type: LocationType.LOCALITY,
    parentId: mockCityId,
    ancestorIds: [mockCountryId, mockStateId, mockDistrictId, mockCityId],
    countryCode: 'IN',
    stateCode: 'GJ',
    cityCode: 'AMD',
    pincode: '380015',
    isActive: true,
    toObject: () => ({ name: 'Satellite', slug: 'satellite' }),
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockLocationModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockPropertyModel = {
      countDocuments: jest.fn(),
    };

    mockAuditLogModel = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getModelToken(Location.name), useValue: mockLocationModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  describe('createLocation', () => {
    it('should create a COUNTRY location with no parent', async () => {
      mockLocationModel.findOne.mockResolvedValue(null);
      mockLocationModel.create.mockResolvedValue({
        ...mockCountry,
        _id: mockCountryId,
      });

      const result = await service.createLocation({
        name: 'India',
        type: LocationType.COUNTRY,
        countryCode: 'IN',
      });

      expect(result).toBeDefined();
      expect(mockLocationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'India',
          slug: 'india',
          type: LocationType.COUNTRY,
          parentId: null,
          ancestorIds: [],
        }),
      );
    });

    it('should reject a COUNTRY with a parentId', async () => {
      await expect(
        service.createLocation({
          name: 'India',
          type: LocationType.COUNTRY,
          parentId: mockCountryId.toString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a non-COUNTRY without a parentId', async () => {
      await expect(
        service.createLocation({
          name: 'Gujarat',
          type: LocationType.STATE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a STATE under a COUNTRY parent', async () => {
      mockLocationModel.findById.mockResolvedValue(mockCountry);
      mockLocationModel.findOne.mockResolvedValue(null);
      mockLocationModel.create.mockResolvedValue(mockState);

      const result = await service.createLocation({
        name: 'Gujarat',
        type: LocationType.STATE,
        parentId: mockCountryId.toString(),
        stateCode: 'GJ',
      });

      expect(result).toBeDefined();
      expect(mockLocationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Gujarat',
          type: LocationType.STATE,
          parentId: mockCountryId,
          ancestorIds: [mockCountryId],
        }),
      );
    });

    it('should reject invalid hierarchy (e.g. LOCALITY under COUNTRY)', async () => {
      mockLocationModel.findById.mockResolvedValue(mockCountry);

      await expect(
        service.createLocation({
          name: 'Satellite',
          type: LocationType.LOCALITY,
          parentId: mockCountryId.toString(),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject duplicate location under same parent', async () => {
      mockLocationModel.findById.mockResolvedValue(mockDistrict);
      mockLocationModel.findOne.mockResolvedValue(mockCity);

      await expect(
        service.createLocation({
          name: 'Ahmedabad',
          type: LocationType.CITY,
          parentId: mockDistrictId.toString(),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('hierarchy and breadcrumbs', () => {
    it('should resolve full ancestor path correctly', async () => {
      mockLocationModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockLocality),
      });
      mockLocationModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockCountry, mockState, mockDistrict, mockCity]),
      });

      const hierarchy = await service.getHierarchy(mockLocalityId.toString());

      expect(hierarchy).toBeDefined();
      expect(hierarchy.fullPath).toBe('Satellite, Ahmedabad, Ahmedabad, Gujarat, India');
      expect(hierarchy.breadcrumb).toHaveLength(5);
      expect(hierarchy.breadcrumb[0].name).toBe('India');
      expect(hierarchy.breadcrumb[4].name).toBe('Satellite');
    });
  });

  describe('safe delete', () => {
    it('should reject delete if child locations exist', async () => {
      mockLocationModel.findById.mockResolvedValue(mockCity);
      mockLocationModel.countDocuments.mockResolvedValue(3); // 3 children

      await expect(service.deleteLocation(mockCityId.toString())).rejects.toThrow(ConflictException);
    });

    it('should reject delete if properties reference the location', async () => {
      mockLocationModel.findById.mockResolvedValue(mockLocality);
      mockLocationModel.countDocuments.mockResolvedValue(0); // 0 children
      mockPropertyModel.countDocuments.mockResolvedValue(5); // 5 properties

      await expect(service.deleteLocation(mockLocalityId.toString())).rejects.toThrow(ConflictException);
    });

    it('should allow delete if no children and no properties reference it', async () => {
      mockLocationModel.findById.mockResolvedValue(mockLocality);
      mockLocationModel.countDocuments.mockResolvedValue(0);
      mockPropertyModel.countDocuments.mockResolvedValue(0);
      mockLocationModel.findByIdAndDelete.mockResolvedValue(mockLocality);

      const res = await service.deleteLocation(mockLocalityId.toString(), {
        id: 'admin-1',
        name: 'Admin',
        role: 'ADMIN',
      });

      expect(res.deletedId).toBe(mockLocalityId.toString());
      expect(mockLocationModel.findByIdAndDelete).toHaveBeenCalledWith(mockLocalityId.toString());
    });
  });

  describe('activation and deactivation', () => {
    it('should activate location', async () => {
      const loc = { ...mockLocality, isActive: false, save: jest.fn().mockResolvedValue(true) };
      mockLocationModel.findById.mockResolvedValue(loc);

      const result = await service.activateLocation(mockLocalityId.toString());
      expect(result.isActive).toBe(true);
    });

    it('should deactivate location', async () => {
      const loc = { ...mockLocality, isActive: true, save: jest.fn().mockResolvedValue(true) };
      mockLocationModel.findById.mockResolvedValue(loc);

      const result = await service.deactivateLocation(mockLocalityId.toString());
      expect(result.isActive).toBe(false);
    });
  });
});
