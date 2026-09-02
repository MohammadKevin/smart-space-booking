export type UserRole = "admin_space" | "staff" | "member";

export type SpaceType = "desk" | "meeting_room" | "private_office";

export type ReservationStatus =
  | "pending"
  | "disetujui"
  | "aktif"
  | "selesai"
  | "dibatalkan";

// ---------------------------------------------------------------------------
// User & Auth Profiles
// ---------------------------------------------------------------------------

export interface MemberProfile {
  id: number;
  namaMember: string;
  instansi: string;
  alamat: string;
  telp: string;
  foto?: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceOwnerProfile {
  id: number;
  namaCoworking: string;
  namaPemilik: string;
  alamat: string;
  telp: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffProfile {
  id: number;
  namaStaff: string;
  telp: string;
  ownerId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  member?: MemberProfile | null;
  spaceOwner?: SpaceOwnerProfile | null;
  staff?: StaffProfile | null;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user: UserProfile;
}

export interface MemberUser {
  id: number;
  email?: string;
  role?: UserRole;
  member?: MemberProfile;
  namaMember?: string;
  instansi?: string;
  alamat?: string;
  telp?: string;
  user?: {
    id: number;
    email: string;
    role: UserRole;
    createdAt?: string;
  };
}

export interface StaffUser {
  id: number;
  email?: string;
  role?: UserRole;
  staff?: StaffProfile;
  namaStaff?: string;
  telp?: string;
  ownerId?: number;
  userId?: number;
  user?: {
    id: number;
    email: string;
    role: UserRole;
    createdAt?: string;
  };
}

// ---------------------------------------------------------------------------
// Auth DTOs
// ---------------------------------------------------------------------------

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterMemberDto {
  email: string;
  password: string;
  namaMember: string;
  instansi?: string;
  alamat?: string;
  telp: string;
  foto?: string;
}

export interface RegisterOwnerDto {
  email: string;
  password: string;
  namaCoworking: string;
  namaPemilik: string;
  alamat: string;
  telp: string;
}

export interface CreateStaffDto {
  email: string;
  password: string;
  namaStaff: string;
  telp: string;
}

export interface UpdateProfileDto {
  nama?: string;
  email?: string;
  oldPassword?: string;
  password?: string;
  instansi?: string;
  alamat?: string;
  telp?: string;
  foto?: string;
  namaCoworking?: string;
}

// ---------------------------------------------------------------------------
// Space Interfaces & DTOs
// ---------------------------------------------------------------------------

export interface Space {
  id: number;
  namaSpace: string;
  tipe: SpaceType;
  hargaPerJam: number;
  kapasitas: number;
  foto?: string | null;
  deskripsi?: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  owner?: SpaceOwnerProfile;
  isAvailable?: boolean;
}

export interface CreateSpaceDto {
  namaSpace: string;
  tipe: SpaceType;
  hargaPerJam: number;
  kapasitas: number;
  foto?: string;
  deskripsi?: string;
}

export interface UpdateSpaceDto {
  namaSpace?: string;
  tipe?: SpaceType;
  hargaPerJam?: number;
  kapasitas?: number;
  foto?: string;
  deskripsi?: string;
}

export interface FilterSpaceDto {
  search?: string;
  tipe?: SpaceType;
  minKapasitas?: number;
  maxKapasitas?: number;
  ownerId?: number;
  tanggal?: string;
  jamMulai?: string;
  durasiJam?: number;
}

// ---------------------------------------------------------------------------
// Discount Interfaces & DTOs
// ---------------------------------------------------------------------------

export interface Discount {
  id: number;
  namaDiskon: string;
  kodeDiskon: string | null;
  persentaseDiskon: number;
  tanggalAwal: string;
  tanggalAkhir: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDiscountDto {
  namaDiskon: string;
  kodeDiskon?: string;
  persentaseDiskon: number;
  tanggalAwal: string;
  tanggalAkhir: string;
}

export interface UpdateDiscountDto {
  namaDiskon?: string;
  kodeDiskon?: string;
  persentaseDiskon?: number;
  tanggalAwal?: string;
  tanggalAkhir?: string;
}

export interface DiscountCheckResponse {
  valid: boolean;
  message?: string;
  data?: Discount;
}

// ---------------------------------------------------------------------------
// Reservation Interfaces & DTOs
// ---------------------------------------------------------------------------

export interface DetailReservasi {
  id: number;
  reservasiId: number;
  spaceId: number;
  diskonId?: number | null;
  totalHarga: number;
  createdAt: string;
  updatedAt: string;
  space?: Space;
  diskon?: Discount | null;
}

export interface Reservation {
  id: number;
  tanggalReservasi: string;
  jamMulai: string;
  durasiJam: number;
  status: ReservationStatus;
  qrCode: string;
  ownerId: number;
  memberId: number;
  createdAt: string;
  updatedAt: string;
  jamSelesai?: string;
  member?: MemberProfile;
  owner?: SpaceOwnerProfile;
  detailReservasi?: DetailReservasi;
}

export interface CreateReservationDto {
  spaceId: number;
  tanggalReservasi: string;
  jamMulai: string;
  durasiJam: number;
  diskonId?: number;
  kodeDiskon?: string;
}

export interface FilterReservationDto {
  status?: ReservationStatus;
  tanggal?: string;
  spaceId?: number;
}

export interface ReservationResponse {
  message: string;
  data: Reservation;
}

export interface ReservationCancelResponse {
  message: string;
  data: Reservation;
}

// ---------------------------------------------------------------------------
// Transactions, Payments & Midtrans
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | "belum_bayar"
  | "menunggu_pembayaran"
  | "lunas"
  | "gagal"
  | "refund";

export interface Transaksi {
  id: number;
  nomorInvoice: string;
  reservasiId: number;
  jumlah: number;
  metodePembayaran?: string | null;
  snapToken?: string | null;
  snapRedirectUrl?: string | null;
  midtransOrderId?: string | null;
  midtransTransId?: string | null;
  statusPembayaran: PaymentStatus;
  dibayarPada?: string | null;
  createdAt: string;
  updatedAt: string;
  reservasi?: Reservation;
}

export interface StartPaymentResult {
  transactionId: number;
  nomorInvoice: string;
  jumlah: number;
  snapToken: string;
  redirectUrl: string;
  clientKey: string;
  snapScriptUrl: string;
}

export interface StartPaymentResponse {
  message: string;
  data: StartPaymentResult;
}

export interface TransaksiListResponse {
  data: Transaksi[];
}

export interface TransaksiDetailResponse {
  message: string;
  data: Transaksi;
}

// ---------------------------------------------------------------------------
// QR Check-in & Verification
// ---------------------------------------------------------------------------

export interface VerifyQrDto {
  qrCode: string;
}

export interface ProcessCheckinDto {
  qrCode: string;
  action?: "auto" | "checkin" | "checkout";
}

export interface CheckinResponse {
  message: string;
  data?: {
    id: number;
    reservasiId: number;
    waktuCheckin?: string;
    waktuCheckout?: string;
    status: string;
    reservasi?: Reservation;
  };
}

// ---------------------------------------------------------------------------
// Reports & Financial Analytics
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  totalRevenue: number;
  totalSpaces: number;
  totalStaffs: number;
  totalReservations: number;
  statusCounts?: {
    pending: number;
    disetujui: number;
    aktif: number;
    selesai: number;
    dibatalkan: number;
  };
}

export interface MonthlyRevenueItem {
  month: string;
  monthNumber: number;
  revenue: number;
  totalBookings: number;
}

export interface SpaceTypeDistributionItem {
  tipe: SpaceType;
  label: string;
  count: number;
  totalRevenue: number;
  percentage: number;
}
