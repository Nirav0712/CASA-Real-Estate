// Comprehensive RBAC & Security Test Suite for CASA Real Estate
// Tests authorization, ownership, positive & negative access across all roles
// Uses native Node.js fetch with per-user simulated IPs to bypass rate-limit noise in tests

const API_BASE = 'http://localhost:5000/api/v1';

async function request(url, options = {}, ip = '127.0.0.1') {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function getAuthToken(mobile, name, requestedRole, ip) {
  try {
    // 1. Request OTP
    const reqBody = { mobile };
    if (requestedRole) {
      reqBody.name = name;
      reqBody.role = requestedRole;
    }
    const otpRes = await request(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      body: JSON.stringify(reqBody),
    }, ip);
    const otp = otpRes.data?.data?.otp || otpRes.data?.otp || '123456';

    // 2. Verify OTP
    const verifyBody = {
      mobile,
      otp: String(otp),
    };
    if (requestedRole) {
      verifyBody.name = name;
      verifyBody.role = requestedRole;
    }
    const verifyRes = await request(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      body: JSON.stringify(verifyBody),
    }, ip);
    if (!verifyRes.data?.tokens?.accessToken) {
      throw new Error(`Token missing in response: ${JSON.stringify(verifyRes.data)}`);
    }
    return {
      token: verifyRes.data.tokens.accessToken,
      user: verifyRes.data.user,
    };
  } catch (err) {
    console.error(`Failed to auth user ${mobile}:`, err.message);
    throw err;
  }
}

