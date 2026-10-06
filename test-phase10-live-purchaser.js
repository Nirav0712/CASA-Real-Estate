/**
 * CASA — Phase 10 Live Purchaser Dashboard & Buyer Experience Test Suite
 * Tests real MongoDB-backed Purchaser Workspace: Saved Properties, Real-Time Sync,
 * Enquiries, Lead Routing, Browsing History, Personalized Recommendations,
 * Profile & Preferences, RBAC Isolation, and Anti-Tampering.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  const data = json && typeof json === 'object' && json.data !== undefined ? json.data : json;
  return { status: res.status, ok: res.ok, data, raw: json };
}

async function loginUser(mobile, name = 'Test Purchaser') {
  const reqRes = await request('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ mobile, name }),
  });
  if (!reqRes.ok) throw new Error(`OTP request failed: ${JSON.stringify(reqRes.raw || reqRes.data)}`);

  const otp = reqRes.data?.devMockOtp || reqRes.raw?.devMockOtp || '123456';
  const verifyRes = await request('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ mobile, otp }),
  });
  if (!verifyRes.ok) throw new Error(`OTP verify failed: ${JSON.stringify(verifyRes.raw || verifyRes.data)}`);

  const user = verifyRes.data?.user || verifyRes.raw?.user;
  const token = verifyRes.data?.tokens?.accessToken || verifyRes.raw?.tokens?.accessToken;

  return { user, token };
}

async function runPhase10LiveTests() {
  console.log('====================================================');
  console.log(' CASA PHASE 10 — LIVE MONGODB PURCHASER TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 0. Health check
    const health = await request('/health');
    assert(health.ok, 'Backend API health check is live (HTTP 200)');

    // 1. Unauthenticated Purchaser API access must return 401
    const unauthDashboard = await request('/purchaser/dashboard');
    assert(unauthDashboard.status === 401, 'Unauthenticated access to /purchaser/dashboard is blocked (401 Unauthorized)');

    const unauthSaved = await request('/purchaser/saved-properties');
    assert(unauthSaved.status === 401, 'Unauthenticated access to /purchaser/saved-properties is blocked (401 Unauthorized)');

    // 2. Authenticate Primary Test Purchaser
    const purchaserMobile = `+91987${Math.floor(1000000 + Math.random() * 9000000)}`;
    const purchaserA = await loginUser(purchaserMobile, 'Ananya Sharma Buyer');
    assert(purchaserA.token, `Primary Purchaser logged in successfully (${purchaserMobile})`);

    // 3. Fetch Initial Dashboard
    const initialDash = await request('/purchaser/dashboard', {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(initialDash.ok && initialDash.data?.stats !== undefined, 'Purchaser dashboard returns live initial database stats');
    console.log(`   Initial stats: Saved=${initialDash.data?.stats?.savedCount}, Enquiries=${initialDash.data?.stats?.enquiriesCount}`);

    // 4. Fetch a Published Property from Marketplace
    const propsRes = await request('/properties?limit=5');
    assert(propsRes.ok && propsRes.data?.length > 0, 'Public marketplace listings are available');
    const publishedProp = propsRes.data[0];
    const publishedPropId = publishedProp.id || publishedProp._id;
    console.log(`   Selected property for test: "${publishedProp.title?.en || publishedProp.title}" (ID: ${publishedPropId})`);

    // 5. Save Property
    const saveRes = await request(`/purchaser/saved-properties/${publishedPropId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(saveRes.ok && saveRes.data?.success, `Property ${publishedPropId} saved to database`);

    // 6. Verify Saved Property State & IDs
    const statusRes = await request(`/purchaser/saved-properties/${publishedPropId}/status`, {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(statusRes.ok && statusRes.data?.isSaved === true, 'isPropertySaved endpoint confirms property is saved (true)');

    const idsRes = await request('/purchaser/saved-properties/ids', {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(idsRes.ok && Array.isArray(idsRes.data) && idsRes.data.includes(publishedPropId), 'getSavedPropertyIds contains saved property ID');

    // 7. Duplicate Save is Idempotent
    const dupSave = await request(`/purchaser/saved-properties/${publishedPropId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(dupSave.ok, 'Duplicate save request is handled gracefully without error (Idempotent)');

    // 8. Attempt Saving Non-Existent Property is Rejected
    const badSave = await request('/purchaser/saved-properties/non-existent-prop-999', {
      method: 'POST',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(!badSave.ok && badSave.status === 404, 'Attempting to save non-existent property returns 404 Not Found');

    // 9. Get Paginated Saved Properties
    const savedList = await request('/purchaser/saved-properties', {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(savedList.ok && savedList.data?.data?.length >= 1, 'getSavedProperties returns populated saved listings from MongoDB');
    assert(savedList.data?.data[0]?.property?.title !== undefined, 'Saved property item contains populated property metadata');

    // 10. Record Recently Viewed Property
    const viewRes = await request(`/purchaser/recently-viewed/${publishedPropId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(viewRes.ok, 'Record recently viewed property succeeds');

    const recentList = await request('/purchaser/recently-viewed', {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(recentList.ok && recentList.data?.length >= 1, 'getRecentlyViewed returns populated browsing history');

    // 11. Create Public Enquiry on Published Property
    const enquiryRes = await request('/leads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
      body: JSON.stringify({
        propertyId: publishedPropId,
        name: 'Ananya Sharma Buyer',
        mobile: purchaserMobile,
        email: 'ananya.buyer@example.com',
        message: 'Hello, I am interested in viewing this property this weekend.',
        source: 'PROPERTY_PAGE',
      }),
    });
    assert(enquiryRes.ok && enquiryRes.data?.leadId, 'Property enquiry submitted successfully and persisted to leads collection');
    const enquiryId = enquiryRes.data?.leadId;

    // 12. List Purchaser Enquiries
    const purchaserEnquiries = await request('/purchaser/enquiries', {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(purchaserEnquiries.ok && purchaserEnquiries.data?.data?.length >= 1, 'getPurchaserEnquiries returns buyer submitted enquiries');
    const myEnquiry = purchaserEnquiries.data?.data?.find((e) => e.id === enquiryId);
    assert(myEnquiry !== undefined, 'Submitted enquiry is present in purchaser enquiry queue');

    // 13. Get Single Enquiry Detail
    const enqDetail = await request(`/purchaser/enquiries/${enquiryId}`, {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(enqDetail.ok && enqDetail.data?.message?.includes('viewing this property'), 'getPurchaserEnquiryById returns full enquiry details and property context');

    // 14. Cross-Purchaser Isolation (Purchaser B attempting to access Purchaser A enquiry)
    const purchaserBMobile = `+91986${Math.floor(1000000 + Math.random() * 9000000)}`;
    const purchaserB = await loginUser(purchaserBMobile, 'Other Buyer B');
    const crossAccess = await request(`/purchaser/enquiries/${enquiryId}`, {
      headers: { Authorization: `Bearer ${purchaserB.token}` },
    });
    assert(!crossAccess.ok && (crossAccess.status === 403 || crossAccess.status === 404), 'Purchaser B is strictly blocked from accessing Purchaser A private enquiry (403 Forbidden)');

    // 15. Cancel / Close Enquiry by Purchaser
    const cancelRes = await request(`/purchaser/enquiries/${enquiryId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
      body: JSON.stringify({ reason: 'Found alternative property' }),
    });
    assert(cancelRes.ok && cancelRes.data?.status === 'CLOSED', 'Purchaser can close their enquiry');

    // 16. Get Personalized Recommendations
    const recsRes = await request('/purchaser/recommendations', {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(recsRes.ok && Array.isArray(recsRes.data) && recsRes.data.length > 0, 'getPurchaserRecommendations returns published listings matching buyer signals');

    // 17. Update Purchaser Profile & Search Preferences (Whitelisted fields)
    const updateProfileRes = await request('/purchaser/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
      body: JSON.stringify({
        name: 'Ananya S. Updated',
        email: 'ananya.updated@example.com',
        preferredCity: 'Lucknow',
        preferredLocation: 'Gomti Nagar Extension',
        budgetMin: 5000000,
        budgetMax: 15000000,
        preferredCategory: 'APARTMENT',
        preferredListingType: 'SALE',
        bedrooms: 3,
        furnishing: 'FULLY_FURNISHED',
      }),
    });
    assert(updateProfileRes.ok && updateProfileRes.data?.user?.name === 'Ananya S. Updated', 'Purchaser profile and buyer preferences updated successfully');
    assert(updateProfileRes.data?.user?.metadata?.preferredCity === 'Lucknow', 'Buyer preferences saved in user.metadata in MongoDB');

    // 18. Anti-Tampering: Purchaser cannot escalate role or status via profile update
    const tamperRes = await request('/purchaser/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
      body: JSON.stringify({
        role: 'SUPER_ADMIN',
        status: 'SUSPENDED',
        isVerifiedAgent: true,
      }),
    });
    assert(tamperRes.ok, 'Profile update request processed');
    assert(tamperRes.data?.user?.role === 'PURCHASER', 'Role escalation payload strictly ignored (User remains PURCHASER)');
    assert(tamperRes.data?.user?.status === 'ACTIVE', 'Account status tampering strictly ignored (User remains ACTIVE)');

    // 19. Remove Property from Saved Shortlist
    const unsaveRes = await request(`/purchaser/saved-properties/${publishedPropId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(unsaveRes.ok && unsaveRes.data?.success, 'Property removed from saved shortlist');

    const statusAfterUnsave = await request(`/purchaser/saved-properties/${publishedPropId}/status`, {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(statusAfterUnsave.ok && statusAfterUnsave.data?.isSaved === false, 'isPropertySaved confirms property is no longer saved (false)');

    // 20. Re-check Purchaser Dashboard KPI Aggregation
    const finalDash = await request('/purchaser/dashboard', {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });
    assert(finalDash.ok && typeof finalDash.data?.stats?.savedCount === 'number', 'Final dashboard KPI query reflects live MongoDB Atlas aggregation');
    console.log(`   Final Dashboard Stats: Saved=${finalDash.data?.stats?.savedCount}, Enquiries=${finalDash.data?.stats?.enquiriesCount}, RecentlyViewed=${finalDash.data?.stats?.recentlyViewedCount}`);

    console.log('\n====================================================');
    console.log(` PHASE 10 LIVE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runPhase10LiveTests();
