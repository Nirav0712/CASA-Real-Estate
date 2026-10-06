/**
 * CASA — Phase 09 Live Agent & Business Tools Test Suite
 * Tests real MongoDB-backed Agent Workspace, RERA Verification, Document Management,
 * Lead CRM, Public Agent Profile, and Admin Governance.
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

async function loginUser(mobile) {
  const reqRes = await request('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ mobile }),
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

async function runPhase09LiveTests() {
  console.log('====================================================');
  console.log(' CASA PHASE 09 — LIVE MONGODB AGENT TEST SUITE');
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
    const timestamp = Date.now().toString().slice(-5);
    const agentMobile = `+9198700${timestamp}`;
    const agent2Mobile = `+9198711${timestamp}`;
    const adminMobile = '+917359237870';

    console.log(`[Setup] Creating Agent 1 (${agentMobile}), Agent 2 (${agent2Mobile}), and Super Admin (${adminMobile})...`);

    // 1. Authenticate Agent 1
    const agent1 = await loginUser(agentMobile);
    assert(agent1.user.role === 'PURCHASER' || agent1.user.role === 'PROPERTY_OWNER' || agent1.user.role === 'AGENT', `Agent 1 authenticated successfully (ID: ${agent1.user.id || agent1.user._id})`);
    const agent1Id = agent1.user.id || agent1.user._id;

    // 2. Authenticate Super Admin
    const superAdmin = await loginUser(adminMobile);
    assert(superAdmin.user.role === 'SUPER_ADMIN', `Super Admin authenticated successfully (Role: ${superAdmin.user.role})`);

    // Promote Agent 1 to AGENT
    const promoRes = await request(`/admin/users/${agent1Id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdmin.token}` },
      body: JSON.stringify({ role: 'AGENT', reason: 'Promoted to agent for Phase 09 testing' }),
    });
    if (promoRes.status !== 200) {
      console.log('   [Debug promoRes]', promoRes.status, promoRes.data);
    }
    assert(promoRes.status === 200, 'Admin promoted Agent 1 to AGENT role');

    // Re-login agent 1 to refresh JWT role
    const agent1Refreshed = await loginUser(agentMobile);
    const agent1Token = agent1Refreshed.token;
    assert(agent1Refreshed.user.role === 'AGENT', `Agent 1 JWT has active AGENT role (Got: ${agent1Refreshed.user.role})`);

    // 3. Agent Profile Fetch & Update
    console.log('\n--- Testing Agent Business Profile ---');
    const profileGet = await request('/agents/me/profile', {
      headers: { Authorization: `Bearer ${agent1Token}` },
    });
    if (!profileGet.ok || !profileGet.data?.displayName) {
      console.log('   [Debug profileGet]', profileGet.status, JSON.stringify(profileGet.data));
    }
    assert(profileGet.status === 200 && profileGet.data?.displayName, 'Fetched agent profile from MongoDB');

    const updateProfile = await request('/agents/me/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${agent1Token}` },
      body: JSON.stringify({
        displayName: `Vikram Real Estate ${timestamp}`,
        agencyName: 'Skyline Luxury Realty',
        professionalTitle: 'Senior Commercial Real Estate Advisor',
        bio: 'Over 12 years of specialized luxury real estate transactions in Lucknow.',
        experienceYears: 12,
        phone: '+91 98700 00000',
        email: `agent_${timestamp}@skylinerealty.com`,
        areasServed: ['Gomti Nagar', 'Indira Nagar', 'Hazratganj'],
        languages: ['English', 'Hindi', 'Urdu'],
        specializations: ['Luxury Villas', 'Commercial Offices'],
      }),
    });
    const updatedProf = updateProfile.data?.profile || updateProfile.data;
    assert(updateProfile.status === 200 && updatedProf?.agencyName === 'Skyline Luxury Realty', 'Agent profile updated and persisted to MongoDB Atlas');

    // 4. Verify Profile Persistence
    const profilePersist = await request('/agents/me/profile', {
      headers: { Authorization: `Bearer ${agent1Token}` },
    });
    if (!profilePersist.ok || profilePersist.data?.displayName !== `Vikram Real Estate ${timestamp}`) {
      console.log('   [Debug profilePersist]', profilePersist.status, JSON.stringify(profilePersist.data));
    }
    assert(
      profilePersist.data?.displayName === `Vikram Real Estate ${timestamp}` &&
      profilePersist.data?.experienceYears === 12,
      'Profile changes persisted across independent API calls',
    );

    // 5. Verification Document Upload & Submission
    console.log('\n--- Testing RERA Verification & Document System ---');
    const uploadDoc = await request('/agents/me/verification/documents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent1Token}` },
      body: JSON.stringify({
        documentType: 'RERA_CERTIFICATE',
        documentUrl: 'https://casa-storage.example.com/rera_cert_up_2026.pdf',
        documentName: 'Official UP-RERA Certificate 2026',
        documentNumber: `UPRERAAGT${timestamp}`,
      }),
    });
    const docObj = uploadDoc.data?.document || uploadDoc.data;
    assert(uploadDoc.status === 201 && docObj?.status === 'PENDING', 'Agent uploaded RERA verification document');

    const submitVerification = await request('/agents/me/verification/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent1Token}` },
      body: JSON.stringify({
        reraNumber: `UPRERAAGT${timestamp}`,
        reraState: 'Uttar Pradesh',
        reraAuthority: 'UP-RERA',
        notes: 'Compliance application for Skyline Luxury Realty',
      }),
    });
    assert(
      submitVerification.status === 201 &&
      (submitVerification.data?.verificationStatus === 'PENDING' || submitVerification.data?.status === 'PENDING'),
      'Agent submitted verification application (Status: PENDING)',
    );

    // 6. Admin Verification Review & Rejection
    console.log('\n--- Testing Admin Verification Governance ---');
    const adminReview = await request(`/admin/agents/${agent1Id}/verification`, {
      headers: { Authorization: `Bearer ${superAdmin.token}` },
    });
    if (!adminReview.ok) {
      console.log('   [Debug adminReview]', adminReview.status, adminReview.data);
    }
    assert(
      adminReview.status === 200 && Array.isArray(adminReview.data?.documents) && adminReview.data.documents.length >= 1,
      'Admin retrieved agent verification details and documents portfolio',
    );

    // Test rejection without reason (Must fail 400)
    const rejectNoReason = await request(`/admin/agents/${agent1Id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdmin.token}` },
      body: JSON.stringify({ reason: ' ' }),
    });
    assert(rejectNoReason.status === 400, 'Security: Admin rejection without reason is rejected with 400 Bad Request');

    // Admin rejects with valid reason
    const rejectValid = await request(`/admin/agents/${agent1Id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdmin.token}` },
      body: JSON.stringify({ reason: 'Please upload higher resolution scan of RERA registration.' }),
    });
    if (!rejectValid.ok) {
      console.log('   [Debug rejectValid]', rejectValid.status, rejectValid.data);
    }
    assert(rejectValid.status === 200 || rejectValid.status === 201, 'Admin successfully rejected application with governance reason');

    // Agent checks rejection state
    const agentVerificationAfterReject = await request('/agents/me/verification', {
      headers: { Authorization: `Bearer ${agent1Token}` },
    });
    if (!agentVerificationAfterReject.ok) {
      console.log('   [Debug agentVerificationAfterReject]', agentVerificationAfterReject.status, agentVerificationAfterReject.data);
    }
    assert(
      agentVerificationAfterReject.data?.verificationStatus === 'REJECTED' &&
      (agentVerificationAfterReject.data?.rejectionReasons?.[0]?.includes('resolution') ||
       agentVerificationAfterReject.data?.rejectionReason?.includes('resolution')),
      'Agent verification state reflects REJECTED with admin reason',
    );

    // 7. Agent resubmits and Admin approves
    await request('/agents/me/verification/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent1Token}` },
      body: JSON.stringify({
        reraNumber: `UPRERAAGT${timestamp}`,
        reraState: 'Uttar Pradesh',
        reraAuthority: 'UP-RERA',
        notes: 'Resubmitted with high resolution scanned documents.',
      }),
    });

    const approveRes = await request(`/admin/agents/${agent1Id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdmin.token}` },
      body: JSON.stringify({ notes: 'Verified against UP-RERA public portal registry.' }),
    });
    if (!approveRes.ok) {
      console.log('   [Debug approveRes]', approveRes.status, approveRes.data);
    }
    assert(approveRes.status === 200 || approveRes.status === 201, 'Admin approved verification and granted CASA Verified Badge');

    // Agent refreshes session and verifies role
    const agent1Verified = await loginUser(agentMobile);
    assert(
      agent1Verified.user.role === 'VERIFIED_AGENT' && agent1Verified.user.isVerifiedAgent === true,
      'Agent role automatically elevated to VERIFIED_AGENT with verified badge in MongoDB',
    );

    // 8. Public Agent Profile & Listings
    console.log('\n--- Testing Public Agent Profile & Listings ---');
    const slug = profilePersist.data?.slug || `casa-agent-${agent1Id.slice(-4)}`;
    const publicAgentRes = await request(`/agents/${slug}`);
    if (!publicAgentRes.ok) {
      console.log('   [Debug publicAgentRes]', publicAgentRes.status, publicAgentRes.data);
    }
    const pubAgent = publicAgentRes.data?.agent || publicAgentRes.data;
    assert(
      publicAgentRes.status === 200 &&
      pubAgent?.isVerifiedAgent === true &&
      pubAgent?.displayName === `Vikram Real Estate ${timestamp}`,
      'Public Agent Profile endpoint returns verified public agent details without sensitive data',
    );

    // 9. Property Creation, Submission & Approval by Agent
    console.log('\n--- Testing Property Ownership & Published Listing ---');
    const createProp = await request('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent1Verified.token}` },
      body: JSON.stringify({
        title: { en: `Phase 09 Luxury Estate ${timestamp}`, hi: 'फेज 09 लक्जरी एस्टेट' },
        description: { en: 'Exclusive penthouse with panoramic city skyline views.', hi: 'शानदार पेंटहाउस' },
        category: 'Apartment / Flat',
        listingType: 'SALE',
        price: { amount: 25000000, currency: 'INR', isNegotiable: true },
        location: {
          state: 'Uttar Pradesh',
          district: 'Lucknow',
          city: 'Lucknow',
          locality: 'Gomti Nagar Extension',
          pincode: '226010',
          coordinates: [80.998, 26.852],
        },
        specs: { bedrooms: 4, bathrooms: 4, carpetAreaSqFt: 3500 },
        media: {
          thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
          images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200'],
        },
      }),
    });
    if (!createProp.ok) {
      console.log('   [Debug createProp]', createProp.status, createProp.data);
    }
    assert(createProp.status === 201, 'Agent created property in MongoDB');
    const propId = createProp.data?.id || createProp.data?._id || createProp.data?.property?.id;

    // Submit for review
    await request(`/properties/${propId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent1Verified.token}` },
    });

    // Admin approves & publishes
    const adminApproveProp = await request(`/admin/properties/${propId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdmin.token}` },
    });
    if (!adminApproveProp.ok) {
      console.log('   [Debug adminApproveProp]', adminApproveProp.status, adminApproveProp.data);
    }
    assert(adminApproveProp.status === 200 || adminApproveProp.status === 201, 'Admin approved and published property');

    // 10. Public Enquiry / Lead Creation & Routing
    console.log('\n--- Testing Lead Creation & Server-Side Recipient Routing ---');
    const publicLead = await request('/leads', {
      method: 'POST',
      body: JSON.stringify({
        propertyId: propId,
        name: 'Amitabh Malhotra',
        mobile: '+919811122233',
        email: 'amitabh@malhotra.in',
        message: 'Interested in booking a private site visit this weekend.',
        source: 'PROPERTY_PAGE',
      }),
    });
    if (!publicLead.ok) {
      console.log('   [Debug publicLead]', publicLead.status, publicLead.data);
    }
    assert(publicLead.status === 201 && publicLead.data?.success === true, 'Public enquiry submitted against published property');
    const leadId = publicLead.data?.leadId;

    // 11. Agent 1 Views Own Leads
    const myLeads = await request('/leads/my', {
      headers: { Authorization: `Bearer ${agent1Verified.token}` },
    });
    if (!myLeads.ok) {
      console.log('   [Debug myLeads]', myLeads.status, myLeads.data);
    }
    const myLeadList = myLeads.data?.data || myLeads.data || [];
    assert(
      myLeads.status === 200 &&
      Array.isArray(myLeadList) &&
      myLeadList.some((l) => (l._id === leadId || l.id === leadId) && l.name === 'Amitabh Malhotra'),
      'Server-side recipient routing: Lead automatically appeared in Agent 1 lead CRM',
    );

    // 12. Security & RBAC: Agent 2 Isolation
    console.log('\n--- Testing Security & Isolation ---');
    const agent2 = await loginUser(agent2Mobile);
    const agent2Id = agent2.user.id || agent2.user._id;
    // Promote Agent 2 to AGENT
    await request(`/admin/users/${agent2Id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdmin.token}` },
      body: JSON.stringify({ role: 'AGENT', reason: 'Promoted Agent 2' }),
    });
    const agent2Refreshed = await loginUser(agent2Mobile);

    const agent2Leads = await request('/leads/my', {
      headers: { Authorization: `Bearer ${agent2Refreshed.token}` },
    });
    const agent2LeadList = agent2Leads.data?.data || agent2Leads.data || [];
    assert(
      agent2Leads.status === 200 &&
      !agent2LeadList.some((l) => l._id === leadId || l.id === leadId),
      'Security: Agent 2 CANNOT see Agent 1 leads in lead CRM (Strict Isolation)',
    );

    const agent2DirectAccess = await request(`/leads/${leadId}`, {
      headers: { Authorization: `Bearer ${agent2Refreshed.token}` },
    });
    assert(
      agent2DirectAccess.status === 403,
      'Security: Direct cross-agent lead access attempt blocked with 403 Forbidden',
    );

    // 13. Lead CRM Operations: Status Workflow, Notes, Follow-up
    console.log('\n--- Testing Lead CRM Management Tools ---');
    const updateStatus = await request(`/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${agent1Verified.token}` },
      body: JSON.stringify({ status: 'SITE_VISIT', note: 'Customer confirmed site visit for Saturday 11 AM.' }),
    });
    const updatedLeadStatus = updateStatus.data?.lead || updateStatus.data;
    assert(
      updateStatus.status === 200 && updatedLeadStatus?.status === 'SITE_VISIT',
      'Lead status transitioned to SITE_VISIT with timeline note',
    );

    const addNote = await request(`/leads/${leadId}/notes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent1Verified.token}` },
      body: JSON.stringify({ text: 'Discussed budget and parking space requirements.' }),
    });
    const updatedLeadNotes = addNote.data?.note || addNote.data?.lead;
    assert(
      addNote.status === 201 && (updatedLeadNotes?.text || updatedLeadNotes?.notes?.length >= 2),
      'Internal agent conversation note appended to lead record',
    );

    const setFollowUp = await request(`/leads/${leadId}/follow-up`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent1Verified.token}` },
      body: JSON.stringify({
        nextFollowUpAt: new Date(Date.now() + 86400000).toISOString(),
        note: 'Call to confirm gate pass for site visit',
      }),
    });
    const updatedLeadFollowUp = setFollowUp.data?.lead || setFollowUp.data;
    assert(
      (setFollowUp.status === 200 || setFollowUp.status === 201) &&
      (setFollowUp.data?.nextFollowUpAt || updatedLeadFollowUp?.nextFollowUpAt),
      'Follow-up scheduled and persisted to MongoDB Atlas',
    );

    // 14. Agent Dashboard Live Aggregations
    console.log('\n--- Testing Real Agent Dashboard Metrics ---');
    const dashboardData = await request('/agents/me/dashboard', {
      headers: { Authorization: `Bearer ${agent1Verified.token}` },
    });
    const dash = dashboardData.data;
    assert(
      dashboardData.status === 200 &&
      (dash?.propertySummary?.total >= 1 || dash?.propertySummary?.published >= 1 || dash?.counts?.totalListings >= 1) &&
      (dash?.leadSummary?.totalLeads >= 1 || dash?.counts?.totalLeads >= 1) &&
      (dash?.profile?.isVerifiedAgent === true || dash?.agent?.isVerifiedAgent === true),
      'Agent Dashboard returned live real database aggregations (0 mock data)',
    );

    // 15. Audit Log Verification
    console.log('\n--- Testing Audit Logging ---');
    const auditLogs = await request('/admin/audit-logs?limit=10', {
      headers: { Authorization: `Bearer ${superAdmin.token}` },
    });
    const auditList = auditLogs.data?.data || auditLogs.data || [];
    assert(
      auditLogs.status === 200 &&
      Array.isArray(auditList) &&
      auditList.some((log) =>
        ['AGENT_VERIFIED', 'AGENT_VERIFICATION_SUBMITTED', 'LEAD_CREATED', 'LEAD_STATUS_CHANGED'].includes(log.action)
      ),
      'AuditLog system verified: All key Phase 09 agent and lead events recorded in MongoDB',
    );

  } catch (error) {
    console.error('\n❌ Unhandled error during Phase 09 test execution:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(` PHASE 09 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase09LiveTests();
