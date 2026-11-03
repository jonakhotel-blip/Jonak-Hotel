const http = require('http');
const security = require('./security');

const BASE_URL = 'http://127.0.0.1:5000';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    const req = http.request(url, {
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Full-Stack Hotel & Restaurant Capability Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Delivery Calculation Tests
    console.log('Test 1: Server-Side Delivery Eligibility & Distance Calculator');
    
    // 1a: Near landmark (Donakuchi ~0.4 km) above min order
    const delivRes1 = await makeRequest('POST', '/api/delivery/calculate', {
      localityId: 'donakuchi',
      subtotal: 250,
      orderMode: 'Home Delivery'
    });
    assert(delivRes1.status === 200, 'Near delivery calculation returns HTTP 200');
    assert(delivRes1.data.eligible === true, 'Donakuchi is within delivery zone');
    assert(delivRes1.data.deliveryFee === 0, 'Delivery is 100% FREE within 5 KM for orders >= min order');
    assert(delivRes1.data.isFreeDelivery === true, 'isFreeDelivery flag is true');

    // 1b: Near landmark under min order (subtotal 150 < 199)
    const delivRes2 = await makeRequest('POST', '/api/delivery/calculate', {
      localityId: 'donakuchi',
      subtotal: 150,
      orderMode: 'Home Delivery'
    });
    assert(delivRes2.data.deliveryFee === 30, 'Nominal fee charged for orders under min order threshold');

    // 1c: Beyond free radius (Bhella Chariali ~8.0 km)
    const delivRes3 = await makeRequest('POST', '/api/delivery/calculate', {
      localityId: 'bhella',
      subtotal: 400,
      orderMode: 'Home Delivery'
    });
    assert(delivRes3.data.eligible === true, '8 KM is eligible under 15 KM max radius');
    assert(delivRes3.data.deliveryFee === 45, 'Distance fee computed: 3 extra KM * Rs 15 = Rs 45');

    // 1d: Outside delivery radius (Barpeta Road ~22 km)
    const delivRes4 = await makeRequest('POST', '/api/delivery/calculate', {
      localityId: 'barpeta_road',
      subtotal: 500,
      orderMode: 'Home Delivery'
    });
    assert(delivRes4.data.eligible === false, '22 KM exceeds 15 KM max delivery radius');

    // 2. Offers & Today's Special
    console.log('\nTest 2: Owner-Configured Today\'s Active Offers');
    const offersRes = await makeRequest('GET', '/api/offers');
    assert(offersRes.status === 200, 'Offers endpoint returns HTTP 200');
    assert(Array.isArray(offersRes.data), 'Returns array of active offers');
    assert(offersRes.data.length >= 1, 'Pre-configured verified offer present');

    const todayOfferRes = await makeRequest('GET', '/api/offers/today');
    assert(todayOfferRes.status === 200, 'Today\'s offer returns HTTP 200');
    assert(todayOfferRes.data.offer !== null, 'Today\'s active offer is present');
    assert(todayOfferRes.data.offer.code === 'ROYAL15', 'Offer code ROYAL15 verified');

    // 3. Food Order Placement & Idempotency
    console.log('\nTest 3: Food Order Placement with Server Validation & Idempotency');
    const testIdempotencyKey = `idem_${Date.now()}`;
    const orderPayload = {
      idempotencyKey: testIdempotencyKey,
      customerName: 'Pranjal Kalita',
      phone: '9864098765',
      mode: 'Home Delivery',
      address: 'Near Barpeta Satra, Ward 2, Barpeta Town',
      distanceKm: 3.8,
      deliveryFee: 0,
      items: [{ name: 'Jonak Special Dum Biriyani', qty: 2, price: 350 }],
      subtotal: 700,
      total: 700,
      payment: 'Cash on Delivery',
      paymentStatus: 'Pay on Delivery'
    };

    const orderRes1 = await makeRequest('POST', '/api/orders', orderPayload);
    assert(orderRes1.status === 201, 'Order created with HTTP 201');
    assert(typeof orderRes1.data.order.id === 'string', 'Generated order ID');
    const placedOrderId = orderRes1.data.order.id;

    // Send identical request with same idempotency key (must deduplicate)
    const orderResDup = await makeRequest('POST', '/api/orders', orderPayload);
    assert(orderResDup.status === 200, 'Duplicate request returned HTTP 200');
    assert(orderResDup.data.deduplicated === true, 'Order deduplication detected');
    assert(orderResDup.data.order.id === placedOrderId, 'Same order returned');

    // 4. Customer Order Tracking (Sanitized, No Other Customer PII)
    console.log('\nTest 4: Customer Order Status Tracking');
    const trackRes = await makeRequest('GET', `/api/orders/${placedOrderId}/track`);
    assert(trackRes.status === 200, 'Tracking returns HTTP 200');
    assert(trackRes.data.id === placedOrderId, 'Tracking matches order ID');
    assert(trackRes.data.customerName === 'Pranjal Kalita', 'Customer name present');
    assert(Array.isArray(trackRes.data.timeline), 'Status timeline present');
    assert(trackRes.data.supportPhone === '+91 96785 82286', 'Support contact present');

    // 5. Room Booking Date Conflict & Authoritative Inventory
    console.log('\nTest 5: Room Booking Inventory Source & Date Conflict Prevention');
    // Pick a unique far-future test window to avoid collision with existing persisted bookings
    const randomYearOffset = 2 + Math.floor(Math.random() * 10);
    const randomDayOffset = 1 + Math.floor(Math.random() * 300);
    const d1 = new Date();
    d1.setFullYear(d1.getFullYear() + randomYearOffset);
    d1.setDate(d1.getDate() + randomDayOffset);
    const d2 = new Date(d1);
    d2.setDate(d2.getDate() + 2);

    const checkInStr = d1.toISOString().split('T')[0];
    const checkOutStr = d2.toISOString().split('T')[0];

    const bookingPayload = {
      guestName: 'Anup Talukdar',
      phone: '9435012345',
      roomType: 'Suite Room (A/C)',
      roomId: 'suite-ac',
      roomNumber: '101',
      checkIn: checkInStr,
      checkOut: checkOutStr,
      nights: 2,
      guests: '2 Adults',
      baseTariff: 5000,
      baseTotal: 10000,
      gstPercent: 5,
      gstAmount: 500,
      totalTariff: 10500,
      paymentMethod: 'Pay on Arrival at Hotel Reception',
      paymentStatus: 'Pending (Pay at Check-in)'
    };

    const bkgRes1 = await makeRequest('POST', '/api/bookings', bookingPayload);
    assert(bkgRes1.status === 201, 'Booking 1 accepted with HTTP 201');
    assert(bkgRes1.data.booking.roomNumber === '101', 'Room 101 allocated');
    assert(bkgRes1.data.booking.status.includes('Request to confirm'), 'Status labeled "Request to confirm" as external PMS is unattached');
    const bkgId = bkgRes1.data.booking.id;

    // Booking 2 fills Room 102 in Suite category
    const booking2Payload = {
      ...bookingPayload,
      guestName: 'Second Suite Guest',
      roomNumber: '102'
    };
    const bkgRes2 = await makeRequest('POST', '/api/bookings', booking2Payload);
    assert(bkgRes2.status === 201, 'Booking 2 (Room 102) accepted with HTTP 201');

    // Attempt CONFLICTING booking when all physical rooms in Suite (101 & 102) are booked for these dates
    const conflictBookingPayload = {
      ...bookingPayload,
      guestName: 'Third Guest Overbook Attempt'
    };
    const bkgConflictRes = await makeRequest('POST', '/api/bookings', conflictBookingPayload);
    assert(bkgConflictRes.status === 409, 'Conflicting room booking rejected with HTTP 409');
    assert(bkgConflictRes.data.error.includes('booked for the selected dates'), 'Identifies date collision');

    // Customer Room Booking Tracking
    const bkgTrack = await makeRequest('GET', `/api/bookings/${bkgId}/track`);
    assert(bkgTrack.status === 200, 'Booking tracking returns HTTP 200');
    assert(bkgTrack.data.roomNumber === '101', 'Tracking confirms Room 101');
    assert(bkgTrack.data.isInstantConfirmed === false, 'Does not falsely claim instant confirmed without PMS');

    // 6. Razorpay Sandbox Integration
    console.log('\nTest 6: Razorpay Payment Sandbox & Signature Verification');
    const payOrderRes = await makeRequest('POST', '/api/payment/create-order', {
      amount: 700,
      currency: 'INR',
      receipt: `rcpt_${placedOrderId}`,
      orderType: 'FOOD'
    });
    assert(payOrderRes.status === 200, 'Create Razorpay order returns HTTP 200');
    assert(payOrderRes.data.mode === 'sandbox', 'Sandbox mode verified');
    assert(payOrderRes.data.amount === 70000, 'Paise calculation: Rs 700 * 100 = 70000');
    const rzpOrderId = payOrderRes.data.orderId;

    // Verify payment in test sandbox
    const testPaymentId = `pay_test_${Date.now()}`;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const testSignature = keySecret
      ? crypto.createHmac('sha256', keySecret).update(`${rzpOrderId}|${testPaymentId}`).digest('hex')
      : 'test_sandbox_signature';

    const verifyRes = await makeRequest('POST', '/api/payment/verify', {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: testSignature,
      internalId: placedOrderId,
      orderType: 'FOOD'
    });
    assert(verifyRes.status === 200, 'Payment verification returns HTTP 200');
    assert(verifyRes.data.success === true, 'Payment recorded successfully');

    // 7. Owner Authentication for Reports & Notification Logs
    console.log('\nTest 7: Owner Financial & Notification Audit Reports');
    const ownerStep1 = await makeRequest('POST', '/api/auth/login', {
      email: 'owner@jonakhotelgroup.in',
      password: 'JonakOwner#2026'
    });
    const ownerTotp = security.generateTOTP(ownerStep1.data.secret);
    const mfaRes = await makeRequest('POST', '/api/auth/mfa/verify', {
      tempToken: ownerStep1.data.tempToken,
      code: ownerTotp,
      isRecoveryCode: false
    });
    const ownerToken = mfaRes.data.token;
    const ownerCsrf = mfaRes.data.csrfToken;

    // Financial Reports (Separating Gross, Discounts, Taxes, Net)
    const reportRes = await makeRequest('GET', '/api/admin/reports/financial', null, {
      'Authorization': `Bearer ${ownerToken}`,
      'X-CSRF-Token': ownerCsrf
    });
    assert(reportRes.status === 200, 'Financial report returns HTTP 200');
    assert(typeof reportRes.data.summary.combinedGross === 'number', 'Gross sales separated');
    assert(typeof reportRes.data.summary.totalDiscountsGiven === 'number', 'Discounts separated');
    assert(typeof reportRes.data.summary.totalTaxesAndFees === 'number', 'Taxes and fees separated');
    assert(typeof reportRes.data.summary.combinedNetRevenue === 'number', 'Net revenue separated');
    assert(typeof reportRes.data.foodOperations === 'object', 'Food operations breakdown present');
    assert(typeof reportRes.data.roomOperations === 'object', 'Room operations breakdown present');

    // Notification Outbox
    const notifRes = await makeRequest('GET', '/api/admin/notifications', null, {
      'Authorization': `Bearer ${ownerToken}`,
      'X-CSRF-Token': ownerCsrf
    });
    assert(notifRes.status === 200, 'Notification outbox returns HTTP 200');
    assert(Array.isArray(notifRes.data.outbox), 'Outbox entries logged');
    assert(notifRes.data.providerStatus.smsProvider === 'PENDING_OWNER_CREDENTIALS', 'Explicitly marks unconfigured SMS provider as pending');

    console.log(`\n🎉 ALL ${passed}/${total} FULL-STACK END-TO-END CAPABILITY TESTS PASSED!`);
  } catch (err) {
    console.error('\n❌ E2E Test suite failed:', err);
    process.exit(1);
  }
}

runTests();
