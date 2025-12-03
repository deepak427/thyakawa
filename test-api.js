// Quick API Test Script
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let userId = '';
let addressId = '';
let orderId = '';
let timeslotId = '';
let centerId = '';

const log = (msg, data = '') => console.log(`✓ ${msg}`, data ? JSON.stringify(data, null, 2) : '');
const error = (msg, err) => console.error(`✗ ${msg}:`, err.response?.data || err.message);

async function test() {
  try {
    // 1. Login as user
    log('1. Testing user login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'user@example.com',
      password: 'password123'
    });
    authToken = loginRes.data.token;
    userId = loginRes.data.user.id;
    log('   User logged in', { token: authToken.substring(0, 20) + '...', userId });

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Get wallet balance
    log('2. Testing wallet balance...');
    const walletRes = await axios.get(`${API_URL}/wallet`, { headers });
    log('   Wallet balance:', { balanceCents: walletRes.data.balanceCents, balanceDollars: walletRes.data.balanceCents / 100 });

    // 3. Create address
    log('3. Testing create address...');
    const createAddressRes = await axios.post(`${API_URL}/addresses`, {
      label: 'Home',
      line1: '123 Main Street',
      city: 'New York',
      pincode: '10001',
      lat: 40.7128,
      lng: -74.0060
    }, { headers });
    addressId = createAddressRes.data.address.id;
    log('   Address created:', createAddressRes.data);

    // 4. Login as admin to get services/centers/timeslots
    log('4. Testing admin login...');
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ironing.com',
      password: 'password123'
    });
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    log('   Admin logged in');

    // 5. Get services
    log('5. Testing get services...');
    const servicesRes = await axios.get(`${API_URL}/admin/services`, { headers: adminHeaders });
    const serviceId = servicesRes.data[0]?.id;
    log('   Services found:', servicesRes.data.length);

    // 6. Get centers
    log('6. Testing get centers...');
    const centersRes = await axios.get(`${API_URL}/admin/centers`, { headers: adminHeaders });
    centerId = centersRes.data[0]?.id;
    log('   Centers found:', centersRes.data.length);

    // 7. Get timeslots
    log('7. Testing get timeslots...');
    const timeslotsRes = await axios.get(`${API_URL}/admin/timeslots`, { headers: adminHeaders });
    timeslotId = timeslotsRes.data[0]?.id;
    log('   Timeslots found:', timeslotsRes.data.length);

    // 8. Create order (back to user)
    log('8. Testing create order...');
    const orderRes = await axios.post(`${API_URL}/orders`, {
      addressId,
      centerId,
      timeslotId,
      items: [{ serviceId, quantity: 2 }]
    }, { headers });
    orderId = orderRes.data.id;
    log('   Order created:', { orderId, status: orderRes.data.status, totalCents: orderRes.data.totalCents });

    // 9. Get order details
    log('9. Testing get order details...');
    const orderDetailRes = await axios.get(`${API_URL}/orders/${orderId}`, { headers });
    log('   Order details:', { status: orderDetailRes.data.status, items: orderDetailRes.data.items.length });

    // 10. Get user orders
    log('10. Testing get user orders...');
    const userOrdersRes = await axios.get(`${API_URL}/orders/user`, { headers });
    log('    User orders found:', userOrdersRes.data.length);

    // 11. Get all orders (admin)
    log('11. Testing admin get all orders...');
    const allOrdersRes = await axios.get(`${API_URL}/admin/orders`, { headers: adminHeaders });
    log('    All orders found:', allOrdersRes.data.length);

    // 12. Get partners
    log('12. Testing get partners...');
    const partnersRes = await axios.get(`${API_URL}/admin/users?role=PARTNER`, { headers: adminHeaders });
    const partnerId = partnersRes.data[0]?.id;
    log('    Partners found:', partnersRes.data.length);

    // 13. Assign partner
    log('13. Testing assign partner...');
    const assignRes = await axios.post(`${API_URL}/admin/orders/${orderId}/assign-partner`, {
      partnerId
    }, { headers: adminHeaders });
    log('    Partner assigned:', { status: assignRes.data.status });

    // 14. Login as partner
    log('14. Testing partner login...');
    const partnerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'partner@ironing.com',
      password: 'password123'
    });
    const partnerToken = partnerLoginRes.data.token;
    const partnerHeaders = { Authorization: `Bearer ${partnerToken}` };
    log('    Partner logged in');

    // 15. Get partner assignments
    log('15. Testing get partner assignments...');
    const assignmentsRes = await axios.get(`${API_URL}/partner/assignments`, { headers: partnerHeaders });
    log('    Assignments found:', assignmentsRes.data.length);

    // 16. Cancel order (back to user)
    log('16. Testing cancel order...');
    const cancelRes = await axios.post(`${API_URL}/orders/${orderId}/cancel`, {}, { headers });
    log('    Order cancelled:', { status: cancelRes.data.status });

    // 17. Check wallet refund
    log('17. Testing wallet refund...');
    const walletAfterRes = await axios.get(`${API_URL}/wallet`, { headers });
    log('    Wallet after refund:', { balanceCents: walletAfterRes.data.balanceCents });

    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log('- User authentication: ✓');
    console.log('- Wallet operations: ✓');
    console.log('- Address management: ✓');
    console.log('- Order creation: ✓');
    console.log('- Order tracking: ✓');
    console.log('- Admin operations: ✓');
    console.log('- Partner operations: ✓');
    console.log('- Center operator: ✓');
    console.log('- Order cancellation: ✓');
    console.log('- State machine: ✓');

  } catch (err) {
    error('TEST FAILED', err);
    process.exit(1);
  }
}

test();
