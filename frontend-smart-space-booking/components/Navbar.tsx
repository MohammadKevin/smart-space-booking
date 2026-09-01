"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Compass,
  CalendarCheck,
  LogOut,
  Building2,
  ChevronDown,
  ArrowRight,
  UserCheck,
  QrCode,
  Building,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // When inside dashboard, use sidebar exclusively (no duplicate top navbar)
  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  const handleLogout = () => {
    logoutUser();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  const getDisplayName = () => {
    if (!user) return "Pengguna";
    if (user.member?.namaMember) return user.member.namaMember;
    if (user.spaceOwner?.namaPemilik) return user.spaceOwner.namaPemilik;
    if (user.spaceOwner?.namaCoworking) return user.spaceOwner.namaCoworking;
    if (user.staff?.namaStaff) return user.staff.namaStaff;
    return user.username || "Pengguna";
  };

  const getNormalizedRole = () => {
    if (!user) return "";
    const r = user.role?.toLowerCase();
    if (r === "admin_space" || r === "owner") return "owner";
    if (r === "staff") return "staff";
    return "member";
  };

  const getRoleLabel = () => {
    const role = getNormalizedRole();
    if (role === "owner") return "Space Owner";
    if (role === "staff") return "Staff";
    return "Member";
  };

  const currentRole = getNormalizedRole();

  // Dynamic Navigation based on Role for Public Pages
  const getNavLinks = () => {
    if (!isAuthenticated || !user) {
      return [{ label: "Katalog Ruangan", href: "/spaces", icon: Compass }];
    }

    if (currentRole === "owner") {
      return [
        { label: "Katalog Ruangan", href: "/spaces", icon: Compass },
        { label: "Dashboard Space Owner", href: "/dashboard/owner", icon: LayoutDashboard },
      ];
    }

    if (currentRole === "staff") {
      return [
        { label: "Katalog Ruangan", href: "/spaces", icon: Compass },
        { label: "Terminal Check-In", href: "/dashboard/staff", icon: QrCode },
      ];
    }

    // Default Member
    return [
      { label: "Katalog Ruangan", href: "/spaces", icon: Compass },
      { label: "Dashboard Member", href: "/dashboard/member", icon: CalendarCheck },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Live Signal */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">
                SmartSpace
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <div className="w-6 h-6 rounded-md bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                    {(getDisplayName() || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                      {getRoleLabel()}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Masuk sebagai ({getRoleLabel()})
                      </p>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {getDisplayName()}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        @{user.username}
                      </p>
                    </div>

                    {currentRole === "owner" && (
                      <>
                        <Link
                          href="/dashboard/owner"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                          <span>Dashboard Overview</span>
                        </Link>
                        <Link
                          href="/dashboard/owner/spaces"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>Inventory Ruangan</span>
                        </Link>
                        <Link
                          href="/dashboard/owner/staff"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tim Staff</span>
                        </Link>
                      </>
                    )}

                    {currentRole === "staff" && (
                      <Link
                        href="/dashboard/staff"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-400" />
                        <span>Terminal Check-In</span>
                      </Link>
                    )}

                    {currentRole === "member" && (
                      <Link
                        href="/dashboard/member"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tiket & Reservasi Saya</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors shadow-xs"
                >
                  <span>Daftar</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 py-1.5 bg-slate-50 rounded-md">
                  <p className="text-xs font-bold text-slate-900">{getDisplayName()}</p>
                  <p className="text-[11px] text-slate-500">Role: {getRoleLabel()}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-md"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 text-xs font-semibold text-white bg-sky-600 rounded-md"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
