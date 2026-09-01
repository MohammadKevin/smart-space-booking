import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  UserRole,
  SpaceType,
  ReservationStatus,
  MemberProfile,
  SpaceOwnerProfile,
  StaffProfile,
  UserProfile,
  AuthResponse,
  MemberUser,
  StaffUser,
  LoginDto,
  RegisterMemberDto,
  RegisterOwnerDto,
  CreateStaffDto,
  UpdateProfileDto,
  Space,
  CreateSpaceDto,
  UpdateSpaceDto,
  FilterSpaceDto,
  Discount,
  DiscountCheckResponse,
  DetailReservasi,
  Reservation,
  CreateReservationDto,
  FilterReservationDto,
  ReservationResponse,
  ReservationCancelResponse,
  VerifyQrDto,
  ProcessCheckinDto,
  CheckinResponse,
  DashboardSummary,
  MonthlyRevenueItem,
  SpaceTypeDistributionItem,
} from "@/types/api";

export * from "@/types/api";

export const API_BASE_URL = "https://api-ukk.budayakita.com/api";

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

// Request Interceptor: Attach Authorization Bearer Token
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

// Response Interceptor: Handle 401 Unauthorized redirect
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/login") &&
          !currentPath.includes("/register")
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
// 1. Authentication & User Provisioning API
// ---------------------------------------------------------------------------

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

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/auth/profile");
  if (typeof window !== "undefined" && data) {
    localStorage.setItem("user", JSON.stringify(data));
  }
  return data;
}

export async function createStaff(dto: CreateStaffDto): Promise<any> {
  const { data } = await api.post("/auth/staff", dto);
  return data;
}

// ---------------------------------------------------------------------------
// 2. Spaces & Workstation Inventory API
// ---------------------------------------------------------------------------

export async function getSpaces(params?: FilterSpaceDto): Promise<Space[]> {
  const { data } = await api.get<Space[]>("/spaces", { params });
  return data;
}

export async function getSpaceDetail(id: number | string): Promise<Space> {
  const { data } = await api.get<Space>(`/spaces/${id}`);
  return data;
}

export const getSpaceById = getSpaceDetail;

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

// ---------------------------------------------------------------------------
// 3. Reservations & Bookings API
// ---------------------------------------------------------------------------

export async function createReservation(dto: CreateReservationDto): Promise<ReservationResponse> {
  const { data } = await api.post<ReservationResponse>("/reservations", dto);
  return data;
}

export async function getMyBookings(params?: FilterReservationDto): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>("/reservations", { params });
  return data;
}

export const getMyReservations = getMyBookings;

export async function getAllBookings(params?: FilterReservationDto): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>("/reservations", { params });
  return data;
}

export const getAllReservations = getAllBookings;

export async function getReservationById(id: number | string): Promise<Reservation> {
  const { data } = await api.get<Reservation>(`/reservations/${id}`);
  return data;
}

export async function cancelBooking(id: number | string): Promise<ReservationCancelResponse> {
  const { data } = await api.patch<ReservationCancelResponse>(`/reservations/${id}/cancel`);
  return data;
}

export const cancelReservation = cancelBooking;

export async function updateReservationStatus(
  id: number | string,
  status: ReservationStatus
): Promise<Reservation> {
  const { data } = await api.patch<Reservation>(`/reservations/${id}/status`, { status });
  return data;
}

// ---------------------------------------------------------------------------
// 4. Check-in & Verification API
// ---------------------------------------------------------------------------

export async function verifyCheckIn(code: string): Promise<any> {
  const { data } = await api.post("/checkin/verify", { qrCode: code });
  return data;
}

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

export async function processCheckOut(
  target: string | ProcessCheckinDto
): Promise<CheckinResponse> {
  const payload = typeof target === "string" ? { qrCode: target, action: "checkout" } : { ...target, action: "checkout" };
  const { data } = await api.post<CheckinResponse>("/checkin/process", payload);
  return data;
}

// ---------------------------------------------------------------------------
// 5. Users & Staff Management API
// ---------------------------------------------------------------------------

export async function getAllMembers(): Promise<MemberUser[]> {
  const { data } = await api.get<MemberUser[]>("/users/members");
  return data;
}

export const getMembers = getAllMembers;

export async function getStaffs(): Promise<StaffUser[]> {
  const { data } = await api.get<StaffUser[]>("/users/staffs");
  return data;
}

export async function deleteStaff(id: number | string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/users/staffs/${id}`);
  return data;
}

export async function updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
  const { data } = await api.put<UserProfile>("/users/profile", dto);
  return data;
}

// ---------------------------------------------------------------------------
// 6. Discounts & Promo Codes API
// ---------------------------------------------------------------------------

export async function checkDiscount(code: string): Promise<DiscountCheckResponse> {
  const { data } = await api.get<DiscountCheckResponse>(`/discounts/check/${encodeURIComponent(code)}`);
  return data;
}

export async function getDiscounts(): Promise<Discount[]> {
  const { data } = await api.get<Discount[]>("/discounts");
  return data;
}

// ---------------------------------------------------------------------------
// 7. Reports & Analytics API (Space Owner)
// ---------------------------------------------------------------------------

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/reports/summary");
  return data;
}

export async function getMonthlyRevenue(year?: number): Promise<MonthlyRevenueItem[]> {
  const { data } = await api.get<MonthlyRevenueItem[]>("/reports/monthly-revenue", {
    params: { year: year || new Date().getFullYear() },
  });
  return data;
}

export async function getSpaceTypeDistribution(): Promise<SpaceTypeDistributionItem[]> {
  const { data } = await api.get<SpaceTypeDistributionItem[]>("/reports/space-distribution");
  return data;
}

export async function getRecentTransactions(limit: number = 10): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>("/reports/recent-transactions", {
    params: { limit },
  });
  return data;
}

export default api;
