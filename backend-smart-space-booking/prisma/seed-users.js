const { PrismaClient, Role, SpaceTipe } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai provisioning akun Member, Staff, dan Owner...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Space Owner: kvn4.200581@gmail.com
  let ownerUser = await prisma.user.findUnique({
    where: { email: 'kvn4.200581@gmail.com' },
    include: { spaceOwner: true },
  });

  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: {
        email: 'kvn4.200581@gmail.com',
        password: hashedPassword,
        role: Role.admin_space,
        spaceOwner: {
          create: {
            namaCoworking: 'SmartSpace Prime Hub',
            namaPemilik: 'Kevin Space Owner',
            alamat: 'Jl. Sudirman Bisnis Park No. 42, Jakarta',
            telp: '081234567890',
          },
        },
      },
      include: { spaceOwner: true },
    });
    console.log('✅ Akun Space Owner dibuat:', ownerUser.email);
  } else {
    // Update password to password123 if needed
    await prisma.user.update({
      where: { id: ownerUser.id },
      data: { password: hashedPassword, role: Role.admin_space },
    });
    console.log('ℹ️ Akun Space Owner sudah ada, kredensial disinkronkan:', ownerUser.email);
  }

  const ownerId = ownerUser.spaceOwner.id;

  // 2. Staff: mhmdkevin198@gmail.com
  let staffUser = await prisma.user.findUnique({
    where: { email: 'mhmdkevin198@gmail.com' },
    include: { staff: true },
  });

  if (!staffUser) {
    staffUser = await prisma.user.create({
      data: {
        email: 'mhmdkevin198@gmail.com',
        password: hashedPassword,
        role: Role.staff,
        staff: {
          create: {
            namaStaff: 'Muhammad Kevin',
            telp: '081234567891',
            ownerId: ownerId,
          },
        },
      },
      include: { staff: true },
    });
    console.log('✅ Akun Staff dibuat:', staffUser.email);
  } else {
    await prisma.user.update({
      where: { id: staffUser.id },
      data: { password: hashedPassword, role: Role.staff },
    });
    console.log('ℹ️ Akun Staff sudah ada, kredensial disinkronkan:', staffUser.email);
  }

  // 3. Member: kipilpplli@gmail.com
  let memberUser = await prisma.user.findUnique({
    where: { email: 'kipilpplli@gmail.com' },
    include: { member: true },
  });

  if (!memberUser) {
    memberUser = await prisma.user.create({
      data: {
        email: 'kipilpplli@gmail.com',
        password: hashedPassword,
        role: Role.member,
        member: {
          create: {
            namaMember: 'Kipil Member',
            instansi: 'Universitas Indonesia',
            alamat: 'Jl. Merdeka No. 10, Depok',
            telp: '081234567892',
          },
        },
      },
      include: { member: true },
    });
    console.log('✅ Akun Member dibuat:', memberUser.email);
  } else {
    await prisma.user.update({
      where: { id: memberUser.id },
      data: { password: hashedPassword, role: Role.member },
    });
    console.log('ℹ️ Akun Member sudah ada, kredensial disinkronkan:', memberUser.email);
  }

  // Ensure some sample spaces exist under this owner
  const spaceCount = await prisma.space.count({
    where: { ownerId: ownerId },
  });

  if (spaceCount === 0) {
    await prisma.space.createMany({
      data: [
        {
          namaSpace: 'Dedicated Hot Desk Alpha',
          tipe: SpaceTipe.desk,
          hargaPerJam: 25000,
          kapasitas: 1,
          deskripsi: 'Workstation ergonomis dengan high-speed fiber internet, universal power plug, dan free-flow coffee.',
          foto: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
          ownerId: ownerId,
        },
        {
          namaSpace: 'Executive Meeting Room Platinum',
          tipe: SpaceTipe.meeting_room,
          hargaPerJam: 100000,
          kapasitas: 8,
          deskripsi: 'Ruang meeting kedap suara dengan smart display 65 inch 4K, video conference camera, dan whiteboard.',
          foto: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
          ownerId: ownerId,
        },
        {
          namaSpace: 'Private Office Suite Horizon',
          tipe: SpaceTipe.private_office,
          hargaPerJam: 175000,
          kapasitas: 4,
          deskripsi: 'Kantor privat fully furnished dengan smart lock access, acoustic paneling, dan executive chairs.',
          foto: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
          ownerId: ownerId,
        },
      ],
    });
    console.log('✅ Ruangan inventaris default dibuat.');
  }

  // Ensure a sample discount coupon exists
  const discountCount = await prisma.diskon.count();
  if (discountCount === 0) {
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 2);

    await prisma.diskon.create({
      data: {
        namaDiskon: 'Promo Super Launching 20%',
        kodeDiskon: 'PROMO2026',
        persentaseDiskon: 20,
        tanggalAwal: today,
        tanggalAkhir: nextYear,
      },
    });
    console.log('✅ Kupon promo PROMO2026 dibuat.');
  }

  console.log('🎉 Seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
