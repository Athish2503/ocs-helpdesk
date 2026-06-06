const BASE_URL = 'http://localhost:4000/api';

async function runTests() {
  console.log('🚀 Starting Backend Auth Verification Tests...\n');

  // Test Health
  try {
    const healthRes = await fetch('http://localhost:4000/health');
    const health = await healthRes.json();
    console.log('✅ Health check passed:', health);
  } catch (err) {
    console.error('❌ API is not running. Please start it using "pnpm dev:api" or "npm run dev" in apps/api');
    process.exit(1);
  }

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test User';

  let accessToken = '';
  let refreshToken = '';

  // 1. Register User
  console.log('\n1. Registering user...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName
    })
  });
  const regData = await regRes.json();
  if (regRes.status !== 201) {
    console.error('❌ Registration failed:', regData);
    process.exit(1);
  }
  console.log('✅ User registered successfully:', regData.data.user);

  // 2. Login User
  console.log('\n2. Logging in...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) {
    console.error('❌ Login failed:', loginData);
    process.exit(1);
  }
  accessToken = loginData.data.accessToken;
  refreshToken = loginData.data.refreshToken;
  console.log('✅ Login successful! Received tokens.');

  // 3. Access /me (Protected Route)
  console.log('\n3. Accessing /me profile...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const meData = await meRes.json();
  if (meRes.status !== 200) {
    console.error('❌ Accessing /me failed:', meData);
    process.exit(1);
  }
  console.log('✅ Access to protected /me succeeded:', meData.data.user);

  // 4. Refresh Token
  console.log('\n4. Refreshing tokens...');
  const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const refreshData = await refreshRes.json();
  if (refreshRes.status !== 200) {
    console.error('❌ Refresh failed:', refreshData);
    process.exit(1);
  }
  const newAccessToken = refreshData.data.accessToken;
  const newRefreshToken = refreshData.data.refreshToken;
  console.log('✅ Tokens refreshed successfully!');

  // 5. Logout
  console.log('\n5. Logging out...');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: newRefreshToken })
  });
  const logoutData = await logoutRes.json();
  if (logoutRes.status !== 200) {
    console.error('❌ Logout failed:', logoutData);
    process.exit(1);
  }
  console.log('✅ Logged out successfully.');

  // 6. Verify refresh token is revoked (should fail on second refresh)
  console.log('\n6. Verifying revoked refresh token rejection...');
  const staleRefreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: newRefreshToken })
  });
  if (staleRefreshRes.status === 401) {
    console.log('✅ Revoked token rejected successfully (returned 401).');
  } else {
    console.error('❌ Warning: Stale refresh token was not rejected! Status:', staleRefreshRes.status);
    process.exit(1);
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The authentication flow is completely functional. 🎉');
}

runTests().catch(err => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});
