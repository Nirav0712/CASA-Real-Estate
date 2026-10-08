/**
 * CASA Real Estate — Dynamic Custom Role Assignment Live End-to-End Integration Test
 * 
 * Verifies:
 * 1. Super Admin authentication
 * 2. Dynamic custom role creation ("QA Test Agent")
 * 3. Dynamic role appears in assignable roles list (/admin/entitlements/roles)
 * 4. Custom role assignment to user via Governance API (/admin/users/:id/role)
 * 5. MongoDB persistence verification via User Governance Profile fetch (/admin/users/:id)
 * 6. Live entitlement resolution & permission enforcement (/entitlements/me)
 * 7. Verification of data scope (OWN) and dashboardConfig (crm, leads, properties)
 * 8. Unauthorized privilege escalation rejection (non-super-admin cannot assign Super Admin)
 * 9. Reassignment to system role clears customRoleId cleanly
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

async function runLiveTest() {
  console.log('================================================================');
  console.log(' CASA DYNAMIC CUSTOM ROLE ASSIGNMENT LIVE INTEGRATION TEST ');
  console.log('================================================================\n');

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
    // 1. Authenticate Super Admin
    console.log('--- 1. Authenticating Super Administrator ---');
    const superAdminMobile = '9876543210';
    await request('POST', '/auth/otp/request', { mobile: superAdminMobile });
    const superAdminAuth = await request('POST', '/auth/otp/verify', { mobile: superAdminMobile, otp: '123456' });

    assert(superAdminAuth.status === 200 || superAdminAuth.status === 201, 'Super Admin login successful');
    const adminToken = superAdminAuth.data?.tokens?.accessToken || superAdminAuth.data?.data?.tokens?.accessToken;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Create Dynamic Custom Role "QA Test Agent"
    console.log('\n--- 2. Creating Dynamic Custom Role "QA Test Agent" ---');
    const roleSlug = `qa-test-agent-${Date.now()}`;
    const customRolePayload = {
      name: 'QA Test Agent',
      slug: roleSlug,
      description: 'QA specialized broker role with scoped CRM and lead permissions',
      platformRole: 'USER',
      accountType: 'AGENT',
      dataScope: 'OWN',
      permissions: [
        'property:view',
        'property:create',
        'property:update',
        'leads:view',
        'leads:create',
        'crm:view',
        'crm:create',
        'crm:update',
        'chat:view',
        'chat:send',
      ],
      dashboardConfig: {
        overview: true,
        properties: true,
        leads: true,
        enquiries: true,
        chat: true,
        crm: true,
        siteVisits: true,
        analytics: true,
        reviews: true,
        promotions: false,
        profile: true,
      },
    };

    const createRoleRes = await request('POST', '/admin/entitlements/roles', customRolePayload, adminHeaders);
    assert(createRoleRes.status === 201 || createRoleRes.status === 200, 'Custom role created successfully (201/200)');
    const createdRole = createRoleRes.data?.role || createRoleRes.data?.data || createRoleRes.data;
    const customRoleId = createdRole?._id || createdRole?.id;

    assert(Boolean(customRoleId), `Custom role ID generated: ${customRoleId}`);
    assert(createdRole?.name === 'QA Test Agent', `Role name is "QA Test Agent" (got: ${createdRole?.name})`);
    assert(createdRole?.dataScope === 'OWN', `Role dataScope is "OWN" (got: ${createdRole?.dataScope})`);

    // 3. Verify Custom Role Appears in Assignable Roles List
    console.log('\n--- 3. Verifying Custom Role appears in /admin/entitlements/roles ---');
    const allRolesRes = await request('GET', '/admin/entitlements/roles', null, adminHeaders);
    assert(allRolesRes.status === 200, 'Roles listing API returns 200');
    const allRoles = Array.isArray(allRolesRes.data) ? allRolesRes.data : allRolesRes.data?.data || [];
    const foundInList = allRoles.find((r) => (r.id || r._id) === customRoleId || r.slug === roleSlug);
    assert(Boolean(foundInList), `Dynamic custom role "${foundInList?.name}" is present in assignable roles list`);
    assert(foundInList?.isSystemRole === false, 'isSystemRole is false for custom role');

    // 4. Authenticate Test Target User (Agent 1)
    console.log('\n--- 4. Authenticating Target Agent User ---');
    const targetMobile = '9876543255';
    await request('POST', '/auth/otp/request', { mobile: targetMobile, role: 'BUYER', name: 'Agent 1 QA Target' });
    const targetAuth = await request('POST', '/auth/otp/verify', { mobile: targetMobile, otp: '123456' });
    const targetToken = targetAuth.data?.tokens?.accessToken || targetAuth.data?.data?.tokens?.accessToken;
    const targetUser = targetAuth.data?.user || targetAuth.data?.data?.user;
    const targetUserId = targetUser?._id || targetUser?.id;
    const targetHeaders = { Authorization: `Bearer ${targetToken}` };

    assert(Boolean(targetUserId), `Target user authenticated with ID: ${targetUserId}`);

    // 5. Assign Custom Role to Target User via Admin Governance API
    console.log('\n--- 5. Assigning Custom Role to User via PATCH /admin/users/:id/role ---');
    const assignRoleRes = await request(
      'PATCH',
      `/admin/users/${targetUserId}/role`,
      {
        roleId: customRoleId,
        reason: 'QA dynamic role verification test assignment',
      },
      adminHeaders,
    );

    assert(assignRoleRes.status === 200, 'Role update endpoint returns 200');
    const assignData = assignRoleRes.data?.user || assignRoleRes.data;
    assert(assignData?.customRoleId === customRoleId, `Updated user customRoleId matches ${customRoleId}`);
    assert(assignData?.platformRole === 'USER', `Updated user platformRole is USER (got: ${assignData?.platformRole})`);
    assert(assignData?.accountType === 'AGENT', `Updated user accountType is AGENT (got: ${assignData?.accountType})`);

    // 6. Fetch User Governance Profile from Backend and Verify Persistence
    console.log('\n--- 6. Re-fetching User via GET /admin/users/:id to Verify Persistence ---');
    const fetchUserRes = await request('GET', `/admin/users/${targetUserId}`, null, adminHeaders);
    assert(fetchUserRes.status === 200, 'Fetch user profile returns 200');
    const fetchedUser = fetchUserRes.data?.data?.user || fetchUserRes.data?.data || fetchUserRes.data?.user || fetchUserRes.data;
    assert(fetchedUser?.customRoleId === customRoleId, `Persisted customRoleId in MongoDB matches ${customRoleId}`);
    assert(fetchedUser?.customRole?.name === 'QA Test Agent', `Persisted customRole.name is "QA Test Agent" (got: ${fetchedUser?.customRole?.name})`);
    assert(fetchedUser?.platformRole === 'USER', `Persisted platformRole is USER (got: ${fetchedUser?.platformRole})`);
    assert(fetchedUser?.accountType === 'AGENT', `Persisted accountType is AGENT (got: ${fetchedUser?.accountType})`);

    // 7. Verify Real-time Permission Enforcement & Dashboard Config via /entitlements/me
    console.log('\n--- 7. Verifying Real-time Entitlement Resolution (/entitlements/me) ---');
    const entitlementsRes = await request('GET', '/entitlements/me', null, targetHeaders);
    assert(entitlementsRes.status === 200, 'Client /entitlements/me returns 200');
    const entitlements = entitlementsRes.data?.entitlements || entitlementsRes.data?.data?.entitlements || entitlementsRes.data;

    assert(entitlements?.role?.id === customRoleId, `Entitlements resolved role ID matches custom role ID`);
    assert(entitlements?.role?.name === 'QA Test Agent', `Entitlements resolved role name is "QA Test Agent"`);
    assert(entitlements?.dataScope === 'OWN', `Entitlements dataScope is "OWN"`);
    assert(entitlements?.dashboardConfig?.crm === true, `Dashboard config has crm: true`);
    assert(entitlements?.dashboardConfig?.leads === true, `Dashboard config has leads: true`);
    assert(entitlements?.dashboardConfig?.properties === true, `Dashboard config has properties: true`);
    assert(entitlements?.dashboardConfig?.promotions === false, `Dashboard config has promotions: false`);
    assert(entitlements?.permissions?.includes('crm:view'), 'Entitlements includes "crm:view" permission');
    assert(entitlements?.permissions?.includes('leads:view'), 'Entitlements includes "leads:view" permission');

    // 8. Verify Privilege Escalation Protection
    console.log('\n--- 8. Verifying Privilege Escalation Protection ---');
    // Normal admin actor
    const adminOfficerMobile = '9876543211';
    await request('POST', '/auth/otp/request', { mobile: adminOfficerMobile, role: 'ADMIN', name: 'Standard Admin Officer' });
    const adminOfficerAuth = await request('POST', '/auth/otp/verify', { mobile: adminOfficerMobile, otp: '123456' });
    const adminOfficerToken = adminOfficerAuth.data?.tokens?.accessToken || adminOfficerAuth.data?.data?.tokens?.accessToken;
    const adminOfficerHeaders = { Authorization: `Bearer ${adminOfficerToken}` };

    const unauthorizedEscalationRes = await request(
      'PATCH',
      `/admin/users/${targetUserId}/role`,
      { role: 'SUPER_ADMIN' },
      adminOfficerHeaders,
    );
    assert(
      unauthorizedEscalationRes.status === 403,
      `Non-super-admin cannot promote user to SUPER_ADMIN (got status: ${unauthorizedEscalationRes.status})`,
    );

    // 9. Reassign back to System Role and Verify Cleanup
    console.log('\n--- 9. Reassigning System Role and Verifying Clean customRoleId Removal ---');
    const systemRoleRes = await request(
      'PATCH',
      `/admin/users/${targetUserId}/role`,
      { role: 'AGENT', reason: 'Revert to standard agent role' },
      adminHeaders,
    );
    assert(systemRoleRes.status === 200, 'Reassignment to standard system role returns 200');
    const systemUserData = systemRoleRes.data?.user || systemRoleRes.data;
    assert(systemUserData?.customRoleId === null, 'customRoleId is cleaned up and set to null');
    assert(systemUserData?.accountType === 'AGENT', 'accountType remains AGENT');

    // Clean up created custom role
    await request('DELETE', `/admin/entitlements/roles/${customRoleId}`, null, adminHeaders);

    console.log('\n================================================================');
    console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error running live integration test:', err);
    process.exit(1);
  }
}

runLiveTest();
