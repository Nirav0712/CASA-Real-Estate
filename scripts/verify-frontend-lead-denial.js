const http = require('http');

async function test() {
  console.log('Testing Authenticated QA Target against /api/v1/entitlements/me and /api/v1/leads...');

  // 1. Authenticate QA Target
  const otpRes = await fetch('http://localhost:5000/api/v1/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '+919999000021', name: 'Agent 1 QA Target', role: 'AGENT' }),
  });
  const otpData = await otpRes.json();
  const mockOtp = otpData?.data?.mockOtp || otpData?.mockOtp || '123456';

  const verifyRes = await fetch('http://localhost:5000/api/v1/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '+919999000021', otp: mockOtp }),
  });
  const authData = await verifyRes.json();
  const token = authData?.data?.tokens?.accessToken || authData?.tokens?.accessToken;
  const user = authData?.data?.user || authData?.user;

  console.log('User logged in:', user?.name, 'Role:', user?.role, 'CustomRoleId:', user?.customRoleId);

  // 2. Fetch /entitlements/me
  const entRes = await fetch('http://localhost:5000/api/v1/entitlements/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const entJson = await entRes.json();
  const ent = entJson?.data?.entitlements || entJson?.entitlements;

  console.log('Entitlements Role:', ent?.role);
  console.log('Permissions:', ent?.permissions);
  console.log('DashboardConfig.leads:', ent?.dashboardConfig?.leads);
  console.log('Has lead:view:', ent?.permissions?.includes('lead:view'));

  // 3. Direct API call to /leads
  const leadsRes = await fetch('http://localhost:5000/api/v1/leads', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const leadsJson = await leadsRes.json();

  console.log('Direct GET /leads API Status:', leadsRes.status);
  console.log('Direct GET /leads API Response:', leadsJson);

  if (leadsRes.status === 403 && !ent?.permissions?.includes('lead:view') && ent?.dashboardConfig?.leads === false) {
    console.log('\n>>> SUCCESS: Authenticated Agent 1 QA Target is strictly DENIED access to leads at both entitlement level and API layer.');
  } else {
    console.error('\n>>> FAILED: Security boundary was breached.');
    process.exit(1);
  }
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
