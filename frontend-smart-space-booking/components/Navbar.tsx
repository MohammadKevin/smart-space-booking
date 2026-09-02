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
  User,
  TicketPercent,
  CalendarClock,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Hide on dashboard and auth pages (login, register, verify-email)
  if (
    pathname.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email"
  ) {
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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Live Signal */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs flex items-center justify-center bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-web.png" alt="SmartSpace" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">
                SmartSpace
              </span>
            </div>
          </Link>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
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
                          href="/dashboard/owner/reservations"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Manajemen Reservasi</span>
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
                          href="/dashboard/owner/discounts"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <TicketPercent className="w-3.5 h-3.5 text-slate-400" />
                          <span>Kode Promo Diskon</span>
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
                      <>
                        <Link
                          href="/dashboard/member"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tiket & Reservasi Saya</span>
                        </Link>
                        <Link
                          href="/dashboard/member/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Profil Member</span>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-cyan-700 bg-slate-50 hover:bg-cyan-50/60 border border-slate-300/90 hover:border-cyan-400 rounded-lg transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
                >
                  <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-600" />
                  <span>Masuk</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 rounded-lg transition-all shadow-md shadow-cyan-600/30 hover:shadow-lg hover:shadow-cyan-600/40 hover:-translate-y-0.5 cursor-pointer active:scale-98"
                >
                  <span>Daftar</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-100" />
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
          {isAuthenticated && user ? (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-slate-50 rounded-md border border-slate-200">
                <p className="text-xs font-bold text-slate-900">{getDisplayName()}</p>
                <p className="text-[11px] text-slate-500">Role: {getRoleLabel()}</p>
              </div>

              {currentRole === "owner" && (
                <>
                  <Link
                    href="/dashboard/owner"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Dashboard Owner</span>
                  </Link>
                  <Link
                    href="/dashboard/owner/reservations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md"
                  >
                    <CalendarClock className="w-4 h-4 text-slate-500" />
                    <span>Manajemen Reservasi</span>
                  </Link>
                  <Link
                    href="/dashboard/owner/spaces"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md"
                  >
                    <Building className="w-4 h-4 text-slate-500" />
                    <span>Inventory Ruangan</span>
                  </Link>
                </>
              )}

              {currentRole === "staff" && (
                <Link
                  href="/dashboard/staff"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md"
                >
                  <QrCode className="w-4 h-4 text-slate-500" />
                  <span>Terminal Check-In</span>
                </Link>
              )}

              {currentRole === "member" && (
                <>
                  <Link
                    href="/dashboard/member"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md"
                  >
                    <CalendarCheck className="w-4 h-4 text-slate-500" />
                    <span>Dashboard Member</span>
                  </Link>
                  <Link
                    href="/dashboard/member/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Profil Saya</span>
                  </Link>
                </>
              )}

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
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 text-center px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-300 rounded-lg transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Masuk</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 text-center px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 rounded-lg shadow-sm shadow-cyan-600/30 transition-all"
              >
                <span>Daftar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
