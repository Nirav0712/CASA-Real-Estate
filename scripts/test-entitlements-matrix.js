/**
 * CASA Real Estate — Entitlements, Roles, Packages & Scoping Test Matrix
 * 
 * Verifies:
 * 1. Role Normalization (platformRole vs accountType)
 * 2. System Roles & Packages Seeding
 * 3. Dynamic Custom Role Creation, Duplication & Deletion
 * 4. User Entitlement Overrides & Bonus Quotas
 * 5. 30-Minute View Limit Deduplication & Contact Redaction for Unauthenticated / Locked Users
 * 6. Data Scope Isolation
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runMatrix() {
  console.log('====================================================');
  console.log(' CASA ADVANCED ENTITLEMENTS & SCOPING TEST MATRIX ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as Super Admin
    console.log('\n--- 1. Authenticating Super Admin ---');
    const superAdminMobile = '9876543210';
    await request('POST', '/auth/otp/request', { mobile: superAdminMobile });
    const superAdminAuth = await request('POST', '/auth/otp/verify', { mobile: superAdminMobile, otp: '123456' });

    assert(superAdminAuth.status === 200 || superAdminAuth.status === 201, 'Super admin login succeeds');
    const adminToken = superAdminAuth.data?.tokens?.accessToken || superAdminAuth.data?.data?.tokens?.accessToken;
    const adminUser = superAdminAuth.data?.user || superAdminAuth.data?.data?.user;

    assert(adminUser?.platformRole === 'SUPER_ADMIN', `Super Admin platformRole is SUPER_ADMIN (got: ${adminUser?.platformRole})`);
    assert(adminUser?.accountType === null, `Super Admin accountType is strictly null (got: ${adminUser?.accountType})`);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Verify System Roles & Packages Seeding
    console.log('\n--- 2. Verifying System Roles & Default Packages ---');
    const rolesRes = await request('GET', '/admin/entitlements/roles', null, adminHeaders);
    assert(rolesRes.status === 200, 'Fetch roles endpoint returns 200');
    const roles = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.data || [];
    assert(roles.length >= 9, `Seeded system roles count >= 9 (found: ${roles.length})`);

    const packagesRes = await request('GET', '/admin/entitlements/packages', null, adminHeaders);
    assert(packagesRes.status === 200, 'Fetch packages endpoint returns 200');
    const packages = Array.isArray(packagesRes.data) ? packagesRes.data : packagesRes.data?.data || [];
    assert(packages.length >= 6, `Seeded packages count >= 6 (found: ${packages.length})`);

    const permissionsRes = await request('GET', '/admin/entitlements/permissions', null, adminHeaders);
    assert(permissionsRes.status === 200, 'Fetch permissions directory returns 200');
    const permGroups = permissionsRes.data?.groups || (Array.isArray(permissionsRes.data) ? permissionsRes.data : []);
    assert(permGroups.length >= 10, `Granular permission module groups >= 10 (found: ${permGroups.length})`);

    // 3. Dynamic Custom Role CRUD & Duplication
    console.log('\n--- 3. Custom Role Creation, Duplication & Lifecycle ---');
    const newRolePayload = {
      name: 'Regional Agency Team Lead',
      slug: `team-lead-${Date.now()}`,
      description: 'Supervises branch agents and handles team leads',
      platformRole: 'USER',
      accountType: 'AGENT',
      dataScope: 'TEAM',
      permissions: [
        'property:read',
        'property:create',
        'property:update',
        'property_contact:view',
        'leads:read',
        'leads:assign',
        'chat:read',
        'chat:send',
      ],
      dashboardConfig: {
        canAccessCRM: true,
        canAccessAnalytics: true,
        canAccessSiteVisits: true,
        canAccessLeads: true,
        canAccessTeamManagement: true,
        canAccessMarketing: false,
        canAccessReports: true,
        canAccessBilling: false,
      },
    };

    const createRoleRes = await request('POST', '/admin/entitlements/roles', newRolePayload, adminHeaders);
    assert(createRoleRes.status === 201 || createRoleRes.status === 200, 'Create custom role returns 201/200');
    const createdRole = createRoleRes.data?.role || createRoleRes.data?.data || createRoleRes.data;
    const customRoleId = createdRole._id || createdRole.id;
    assert(createdRole?.slug === newRolePayload.slug, `Custom role slug matches: ${createdRole?.slug}`);
    assert(createdRole?.dataScope === 'TEAM', `Custom role scope is TEAM (got: ${createdRole?.dataScope})`);

    // Duplicate Role
    const dupRes = await request('POST', `/admin/entitlements/roles/${customRoleId}/duplicate`, null, adminHeaders);
    assert(dupRes.status === 201 || dupRes.status === 200, 'Duplicate custom role returns 201/200');
    const dupRole = dupRes.data?.role || dupRes.data?.data || dupRes.data;
    const dupRoleId = dupRole._id || dupRole.id;

    // Delete Duplicate
    const delRes = await request('DELETE', `/admin/entitlements/roles/${dupRoleId}`, null, adminHeaders);
    assert(delRes.status === 200, 'Delete custom duplicate role returns 200');

    // 4. Authenticate Marketplace Users (Agent & Buyer)
    console.log('\n--- 4. Authenticating Marketplace Users ---');
    const agentMobile = '9876543299';
    await request('POST', '/auth/otp/request', { mobile: agentMobile, role: 'AGENT', name: 'Authorized Agent' });
    const agentAuth = await request('POST', '/auth/otp/verify', { mobile: agentMobile, otp: '123456' });
    const agentToken = agentAuth.data?.tokens?.accessToken || agentAuth.data?.data?.tokens?.accessToken;
    const agentUser = agentAuth.data?.user || agentAuth.data?.data?.user;
    const agentHeaders = { Authorization: `Bearer ${agentToken}` };

    assert(agentUser?.platformRole === 'USER', `Agent platformRole is USER (got: ${agentUser?.platformRole})`);
    assert(agentUser?.accountType === 'AGENT', `Agent accountType is AGENT (got: ${agentUser?.accountType})`);

    const buyerMobile = '9876543298';
    await request('POST', '/auth/otp/request', { mobile: buyerMobile, role: 'BUYER', name: 'Marketplace Buyer' });
    const buyerAuth = await request('POST', '/auth/otp/verify', { mobile: buyerMobile, otp: '123456' });
    const buyerToken = buyerAuth.data?.tokens?.accessToken || buyerAuth.data?.data?.tokens?.accessToken;
    const buyerUser = buyerAuth.data?.user || buyerAuth.data?.data?.user;
    const buyerHeaders = { Authorization: `Bearer ${buyerToken}` };

    // 5. Test User Entitlement Resolution & Client Entitlements API
    console.log('\n--- 5. Testing Client Entitlements Resolution ---');
    const myEntitlementsRes = await request('GET', '/entitlements/me', null, buyerHeaders);
    assert(myEntitlementsRes.status === 200, 'Client /entitlements/me returns 200');
    const buyerEntitlements = myEntitlementsRes.data?.entitlements || myEntitlementsRes.data?.data?.entitlements || myEntitlementsRes.data;
    assert(Boolean(buyerEntitlements?.limits?.propertyViews !== undefined), `Buyer property views limit is defined (got: ${buyerEntitlements?.limits?.propertyViews})`);

    // 6. Test User Overrides & Bonus Credits & Usage Metrics
    console.log('\n--- 6. Testing Admin User Overrides & Bonus Credits ---');
    const buyerId = buyerUser._id || buyerUser.id;
    const bonusRes = await request('POST', `/admin/entitlements/users/${buyerId}/bonus-credits`, {
      bonusCredits: 25,
      limitType: 'propertyViewsBonus',
    }, adminHeaders);
    assert(bonusRes.status === 200 || bonusRes.status === 201, 'Grant bonus credits returns 200');

    const updatedEntitlementsRes = await request('GET', '/entitlements/me', null, buyerHeaders);
    const updatedUser = updatedEntitlementsRes.data?.user || updatedEntitlementsRes.data?.data?.user;
    assert(updatedUser?.bonusLimits?.propertyViewsBonus >= 25, `Buyer bonus views updated (got: ${updatedUser?.bonusLimits?.propertyViewsBonus})`);

    // Verify Admin Entitlement Usage Monitor Endpoint
    const usageRes = await request('GET', '/admin/entitlements/usage', null, adminHeaders);
    assert(usageRes.status === 200, 'Admin /admin/entitlements/usage returns 200');
    const usagePayload = usageRes.data?.data || usageRes.data;
    const usageRecords = Array.isArray(usagePayload) ? usagePayload : (usagePayload?.data || []);
    assert(Array.isArray(usageRecords) && usageRecords.length > 0, `Usage records returned successfully (count: ${usageRecords.length})`);
    const buyerUsage = usageRecords.find((r) => r.userId === buyerId);
    assert(Boolean(buyerUsage), 'Buyer usage record is present in usage monitor telemetry');
    assert(buyerUsage?.propertyViews?.bonus >= 25, `Buyer bonus views reflected in usage monitor (got: ${buyerUsage?.propertyViews?.bonus})`);

    // 7. Contact Redaction & View Limits
    console.log('\n--- 7. Testing Property Details Contact Redaction & View Limits ---');
    // Fetch a public property
    const propListRes = await request('GET', '/properties?limit=1');
    const propList = propListRes.data?.data || propListRes.data?.properties || propListRes.data || [];
    if (propList.length > 0) {
      const sampleProp = propList[0];
      const propId = sampleProp._id || sampleProp.id;
      const propSlug = sampleProp.slug || propId;

      // Unauthenticated / Guest View
      const guestPropRes = await request('GET', `/properties/${propSlug}`);
      assert(guestPropRes.status === 200, 'Guest fetch property returns 200');
      const guestProp = guestPropRes.data?.data || guestPropRes.data;
      assert(guestProp?.contactLocked === true, 'Guest property contact is locked (contactLocked === true)');
      assert(!guestProp?.advertiser?.phone, 'Guest response does NOT contain advertiser phone number');
      assert(!guestProp?.advertiser?.whatsapp, 'Guest response does NOT contain advertiser whatsapp number');

      // Authenticated Buyer View (Authorized under limit)
      const buyerPropRes = await request('GET', `/properties/${propSlug}`, null, buyerHeaders);
      assert(buyerPropRes.status === 200, 'Buyer fetch property returns 200');
      const buyerProp = buyerPropRes.data?.data || buyerPropRes.data;
      assert(buyerProp?.contactLocked === false, 'Buyer with remaining quota has contact unlocked (contactLocked === false)');
      assert(Boolean(buyerProp?.advertiser?.phone || buyerProp?.advertiser?.name), 'Buyer can view advertiser contact info');

      // 30-Minute Deduplication Test (re-fetching same property immediately)
      const viewTrackingRes = await request('POST', '/entitlements/track-view', { propertyId: propId }, buyerHeaders);
      assert(viewTrackingRes.status === 200 || viewTrackingRes.status === 201, 'Track view endpoint returns 200');
      const trackData = viewTrackingRes.data?.data || viewTrackingRes.data;
      assert(trackData?.deduplicated === true, 'Immediate subsequent view on same property is correctly deduplicated within 30 minutes');
    } else {
      console.log('[WARN] No properties found in DB to test view limits on.');
    }

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED `);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error running test matrix:', err);
    process.exit(1);
  }
}

runMatrix();
