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
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { WhatsAppService } from '../leads/whatsapp.service';

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

  const mockWhatsAppService = {
    sendLeadNotification: jest.fn().mockResolvedValue({ success: true }),
    sendKycSubmittedNotification: jest.fn().mockResolvedValue({ success: true }),
    sendKycApprovedNotification: jest.fn().mockResolvedValue({ success: true }),
    sendKycRejectedNotification: jest.fn().mockResolvedValue({ success: true }),
    sendPackageChangedNotification: jest.fn().mockResolvedValue({ success: true }),
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
        { provide: WhatsAppService, useValue: mockWhatsAppService },
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

  it('should submit verification application, set kycStatus to PENDING, and write audit log', async () => {
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
    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-agent-1',
      expect.objectContaining({
        $set: expect.objectContaining({ kycStatus: 'PENDING', reraNumber: 'UPRERAAGT12890' }),
        $unset: { kycRejectionReason: 1 },
      }),
    );
    expect(mockAuditLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'AGENT_VERIFICATION_SUBMITTED' }),
    );
  });

  it('should upload KYC document, set kycStatus to PENDING, clear previous rejection reason, and dispatch notification', async () => {
    const mockSave = jest.fn().mockResolvedValue(true);
    mockAgentProfileModel.findOne.mockResolvedValueOnce({
      ...mockAgentProfile,
      _id: 'prof-123',
      verificationStatus: 'REJECTED',
      rejectionReasons: ['Document illegible'],
      save: mockSave,
    });

    mockAgentDocumentModel.create.mockResolvedValueOnce({
      _id: 'doc-456',
      documentType: 'GST_CERTIFICATE',
      documentUrl: 'data:image/png;base64,dummy',
      frontDocumentUrl: 'data:image/png;base64,dummy',
      backDocumentUrl: undefined,
      documentName: 'gst.png',
      status: 'PENDING',
      uploadedAt: new Date(),
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

    const res = await service.uploadDocument(authUser, {
      documentType: 'RERA_CERTIFICATE',
      documentName: 'rera.png',
      documentNumber: 'UPRERAAGT12345',
      documentUrl: 'data:image/png;base64,dummy',
      accountType: 'BROKER',
    });

    expect(res.success).toBe(true);
    expect(res.document.status).toBe('PENDING');
    expect(mockSave).toHaveBeenCalled();
    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-agent-1',
      expect.objectContaining({
        $set: expect.objectContaining({
          kycStatus: 'PENDING',
          kycDocumentType: 'RERA_CERTIFICATE',
          kycDocumentNumber: 'UPRERAAGT12345',
        }),
        $unset: { kycRejectionReason: 1 },
      }),
    );
  });

  it('should reject invalid document type for Broker/Developer', async () => {
    const authUser: AuthenticatedUser = {
      id: 'user-agent-1',
      name: 'Test Broker',
      mobile: '+919925843531',
      normalizedMobile: '+919925843531',
      role: UserRole.BROKER,
      platformRole: PlatformRole.USER,
      accountType: AccountType.BROKER,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    await expect(
      service.uploadDocument(authUser, {
        documentType: 'AADHAAR_CARD', // Prohibited for Broker
        documentName: 'aadhaar.png',
        documentUrl: 'data:image/png;base64,dummy',
      }),
    ).rejects.toThrow('Only "RERA Registration Certificate / License"');
  });

  it('should reject invalid document type for Buyer/Tenant', async () => {
    const authUser: AuthenticatedUser = {
      id: 'user-buyer-1',
      name: 'Test Buyer',
      mobile: '+919925843599',
      normalizedMobile: '+919925843599',
      role: UserRole.BUYER,
      platformRole: PlatformRole.USER,
      accountType: AccountType.BUYER,
      status: AccountStatus.ACTIVE,
      isVerifiedAgent: false,
    };

    await expect(
      service.uploadDocument(authUser, {
        documentType: 'RERA_CERTIFICATE', // Prohibited for Buyer
        documentName: 'rera.png',
        documentUrl: 'data:image/png;base64,dummy',
      }),
    ).rejects.toThrow('KYC verification is not required or applicable for Property Buyer, Rental Tenant, or Super Admin accounts.');
  });
});
