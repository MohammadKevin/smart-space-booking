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

async function runComprehensiveQA() {
  console.log('=== COMPREHENSIVE QA/QC AUDIT FOR WORKNEST SMART SPACE BOOKING ===\n');

  const report = {
    criticalBugs: [],
    highBugs: [],
    mediumBugs: [],
    lowBugs: [],
    passedChecks: [],
  };

  function assert(category, title, condition, details, severity = 'MEDIUM') {
    if (condition) {
      report.passedChecks.push({ category, title });
      console.log(`✅ [PASS] [${category}] ${title}`);
    } else {
      console.log(`❌ [FAIL - ${severity}] [${category}] ${title}`);
      console.log(`   Details:`, JSON.stringify(details, null, 2));
      const bug = { category, title, details, severity };
      if (severity === 'CRITICAL') report.criticalBugs.push(bug);
      else if (severity === 'HIGH') report.highBugs.push(bug);
      else if (severity === 'MEDIUM') report.mediumBugs.push(bug);
      else report.lowBugs.push(bug);
    }
  }

  // --- 1. AUTHENTICATION & LOGIN AUDIT ---
  console.log('\n--- 1. AUTHENTICATION & LOGIN AUDIT ---');

  // SpaceOwner Login
  const ownerLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'SpaceOwner login (kvn4.200581@gmail.com)', 
    ownerLogin.ok && ownerLogin.data?.access_token && ownerLogin.data?.user?.role === 'admin_space',
    ownerLogin.data, 'CRITICAL'
  );
  const ownerToken = ownerLogin.data?.access_token;
  const ownerUser = ownerLogin.data?.user;

  // Staff Login
  const staffLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'mhmdkevin198@gmail.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'Staff login (mhmdkevin198@gmail.com)', 
    staffLogin.ok && staffLogin.data?.access_token && staffLogin.data?.user?.role === 'staff',
    staffLogin.data, 'CRITICAL'
  );
  const staffToken = staffLogin.data?.access_token;
  const staffUser = staffLogin.data?.user;

  // Member Login with user given email 'kiplipplli@gmail.com@gmail.com'
  const memberLoginDouble = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com@gmail.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'Member login with prompt email kiplipplli@gmail.com@gmail.com gives validation error',
    memberLoginDouble.status === 400,
    memberLoginDouble.data, 'MEDIUM'
  );

  // Member Login with normalized email 'kiplipplli@gmail.com'
  const memberLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'Member login with valid email (kiplipplli@gmail.com)', 
    memberLogin.ok && memberLogin.data?.access_token && memberLogin.data?.user?.role === 'member',
    memberLogin.data, 'CRITICAL'
  );
  const memberToken = memberLogin.data?.access_token;
  const memberUser = memberLogin.data?.user;

  // --- 2. PROFILE & DATA INTEGRITY ---
  console.log('\n--- 2. PROFILE & RELATIONS ---');
  const ownerProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert('AUTH', 'Owner profile has spaceOwner relation', !!ownerProf.data?.spaceOwner?.id, ownerProf.data, 'HIGH');

  const staffProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${staffToken}` } });
  assert('AUTH', 'Staff profile has staff relation & owner link', !!staffProf.data?.staff?.ownerId, staffProf.data, 'HIGH');

  const memberProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${memberToken}` } });
  assert('AUTH', 'Member profile has member relation', !!memberProf.data?.member?.id, memberProf.data, 'HIGH');

  // --- 3. SPACE INVENTORY & MANAGEMENT ---
  console.log('\n--- 3. SPACES INVENTORY & CRUD ---');
  const spacesListRes = await req('/spaces');
  assert('SPACES', 'Public GET /spaces returns array', spacesListRes.ok && Array.isArray(spacesListRes.data), spacesListRes.data, 'CRITICAL');
  const spaces = spacesListRes.data || [];
  console.log(`   Found ${spaces.length} space(s) online.`);

  let activeSpace = spaces[0];
  if (!activeSpace) {
    const createSp = await req('/spaces', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        namaSpace: 'WorkNest Private Executive Room',
        tipe: 'meeting_room',
        hargaPerJam: 75000,
        kapasitas: 8,
        deskripsi: 'Ruang meeting premium lengkap dengan Smart TV 4K dan soundproof wall',
      }),
    });
    activeSpace = createSp.data;
  }

  // --- 4. DISCOUNT / PROMO VALIDATION ---
  console.log('\n--- 4. DISCOUNT & PROMO CODES ---');
  const promoRes = await req('/discounts');
  assert('DISCOUNT', 'GET /discounts works', promoRes.ok && Array.isArray(promoRes.data), promoRes.data, 'HIGH');

  const checkPromo = await req('/discounts/check/PROMO2026');
  assert('DISCOUNT', 'Check PROMO2026 validity', checkPromo.ok && checkPromo.data?.isValid === true, checkPromo.data, 'HIGH');

  // --- 5. RESERVATIONS & BOOKING CREATION ---
  console.log('\n--- 5. RESERVATION CREATION & ERROR DIAGNOSTICS ---');

  // Let's test why POST /reservations returned 500
  const bookingAttempt = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: activeSpace.id,
      tanggalReservasi: '2026-11-15',
      jamMulai: '14:00',
      durasiJam: 2,
    }),
  });

  assert('BOOKING', 'Member can create a valid reservation', 
    bookingAttempt.ok && bookingAttempt.data?.data?.id, 
    bookingAttempt.data, 'CRITICAL'
  );

  // Let's test with discount code
  const bookingAttemptDisc = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: activeSpace.id,
      tanggalReservasi: '2026-11-16',
      jamMulai: '10:00',
      durasiJam: 3,
      kodeDiskon: 'PROMO2026',
    }),
  });

  assert('BOOKING', 'Member can create a reservation with promo code PROMO2026', 
    bookingAttemptDisc.ok && bookingAttemptDisc.data?.data?.id, 
    bookingAttemptDisc.data, 'CRITICAL'
  );

  // --- 6. TRANSACTIONS & PAYMENTS ---
  console.log('\n--- 6. TRANSACTIONS & PAYMENTS ---');
  const memberTxs = await req('/transactions', { headers: { Authorization: `Bearer ${memberToken}` } });
  assert('TRANSACTIONS', 'Member can GET /transactions', memberTxs.ok && Array.isArray(memberTxs.data), memberTxs.data, 'HIGH');

  const ownerTxs = await req('/transactions', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert('TRANSACTIONS', 'Owner can GET /transactions', ownerTxs.ok && Array.isArray(ownerTxs.data), ownerTxs.data, 'HIGH');

  // --- 7. REPORTS & ANALYTICS ---
  console.log('\n--- 7. REPORTS & ANALYTICS ---');
  const summary = await req('/reports/summary', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert('REPORTS', 'Owner can GET /reports/summary', summary.ok && summary.data?.coworkingName, summary.data, 'HIGH');

  const monthly = await req('/reports/monthly-revenue', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert('REPORTS', 'Owner can GET /reports/monthly-revenue', monthly.ok && Array.isArray(monthly.data?.months), monthly.data, 'HIGH');

  const distribution = await req('/reports/space-distribution', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert('REPORTS', 'Owner can GET /reports/space-distribution', distribution.ok && Array.isArray(distribution.data), distribution.data, 'HIGH');

  // --- 8. STAFF CHECKIN / SCANNER ---
  console.log('\n--- 8. STAFF CHECKIN TERMINAL ---');
  const verifyCheckinFake = await req('/checkin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: 'QR-NONEXISTENT-999' }),
  });
  assert('CHECKIN', 'Verify non-existent QR returns 404', verifyCheckinFake.status === 404, verifyCheckinFake.data, 'HIGH');

  // --- 9. SECURITY & ACCESS CONTROL ---
  console.log('\n--- 9. SECURITY & ACCESS CONTROL (RBAC) ---');
  const memberAccessOwnerSummary = await req('/reports/summary', { headers: { Authorization: `Bearer ${memberToken}` } });
  assert('RBAC', 'Member blocked from /reports/summary (403)', memberAccessOwnerSummary.status === 403, memberAccessOwnerSummary.data, 'CRITICAL');

  const staffAccessOwnerSummary = await req('/reports/summary', { headers: { Authorization: `Bearer ${staffToken}` } });
  assert('RBAC', 'Staff blocked from /reports/summary (403)', staffAccessOwnerSummary.status === 403, staffAccessOwnerSummary.data, 'CRITICAL');

  const memberCreateSpace = await req('/spaces', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ namaSpace: 'Hacker Desk', tipe: 'desk', hargaPerJam: 10000, kapasitas: 1 }),
  });
  assert('RBAC', 'Member blocked from creating space (403)', memberCreateSpace.status === 403, memberCreateSpace.data, 'CRITICAL');

  console.log('\n==================================================');
  console.log('                 AUDIT SUMMARY                    ');
  console.log('==================================================');
  console.log(`PASSED CHECKS : ${report.passedChecks.length}`);
  console.log(`CRITICAL BUGS : ${report.criticalBugs.length}`);
  console.log(`HIGH BUGS     : ${report.highBugs.length}`);
  console.log(`MEDIUM BUGS   : ${report.mediumBugs.length}`);
  console.log(`LOW BUGS      : ${report.lowBugs.length}`);
}

runComprehensiveQA().catch(console.error);
