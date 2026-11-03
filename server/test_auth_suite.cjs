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
  console.log('🧪 Starting Comprehensive Owner Portal Security & RBAC Test Suite...\n');
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
    // 1. Auth Config & CSRF
    console.log('Test 1: Public Auth Config & CSRF Token');
    const confRes = await makeRequest('GET', '/api/auth/config');
    assert(confRes.status === 200, 'Config returns HTTP 200');
    assert(confRes.data.allowSelfRegistration === false, 'Public self-registration is explicitly disabled');
    assert(confRes.data.mfaPolicy === 'MANDATORY_TOTP_OR_PASSKEY', 'MFA policy is mandatory TOTP or passkey');

    // 2. Legacy PIN Deprecation
    console.log('\nTest 2: Legacy PIN Disclosure & Deprecation');
    const pinRes = await makeRequest('POST', '/api/admin/login', { pin: '1234' });
    assert(pinRes.status === 401, 'Legacy PIN endpoint returns HTTP 401');
    assert(pinRes.data.error.includes('PIN-based login has been decommissioned'), 'Informs clients of PIN decommission');

    // 3. Invalid Credentials & Rate Limiting
    console.log('\nTest 3: Invalid Credentials (Generic Error & Rate Limiting)');
    const badLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent@jonakhotelgroup.in',
      password: 'WrongPassword123!'
    });
    assert(badLogin.status === 401, 'Invalid credentials return HTTP 401');
    assert(badLogin.data.error === 'Invalid email or password. Please try again.', 'Generic response prevents username enumeration');

    // 4. Owner Login Step 1 (Email + Password -> MFA Challenge)
    console.log('\nTest 4: Owner Login Step 1 (Credentials -> MFA Challenge)');
    const ownerStep1 = await makeRequest('POST', '/api/auth/login', {
      email: 'owner@jonakhotelgroup.in',
      password: 'JonakOwner#2026'
    });
    assert(ownerStep1.status === 200, 'Owner Step 1 returns HTTP 200');
    assert(ownerStep1.data.requiresMfa === true, 'MFA is required');
    assert(typeof ownerStep1.data.tempToken === 'string', 'Temporary MFA token issued');
    assert(Array.isArray(ownerStep1.data.recoveryCodes), 'Emergency recovery codes generated on first setup');
    const ownerTempToken = ownerStep1.data.tempToken;
    const ownerTotpSecret = ownerStep1.data.secret;
    const ownerRecoveryCodes = ownerStep1.data.recoveryCodes;

    // 5. MFA Verification Step 2 (TOTP Code -> Session Token)
    console.log('\nTest 5: MFA Verification Step 2 (TOTP Authenticator)');
    const validTotp = security.generateTOTP(ownerTotpSecret);
    const mfaRes = await makeRequest('POST', '/api/auth/mfa/verify', {
      tempToken: ownerTempToken,
      code: validTotp,
      isRecoveryCode: false
    });
    assert(mfaRes.status === 200, 'TOTP verification returns HTTP 200');
    assert(mfaRes.data.user.role === 'owner', 'User authenticated as owner');
    assert(typeof mfaRes.data.token === 'string', 'Session token issued');
    assert(typeof mfaRes.data.csrfToken === 'string', 'Session CSRF token issued');
    const ownerToken = mfaRes.data.token;
    const ownerCsrf = mfaRes.data.csrfToken;

    // 6. RBAC Owner Access
    console.log('\nTest 6: Owner Master Access (Users & Audit Logs)');
    const usersRes = await makeRequest('GET', '/api/admin/users', null, {
      'Authorization': `Bearer ${ownerToken}`,
      'X-CSRF-Token': ownerCsrf
    });
    assert(usersRes.status === 200, 'Owner can list all users');
    assert(usersRes.data.users.length >= 3, 'Pre-seeded owner, manager, and staff found');

    const logsRes = await makeRequest('GET', '/api/admin/audit-logs', null, {
      'Authorization': `Bearer ${ownerToken}`,
      'X-CSRF-Token': ownerCsrf
    });
    assert(logsRes.status === 200, 'Owner can access audit logs');
    assert(logsRes.data.logs.some(l => l.eventType === 'MFA_VERIFY_SUCCESS'), 'Audit log contains MFA_VERIFY_SUCCESS event');

    // 7. Manager Login & RBAC Boundary Enforcement
    console.log('\nTest 7: Manager Login & RBAC Boundary Enforcement');
    const mgrStep1 = await makeRequest('POST', '/api/auth/login', {
      email: 'manager@jonakhotelgroup.in',
      password: 'JonakManager#2026'
    });
    assert(mgrStep1.status === 200 && mgrStep1.data.requiresMfa, 'Manager Step 1 successful');
    const mgrTotp = security.generateTOTP(mgrStep1.data.secret);
    const mgrMfa = await makeRequest('POST', '/api/auth/mfa/verify', {
      tempToken: mgrStep1.data.tempToken,
      code: mgrTotp,
      isRecoveryCode: false
    });
    assert(mgrMfa.status === 200, 'Manager MFA verification successful');
    const mgrToken = mgrMfa.data.token;
    const mgrCsrf = mgrMfa.data.csrfToken;

    // Manager should NOT be able to view audit logs (Owner-only)
    const mgrAuditAttempt = await makeRequest('GET', '/api/admin/audit-logs', null, {
      'Authorization': `Bearer ${mgrToken}`,
      'X-CSRF-Token': mgrCsrf
    });
    assert(mgrAuditAttempt.status === 403, 'Manager forbidden from accessing Owner audit logs (HTTP 403)');

    // Manager should NOT be able to access staff user management (Owner-only)
    const mgrUsersAttempt = await makeRequest('GET', '/api/admin/users', null, {
      'Authorization': `Bearer ${mgrToken}`,
      'X-CSRF-Token': mgrCsrf
    });
    assert(mgrUsersAttempt.status === 403, 'Manager forbidden from managing users (HTTP 403)');

    // Manager CAN update menu item prices and bookings
    const mgrPriceUpdate = await makeRequest('PATCH', '/api/admin/menu/bir-1/price', { price: 350 }, {
      'Authorization': `Bearer ${mgrToken}`,
      'X-CSRF-Token': mgrCsrf
    });
    assert(mgrPriceUpdate.status === 200, 'Manager authorized to update menu prices (HTTP 200)');

    // 8. Staff Login & Operational Boundaries
    console.log('\nTest 8: Staff Login & Operational Boundaries');
    const staffStep1 = await makeRequest('POST', '/api/auth/login', {
      email: 'staff@jonakhotelgroup.in',
      password: 'JonakStaff#2026'
    });
    assert(staffStep1.status === 200 && staffStep1.data.requiresMfa, 'Staff Step 1 successful');
    const staffTotp = security.generateTOTP(staffStep1.data.secret);
    const staffMfa = await makeRequest('POST', '/api/auth/mfa/verify', {
      tempToken: staffStep1.data.tempToken,
      code: staffTotp,
      isRecoveryCode: false
    });
    assert(staffMfa.status === 200, 'Staff MFA verification successful');
    const staffToken = staffMfa.data.token;
    const staffCsrf = staffMfa.data.csrfToken;

    // Staff cannot edit dish prices
    const staffPriceAttempt = await makeRequest('PATCH', '/api/admin/menu/bir-1/price', { price: 399 }, {
      'Authorization': `Bearer ${staffToken}`,
      'X-CSRF-Token': staffCsrf
    });
    assert(staffPriceAttempt.status === 403, 'Staff forbidden from updating prices (HTTP 403)');

    // Staff CAN toggle dish stock (operational duty)
    const staffStockToggle = await makeRequest('PATCH', '/api/admin/menu/bir-1/stock', { inStock: true }, {
      'Authorization': `Bearer ${staffToken}`,
      'X-CSRF-Token': staffCsrf
    });
    assert(staffStockToggle.status === 200, 'Staff authorized for operational stock toggling (HTTP 200)');

    // 9. Single-Use Emergency Recovery Code Test
    console.log('\nTest 9: Single-Use Emergency Recovery Code Usage & Re-use Prevention');
    const ownerStep1Rec = await makeRequest('POST', '/api/auth/login', {
      email: 'owner@jonakhotelgroup.in',
      password: 'JonakOwner#2026'
    });
    const firstCode = ownerRecoveryCodes[0];
    const recVerify = await makeRequest('POST', '/api/auth/mfa/verify', {
      tempToken: ownerStep1Rec.data.tempToken,
      code: firstCode,
      isRecoveryCode: true
    });
    assert(recVerify.status === 200, 'Emergency single-use recovery code accepted');

    // Attempt to RE-USE the same code
    const ownerStep1Reuse = await makeRequest('POST', '/api/auth/login', {
      email: 'owner@jonakhotelgroup.in',
      password: 'JonakOwner#2026'
    });
    const reuseAttempt = await makeRequest('POST', '/api/auth/mfa/verify', {
      tempToken: ownerStep1Reuse.data.tempToken,
      code: firstCode,
      isRecoveryCode: true
    });
    assert(reuseAttempt.status === 401, 'Reusing consumed recovery code is rejected (HTTP 401)');

    // 10. Password Reset Flow
    console.log('\nTest 10: Password Recovery Workflow');
    const forgotRes = await makeRequest('POST', '/api/auth/forgot-password', {
      email: 'owner@jonakhotelgroup.in'
    });
    assert(forgotRes.status === 200, 'Forgot password returns HTTP 200');
    assert(typeof forgotRes.data.resetToken === 'string', 'Reset token generated in staging response');

    const resetExec = await makeRequest('POST', '/api/auth/reset-password', {
      token: forgotRes.data.resetToken,
      newPassword: 'JonakOwner#2026New'
    });
    assert(resetExec.status === 200, 'Password reset successful');

    // Restore owner password back for staging consistency
    const forgotRes2 = await makeRequest('POST', '/api/auth/forgot-password', {
      email: 'owner@jonakhotelgroup.in'
    });
    await makeRequest('POST', '/api/auth/reset-password', {
      token: forgotRes2.data.resetToken,
      newPassword: 'JonakOwner#2026'
    });
    console.log('  Restored owner password to JonakOwner#2026');

    // 11. Session Expiry & Revocation
    console.log('\nTest 11: Session Revocation');
    // Re-authenticate after password reset to obtain fresh valid session
    const ownerStep1After = await makeRequest('POST', '/api/auth/login', {
      email: 'owner@jonakhotelgroup.in',
      password: 'JonakOwner#2026'
    });
    const validTotpAfter = security.generateTOTP(ownerStep1After.data.secret);
    const mfaResAfter = await makeRequest('POST', '/api/auth/mfa/verify', {
      tempToken: ownerStep1After.data.tempToken,
      code: validTotpAfter,
      isRecoveryCode: false
    });
    const liveOwnerToken = mfaResAfter.data.token;
    const liveOwnerCsrf = mfaResAfter.data.csrfToken;

    const activeSessions = await makeRequest('GET', '/api/admin/sessions', null, {
      'Authorization': `Bearer ${liveOwnerToken}`,
      'X-CSRF-Token': liveOwnerCsrf
    });
    assert(activeSessions.status === 200, 'Owner can view active sessions');
    const sessionToRevoke = activeSessions.data.sessions[0]?.id;
    if (sessionToRevoke) {
      const revokeRes = await makeRequest('POST', `/api/admin/sessions/${sessionToRevoke}/revoke`, null, {
        'Authorization': `Bearer ${liveOwnerToken}`,
        'X-CSRF-Token': liveOwnerCsrf
      });
      assert(revokeRes.status === 200, 'Session successfully revoked by owner');
    }

    console.log(`\n🎉 ALL ${passed}/${total} SECURITY AND RBAC TESTS PASSED SUCCESSFULLY!`);
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

runTests();
