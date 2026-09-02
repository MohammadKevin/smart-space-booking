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
  CreateDiscountDto,
  UpdateDiscountDto,
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
  Transaksi,
  StartPaymentResponse,
} from "@/types/api";

export * from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-ukk.budayakita.com/api";

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

// Request Interceptor: Attach Authorization Bearer Token & Multi-Tenancy Header (x-maker-key / x-app-key)
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

      const makerKey =
        localStorage.getItem("x-maker-key") ||
        localStorage.getItem("maker_key") ||
        localStorage.getItem("app_key") ||
        process.env.NEXT_PUBLIC_MAKER_KEY;
      if (makerKey && config.headers) {
        config.headers["x-maker-key"] = makerKey;
        config.headers["x-app-key"] = makerKey;
      }
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
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
    if (error.response?.status === 500) {
      return "Server backend sedang mengalami kendala (HTTP 500). Mohon periksa status server atau coba beberapa saat lagi.";
    }
    if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
      return `Koneksi ke backend API (${API_BASE_URL}) gagal atau server sedang offline/restarting.`;
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

export async function uploadSpaceImage(file: File): Promise<{ url: string; publicId?: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("token")
      : null;

  const res = await fetch(`${API_BASE_URL}/spaces/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    let errMsg = `Upload gagal (Status ${res.status})`;
    try {
      const errJson = await res.json();
      errMsg = errJson.message || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return res.json();
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

export async function checkDiscount(code: string): Promise<any> {
  const { data } = await api.get<any>(`/discounts/check/${encodeURIComponent(code)}`);
  const diskonObj = data?.diskon || data?.data || data;
  return {
    isValid: !!(data?.isValid || data?.valid || diskonObj?.id),
    valid: !!(data?.isValid || data?.valid || diskonObj?.id),
    message: data?.message || "Kode promo aktif dan valid.",
    diskon: diskonObj,
    data: diskonObj,
  };
}

export async function getDiscounts(): Promise<Discount[]> {
  const { data } = await api.get<Discount[]>("/discounts");
  return Array.isArray(data) ? data : [];
}

export async function createDiscount(dto: CreateDiscountDto): Promise<Discount> {
  const { data } = await api.post<Discount>("/discounts", dto);
  return data;
}

export async function updateDiscount(id: number | string, dto: UpdateDiscountDto): Promise<Discount> {
  const { data } = await api.put<Discount>(`/discounts/${id}`, dto);
  return data;
}

export async function deleteDiscount(id: number | string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/discounts/${id}`);
  return data;
}

// ---------------------------------------------------------------------------
// 7. Reports & Financial Analytics API (Space Owner)
// ---------------------------------------------------------------------------

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<any>("/reports/summary");
  if (data && typeof data === "object") {
    return {
      totalRevenue: data.totalRevenue || 0,
      totalSpaces: data.totalSpaces || 0,
      totalStaffs: data.totalStaffs || 0,
      totalReservations:
        data.bookingCounts?.total ??
        data.totalReservations ??
        0,
      statusCounts: data.bookingCounts || data.statusCounts || undefined,
    };
  }
  return {
    totalRevenue: 0,
    totalSpaces: 0,
    totalStaffs: 0,
    totalReservations: 0,
  };
}

export async function getMonthlyRevenue(year?: number): Promise<MonthlyRevenueItem[]> {
  const { data } = await api.get<any>("/reports/monthly-revenue", {
    params: { year: year || new Date().getFullYear() },
  });
  if (data && Array.isArray(data.months)) {
    return data.months.map((m: any) => ({
      month: m.monthName || m.month || `Bulan ${m.monthIndex || 1}`,
      monthNumber: m.monthIndex || m.monthNumber || 1,
      revenue: Number(m.revenue) || 0,
      totalBookings: Number(m.totalBookings) || 0,
    }));
  }
  if (Array.isArray(data)) {
    return data.map((m: any) => ({
      month: m.monthName || m.month || `Bulan ${m.monthNumber || m.monthIndex || 1}`,
      monthNumber: m.monthNumber || m.monthIndex || 1,
      revenue: Number(m.revenue) || 0,
      totalBookings: Number(m.totalBookings) || 0,
    }));
  }
  return [];
}

export async function getSpaceTypeDistribution(): Promise<SpaceTypeDistributionItem[]> {
  const { data } = await api.get<any>("/reports/space-distribution");
  if (Array.isArray(data)) {
    const totalCount = data.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0) || 1;
    return data.map((d: any) => ({
      tipe: (d.type || d.tipe || "desk") as SpaceType,
      label: d.label || d.tipe || "Space",
      count: Number(d.count) || 0,
      totalRevenue: Number(d.revenue || d.totalRevenue) || 0,
      percentage: Math.round(((Number(d.count) || 0) / totalCount) * 100),
    }));
  }
  return [];
}

export async function getRecentTransactions(limit: number = 10): Promise<Reservation[]> {
  const { data } = await api.get<any>("/reports/recent-transactions", {
    params: { limit },
  });
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Transactions & Payments API
// ---------------------------------------------------------------------------

// Start a Midtrans Snap payment for an approved reservation (member)
export async function startPayment(
  reservationId: number
): Promise<StartPaymentResponse> {
  const { data } = await api.post<StartPaymentResponse>(
    `/transactions/${reservationId}/pay`
  );
  return data;
}

// List transactions, scoped by role (member/owner/staff)
export async function getTransactions(): Promise<Transaksi[]> {
  const { data } = await api.get<any>("/transactions");
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

// Fetch a single transaction / invoice by id
export async function getTransaction(id: number): Promise<Transaksi> {
  const { data } = await api.get<any>(`/transactions/${id}`);
  if (data && data.data) {
    return data.data;
  }
  return data;
}

// Reconcile payment status with Midtrans (member/owner/staff)
export async function syncPayment(id: number): Promise<any> {
  const { data } = await api.post<any>(`/transactions/${id}/sync`);
  return data;
}

// Owner/Staff marks a paid transaction as refund
export async function markRefund(id: number): Promise<any> {
  const { data } = await api.patch<any>(`/transactions/${id}/refund`);
  return data;
}

export default api;
