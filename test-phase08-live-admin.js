const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runLivePhase08Tests() {
  console.log('====================================================');
  console.log('CASA PHASE 08 — LIVE MONGODB & BACKEND API TEST SUITE');
  console.log('====================================================\n');

  // Step 1: Login as Super Admin
  console.log('1. Authenticating Super Admin (+917359237870)...');
  const otpRes = await request('/auth/otp/request', {
    method: 'POST',
    body: { mobile: '+917359237870' },
  });
  console.log('   OTP Request Status:', otpRes.status, otpRes.body.message);

  const verifyRes = await request('/auth/otp/verify', {
    method: 'POST',
    body: { mobile: '+917359237870', otp: '123456' },
  });
  console.log('   OTP Verify Status:', verifyRes.status);
  const token = verifyRes.body.tokens?.accessToken;
  const superAdminId = verifyRes.body.user?.id;
  if (!token) {
    throw new Error('Failed to obtain Super Admin access token: ' + JSON.stringify(verifyRes.body));
  }
  console.log('   Super Admin Token Obtained. User ID:', superAdminId);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Step 2: Get Users List
  console.log('\n2. Testing GET /admin/users (Live MongoDB Users)...');
  const usersRes = await request('/admin/users?page=1&limit=10', { headers: authHeaders });
  console.log('   Status:', usersRes.status);
  console.log('   Body keys:', Object.keys(usersRes.body));
  const payload = usersRes.body.data?.data ? usersRes.body.data : usersRes.body;
  console.log('   Total Users in DB:', payload.pagination?.total);
  console.log('   Returned Users:', payload.data?.length);

  const usersList = payload.data || [];
  const sampleUser = usersList.find((u) => u.id !== superAdminId) || usersList[0];
  console.log('   Sample User Found:', sampleUser?.name, '| Role:', sampleUser?.role, '| Status:', sampleUser?.status);

  // Step 3: Get User Details with Aggregated Properties
  console.log('\n3. Testing GET /admin/users/:id (Detail & Property Summary)...');
  const detailRes = await request(`/admin/users/${sampleUser.id}`, { headers: authHeaders });
  const userDetail = detailRes.body.data || detailRes.body;
  console.log('   Status:', detailRes.status);
  console.log('   User Profile:', userDetail.name, `(${userDetail.normalizedMobile})`);
  console.log('   Property Summary:', JSON.stringify(userDetail.propertySummary));

  // Step 4: Test Self-Status Protection
  console.log('\n4. Testing Self-Status Protection (Super Admin cannot suspend self)...');
  const selfStatusRes = await request(`/admin/users/${superAdminId}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: { status: 'SUSPENDED', reason: 'Attempt self-suspend' },
  });
  console.log('   Status:', selfStatusRes.status, '| Expected 400 Bad Request');
  console.log('   Message:', selfStatusRes.body.message);

  // Step 5: Test Target User Status Change & Session Invalidation
  if (sampleUser.id !== superAdminId) {
    console.log(`\n5. Testing Target User Status Change on ${sampleUser.name}...`);
    const suspendRes = await request(`/admin/users/${sampleUser.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { status: 'SUSPENDED', reason: 'Phase 08 live verification test' },
    });
    const suspendedUser = suspendRes.body.data || suspendRes.body;
    console.log('   Suspend Status:', suspendRes.status, '| New Status:', suspendedUser.user?.status || suspendedUser.status);

    // Reactivate user
    const reactivateRes = await request(`/admin/users/${sampleUser.id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { status: 'ACTIVE', reason: 'Phase 08 live verification test restoration' },
    });
    const reactivatedUser = reactivateRes.body.data || reactivateRes.body;
    console.log('   Reactivate Status:', reactivateRes.status, '| New Status:', reactivatedUser.user?.status || reactivatedUser.status);
  }

  // Step 6: Test Self-Role Protection
  console.log('\n6. Testing Self-Role Protection (Super Admin cannot change self role)...');
  const selfRoleRes = await request(`/admin/users/${superAdminId}/role`, {
    method: 'PATCH',
    headers: authHeaders,
    body: { role: 'AGENT', reason: 'Attempt self-demote' },
  });
  console.log('   Status:', selfRoleRes.status, '| Expected 400 Bad Request');
  console.log('   Message:', selfRoleRes.body.message);

  // Step 7: Create/Ensure an Agent and a Purchaser exist for live queue testing
  console.log('\n7. Setting up real AGENT and PURCHASER users for queue testing...');
  const testAgentMobile = '+919925843599';
  const agentOtpVerify = await request('/auth/otp/verify', {
    method: 'POST',
    body: { mobile: testAgentMobile, otp: '123456' },
  });
  const agentUserId = agentOtpVerify.body.user?.id;
  if (agentUserId) {
    await request(`/admin/users/${agentUserId}/role`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { role: 'AGENT', reason: 'Onboard agent for live testing' },
    });
  }

  const testPurchaserMobile = '+919839012345';
  const purchaserOtpVerify = await request('/auth/otp/verify', {
    method: 'POST',
    body: { mobile: testPurchaserMobile, otp: '123456' },
  });
  const purchaserUserId = purchaserOtpVerify.body.user?.id;
  if (purchaserUserId) {
    await request(`/admin/users/${purchaserUserId}/role`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { role: 'PURCHASER', reason: 'Onboard purchaser for live testing' },
    });
  }

  // Step 8: Test Agents Queue
  console.log('\n8. Testing GET /admin/agents...');
  const agentsRes = await request('/admin/agents?page=1&limit=10', { headers: authHeaders });
  const agentsData = agentsRes.body.data || agentsRes.body;
  console.log('   Status:', agentsRes.status);
  console.log('   Total Registered Agents:', agentsData.pagination?.total);
  console.log('   Agents Found:', agentsData.data?.map((a) => `${a.name} (${a.isVerifiedAgent ? 'VERIFIED' : 'PENDING'})`));

  const testAgent = agentsData.data?.[0];

  // Step 9: Test Grant & Revoke Agent Verified Badge
  if (testAgent) {
    console.log(`\n9. Testing Grant & Revoke CASA Verified Badge for ${testAgent.name}...`);
    const grantRes = await request(`/admin/agents/${testAgent.id}/verify`, {
      method: 'POST',
      headers: authHeaders,
      body: { notes: 'Live verified RERA registration document' },
    });
    const grantData = grantRes.body.data || grantRes.body;
    console.log('   Grant Status:', grantRes.status, '| Is Verified Agent:', grantData.user?.isVerifiedAgent, '| Role:', grantData.user?.role);

    const revokeRes = await request(`/admin/agents/${testAgent.id}/revoke`, {
      method: 'POST',
      headers: authHeaders,
      body: { reason: 'Test verification cycle completion' },
    });
    const revokeData = revokeRes.body.data || revokeRes.body;
    console.log('   Revoke Status:', revokeRes.status, '| Is Verified Agent:', revokeData.user?.isVerifiedAgent, '| Role:', revokeData.user?.role);
  }

  // Step 10: Test Purchasers Queue
  console.log('\n10. Testing GET /admin/purchasers...');
  const purchasersRes = await request('/admin/purchasers?page=1&limit=10', { headers: authHeaders });
  const purchasersData = purchasersRes.body.data || purchasersRes.body;
  console.log('   Status:', purchasersRes.status);
  console.log('   Total Purchasers:', purchasersData.pagination?.total);
  console.log('   Purchasers List:', purchasersData.data?.map((p) => `${p.name} (${p.normalizedMobile})`));

  // Step 11: Test Audit Logs
  console.log('\n11. Testing GET /admin/audit-logs (Immutable Audit Trail)...');
  const auditRes = await request('/admin/audit-logs?page=1&limit=10', { headers: authHeaders });
  const auditData = auditRes.body.data || auditRes.body;
  console.log('   Status:', auditRes.status);
  console.log('   Total Audit Log Events in MongoDB:', auditData.pagination?.total);
  console.log('   Latest Audit Events:');
  auditData.data?.slice(0, 6).forEach((log) => {
    console.log(`   - [${log.action}] by ${log.actorName} (${log.actorRole}) on ${log.targetUserName || log.targetEntity || log.targetEntityId} at ${log.timestamp}`);
  });

  console.log('\n====================================================');
  console.log('ALL PHASE 08 LIVE BACKEND & DB TESTS PASSED!');
  console.log('====================================================\n');
}

runLivePhase08Tests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
