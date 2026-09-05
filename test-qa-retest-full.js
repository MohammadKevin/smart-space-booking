const API_URL = 'https://api-ukk.budayakita.com/api';

async function req(path, options = {}) {
  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, data: null, error: err.message };
  }
}

async function runRetestQA() {
  console.log('================================================================');
  console.log('    SMART SPACE BOOKING (WORKNEST) - FULL RETEST QA & QC        ');
  console.log('             Live Target: https://api-ukk.budayakita.com/api    ');
  console.log('================================================================\n');

  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: [],
  };

  function test(section, title, condition, details = {}) {
    stats.total++;
    if (condition) {
      stats.passed++;
      console.log(`  [PASS] [${section}] ${title}`);
    } else {
      stats.failed++;
      console.log(`  [FAIL] [${section}] ${title}`);
      console.log(`         Details:`, JSON.stringify(details));
      stats.failures.push({ section, title, details });
    }
  }

  // =========================================================================
  // 1. COMPREHENSIVE AUTHENTICATION & SECURITY AUDIT
  // =========================================================================
  console.log('--- 1. COMPREHENSIVE AUTHENTICATION & SECURITY AUDIT ---');

  // 1.1 Valid Logins
  const ownerLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', '1.1 SpaceOwner Login (kvn4.200581@gmail.com)', 
    ownerLogin.ok && ownerLogin.data?.access_token && ownerLogin.data?.user?.role === 'admin_space',
    ownerLogin.data
  );
  const ownerToken = ownerLogin.data?.access_token;
  const ownerUser = ownerLogin.data?.user;

  const staffLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'mhmdkevin198@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', '1.2 Staff Login (mhmdkevin198@gmail.com)', 
    staffLogin.ok && staffLogin.data?.access_token && staffLogin.data?.user?.role === 'staff',
    staffLogin.data
  );
  const staffToken = staffLogin.data?.access_token;
  const staffUser = staffLogin.data?.user;

  const memberLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', '1.3 Member Login (kiplipplli@gmail.com)', 
    memberLogin.ok && memberLogin.data?.access_token && memberLogin.data?.user?.role === 'member',
    memberLogin.data
  );
  const memberToken = memberLogin.data?.access_token;
  const memberUser = memberLogin.data?.user;

  // 1.4 Case Insensitivity for Email
  const upperEmailLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'KVN4.200581@GMAIL.COM', password: 'Kevin135*' }),
  });
  test('AUTH', '1.4 Email login is case-insensitive (Uppercase email)', 
    upperEmailLogin.ok || upperEmailLogin.status === 200 || upperEmailLogin.status === 201,
    upperEmailLogin.data
  );

  // 1.5 Invalid Password Handling
  const invalidPass = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'IncorrectPassword999!' }),
  });
  test('AUTH', '1.5 Invalid password rejected (HTTP 401 Unauthorized)', 
    invalidPass.status === 401, invalidPass.data
  );

  // 1.6 Password Case Sensitivity
  const casePass = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'kevin135*' /* lowercase */ }),
  });
  test('AUTH', '1.6 Password is case-sensitive (lowercase should fail)', 
    casePass.status === 401, casePass.data
  );

  // 1.7 Non-existent User
  const nonExistent = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'ghost_user_999999@domain.xyz', password: 'Kevin135*' }),
  });
  test('AUTH', '1.7 Non-existent user rejected (HTTP 401 Unauthorized)', 
    nonExistent.status === 401, nonExistent.data
  );

  // 1.8 Malformed Email Inputs
  const doubleEmail = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', '1.8 Malformed email (double domain) rejected with validation error (HTTP 400)', 
    doubleEmail.status === 400, doubleEmail.data
  );

  const missingDomain = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'justaname', password: 'Kevin135*' }),
  });
  test('AUTH', '1.9 Malformed email (no @ or domain) rejected (HTTP 400)', 
    missingDomain.status === 400, missingDomain.data
  );

  // 1.10 SQL Injection Payload attempt
  const sqli = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: "' OR '1'='1' --", password: "' OR '1'='1'" }),
  });
  test('AUTH', '1.10 SQL Injection in login payload properly blocked (HTTP 400/401)', 
    sqli.status === 400 || sqli.status === 401, sqli.data
  );

  // 1.11 Profile Data & Relation Checks
  const ownerProfile = await req('/auth/profile', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('AUTH', '1.11 SpaceOwner /auth/profile includes spaceOwner entity & details', 
    ownerProfile.ok && !!ownerProfile.data?.spaceOwner?.id && !!ownerProfile.data?.spaceOwner?.namaCoworking,
    ownerProfile.data
  );

  const staffProfile = await req('/auth/profile', { headers: { Authorization: `Bearer ${staffToken}` } });
  test('AUTH', '1.12 Staff /auth/profile includes staff entity & owner link', 
    staffProfile.ok && !!staffProfile.data?.staff?.id && !!staffProfile.data?.staff?.ownerId,
    staffProfile.data
  );

  const memberProfile = await req('/auth/profile', { headers: { Authorization: `Bearer ${memberToken}` } });
  test('AUTH', '1.13 Member /auth/profile includes member entity & details', 
    memberProfile.ok && !!memberProfile.data?.member?.id && !!memberProfile.data?.member?.namaMember,
    memberProfile.data
  );

  // 1.14 Missing/Tampered Token checks
  const noToken = await req('/auth/profile');
  test('AUTH', '1.14 Request without token rejected (HTTP 401)', 
    noToken.status === 401, noToken.data
  );

  const fakeToken = await req('/auth/profile', { headers: { Authorization: 'Bearer fake.jwt.token.12345' } });
  test('AUTH', '1.15 Request with forged JWT rejected (HTTP 401)', 
    fakeToken.status === 401, fakeToken.data
  );

  // 1.16 Duplicate Registration Conflict Handling
  const dupMember = await req('/auth/register/member', {
    method: 'POST',
    body: JSON.stringify({
      email: 'kiplipplli@gmail.com',
      password: 'Password123*',
      namaMember: 'Duplicate Test',
      telp: '08123456789',
      instansi: 'Test Instansi',
      alamat: 'Malang',
    }),
  });
  test('AUTH', '1.16 Duplicate member registration returns HTTP 409 Conflict', 
    dupMember.status === 409, dupMember.data
  );

  const dupOwner = await req('/auth/register/owner', {
    method: 'POST',
    body: JSON.stringify({
      email: 'kvn4.200581@gmail.com',
      password: 'Password123*',
      namaCoworking: 'Duplicate Coworking',
      namaPemilik: 'Duplicate Owner',
      telp: '08123456789',
      alamat: 'Malang',
    }),
  });
  test('AUTH', '1.17 Duplicate owner registration returns HTTP 409 Conflict', 
    dupOwner.status === 409, dupOwner.data
  );

  // 1.18 Staff Provisioning RBAC
  const memberMakeStaff = await req('/auth/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      email: `fake_staff_${Date.now()}@test.com`,
      password: 'Password123*',
      namaStaff: 'Illegal Staff',
      telp: '08123456789',
    }),
  });
  test('AUTH', '1.18 Member forbidden from provisioning staff (HTTP 403 Forbidden)', 
    memberMakeStaff.status === 403, memberMakeStaff.data
  );

  const staffMakeStaff = await req('/auth/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      email: `fake_staff_${Date.now()}@test.com`,
      password: 'Password123*',
      namaStaff: 'Illegal Staff 2',
      telp: '08123456789',
    }),
  });
  test('AUTH', '1.19 Staff forbidden from provisioning staff (HTTP 403 Forbidden)', 
    staffMakeStaff.status === 403, staffMakeStaff.data
  );

  // 1.20 Owner Provisioning Staff (Valid)
  const testStaffEmail = `staff_test_${Date.now()}@worknest.test`;
  const ownerMakeStaff = await req('/auth/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      email: testStaffEmail,
      password: 'Password123*',
      namaStaff: 'Staff QA Tester',
      telp: '081234567899',
    }),
  });
  test('AUTH', '1.20 Owner successfully provisions new staff account', 
    ownerMakeStaff.ok && ownerMakeStaff.data?.user?.role === 'staff',
    ownerMakeStaff.data
  );

  // Login with the newly created staff
  if (ownerMakeStaff.ok) {
    const newStaffLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testStaffEmail, password: 'Password123*' }),
    });
    test('AUTH', '1.21 Newly provisioned staff can immediately login', 
      newStaffLogin.ok && newStaffLogin.data?.access_token && newStaffLogin.data?.user?.role === 'staff',
      newStaffLogin.data
    );
  }

  // =========================================================================
  // 2. SPACES INVENTORY & CRUD
  // =========================================================================
  console.log('\n--- 2. SPACES INVENTORY & CRUD AUDIT ---');

  const spacesRes = await req('/spaces');
  test('SPACES', '2.1 Public GET /spaces returns array', 
    spacesRes.ok && Array.isArray(spacesRes.data), spacesRes.data
  );
  let spaceList = spacesRes.data || [];
  let currentSpace = spaceList[0];

  if (!currentSpace) {
    const createSp = await req('/spaces', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        namaSpace: 'QA Dedicated Workstation Alpha',
        tipe: 'desk',
        hargaPerJam: 25000,
        kapasitas: 1,
        deskripsi: 'Workstation ergonomis dengan WiFi 1Gbps',
      }),
    });
    currentSpace = createSp.data;
  }

  test('SPACES', '2.2 Get Space Detail by ID (/spaces/:id)', 
    currentSpace && (await req(`/spaces/${currentSpace.id}`)).ok,
    currentSpace
  );

  // =========================================================================
  // 3. DISCOUNTS & PROMO CODES
  // =========================================================================
  console.log('\n--- 3. DISCOUNTS & PROMO CODES AUDIT ---');

  const discounts = await req('/discounts');
  test('DISCOUNT', '3.1 GET /discounts returns array', 
    discounts.ok && Array.isArray(discounts.data), discounts.data
  );

  const promoCheck = await req('/discounts/check/PROMO2026');
  test('DISCOUNT', '3.2 PROMO2026 check validity', 
    promoCheck.ok && (promoCheck.data?.isValid === true || promoCheck.data?.diskon?.id), promoCheck.data
  );

  // =========================================================================
  // 4. RESERVATIONS, ANTI-COLLISION & BOOKING CREATION
  // =========================================================================
  console.log('\n--- 4. RESERVATIONS, ANTI-COLLISION & PRICING AUDIT ---');

  // Booking Date (7 days from now to avoid past date)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  // Test past date booking
  const pastRes = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: currentSpace.id,
      tanggalReservasi: '2020-01-01',
      jamMulai: '10:00',
      durasiJam: 2,
    }),
  });
  test('BOOKING', '4.1 Past date booking rejected (HTTP 400 Bad Request)', 
    pastRes.status === 400, pastRes.data
  );

  // Test 0 duration booking
  const zeroDurRes = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: currentSpace.id,
      tanggalReservasi: futureDateStr,
      jamMulai: '10:00',
      durasiJam: 0,
    }),
  });
  test('BOOKING', '4.2 Zero duration booking rejected (HTTP 400 Bad Request)', 
    zeroDurRes.status === 400, zeroDurRes.data
  );

  // Create valid reservation 1: 10:00 - 12:00
  const booking1 = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: currentSpace.id,
      tanggalReservasi: futureDateStr,
      jamMulai: '10:00',
      durasiJam: 2,
      kodeDiskon: 'PROMO2026',
    }),
  });
  test('BOOKING', '4.3 Create valid reservation with promo code', 
    booking1.ok && (booking1.data?.data?.qrCode || booking1.data?.qrCode),
    booking1.data
  );
  const createdRes1 = booking1.data?.data || booking1.data;

  // Collision Test: Same slot (10:00 - 12:00)
  const collisionExact = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: currentSpace.id,
      tanggalReservasi: futureDateStr,
      jamMulai: '10:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', '4.4 Exact overlap collision rejected (HTTP 400)', 
    collisionExact.status === 400, collisionExact.data
  );

  // Collision Test: Overlapping start (09:00 - 11:00)
  const collisionStart = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: currentSpace.id,
      tanggalReservasi: futureDateStr,
      jamMulai: '09:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', '4.5 Overlapping start collision rejected (HTTP 400)', 
    collisionStart.status === 400, collisionStart.data
  );

  // Collision Test: Overlapping end (11:00 - 13:00)
  const collisionEnd = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: currentSpace.id,
      tanggalReservasi: futureDateStr,
      jamMulai: '11:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', '4.6 Overlapping end collision rejected (HTTP 400)', 
    collisionEnd.status === 400, collisionEnd.data
  );

  // Adjacent Slot Right After: 12:00 - 14:00 (Should SUCCEED)
  const adjacentAfter = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: currentSpace.id,
      tanggalReservasi: futureDateStr,
      jamMulai: '12:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', '4.7 Adjacent slot right after (12:00 - 14:00) succeeds without false collision', 
    adjacentAfter.ok && (adjacentAfter.data?.data?.id || adjacentAfter.data?.id),
    adjacentAfter.data
  );

  // =========================================================================
  // 5. LIFECYCLE WORKFLOW & STAFF SCANNER TERMINAL
  // =========================================================================
  console.log('\n--- 5. LIFECYCLE WORKFLOW & STAFF SCANNER AUDIT ---');

  if (createdRes1?.qrCode) {
    const qrCode = createdRes1.qrCode;
    const isApprovedAlready = createdRes1.status === 'disetujui';

    if (!isApprovedAlready) {
      // Verify QR when pending
      const verifyPending = await req('/checkin/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
        body: JSON.stringify({ qrCode }),
      });
      test('CHECKIN', '5.1 Verify QR on pending reservation shows canCheckIn = false', 
        verifyPending.ok && verifyPending.data?.canCheckIn === false, verifyPending.data
      );

      // Attempt check-in on pending reservation (should fail)
      const checkinPending = await req('/checkin/process', {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
        body: JSON.stringify({ qrCode, action: 'checkin' }),
      });
      test('CHECKIN', '5.2 Check-in on pending reservation rejected (HTTP 400)', 
        checkinPending.status === 400, checkinPending.data
      );

      // SpaceOwner approves reservation
      const approveRes = await req(`/reservations/${createdRes1.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ status: 'disetujui' }),
      });
      test('WORKFLOW', '5.3 SpaceOwner approves reservation (status -> disetujui)', 
        approveRes.ok && (approveRes.data?.data?.status === 'disetujui' || approveRes.data?.status === 'disetujui'),
        approveRes.data
      );
    } else {
      test('WORKFLOW', '5.1 Hot Desk Auto-Approve / Instant booking enabled', true);
    }

    // Verify QR on approved reservation
    const verifyApproved = await req('/checkin/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ qrCode }),
    });
    test('CHECKIN', '5.4 Verify QR on approved reservation shows canCheckIn = true', 
      verifyApproved.ok && verifyApproved.data?.canCheckIn === true, verifyApproved.data
    );

    // Staff executes Check-In
    const doCheckin = await req('/checkin/process', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ qrCode, action: 'checkin' }),
    });
    test('CHECKIN', '5.5 Staff executes Check-In (status -> aktif)', 
      doCheckin.ok && (doCheckin.data?.reservation?.status === 'aktif' || doCheckin.data?.data?.status === 'aktif'),
      doCheckin.data
    );

    // Staff executes Check-Out
    const doCheckout = await req('/checkin/process', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ qrCode, action: 'checkout' }),
    });
    test('CHECKIN', '5.6 Staff executes Check-Out (status -> selesai)', 
      doCheckout.ok && (doCheckout.data?.reservation?.status === 'selesai' || doCheckout.data?.data?.status === 'selesai'),
      doCheckout.data
    );

    // Double checkout should fail
    const doubleCheckout = await req('/checkin/process', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ qrCode, action: 'checkout' }),
    });
    test('CHECKIN', '5.7 Double checkout on completed reservation rejected (HTTP 400)', 
      doubleCheckout.status === 400, doubleCheckout.data
    );
  }

  // =========================================================================
  // 6. TRANSACTIONS, MIDTRANS SNAP & PAYMENT
  // =========================================================================
  console.log('\n--- 6. TRANSACTIONS & MIDTRANS PAYMENT AUDIT ---');

  const memberTxs = await req('/transactions', { headers: { Authorization: `Bearer ${memberToken}` } });
  test('TRANSACTIONS', '6.1 Member GET /transactions returns array', 
    memberTxs.ok && Array.isArray(memberTxs.data), memberTxs.data
  );

  const ownerTxs = await req('/transactions', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('TRANSACTIONS', '6.2 SpaceOwner GET /transactions returns array', 
    ownerTxs.ok && Array.isArray(ownerTxs.data), ownerTxs.data
  );

  // =========================================================================
  // 7. REPORTS & ANALYTICS
  // =========================================================================
  console.log('\n--- 7. REPORTS & FINANCIAL ANALYTICS AUDIT ---');

  const summary = await req('/reports/summary', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('REPORTS', '7.1 Owner GET /reports/summary returns metrics', 
    summary.ok && summary.data?.coworkingName && typeof summary.data?.totalRevenue === 'number',
    summary.data
  );

  const monthlyRev = await req('/reports/monthly-revenue', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('REPORTS', '7.2 Owner GET /reports/monthly-revenue returns 12 months array', 
    monthlyRev.ok && Array.isArray(monthlyRev.data?.months) && monthlyRev.data.months.length === 12,
    monthlyRev.data
  );

  const spaceDist = await req('/reports/space-distribution', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('REPORTS', '7.3 Owner GET /reports/space-distribution returns array', 
    spaceDist.ok && Array.isArray(spaceDist.data), spaceDist.data
  );

  // RBAC checks on Reports
  const memberReportBlock = await req('/reports/summary', { headers: { Authorization: `Bearer ${memberToken}` } });
  test('RBAC', '7.4 Member blocked from /reports/summary (HTTP 403 Forbidden)', 
    memberReportBlock.status === 403, memberReportBlock.data
  );

  const staffReportBlock = await req('/reports/summary', { headers: { Authorization: `Bearer ${staffToken}` } });
  test('RBAC', '7.5 Staff blocked from /reports/summary (HTTP 403 Forbidden)', 
    staffReportBlock.status === 403, staffReportBlock.data
  );

  // =========================================================================
  // 8. PROFILE SETTINGS & ACCOUNT MANAGEMENT
  // =========================================================================
  console.log('\n--- 8. PROFILE SETTINGS & ACCOUNT MANAGEMENT AUDIT ---');

  // Update Member Profile
  const updateMember = await req('/users/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      nama: 'QA Verified Member',
      instansi: 'WorkNest Quality Testing',
      telp: '081234567890',
      alamat: 'Malang, Jawa Timur',
    }),
  });
  test('PROFILE', '8.1 Member updates profile information', 
    updateMember.ok && updateMember.data?.member?.namaMember === 'QA Verified Member',
    updateMember.data
  );

  // Profile Update with wrong old password
  const wrongOldPass = await req('/users/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      oldPassword: 'WrongOldPassword123!',
      password: 'NewValidPassword123!',
    }),
  });
  test('PROFILE', '8.2 Profile update with wrong old password rejected (HTTP 400)', 
    wrongOldPass.status === 400, wrongOldPass.data
  );

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${stats.total} | PASSED: ${stats.passed} | FAILED: ${stats.failed}`);
  console.log(`PASS RATE: ${Math.round((stats.passed / stats.total) * 100)}%`);
  console.log('================================================================\n');

  if (stats.failures.length > 0) {
    console.log('LIST OF REMAINING FAILED TESTS:');
    stats.failures.forEach((f, i) => {
      console.log(`${i + 1}. [${f.section}] ${f.title}:`, f.details);
    });
  }
}

runRetestQA().catch(console.error);
