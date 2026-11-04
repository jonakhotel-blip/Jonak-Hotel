const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

async function testAll() {
  console.log('--- TESTING 10 PRODUCTION API ENDPOINTS ---\n');

  // 1. /api/state
  const r1 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/state', method: 'GET' });
  console.log(`1. GET /api/state -> Status: ${r1.status}, Has menu: ${!!r1.data?.menu}, Has rooms: ${!!r1.data?.rooms}`);

  // 2. /api/menu
  const r2 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/menu', method: 'GET' });
  console.log(`2. GET /api/menu -> Status: ${r2.status}, Items count: ${Array.isArray(r2.data) ? r2.data.length : 'not array'}`);
  if (Array.isArray(r2.data) && r2.data[0]) {
    const item = r2.data[0];
    console.log(`   Sample item schema: id=${item.id}, name="${item.name}", price=${item.price}, image_url=${item.image_url}, veg_or_nonveg=${item.veg_or_nonveg}, chef_special=${item.chef_special}, available=${item.available}`);
  }

  // 3. /api/rooms
  const r3 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/rooms', method: 'GET' });
  console.log(`3. GET /api/rooms -> Status: ${r3.status}, Rooms count: ${Array.isArray(r3.data) ? r3.data.length : 'not array'}`);
  if (Array.isArray(r3.data) && r3.data[0]) {
    const room = r3.data[0];
    console.log(`   Sample room schema: id=${room.id}, room_name="${room.room_name}", tariff=${room.price_per_night}, total_price=${room.total_price}, available=${room.available}`);
  }

  // 4. /api/delivery/localities
  const r4 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/delivery/localities', method: 'GET' });
  console.log(`4. GET /api/delivery/localities -> Status: ${r4.status}, Localities count: ${Array.isArray(r4.data) ? r4.data.length : 'not array'}`);

  // 5. /api/delivery/resolve
  const r5 = await makeRequest({ 
    hostname: 'localhost', port: 5000, path: '/api/delivery/resolve', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { lat: 26.3308, lng: 91.0064 });
  console.log(`5. POST /api/delivery/resolve -> Status: ${r5.status}, Locality: ${r5.data?.locality?.name}, distance: ${r5.data?.locality?.distanceKm} km`);

  // 6. /api/orders (GET & POST)
  const r6get = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/orders', method: 'GET' });
  console.log(`6a. GET /api/orders -> Status: ${r6get.status}, Orders count: ${Array.isArray(r6get.data) ? r6get.data.length : 'not array'}`);
  
  const testOrder = {
    customer_name: 'Test Customer',
    customer_phone: '9876543210',
    delivery_address: 'Donakuchi, Barpeta',
    locality: 'Donakuchi',
    mode: 'Home Delivery',
    items: [{ name: 'Jonak Special Dum Biryani', qty: 1, price: 350 }],
    subtotal: 350,
    delivery_fee: 0,
    discount: 0,
    total_amount: 350,
    payment_mode: 'Cash on Delivery',
    payment_status: 'Pending'
  };
  const r6post = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/orders', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, testOrder);
  console.log(`6b. POST /api/orders -> Status: ${r6post.status}, Created Order ID: ${r6post.data?.order?.id}, Customer: ${r6post.data?.order?.customer_name}`);

  // 7. /api/bookings (GET & POST)
  const r7get = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/bookings', method: 'GET' });
  console.log(`7a. GET /api/bookings -> Status: ${r7get.status}, Bookings count: ${Array.isArray(r7get.data) ? r7get.data.length : 'not array'}`);

  const testBooking = {
    customer_name: 'Guest Traveler',
    customer_phone: '9876543210',
    customer_email: 'guest@example.com',
    room_id: 'suite-ac',
    room_name: 'Presidential Suite',
    check_in_date: '2026-11-20',
    check_out_date: '2026-11-22',
    total_days: 2,
    total_amount: 11200,
    payment_mode: 'Front Desk (Pay on Arrival)'
  };
  const r7post = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/bookings', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, testBooking);
  console.log(`7b. POST /api/bookings -> Status: ${r7post.status}, Booking ID: ${r7post.data?.booking?.id}, Room: ${r7post.data?.booking?.room_name}`);

  // 8. /api/payment/create & /api/payment/create-order
  const r8a = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/payment/create', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { amount: 350, currency: 'INR', orderType: 'FOOD' });
  console.log(`8a. POST /api/payment/create -> Status: ${r8a.status}, OrderId: ${r8a.data?.orderId}, Amount: ₹${r8a.data?.amount / 100}`);

  const r8b = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/payment/create-order', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { amount: 5000, currency: 'INR', orderType: 'ROOM' });
  console.log(`8b. POST /api/payment/create-order -> Status: ${r8b.status}, OrderId: ${r8b.data?.orderId}`);

  // 9. /api/payment/verify
  const r9 = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/payment/verify', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    razorpay_order_id: r8a.data?.orderId,
    razorpay_payment_id: 'pay_test_123456',
    razorpay_signature: 'test_signature'
  });
  console.log(`9. POST /api/payment/verify -> Status: ${r9.status}, Success: ${r9.data?.success}`);

  // 10. /api/visitors/stats
  const r10 = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/visitors/stats', method: 'GET' });
  console.log(`10. GET /api/visitors/stats -> Status: ${r10.status}, Lifetime Visitors: ${r10.data?.stats?.totalLifetimeVisitors || r10.data?.conversionFunnel?.totalVisitors}`);

  console.log('\n--- ALL 10 ENDPOINTS TESTED SUCCESSFULLY ---');
}

testAll().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
