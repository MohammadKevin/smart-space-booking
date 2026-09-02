const API_URL = 'http://localhost:8000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runQATests() {
  console.log('====================================================');
  console.log('WORKNEST - FULL QA/QC VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, extraInfo = '') {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName} - ${extraInfo}`);
    }
  }

  console.log('--- TEST 1: AUTENTIKASI SEMUA ROLE ---');
  const memberLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kipilpplli@gmail.com', password: 'password123' }),
  });
  assert(
    memberLogin.ok && memberLogin.data?.user?.role === 'member',
    'Login Member: kipilpplli@gmail.com',
    JSON.stringify(memberLogin.data)
  );

  const staffLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'mhmdkevin198@gmail.com', password: 'password123' }),
  });
  assert(
    staffLogin.ok && staffLogin.data?.user?.role === 'staff',
    'Login Staff: mhmdkevin198@gmail.com',
    JSON.stringify(staffLogin.data)
  );

  const ownerLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'password123' }),
  });
  assert(
    ownerLogin.ok && ownerLogin.data?.user?.role === 'admin_space',
    'Login Owner: kvn4.200581@gmail.com',
    JSON.stringify(ownerLogin.data)
  );

  const memberToken = memberLogin.data?.access_token;
  const staffToken = staffLogin.data?.access_token;
  const ownerToken = ownerLogin.data?.access_token;

  console.log('\n--- TEST 2: KATALOG RUANGAN & INVENTARIS ---');
  const spacesRes = await request('/spaces');
  assert(spacesRes.ok && Array.isArray(spacesRes.data) && spacesRes.data.length > 0, 'Katalog Ruangan tersedia');
  const targetSpace = spacesRes.data[0];
  console.log(`Ruangan Pengujian: ${targetSpace.namaSpace} (ID: ${targetSpace.id})`);

  console.log('\n--- TEST 3: ORDER PEMESANAN RUANGAN OLEH MEMBER ---');
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 7);
  const bookingDateStr = bookingDate.toISOString().split('T')[0];

  const orderRes = await request('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: bookingDateStr,
      jamMulai: '10:00',
      durasiJam: 2,
      kodeDiskon: 'PROMO2026',
    }),
  });

  assert(
    orderRes.ok && orderRes.data?.data?.qrCode && orderRes.data?.data?.status === 'pending',
    'Order Berhasil & QR Code Tiket Tergenerate',
    JSON.stringify(orderRes.data)
  );

  const newReservation = orderRes.data?.data;
  const qrCode = newReservation?.qrCode;
  console.log(`Tiket QR Terbit: ${qrCode} (Reservasi #${newReservation?.id})`);
  assert(
    newReservation?.transaksi?.nomorInvoice && newReservation?.transaksi?.statusPembayaran === 'belum_bayar',
    'Invoice Transaksi Otomatis Terbuat'
  );

  console.log('\n--- TEST 4: ANTI-COLLISION / DETEKSI JADWAL BENTROK ---');
  const collisionRes = await request('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: targetSpace.id,
      tanggalReservasi: bookingDateStr,
      jamMulai: '11:00',
      durasiJam: 2,
    }),
  });

  assert(
    collisionRes.status === 400 && collisionRes.data?.message?.includes('bentrok'),
    'Deteksi Bentrok Jadwal Berfungsi (HTTP 400)',
    JSON.stringify(collisionRes.data)
  );

  console.log('\n--- TEST 5: PERSETUJUAN RESERVASI OLEH OWNER/ADMIN ---');
  const approveRes = await request(`/reservations/${newReservation.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ status: 'disetujui' }),
  });
  assert(
    approveRes.ok && approveRes.data?.data?.status === 'disetujui',
    'Owner Menyetujui Reservasi (Status -> disetujui)',
    JSON.stringify(approveRes.data)
  );

  console.log('\n--- TEST 6: RESEPSIONIS / STAFF VERIFIKASI QR CODE ---');
  const verifyQrRes = await request('/checkin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: qrCode }),
  });
  assert(
    verifyQrRes.ok && verifyQrRes.data?.canCheckIn === true,
    'Staff Berhasil Memverifikasi Tiket QR (Siap Check-In)',
    JSON.stringify(verifyQrRes.data)
  );

  console.log('\n--- TEST 7: RESEPSIONIS / STAFF EKSEKUSI CHECK-IN ---');
  const checkInRes = await request('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: qrCode, action: 'checkin' }),
  });
  assert(
    checkInRes.ok && checkInRes.data?.reservation?.status === 'aktif',
    'Check-In Berhasil (Status Reservasi -> aktif)',
    JSON.stringify(checkInRes.data)
  );

  console.log('\n--- TEST 8: RESEPSIONIS / STAFF EKSEKUSI CHECK-OUT ---');
  const checkOutRes = await request('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: qrCode, action: 'checkout' }),
  });
  assert(
    checkOutRes.ok && checkOutRes.data?.reservation?.status === 'selesai',
    'Check-Out Berhasil (Status Reservasi -> selesai)',
    JSON.stringify(checkOutRes.data)
  );

  console.log('\n--- TEST 9: PROTEKSI RUTE & ROLE PERMISSION BACKEND ---');
  const memberForbiddenAction = await request(`/reservations/${newReservation.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({ status: 'disetujui' }),
  });
  assert(
    memberForbiddenAction.status === 403,
    'Member Diblokir dari Mengubah Status Reservasi (HTTP 403 Forbidden)',
    JSON.stringify(memberForbiddenAction.data)
  );

  console.log('\n====================================================');
  console.log(`HASIL PENGUJIAN QA/QC: ${passedTests}/${totalTests} PASS (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');
}

runQATests().catch(console.error);
