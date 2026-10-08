import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AgentsService } from './agents.service';
import { AgentProfile } from './schemas/agent-profile.schema';
import { AgentVerificationDocument } from './schemas/agent-document.schema';
import { User } from '../auth/schemas/user.schema';
import { Property } from '../properties/schemas/property.schema';
import { Lead } from '../leads/schemas/lead.schema';
import { AuditLog } from '../admin/schemas/audit-log.schema';
import { UserRole, AccountStatus, PlatformRole, AccountType } from '../auth/enums/auth.enums';

describe('AgentsService', () => {
  let service: AgentsService;

  const mockAgentProfile = {
    _id: 'prof-1',
    userId: 'user-agent-1',
    slug: 'rajesh-verma-ag1',
    displayName: 'Rajesh Verma',
    agencyName: 'Verma Luxury Real Estate',
    phone: '+919925843599',
    isVerifiedAgent: false,
    verificationStatus: 'NOT_SUBMITTED',
    reraNumber: 'UPRERAAGT12890',
    toObject: jest.fn().mockReturnValue({
      agencyName: 'Verma Luxury Real Estate',
      reraNumber: 'UPRERAAGT12890',
    }),
    save: jest.fn().mockResolvedValue(true),
  };

  const mockAgentProfileModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockAgentDocumentModel = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
    create: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  const mockUserModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'user-agent-1',
        id: 'user-agent-1',
        name: 'Rajesh Verma',
        role: UserRole.AGENT,
        platformRole: PlatformRole.USER,
        accountType: AccountType.AGENT,
        status: AccountStatus.ACTIVE,
        isVerifiedAgent: false,
      }),
    }),
    findByIdAndUpdate: jest.fn().mockResolvedValue(true),
  };

  const mockPropertyModel = {
    aggregate: jest.fn().mockResolvedValue([
      { _id: 'PUBLISHED', count: 5 },
      { _id: 'DRAFT', count: 2 },
    ]),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
  };

  const mockLeadModel = {
    countDocuments: jest.fn().mockResolvedValue(3),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
  };

  const mockAuditLogModel = {
    create: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: getModelToken(AgentProfile.name), useValue: mockAgentProfileModel },
        { provide: getModelToken(AgentVerificationDocument.name), useValue: mockAgentDocumentModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(Lead.name), useValue: mockLeadModel },
        { provide: getModelToken(AuditLog.name), useValue: mockAuditLogModel },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch or create agent profile', async () => {
    mockAgentProfileModel.findOne.mockResolvedValueOnce(mockAgentProfile);

    const authUser = {
      id: 'user-agent-1',
      mobile: '+919925843599',
      normalizedMobile: '+919925843599',
      name: 'Rajesh Verma',
      role: UserRole.AGENT,
      platformRole: PlatformRole.USER,
      accountType: AccountType.AGENT,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    const res = await service.getMyProfile(authUser);
    expect(res).toBeDefined();
    expect(res.displayName).toBe('Rajesh Verma');
  });

  it('should aggregate real dashboard metrics', async () => {
    mockAgentProfileModel.findOne.mockResolvedValueOnce(mockAgentProfile);

    const authUser = {
      id: 'user-agent-1',
      mobile: '+919925843599',
      normalizedMobile: '+919925843599',
      name: 'Rajesh Verma',
      role: UserRole.AGENT,
      platformRole: PlatformRole.USER,
      accountType: AccountType.AGENT,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    const metrics = await service.getDashboardMetrics(authUser);
    expect(metrics).toBeDefined();
    expect(metrics.propertySummary.published).toBe(5);
    expect(metrics.propertySummary.draft).toBe(2);
    expect(metrics.leadSummary.totalLeads).toBe(3);
  });

  it('should submit verification application and write audit log', async () => {
    mockAgentProfileModel.findOne.mockResolvedValueOnce({
      ...mockAgentProfile,
      verificationStatus: 'NOT_SUBMITTED',
      save: jest.fn().mockResolvedValue(true),
    });

    const authUser = {
      id: 'user-agent-1',
      mobile: '+919925843599',
      normalizedMobile: '+919925843599',
      name: 'Rajesh Verma',
      role: UserRole.AGENT,
      platformRole: PlatformRole.USER,
      accountType: AccountType.AGENT,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    const res = await service.submitVerification(authUser, {
      reraNumber: 'UPRERAAGT12890',
      reraState: 'Uttar Pradesh',
      agencyName: 'Verma Luxury Real Estate',
      notes: 'Applying for CASA verified broker badge',
    });

    expect(res.success).toBe(true);
    expect(res.verificationStatus).toBe('PENDING');
    expect(mockAuditLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'AGENT_VERIFICATION_SUBMITTED' }),
    );
  });
});
