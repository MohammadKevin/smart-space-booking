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

async function diagnose() {
  console.log('--- DIAGNOSTIC SCRIPT ---');
  
  // 1. Login owner
  const ownerLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'Kevin135*' }),
  });
  const ownerToken = ownerLogin.data?.access_token;
  console.log('Owner logged in:', ownerLogin.data?.user?.spaceOwner);

  // 2. Login member
  const memberLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'kiplipplli@gmail.com', password: 'Kevin135*' }),
  });
  const memberToken = memberLogin.data?.access_token;
  console.log('Member logged in:', memberLogin.data?.user?.member);

  // 3. Check discounts
  const discounts = await req('/discounts');
  console.log('Existing discounts on live:', discounts.data);

  // If no discount, create PROMO2026
  if (Array.isArray(discounts.data) && discounts.data.length === 0) {
    console.log('Creating PROMO2026 discount...');
    const createDisc = await req('/discounts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        namaDiskon: 'Promo Awal Tahun 2026',
        kodeDiskon: 'PROMO2026',
        persentaseDiskon: 20,
        tanggalAwal: '2026-01-01T00:00:00.000Z',
        tanggalAkhir: '2026-12-31T23:59:59.000Z',
      }),
    });
    console.log('Created Discount:', createDisc);
  }

  // 4. Check spaces
  const spaces = await req('/spaces');
  console.log('Spaces on live:', spaces.data);

  let spaceId = spaces.data?.[0]?.id;
  if (!spaceId) {
    const createSp = await req('/spaces', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        namaSpace: 'Hot Desk Dedikasi Alpha',
        tipe: 'desk',
        hargaPerJam: 30000,
        kapasitas: 1,
        deskripsi: 'Meja kerja tenang dengan colokan daya dan kursi ergonomis.',
      }),
    });
    console.log('Created Space:', createSp);
    spaceId = createSp.data?.id;
  }

  // 5. Try creating reservation WITHOUT discount
  console.log('\nTesting reservation creation without discount...');
  const resNoDisc = await req('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify({
      spaceId: spaceId,
      tanggalReservasi: '2026-10-25',
      jamMulai: '14:00',
      durasiJam: 2,
    }),
  });
  console.log('Reservation response without discount:', resNoDisc);

  // 6. Test checkin endpoints if reservation created
  if (resNoDisc.ok && resNoDisc.data?.data) {
    const qr = resNoDisc.data.data.qrCode;
    console.log('QR Code:', qr);
  }

  // 7. Check transactions endpoint
  console.log('\nChecking /transactions endpoint...');
  const txRes = await req('/transactions', {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  console.log('Transactions response:', txRes);

  // 8. Check reports endpoint
  console.log('\nChecking /reports/summary endpoint...');
  const repRes = await req('/reports/summary', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  console.log('Reports summary response:', repRes);
}

diagnose().catch(console.error);
