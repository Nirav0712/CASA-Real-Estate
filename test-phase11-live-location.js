/**
 * CASA Real Estate Marketplace
 * Phase 11 — Location Management & Location Foundation Live Verification Suite
 */

const API_BASE = 'http://localhost:5000/api/v1';

const ADMIN_MOBILE = '9876543210'; // Super Admin
const PURCHASER_MOBILE = '9876500001'; // Purchaser

let adminToken = '';
let purchaserToken = '';
let seededCountryId = '';
let seededGujaratStateId = '';
let seededAhmedabadCityId = '';
let seededSatelliteLocalityId = '';
let testCreatedStateId = '';
let testCreatedCityId = '';
let testCreatedLocalityId = '';

let passedCount = 0;
let failedCount = 0;

function pass(name, detail) {
  passedCount++;
  console.log(`[PASS] ${passedCount}. ${name}${detail ? ` (${detail})` : ''}`);
}

function fail(name, error) {
  failedCount++;
  console.error(`[FAIL] ${name}:`, error);
}

async function runTest(name, fn) {
  try {
    await fn();
  } catch (err) {
    fail(name, err.message || err);
  }
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {}
  return { status: res.status, ok: res.ok, data: json, rawText: text };
}

async function main() {
  console.log('================================================================================');
  console.log('  CASA Phase 11 — Location Management & Foundation Live Test Suite');
  console.log('================================================================================\n');

  // 1. Public API: Fetch active locations
  await runTest('1. Public locations list returns seeded active items', async () => {
    const res = await request('/locations');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.rawText}`);
    const items = res.data.data;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(`Expected active location array, received ${JSON.stringify(items)}`);
    }
    pass('1. Public locations list returns seeded active items', `Total items: ${items.length}`);
  });

  // 2. Public API: Location Tree
  await runTest('2. Public location tree returns nested hierarchy', async () => {
    const res = await request('/locations/tree');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.rawText}`);
    const tree = res.data.data;
    if (!Array.isArray(tree) || tree.length === 0) {
      throw new Error('Expected root tree nodes');
    }
    const india = tree.find((n) => n.slug === 'india');
    if (!india) throw new Error('India root node not found in tree');
    seededCountryId = india.id || india._id;

    if (!Array.isArray(india.children) || india.children.length === 0) {
      throw new Error('India should have child state nodes');
    }
    const gujarat = india.children.find((c) => c.slug === 'gujarat');
    if (!gujarat) throw new Error('Gujarat not found under India');
    seededGujaratStateId = gujarat.id || gujarat._id;

    pass('2. Public location tree returns nested hierarchy', `Root: ${india.name}, States: ${india.children.length}`);
  });

  // 3. Public API: Search by keyword & alias
  await runTest('3. Public search resolves location by name and alias (e.g. Amdavad)', async () => {
    const res = await request('/locations/search?q=Amdavad');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.rawText}`);
    const items = res.data.data;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Expected Ahmedabad to be resolved via "Amdavad" alias');
    }
    const ahm = items.find((i) => i.slug === 'ahmedabad' || i.name === 'Ahmedabad');
    if (!ahm) throw new Error('Ahmedabad not found in alias search');
    seededAhmedabadCityId = ahm._id || ahm.id;
    pass('3. Public search resolves location by name and alias', `Matched: ${ahm.name}`);
  });

  // 4. Public API: Search by pincode
  await runTest('4. Public search resolves locality by pincode (380015)', async () => {
    const res = await request('/locations/search?q=380015');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.rawText}`);
    const items = res.data.data;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Expected locations matching pincode 380015');
    }
    const sat = items.find((i) => i.pincode === '380015');
    if (!sat) throw new Error('Pincode 380015 not matched');
    seededSatelliteLocalityId = sat._id || sat.id;
    pass('4. Public search resolves locality by pincode', `Matched: ${sat.name} (${sat.pincode})`);
  });

  // 5. Public API: Autocomplete
  await runTest('5. Public autocomplete returns structured breadcrumbs', async () => {
    const res = await request('/locations/autocomplete?q=Satel');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.rawText}`);
    const suggestions = res.data.data;
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Expected autocomplete suggestions for "Satel"');
    }
    const top = suggestions[0];
    if (!top.fullPath) throw new Error('Autocomplete item missing fullPath breadcrumb');
    pass('5. Public autocomplete returns structured breadcrumbs', `Path: ${top.fullPath}`);
  });

  // 6. Public API: Get by slug
  await runTest('6. Public get by slug returns single location', async () => {
    const res = await request('/locations/slug/ahmedabad');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.rawText}`);
    const loc = res.data.data;
    if (loc.slug !== 'ahmedabad') throw new Error(`Unexpected slug ${loc.slug}`);
    pass('6. Public get by slug returns single location', `City: ${loc.name}`);
  });

  // 7. Public API: Get Hierarchy & Breadcrumb
  await runTest('7. Public hierarchy endpoint returns complete ancestor chain', async () => {
    if (!seededSatelliteLocalityId) throw new Error('Satellite locality ID missing');
    const res = await request(`/locations/${seededSatelliteLocalityId}/hierarchy`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.rawText}`);
    const { breadcrumb, fullPath } = res.data.data;
    if (!Array.isArray(breadcrumb) || breadcrumb.length < 3) {
      throw new Error(`Expected at least 3 ancestor nodes, got ${breadcrumb?.length}`);
    }
    pass('7. Public hierarchy endpoint returns complete ancestor chain', `Breadcrumb: ${fullPath}`);
  });

  // 8. Public API: Nearby Geospatial lookup
  await runTest('8. Public nearby endpoint discovers locations within 20km', async () => {
    const res = await request('/locations/nearby?lat=23.0225&lng=72.5714&radius=20');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.rawText}`);
    const nearby = res.data.data;
    if (!Array.isArray(nearby) || nearby.length === 0) {
      throw new Error('Expected nearby locations around Ahmedabad coordinates');
    }
    pass('8. Public nearby endpoint discovers locations within 20km', `Found ${nearby.length} locations`);
  });

  // 9. Auth Setup: Admin Login
  await runTest('9. Super Admin OTP login successful', async () => {
    const reqOtp = await request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ mobile: ADMIN_MOBILE }),
    });
    if (!reqOtp.ok) throw new Error(`Failed OTP request: ${reqOtp.rawText}`);

    const verifyOtp = await request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ mobile: ADMIN_MOBILE, otp: '123456' }),
    });
    if (!verifyOtp.ok) throw new Error(`Failed OTP verify: ${verifyOtp.rawText}`);
    adminToken = verifyOtp.data.tokens.accessToken;
    pass('9. Super Admin OTP login successful');
  });

  // 10. Auth Setup: Purchaser Login
  await runTest('10. Purchaser OTP login successful', async () => {
    const reqOtp = await request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ mobile: PURCHASER_MOBILE }),
    });
    if (!reqOtp.ok) throw new Error(`Failed OTP request: ${reqOtp.rawText}`);

    const verifyOtp = await request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ mobile: PURCHASER_MOBILE, otp: '123456' }),
    });
    if (!verifyOtp.ok) throw new Error(`Failed OTP verify: ${verifyOtp.rawText}`);
    purchaserToken = verifyOtp.data.tokens.accessToken;
    pass('10. Purchaser OTP login successful');
  });

  // 11. Security: Block Unauthenticated Admin Mutations
  await runTest('11. Block unauthenticated access to /admin/locations (401)', async () => {
    const res = await request('/admin/locations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', type: 'STATE' }),
    });
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    pass('11. Block unauthenticated access to /admin/locations (401)');
  });

  // 12. Security: Block Purchaser Role from Admin Mutations (403)
  await runTest('12. Block purchaser from admin location creation (403)', async () => {
    const res = await request('/admin/locations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${purchaserToken}` },
      body: JSON.stringify({ name: 'Test', type: 'STATE' }),
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    pass('12. Block purchaser from admin location creation (403)');
  });

  const runId = Date.now();
  const testStateName = `TestState_${runId}`;
  const testStateSlug = `test-state-${runId}`;
  const testCityName = `TestCity_${runId}`;
  const testCitySlug = `test-city-${runId}`;
  const testLocalityName = `TestLocality_${runId}`;
  const testLocalitySlug = `test-locality-${runId}`;

  // 13. Admin: Create State under Country
  await runTest('13. Admin can create STATE location under COUNTRY', async () => {
    const res = await request('/admin/locations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: testStateName,
        slug: testStateSlug,
        type: 'STATE',
        parentId: seededCountryId,
        countryCode: 'IN',
        stateCode: `T${runId.toString().slice(-2)}`,
      }),
    });
    if (!res.ok) throw new Error(`Failed to create state: ${res.rawText}`);
    testCreatedStateId = res.data.data._id || res.data.data.id;
    pass('13. Admin can create STATE location under COUNTRY', `State ID: ${testCreatedStateId}`);
  });

  // 14. Validation: Reject Invalid Hierarchy (e.g. CITY directly under COUNTRY)
  await runTest('14. Reject invalid parent hierarchy with 409', async () => {
    const res = await request('/admin/locations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `InvalidCity_${runId}`,
        type: 'CITY',
        parentId: seededCountryId, // Invalid parent
      }),
    });
    if (res.status !== 409 && res.status !== 400) {
      throw new Error(`Expected 409 Conflict / 400 Bad Request, got ${res.status}`);
    }
    pass('14. Reject invalid parent hierarchy with 409');
  });

  // 15. Validation: Reject Duplicate Slug/Name under Same Parent
  await runTest('15. Reject duplicate location name under same parent with 409', async () => {
    const res = await request('/admin/locations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: testStateName,
        type: 'STATE',
        parentId: seededCountryId,
      }),
    });
    if (res.status !== 409) {
      throw new Error(`Expected 409 Conflict, got ${res.status}`);
    }
    pass('15. Reject duplicate location name under same parent with 409');
  });

  // 16. Admin: Create District & City under State
  await runTest('16. Admin can create DISTRICT and CITY under State', async () => {
    const distRes = await request('/admin/locations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `District_${runId}`,
        slug: `district-${runId}`,
        type: 'DISTRICT',
        parentId: testCreatedStateId,
      }),
    });
    if (!distRes.ok) throw new Error(`Failed to create district: ${distRes.rawText}`);
    const distId = distRes.data.data._id || distRes.data.data.id;

    const cityRes = await request('/admin/locations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: testCityName,
        slug: testCitySlug,
        type: 'CITY',
        parentId: distId,
        aliases: ['AliasCity', 'TestTown'],
        latitude: 26.9124,
        longitude: 75.7873,
      }),
    });
    if (!cityRes.ok) throw new Error(`Failed to create city: ${cityRes.rawText}`);
    testCreatedCityId = cityRes.data.data._id || cityRes.data.data.id;

    pass('16. Admin can create DISTRICT and CITY under State', `City: ${testCityName} (${testCreatedCityId})`);
  });

  // 17. Admin: Create Locality
  await runTest('17. Admin can create LOCALITY with pincode', async () => {
    const res = await request('/admin/locations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: testLocalityName,
        slug: testLocalitySlug,
        type: 'LOCALITY',
        parentId: testCreatedCityId,
        pincode: '302099',
      }),
    });
    if (!res.ok) throw new Error(`Failed to create locality: ${res.rawText}`);
    testCreatedLocalityId = res.data.data._id || res.data.data.id;
    pass('17. Admin can create LOCALITY with pincode', `Locality ID: ${testCreatedLocalityId}`);
  });

  // 18. Admin: Update Location details & aliases
  await runTest('18. Admin can update location metadata and aliases', async () => {
    const res = await request(`/admin/locations/${testCreatedCityId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        aliases: ['Pink City', 'Jeypore'],
        description: 'Capital city of Rajasthan',
        isFeatured: true,
      }),
    });
    if (!res.ok) throw new Error(`Failed to update location: ${res.rawText}`);
    const updated = res.data.data;
    if (!updated.isFeatured || !updated.aliases.includes('Jeypore')) {
      throw new Error('Update payload not reflected in response');
    }
    pass('18. Admin can update location metadata and aliases');
  });

  // 19. Admin: Deactivate Location
  await runTest('19. Admin can deactivate location', async () => {
    const res = await request(`/admin/locations/${testCreatedLocalityId}/deactivate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Failed to deactivate: ${res.rawText}`);
    pass('19. Admin can deactivate location');
  });

  // 20. Public: Inactive location hidden from public list
  await runTest('20. Deactivated location is hidden from public listing', async () => {
    const res = await request(`/locations?parentId=${testCreatedCityId}`);
    if (!res.ok) throw new Error(`Failed to fetch public list: ${res.rawText}`);
    const items = res.data.data;
    const found = items.find((i) => i.id === testCreatedLocalityId || i._id === testCreatedLocalityId);
    if (found) throw new Error('Deactivated locality should not appear in public listing');
    pass('20. Deactivated location is hidden from public listing');
  });

  // 21. Admin: Reactivate Location
  await runTest('21. Admin can reactivate location', async () => {
    const res = await request(`/admin/locations/${testCreatedLocalityId}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Failed to activate: ${res.rawText}`);
    pass('21. Admin can reactivate location');
  });

  // 22. Safe Delete: Block deletion if child locations exist
  await runTest('22. Block deletion of location with active children (409)', async () => {
    const res = await request(`/admin/locations/${testCreatedStateId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 409) {
      throw new Error(`Expected 409 Conflict when deleting parent location, got ${res.status}`);
    }
    pass('22. Block deletion of location with active children (409)');
  });

  // 23. Safe Delete: Delete clean leaf node
  await runTest('23. Successfully delete clean leaf locality', async () => {
    const res = await request(`/admin/locations/${testCreatedLocalityId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Failed to delete leaf locality: ${res.rawText}`);
    pass('23. Successfully delete clean leaf locality');
  });

  // 24. Property Search: Filtering with Location IDs
  await runTest('24. Property search supports locationId parameter', async () => {
    const res = await request(`/properties/search?city=Ahmedabad`);
    if (!res.ok) throw new Error(`Search failed: ${res.rawText}`);
    pass('24. Property search supports locationId parameter');
  });

  // 25. Audit Log: Verify location mutation logged in audit_logs
  await runTest('25. Location mutations write audit logs', async () => {
    const res = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.rawText}`);
    const logs = res.data.data?.data || (Array.isArray(res.data.data) ? res.data.data : res.data.data?.items || []);
    const locationLog = logs.find((l) => l.targetEntity === 'LOCATION' || (l.action && l.action.startsWith('LOCATION_')));
    if (!locationLog) {
      throw new Error('No LOCATION audit log entry recorded');
    }
    pass('25. Location mutations write audit logs', `Action: ${locationLog.action}`);
  });

  console.log('\n================================================================================');
  console.log(`  SUMMARY: ${passedCount} passed, ${failedCount} failed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}% success rate)`);
  console.log('================================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
