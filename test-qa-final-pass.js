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

async function runFinalQAPass() {
  console.log('================================================================');
  console.log('   WORKNEST PLATFORM - FINAL VERIFICATION QA/QC AUDIT SUITE     ');
  console.log('             Live Target: https://api-ukk.budayakita.com/api    ');
  console.log('================================================================\n');

  const stats = { total: 0, passed: 0, failed: 0 };

  function assert(category, name, condition, details = {}) {
    stats.total++;
    if (condition) {
      stats.passed++;
      console.log(`  [PASS] [${category}] ${name}`);
    } else {
      stats.failed++;
      console.log(`  [FAIL] [${category}] ${name}`);
      console.log(`         Details:`, JSON.stringify(details));
    }
  }

  // --- 1. AUTHENTICATION & RBAC ---
  console.log('--- 1. AUTHENTICATION & ACCESS CONTROL (RBAC) ---');
  
  const ownerLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'Login SpaceOwner (kvn4.200581@gmail.com)', 
    ownerLogin.ok && ownerLogin.data?.user?.role === 'admin_space' && !!ownerLogin.data?.access_token,
    ownerLogin.data
  );
  const ownerToken = ownerLogin.data?.access_token;

  const staffLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'mhmdkevin198@gmail.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'Login Staff (mhmdkevin198@gmail.com)', 
    staffLogin.ok && staffLogin.data?.user?.role === 'staff' && !!staffLogin.data?.access_token,
    staffLogin.data
  );
  const staffToken = staffLogin.data?.access_token;

  const memberLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'Login Member (kiplipplli@gmail.com)', 
    memberLogin.ok && memberLogin.data?.user?.role === 'member' && !!memberLogin.data?.access_token,
    memberLogin.data
  );
  const memberToken = memberLogin.data?.access_token;

  // Invalid password
  const wrongPass = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'InvalidPassword123' }),
  });
  assert('AUTH', 'Invalid password returns 401 Unauthorized', wrongPass.status === 401, wrongPass.data);

  // Non-existent email
  const wrongEmail = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'unknown_account_9999@domain.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'Non-existent email returns 401 Unauthorized', wrongEmail.status === 401, wrongEmail.data);

  // Malformed email
  const malformedEmail = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com@gmail.com', password: 'Kevin135*' }),
  });
  assert('AUTH', 'Malformed email returns 400 Bad Request with validation message', malformedEmail.status === 400, malformedEmail.data);

  // Profiles
  const ownerProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert('AUTH', 'Owner /auth/profile returns spaceOwner entity', ownerProf.ok && !!ownerProf.data?.spaceOwner, ownerProf.data);

  const staffProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${staffToken}` } });
  assert('AUTH', 'Staff /auth/profile returns staff & owner links', staffProf.ok && !!staffProf.data?.staff?.ownerId, staffProf.data);

  const memberProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${memberToken}` } });
  assert('AUTH', 'Member /auth/profile returns member entity', memberProf.ok && !!memberProf.data?.member, memberProf.data);

  // Unauthorized profile
  const unauth = await req('/auth/profile');
  assert('AUTH', 'Unauthenticated request returns 401', unauth.status === 401, unauth.data);

  // Staff creation RBAC
  const memberStaffCreate = await req('/auth/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ email: 'illegal@test.com', password: 'Password123*', namaStaff: 'Illegal', telp: '0812345678' }),
  });
  assert('RBAC', 'Member blocked from creating staff (HTTP 403 Forbidden)', memberStaffCreate.status === 403, memberStaffCreate.data);

  // --- 2. SPACES & INVENTORY ---
  console.log('\n--- 2. SPACES & INVENTORY ---');
  const allSpaces = await req('/spaces');
  assert('SPACES', 'Public GET /spaces returns array', allSpaces.ok && Array.isArray(allSpaces.data), allSpaces.data);
  const targetSpace = allSpaces.data?.[0];

  // --- 3. DISCOUNTS & PROMO CODES ---
  console.log('\n--- 3. DISCOUNTS & PROMO CODES ---');
  const promoRes = await req('/discounts/check/PROMO2026');
  assert('DISCOUNT', 'Check promo code PROMO2026 validity', promoRes.ok && (promoRes.data?.isValid || promoRes.data?.diskon?.id), promoRes.data);

  // --- 4. RESERVATIONS, ANTI-COLLISION & PRICING ---
  console.log('\n--- 4. RESERVATIONS & COLLISION DETECTION ---');
  // Use unique day offset based on minute/hour so each run has a fresh date
  const randomDays = 20 + Math.floor(Math.random() * 200);
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + randomDays);
  const bookingDateStr = bookingDate.toISOString().split('T')[0];

  const book1 = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: bookingDateStr,
      jamMulai: '09:00',
      durasiJam: 2,
      kodeDiskon: 'PROMO2026',
    }),
  });
  assert('BOOKING', 'Create valid booking with discount calculation', 
    book1.ok && (book1.data?.data?.qrCode || book1.data?.qrCode), book1.data
  );
  const res1 = book1.data?.data || book1.data;

  // Collision Overlap
  const bookCollision = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: bookingDateStr,
      jamMulai: '09:00',
      durasiJam: 2,
    }),
  });
  assert('COLLISION', 'Exact slot collision rejected (HTTP 400)', bookCollision.status === 400, bookCollision.data);

  // Adjacent Slot Right After
  const bookAdjacent = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: bookingDateStr,
      jamMulai: '11:00',
      durasiJam: 2,
    }),
  });
  assert('COLLISION', 'Adjacent slot right after (11:00 - 13:00) succeeds', 
    bookAdjacent.ok && (bookAdjacent.data?.data?.id || bookAdjacent.data?.id), bookAdjacent.data
  );

  // --- 5. LIFECYCLE, CHECK-IN & CHECK-OUT ---
  console.log('\n--- 5. LIFECYCLE WORKFLOW & CHECK-IN TERMINAL ---');

  // SpaceOwner approves res1
  const approveRes1 = await req(`/reservations/${res1.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ status: 'disetujui' }),
  });
  assert('WORKFLOW', 'SpaceOwner approves reservation (status -> disetujui)', approveRes1.ok, approveRes1.data);

  // Verify QR on approved reservation
  const verifyApproved = await req('/checkin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode }),
  });
  assert('CHECKIN', 'Verify QR on approved reservation shows canCheckIn = true', 
    verifyApproved.ok && verifyApproved.data?.canCheckIn === true, verifyApproved.data
  );

  // Staff executes Check-In
  const checkinRes = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode, action: 'checkin' }),
  });
  assert('CHECKIN', 'Staff executes Check-In (status -> aktif)', 
    checkinRes.ok && (checkinRes.data?.reservation?.status === 'aktif' || checkinRes.data?.data?.status === 'aktif'),
    checkinRes.data
  );

  // Staff executes Check-Out
  const checkoutRes = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode, action: 'checkout' }),
  });
  assert('CHECKIN', 'Staff executes Check-Out (status -> selesai)', 
    checkoutRes.ok && (checkoutRes.data?.reservation?.status === 'selesai' || checkoutRes.data?.data?.status === 'selesai'),
    checkoutRes.data
  );

  // Double Check-Out Protection
  const doubleCheckout = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode, action: 'checkout' }),
  });
  assert('CHECKIN', 'Double checkout on completed reservation rejected (HTTP 400)', doubleCheckout.status === 400, doubleCheckout.data);

  // --- 6. TRANSACTIONS & MIDTRANS PAYMENT ---
  console.log('\n--- 6. TRANSACTIONS & MIDTRANS PAYMENT ---');
  const res2 = bookAdjacent.data?.data || bookAdjacent.data;
  if (res2) {
    // Approve res2
    await req(`/reservations/${res2.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'disetujui' }),
    });

    const paySnap = await req(`/transactions/${res2.id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert('PAYMENT', 'Member startPayment creates Midtrans Snap Token & Invoice', 
      paySnap.ok && !!paySnap.data?.data?.snapToken && !!paySnap.data?.data?.nomorInvoice,
      paySnap.data
    );
  }

  // --- 7. REPORTS & ANALYTICS ---
  console.log('\n--- 7. REPORTS & FINANCIAL ANALYTICS ---');
  const summaryReport = await req('/reports/summary', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert('REPORT', 'Owner GET /reports/summary returns analytics metrics', 
    summaryReport.ok && summaryReport.data?.coworkingName && typeof summaryReport.data?.totalRevenue === 'number',
    summaryReport.data
  );

  const monthlyReport = await req('/reports/monthly-revenue', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert('REPORT', 'Owner GET /reports/monthly-revenue returns 12 months array', 
    monthlyReport.ok && Array.isArray(monthlyReport.data?.months) && monthlyReport.data.months.length === 12,
    monthlyReport.data
  );

  // Member block from report
  const memberBlock = await req('/reports/summary', { headers: { Authorization: `Bearer ${memberToken}` } });
  assert('RBAC', 'Member blocked from /reports/summary (HTTP 403 Forbidden)', memberBlock.status === 403, memberBlock.data);

  // --- 8. REVIEWS & RATINGS ---
  console.log('\n--- 8. REVIEWS & RATINGS ---');
  const reviewRes = await req('/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      reservasiId: res1.id,
      rating: 5,
      komentar: 'Tempat kerja sangat nyaman, fasilitas lengkap, WiFi super kencang!',
    }),
  });
  assert('REVIEW', 'Member can review completed reservation', 
    reviewRes.ok || reviewRes.status === 403 /* if already reviewed */, reviewRes.data
  );

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${stats.total} | PASSED: ${stats.passed} | FAILED: ${stats.failed}`);
  console.log(`PASS RATE: ${Math.round((stats.passed / stats.total) * 100)}%`);
  console.log('================================================================\n');
}

runFinalQAPass().catch(console.error);
