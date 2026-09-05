const API_URL = 'https://api-ukk.budayakita.com/api';

async function req(path, options = {}) {
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

async function testMeetingRoomFlow() {
  console.log('Testing Meeting Room Pending Workflow...');

  const ownerLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'Kevin135*' }),
  });
  const ownerToken = ownerLogin.data?.access_token;

  const staffLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'mhmdkevin198@gmail.com', password: 'Kevin135*' }),
  });
  const staffToken = staffLogin.data?.access_token;

  const memberLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com', password: 'Kevin135*' }),
  });
  const memberToken = memberLogin.data?.access_token;

  // Create or get a meeting room space
  let spaces = (await req('/spaces')).data || [];
  let meetingSpace = spaces.find(s => s.tipe === 'meeting_room');

  if (!meetingSpace) {
    const createMr = await req('/spaces', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        namaSpace: 'Executive Meeting Room 1',
        tipe: 'meeting_room',
        hargaPerJam: 60000,
        kapasitas: 6,
        deskripsi: 'Ruang rapat berperedam suara dengan Smart TV 4K',
      }),
    });
    meetingSpace = createMr.data;
  }

  console.log('Meeting Space:', meetingSpace?.namaSpace, 'ID:', meetingSpace?.id);

  // Book meeting room
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const bookMr = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: meetingSpace.id,
      tanggalReservasi: futureDateStr,
      jamMulai: '13:00',
      durasiJam: 2,
    }),
  });

  console.log('Book Meeting Room Status:', bookMr.status, 'Initial Reservation Status:', bookMr.data?.data?.status || bookMr.data?.status);

  const resMr = bookMr.data?.data || bookMr.data;

  // 1. Verify QR when pending
  const verifyPending = await req('/checkin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: resMr.qrCode }),
  });
  console.log('Verify QR on Pending:', verifyPending.data);

  // 2. Try checkin on pending
  const checkinPending = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: resMr.qrCode, action: 'checkin' }),
  });
  console.log('Checkin on Pending (Should fail):', checkinPending.status, checkinPending.data);

  // 3. Owner approves
  const approve = await req(`/reservations/${resMr.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ status: 'disetujui' }),
  });
  console.log('Approve Meeting Room:', approve.status, approve.data?.data?.status || approve.data?.status);

  // 4. Staff checkin
  const checkinApproved = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: resMr.qrCode, action: 'checkin' }),
  });
  console.log('Staff Check-In:', checkinApproved.status, checkinApproved.data?.message);

  // 5. Staff checkout
  const checkout = await req('/checkin/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ qrCode: resMr.qrCode, action: 'checkout' }),
  });
  console.log('Staff Check-Out:', checkout.status, checkout.data?.message);
}

testMeetingRoomFlow().catch(console.error);