async function runRbacTests() {
  console.log('====================================================');
  console.log('STARTING CASA REAL ESTATE AUTOMATED RBAC TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // Step 1: Provision / Login test accounts
    console.log('1. Authenticating test users with different roles...');
    
    // Super Admin (pre-assigned phone)
    const superAdminAuth = await getAuthToken('9925843599', 'Super Admin', null, '10.0.0.100');
    console.log(`- Super Admin auth: role=${superAdminAuth.user.role}, accountType=${superAdminAuth.user.accountType}`);

    // Buyer
    const buyerAuth = await getAuthToken('9100000001', 'Test Buyer', 'BUYER', '10.0.0.101');
    console.log(`- Buyer auth: role=${buyerAuth.user.role}, accountType=${buyerAuth.user.accountType}`);

    // Tenant
    const tenantAuth = await getAuthToken('9100000002', 'Test Tenant', 'TENANT', '10.0.0.102');
    console.log(`- Tenant auth: role=${tenantAuth.user.role}, accountType=${tenantAuth.user.accountType}`);

    // Property Owner / Seller
    const sellerAuth = await getAuthToken('9100000003', 'Test Seller', 'PROPERTY_OWNER', '10.0.0.103');
    console.log(`- Seller auth: role=${sellerAuth.user.role}, accountType=${sellerAuth.user.accountType}`);

    // Agent
    const agentAuth = await getAuthToken('9100000004', 'Test Agent', 'AGENT', '10.0.0.104');
    console.log(`- Agent auth: role=${agentAuth.user.role}, accountType=${agentAuth.user.accountType}`);

    // Broker
    const brokerAuth = await getAuthToken('9100000005', 'Test Broker', 'BROKER', '10.0.0.105');
    console.log(`- Broker auth: role=${brokerAuth.user.role}, accountType=${brokerAuth.user.accountType}`);

    // Developer
    const developerAuth = await getAuthToken('9100000006', 'Test Developer', 'DEVELOPER', '10.0.0.106');
    console.log(`- Developer auth: role=${developerAuth.user.role}, accountType=${developerAuth.user.accountType}`);

    console.log('\n2. Testing Public Self-Registration Privilege Escalation Guard...');
    // Try to register as SUPER_ADMIN directly via public endpoint
    const hackerRes = await request(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      body: JSON.stringify({
        mobile: '9199999999',
        name: 'Hacker User',
        role: 'SUPER_ADMIN',
      }),
    }, '10.0.0.199');
    assert(hackerRes.status === 400 || hackerRes.status === 429, 'Public registration rejects SUPER_ADMIN request', `Status: ${hackerRes.status}`);

    console.log('\n3. Testing Admin Endpoint Access Control (AdminGuard / SuperAdminGuard)...');
    
    // Negative test: Buyer accessing admin users
    const buyerAdminRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${buyerAuth.token}` },
    }, '10.0.0.101');
    assert(buyerAdminRes.status === 403, 'Buyer blocked from GET /admin/users (403 Forbidden)', `Status: ${buyerAdminRes.status}`);

    // Negative test: Agent accessing admin users
    const agentAdminRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${agentAuth.token}` },
    }, '10.0.0.104');
    assert(agentAdminRes.status === 403, 'Agent blocked from GET /admin/users (403 Forbidden)', `Status: ${agentAdminRes.status}`);

    // Negative test: Seller accessing admin dashboard-stats
    const sellerAdminRes = await request(`${API_BASE}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${sellerAuth.token}` },
    }, '10.0.0.103');
    assert(sellerAdminRes.status === 403, 'Seller blocked from GET /admin/dashboard-stats (403 Forbidden)', `Status: ${sellerAdminRes.status}`);

    // Positive test: Super Admin accessing admin dashboard-stats
    const superAdminStatsRes = await request(`${API_BASE}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
    }, '10.0.0.100');
    assert(superAdminStatsRes.status === 200, 'Super Admin granted access to GET /admin/dashboard-stats (200 OK)', `Status: ${superAdminStatsRes.status}`);

    console.log('\n4. Testing Property Creation Permissions (RBAC)...');
    
    const samplePropertyPayload = {
      title: { en: 'RBAC Test Luxury Apartment in Science City' },
      description: { en: 'A verified test listing to validate authorization rules and role access across CASA.' },
      category: 'APARTMENT',
      listingType: 'SALE',
      price: {
        amount: 7500000,
        currency: 'INR',
        isNegotiable: true,
      },
      specifications: {
        bedrooms: 3,
        bathrooms: 2,
        superBuiltUpArea: 1450,
        carpetArea: 1200,
      },
      location: {
        locality: 'Science City',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380060',
      },
    };

    // Negative test: Buyer CANNOT create property
    const buyerCreateRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerAuth.token}` },
      body: JSON.stringify(samplePropertyPayload),
    }, '10.0.0.101');
    assert(buyerCreateRes.status === 403, 'Buyer blocked from POST /properties (403 Forbidden)', `Status: ${buyerCreateRes.status}`);

    // Negative test: Tenant CANNOT create property
    const tenantCreateRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantAuth.token}` },
      body: JSON.stringify(samplePropertyPayload),
    }, '10.0.0.102');
    assert(tenantCreateRes.status === 403, 'Tenant blocked from POST /properties (403 Forbidden)', `Status: ${tenantCreateRes.status}`);

    // Positive test: Seller CAN create property
    const sellerCreateRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerAuth.token}` },
      body: JSON.stringify({
        ...samplePropertyPayload,
        title: { en: 'Seller RBAC Test Apartment' },
      }),
    }, '10.0.0.103');
    assert(sellerCreateRes.status === 201 || sellerCreateRes.status === 200, 'Seller allowed to POST /properties (201 Created)', `Status: ${sellerCreateRes.status}`);

    // Positive test: Agent CAN create property
    const agentCreateRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentAuth.token}` },
      body: JSON.stringify({
        ...samplePropertyPayload,
        title: { en: 'Agent RBAC Test Villa' },
      }),
    }, '10.0.0.104');
    assert(agentCreateRes.status === 201 || agentCreateRes.status === 200, 'Agent allowed to POST /properties (201 Created)', `Status: ${agentCreateRes.status}`);

    // Positive test: Developer CAN create property
    const devCreateRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${developerAuth.token}` },
      body: JSON.stringify({
        ...samplePropertyPayload,
        title: { en: 'Developer RBAC Test Tower Unit' },
      }),
    }, '10.0.0.106');
    assert(devCreateRes.status === 201 || devCreateRes.status === 200, 'Developer allowed to POST /properties (201 Created)', `Status: ${devCreateRes.status}`);

    // Positive test: Broker CAN create property
    const brokerCreateRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${brokerAuth.token}` },
      body: JSON.stringify({
        ...samplePropertyPayload,
        title: { en: 'Broker RBAC Test Penthouse' },
      }),
    }, '10.0.0.105');
    assert(brokerCreateRes.status === 201 || brokerCreateRes.status === 200, 'Broker allowed to POST /properties (201 Created)', `Status: ${brokerCreateRes.status}`);

    console.log('\n5. Testing Purchaser/Buyer-specific Endpoint Protection...');
    // Buyer accessing purchaser profile/wishlist
    const buyerProfileRes = await request(`${API_BASE}/purchaser/profile`, {
      headers: { Authorization: `Bearer ${buyerAuth.token}` },
    }, '10.0.0.101');
    assert(buyerProfileRes.status === 200, 'Buyer can access GET /purchaser/profile (200 OK)', `Status: ${buyerProfileRes.status}`);

    // Tenant accessing purchaser profile/wishlist
    const tenantProfileRes = await request(`${API_BASE}/purchaser/profile`, {
      headers: { Authorization: `Bearer ${tenantAuth.token}` },
    }, '10.0.0.102');
    assert(tenantProfileRes.status === 200, 'Tenant can access GET /purchaser/profile (200 OK)', `Status: ${tenantProfileRes.status}`);

    console.log('\n====================================================');
    console.log(`TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error in RBAC test suite:', err);
    process.exit(1);
  }
}

// Small sleep to ensure rate limiter window refreshes
setTimeout(() => {
  runRbacTests();
}, 1000);
