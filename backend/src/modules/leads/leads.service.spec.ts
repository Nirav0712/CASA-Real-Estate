import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LeadsService } from './leads.service';
import { Lead } from './schemas/lead.schema';
import { Property } from '../properties/schemas/property.schema';
import { AuditLog } from '../admin/schemas/audit-log.schema';
import { User } from '../auth/schemas/user.schema';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, AccountStatus } from '../auth/enums/auth.enums';
import { LeadStatus, LeadPriority, ActivityType, FollowUpStatus, FollowUpType } from './enums/lead.enums';

describe('LeadsService', () => {
  let service: LeadsService;

  const mockProperty = {
    _id: '6ac37112546469ec17b68c44',
    id: 'prop-101',
    title: { en: '4 BHK Luxury Independent Villa' },
    ownerId: 'user-owner-1',
    advertiserId: 'user-agent-1',
    isPublished: true,
    status: 'PUBLISHED',
  };

  const mockLead: any = {
    _id: '6ac37112546469ec17b68c99',
    propertyId: 'prop-101',
    agentId: 'user-agent-1',
    assignedAgentId: 'user-agent-1',
    ownerId: 'user-owner-1',
    purchaserId: 'purchaser-1',
    name: 'Anjali Sharma',
    mobile: '+919876543210',
    email: 'anjali@example.com',
    message: 'Interested in site visit',
    status: LeadStatus.NEW,
    priority: LeadPriority.MEDIUM,
    notes: [],
    activities: [],
    followUps: [],
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnValue({}),
  };

  const mockLeadModel = {
    create: jest.fn().mockResolvedValue(mockLead),
    countDocuments: jest.fn().mockResolvedValue(1),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockLead]),
          }),
        }),
      }),
    }),
    findOne: jest.fn(),
    findById: jest.fn(),
    aggregate: jest.fn().mockResolvedValue([{ _id: 'NEW', count: 1 }]),
  };

  const mockPropertyModel = {
    findOne: jest.fn(),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockProperty]),
      }),
    }),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ _id: 'user-agent-1', name: 'Rajesh Verma', role: UserRole.AGENT }]),
      }),
    }),
  };

  const mockAuditLogModel = {
    create: jest.fn().mockResolvedValue(true),
  };

  const agentUser: any = {
    id: 'user-agent-1',
    mobile: '+919925843599',
    normalizedMobile: '+919925843599',
    name: 'Rajesh Verma',
    role: UserRole.AGENT,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: true,
  };

  const adminUser: any = {
    id: 'user-admin-1',
    mobile: '+917359237870',
    normalizedMobile: '+917359237870',
    name: 'Admin User',
    role: UserRole.SUPER_ADMIN,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: false,
  };

  const purchaserUser: any = {
    id: 'purchaser-1',
    mobile: '+919876543210',
    normalizedMobile: '+919876543210',
    name: 'Anjali Sharma',
    role: UserRole.PURCHASER,
    status: AccountStatus.ACTIVE,
    isVerifiedAgent: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: getModelToken(Lead.name), useValue: mockLeadModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLead', () => {
    it('1. should create a new lead with server-side recipient routing', async () => {
      mockPropertyModel.findOne.mockResolvedValueOnce(mockProperty);
      mockLeadModel.findOne.mockResolvedValueOnce(null);

      const res = await service.createLead({
        propertyId: 'prop-101',
        name: 'Anjali Sharma',
        mobile: '+919876543210',
        message: 'Looking for prompt response.',
      });

      expect(res.success).toBe(true);
      expect(mockLeadModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: 'prop-101',
          agentId: 'user-agent-1',
          ownerId: 'user-owner-1',
          name: 'Anjali Sharma',
        }),
      );
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LEAD_CREATED' }),
      );
    });

    it('2. should reuse and update active lead on duplicate enquiry', async () => {
      mockPropertyModel.findOne.mockResolvedValueOnce(mockProperty);
      const activeLead: any = {
        ...mockLead,
        notes: [],
        activities: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockLeadModel.findOne.mockResolvedValueOnce(activeLead);

      const res = await service.createLead({
        propertyId: 'prop-101',
        name: 'Anjali Sharma',
        mobile: '+919876543210',
        message: 'Following up on my previous message.',
      });

      expect(res.success).toBe(true);
      expect(activeLead.notes.length).toBe(1);
      expect(activeLead.save).toHaveBeenCalled();
      expect(mockLeadModel.create).not.toHaveBeenCalled();
    });

    it('3. should reject lead creation if property is unpublished', async () => {
      mockPropertyModel.findOne.mockResolvedValueOnce({
        ...mockProperty,
        isPublished: false,
        status: 'DRAFT',
      });

      await expect(
        service.createLead({
          propertyId: 'prop-101',
          name: 'Anjali Sharma',
          mobile: '+919876543210',
          message: 'Interested',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateLeadStatus', () => {
    it('4. should update status to SITE_VISIT and record activity', async () => {
      const leadDoc: any = {
        ...mockLead,
        notes: [],
        activities: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockLeadModel.findById.mockResolvedValueOnce(leadDoc);

      const res = await service.updateLeadStatus('6ac37112546469ec17b68c99', agentUser, {
        status: LeadStatus.SITE_VISIT,
        note: 'Buyer confirmed visit at 11 AM.',
      });

      expect(res.success).toBe(true);
      expect(leadDoc.status).toBe(LeadStatus.SITE_VISIT);
      expect(leadDoc.notes.length).toBe(1);
      expect(leadDoc.activities.length).toBe(1);
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LEAD_STATUS_CHANGED' }),
      );
    });

    it('5. should record convertedAt when status is CONVERTED', async () => {
      const leadDoc: any = {
        ...mockLead,
        notes: [],
        activities: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockLeadModel.findById.mockResolvedValueOnce(leadDoc);

      const res = await service.updateLeadStatus('6ac37112546469ec17b68c99', agentUser, {
        status: LeadStatus.CONVERTED,
        note: 'Sale contract executed.',
      });

      expect(res.success).toBe(true);
      expect(leadDoc.status).toBe(LeadStatus.CONVERTED);
      expect(leadDoc.convertedAt).toBeDefined();
    });

    it('6. should reject status change if agent is unauthorized', async () => {
      mockLeadModel.findById.mockResolvedValueOnce({
        ...mockLead,
        agentId: 'other-agent',
        assignedAgentId: 'other-agent',
        ownerId: 'other-owner',
      });

      await expect(
        service.updateLeadStatus('6ac37112546469ec17b68c99', agentUser, {
          status: LeadStatus.SITE_VISIT,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assignLead', () => {
    it('7. should allow Admin to reassign lead to eligible Agent', async () => {
      const leadDoc: any = {
        ...mockLead,
        notes: [],
        activities: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockLeadModel.findById.mockResolvedValueOnce(leadDoc);
      mockUserModel.findOne.mockResolvedValueOnce({
        _id: '6ac48b6f1e9ac64331682985',
        name: 'Vikram Agent',
        role: UserRole.VERIFIED_AGENT,
      });

      const res = await service.assignLead('6ac37112546469ec17b68c99', adminUser, {
        assignedAgentId: '6ac48b6f1e9ac64331682985',
        note: 'Reassigned for luxury portfolio handling',
      });

      expect(res.success).toBe(true);
      expect(leadDoc.assignedAgentId).toBe('6ac48b6f1e9ac64331682985');
      expect(leadDoc.activities.length).toBe(1);
      expect(mockAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LEAD_ASSIGNED' }),
      );
    });

    it('8. should reject assignment if target user is not an agent/admin', async () => {
      mockLeadModel.findById.mockResolvedValueOnce(mockLead);
      mockUserModel.findOne.mockResolvedValueOnce({
        _id: '6ac48b6f1e9ac64331682985',
        name: 'Regular Buyer',
        role: UserRole.PURCHASER,
      });

      await expect(
        service.assignLead('6ac37112546469ec17b68c99', adminUser, {
          assignedAgentId: '6ac48b6f1e9ac64331682985',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('followUps', () => {
    it('9. should create scheduled follow-up and update nextFollowUpAt', async () => {
      const leadDoc: any = {
        ...mockLead,
        followUps: [],
        activities: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockLeadModel.findById.mockResolvedValueOnce(leadDoc);

      const due = new Date(Date.now() + 86400000).toISOString();
      const res = await service.createFollowUp('6ac37112546469ec17b68c99', agentUser, {
        dueAt: due,
        type: FollowUpType.CALL,
        note: 'Follow up call on price negotiation',
      });

      expect(res.success).toBe(true);
      expect(leadDoc.followUps.length).toBe(1);
      expect(leadDoc.nextFollowUpAt).toBeDefined();
    });

    it('10. should complete follow-up and recalculate nextFollowUpAt', async () => {
      const followUp = {
        _id: 'fu-1',
        dueAt: new Date(),
        status: FollowUpStatus.PENDING,
        type: FollowUpType.CALL,
      };
      const leadDoc: any = {
        ...mockLead,
        followUps: [followUp],
        activities: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockLeadModel.findById.mockResolvedValueOnce(leadDoc);

      const res = await service.completeFollowUp('6ac37112546469ec17b68c99', 'fu-1', agentUser, 'Completed call');

      expect(res.success).toBe(true);
      expect(followUp.status).toBe(FollowUpStatus.COMPLETED);
    });
  });

  describe('KPIs and Analytics', () => {
    it('11. should aggregate real database KPIs for Agent Dashboard', async () => {
      mockLeadModel.countDocuments.mockResolvedValue(5);

      const kpis = await service.getKPIs(agentUser);
      expect(kpis.totalLeads).toBe(5);
      expect(kpis.activeLeads).toBeDefined();
      expect(kpis.conversionRate).toBeDefined();
    });
  });
});
