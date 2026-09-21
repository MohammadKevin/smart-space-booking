const { PrismaClient, Role, SpaceTipe } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Memulai Seeding Space Owner: mhmdkevin198@gmail.com ---');

  const email = 'mhmdkevin198@gmail.com';
  const plainPassword = 'Kevin135*';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  let user = await prisma.user.findUnique({
    where: { email },
    include: { spaceOwner: true, staff: true, member: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.admin_space,
        isVerified: true,
        spaceOwner: {
          create: {
            namaCoworking: 'WorkNest Sudirman Creative Hub',
            namaPemilik: 'Muhammad Kevin',
            alamat: 'Jl. Jenderal Sudirman Kav. 52-53, Senayan, Jakarta Selatan',
            telp: '081234567890',
            autoApproveHotDesk: true,
          },
        },
      },
      include: { spaceOwner: true },
    });
    console.log('✓ Akun Space Owner baru berhasil dibuat:', user.email);
  } else {
    if (user.staff) {
      await prisma.staff.delete({ where: { id: user.staff.id } });
      console.log('✓ Relasi staff lama dihapus.');
    }
    if (user.member) {
      try {
        await prisma.member.delete({ where: { id: user.member.id } });
        console.log('✓ Relasi member lama dihapus.');
      } catch (e) {
        console.log('! Relasi member dipertahankan karena ada keterkaitan data.');
      }
    }

    let spaceOwner = await prisma.spaceOwner.findUnique({
      where: { userId: user.id },
    });

    if (!spaceOwner) {
      spaceOwner = await prisma.spaceOwner.create({
        data: {
          userId: user.id,
          namaCoworking: 'WorkNest Sudirman Creative Hub',
          namaPemilik: 'Muhammad Kevin',
          alamat: 'Jl. Jenderal Sudirman Kav. 52-53, Senayan, Jakarta Selatan',
          telp: '081234567890',
          autoApproveHotDesk: true,
        },
      });
      console.log('✓ Profil Space Owner baru dikaitkan ke user.');
    } else {
      spaceOwner = await prisma.spaceOwner.update({
        where: { id: spaceOwner.id },
        data: {
          namaCoworking: 'WorkNest Sudirman Creative Hub',
          namaPemilik: 'Muhammad Kevin',
          alamat: 'Jl. Jenderal Sudirman Kav. 52-53, Senayan, Jakarta Selatan',
          telp: '081234567890',
          autoApproveHotDesk: true,
        },
      });
      console.log('✓ Profil Space Owner diperbarui.');
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        role: Role.admin_space,
        isVerified: true,
      },
      include: { spaceOwner: true },
    });
    console.log('✓ User diupdate ke Space Owner dengan password baru:', user.email);
  }

  const ownerId = user.spaceOwner.id;

  const spacesData = [
    {
      namaSpace: 'Dedicated Flex Desk Senopati',
      tipe: SpaceTipe.desk,
      hargaPerJam: 25000,
      kapasitas: 1,
      deskripsi: 'Meja kerja individu ergonomis dengan kursi lumbar support, universal power socket, koneksi Wi-Fi 6 100Mbps, dan free refill kopi/teh.',
      foto: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1000&q=80',
      ownerId: ownerId,
    },
    {
      namaSpace: 'Quiet Focus Hot Desk SCBD',
      tipe: SpaceTipe.desk,
      hargaPerJam: 30000,
      kapasitas: 1,
      deskripsi: 'Hot desk di zona hening khusus dengan acoustic divider, monitor 24 inch eksternal, dan akses pantry premium.',
      foto: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80',
      ownerId: ownerId,
    },
    {
      namaSpace: 'Executive Boardroom Platinum',
      tipe: SpaceTipe.meeting_room,
      hargaPerJam: 120000,
      kapasitas: 10,
      deskripsi: 'Ruang rapat kedap suara berstandar korporat dilengkapi Smart TV 4K 65 inch, kamera video conference 360°, glass whiteboard, dan mic wireless.',
      foto: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
      ownerId: ownerId,
    },
    {
      namaSpace: 'Creative Brainstorming Suite',
      tipe: SpaceTipe.meeting_room,
      hargaPerJam: 85000,
      kapasitas: 6,
      deskripsi: 'Meeting room bernuansa modern kolaboratif dengan magnetic glass board, presentation display 55 inch, dan ergonomic discussion chairs.',
      foto: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1000&q=80',
      ownerId: ownerId,
    },
    {
      namaSpace: 'Private Office Suite Skyview',
      tipe: SpaceTipe.private_office,
      hargaPerJam: 175000,
      kapasitas: 4,
      deskripsi: 'Ruang kantor privat tertutup dengan smart door lock akses QR, 4 set meja kerja modular, AC independen, dan view gedung pencakar langit.',
      foto: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=80',
      ownerId: ownerId,
    },
    {
      namaSpace: 'Enterprise Team Office Prime',
      tipe: SpaceTipe.private_office,
      hargaPerJam: 275000,
      kapasitas: 8,
      deskripsi: 'Kantor privat eksklusif untuk tim startup/korporat dengan smart lock, filing cabinet terkunci, private whiteboard, dan high-speed LAN connection.',
      foto: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1000&q=80',
      ownerId: ownerId,
    },
  ];

  console.log('Menyimpan inventaris 6 ruangan (2 per kategori)...');
  for (const s of spacesData) {
    const existing = await prisma.space.findFirst({
      where: {
        namaSpace: s.namaSpace,
        ownerId: ownerId,
      },
    });

    if (!existing) {
      await prisma.space.create({ data: s });
      console.log(`✓ Ruangan dibuat: [${s.tipe}] ${s.namaSpace}`);
    } else {
      await prisma.space.update({
        where: { id: existing.id },
        data: s,
      });
      console.log(`✓ Ruangan diperbarui: [${s.tipe}] ${s.namaSpace}`);
    }
  }

  const existingDiscount = await prisma.diskon.findFirst({
    where: { ownerId: ownerId },
  });

  if (!existingDiscount) {
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 2);

    await prisma.diskon.create({
      data: {
        namaDiskon: 'Diskon Spesial Owner 15%',
        kodeDiskon: 'KEVIN15',
        persentaseDiskon: 15,
        tanggalAwal: today,
        tanggalAkhir: nextYear,
        ownerId: ownerId,
      },
    });
    console.log('✓ Kupon promo KEVIN15 dibuat untuk owner.');
  }

  console.log('\n=============================================');
  console.log('SUCCESS: Seeding Space Owner Selesai!');
  console.log('Email     : ' + email);
  console.log('Password  : ' + plainPassword);
  console.log('Role      : admin_space (Space Owner)');
  console.log('Coworking : WorkNest Sudirman Creative Hub');
  console.log('Total Ruangan: 6 (2 Desk, 2 Meeting Room, 2 Private Office)');
  console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
