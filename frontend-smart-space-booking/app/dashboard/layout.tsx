"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Building,
  UserCheck,
  QrCode,
  CalendarCheck,
  Compass,
  LogOut,
  ChevronRight,
  ShieldCheck,
  User,
  Menu,
  X,
  Loader2,
  Building2,
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-xs font-semibold">Memverifikasi otentikasi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const role = user.role?.toLowerCase();
  const isOwner = role === "admin_space" || role === "owner";
  const isStaff = role === "staff";
  const isMember = !isOwner && !isStaff;

  const getRoleBadge = () => {
    if (isOwner) return { label: "Space Owner", color: "bg-sky-100 text-sky-800 border-sky-200" };
    if (isStaff) return { label: "Staff Operasional", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    return { label: "Member", color: "bg-indigo-100 text-indigo-800 border-indigo-200" };
  };

  const badge = getRoleBadge();

  // Sidebar navigation menu based on role
  const getNavSections = () => {
    if (isOwner) {
      return [
        {
          title: "Manajemen Coworking",
          links: [
            { label: "Overview KPI & Laporan", href: "/dashboard/owner", icon: LayoutDashboard },
            { label: "Kelola Ruangan (Spaces)", href: "/dashboard/owner/spaces", icon: Building },
            { label: "Kelola Tim Staff", href: "/dashboard/owner/staff", icon: UserCheck },
          ],
        },
        {
          title: "Eksplorasi",
          links: [
            { label: "Katalog Publik Ruangan", href: "/spaces", icon: Compass },
          ],
        },
      ];
    }

    if (isStaff) {
      return [
        {
          title: "Operasional Resepsionis",
          links: [
            { label: "Terminal Check-In QR", href: "/dashboard/staff", icon: QrCode },
          ],
        },
        {
          title: "Eksplorasi",
          links: [
            { label: "Katalog Publik Ruangan", href: "/spaces", icon: Compass },
          ],
        },
      ];
    }

    // Default Member
    return [
      {
        title: "Aktivitas Member",
        links: [
          { label: "Reservasi & Tiket Saya", href: "/dashboard/member", icon: CalendarCheck },
        ],
      },
      {
        title: "Eksplorasi",
        links: [
          { label: "Cari Ruangan Baru", href: "/spaces", icon: Compass },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">Menu Dashboard</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all ${
          sidebarOpen ? "block" : "hidden md:flex"
        }`}
      >
        <div className="p-5 space-y-6">
          {/* User Profile Capsule */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center shadow-inner">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user.member?.namaMember ||
                    user.spaceOwner?.namaPemilik ||
                    user.staff?.namaStaff ||
                    user.username}
                </p>
                <p className="text-xs text-sky-600 font-mono">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-500 font-medium">Role Akun:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Navigation Links by Section */}
          <div className="space-y-5">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-sky-50 text-sky-700 border border-sky-100 shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                          <span>{link.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-600" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer / Logout */}
        <div className="p-5 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Dashboard Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
