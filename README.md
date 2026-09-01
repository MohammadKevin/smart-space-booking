# 🏢 Smart Coworking Space & Workstation Reservation System (Smart Space Booking)

> **Sistem Reservasi Coworking Space & Workstation Berbasis RESTful API & Next.js**  
> Standar Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak (RPL) 2026/2027

---

## 📌 Tech Stack & Architecture

- **Backend Framework**: [NestJS](https://nestjs.com/) (v11) with TypeScript
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) (v6) with **MySQL**
- **Authentication & Security**: Passport-JWT, Bcrypt, Role-Based Access Control (RBAC)
- **Validation**: `class-validator` & `class-transformer` (Global ValidationPipe)
- **API Documentation**: Swagger UI (OpenAPI 3.0) at `/api/docs`
- **Global API Prefix**: `/api`

---

## 👥 Role & Permissions (RBAC)

1. **Admin Space (`admin_space`)**:
   - Registrasi coworking space & profil pemilik
   - Manajemen akun staff operasional
   - CRUD data unit workstation / ruangan (Space)
   - CRUD program kupon & diskon
   - Persetujuan, pemantauan, dan pembatalan reservasi
   - Scan & validasi QR tiket member (Check-in & Check-out)
   - Laporan analitik keuangan & metrik reservasi bulanan

2. **Staff (`staff`)**:
   - Memantau reservasi coworking space terkait
   - Scan & validasi QR tiket member
   - Eksekusi instan check-in (`aktif`) dan check-out (`selesai`)
   - Melihat daftar member terdaftar

3. **Member (`member`)**:
   - Registrasi & manajemen profil mandiri
   - Eksplorasi katalog workstation/space dengan filter ketersediaan waktu
   - Reservasi dengan Anti-Collision Engine & kalkulasi diskon otomatis
   - Tiket digital dengan QR code unik
   - Riwayat reservasi & pembatalan mandiri (status pending/disetujui)

---

## ⚙️ Core Engines & Features

- 🛡️ **Anti-Collision Overlap Engine**: Mencegah tabrakan pemesanan slot pada workstation & tanggal yang sama `(newStart < existingEnd) && (newEnd > existingStart)`.
- 🎟️ **QR State Machine**: Transisi status tiket instan dari `disetujui` ➔ `aktif` (Check-In) ➔ `selesai` (Check-Out).
- 💰 **Dynamic Price & Promo Deduction**: Kalkulasi harga otomatis dengan verifikasi masa berlaku kupon promo.
- 📊 **Financial & Business Analytics**: Laporan pendapatan bulanan, distribusi tipe space, dan ringkasan metrik dashboard.

---

## 🚀 Quick Start Guide

### 1. Prasyarat
- **Node.js**: v18+ atau v20+
- **MySQL Database Server**: XAMPP / Laragon / MySQL Service aktif pada port `3306`

### 2. Konfigurasi Backend
```bash
# Masuk ke direktori backend
cd backend-smart-space-booking

# Salin environment file
cp .env.example .env

# Pasang dependensi
npm install

# Generate client Prisma & jalankan migrasi database
npx prisma generate
npx prisma migrate dev --name init

# Jalankan server dalam mode development
npm run start:dev
```

### 3. Akses API & Dokumentasi
- **API Base URL**: `http://localhost:8000/api`
- **Swagger Interactive Docs**: `http://localhost:8000/api/docs`

---

## 📁 Struktur Direktori

```
smart-space-booking/
├── backend-smart-space-booking/
│   ├── prisma/
│   │   └── schema.prisma              # Database schema & relations
│   ├── src/
│   │   ├── auth/                      # Login, Register, JWT, RBAC guards
│   │   ├── user/                      # Member, Owner, and Staff profiles
│   │   ├── space/                     # Workstations CRUD & availability check
│   │   ├── discount/                  # Promo code & validity checks
│   │   ├── reservation/               # Booking & Anti-Collision Engine
│   │   ├── checkin/                   # QR scanner & check-in/out transitions
│   │   ├── report/                    # Revenue analytics & reports
│   │   ├── prisma/                    # Global Prisma service
│   │   ├── common/                    # Time overlap & QR utilities
│   │   ├── app.module.ts              # Root application module
│   │   └── main.ts                    # Bootstrap, Swagger, CORS, Validation
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 📄 Lisensi
Sistem ini dibangun untuk keperluan UKK RPL 2026/2027. Dikembangkan oleh **Mohammad Kevin**.
