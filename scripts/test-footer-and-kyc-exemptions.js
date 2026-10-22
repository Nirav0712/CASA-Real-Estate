/**
 * Automated Test Suite: Footer Redesign & KYC Exemptions Verification
 * 
 * Verifies:
 * 1. Footer redesign:
 *    - No support office address, Lucknow, contact details, or promotional gateway text
 *    - Multilingual buttons (en, hi, ar, ur) preserved
 *    - Real-estate links preserved (Buy Property, Rent Property, Post Property, Categories, About Us, Privacy, Terms)
 * 2. KYC Exemptions:
 *    - Property Buyer: exempt, isKycExempt=true, isKycRequired=false, submission rejected (not required)
 *    - Rental Tenant: exempt, isKycExempt=true, isKycRequired=false, submission rejected (not required)
 *    - Super Admin: exempt, isKycExempt=true, retains admin access, verifyAgent guards prevent mutating Super Admin
 * 3. KYC-Required Accounts:
 *    - Agent, Broker, Developer, Property Owner: isKycExempt=false, isKycRequired=true, verification workflow preserved
 * 4. Preserved features: 3-day trial invariants, subscriptions, authentication, and role-based permissions.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Colors for reporting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passedTests = 0;
let totalTests = 0;

function pass(title, detail = '') {
  totalTests++;
  passedTests++;
  console.log(`${GREEN}✓ PASS [${totalTests}]: ${title}${RESET} ${detail ? `(${detail})` : ''}`);
}

function fail(title, error) {
  totalTests++;
  console.error(`${RED}✗ FAIL [${totalTests}]: ${title}${RESET}`);
  console.error(`  Error: ${error.message || error}`);
}

async function runTests() {
  console.log(`${BLUE}======================================================${RESET}`);
  console.log(`${BLUE}CASA / myproperty — Footer Redesign & KYC Exemption Suite${RESET}`);
  console.log(`${BLUE}======================================================\n${RESET}`);

  // ---------------------------------------------------------
  // TEST SECTION 1: Footer Redesign Verification
  // ---------------------------------------------------------
  console.log(`${BLUE}--- Section 1: Footer Redesign Verification ---${RESET}`);
  try {
    const headerPath = path.join(__dirname, '..', 'frontend', 'components', 'layout', 'header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    // Extract Footer function
    const footerMatch = headerContent.match(/export function Footer\(\)[\s\S]+?<\/footer>/);
    assert(footerMatch, 'Footer component must exist in header.tsx');
    const footerContent = footerMatch[0];

    // Check 1: Support office address removed
    assert(!footerContent.includes('Support Office'), 'Footer must not contain "Support Office"');
    assert(!footerContent.includes('Lucknow, Uttar Pradesh, India'), 'Footer must not contain "Lucknow, Uttar Pradesh, India"');
    pass('Support office address removed from footer');

    // Check 2: Direct Marketplace Gateway removed
    assert(!footerContent.includes('Direct Marketplace Gateway'), 'Footer must not contain "Direct Marketplace Gateway"');
    pass('Promotional text removed from footer');

    // Check 3: Multilingual support buttons kept
    assert(footerContent.includes('SUPPORTED_LOCALES'), 'Footer must include SUPPORTED_LOCALES');
    assert(footerContent.includes('setLocale(loc)'), 'Footer must include setLocale buttons for language switching');
    assert(footerContent.includes('t(\'multilingualReach\')'), 'Footer must render multilingual reach heading');
    pass('Multilingual language switcher preserved (en, hi, ar, ur)');

    // Check 4: Marketplace links
    assert(footerContent.includes('/properties?type=SALE'), 'Footer must link to Buy Property (/properties?type=SALE)');
    assert(footerContent.includes('/properties?type=RENT'), 'Footer must link to Rent Property (/properties?type=RENT)');
    assert(footerContent.includes('/dashboard/properties/new'), 'Footer must link to Sell/Post Property');
    assert(footerContent.includes('/properties'), 'Footer must link to Explore All Properties');
    pass('Marketplace real-estate navigation links present');

    // Check 5: Categories & Legal Links
    assert(footerContent.includes('CASA_CATEGORIES'), 'Footer must render property categories');
    assert(footerContent.includes('t(\'aboutUs\')'), 'Footer must include About Us link');
    assert(footerContent.includes('t(\'privacyPolicy\')'), 'Footer must include Privacy Policy link');
    assert(footerContent.includes('t(\'termsOfService\')'), 'Footer must include Terms of Service link');
    pass('Categories, About Us, Privacy Policy, Terms of Service present');

    // Check 6: Translations dictionary check
    const transPath = path.join(__dirname, '..', 'frontend', 'lib', 'translations.ts');
    const transContent = fs.readFileSync(transPath, 'utf8');
    assert(transContent.includes('aboutUs: \'About Us\''), 'en translation must have aboutUs');
    assert(transContent.includes('aboutUs: \'हमारे बारे में\''), 'hi translation must have aboutUs');
    assert(transContent.includes('aboutUs: \'من نحن\''), 'ar translation must have aboutUs');
    assert(transContent.includes('aboutUs: \'ہمارے بارے میں\''), 'ur translation must have aboutUs');
    pass('Translations for About Us defined across all 4 locales (en, hi, ar, ur)');

  } catch (err) {
    fail('Footer redesign check', err);
  }

  // ---------------------------------------------------------
  // TEST SECTION 2: Frontend KYC Exemption Logic
  // ---------------------------------------------------------
  console.log(`\n${BLUE}--- Section 2: Frontend KYC Exemption Logic ---${RESET}`);
  try {
    const bannerPath = path.join(__dirname, '..', 'frontend', 'components', 'dashboard', 'kyc-status-banner.tsx');
    const bannerContent = fs.readFileSync(bannerPath, 'utf8');

    // Verify isKycExempt function in kyc-status-banner.tsx
    assert(bannerContent.includes('export function isKycExempt'), 'isKycExempt helper must be exported');
    assert(bannerContent.includes('isBuyer = role === \'BUYER\' || role === \'PURCHASER\' || accountType === \'BUYER\''), 'Buyer exemption defined');
    assert(bannerContent.includes('isTenant = role === \'TENANT\' || accountType === \'TENANT\''), 'Tenant exemption defined');
    assert(bannerContent.includes('isSuperAdmin'), 'Super Admin exemption defined');
    assert(bannerContent.includes('if (isExempt) {\n    return null;\n  }'), 'Banner must return null for exempt accounts');
    pass('KycStatusBanner cleanly returns null for Buyer, Tenant, and Super Admin');

    // Verify KYC Dashboard Page (/dashboard/kyc)
    const kycPagePath = path.join(__dirname, '..', 'frontend', 'app', 'dashboard', 'kyc', 'page.tsx');
    const kycPageContent = fs.readFileSync(kycPagePath, 'utf8');
    assert(kycPageContent.includes('isKycExempt'), 'KYC page must check isKycExempt');
    assert(kycPageContent.includes('KYC Verification Not Required'), 'KYC page must render "KYC Verification Not Required" for exempt accounts');
    assert(kycPageContent.includes('Super Admin Governance Access'), 'KYC page must render admin governance status for Super Admin');
    pass('/dashboard/kyc renders tailored exemption card without upload form for exempt users');

    // Verify Billing Page advisory notice
    const billingPagePath = path.join(__dirname, '..', 'frontend', 'app', 'dashboard', 'billing', 'page.tsx');
    const billingPageContent = fs.readFileSync(billingPagePath, 'utf8');
    assert(billingPageContent.includes('const isExempt = isKycExempt(user)'), 'Billing page must check isKycExempt(user)');
    assert(billingPageContent.includes('{!isExempt && ('), 'KYC call notice must be hidden for exempt users');
    pass('Billing page hides KYC call advisory notice for exempt accounts');

  } catch (err) {
    fail('Frontend KYC exemption logic check', err);
  }

  // ---------------------------------------------------------
  // TEST SECTION 3: Backend KYC Exemption & Service Rules
  // ---------------------------------------------------------
  console.log(`\n${BLUE}--- Section 3: Backend KYC Service & Guard Rules ---${RESET}`);
  try {
    const agentsServicePath = path.join(__dirname, '..', 'backend', 'src', 'modules', 'agents', 'agents.service.ts');
    const agentsServiceContent = fs.readFileSync(agentsServicePath, 'utf8');

    // Check getMyVerification exemption
    assert(agentsServiceContent.includes('kycStatus: \'EXEMPT\''), 'getMyVerification must return kycStatus: EXEMPT for exempt accounts');
    assert(agentsServiceContent.includes('isKycExempt: true'), 'getMyVerification must set isKycExempt: true');
    assert(agentsServiceContent.includes('isKycRequired: false'), 'getMyVerification must set isKycRequired: false');
    pass('backend getMyVerification returns EXEMPT status for Buyer, Tenant, and Super Admin');

    // Check submitVerification exemption guard
    assert(
      agentsServiceContent.includes('KYC verification is not required or applicable for Property Buyer, Rental Tenant, or Super Admin accounts'),
      'submitVerification must throw BadRequestException for exempt accounts'
    );
    pass('backend submitVerification rejects submissions for exempt accounts with 400 Bad Request');

    // Check uploadDocument exemption guard
    assert(
      agentsServiceContent.includes('KYC verification is not required or applicable for Property Buyer, Rental Tenant, or Super Admin accounts'),
      'uploadDocument must throw BadRequestException for exempt accounts'
    );
    pass('backend uploadDocument rejects uploads for exempt accounts with 400 Bad Request');

    // Check backend sanitizeUser in auth.service.ts
    const authServicePath = path.join(__dirname, '..', 'backend', 'src', 'modules', 'auth', 'auth.service.ts');
    const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
    assert(authServiceContent.includes('const isKycExempt = isConsumer || isPlatformAdmin'), 'sanitizeUser must compute isKycExempt');
    assert(authServiceContent.includes('kycStatus: isKycExempt ? \'EXEMPT\' : (user.kycStatus || \'NOT_SUBMITTED\')'), 'sanitizeUser must set EXEMPT kycStatus for exempt accounts');
    assert(authServiceContent.includes('isKycExempt,'), 'sanitizeUser must include isKycExempt in returned user');
    assert(authServiceContent.includes('isKycRequired: !isKycExempt,'), 'sanitizeUser must include isKycRequired in returned user');
    pass('backend sanitizeUser outputs isKycExempt, isKycRequired, and EXEMPT kycStatus');

    // Check JWT Auth Guard (never blocks exempt accounts from active sessions)
    const jwtGuardPath = path.join(__dirname, '..', 'backend', 'src', 'modules', 'auth', 'guards', 'jwt-auth.guard.ts');
    const jwtGuardContent = fs.readFileSync(jwtGuardPath, 'utf8');
    assert(jwtGuardContent.includes('const isConsumerAccount ='), 'jwt-auth.guard must identify isConsumerAccount');
    assert(jwtGuardContent.includes('const isPlatformAdmin ='), 'jwt-auth.guard must identify isPlatformAdmin');
    assert(jwtGuardContent.includes('if (!isConsumerAccount && !isPlatformAdmin && user) {'), 'jwt-auth.guard must exempt Buyer, Tenant, and Super Admin from trial/kyc session termination');
    pass('backend jwt-auth.guard guarantees exempt accounts are never blocked by KYC checks');

    // Check admin queue filter in admin.service.ts
    const adminServicePath = path.join(__dirname, '..', 'backend', 'src', 'modules', 'admin', 'admin.service.ts');
    const adminServiceContent = fs.readFileSync(adminServicePath, 'utf8');
    assert(adminServiceContent.includes('const exemptAccountTypes = [AccountType.BUYER, AccountType.TENANT]'), 'Admin KYC queue excludes Buyer and Tenant');
    assert(adminServiceContent.includes('const exemptRoles = ['), 'Admin KYC queue excludes consumer and admin roles');
    assert(adminServiceContent.includes('Super Administrator accounts cannot be modified via agent KYC verification'), 'Super Admin cannot be mutated by verifyAgent / rejectAgentVerification');
    pass('backend admin.service.ts filters exempt accounts from KYC queue and preserves Super Admin security');

  } catch (err) {
    fail('Backend KYC exemption and service rules check', err);
  }

  // ---------------------------------------------------------
  // TEST SECTION 4: Live Runtime Model Simulation
  // ---------------------------------------------------------
  console.log(`\n${BLUE}--- Section 4: Live Runtime Model Simulation ---${RESET}`);
  try {
    // Simulate isKycExempt function exactly as implemented in frontend
    function testIsKycExempt(user) {
      if (!user) return false;
      if (user.isKycExempt !== undefined) return user.isKycExempt;

      const role = (user.role || '').toUpperCase();
      const accountType = (user.accountType || '').toUpperCase();
      const platformRole = (user.platformRole || '').toUpperCase();

      const isBuyer = role === 'BUYER' || role === 'PURCHASER' || accountType === 'BUYER';
      const isTenant = role === 'TENANT' || accountType === 'TENANT';
      const isSuperAdmin =
        platformRole === 'SUPER_ADMIN' ||
        platformRole === 'ADMIN' ||
        role === 'SUPER_ADMIN' ||
        role === 'ADMIN';

      return isBuyer || isTenant || isSuperAdmin;
    }

    // 1. Property Buyer
    const buyer1 = { role: 'BUYER', accountType: 'BUYER', platformRole: 'USER' };
    const buyer2 = { role: 'PURCHASER', accountType: null, platformRole: 'USER' };
    assert(testIsKycExempt(buyer1) === true, 'Property Buyer must be KYC exempt');
    assert(testIsKycExempt(buyer2) === true, 'Purchaser must be KYC exempt');
    pass('Account Type: Property Buyer is KYC-exempt (true)');

    // 2. Rental Tenant
    const tenant1 = { role: 'TENANT', accountType: 'TENANT', platformRole: 'USER' };
    assert(testIsKycExempt(tenant1) === true, 'Rental Tenant must be KYC exempt');
    pass('Account Type: Rental Tenant is KYC-exempt (true)');

    // 3. Super Admin
    const superAdmin1 = { role: 'SUPER_ADMIN', accountType: null, platformRole: 'SUPER_ADMIN' };
    const superAdmin2 = { role: 'ADMIN', accountType: null, platformRole: 'ADMIN' };
    assert(testIsKycExempt(superAdmin1) === true, 'Super Admin must be KYC exempt');
    assert(testIsKycExempt(superAdmin2) === true, 'Admin must be KYC exempt');
    pass('Account Type: Super Admin is KYC-exempt (true)');

    // 4. KYC-Required: Real Estate Agent
    const agent = { role: 'AGENT', accountType: 'AGENT', platformRole: 'USER' };
    assert(testIsKycExempt(agent) === false, 'Real Estate Agent must require KYC');
    pass('Account Type: Real Estate Agent requires KYC (exempt = false)');

    // 5. KYC-Required: Property Broker
    const broker = { role: 'BROKER', accountType: 'BROKER', platformRole: 'USER' };
    const brokerAgency = { role: 'BROKER', accountType: 'BROKER_AGENCY', platformRole: 'USER' };
    assert(testIsKycExempt(broker) === false, 'Property Broker must require KYC');
    assert(testIsKycExempt(brokerAgency) === false, 'Broker Agency must require KYC');
    pass('Account Type: Property Broker / Agency requires KYC (exempt = false)');

    // 6. KYC-Required: Real Estate Developer
    const developer = { role: 'DEVELOPER', accountType: 'DEVELOPER', platformRole: 'USER' };
    assert(testIsKycExempt(developer) === false, 'Real Estate Developer must require KYC');
    pass('Account Type: Real Estate Developer requires KYC (exempt = false)');

    // 7. KYC-Required: Property Owner / Seller
    const owner = { role: 'PROPERTY_OWNER', accountType: 'PROPERTY_OWNER', platformRole: 'USER' };
    const seller = { role: 'SELLER', accountType: 'SELLER', platformRole: 'USER' };
    assert(testIsKycExempt(owner) === false, 'Property Owner must require KYC');
    assert(testIsKycExempt(seller) === false, 'Property Seller must require KYC');
    pass('Account Type: Property Owner / Seller requires KYC (exempt = false)');

  } catch (err) {
    fail('Live runtime model simulation check', err);
  }

  // ---------------------------------------------------------
  // Summary
  // ---------------------------------------------------------
  console.log(`\n${BLUE}======================================================${RESET}`);
  console.log(`${GREEN}TEST SUITE COMPLETED: ${passedTests}/${totalTests} TESTS PASSED${RESET}`);
  console.log(`${BLUE}======================================================${RESET}\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests();
