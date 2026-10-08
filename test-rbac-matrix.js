// Comprehensive RBAC & Security Test Suite for CASA Real Estate
// Strictly validates Platform Role and Account Type normalization

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
    console.log('1. Authenticating test users across all platform and marketplace roles...\n');

    // Super Admin (pre-assigned phone)
    const superAdminAuth = await getAuthToken('9925843599', 'Super Admin', null, '10.0.0.100');
    assert(superAdminAuth.user.platformRole === 'SUPER_ADMIN', 'Super Admin platformRole is SUPER_ADMIN', `Received: ${superAdminAuth.user.platformRole}`);
    assert(superAdminAuth.user.accountType === null, 'Super Admin accountType is strictly null', `Received: ${superAdminAuth.user.accountType}`);

    // Buyer
    const buyerAuth = await getAuthToken('9100001001', 'Test Buyer', 'BUYER', '10.0.0.101');
    assert(buyerAuth.user.platformRole === 'USER', 'Buyer platformRole is USER', `Received: ${buyerAuth.user.platformRole}`);
    assert(buyerAuth.user.accountType === 'BUYER', 'Buyer accountType is BUYER', `Received: ${buyerAuth.user.accountType}`);

    // Tenant
    const tenantAuth = await getAuthToken('9100001002', 'Test Tenant', 'TENANT', '10.0.0.102');
    assert(tenantAuth.user.platformRole === 'USER', 'Tenant platformRole is USER', `Received: ${tenantAuth.user.platformRole}`);
    assert(tenantAuth.user.accountType === 'TENANT', 'Tenant accountType is TENANT', `Received: ${tenantAuth.user.accountType}`);

    // Property Owner / Seller
    const sellerAuth = await getAuthToken('9100001003', 'Test Seller', 'PROPERTY_OWNER', '10.0.0.103');
    assert(sellerAuth.user.platformRole === 'USER', 'Seller platformRole is USER', `Received: ${sellerAuth.user.platformRole}`);
    assert(sellerAuth.user.accountType === 'PROPERTY_OWNER', 'Seller accountType is PROPERTY_OWNER', `Received: ${sellerAuth.user.accountType}`);

    // Agent
    const agentAuth = await getAuthToken('9100001004', 'Test Agent', 'AGENT', '10.0.0.104');
    assert(agentAuth.user.platformRole === 'USER', 'Agent platformRole is USER', `Received: ${agentAuth.user.platformRole}`);
    assert(agentAuth.user.accountType === 'AGENT', 'Agent accountType is AGENT', `Received: ${agentAuth.user.accountType}`);

    // Broker
    const brokerAuth = await getAuthToken('9100001005', 'Test Broker', 'BROKER', '10.0.0.105');
    assert(brokerAuth.user.platformRole === 'USER', 'Broker platformRole is USER', `Received: ${brokerAuth.user.platformRole}`);
    assert(brokerAuth.user.accountType === 'BROKER', 'Broker accountType is BROKER', `Received: ${brokerAuth.user.accountType}`);

    // Developer
    const developerAuth = await getAuthToken('9100001006', 'Test Developer', 'DEVELOPER', '10.0.0.106');
    assert(developerAuth.user.platformRole === 'USER', 'Developer platformRole is USER', `Received: ${developerAuth.user.platformRole}`);
    assert(developerAuth.user.accountType === 'DEVELOPER', 'Developer accountType is DEVELOPER', `Received: ${developerAuth.user.accountType}`);

    // Admin & Moderator provisioning by Super Admin
    console.log('\n2. Provisioning Administrative Roles (Admin & Moderator)...');
    const adminUserSetup = await getAuthToken('9100001007', 'Staff Admin', 'BUYER', '10.0.0.107');
    await request(`${API_BASE}/admin/users/${adminUserSetup.user.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
      body: JSON.stringify({ role: 'ADMIN', reason: 'Provision staff admin for RBAC testing' }),
    }, '10.0.0.100');
    const adminAuth = await getAuthToken('9100001007', 'Staff Admin', null, '10.0.0.107');
    assert(adminAuth.user.platformRole === 'ADMIN', 'Admin platformRole is ADMIN', `Received: ${adminAuth.user.platformRole}`);
    assert(adminAuth.user.accountType === null, 'Admin accountType is strictly null', `Received: ${adminAuth.user.accountType}`);

    const modUserSetup = await getAuthToken('9100001008', 'Staff Moderator', 'BUYER', '10.0.0.108');
    await request(`${API_BASE}/admin/users/${modUserSetup.user.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
      body: JSON.stringify({ role: 'MODERATOR', reason: 'Provision moderator for RBAC testing' }),
    }, '10.0.0.100');
    const moderatorAuth = await getAuthToken('9100001008', 'Staff Moderator', null, '10.0.0.108');
    assert(moderatorAuth.user.platformRole === 'MODERATOR', 'Moderator platformRole is MODERATOR', `Received: ${moderatorAuth.user.platformRole}`);
    assert(moderatorAuth.user.accountType === null, 'Moderator accountType is strictly null', `Received: ${moderatorAuth.user.accountType}`);

    console.log('\n3. Testing GET /api/v1/auth/me Authoritative Identity Output...');
    const meRes = await request(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
    }, '10.0.0.100');
    assert(meRes.status === 200, 'GET /auth/me returns 200 OK', `Status: ${meRes.status}`);
    assert(meRes.data?.user?.platformRole === 'SUPER_ADMIN', 'GET /auth/me user.platformRole === SUPER_ADMIN', `Received: ${meRes.data?.user?.platformRole}`);
    assert(meRes.data?.user?.accountType === null, 'GET /auth/me user.accountType === null', `Received: ${meRes.data?.user?.accountType}`);

    console.log('\n4. Testing Public Registration Privilege Escalation Guard (Section 11)...');
    const hackerRes = await request(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      body: JSON.stringify({
        mobile: '9199999999',
        name: 'Hacker User',
        role: 'SUPER_ADMIN',
      }),
    }, '10.0.0.199');
    assert(hackerRes.status === 400 || hackerRes.status === 429, 'Public registration rejects SUPER_ADMIN request', `Status: ${hackerRes.status}`);

    const hackerAdminRes = await request(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      body: JSON.stringify({
        mobile: '9199999998',
        name: 'Hacker Admin',
        role: 'ADMIN',
      }),
    }, '10.0.0.198');
    assert(hackerAdminRes.status === 400 || hackerAdminRes.status === 429, 'Public registration rejects ADMIN request', `Status: ${hackerAdminRes.status}`);

    console.log('\n5. Testing Negative Access to Admin Endpoints (Section 6 & 13)...');
    // Unauthenticated
    const unauthRes = await request(`${API_BASE}/admin/users`, {}, '10.0.0.150');
    assert(unauthRes.status === 401, 'Unauthenticated user blocked from GET /admin/users (401 Unauthorized)', `Status: ${unauthRes.status}`);

    // Agent -> /admin/users (403)
    const agentAdminRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${agentAuth.token}` },
    }, '10.0.0.104');
    assert(agentAdminRes.status === 403, 'Agent blocked from GET /admin/users (403 Forbidden)', `Status: ${agentAdminRes.status}`);

    // Buyer -> /admin/users (403)
    const buyerAdminRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${buyerAuth.token}` },
    }, '10.0.0.101');
    assert(buyerAdminRes.status === 403, 'Buyer blocked from GET /admin/users (403 Forbidden)', `Status: ${buyerAdminRes.status}`);

    // Tenant -> /admin/users (403)
    const tenantAdminRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${tenantAuth.token}` },
    }, '10.0.0.102');
    assert(tenantAdminRes.status === 403, 'Tenant blocked from GET /admin/users (403 Forbidden)', `Status: ${tenantAdminRes.status}`);

    // Broker -> /admin/users (403)
    const brokerAdminRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${brokerAuth.token}` },
    }, '10.0.0.105');
    assert(brokerAdminRes.status === 403, 'Broker blocked from GET /admin/users (403 Forbidden)', `Status: ${brokerAdminRes.status}`);

    // Developer -> /admin/users (403)
    const devAdminRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${developerAuth.token}` },
    }, '10.0.0.106');
    assert(devAdminRes.status === 403, 'Developer blocked from GET /admin/users (403 Forbidden)', `Status: ${devAdminRes.status}`);

    // Seller -> /admin/users (403)
    const sellerAdminRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${sellerAuth.token}` },
    }, '10.0.0.103');
    assert(sellerAdminRes.status === 403, 'Seller blocked from GET /admin/users (403 Forbidden)', `Status: ${sellerAdminRes.status}`);

    console.log('\n6. Testing Super Admin Regression Across All Administrative Modules (Section 14)...');
    
    // Dashboard stats
    const statsRes = await request(`${API_BASE}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
    }, '10.0.0.100');
    assert(statsRes.status === 200, 'Super Admin loads Dashboard stats (GET /admin/dashboard-stats)', `Status: ${statsRes.status}`);

    // Users
    const usersRes = await request(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
    }, '10.0.0.100');
    assert(usersRes.status === 200, 'Super Admin loads Users (GET /admin/users)', `Status: ${usersRes.status}`);

    // Properties
    const propsRes = await request(`${API_BASE}/admin/properties`, {
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
    }, '10.0.0.100');
    assert(propsRes.status === 200, 'Super Admin loads Properties (GET /admin/properties)', `Status: ${propsRes.status}`);

    // CRM / Leads
    const leadsRes = await request(`${API_BASE}/leads`, {
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
    }, '10.0.0.100');
    assert(leadsRes.status === 200, 'Super Admin loads CRM Leads (GET /leads)', `Status: ${leadsRes.status}`);

    // Payments
    const paymentsRes = await request(`${API_BASE}/payments/admin/all`, {
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
    }, '10.0.0.100');
    assert(paymentsRes.status === 200, 'Super Admin loads Payments (GET /payments/admin/all)', `Status: ${paymentsRes.status}`);

    // Audit Logs
    const auditRes = await request(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${superAdminAuth.token}` },
    }, '10.0.0.100');
    assert(auditRes.status === 200, 'Super Admin loads Audit logs (GET /admin/audit-logs)', `Status: ${auditRes.status}`);

    console.log('\n7. Testing Property Creation Authorization Matrix (Section 7)...');
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

    // Negative: Buyer -> 403
    const buyerCreate = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerAuth.token}` },
      body: JSON.stringify(samplePropertyPayload),
    }, '10.0.0.101');
    assert(buyerCreate.status === 403, 'Buyer blocked from POST /properties (403 Forbidden)', `Status: ${buyerCreate.status}`);

    // Negative: Tenant -> 403
    const tenantCreate = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantAuth.token}` },
      body: JSON.stringify(samplePropertyPayload),
    }, '10.0.0.102');
    assert(tenantCreate.status === 403, 'Tenant blocked from POST /properties (403 Forbidden)', `Status: ${tenantCreate.status}`);

    // Positive: Seller -> 201/200
    const sellerCreate = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerAuth.token}` },
      body: JSON.stringify({ ...samplePropertyPayload, title: { en: 'Seller Test Property' } }),
    }, '10.0.0.103');
    assert(sellerCreate.status === 201 || sellerCreate.status === 200, 'Seller allowed to POST /properties (201 Created)', `Status: ${sellerCreate.status}`);

    // Positive: Agent -> 201/200
    const agentCreate = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentAuth.token}` },
      body: JSON.stringify({ ...samplePropertyPayload, title: { en: 'Agent Test Property' } }),
    }, '10.0.0.104');
    assert(agentCreate.status === 201 || agentCreate.status === 200, 'Agent allowed to POST /properties (201 Created)', `Status: ${agentCreate.status}`);

    // Positive: Developer -> 201/200
    const devCreate = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${developerAuth.token}` },
      body: JSON.stringify({ ...samplePropertyPayload, title: { en: 'Dev Test Property' } }),
    }, '10.0.0.106');
    assert(devCreate.status === 201 || devCreate.status === 200, 'Developer allowed to POST /properties (201 Created)', `Status: ${devCreate.status}`);

    // Positive: Broker -> 201/200
    const brokerCreate = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${brokerAuth.token}` },
      body: JSON.stringify({ ...samplePropertyPayload, title: { en: 'Broker Test Property' } }),
    }, '10.0.0.105');
    assert(brokerCreate.status === 201 || brokerCreate.status === 200, 'Broker allowed to POST /properties (201 Created)', `Status: ${brokerCreate.status}`);

    console.log('\n====================================================');
    console.log('AUTHORITATIVE ROLE MODEL VALIDATION MATRIX (Section 15)');
    console.log('====================================================');
    console.log(`SUPER_ADMIN:\nplatformRole=${superAdminAuth.user.platformRole}\naccountType=${superAdminAuth.user.accountType}\n`);
    console.log(`ADMIN:\nplatformRole=${adminAuth.user.platformRole}\naccountType=${adminAuth.user.accountType}\n`);
    console.log(`MODERATOR:\nplatformRole=${moderatorAuth.user.platformRole}\naccountType=${moderatorAuth.user.accountType}\n`);
    console.log(`DEVELOPER:\nplatformRole=${developerAuth.user.platformRole}\naccountType=${developerAuth.user.accountType}\n`);
    console.log(`AGENT:\nplatformRole=${agentAuth.user.platformRole}\naccountType=${agentAuth.user.accountType}\n`);
    console.log(`BROKER:\nplatformRole=${brokerAuth.user.platformRole}\naccountType=${brokerAuth.user.accountType}\n`);
    console.log(`PROPERTY_OWNER:\nplatformRole=${sellerAuth.user.platformRole}\naccountType=${sellerAuth.user.accountType}\n`);
    console.log(`BUYER:\nplatformRole=${buyerAuth.user.platformRole}\naccountType=${buyerAuth.user.accountType}\n`);
    console.log(`TENANT:\nplatformRole=${tenantAuth.user.platformRole}\naccountType=${tenantAuth.user.accountType}\n`);

    console.log('====================================================');
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
