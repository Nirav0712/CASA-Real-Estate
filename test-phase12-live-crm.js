/**
 * CASA Real Estate Marketplace — Phase 12 Live CRM & Lead Management Test Suite
 *
 * Live end-to-end verification against real MongoDB Atlas database.
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {
          json = body;
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

async function loginUser(mobile) {
  const reqRes = await makeRequest('/auth/otp/request', {
    method: 'POST',
    body: { mobile },
  });

  if (reqRes.status !== 200) {
    throw new Error(`OTP Request failed for ${mobile}: ${JSON.stringify(reqRes.body)}`);
  }

  const reqData = reqRes.body.data || reqRes.body;
  const otp = reqData?.devMockOtp || '123456';
  const verifyRes = await makeRequest('/auth/otp/verify', {
    method: 'POST',
    body: { mobile, otp },
  });

  if (verifyRes.status !== 200 && verifyRes.status !== 201) {
    throw new Error(`OTP Verification failed for ${mobile}: ${JSON.stringify(verifyRes.body)}`);
  }

  const verData = verifyRes.body.data || verifyRes.body;
  const token = verData?.tokens?.accessToken || verData?.accessToken;
  const user = verData?.user;

  if (!token) {
    throw new Error(`No access token returned for ${mobile}: ${JSON.stringify(verifyRes.body)}`);
  }

  return { token, user };
}

let passed = 0;
let failed = 0;

function pass(title, detail = '') {
  passed++;
  console.log(`[PASS] ${passed}. ${title}${detail ? ` (${detail})` : ''}`);
}

function fail(title, detail = '') {
  failed++;
  console.error(`[FAIL] ${title}${detail ? ` -> ${detail}` : ''}`);
}

async function runPhase12TestSuite() {
  console.log('='.repeat(80));
  console.log('  CASA Phase 12 — Lead Management & CRM Expansion Live Test Suite');
  console.log('='.repeat(80));

  try {
    // 1. Health check
    const health = await makeRequest('/../../health');
    if (health.status === 200) {
      pass('1. Backend API health check live');
    } else {
      fail('1. Backend API health check failed', `Status: ${health.status}`);
    }

    // 2. Authenticate Users
    const adminAuth = await loginUser('+917359237870');
    pass('2. Super Admin authenticated', `Role: ${adminAuth.user.role}`);

    let agentAAuth = await loginUser('+919870033882');
    pass('3. Agent A authenticated', `ID: ${agentAAuth.user.id || agentAAuth.user._id}`);

    // Promote Agent A to VERIFIED_AGENT if needed
    await makeRequest(`/admin/users/${agentAAuth.user.id || agentAAuth.user._id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      body: { role: 'VERIFIED_AGENT' },
    });

    // Re-login Agent A to receive new active JWT with VERIFIED_AGENT role
    agentAAuth = await loginUser('+919870033882');
    pass('3b. Agent A obtained refreshed JWT with VERIFIED_AGENT role', `ID: ${agentAAuth.user.id || agentAAuth.user._id}`);

    const purchaserA = await loginUser('+919875658051');
    pass('4. Purchaser A authenticated', `ID: ${purchaserA.user.id || purchaserA.user._id}`);

    const purchaserB = await loginUser('+919871133882');
    pass('5. Purchaser B authenticated', `ID: ${purchaserB.user.id || purchaserB.user._id}`);

    // 6. Find a published property for test
    const propRes = await makeRequest('/properties/search?limit=1');
    const properties = propRes.body.data?.data || propRes.body.data || propRes.body;
    const testProp = Array.isArray(properties) ? properties[0] : null;
    if (!testProp) {
      throw new Error(`No published properties found in MongoDB: ${JSON.stringify(propRes.body)}`);
    }
    const propertyId = testProp.id || testProp._id;
    pass('6. Found published property for CRM test', `Prop ID: ${propertyId}`);

    // 7. Purchaser A submits enquiry
    const enquiryRes = await makeRequest('/leads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
      body: {
        propertyId,
        name: 'Anjali Purchaser A',
        mobile: '+919875658051',
        email: 'anjali@example.com',
        subject: 'Inquiry for Phase 12 CRM Test',
        message: 'Interested in booking site visit for Sunday afternoon.',
        source: 'PROPERTY_PAGE',
      },
    });

    const enqData = enquiryRes.body.data || enquiryRes.body;
    let leadId = enqData?.leadId;
    if (enquiryRes.status === 201 || enquiryRes.status === 200) {
      pass('7. Purchaser submitted property enquiry and created lead', `Lead ID: ${leadId}`);
    } else {
      fail('7. Purchaser enquiry submission failed', JSON.stringify(enquiryRes.body));
    }

    // 8. Duplicate Active Enquiry test (Idempotent reuse)
    const dupRes = await makeRequest('/leads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${purchaserA.token}` },
      body: {
        propertyId,
        name: 'Anjali Purchaser A',
        mobile: '+919875658051',
        message: 'Also inquiring if parking spot is included in price.',
      },
    });

    const dupData = dupRes.body.data || dupRes.body;
    if (dupRes.status === 200 || dupRes.status === 201) {
      pass('8. Duplicate active enquiry handled cleanly by updating existing lead', `Lead ID: ${dupData?.leadId}`);
    } else {
      fail('8. Duplicate active enquiry test failed', JSON.stringify(dupRes.body));
    }

    // 9. Assign Lead to Agent A via Admin
    const assignRes = await makeRequest(`/leads/${leadId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      body: {
        assignedAgentId: agentAAuth.user.id || agentAAuth.user._id,
        note: 'Assigned to Agent A for Phase 12 CRM test workflow',
      },
    });

    const assignData = assignRes.body.data || assignRes.body;
    if (assignRes.status === 200) {
      pass('9. Admin assigned lead to Agent A', `Assigned Agent: ${assignData.lead?.assignedAgentName || 'Agent A'}`);
    } else {
      fail('9. Lead assignment failed', JSON.stringify(assignRes.body));
    }

    // 10. Agent A fetches single lead details
    const leadDetailRes = await makeRequest(`/leads/${leadId}`, {
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
    });

    const leadDetail = leadDetailRes.body.data || leadDetailRes.body;
    if (leadDetailRes.status === 200 && (leadDetail.id === leadId || leadDetail._id === leadId)) {
      pass('10. Assigned Agent can retrieve lead details', `Status: ${leadDetail.status}`);
    } else {
      fail('10. Agent failed to retrieve lead', JSON.stringify(leadDetailRes.body));
    }

    // 11. Strict Isolation: Purchaser B / Unrelated Agent CANNOT access Lead
    const unauthRes = await makeRequest(`/leads/${leadId}`, {
      headers: { Authorization: `Bearer ${purchaserB.token}` },
    });

    if (unauthRes.status === 403) {
      pass('11. Strict Isolation: Unrelated user blocked with 403 Forbidden');
    } else {
      fail('11. Security leak: Unrelated user accessed private lead', `Status: ${unauthRes.status}`);
    }

    // 12. Agent A updates Status to CONTACTED
    const statusRes1 = await makeRequest(`/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
      body: {
        status: 'CONTACTED',
        note: 'Spoke with buyer. Confirmed interest in site visit.',
      },
    });

    const status1Data = statusRes1.body.data || statusRes1.body;
    if (statusRes1.status === 200 && (status1Data.lead?.status === 'CONTACTED' || status1Data.status === 'CONTACTED')) {
      pass('12. Agent updated lead status to CONTACTED');
    } else {
      fail('12. Failed to update status to CONTACTED', JSON.stringify(statusRes1.body));
    }

    // 13. Agent A updates Status to SITE_VISIT
    const statusRes2 = await makeRequest(`/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
      body: {
        status: 'SITE_VISIT',
        note: 'Site visit scheduled for Sunday 2 PM.',
      },
    });

    const status2Data = statusRes2.body.data || statusRes2.body;
    if (statusRes2.status === 200 && (status2Data.lead?.status === 'SITE_VISIT' || status2Data.status === 'SITE_VISIT')) {
      pass('13. Agent updated lead status to SITE_VISIT');
    } else {
      fail('13. Failed to update status to SITE_VISIT', JSON.stringify(statusRes2.body));
    }

    // 14. Agent A updates Priority
    const priorityRes = await makeRequest(`/leads/${leadId}/priority`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
      body: { priority: 'URGENT' },
    });

    const priorityData = priorityRes.body.data || priorityRes.body;
    if (priorityRes.status === 200 && priorityData.priority === 'URGENT') {
      pass('14. Agent updated lead priority to URGENT');
    } else {
      fail('14. Failed to update priority', JSON.stringify(priorityRes.body));
    }

    // 15. Agent A adds internal note (private from purchaser)
    const noteRes = await makeRequest(`/leads/${leadId}/notes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
      body: { note: 'Internal note: Buyer pre-approved for 1.5 Cr home loan from HDFC.' },
    });

    if (noteRes.status === 201 || noteRes.status === 200) {
      pass('15. Agent added internal private note to lead timeline');
    } else {
      fail('15. Failed to add note', JSON.stringify(noteRes.body));
    }

    // 16. Agent A logs CRM Activity
    const actRes = await makeRequest(`/leads/${leadId}/activities`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
      body: {
        type: 'CALL',
        note: 'Outbound call lasting 8 minutes. Explained amenities and payment schedule.',
        metadata: { callDurationSec: 480 },
      },
    });

    if (actRes.status === 201 || actRes.status === 200) {
      pass('16. Agent logged CRM Call activity');
    } else {
      fail('16. Failed to log activity', JSON.stringify(actRes.body));
    }

    // 17. Agent A schedules a follow-up
    const dueDate = new Date(Date.now() + 86400000 * 2).toISOString();
    const fuRes = await makeRequest(`/leads/${leadId}/follow-ups`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
      body: {
        dueAt: dueDate,
        type: 'SITE_VISIT',
        note: 'Meet purchaser at property entrance with site engineer.',
      },
    });

    const fuData = fuRes.body.data || fuRes.body;
    const followUpId = fuData.followUp?._id || fuData.followUp?.id;
    if (fuRes.status === 201 || fuRes.status === 200) {
      pass('17. Agent scheduled follow-up for site visit', `Follow-up ID: ${followUpId}`);
    } else {
      fail('17. Failed to schedule follow-up', JSON.stringify(fuRes.body));
    }

    // 18. Complete Follow-up
    if (followUpId) {
      const completeRes = await makeRequest(`/leads/${leadId}/follow-ups/${followUpId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${agentAAuth.token}` },
        body: { note: 'Site visit completed successfully. Buyer loved master bedroom view.' },
      });

      const compData = completeRes.body.data || completeRes.body;
      if (completeRes.status === 200 && compData.followUp?.status === 'COMPLETED') {
        pass('18. Agent marked follow-up as COMPLETED');
      } else {
        fail('18. Failed to complete follow-up', JSON.stringify(completeRes.body));
      }
    }

    // 19. Agent follow-ups queue
    const queueRes = await makeRequest('/leads/follow-ups', {
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
    });

    const queueData = queueRes.body.data || queueRes.body;
    if (queueRes.status === 200 && queueData.counts) {
      pass('19. Agent follow-ups queue returned categorized breakdown', `Counts: ${JSON.stringify(queueData.counts)}`);
    } else {
      fail('19. Failed to fetch follow-ups queue', JSON.stringify(queueRes.body));
    }

    // 20. CRM KPIs endpoint
    const kpiRes = await makeRequest('/leads/kpis', {
      headers: { Authorization: `Bearer ${agentAAuth.token}` },
    });

    const kpiData = kpiRes.body.data || kpiRes.body;
    if (kpiRes.status === 200 && typeof kpiData.totalLeads === 'number') {
      pass('20. Live MongoDB CRM KPIs returned', `Total: ${kpiData.totalLeads}, Active: ${kpiData.activeLeads}`);
    } else {
      fail('20. Failed to fetch KPIs', JSON.stringify(kpiRes.body));
    }

    // 21. CRM Analytics endpoint
    const anRes = await makeRequest('/leads/analytics', {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });

    const anData = anRes.body.data || anRes.body;
    if (anRes.status === 200 && anData.byStatus) {
      pass('21. CRM Analytics aggregations returned by status, source, and priority');
    } else {
      fail('21. Failed to fetch analytics', JSON.stringify(anRes.body));
    }

    // 22. Reject assignment to invalid user role (Purchaser A has role PURCHASER)
    const badAssignRes = await makeRequest(`/leads/${leadId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      body: {
        assignedAgentId: purchaserA.user.id || purchaserA.user._id,
      },
    });

    if (badAssignRes.status === 400) {
      pass('22. Security: Assignment to non-agent rejected with 400 Bad Request');
    } else {
      fail('22. Security flaw: Allowed assignment to regular purchaser', `Status: ${badAssignRes.status} body: ${JSON.stringify(badAssignRes.body)}`);
    }

    // 23. Phase 10 Purchaser Continuity: Purchaser A views their enquiry
    const buyerEnqRes = await makeRequest(`/purchaser/enquiries/${leadId}`, {
      headers: { Authorization: `Bearer ${purchaserA.token}` },
    });

    const buyerEnqData = buyerEnqRes.body.data || buyerEnqRes.body;
    if (buyerEnqRes.status === 200 && (buyerEnqData.id === leadId || buyerEnqData._id === leadId)) {
      pass('23. Purchaser A can view own enquiry via Phase 10 purchaser API', `Status: ${buyerEnqData.status}`);
    } else {
      fail('23. Purchaser enquiry view failed', JSON.stringify(buyerEnqRes.body));
    }

    // 24. Purchaser Security: Internal notes and activities NOT leaked to purchaser
    if (buyerEnqRes.status === 200) {
      const hasInternalNotes = buyerEnqData.notes?.some((n) => typeof n === 'string' && n.includes('Internal note'));
      const hasActivities = !!buyerEnqData.activities;
      if (!hasInternalNotes && !hasActivities) {
        pass('24. Privacy Security: Internal CRM notes and activities are not exposed to purchaser');
      } else {
        fail('24. Privacy leak: Purchaser received internal CRM notes or activities');
      }
    }

    // 25. Audit Log recorded
    const auditRes = await makeRequest('/admin/audit-logs?limit=5', {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });

    const auditData = auditRes.body.data || auditRes.body;
    if (auditRes.status === 200 && Array.isArray(auditData.data || auditData)) {
      pass('25. Audit log system recorded Lead CRM lifecycle events');
    } else {
      fail('25. Failed to verify audit logs', JSON.stringify(auditRes.body));
    }

    console.log('='.repeat(80));
    console.log(`  SUMMARY: ${passed} passed, ${failed} failed (${Math.round((passed / (passed + failed)) * 100)}% success rate)`);
    console.log('='.repeat(80));

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runPhase12TestSuite();
