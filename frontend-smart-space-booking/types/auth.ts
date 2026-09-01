export type UserRole = "admin_space" | "staff" | "member";

export interface MemberProfile {
  id: number;
  namaMember: string;
  instansi: string;
  alamat: string;
  telp: string;
  foto?: string;
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
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  member?: MemberProfile | null;
  spaceOwner?: SpaceOwnerProfile | null;
  staff?: StaffProfile | null;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterMemberDto {
  username: string;
  password: string;
  namaMember: string;
  instansi: string;
  alamat: string;
  telp: string;
  foto?: string;
}

export interface RegisterOwnerDto {
  username: string;
  password: string;
  namaCoworking: string;
  namaPemilik: string;
  alamat: string;
  telp: string;
}

export interface CreateStaffDto {
  username: string;
  password: string;
  namaStaff: string;
  telp: string;
}

export interface UpdateProfileDto {
  nama?: string;
  instansi?: string;
  alamat?: string;
  telp?: string;
  foto?: string;
  namaCoworking?: string;
}

export interface VerifyEmailDto {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  message: string;
  success?: boolean;
}

export interface ResendOtpDto {
  email: string;
}

export interface ResendOtpResponse {
  message: string;
  success?: boolean;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user: UserProfile;
}

export interface MemberUser {
  id: number;
  username: string;
  role: UserRole;
  member: MemberProfile;
}

export interface StaffUser {
  id: number;
  username: string;
  role: UserRole;
  staff: StaffProfile;
}
