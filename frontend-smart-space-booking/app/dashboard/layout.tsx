"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Building2,
  LayoutDashboard,
  Building,
  UserCheck,
  CalendarCheck,
  QrCode,
  LogOut,
  ChevronRight,
  Compass,
  Menu,
  X,
  ShieldCheck,
  Loader2,
  TicketPercent,
  CalendarClock,
  User,
  UserCog,
  ReceiptText,
  AlertCircle,
  ChevronDown,
  Layers,
  Ticket,
  ExternalLink,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logoutUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 8000);
    } else {
      setLoadingTimedOut(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading]);

  const getNormalizedRole = () => {
    if (!user) return "";
    const r = user.role?.toLowerCase();
    if (r === "super_admin") return "super_admin";
    if (r === "admin_space" || r === "owner") return "owner";
    if (r === "staff") return "staff";
    return "member";
  };

  const role = getNormalizedRole();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (pathname === "/dashboard") {
        if (role === "super_admin") router.replace("/dashboard/super-admin");
        else if (role === "owner") router.replace("/dashboard/owner");
        else if (role === "staff") router.replace("/dashboard/staff");
        else router.replace("/dashboard/member");
        return;
      }

      const isSharedRoute =
        pathname.startsWith("/booking") ||
        pathname.startsWith("/checkout") ||
        pathname.startsWith("/spaces");

      if (isSharedRoute) {
        return;
      }

      if (role === "super_admin") {
        if (!pathname.startsWith("/dashboard/super-admin")) {
          router.replace("/dashboard/super-admin");
        }
      } else if (role === "member") {
        if (
          pathname.startsWith("/dashboard/super-admin") ||
          pathname.startsWith("/dashboard/owner") ||
          pathname.startsWith("/dashboard/staff") ||
          pathname.startsWith("/dashboard/checkin")
        ) {
          router.replace("/dashboard/member");
        }
      } else if (role === "staff") {
        if (
          pathname.startsWith("/dashboard/super-admin") ||
          (pathname.startsWith("/dashboard/owner") && !pathname.startsWith("/dashboard/owner/transactions")) ||
          pathname.startsWith("/dashboard/member") ||
          pathname.startsWith("/member")
        ) {
          router.replace("/dashboard/staff");
        }
      } else if (role === "owner") {
        if (
          pathname.startsWith("/dashboard/super-admin") ||
          pathname.startsWith("/dashboard/member") ||
          pathname.startsWith("/member") ||
          pathname === "/dashboard/staff"
        ) {
          router.replace("/dashboard/owner");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, role, pathname, router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500 max-w-xs text-center">
          {loadingTimedOut ? (
            <>
              <AlertCircle className="w-7 h-7 text-amber-500" />
              <p className="text-sm font-semibold text-slate-800">Sesi Tidak Dapat Diverifikasi</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Server terlalu lama merespons. Silakan login ulang atau coba lagi.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    router.push("/login");
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Login Ulang
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Muat Ulang
                </button>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Memverifikasi Sesi...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getDisplayName = () => {
    if (!user) return "Pengguna";
    if (user.member?.namaMember) return user.member.namaMember;
    if (user.spaceOwner?.namaPemilik) return user.spaceOwner.namaPemilik;
    if (user.spaceOwner?.namaCoworking) return user.spaceOwner.namaCoworking;
    if (user.staff?.namaStaff) return user.staff.namaStaff;
    return user.email || "Pengguna";
  };

  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isLinkActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/dashboard/member/spaces" && (pathname === "/dashboard/member/spaces" || pathname === "/dashboard/member/space")) return true;
    return false;
  };

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50/70 text-slate-900 font-sans">
      
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-white border-r border-slate-200/80 shrink-0 sticky top-0 h-screen z-30">
        <div className="flex flex-col h-full overflow-hidden">
          
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-sky-600/20 group-hover:bg-sky-500 transition-colors">
                <img src="/logo-worknest.png" alt="logo icon" className="w-10 h-10 rounded-xl" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight block leading-none">
                  WorkNest
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                  {role === "super_admin"
                    ? "Super Admin"
                    : role === "owner"
                    ? "Owner Portal"
                    : role === "staff"
                    ? "Staff Terminal"
                    : "Member Portal"}
                </span>
              </div>
            </Link>
          </div>

          <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
            {role === "owner" && (
              <div className="space-y-1">
                <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  WORKSPACE OWNER
                </p>
                {[
                  { label: "Ringkasan", href: "/dashboard/owner", icon: LayoutDashboard },
                  { label: "Reservasi", href: "/dashboard/owner/reservations", icon: CalendarClock },
                  { label: "Transaksi", href: "/dashboard/owner/transactions", icon: ReceiptText },
                  { label: "Inventaris Ruangan", href: "/dashboard/owner/spaces", icon: Building },
                  { label: "Tambah Ruangan", href: "/dashboard/owner/spaces/create", icon: Layers },
                  { label: "Diskon & Promo", href: "/dashboard/owner/discounts", icon: TicketPercent },
                  { label: "Kelola Staf", href: "/dashboard/owner/staff", icon: UserCheck },
                  { label: "Profil & Pengaturan", href: "/dashboard/owner/profile", icon: UserCog },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-sky-50 text-sky-700 font-semibold shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {role === "member" && (
              <div className="space-y-1">
                <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  PORTAL MEMBER
                </p>
                {[
                  { label: "Tiket & QR Akses", href: "/dashboard/member", icon: Ticket },
                  { label: "Riwayat Transaksi", href: "/dashboard/member/transactions", icon: ReceiptText },
                  { label: "Jelajahi Ruangan", href: "/dashboard/member/spaces", icon: Compass },
                  { label: "Profil Saya", href: "/dashboard/member/profile", icon: UserCog },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-sky-50 text-sky-700 font-semibold shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {role === "super_admin" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    SUPER ADMIN CONSOLE
                  </p>
                  {[
                    { label: "Overview Platform", href: "/dashboard/super-admin", icon: LayoutDashboard },
                    { label: "Mitra Space Owner", href: "/dashboard/super-admin/owners", icon: Building },
                    { label: "Komisi Platform", href: "/dashboard/super-admin/commission", icon: TicketPercent },
                    { label: "Transaksi Global", href: "/dashboard/super-admin/transactions", icon: ReceiptText },
                    { label: "Pengaturan Akun", href: "/dashboard/super-admin/profile", icon: UserCog },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          active
                            ? "bg-sky-50 text-sky-700 font-bold shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500">
                    SYSTEM CONTROL
                  </p>
                  <Link
                    href="/dashboard/super-admin/danger-zone"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      pathname === "/dashboard/super-admin/danger-zone"
                        ? "bg-rose-50 text-rose-700 font-bold border border-rose-200/60 shadow-sm"
                        : "text-rose-600 hover:text-rose-700 hover:bg-rose-50/70"
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 ${pathname === "/dashboard/super-admin/danger-zone" ? "text-rose-600" : "text-rose-500"}`} />
                    <span>Danger Zone</span>
                  </Link>
                </div>
              </div>
            )}

            {role === "staff" && (
              <div className="space-y-1">
                <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  TERMINAL FRONTDESK
                </p>
                {[
                  { label: "Terminal Check-In", href: "/dashboard/staff", icon: QrCode },
                  { label: "Log Reservasi", href: "/dashboard/staff/history", icon: CalendarCheck },
                  { label: "Profil Staf", href: "/dashboard/staff/profile", icon: UserCog },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-sky-50 text-sky-700 font-semibold shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {getInitials()}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {getDisplayName()}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                WorkNest
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[11px] sm:text-xs font-semibold shadow-xs font-mono">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600" />
                <span>{currentTime || "00:00:00 WIB"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {role === "owner" ? (
              <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 border border-sky-100">
                  <Building className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left max-w-[200px] md:max-w-[240px]">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                    {user.spaceOwner?.namaCoworking || "Coworking Space"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                    <span className="truncate">{user.spaceOwner?.alamat || "Mitra Resmi"}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {getInitials()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {getDisplayName()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {role === "super_admin"
                      ? "Super Admin"
                      : role === "staff"
                      ? "Staff Frontdesk"
                      : "Member"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Drawer Navigation with backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setSidebarOpen(false)}
            />
            
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
                  <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                      <img src="/logo-worknest.png" alt="logo icon" className="w-10 h-10 rounded-xl" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 text-base tracking-tight block leading-none">
                        WorkNest
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                        {role === "super_admin"
                          ? "Super Admin"
                          : role === "owner"
                          ? "Owner Portal"
                          : role === "staff"
                          ? "Staff Terminal"
                          : "Member Portal"}
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                    aria-label="Tutup Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
                  {role === "owner" && (
                    <div className="space-y-1">
                      <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        WORKSPACE OWNER
                      </p>
                      {[
                        { label: "Ringkasan", href: "/dashboard/owner", icon: LayoutDashboard },
                        { label: "Reservasi", href: "/dashboard/owner/reservations", icon: CalendarClock },
                        { label: "Transaksi", href: "/dashboard/owner/transactions", icon: ReceiptText },
                        { label: "Inventaris Ruangan", href: "/dashboard/owner/spaces", icon: Building },
                        { label: "Tambah Ruangan", href: "/dashboard/owner/spaces/create", icon: Layers },
                        { label: "Diskon & Promo", href: "/dashboard/owner/discounts", icon: TicketPercent },
                        { label: "Kelola Staf", href: "/dashboard/owner/staff", icon: UserCheck },
                        { label: "Profil & Pengaturan", href: "/dashboard/owner/profile", icon: UserCog },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = isLinkActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              active
                                ? "bg-sky-50 text-sky-700 font-semibold shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {role === "member" && (
                    <div className="space-y-1">
                      <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        PORTAL MEMBER
                      </p>
                      {[
                        { label: "Tiket & QR Akses", href: "/dashboard/member", icon: Ticket },
                        { label: "Riwayat Transaksi", href: "/dashboard/member/transactions", icon: ReceiptText },
                        { label: "Jelajahi Ruangan", href: "/dashboard/member/spaces", icon: Compass },
                        { label: "Profil Saya", href: "/dashboard/member/profile", icon: UserCog },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = isLinkActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              active
                                ? "bg-sky-50 text-sky-700 font-semibold shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {role === "super_admin" && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          SUPER ADMIN CONSOLE
                        </p>
                        {[
                          { label: "Overview Platform", href: "/dashboard/super-admin", icon: LayoutDashboard },
                          { label: "Mitra Space Owner", href: "/dashboard/super-admin/owners", icon: Building },
                          { label: "Komisi Platform", href: "/dashboard/super-admin/commission", icon: TicketPercent },
                          { label: "Transaksi Global", href: "/dashboard/super-admin/transactions", icon: ReceiptText },
                          { label: "Pengaturan Akun", href: "/dashboard/super-admin/profile", icon: UserCog },
                        ].map((item) => {
                          const Icon = item.icon;
                          const active = isLinkActive(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                active
                                  ? "bg-sky-50 text-sky-700 font-bold shadow-xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500">
                          SYSTEM CONTROL
                        </p>
                        <Link
                          href="/dashboard/super-admin/danger-zone"
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            pathname === "/dashboard/super-admin/danger-zone"
                              ? "bg-rose-50 text-rose-700 font-bold border border-rose-200/60 shadow-xs"
                              : "text-rose-600 hover:text-rose-700 hover:bg-rose-50/70"
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Danger Zone</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {role === "staff" && (
                    <div className="space-y-1">
                      <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        TERMINAL FRONTDESK
                      </p>
                      {[
                        { label: "Terminal Check-In", href: "/dashboard/staff", icon: QrCode },
                        { label: "Log Reservasi", href: "/dashboard/staff/history", icon: CalendarCheck },
                        { label: "Profil Staf", href: "/dashboard/staff/profile", icon: UserCog },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = isLinkActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              active
                                ? "bg-sky-50 text-sky-700 font-semibold shadow-xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitials()}
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {getDisplayName()}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate font-mono">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
