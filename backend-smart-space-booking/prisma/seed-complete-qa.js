const { PrismaClient, Role, SpaceTipe, ReservasiStatus, PembayaranStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function generateQrCode(resId, memberId, spaceId) {
  const timestamp = Date.now();
  const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
  return `SSB-${timestamp}-${hex}`;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 MEMULAI PROVISIONING & DATA SEEDING REALISTIS (WORKNEST QA)');
  console.log('================================================================\n');

  const defaultPassword = 'Password123*';
  const hashedDefaultPassword = await bcrypt.hash(defaultPassword, 10);
  const kevinHashedPassword = await bcrypt.hash('Kevin135*', 10);

  // -------------------------------------------------------------
  // 1. SUPERADMIN
  // -------------------------------------------------------------
  console.log('1. Memeriksa Akun Superadmin...');
  let superAdmin = await prisma.user.findUnique({
    where: { email: 'kvn4.200581@gmail.com' },
  });

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'kvn4.200581@gmail.com',
        password: kevinHashedPassword,
        role: Role.super_admin,
        isVerified: true,
      },
    });
    console.log('   [+] Akun Superadmin dibuat: kvn4.200581@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { password: kevinHashedPassword, isVerified: true, role: Role.super_admin },
    });
    console.log('   [✓] Akun Superadmin disinkronkan: kvn4.200581@gmail.com');
  }

  // Set Platform Commission
  try {
    await prisma.platformSetting.upsert({
      where: { key: 'PLATFORM_COMMISSION_PERCENT' },
      update: { value: '5' },
      create: { key: 'PLATFORM_COMMISSION_PERCENT', value: '5' },
    });
    console.log('   [✓] Tarif Komisi Platform diatur: 5%\n');
  } catch (err) {
    console.log('   [!] Platform setting update skipped:', err.message);
  }

  // -------------------------------------------------------------
  // 2. SPACE OWNER
  // -------------------------------------------------------------
  console.log('2. Provisioning Akun Space Owner...');
  // Owner 1 (Kevin / Nolla Coworking Prime)
  let ownerUser1 = await prisma.user.findUnique({
    where: { email: 'mhmdkevin198@gmail.com' },
    include: { spaceOwner: true },
  });

  if (!ownerUser1) {
    ownerUser1 = await prisma.user.create({
      data: {
        email: 'mhmdkevin198@gmail.com',
        password: kevinHashedPassword,
        role: Role.admin_space,
        isVerified: true,
        spaceOwner: {
          create: {
            namaCoworking: 'Nolla Coworking & Creative Hub',
            namaPemilik: 'Muhammad Kevin',
            alamat: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
            telp: '081234567890',
          },
        },
      },
      include: { spaceOwner: true },
    });
    console.log('   [+] Space Owner 1 dibuat:', ownerUser1.email);
  } else {
    await prisma.user.update({
      where: { id: ownerUser1.id },
      data: { password: kevinHashedPassword, isVerified: true, role: Role.admin_space },
    });
    if (!ownerUser1.spaceOwner) {
      await prisma.spaceOwner.create({
        data: {
          namaCoworking: 'Nolla Coworking & Creative Hub',
          namaPemilik: 'Muhammad Kevin',
          alamat: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
          telp: '081234567890',
          userId: ownerUser1.id,
        },
      });
    } else {
      await prisma.spaceOwner.update({
        where: { id: ownerUser1.spaceOwner.id },
        data: { namaCoworking: 'Nolla Coworking & Creative Hub' },
      });
    }
    console.log('   [✓] Space Owner 1 disinkronkan:', ownerUser1.email);
  }

  const owner1 = await prisma.spaceOwner.findUnique({
    where: { userId: ownerUser1.id },
  });

  // Owner 2 (Ahmad Fauzi / Nolla Hub Sudirman)
  let ownerUser2 = await prisma.user.findUnique({
    where: { email: 'ahmad.fauzi.owner@example.com' },
    include: { spaceOwner: true },
  });

  if (!ownerUser2) {
    ownerUser2 = await prisma.user.create({
      data: {
        email: 'ahmad.fauzi.owner@example.com',
        password: hashedDefaultPassword,
        role: Role.admin_space,
        isVerified: true,
        spaceOwner: {
          create: {
            namaCoworking: 'Nolla Suites Sudirman',
            namaPemilik: 'Ahmad Fauzi',
            alamat: 'Gedung Menara Sudirman Lt. 12, Jakarta Pusat',
            telp: '081298761122',
          },
        },
      },
      include: { spaceOwner: true },
    });
    console.log('   [+] Space Owner 2 dibuat:', ownerUser2.email);
  } else {
    await prisma.user.update({
      where: { id: ownerUser2.id },
      data: { password: hashedDefaultPassword, isVerified: true, role: Role.admin_space },
    });
    console.log('   [✓] Space Owner 2 disinkronkan:', ownerUser2.email);
  }
  console.log();

  // -------------------------------------------------------------
  // 3. STAFF ACCOUNTS
  // -------------------------------------------------------------
  console.log('3. Provisioning Akun Staff Frontdesk...');
  // Staff 1 (kiplipplli@gmail.com / Rian Pratama)
  let staffUser1 = await prisma.user.findUnique({
    where: { email: 'kiplipplli@gmail.com' },
    include: { staff: true },
  });

  if (!staffUser1) {
    staffUser1 = await prisma.user.create({
      data: {
        email: 'kiplipplli@gmail.com',
        password: kevinHashedPassword,
        role: Role.staff,
        isVerified: true,
        staff: {
          create: {
            namaStaff: 'Rian Pratama',
            telp: '081234567891',
            ownerId: owner1.id,
          },
        },
      },
      include: { staff: true },
    });
    console.log('   [+] Staff 1 dibuat:', staffUser1.email, '-> Owner ID:', owner1.id);
  } else {
    await prisma.user.update({
      where: { id: staffUser1.id },
      data: { password: kevinHashedPassword, isVerified: true, role: Role.staff },
    });
    if (!staffUser1.staff) {
      await prisma.staff.create({
        data: {
          namaStaff: 'Rian Pratama',
          telp: '081234567891',
          userId: staffUser1.id,
          ownerId: owner1.id,
        },
      });
    } else {
      await prisma.staff.update({
        where: { id: staffUser1.staff.id },
        data: { ownerId: owner1.id },
      });
    }
    console.log('   [✓] Staff 1 disinkronkan:', staffUser1.email);
  }

  // Staff 2 (rian.staff@example.com)
  let staffUser2 = await prisma.user.findUnique({
    where: { email: 'rian.staff@example.com' },
    include: { staff: true },
  });

  if (!staffUser2) {
    staffUser2 = await prisma.user.create({
      data: {
        email: 'rian.staff@example.com',
        password: hashedDefaultPassword,
        role: Role.staff,
        isVerified: true,
        staff: {
          create: {
            namaStaff: 'Andi Saputra',
            telp: '081377889900',
            ownerId: owner1.id,
          },
        },
      },
      include: { staff: true },
    });
    console.log('   [+] Staff 2 dibuat:', staffUser2.email);
  } else {
    await prisma.user.update({
      where: { id: staffUser2.id },
      data: { password: hashedDefaultPassword, isVerified: true, role: Role.staff },
    });
    console.log('   [✓] Staff 2 disinkronkan:', staffUser2.email);
  }
  console.log();

  // -------------------------------------------------------------
  // 4. MEMBER ACCOUNTS (4 REALISTIC MEMBERS)
  // -------------------------------------------------------------
  console.log('4. Provisioning Akun Member...');
  const memberDefinitions = [
    {
      email: 'figmaworked@gmail.com',
      password: kevinHashedPassword,
      name: 'Budi Santoso',
      instansi: 'Tech Studio Nusantara',
      alamat: 'Jl. Wijaya I No. 12, Kebayoran Baru, Jakarta Selatan',
      telp: '081311223344',
    },
    {
      email: 'siti.rahmawati@example.com',
      password: hashedDefaultPassword,
      name: 'Siti Rahmawati',
      instansi: 'Creative Agency ID',
      alamat: 'Jl. Gandaria Tengah III No. 8, Jakarta Selatan',
      telp: '081355667788',
    },
    {
      email: 'dimas.anggara@example.com',
      password: hashedDefaultPassword,
      name: 'Dimas Anggara',
      instansi: 'PT Digital Kreasi Mandiri',
      alamat: 'Jl. TB Simatupang No. 22, Cilandak, Jakarta Selatan',
      telp: '081399887766',
    },
    {
      email: 'clara.wijaya@example.com',
      password: hashedDefaultPassword,
      name: 'Clara Wijaya',
      instansi: 'Fintech Alpha ID',
      alamat: 'Jl. Mega Kuningan Barat No. 5, Jakarta Selatan',
      telp: '081344332211',
    },
  ];

  const createdMembers = [];

  for (const mDef of memberDefinitions) {
    let u = await prisma.user.findUnique({
      where: { email: mDef.email },
      include: { member: true },
    });

    if (!u) {
      u = await prisma.user.create({
        data: {
          email: mDef.email,
          password: mDef.password,
          role: Role.member,
          isVerified: true,
          member: {
            create: {
              namaMember: mDef.name,
              instansi: mDef.instansi,
              alamat: mDef.alamat,
              telp: mDef.telp,
            },
          },
        },
        include: { member: true },
      });
      console.log(`   [+] Member dibuat: ${mDef.name} (${mDef.email})`);
    } else {
      await prisma.user.update({
        where: { id: u.id },
        data: { password: mDef.password, isVerified: true, role: Role.member },
      });
      if (!u.member) {
        await prisma.member.create({
          data: {
            namaMember: mDef.name,
            instansi: mDef.instansi,
            alamat: mDef.alamat,
            telp: mDef.telp,
            userId: u.id,
          },
        });
      }
      console.log(`   [✓] Member disinkronkan: ${mDef.name} (${mDef.email})`);
    }

    const memberRecord = await prisma.member.findUnique({
      where: { userId: u.id },
    });
    createdMembers.push(memberRecord);
  }
  console.log();

  // -------------------------------------------------------------
  // 5. 5 REALISTIC SPACES
  // -------------------------------------------------------------
  console.log('5. Provisioning 5 Inventaris Ruangan (Spaces)...');
  const spaceDefinitions = [
    {
      namaSpace: 'Dedicated Flex Desk Senopati',
      tipe: SpaceTipe.desk,
      hargaPerJam: 25000,
      kapasitas: 1,
      foto: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80',
      deskripsi: 'Workstation ergonomis dengan high-speed fiber internet, dedicated power outlet, ergonomic mesh chair, dan free-flow premium coffee.',
      ownerId: owner1.id,
    },
    {
      namaSpace: 'Executive Boardroom Platinum',
      tipe: SpaceTipe.meeting_room,
      hargaPerJam: 150000,
      kapasitas: 12,
      foto: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      deskripsi: 'Ruang rapat eksekutif berkapasitas 12 orang dilengkapi 4K Ultra HD Smart TV, wireless screen sharing, soundproof acoustic wall, dan video conference camera.',
      ownerId: owner1.id,
    },
    {
      namaSpace: 'Creative Brainstorming Suite',
      tipe: SpaceTipe.meeting_room,
      hargaPerJam: 100000,
      kapasitas: 8,
      foto: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
      deskripsi: 'Ruang diskusi santai dengan glass whiteboard dinding penuh, smart projector, sofa modular, dan flipchart untuk sesi ideasi tim.',
      ownerId: owner1.id,
    },
    {
      namaSpace: 'Private Office Kebayoran',
      tipe: SpaceTipe.private_office,
      hargaPerJam: 200000,
      kapasitas: 4,
      foto: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
      deskripsi: 'Kantor privat kedap suara untuk 4 orang dengan smart digital door lock, 4 set meja kerja premium, cabinet penyimpanan, dan akses 24/7.',
      ownerId: owner1.id,
    },
    {
      namaSpace: 'Hot Desk Sudirman Workpod',
      tipe: SpaceTipe.desk,
      hargaPerJam: 20000,
      kapasitas: 1,
      foto: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      deskripsi: 'Meja kerja fleksibel di area open-space dengan pencahayaan alami, koneksi WiFi 100 Mbps, dan suasana tenang untuk fokus kerja mandiri.',
      ownerId: owner1.id,
    },
  ];

  const createdSpaces = [];
  for (const sDef of spaceDefinitions) {
    let s = await prisma.space.findFirst({
      where: { namaSpace: sDef.namaSpace, ownerId: sDef.ownerId },
    });

    if (!s) {
      s = await prisma.space.create({
        data: sDef,
      });
      console.log(`   [+] Space dibuat: ${s.namaSpace} (${s.tipe}) - Rp ${s.hargaPerJam.toLocaleString('id-ID')}/jam`);
    } else {
      s = await prisma.space.update({
        where: { id: s.id },
        data: sDef,
      });
      console.log(`   [✓] Space disinkronkan: ${s.namaSpace}`);
    }
    createdSpaces.push(s);
  }
  console.log();

  // -------------------------------------------------------------
  // 6. PROMO DISCOUNTS
  // -------------------------------------------------------------
  console.log('6. Provisioning Kupon Diskon Promo...');
  const discountDefinitions = [
    {
      namaDiskon: 'Promo Launching WorkNest 20%',
      kodeDiskon: 'HEMAT20',
      persentaseDiskon: 20,
      ownerId: owner1.id,
    },
    {
      namaDiskon: 'Special Welcome 15%',
      kodeDiskon: 'NOLLAWELCOME',
      persentaseDiskon: 15,
      ownerId: owner1.id,
    },
    {
      namaDiskon: 'Diskon Komunitas 10%',
      kodeDiskon: 'PROMO2026',
      persentaseDiskon: 10,
    },
  ];

  const createdDiscounts = [];
  const startOfYear = new Date(Date.UTC(2026, 0, 1));
  const endOfYear = new Date(Date.UTC(2027, 11, 31));

  for (const dDef of discountDefinitions) {
    let d = await prisma.diskon.findFirst({
      where: { kodeDiskon: dDef.kodeDiskon },
    });

    if (!d) {
      d = await prisma.diskon.create({
        data: {
          ...dDef,
          tanggalAwal: startOfYear,
          tanggalAkhir: endOfYear,
        },
      });
      console.log(`   [+] Diskon dibuat: ${d.kodeDiskon} (${d.persentaseDiskon}%)`);
    } else {
      d = await prisma.diskon.update({
        where: { id: d.id },
        data: {
          ...dDef,
          tanggalAwal: startOfYear,
          tanggalAkhir: endOfYear,
        },
      });
      console.log(`   [✓] Diskon disinkronkan: ${d.kodeDiskon}`);
    }
    createdDiscounts.push(d);
  }
  console.log();

  // -------------------------------------------------------------
  // 7. 5 COMPLETED TRANSACTIONS (BOOKING -> PAYMENT -> SETTLEMENT)
  // -------------------------------------------------------------
  console.log('7. Provisioning 5 Transaksi Selesai & Lunas...');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const inTwoDays = new Date(today);
  inTwoDays.setDate(today.getDate() + 2);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const transactionScenarios = [
    {
      memberIndex: 0, // Budi Santoso
      spaceIndex: 0,  // Dedicated Flex Desk Senopati (Rp 25.000/jam)
      date: tomorrow,
      jamMulai: '09:00',
      durasiJam: 4,
      status: ReservasiStatus.disetujui,
      paymentStatus: PembayaranStatus.lunas,
      paymentMethod: 'bca_va',
      discountIndex: null,
      note: 'Booking H+1 Pagi (Lunas)',
    },
    {
      memberIndex: 1, // Siti Rahmawati
      spaceIndex: 1,  // Executive Boardroom Platinum (Rp 150.000/jam)
      date: inTwoDays,
      jamMulai: '13:00',
      durasiJam: 3,
      status: ReservasiStatus.disetujui,
      paymentStatus: PembayaranStatus.lunas,
      paymentMethod: 'qris',
      discountIndex: 0, // HEMAT20
      note: 'Booking H+2 Siang dengan Promo HEMAT20 (Lunas)',
    },
    {
      memberIndex: 2, // Dimas Anggara
      spaceIndex: 2,  // Creative Brainstorming Suite (Rp 100.000/jam)
      date: tomorrow,
      jamMulai: '14:00',
      durasiJam: 3,
      status: ReservasiStatus.disetujui,
      paymentStatus: PembayaranStatus.lunas,
      paymentMethod: 'mandiri_bill',
      discountIndex: null,
      note: 'Booking H+1 Sore (Lunas)',
    },
    {
      memberIndex: 3, // Clara Wijaya
      spaceIndex: 3,  // Private Office Kebayoran (Rp 200.000/jam)
      date: inThreeDays,
      jamMulai: '09:00',
      durasiJam: 9,
      status: ReservasiStatus.disetujui,
      paymentStatus: PembayaranStatus.lunas,
      paymentMethod: 'gopay',
      discountIndex: null,
      note: 'Booking H+3 Seharian 9 Jam (Lunas)',
    },
    {
      memberIndex: 0, // Budi Santoso
      spaceIndex: 4,  // Hot Desk Sudirman Workpod (Rp 20.000/jam)
      date: yesterday,
      jamMulai: '10:00',
      durasiJam: 4,
      status: ReservasiStatus.selesai,
      paymentStatus: PembayaranStatus.lunas,
      paymentMethod: 'bca_va',
      discountIndex: null,
      note: 'Booking Selesai & Telah Check-Out (Siklus Penuh)',
      withReview: {
        rating: 5,
        komentar: 'Tempat sangat nyaman, fasilitas lengkap, koneksi internet super cepat!',
      },
    },
  ];

  for (let i = 0; i < transactionScenarios.length; i++) {
    const sc = transactionScenarios[i];
    const member = createdMembers[sc.memberIndex];
    const space = createdSpaces[sc.spaceIndex];
    const discount = sc.discountIndex !== null ? createdDiscounts[sc.discountIndex] : null;

    const baseAmount = space.hargaPerJam * sc.durasiJam;
    const discountAmount = discount ? Math.round((baseAmount * discount.persentaseDiskon) / 100) : 0;
    const totalAmount = Math.max(0, baseAmount - discountAmount);

    const commissionRate = 5;
    const komisiPlatform = Math.round((totalAmount * commissionRate) / 100);
    const pendapatanOwner = totalAmount - komisiPlatform;

    const qrCode = generateQrCode(i + 1, member.id, space.id);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const resRecord = await prisma.reservasi.create({
      data: {
        memberId: member.id,
        ownerId: space.ownerId,
        tanggalReservasi: sc.date,
        jamMulai: sc.jamMulai,
        durasiJam: sc.durasiJam,
        status: sc.status,
        qrCode: qrCode,
        detailReservasi: {
          create: {
            spaceId: space.id,
            diskonId: discount ? discount.id : null,
            totalHarga: totalAmount,
          },
        },
        transaksi: {
          create: {
            nomorInvoice: invoiceNumber,
            jumlah: totalAmount,
            persentaseKomisiPlatform: commissionRate,
            komisiPlatform: komisiPlatform,
            pendapatanOwner: pendapatanOwner,
            metodePembayaran: sc.paymentMethod,
            statusPembayaran: sc.paymentStatus,
            dibayarPada: new Date(),
          },
        },
      },
      include: {
        transaksi: true,
        detailReservasi: true,
      },
    });

    if (sc.withReview) {
      await prisma.review.create({
        data: {
          reservasiId: resRecord.id,
          rating: sc.withReview.rating,
          komentar: sc.withReview.komentar,
        },
      });
    }

    console.log(`   [+] TRX #${resRecord.id}: ${member.namaMember} -> ${space.namaSpace}`);
    console.log(`       Nominal: Rp ${totalAmount.toLocaleString('id-ID')} | Status: ${sc.status} (${sc.paymentStatus})`);
    console.log(`       QR: ${qrCode} | Invoice: ${invoiceNumber} | Ket: ${sc.note}`);
  }

  console.log('\n================================================================');
  console.log('🎉 DATA SEEDING BERHASIL DISELESAIKAN!');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
