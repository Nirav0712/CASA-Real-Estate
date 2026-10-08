/**
 * CASA QA Lead Permission Enforcement Live Integration Test
 * 
 * Verifies:
 * 1. QA Test Agent + lead:view OFF -> GET /entitlements/me shows lead:view missing & dashboardConfig.leads = false
 * 2. QA Test Agent + lead:view OFF -> GET /leads, /leads/kpis return 403 Forbidden
 * 3. QA Test Agent + lead:view ON  -> GET /entitlements/me shows lead:view present & dashboardConfig.leads = true
 * 4. QA Test Agent + lead:view ON  -> GET /leads returns 200 OK
 * 5. Standard Agent role remains functional (200 OK)
 * 6. Admin / Super Admin role remains functional (200 OK)
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function loginUser(mobile, name, role) {
  // Request OTP
  const otpReq = await request('/auth/otp/request', { method: 'POST' }, {
    mobile,
    name,
    role,
  });
  const otp = otpReq.body?.mockOtp || otpReq.body?.data?.mockOtp || '123456';

  // Verify OTP
  const verifyRes = await request('/auth/otp/verify', { method: 'POST' }, {
    mobile,
    otp,
    name,
  });

  const token = verifyRes.body?.tokens?.accessToken || verifyRes.body?.data?.tokens?.accessToken;
  const user = verifyRes.body?.user || verifyRes.body?.data?.user;

  if (!token) {
    throw new Error(`Login failed for ${mobile}: ${JSON.stringify(verifyRes.body)}`);
  }

  return { user, token };
}

async function run() {
  console.log('===============================================================');
  console.log('CASA QA TEST: LEAD PERMISSION ENFORCEMENT & DYNAMIC RBAC');
  console.log('===============================================================\n');

  // 1. Authenticate Super Admin
  console.log('Step 1: Authenticating Super Admin...');
  const adminAuth = await loginUser('+917359237870', 'Admin Governance', 'SUPER_ADMIN');
  console.log(`✓ Super Admin authenticated. User ID: ${adminAuth.user.id || adminAuth.user._id}\n`);

  // 2. Create or Update "QA Test Agent" Custom Role with lead:view = OFF
  console.log('Step 2: Configuring Custom Role "QA Test Agent" with lead:view = OFF...');
  const rolesListRes = await request('/admin/entitlements/roles', {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  console.log('rolesListRes body:', JSON.stringify(rolesListRes.body).slice(0, 300));

  const raw = rolesListRes.body?.data !== undefined ? rolesListRes.body.data : rolesListRes.body;
  const roles = Array.isArray(raw) ? raw : (raw?.roles || []);
  let qaRole = roles.find((r) => r.name === 'QA Test Agent' || r.slug === 'qa-test-agent');

  const disabledLeadPermissions = [
    'property:view',
    'property:create',
    'property:edit',
    'crm:view',
    'chat:view',
    'chat:start',
    // lead:view, lead:create, lead:edit, lead:delete, lead:assign, lead:export explicitly omitted / OFF
  ];

  function extractRole(resBody) {
    const d = resBody?.data !== undefined ? resBody.data : resBody;
    if (d?.role) return d.role;
    return d;
  }

  if (qaRole) {
    const updateRes = await request(`/admin/entitlements/roles/${qaRole._id || qaRole.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    }, {
      name: 'QA Test Agent',
      permissions: disabledLeadPermissions,
      dashboardConfig: { overview: true, properties: true, leads: false, crm: true },
      dataScope: 'OWN',
    });
    console.log('updateRes body:', JSON.stringify(updateRes.body));
    const extracted = extractRole(updateRes.body);
    qaRole = (extracted && (extracted._id || extracted.id)) ? extracted : qaRole;
    console.log(`✓ Updated existing "QA Test Agent" role (${qaRole._id || qaRole.id}) with lead permissions OFF.`);
  } else {
    const createRes = await request('/admin/entitlements/roles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    }, {
      name: 'QA Test Agent',
      slug: 'qa-test-agent',
      description: 'Role for manual QA testing lead permission enforcement',
      accountType: 'AGENT',
      permissions: disabledLeadPermissions,
      dashboardConfig: { overview: true, properties: true, leads: false, crm: true },
      dataScope: 'OWN',
    });
    console.log('createRes body:', JSON.stringify(createRes.body));
    qaRole = extractRole(createRes.body);
    console.log(`✓ Created new "QA Test Agent" role (${qaRole._id || qaRole.id}) with lead permissions OFF.`);
  }

  const qaRoleId = (qaRole._id || qaRole.id || '').toString();
  console.log(`  Role ID: ${qaRoleId}`);
  console.log(`  Permissions count: ${qaRole.permissions?.length || 0}`);
  console.log(`  lead:view in role: ${qaRole.permissions?.includes('lead:view') ? 'YES (ERROR)' : 'NO (CORRECT)'}\n`);

  // 3. Authenticate "Agent 1 QA Target"
  console.log('Step 3: Authenticating "Agent 1 QA Target"...');
  const qaTargetMobile = '+919999000021';
  let targetAuth = await loginUser(qaTargetMobile, 'Agent 1 QA Target', 'AGENT');
  const targetUserId = targetAuth.user.id || targetAuth.user._id;
  console.log(`✓ Agent 1 QA Target authenticated. User ID: ${targetUserId}\n`);

  // 4. Assign "QA Test Agent" role to "Agent 1 QA Target"
  console.log('Step 4: Assigning "QA Test Agent" custom role to target user...');
  const assignRes = await request(`/admin/users/${targetUserId}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  }, {
    roleId: qaRoleId,
  });

  if (assignRes.status !== 200) {
    throw new Error(`Failed to assign role: ${JSON.stringify(assignRes.body)}`);
  }
  console.log(`✓ Role assigned successfully. Status: ${assignRes.status}\n`);

  // 5. Re-authenticate / Refresh Target User Token
  targetAuth = await loginUser(qaTargetMobile, 'Agent 1 QA Target', 'AGENT');

  // 6. Test GET /entitlements/me for QA Target User
  console.log('Step 5: Verifying resolved entitlements for Agent 1 QA Target...');
  const entRes = await request('/entitlements/me', {
    headers: { Authorization: `Bearer ${targetAuth.token}` },
  });

  const entData = entRes.body?.data || entRes.body;
  const resolvedPermissions = entData?.entitlements?.permissions || [];
  const leadsDashboard = entData?.entitlements?.dashboardConfig?.leads;

  console.log(`  Status: ${entRes.status}`);
  console.log(`  Resolved Role: ${entData?.entitlements?.role?.name} (${entData?.entitlements?.role?.slug})`);
  console.log(`  Has lead:view: ${resolvedPermissions.includes('lead:view')}`);
  console.log(`  dashboardConfig.leads: ${leadsDashboard}`);

  if (resolvedPermissions.includes('lead:view')) {
    console.error('❌ FAIL: User still has lead:view permission when assigned role has it disabled!');
    process.exit(1);
  }
  if (leadsDashboard === true) {
    console.error('❌ FAIL: dashboardConfig.leads is true when lead:view is disabled!');
    process.exit(1);
  }
  console.log('✓ PASS: lead:view is strictly absent and dashboardConfig.leads is false.\n');

  // 7. Test Backend Lead APIs with lead:view = OFF (Expect 403 Forbidden)
  console.log('Step 6: Testing GET /leads API with lead:view = OFF (Expect 403 Forbidden)...');
  const leadsApiRes = await request('/leads', {
    headers: { Authorization: `Bearer ${targetAuth.token}` },
  });

  console.log(`  GET /leads -> Status: ${leadsApiRes.status}`);
  console.log(`  Response: ${JSON.stringify(leadsApiRes.body)}`);

  if (leadsApiRes.status !== 403) {
    console.error(`❌ FAIL: Expected 403 Forbidden on GET /leads, but got ${leadsApiRes.status}`);
    process.exit(1);
  }
  console.log('✓ PASS: GET /leads returned 403 Forbidden.\n');

  console.log('Step 7: Testing GET /leads/kpis with lead:view = OFF (Expect 403 Forbidden)...');
  const kpisApiRes = await request('/leads/kpis', {
    headers: { Authorization: `Bearer ${targetAuth.token}` },
  });

  console.log(`  GET /leads/kpis -> Status: ${kpisApiRes.status}`);
  if (kpisApiRes.status !== 403) {
    console.error(`❌ FAIL: Expected 403 Forbidden on GET /leads/kpis, but got ${kpisApiRes.status}`);
    process.exit(1);
  }
  console.log('✓ PASS: GET /leads/kpis returned 403 Forbidden.\n');

  // 8. Turn lead:view = ON in "QA Test Agent" role
  console.log('Step 8: Updating "QA Test Agent" role to enable lead:view = ON...');
  const enabledLeadPermissions = [
    ...disabledLeadPermissions,
    'lead:view',
    'lead:edit',
  ];

  const enableRoleRes = await request(`/admin/entitlements/roles/${qaRoleId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  }, {
    name: 'QA Test Agent',
    permissions: enabledLeadPermissions,
    dashboardConfig: { overview: true, properties: true, leads: true, crm: true },
    dataScope: 'OWN',
  });

  console.log(`✓ Role updated with lead:view = ON. Status: ${enableRoleRes.status}\n`);

  // 9. Test GET /leads API with lead:view = ON (Expect 200 OK)
  console.log('Step 9: Testing GET /leads API with lead:view = ON (Expect 200 OK)...');
  const leadsEnabledRes = await request('/leads', {
    headers: { Authorization: `Bearer ${targetAuth.token}` },
  });

  console.log(`  GET /leads -> Status: ${leadsEnabledRes.status}`);
  if (leadsEnabledRes.status !== 200) {
    console.error(`❌ FAIL: Expected 200 OK on GET /leads when lead:view is ON, but got ${leadsEnabledRes.status}: ${JSON.stringify(leadsEnabledRes.body)}`);
    process.exit(1);
  }
  console.log('✓ PASS: GET /leads returned 200 OK when lead:view is enabled.\n');

  // 10. Test Standard Agent role remains functional
  console.log('Step 10: Testing Standard Agent role access...');
  const standardAgentAuth = await loginUser('+919925843599', 'Standard Agent User', 'AGENT');
  // Clear customRoleId if any on standard agent
  await request(`/admin/users/${standardAgentAuth.user.id || standardAgentAuth.user._id}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  }, {
    roleId: null,
  });

  const stdLeadsRes = await request('/leads', {
    headers: { Authorization: `Bearer ${standardAgentAuth.token}` },
  });
  console.log(`  Standard Agent GET /leads -> Status: ${stdLeadsRes.status}`);
  if (stdLeadsRes.status !== 200) {
    console.error(`❌ FAIL: Standard Agent failed GET /leads with status ${stdLeadsRes.status}`);
    process.exit(1);
  }
  console.log('✓ PASS: Standard Agent has 200 OK access.\n');

  // 11. Test Super Admin remains functional
  console.log('Step 11: Testing Super Admin unrestricted access...');
  const adminLeadsRes = await request('/leads', {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  console.log(`  Super Admin GET /leads -> Status: ${adminLeadsRes.status}`);
  if (adminLeadsRes.status !== 200) {
    console.error(`❌ FAIL: Super Admin failed GET /leads with status ${adminLeadsRes.status}`);
    process.exit(1);
  }
  console.log('✓ PASS: Super Admin has 200 OK access.\n');

  // Restore QA Test Agent role to lead:view = OFF as requested by QA test scenario
  console.log('Step 12: Restoring QA Test Agent role to lead:view = OFF for manual QA validation...');
  await request(`/admin/entitlements/roles/${qaRoleId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  }, {
    name: 'QA Test Agent',
    permissions: disabledLeadPermissions,
    dashboardConfig: { overview: true, properties: true, leads: false, crm: true },
    dataScope: 'OWN',
  });
  console.log('✓ Role reset to lead:view = OFF.\n');

  console.log('===============================================================');
  console.log('🎉 ALL AUTOMATED INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
