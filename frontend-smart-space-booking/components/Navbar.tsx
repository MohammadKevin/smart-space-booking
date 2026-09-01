"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Compass,
  CalendarCheck,
  LogOut,
  User,
  Menu,
  X,
  Sparkles,
  Building2,
  ChevronDown,
  Layers,
  ArrowRight,
  UserCheck,
  QrCode,
  Building,
  LayoutDashboard,
  Users,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  const getDisplayName = () => {
    if (!user) return "";
    if (user.member?.namaMember) return user.member.namaMember;
    if (user.spaceOwner?.namaPemilik) return user.spaceOwner.namaPemilik;
    if (user.spaceOwner?.namaCoworking) return user.spaceOwner.namaCoworking;
    if (user.staff?.namaStaff) return user.staff.namaStaff;
    return user.username;
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
    if (role === "staff") return "Staff Operasional";
    return "Member";
  };

  const currentRole = getNormalizedRole();

  // Dynamic Navigation based on Role
  const getNavLinks = () => {
    if (!isAuthenticated || !user) {
      return [
        { label: "Katalog Ruangan", href: "/spaces", icon: Compass },
      ];
    }

    if (currentRole === "owner") {
      return [
        { label: "Overview KPI", href: "/dashboard/owner", icon: LayoutDashboard },
        { label: "Kelola Ruangan", href: "/dashboard/owner/spaces", icon: Building },
        { label: "Kelola Staff", href: "/dashboard/owner/staff", icon: UserCheck },
        { label: "Katalog Ruangan", href: "/spaces", icon: Compass },
      ];
    }

    if (currentRole === "staff") {
      return [
        { label: "Terminal Check-In QR", href: "/dashboard/staff", icon: QrCode },
        { label: "Katalog Ruangan", href: "/spaces", icon: Compass },
      ];
    }

    // Default Member
    return [
      { label: "Dashboard Member", href: "/dashboard/member", icon: LayoutDashboard },
      { label: "Katalog Ruangan", href: "/spaces", icon: Compass },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:bg-sky-700 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight flex items-center gap-1.5">
                SmartSpace
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 uppercase tracking-wider">
                  LIVE
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                Coworking & Meeting Hub
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-sky-50 text-sky-700 shadow-sm border border-sky-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-inner">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-slate-800 leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mt-0.5">
                      {getRoleLabel()}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Akun Terverifikasi ({getRoleLabel()})
                      </p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {getDisplayName()}
                      </p>
                      <span className="inline-block mt-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        @{user.username}
                      </span>
                    </div>

                    {currentRole === "owner" && (
                      <>
                        <Link
                          href="/dashboard/owner"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          Dashboard Space Owner
                        </Link>
                        <Link
                          href="/dashboard/owner/spaces"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                        >
                          <Building className="w-4 h-4 text-slate-400" />
                          Kelola Ruangan Saya
                        </Link>
                        <Link
                          href="/dashboard/owner/staff"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                        >
                          <UserCheck className="w-4 h-4 text-slate-400" />
                          Kelola Tim Staff
                        </Link>
                      </>
                    )}

                    {currentRole === "staff" && (
                      <Link
                        href="/dashboard/staff"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-slate-400" />
                        Terminal Check-In QR
                      </Link>
                    )}

                    {currentRole === "member" && (
                      <Link
                        href="/dashboard/member"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                      >
                        <CalendarCheck className="w-4 h-4 text-slate-400" />
                        Dashboard Member & Tiket
                      </Link>
                    )}

                    <Link
                      href="/spaces"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                    >
                      <Compass className="w-4 h-4 text-slate-400" />
                      Jelajahi Katalog Ruangan
                    </Link>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Keluar (Logout)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-sky-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm shadow-sky-600/20 transition-all hover:shadow-md"
                >
                  <span>Daftar Akun</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? "bg-sky-50 text-sky-700 border border-sky-100"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-600" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">{getRoleLabel()}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari Akun
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-colors"
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
