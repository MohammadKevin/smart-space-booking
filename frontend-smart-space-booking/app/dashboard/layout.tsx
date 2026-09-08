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
  Activity,
  TicketPercent,
  CalendarClock,
  ClipboardList,
  User,
  UserCog,
  ReceiptText,
  Wallet,
  AlertCircle,
  Radio,
  Wifi,
  ChevronDown,
  Layers,
  Sparkles,
  Ticket,
  ExternalLink,
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
                  className="px-4 py-2 bg-[#0D5C63] hover:bg-[#09474D] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Login Ulang
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Muat Ulang
                </button>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="w-6 h-6 text-[#0D5C63] animate-spin" />
              <p className="text-xs font-semibold">Memverifikasi Sesi...</p>
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
    if (href === "/dashboard/owner") return pathname === "/dashboard/owner";
    if (href === "/dashboard/member") return pathname === "/dashboard/member";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50/70 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen z-30">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Top Header */}
          {role === "owner" ? (
            <div className="p-3 border-b border-slate-200">
              <div className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-[#E6F4F2] text-[#0D5C63] flex items-center justify-center shrink-0 border border-[#BCE3DE]">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate text-left">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.spaceOwner?.namaCoworking || "Senopati Prime Suite"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user.spaceOwner?.alamat || "Jakarta Selatan"}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            </div>
          ) : role === "member" ? (
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-700 uppercase">
                  PORTAL V2.4
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                IDN-MLG
              </span>
            </div>
          ) : (
            <div className="h-14 px-4 flex items-center border-b border-slate-200 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-7 h-7 rounded-lg bg-[#0D5C63] flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight">
                  WorkNest
                </span>
              </Link>
            </div>
          )}

          {/* Nav List */}
          <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
            {role === "owner" && (
              <div className="space-y-1">
                <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  OPERATIONS CONSOLE
                </p>
                {[
                  { label: "Overview", href: "/dashboard/owner", icon: LayoutDashboard },
                  { label: "Reservations", href: "/dashboard/owner/reservations", icon: CalendarClock },
                  { label: "Transactions", href: "/dashboard/owner/transactions", icon: ReceiptText },
                  { label: "Spaces & Inventory", href: "/dashboard/owner/spaces", icon: Building },
                  { label: "Add Space", href: "/dashboard/owner/spaces/create", icon: Layers },
                  { label: "Discounts & Promos", href: "/dashboard/owner/discounts", icon: TicketPercent },
                  { label: "Staff Management", href: "/dashboard/owner/staff", icon: UserCheck },
                  { label: "Profile & Settings", href: "/dashboard/owner/profile", icon: UserCog },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? "bg-[#E6F4F2] text-[#0D5C63] font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-[#0D5C63]" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {role === "member" && (
              <div className="space-y-1">
                {[
                  { label: "My Tickets", href: "/dashboard/member", icon: Ticket },
                  { label: "My Transactions", href: "/dashboard/member/transactions", icon: ReceiptText },
                  { label: "Browse Spaces", href: "/spaces", icon: Compass },
                  { label: "Saved Hubs", href: "/spaces?saved=true", icon: Building2 },
                  { label: "Profile & Settings", href: "/dashboard/member/profile", icon: UserCog },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? "bg-[#D8F3F7] text-[#0E7490] font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-[#0E7490]" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {role === "super_admin" && (
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
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {role === "staff" && (
              <div className="space-y-1">
                <p className="px-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  STAFF CONSOLE
                </p>
                {[
                  { label: "Terminal Check-In", href: "/dashboard/staff", icon: QrCode },
                  { label: "Transaksi & Pembayaran", href: "/dashboard/owner/transactions", icon: ReceiptText },
                  { label: "Pengaturan Akun", href: "/dashboard/staff/profile", icon: UserCog },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? "bg-emerald-600 text-white font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Bottom Telemetry / User Card */}
        <div className="p-3 border-t border-slate-200 bg-white space-y-2">
          {role === "owner" ? (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lock Mesh API</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Node: JKT-SEN-09 • Ping 19ms
              </p>
            </div>
          ) : role === "member" ? (
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-2">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-500" />
                  Hub NFC Mesh
                </span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Synced
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <div className="w-8 h-8 rounded-full bg-[#0D5C63] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {getInitials()}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Nomad Pro • #{user.id || 4819}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#0D5C63] flex items-center justify-center text-white">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight hidden sm:inline">
                WorkNest
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-slate-600 font-medium">
            <Link href="/spaces" className="hover:text-slate-900 transition-colors">Spaces</Link>
            <Link href="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/#faq" className="hover:text-slate-900 transition-colors">For Space Owners</Link>
            <Link href="/#about" className="hover:text-slate-900 transition-colors">About</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/spaces"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D5C63] hover:bg-[#09474D] text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>Book a Space</span>
            </Link>

            <div className="w-8 h-8 rounded-full bg-[#0D5C63] text-white font-bold text-xs flex items-center justify-center">
              {getInitials()}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Dropdown */}
        {sidebarOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">{getDisplayName()}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-rose-600 font-semibold"
              >
                Sign Out
              </button>
            </div>
            <nav className="space-y-1">
              {role === "owner" && [
                { label: "Overview", href: "/dashboard/owner" },
                { label: "Reservations", href: "/dashboard/owner/reservations" },
                { label: "Transactions", href: "/dashboard/owner/transactions" },
                { label: "Spaces & Inventory", href: "/dashboard/owner/spaces" },
                { label: "Add Space", href: "/dashboard/owner/spaces/create" },
                { label: "Discounts & Promos", href: "/dashboard/owner/discounts" },
                { label: "Staff Management", href: "/dashboard/owner/staff" },
                { label: "Profile & Settings", href: "/dashboard/owner/profile" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}

              {role === "member" && [
                { label: "My Tickets", href: "/dashboard/member" },
                { label: "My Transactions", href: "/dashboard/member/transactions" },
                { label: "Browse Spaces", href: "/spaces" },
                { label: "Profile & Settings", href: "/dashboard/member/profile" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-8 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded bg-[#0D5C63] flex items-center justify-center text-white">
                <Building2 className="w-3 h-3" />
              </div>
              <span className="font-bold text-slate-800">WorkNest</span>
              <span>© 2025 WorkNest Technologies Inc. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <Link href="/spaces" className="hover:text-slate-900">Spaces</Link>
              <Link href="/#pricing" className="hover:text-slate-900">Pricing</Link>
              <Link href="/#faq" className="hover:text-slate-900">Host Workspace</Link>
              <Link href="/#about" className="hover:text-slate-900">Security & Trust</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
