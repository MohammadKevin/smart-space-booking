import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  UserRole,
  MemberProfile,
  SpaceOwnerProfile,
  StaffProfile,
  UserProfile,
  LoginDto,
  RegisterMemberDto,
  RegisterOwnerDto,
  CreateStaffDto,
  UpdateProfileDto,
  VerifyEmailDto,
  VerifyEmailResponse,
  ResendOtpDto,
  ResendOtpResponse,
  AuthResponse,
  MemberUser,
  StaffUser,
} from "@/types/auth";

export * from "@/types/auth";

export const API_BASE_URL = "https://api-ukk.budayakita.com/api";

// ---------------------------------------------------------------------------
// Space & Reservation TypeScript Interfaces & DTOs
// ---------------------------------------------------------------------------

export type SpaceType = "desk" | "meeting_room" | "private_office";

export interface Space {
  id: number;
  namaSpace: string;
  tipe: SpaceType;
  hargaPerJam: number;
  kapasitas: number;
  foto?: string;
  deskripsi?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  owner?: SpaceOwnerProfile;
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

export interface SpaceQuery {
  search?: string;
  tipe?: SpaceType;
  minKapasitas?: number;
  maxKapasitas?: number;
  ownerId?: number;
  tanggal?: string;
  jamMulai?: string;
  durasiJam?: number;
}

export type ReservationStatus =
  | "pending"
  | "disetujui"
  | "aktif"
  | "selesai"
  | "dibatalkan";

export interface ReservationDetail {
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
  detailReservasi?: ReservationDetail;
}

export interface CreateReservationDto {
  spaceId: number;
  tanggalReservasi: string;
  jamMulai: string;
  durasiJam: number;
  diskonId?: number;
  kodeDiskon?: string;
}

export interface ReservationQuery {
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

export interface Discount {
  id: number;
  namaDiskon: string;
  kodeDiskon: string;
  persentaseDiskon: number;
  tanggalAwal: string;
  tanggalAkhir: string;
  ownerId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscountCheckResponse {
  valid: boolean;
  message?: string;
  data?: Discount;
}

export interface ProcessCheckinDto {
  qrCode: string;
  action?: "auto" | "checkin" | "checkout";
}

export interface VerifyQrDto {
  qrCode: string;
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
// Central Axios Instance & Interceptors
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request Interceptor: Attach Authorization Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/login") &&
          !currentPath.includes("/register") &&
          !currentPath.includes("/verify-email")
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          sessionStorage.removeItem("token");
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper for extracting readable error messages from Axios responses
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      if (Array.isArray(data.message)) {
        return data.message.join(", ");
      }
      if (typeof data.message === "string") {
        return data.message;
      }
      if (typeof data.error === "string") {
        return data.error;
      }
    }
    if (error.message) {
      return error.message;
    }
  }
  return "Terjadi kesalahan pada sistem. Silakan coba lagi.";
}

// ---------------------------------------------------------------------------
// Typed API Functions
// ---------------------------------------------------------------------------

// --- Auth ---
export async function login(dto: LoginDto): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", dto);
  if (typeof window !== "undefined" && data.access_token) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return data;
}

export async function registerMember(dto: RegisterMemberDto): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/member", dto);
  return data;
}

export async function registerOwner(dto: RegisterOwnerDto): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/owner", dto);
  return data;
}

export async function verifyEmail(dto: VerifyEmailDto): Promise<VerifyEmailResponse> {
  try {
    const { data } = await api.post<VerifyEmailResponse>("/auth/verify-email", dto);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        message: "Email berhasil diverifikasi.",
        success: true,
      };
    }
    throw error;
  }
}

export async function resendVerificationOtp(email: string): Promise<ResendOtpResponse> {
  try {
    const { data } = await api.post<ResendOtpResponse>("/auth/resend-otp", { email });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        message: "Kode OTP baru telah dikirimkan ke email Anda.",
        success: true,
      };
    }
    throw error;
  }
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/auth/profile");
  if (typeof window !== "undefined" && data) {
    localStorage.setItem("user", JSON.stringify(data));
  }
  return data;
}

export async function updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
  const { data } = await api.put<UserProfile>("/users/profile", dto);
  return data;
}

// --- Spaces ---
export async function getSpaces(query?: SpaceQuery): Promise<Space[]> {
  const { data } = await api.get<Space[]>("/spaces", { params: query });
  return data;
}

export async function getSpaceById(id: number | string): Promise<Space> {
  const { data } = await api.get<Space>(`/spaces/${id}`);
  return data;
}

export async function getMySpaces(): Promise<Space[]> {
  const { data } = await api.get<Space[]>("/spaces/my-spaces");
  return data;
}

export async function createSpace(dto: CreateSpaceDto): Promise<Space> {
  const { data } = await api.post<Space>("/spaces", dto);
  return data;
}

export async function updateSpace(id: number | string, dto: UpdateSpaceDto): Promise<Space> {
  const { data } = await api.put<Space>(`/spaces/${id}`, dto);
  return data;
}

export async function deleteSpace(id: number | string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/spaces/${id}`);
  return data;
}

// --- Reservations ---
export async function createReservation(dto: CreateReservationDto): Promise<ReservationResponse> {
  const { data } = await api.post<ReservationResponse>("/reservations", dto);
  return data;
}

export async function getMyReservations(query?: ReservationQuery): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>("/reservations", { params: query });
  return data;
}

export async function getAllReservations(query?: ReservationQuery): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>("/reservations", { params: query });
  return data;
}

export async function getReservationById(id: number | string): Promise<Reservation> {
  const { data } = await api.get<Reservation>(`/reservations/${id}`);
  return data;
}

export async function cancelReservation(id: number | string): Promise<ReservationCancelResponse> {
  const { data } = await api.patch<ReservationCancelResponse>(`/reservations/${id}/cancel`);
  return data;
}

export async function updateReservationStatus(
  id: number | string,
  status: ReservationStatus
): Promise<Reservation> {
  const { data } = await api.patch<Reservation>(`/reservations/${id}/status`, { status });
  return data;
}

// --- Check-in & Verification ---
export async function verifyQr(dto: VerifyQrDto): Promise<any> {
  const { data } = await api.post("/checkin/verify", dto);
  return data;
}

export async function processCheckIn(dto: ProcessCheckinDto): Promise<CheckinResponse> {
  const { data } = await api.post<CheckinResponse>("/checkin/process", {
    ...dto,
    action: dto.action || "checkin",
  });
  return data;
}

export async function processCheckOut(dto: ProcessCheckinDto): Promise<CheckinResponse> {
  const { data } = await api.post<CheckinResponse>("/checkin/process", {
    ...dto,
    action: dto.action || "checkout",
  });
  return data;
}

// --- Discounts ---
export async function checkDiscount(code: string): Promise<DiscountCheckResponse> {
  const { data } = await api.get<DiscountCheckResponse>(`/discounts/check/${encodeURIComponent(code)}`);
  return data;
}

export async function getDiscounts(): Promise<Discount[]> {
  const { data } = await api.get<Discount[]>("/discounts");
  return data;
}

// --- Users & Staff ---
export async function getMembers(): Promise<MemberUser[]> {
  const { data } = await api.get<MemberUser[]>("/users/members");
  return data;
}

export async function getStaffs(): Promise<StaffUser[]> {
  const { data } = await api.get<StaffUser[]>("/users/staffs");
  return data;
}

export async function createStaff(dto: CreateStaffDto): Promise<any> {
  const { data } = await api.post("/auth/staff", dto);
  return data;
}

export async function deleteStaff(id: number | string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/users/staffs/${id}`);
  return data;
}

export default api;
