# WorkNest - Smart Space Booking System

WorkNest adalah platform reservasi dan manajemen coworking space yang mencakup workstation (flex desk), meeting room, dan private office. Dilengkapi dengan sistem QR code check-in, integrasi payment gateway Midtrans, dan role-based dashboard untuk berbagai tingkatan pengguna.

---

## Tech Stack

### Backend
- **Framework**: NestJS (v11) / Express / TypeScript
- **Database & ORM**: MySQL via Prisma ORM (v6)
- **Authentication**: Passport.js with JWT & Role-Based Access Control (RBAC)
- **Payment Gateway**: Midtrans Snap & Core API (Direct Charge)
- **File Storage**: Cloudinary SDK
- **Email Service**: Nodemailer (SMTP)
- **Documentation**: Swagger UI (OpenAPI 3.0)

### Frontend
- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **QR Code**: `qrcode.react` (Generator) & `html5-qrcode` (Scanner)
- **HTTP Client**: Axios

---

## Fitur Utama & Hak Akses

Platform ini menggunakan sistem Role-Based Access Control (RBAC) yang terbagi menjadi 4 peran:

### 1. Super Admin
- Akses platform-wide analytics (total GMV, platform fee, owner payout).
- Konfigurasi persentase komisi platform secara global.
- Manajemen akun semua space owner, member, dan staff.
- Monitoring log transaksi dan laporan keuangan.

### 2. Space Owner (`admin_space`)
- Manajemen profil coworking space & kontak.
- Pengelolaan unit ruangan / workstation (CRUD space, upload foto, set tarif per jam).
- Manajemen kupon diskon dan promo berbasis waktu atau unit tertentu.
- Manajemen akun staf operasional.
- Persetujuan dan monitoring reservasi.
- Laporan analitik okupansi dan pendapatan berkala.

### 3. Staff Operasional
- Terminal scanner QR code untuk proses check-in (`aktif`) dan check-out (`selesai`).
- Verifikasi identitas dan jadwal reservasi member.
- Riwayat check-in/check-out harian.

### 4. Member
- Pencarian dan filter ruangan berdasarkan lokasi, tipe, tanggal, dan durasi.
- Booking ruangan dengan pengecekan jadwal otomatis (mencegah double booking).
- Integrasi pembayaran instan (QRIS, Virtual Account, E-Wallet, Retail).
- Tiket digital berformat QR code dinamis untuk akses masuk ruangan.
- Riwayat transaksi, pengunduhan invoice, dan fitur review setelah reservasi selesai.

---

## Struktur Proyek

```
smart-space-booking/
├── backend-smart-space-booking/     # NestJS REST API
│   ├── prisma/
│   │   └── schema.prisma            # Schema database Prisma
│   ├── src/
│   │   ├── auth/                    # Autentikasi, JWT, OTP, & guards
│   │   ├── checkin/                 # Scanner QR & validasi check-in/out
│   │   ├── common/                  # Filter, mail service, Cloudinary provider
│   │   ├── discount/                # CRUD & validasi promo diskon
│   │   ├── reservation/             # Logika booking & validasi jadwal
│   │   ├── review/                  # Ulasan & rating ruangan
│   │   ├── space/                   # CRUD ruangan & ketersediaan slot
│   │   ├── super-admin/             # Endpoint analitik & komisi platform
│   │   ├── transaction/             # Integrasi Midtrans payment & webhook
│   │   ├── user/                    # Profil & manajemen staf/member
│   │   ├── waitlist/                # Sistem antrean ruangan
│   │   ├── app.module.ts            # Root module
│   │   └── main.ts                  # Entry point aplikasi
│   └── package.json
│
├── frontend-smart-space-booking/    # Next.js Web App
│   ├── app/                         # App Router (pages & layouts)
│   │   ├── (auth)/                  # Login, register, & email verification
│   │   ├── booking/                 # Halaman booking ruangan
│   │   ├── checkout/                # Halaman pembayaran & QRIS/VA
│   │   ├── dashboard/               # Role-based dashboards (Member, Owner, Staff, Admin)
│   │   ├── spaces/                  # Katalog & detail ruangan
│   │   └── page.tsx                 # Landing page
│   ├── components/                  # Reusable UI components
│   ├── lib/                         # API client, auth context, & utils
│   └── package.json
│
└── README.md
```

---

## Panduan Instalasi Lokal

### 1. Prasyarat
- Node.js versi 18 atau 20 (LTS direkomendasikan)
- MySQL Database (aktif via XAMPP, Laragon, Docker, atau MySQL service lokal)
- npm / yarn / pnpm

---

### 2. Setup Backend

```bash
# Pindah ke direktori backend
cd backend-smart-space-booking

# Salin file environment contoh
cp .env.example .env

# Install dependensi
npm install

# Generate Prisma Client & sync struktur database
npx prisma generate
npx prisma db push

# Jalankan server dalam mode development
npm run start:dev
```

Server backend akan berjalan di `http://localhost:8000/api`.  
Dokumentasi Swagger dapat diakses di `http://localhost:8000/api/docs`.

---

### 3. Setup Frontend

```bash
# Buka terminal baru dan pindah ke direktori frontend
cd frontend-smart-space-booking

# Salin file environment contoh
cp .env.example .env.local

# Install dependensi
npm install

# Jalankan server frontend dalam mode development
npm run dev
```

Aplikasi frontend akan dapat diakses melalui `http://localhost:3000`.

---

## Konfigurasi Environment Variables

### Backend (`backend-smart-space-booking/.env`)
```env
DATABASE_URL="mysql://root:password@localhost:3306/db_smart_space_booking"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"
PORT=8000

# Cloudinary (Opsional untuk upload gambar)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Midtrans Payment Gateway
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
MIDTRANS_MERCHANT_ID="your-merchant-id"

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="WorkNest Security <your-email@gmail.com>"

# Platform Settings
SUPER_ADMIN_SECRET_KEY="your-super-admin-secret"
PLATFORM_COMMISSION_PERCENT=5.0
```

### Frontend (`frontend-smart-space-booking/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000/api"
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_IS_PRODUCTION=false
```

---

## Build & Testing

```bash
# Build backend
cd backend-smart-space-booking
npm run build

# Build frontend
cd ../frontend-smart-space-booking
npm run build
```

---

## Lisensi
Proyek ini dilisensikan di bawah lisensi MIT.
