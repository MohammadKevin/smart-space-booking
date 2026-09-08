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
  UserCog,
  TicketPercent,
  CalendarClock,
  Wallet,
  ReceiptText,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
    return user.email || "Pengguna";
  };

  const getNormalizedRole = () => {
    if (!user) return "";
    const r = user.role?.toLowerCase();
    if (r === "super_admin") return "super_admin";
    if (r === "admin_space" || r === "owner") return "owner";
    if (r === "staff") return "staff";
    return "member";
  };

  const getRoleLabel = () => {
    const role = getNormalizedRole();
    if (role === "super_admin") return "Platform CEO";
    if (role === "owner") return "Space Owner";
    if (role === "staff") return "Staff";
    return "Member";
  };

  const currentRole = getNormalizedRole();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full shadow-2xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs flex items-center justify-center bg-white">
                <img src="/icon-web.png" alt="WorkNest" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">
                WorkNest
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/spaces"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pathname.startsWith("/spaces")
                    ? "bg-cyan-50 text-cyan-800 font-bold border border-cyan-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-600" />
                <span>Katalog Ruangan</span>
              </Link>

              {isAuthenticated && currentRole === "member" && (
                <>
                  <Link
                    href="/dashboard/member"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === "/dashboard/member"
                        ? "bg-cyan-50 text-cyan-800 font-bold border border-cyan-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Tiket Saya</span>
                  </Link>
                  <Link
                    href="/dashboard/member/transactions"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname.startsWith("/dashboard/member/transactions")
                        ? "bg-cyan-50 text-cyan-800 font-bold border border-cyan-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Transaksi</span>
                  </Link>
                </>
              )}

              {isAuthenticated && currentRole === "owner" && (
                <>
                  <Link
                    href="/dashboard/owner"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Dashboard KPI</span>
                  </Link>
                  <Link
                    href="/dashboard/owner/reservations"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Reservasi</span>
                  </Link>
                </>
              )}

              {isAuthenticated && currentRole === "staff" && (
                <Link
                  href="/dashboard/staff"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terminal Check-In</span>
                </Link>
              )}

              {isAuthenticated && currentRole === "super_admin" && (
                <Link
                  href="/dashboard/super-admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-800" />
                  <span>Overview Platform</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {(getDisplayName() || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-[10px] text-cyan-700 font-medium leading-none mt-0.5">
                      {getRoleLabel()}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Masuk sebagai ({getRoleLabel()})
                      </p>
                      <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {getDisplayName()}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      {currentRole === "super_admin" && (
                        <>
                          <Link
                            href="/dashboard/super-admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                            <span>Overview Platform</span>
                          </Link>
                          <Link
                            href="/dashboard/super-admin/owners"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mitra Space Owner</span>
                          </Link>
                          <Link
                            href="/dashboard/super-admin/commission"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <TicketPercent className="w-3.5 h-3.5 text-slate-400" />
                            <span>Komisi Platform</span>
                          </Link>
                          <Link
                            href="/dashboard/super-admin/transactions"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Transaksi Global</span>
                          </Link>
                          <Link
                            href="/dashboard/super-admin/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <UserCog className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pengaturan Akun</span>
                          </Link>
                        </>
                      )}

                      {currentRole === "owner" && (
                        <>
                          <Link
                            href="/dashboard/owner"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                            <span>Dashboard KPI</span>
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
                          <Link
                            href="/dashboard/owner/transactions"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Transaksi & Finansial</span>
                          </Link>
                          <Link
                            href="/dashboard/owner/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <UserCog className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pengaturan Akun</span>
                          </Link>
                        </>
                      )}

                      {currentRole === "staff" && (
                        <>
                          <Link
                            href="/dashboard/staff"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-400" />
                            <span>Terminal Check-In</span>
                          </Link>
                          <Link
                            href="/dashboard/owner/transactions"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Transaksi</span>
                          </Link>
                          <Link
                            href="/dashboard/staff/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <UserCog className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pengaturan Akun</span>
                          </Link>
                        </>
                      )}

                      {currentRole === "member" && (
                        <>
                          <Link
                            href="/dashboard/member"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <CalendarCheck className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Tiket & Jadwal Saya</span>
                          </Link>
                          <Link
                            href="/dashboard/member/transactions"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Wallet className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Transaksi & Invoice</span>
                          </Link>
                          <Link
                            href="/spaces"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Compass className="w-3.5 h-3.5 text-slate-400" />
                            <span>Katalog Ruangan</span>
                          </Link>
                          <Link
                            href="/dashboard/member/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <UserCog className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pengaturan Akun</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
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

          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 shadow-lg">
          <Link
            href="/spaces"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-800 rounded-lg transition-colors border border-slate-200"
          >
            <Compass className="w-4 h-4 text-cyan-600" />
            <span>Katalog Ruangan Coworking</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-900">{getDisplayName()}</p>
                <p className="text-[11px] text-cyan-700 font-medium">Peran: {getRoleLabel()}</p>
              </div>

              {currentRole === "super_admin" && (
                <>
                  <Link
                    href="/dashboard/super-admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Overview Platform</span>
                  </Link>
                  <Link
                    href="/dashboard/super-admin/owners"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <Building className="w-4 h-4 text-slate-500" />
                    <span>Mitra Space Owner</span>
                  </Link>
                  <Link
                    href="/dashboard/super-admin/commission"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <TicketPercent className="w-4 h-4 text-slate-500" />
                    <span>Komisi Platform</span>
                  </Link>
                  <Link
                    href="/dashboard/super-admin/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <ReceiptText className="w-4 h-4 text-slate-500" />
                    <span>Transaksi Global</span>
                  </Link>
                </>
              )}

              {currentRole === "owner" && (
                <>
                  <Link
                    href="/dashboard/owner"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Dashboard Owner</span>
                  </Link>
                  <Link
                    href="/dashboard/owner/reservations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <CalendarClock className="w-4 h-4 text-slate-500" />
                    <span>Manajemen Reservasi</span>
                  </Link>
                  <Link
                    href="/dashboard/owner/spaces"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <Building className="w-4 h-4 text-slate-500" />
                    <span>Inventory Ruangan</span>
                  </Link>
                  <Link
                    href="/dashboard/owner/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <ReceiptText className="w-4 h-4 text-slate-500" />
                    <span>Transaksi & Finansial</span>
                  </Link>
                </>
              )}

              {currentRole === "staff" && (
                <>
                  <Link
                    href="/dashboard/staff"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Terminal Check-In</span>
                  </Link>
                  <Link
                    href="/dashboard/owner/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <ReceiptText className="w-4 h-4 text-slate-500" />
                    <span>Transaksi</span>
                  </Link>
                </>
              )}

              {currentRole === "member" && (
                <>
                  <Link
                    href="/dashboard/member"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <CalendarCheck className="w-4 h-4 text-cyan-600" />
                    <span>Tiket & Jadwal Saya</span>
                  </Link>
                  <Link
                    href="/dashboard/member/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <Wallet className="w-4 h-4 text-cyan-600" />
                    <span>Transaksi & Invoice</span>
                  </Link>
                  <Link
                    href="/dashboard/member/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <UserCog className="w-4 h-4 text-slate-500" />
                    <span>Profil Saya</span>
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg cursor-pointer"
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
