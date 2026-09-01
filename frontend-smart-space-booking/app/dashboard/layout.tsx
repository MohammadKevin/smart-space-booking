"use client";

import React, { useEffect, useState } from "react";
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

  const getNormalizedRole = () => {
    if (!user) return "";
    const r = user.role?.toLowerCase();
    if (r === "admin_space" || r === "owner") return "owner";
    if (r === "staff") return "staff";
    return "member";
  };

  const role = getNormalizedRole();

  // Strict Client-Side Route Guard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (role === "member") {
        if (pathname.startsWith("/dashboard/owner") || pathname.startsWith("/dashboard/staff")) {
          router.replace("/dashboard/member");
        }
      } else if (role === "staff") {
        if (pathname.startsWith("/dashboard/owner") || pathname.startsWith("/dashboard/member")) {
          router.replace("/dashboard/staff");
        }
      } else if (role === "owner") {
        if (pathname === "/dashboard/member") {
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
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
          <p className="text-xs font-semibold">Memverifikasi Sesi...</p>
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
    return user.username || "Pengguna";
  };

  const getRoleBadge = () => {
    if (role === "owner") {
      return {
        label: "Space Owner",
        className: "bg-cyan-50 text-cyan-800 border-cyan-200",
      };
    }
    if (role === "staff") {
      return {
        label: "Staff Operasional",
        className: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    return {
      label: "Member",
      className: "bg-sky-50 text-sky-800 border-sky-200",
    };
  };

  const roleBadge = getRoleBadge();

  // Navigation Links
  const getSidebarLinks = () => {
    if (role === "owner") {
      return [
        { label: "Overview KPI", href: "/dashboard/owner", icon: LayoutDashboard },
        { label: "Manajemen Reservasi", href: "/dashboard/owner/reservations", icon: CalendarClock },
        { label: "Inventory Ruangan", href: "/dashboard/owner/spaces", icon: Building },
        { label: "Kode Promo Diskon", href: "/dashboard/owner/discounts", icon: TicketPercent },
        { label: "Manajemen Staff", href: "/dashboard/owner/staff", icon: UserCheck },
      ];
    }
    if (role === "staff") {
      return [
        { label: "Terminal Check-In", href: "/dashboard/staff", icon: QrCode },
      ];
    }
    return [
      { label: "Tiket & Jadwal Saya", href: "/dashboard/member", icon: CalendarCheck },
      { label: "Katalog Ruangan", href: "/spaces", icon: Compass },
    ];
  };

  const links = getSidebarLinks();

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  const getBreadcrumbTitle = () => {
    if (pathname.startsWith("/dashboard/owner/reservations")) return "Manajemen Reservasi";
    if (pathname.startsWith("/dashboard/owner/discounts")) return "Kode Promo Diskon";
    if (pathname.startsWith("/dashboard/owner/spaces")) return "Inventory Ruangan";
    if (pathname.startsWith("/dashboard/owner/staff")) return "Manajemen Staff";
    if (pathname.startsWith("/dashboard/owner")) return "Overview KPI";
    if (pathname.startsWith("/dashboard/staff")) return "Terminal Check-In";
    if (pathname.startsWith("/dashboard/member")) return "Tiket & Jadwal Saya";
    return "Dashboard";
  };

  return (
    <div className="min-h-screen flex bg-slate-50/70 text-slate-900">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen">
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Logo Header */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-1 py-1 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs flex items-center justify-center bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-web.png" alt="SmartSpace" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">
              SmartSpace
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigasi Utama
            </p>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-cyan-600 text-white font-bold shadow-sm shadow-cyan-600/30"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar inside Dashboard */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">SmartSpace</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
              <span className="text-cyan-700 font-medium hidden sm:inline">{roleBadge.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
              <span className="font-bold text-slate-900">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {(getDisplayName() || "U").charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-none">
                {getDisplayName()}
              </p>
              <p className="text-[10px] text-cyan-700 font-medium leading-none mt-0.5">
                {roleBadge.label}
              </p>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-3 shadow-md">
            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                      isActive
                        ? "bg-cyan-600 text-white font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

