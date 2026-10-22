import { EntitlementsService } from '../entitlements/entitlements.service';
import { PropertiesService } from './properties.service';

describe('CASA Login Protection & Contact Redaction Contracts', () => {
  let mockEntitlementsService: any;

  beforeEach(() => {
    mockEntitlementsService = new (EntitlementsService as any)(
      null, null, null, null, null, null, null, null,
    );
  });

  const rawPropertyWithContacts = {
    id: 'prop-123',
    slug: 'luxury-bodakdev-penthouse',
    title: { en: 'Luxury 4BHK Penthouse in Bodakdev' },
    specs: { bedrooms: 4, bathrooms: 4, carpetAreaSqFt: 3500 },
    advertiser: {
      name: 'Rajesh Sharma',
      phone: '+919876543210',
      email: 'rajesh@brokerage.com',
      whatsapp: '+919876543210',
      isVerifiedAgent: true,
      agencyName: 'Ahmedabad Premier Realty',
    },
  };

  it('should redact advertiser phone, email, and whatsapp for unauthenticated visitors and set locked flag', () => {
    const unauthenticatedResult = mockEntitlementsService.redactContactData(rawPropertyWithContacts, false);

    expect(unauthenticatedResult.contactLocked).toBe(true);
    expect(unauthenticatedResult.advertiser.phone).toBeNull();
    expect(unauthenticatedResult.advertiser.email).toBeNull();
    expect(unauthenticatedResult.advertiser.whatsapp).toBeNull();
    expect(unauthenticatedResult.advertiser.hasPhone).toBe(true);
    expect(unauthenticatedResult.contactMessage).toBe('Please Sign In or Create an Account to continue.');
  });

  it('should reveal advertiser phone and email when authenticated user has permission', () => {
    const authenticatedResult = mockEntitlementsService.redactContactData(rawPropertyWithContacts, true);

    expect(authenticatedResult.contactLocked).toBe(false);
    expect(authenticatedResult.advertiser.phone).toBe('+919876543210');
    expect(authenticatedResult.advertiser.email).toBe('rajesh@brokerage.com');
  });

  it('should sanitize advertiser contacts in search and list queries for unauthenticated visitors', () => {
    const propServiceProto = PropertiesService.prototype as any;
    const sanitizedSearchItem = propServiceProto.sanitizeAdvertiserForVisitor(rawPropertyWithContacts);

    expect(sanitizedSearchItem.advertiser.phone).toBeNull();
    expect(sanitizedSearchItem.advertiser.email).toBeNull();
    expect(sanitizedSearchItem.advertiser.whatsapp).toBeNull();
    expect(sanitizedSearchItem.advertiser.hasPhone).toBe(true);
    expect(sanitizedSearchItem.advertiser.name).toBe('Rajesh Sharma');
  });
});
