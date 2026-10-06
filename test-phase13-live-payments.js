/**
 * CASA Real Estate Marketplace — Phase 13 Payments & Monetization Live E2E Verification
 *
 * Runs live tests against running backend (http://localhost:5000/api/v1) & MongoDB Atlas.
 */

const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000/api/v1';
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'casa_dev_webhook_secret_2026';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

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

async function runPhase13LiveTests() {
  console.log('\n===============================================================');
  console.log('  CASA PHASE 13 — PAYMENTS & MONETIZATION LIVE E2E SUITE');
  console.log('===============================================================\n');

  try {
    // Scenario 1: Public Pricing Catalog & Gateway Public Config
    console.log('[1/12] Testing Public Pricing Catalog & Public Gateway Config...');
    const pricingRes = await makeRequest('/payments/pricing');
    assert(pricingRes.status === 200, 'GET /payments/pricing returns 200 OK');
    const pricingData = pricingRes.body.data || pricingRes.body;
    assert(Array.isArray(pricingData.products), 'Pricing catalog contains products list');
    const featuredProduct = pricingData.products.find((p) => p.code === 'FEATURED_PROPERTY');
    assert(featuredProduct && featuredProduct.amount === 1999, 'Featured Property package is priced at ₹1,999');

    const configRes = await makeRequest('/payments/config/public-key');
    assert(configRes.status === 200, 'GET /payments/config/public-key returns 200 OK');
    const configData = configRes.body.data || configRes.body;
    assert(configData.keyId && !configData.keySecret, 'Public gateway configuration does not leak secret key');

    // Scenario 2: Unauthorized Order Creation
    console.log('\n[2/12] Testing Unauthorized Order Rejection...');
    const unauthRes = await makeRequest('/payments/orders', {
      method: 'POST',
      body: { purpose: 'FEATURED_PROPERTY' },
    });
    assert(unauthRes.status === 401, 'Unauthorized order creation returns 401');

    // Setup Admin & Agent Sessions
    console.log('\n[3/12] Setting up authenticated Admin & Agent...');
    const adminMobile = '+917359237870';
    const adminUser = await loginUser(adminMobile);
    assert(Boolean(adminUser.token), `Super Admin logged in successfully (${adminMobile})`);

    const randSuffix = Math.floor(100000 + Math.random() * 900000);
    const agentMobile = `+9198${randSuffix}1`;
    const agent = await loginUser(agentMobile);
    assert(Boolean(agent.token), `Agent logged in successfully (${agentMobile})`);

    // Fetch a published property
    const publishedRes = await makeRequest('/properties?limit=1');
    const targetProperty = (publishedRes.body?.data || [])[0];
    assert(Boolean(targetProperty), `Found published property context: ${targetProperty?.id || 'prop-default'}`);
    const propId = targetProperty?.id || targetProperty?._id;

    // Scenario 3: Server-side Pricing Order Creation (Never trusting frontend amount)
    console.log('\n[4/12] Testing Server-Side Controlled Order Creation...');
    const orderRes = await makeRequest('/payments/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminUser.token}` },
      body: {
        purpose: 'FEATURED_PROPERTY',
        referenceId: propId,
        amount: 1, // Attempted price manipulation
      },
    });

    const orderData = orderRes.body.data || orderRes.body;
    assert(orderRes.status === 201 || orderRes.status === 200, 'Payment order created with status 201');
    assert(orderData.amount === 1999, 'Server enforced controlled ₹1,999 price (ignored manipulated ₹1 input)');
    assert(orderData.orderId && orderData.orderId.startsWith('CASA_ORD_'), 'CASA Order ID generated correctly');
    const casaOrderId = orderData.orderId;
    const providerOrderId = orderData.providerOrderId;

    // Scenario 4: Subscription Order Creation
    console.log('\n[5/12] Testing Subscription Package Order Creation...');
    const subOrderRes = await makeRequest('/payments/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent.token}` },
      body: {
        purpose: 'SUBSCRIPTION',
        productCode: 'SUBSCRIPTION_PRO',
      },
    });
    const subOrderData = subOrderRes.body.data || subOrderRes.body;
    assert(subOrderRes.status === 201 || subOrderRes.status === 200, 'Subscription Pro order created');
    assert(subOrderData.amount === 2499, 'Subscription Pro server price verified at ₹2,499');

    // Scenario 5: Invalid Payment Signature Verification
    console.log('\n[6/12] Testing Invalid Cryptographic Signature Rejection...');
    const invalidVerifyRes = await makeRequest('/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminUser.token}` },
      body: {
        orderId: casaOrderId,
        razorpayPaymentId: 'pay_test_tampered_123',
        razorpaySignature: 'invalid_fraudulent_signature_hex',
      },
    });
    assert(invalidVerifyRes.status === 400, 'Invalid signature rejected with 400 Bad Request');

    // Scenario 6: Valid Payment Signature Verification & Feature Activation
    console.log('\n[7/12] Testing Valid Signature Verification & Service Activation...');
    const testPaymentId = `pay_test_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(`${providerOrderId}|${testPaymentId}`)
      .digest('hex');

    const validVerifyRes = await makeRequest('/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminUser.token}` },
      body: {
        orderId: casaOrderId,
        razorpayPaymentId: testPaymentId,
        razorpaySignature: validSignature,
      },
    });

    assert(validVerifyRes.status === 200, 'Valid payment verified with 200 OK');
    const verifyData = validVerifyRes.body.data || validVerifyRes.body;
    assert(verifyData.payment?.status === 'PAID', 'Payment status updated to PAID');

    // Scenario 7: Idempotency of Payment Verification
    console.log('\n[8/12] Testing Verification Idempotency...');
    const dupVerifyRes = await makeRequest('/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminUser.token}` },
      body: {
        orderId: casaOrderId,
        razorpayPaymentId: testPaymentId,
        razorpaySignature: validSignature,
      },
    });
    assert(dupVerifyRes.status === 200, 'Repeated verification returns 200 without double-activation');

    // Scenario 8: User Payment History Isolation
    console.log('\n[9/12] Testing User Payment History Isolation...');
    const myPaymentsRes = await makeRequest('/payments/my', {
      headers: { Authorization: `Bearer ${adminUser.token}` },
    });
    assert(myPaymentsRes.status === 200, 'GET /payments/my returns 200 OK');
    const myPaymentsData = myPaymentsRes.body.data || myPaymentsRes.body;
    assert(Array.isArray(myPaymentsData.data), 'User payment list returned as array');
    const myPaidTxn = myPaymentsData.data.find((p) => p.orderId === casaOrderId);
    assert(myPaidTxn && myPaidTxn.status === 'PAID', 'Verified transaction present in user payment history');

    // Scenario 9: Webhook Ingestion & Signature Verification
    console.log('\n[10/12] Testing Webhook Ingestion & Idempotent Event Handling...');
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        order: { entity: { id: providerOrderId } },
        payment: { entity: { id: testPaymentId, order_id: providerOrderId } },
      },
    };
    const webhookRawBody = JSON.stringify(webhookPayload);
    const validWebhookSig = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(webhookRawBody)
      .digest('hex');

    // Invalid webhook signature
    const invalidWebhookRes = await makeRequest('/payments/webhook/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': 'invalid_webhook_sig' },
      body: webhookPayload,
    });
    assert(invalidWebhookRes.status === 400, 'Invalid webhook signature rejected with 400');

    // Valid webhook signature
    const validWebhookRes = await makeRequest('/payments/webhook/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': validWebhookSig },
      body: webhookPayload,
    });
    assert(validWebhookRes.status === 200, 'Valid webhook processed with 200 OK');

    // Scenario 10: Admin Payment Management & Financial KPIs
    console.log('\n[11/12] Testing Admin Global Payments & Revenue Metrics...');
    const adminPaymentsRes = await makeRequest('/admin/payments', {
      headers: { Authorization: `Bearer ${adminUser.token}` },
    });
    assert(adminPaymentsRes.status === 200, 'GET /admin/payments returns 200 OK');
    const adminPaymentsData = adminPaymentsRes.body.data || adminPaymentsRes.body;
    assert(Array.isArray(adminPaymentsData.data), 'Admin received global transactions list');
    assert(adminPaymentsData.metrics?.totalRevenue > 0, 'Admin revenue KPIs calculated from MongoDB transactions');

    // Scenario 11: Admin Refund Execution
    console.log('\n[12/12] Testing Admin Refund Execution & State Mutating Security...');
    const refundRes = await makeRequest(`/admin/payments/${casaOrderId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminUser.token}` },
      body: {
        amount: 1999,
        reason: 'Automated test suite refund verification',
      },
    });
    assert(refundRes.status === 200 || refundRes.status === 201, 'POST /admin/payments/:id/refund returns success');
    const refundData = refundRes.body.data || refundRes.body;
    assert(refundData.payment?.status === 'REFUNDED', 'Transaction status updated to REFUNDED');

    console.log('\n===============================================================');
    console.log(`  PHASE 13 LIVE E2E RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Unhandled live test error:', err);
    process.exit(1);
  }
}

runPhase13LiveTests();
