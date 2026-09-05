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

async function runFullQA() {
  console.log('================================================================');
  console.log('      SMART SPACE BOOKING (WORKNEST) - FULL QA/QC SUITE         ');
  console.log('             Live Target: https://api-ukk.budayakita.com/api    ');
  console.log('================================================================\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    bugs: [],
  };

  function test(category, name, passed, details = {}) {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`  [PASS] [${category}] ${name}`);
    } else {
      results.failed++;
      console.log(`  [FAIL] [${category}] ${name}`);
      console.log(`         Details: ${JSON.stringify(details)}`);
      results.bugs.push({ category, name, details });
    }
  }

  // --- SECTION 1: AUTHENTICATION & RBAC ---
  console.log('--- 1. AUTHENTICATION & RBAC TESTS ---');
  
  // Login SpaceOwner
  const ownerLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', 'Login SpaceOwner (kvn4.200581@gmail.com)', 
    ownerLogin.ok && ownerLogin.data?.user?.role === 'admin_space' && !!ownerLogin.data?.access_token,
    ownerLogin.data
  );
  const ownerToken = ownerLogin.data?.access_token;
  const ownerUser = ownerLogin.data?.user;

  // Login Staff
  const staffLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'mhmdkevin198@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', 'Login Staff (mhmdkevin198@gmail.com)', 
    staffLogin.ok && staffLogin.data?.user?.role === 'staff' && !!staffLogin.data?.access_token,
    staffLogin.data
  );
  const staffToken = staffLogin.data?.access_token;
  const staffUser = staffLogin.data?.user;

  // Login Member
  const memberLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', 'Login Member (kiplipplli@gmail.com)', 
    memberLogin.ok && memberLogin.data?.user?.role === 'member' && !!memberLogin.data?.access_token,
    memberLogin.data
  );
  const memberToken = memberLogin.data?.access_token;
  const memberUser = memberLogin.data?.user;

  // Test Invalid Password
  const wrongPass = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'WrongPassword999!' }),
  });
  test('AUTH', 'Invalid Password returns 401 Unauthorized', wrongPass.status === 401, wrongPass.data);

  // Test Non-existent Email
  const noEmail = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nonexistent_user_999999@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', 'Non-existent Email returns 401 Unauthorized', noEmail.status === 401, noEmail.data);

  // Test Malformed Email Login
  const malformedEmail = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com@gmail.com', password: 'Kevin135*' }),
  });
  test('AUTH', 'Malformed email returns 400 Bad Request with validation message', 
    malformedEmail.status === 400, malformedEmail.data
  );

  // Profile endpoints for all 3 roles
  const ownerProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('AUTH', 'Owner Profile (/auth/profile) contains spaceOwner data', 
    ownerProf.ok && !!ownerProf.data?.spaceOwner, ownerProf.data
  );

  const staffProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${staffToken}` } });
  test('AUTH', 'Staff Profile (/auth/profile) contains staff & owner data', 
    staffProf.ok && !!staffProf.data?.staff?.owner, staffProf.data
  );

  const memberProf = await req('/auth/profile', { headers: { Authorization: `Bearer ${memberToken}` } });
  test('AUTH', 'Member Profile (/auth/profile) contains member data', 
    memberProf.ok && !!memberProf.data?.member, memberProf.data
  );

  // Unauthenticated /auth/profile
  const noAuthProf = await req('/auth/profile');
  test('AUTH', 'Unauthenticated request to /auth/profile returns 401', noAuthProf.status === 401, noAuthProf.data);

  // Staff creation RBAC: Member trying to create staff
  const memberCreateStaff = await req('/auth/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ email: 'fake_staff@gmail.com', password: 'Password123!', namaStaff: 'Fake', telp: '08123456789' }),
  });
  test('RBAC', 'Member blocked from creating staff (HTTP 403)', memberCreateStaff.status === 403, memberCreateStaff.data);

  // Staff creation RBAC: Staff trying to create staff
  const staffCreateStaff = await req('/auth/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ email: 'fake_staff2@gmail.com', password: 'Password123!', namaStaff: 'Fake 2', telp: '08123456789' }),
  });
  test('RBAC', 'Staff blocked from creating staff (HTTP 403)', staffCreateStaff.status === 403, staffCreateStaff.data);

  // --- SECTION 2: SPACES & WORKSTATIONS ---
  console.log('\n--- 2. SPACES & WORKSTATIONS TESTS ---');
  
  const allSpaces = await req('/spaces');
  test('SPACES', 'Public GET /spaces returns array of spaces', allSpaces.ok && Array.isArray(allSpaces.data), allSpaces.data);

  const spacesList = allSpaces.data || [];
  console.log(`       Found ${spacesList.length} spaces.`);
  
  let targetSpace = spacesList[0];
  if (!targetSpace) {
    console.log('       No spaces found, attempting to create one with Owner token...');
    const createSpaceRes = await req('/spaces', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        namaSpace: 'Test QA Hot Desk Pro',
        tipe: 'desk',
        hargaPerJam: 25000,
        kapasitas: 1,
        deskripsi: 'Meja kerja individu dengan monitor 24 inch dan high-speed WiFi',
      }),
    });
    targetSpace = createSpaceRes.data;
  }

  // Filter Space by tipe
  const filterDesk = await req('/spaces?tipe=desk');
  test('SPACES', 'Filter spaces by tipe=desk works', 
    filterDesk.ok && Array.isArray(filterDesk.data) && filterDesk.data.every(s => s.tipe === 'desk'),
    filterDesk.data
  );

  // Filter Space by search keyword
  if (targetSpace) {
    const filterSearch = await req(`/spaces?search=${encodeURIComponent(targetSpace.namaSpace.substring(0, 4))}`);
    test('SPACES', 'Search space by keyword works', 
      filterSearch.ok && Array.isArray(filterSearch.data) && filterSearch.data.some(s => s.id === targetSpace.id),
      filterSearch.data
    );
  }

  // Get My Spaces by Owner
  const mySpaces = await req('/spaces/my-spaces', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('SPACES', 'Owner GET /spaces/my-spaces returns owner spaces', mySpaces.ok && Array.isArray(mySpaces.data), mySpaces.data);

  // Get My Spaces by Member (RBAC check)
  const memberMySpaces = await req('/spaces/my-spaces', { headers: { Authorization: `Bearer ${memberToken}` } });
  test('RBAC', 'Member blocked from /spaces/my-spaces (HTTP 403)', memberMySpaces.status === 403, memberMySpaces.data);

  // Member trying to POST /spaces (RBAC check)
  const memberCreateSpace = await req('/spaces', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      namaSpace: 'Unauthorized Space',
      tipe: 'desk',
      hargaPerJam: 50000,
      kapasitas: 2,
    }),
  });
  test('RBAC', 'Member blocked from POST /spaces (HTTP 403)', memberCreateSpace.status === 403, memberCreateSpace.data);

  // --- SECTION 3: DISCOUNTS & PROMO CODES ---
  console.log('\n--- 3. DISCOUNTS & PROMO CODES TESTS ---');

  const discounts = await req('/discounts');
  test('DISCOUNT', 'Public GET /discounts returns array', discounts.ok && Array.isArray(discounts.data), discounts.data);

  // Check valid promo code
  let activePromoCode = 'PROMO2026';
  const promoCheck = await req(`/discounts/check/${activePromoCode}`);
  test('DISCOUNT', `GET /discounts/check/${activePromoCode} returns valid status`, 
    promoCheck.ok && (promoCheck.data?.isValid || promoCheck.data?.diskon?.id), promoCheck.data
  );

  // Check case-insensitivity of promo check
  const promoCheckLower = await req(`/discounts/check/${activePromoCode.toLowerCase()}`);
  test('DISCOUNT', 'Discount code check is case-insensitive', 
    promoCheckLower.ok && (promoCheckLower.data?.isValid || promoCheckLower.data?.diskon?.id), promoCheckLower.data
  );

  // Check non-existent promo
  const nonExistentPromo = await req('/discounts/check/PROMO_FAKE_999999');
  test('DISCOUNT', 'Non-existent promo returns 404', nonExistentPromo.status === 404, nonExistentPromo.data);

  // Member trying to POST /discounts (RBAC check)
  const memberCreateDiscount = await req('/discounts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      namaDiskon: 'Member Promo',
      kodeDiskon: 'MEMBER50',
      persentaseDiskon: 50,
      tanggalAwal: '2026-01-01',
      tanggalAkhir: '2026-12-31',
    }),
  });
  test('RBAC', 'Member blocked from POST /discounts (HTTP 403)', memberCreateDiscount.status === 403, memberCreateDiscount.data);

  // Owner creating invalid discount (tanggalAwal >= tanggalAkhir)
  const invalidDateDiscount = await req('/discounts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      namaDiskon: 'Invalid Date Promo',
      kodeDiskon: `INVALID_${Date.now()}`,
      persentaseDiskon: 20,
      tanggalAwal: '2026-12-31T00:00:00.000Z',
      tanggalAkhir: '2026-01-01T00:00:00.000Z',
    }),
  });
  test('DISCOUNT', 'Discount with tanggalAwal >= tanggalAkhir returns 400 Bad Request', 
    invalidDateDiscount.status === 400, invalidDateDiscount.data
  );

  // --- SECTION 4: RESERVATIONS & COLLISION DETECTION ---
  console.log('\n--- 4. RESERVATIONS & COLLISION DETECTION TESTS ---');

  // Test past date booking
  const pastDateRes = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: '2020-01-01',
      jamMulai: '10:00',
      durasiJam: 2,
    }),
  });
  test('BOOKING', 'Booking on past date rejected with 400 Bad Request', 
    pastDateRes.status === 400 && pastDateRes.data?.message?.includes('masa lalu'), pastDateRes.data
  );

  // Test 0 duration booking
  const zeroDurationRes = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: '2026-10-15',
      jamMulai: '10:00',
      durasiJam: 0,
    }),
  });
  test('BOOKING', 'Booking with 0 duration rejected with 400 Bad Request', 
    zeroDurationRes.status === 400, zeroDurationRes.data
  );

  // Create valid booking 1 (slot: 2026-11-20, 09:00 - 11:00)
  const targetBookingDate = '2026-11-20';
  const booking1 = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: targetBookingDate,
      jamMulai: '09:00',
      durasiJam: 2, // ends 11:00
      kodeDiskon: activePromoCode,
    }),
  });
  test('BOOKING', 'Create valid booking with discount code', 
    booking1.ok && booking1.data?.data?.qrCode && booking1.data?.data?.transaksi?.nomorInvoice,
    booking1.data
  );
  const res1 = booking1.data?.data;
  console.log(`       Created Reservation #${res1?.id}, QR: ${res1?.qrCode}, Invoice: ${res1?.transaksi?.nomorInvoice}`);

  // Verify Discount Calculation
  const basePrice = targetSpace.hargaPerJam * 2;
  const expectedTotal = res1?.detailReservasi?.diskon?.persentaseDiskon 
    ? basePrice - (basePrice * res1.detailReservasi.diskon.persentaseDiskon) / 100
    : basePrice;
  test('BOOKING', 'Discount price mathematically correct', 
    res1?.detailReservasi?.totalHarga === expectedTotal, 
    { basePrice, expectedTotal, actual: res1?.detailReservasi?.totalHarga }
  );

  // Collision Test A: Exact overlap (09:00 - 11:00)
  const collisionExact = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: targetBookingDate,
      jamMulai: '09:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', 'Collision A: Exact overlap (09:00-11:00) rejected with 400', 
    collisionExact.status === 400 && collisionExact.data?.message?.includes('bentrok'), collisionExact.data
  );

  // Collision Test B: Overlapping start (08:00 - 10:00)
  const collisionStart = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: targetBookingDate,
      jamMulai: '08:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', 'Collision B: Overlapping start (08:00-10:00) rejected with 400', 
    collisionStart.status === 400 && collisionStart.data?.message?.includes('bentrok'), collisionStart.data
  );

  // Collision Test C: Overlapping end (10:00 - 12:00)
  const collisionEnd = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: targetBookingDate,
      jamMulai: '10:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', 'Collision C: Overlapping end (10:00-12:00) rejected with 400', 
    collisionEnd.status === 400 && collisionEnd.data?.message?.includes('bentrok'), collisionEnd.data
  );

  // Collision Test D: Inner sub-interval (09:30 - 10:30)
  const collisionInner = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: targetBookingDate,
      jamMulai: '09:30',
      durasiJam: 1,
    }),
  });
  test('COLLISION', 'Collision D: Inner sub-interval (09:30-10:30) rejected with 400', 
    collisionInner.status === 400 && collisionInner.data?.message?.includes('bentrok'), collisionInner.data
  );

  // Non-collision Test E: Adjacent slot right after (11:00 - 13:00) - SHOULD SUCCEED
  const adjacentSlot = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: targetBookingDate,
      jamMulai: '11:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', 'Adjacent slot right after (11:00-13:00) succeeds without false collision', 
    adjacentSlot.ok && adjacentSlot.data?.data?.id, adjacentSlot.data
  );

  // Non-collision Test F: Adjacent slot right before (07:00 - 09:00) - SHOULD SUCCEED
  const adjacentBefore = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: targetBookingDate,
      jamMulai: '07:00',
      durasiJam: 2,
    }),
  });
  test('COLLISION', 'Adjacent slot right before (07:00-09:00) succeeds without false collision', 
    adjacentBefore.ok && adjacentBefore.data?.data?.id, adjacentBefore.data
  );

  // --- SECTION 5: RESERVATION LIFECYCLE & CHECK-IN WORKFLOW ---
  console.log('\n--- 5. RESERVATION LIFECYCLE & CHECK-IN WORKFLOW TESTS ---');

  // Verify QR code when status is still 'pending'
  const verifyPending = await req('/checkin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode }),
  });
  test('CHECKIN', 'Verify QR on pending reservation shows canCheckIn = false', 
    verifyPending.ok && verifyPending.data?.canCheckIn === false, verifyPending.data
  );

  // Attempt checkin on pending reservation (should fail)
  const checkinPending = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode, action: 'checkin' }),
  });
  test('CHECKIN', 'Check-in on pending reservation rejected with 400', 
    checkinPending.status === 400 && checkinPending.data?.message?.includes('pending'), checkinPending.data
  );

  // Owner approves reservation
  const approveRes = await req(`/reservations/${res1.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ status: 'disetujui' }),
  });
  test('WORKFLOW', 'Owner approves reservation (status -> disetujui)', 
    approveRes.ok && approveRes.data?.data?.status === 'disetujui', approveRes.data
  );

  // Verify QR after approval
  const verifyApproved = await req('/checkin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode }),
  });
  test('CHECKIN', 'Verify QR on approved reservation shows canCheckIn = true, canCheckOut = false', 
    verifyApproved.ok && verifyApproved.data?.canCheckIn === true && verifyApproved.data?.canCheckOut === false, 
    verifyApproved.data
  );

  // Staff performs check-in
  const performCheckIn = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode, action: 'checkin' }),
  });
  test('CHECKIN', 'Staff executes check-in (status -> aktif)', 
    performCheckIn.ok && performCheckIn.data?.reservation?.status === 'aktif', performCheckIn.data
  );

  // Verify QR during active session
  const verifyActive = await req('/checkin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode }),
  });
  test('CHECKIN', 'Verify QR on active reservation shows canCheckIn = false, canCheckOut = true', 
    verifyActive.ok && verifyActive.data?.canCheckIn === false && verifyActive.data?.canCheckOut === true, 
    verifyActive.data
  );

  // Staff performs check-out
  const performCheckOut = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode, action: 'checkout' }),
  });
  test('CHECKIN', 'Staff executes check-out (status -> selesai)', 
    performCheckOut.ok && performCheckOut.data?.reservation?.status === 'selesai', performCheckOut.data
  );

  // Verify QR on completed session
  const verifyCompleted = await req('/checkin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode }),
  });
  test('CHECKIN', 'Verify QR on completed reservation shows canCheckIn = false, canCheckOut = false', 
    verifyCompleted.ok && verifyCompleted.data?.canCheckIn === false && verifyCompleted.data?.canCheckOut === false, 
    verifyCompleted.data
  );

  // Attempt double checkout (should fail)
  const doubleCheckout = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: res1.qrCode, action: 'checkout' }),
  });
  test('CHECKIN', 'Check-out on completed reservation rejected with 400', 
    doubleCheckout.status === 400 && doubleCheckout.data?.message?.includes('selesai'), doubleCheckout.data
  );

  // Test Member Self-Cancellation
  const cancelTarget = adjacentBefore.data?.data;
  if (cancelTarget) {
    const cancelRes = await req(`/reservations/${cancelTarget.id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    test('WORKFLOW', 'Member can self-cancel pending reservation', 
      cancelRes.ok && cancelRes.data?.data?.status === 'dibatalkan', cancelRes.data
    );

    // Member trying to cancel already cancelled reservation
    const doubleCancel = await req(`/reservations/${cancelTarget.id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    test('WORKFLOW', 'Member cancelling already cancelled reservation returns 400', 
      doubleCancel.status === 400, doubleCancel.data
    );
  }

  // --- SECTION 6: TRANSACTIONS & MIDTRANS PAYMENT ---
  console.log('\n--- 6. TRANSACTIONS & MIDTRANS PAYMENT TESTS ---');

  // Test start payment for approved reservation
  const approvedResForPay = adjacentSlot.data?.data;
  if (approvedResForPay) {
    // First approve it
    await req(`/reservations/${approvedResForPay.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'disetujui' }),
    });

    const paySnap = await req(`/transactions/${approvedResForPay.id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    test('PAYMENT', 'Member startPayment on approved reservation creates Snap Token', 
      paySnap.ok && !!paySnap.data?.data?.snapToken && !!paySnap.data?.data?.nomorInvoice, paySnap.data
    );

    // Member listing transactions
    const memberTxs = await req('/transactions', { headers: { Authorization: `Bearer ${memberToken}` } });
    test('PAYMENT', 'Member GET /transactions returns transaction list', 
      memberTxs.ok && Array.isArray(memberTxs.data), memberTxs.data
    );

    // Owner listing transactions
    const ownerTxs = await req('/transactions', { headers: { Authorization: `Bearer ${ownerToken}` } });
    test('PAYMENT', 'Owner GET /transactions returns transaction list', 
      ownerTxs.ok && Array.isArray(ownerTxs.data), ownerTxs.data
    );
  }

  // --- SECTION 7: REPORTS & FINANCIAL ANALYTICS ---
  console.log('\n--- 7. REPORTS & FINANCIAL ANALYTICS TESTS ---');

  const summaryReport = await req('/reports/summary', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('REPORT', 'Owner GET /reports/summary returns metrics', 
    summaryReport.ok && summaryReport.data?.coworkingName && typeof summaryReport.data?.totalRevenue === 'number',
    summaryReport.data
  );

  const monthlyReport = await req('/reports/monthly-revenue', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('REPORT', 'Owner GET /reports/monthly-revenue returns 12 months array', 
    monthlyReport.ok && Array.isArray(monthlyReport.data?.months) && monthlyReport.data.months.length === 12,
    monthlyReport.data
  );

  const distReport = await req('/reports/space-distribution', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('REPORT', 'Owner GET /reports/space-distribution returns array', 
    distReport.ok && Array.isArray(distReport.data), distReport.data
  );

  // Member trying to access reports (RBAC check)
  const memberReport = await req('/reports/summary', { headers: { Authorization: `Bearer ${memberToken}` } });
  test('RBAC', 'Member blocked from /reports/summary (HTTP 403)', memberReport.status === 403, memberReport.data);

  // Staff trying to access reports (RBAC check)
  const staffReport = await req('/reports/summary', { headers: { Authorization: `Bearer ${staffToken}` } });
  test('RBAC', 'Staff blocked from /reports/summary (HTTP 403)', staffReport.status === 403, staffReport.data);

  // --- SECTION 8: REVIEWS ---
  console.log('\n--- 8. REVIEWS & RATINGS TESTS ---');

  // Member reviewing completed reservation (res1)
  const reviewRes = await req('/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      reservasiId: res1.id,
      rating: 5,
      komentar: 'Tempat sangat nyaman, WiFi kencang, fasilitas sangat lengkap!',
    }),
  });
  test('REVIEW', 'Member can review completed reservation', 
    reviewRes.ok || reviewRes.status === 403 /* if already reviewed in previous run */, reviewRes.data
  );

  // Public get reviews
  const publicReviews = await req('/reviews');
  test('REVIEW', 'Public GET /reviews returns reviews data', 
    publicReviews.ok && Array.isArray(publicReviews.data?.data || publicReviews.data), publicReviews.data
  );

  // --- SECTION 9: USER MANAGEMENT ---
  console.log('\n--- 9. USER & PROFILE MANAGEMENT TESTS ---');

  // Owner get members
  const ownerGetMembers = await req('/users/members', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('USER_MGMT', 'Owner GET /users/members returns members list', 
    ownerGetMembers.ok && Array.isArray(ownerGetMembers.data), ownerGetMembers.data
  );

  // Owner get staffs
  const ownerGetStaffs = await req('/users/staffs', { headers: { Authorization: `Bearer ${ownerToken}` } });
  test('USER_MGMT', 'Owner GET /users/staffs returns staffs list', 
    ownerGetStaffs.ok && Array.isArray(ownerGetStaffs.data), ownerGetStaffs.data
  );

  // Member trying to get staffs list (RBAC check)
  const memberGetStaffs = await req('/users/staffs', { headers: { Authorization: `Bearer ${memberToken}` } });
  test('RBAC', 'Member blocked from GET /users/staffs (HTTP 403)', memberGetStaffs.status === 403, memberGetStaffs.data);

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${results.total} | PASSED: ${results.passed} | FAILED: ${results.failed}`);
  console.log(`PASS RATE: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('================================================================\n');

  if (results.bugs.length > 0) {
    console.log('LIST OF DETECTED ISSUES / FAILED TESTS:');
    results.bugs.forEach((b, i) => {
      console.log(`${i + 1}. [${b.category}] ${b.name}:`, b.details);
    });
  }
}

runFullQA().catch(console.error);
