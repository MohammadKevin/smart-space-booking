"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getSpaces, Space } from "@/lib/api";
import {
  Compass,
  CalendarCheck,
  LogOut,
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
  Search,
  Loader2,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Space[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered || userDropdownOpen || searchDropdownOpen || mobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleUserClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleUserClickOutside);
    return () => document.removeEventListener("mousedown", handleUserClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchDropdownOpen(true);
      }
      if (e.key === "Escape") {
        setSearchDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await getSpaces({ search: searchQuery.trim() });
        setSearchResults(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (pathname !== "/") {
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
    if (role === "super_admin") return "Super Admin";
    if (role === "owner") return "Space Owner";
    if (role === "staff") return "Staff";
    return "Member";
  };

  const currentRole = getNormalizedRole();

  return (
    <>
      <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none transition-all duration-300 animate-navbar-entrance">
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded
              ? "w-full max-w-6xl scale-100"
              : "w-full max-w-3xl lg:max-w-4xl scale-[0.92] sm:scale-95"
          }`}
        >
          <div
            className={`relative flex items-center justify-between rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isExpanded
                ? "h-14 sm:h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-2xl border border-white/90 shadow-[0_24px_50px_rgba(15,23,42,0.14),inset_0_1px_1.5px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/[0.08]"
                : isScrolled
                ? "h-12 sm:h-13 px-3.5 sm:px-5 bg-white/85 backdrop-blur-xl border border-white/85 shadow-[0_14px_30px_rgba(15,23,42,0.10),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-slate-900/[0.06]"
                : "h-12 sm:h-13 px-3.5 sm:px-5 bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-slate-900/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/#home"
                className="flex items-center gap-2.5 group focus:outline-none shrink-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-sky-600/20 group-hover:bg-sky-500 transition-colors overflow-hidden">
                  <img src="/logo-worknest.png" alt="logo icon" className="w-8 h-8 object-cover" />
                </div>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                  WorkNest
                </span>
              </Link>

              <div className="h-4 w-[1px] bg-slate-300/60 hidden md:block mx-1" />

              <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-xs lg:text-[13px] font-medium text-slate-600">
                <Link
                  href="/#ruang-kerja"
                  className="px-3 py-1.5 rounded-full hover:bg-slate-900/5 hover:text-slate-950 transition-all"
                >
                  Lihat Ruangan
                </Link>
                <Link
                  href="/#tata-cara"
                  className="px-3 py-1.5 rounded-full hover:bg-slate-900/5 hover:text-slate-950 transition-all"
                >
                  Tata Cara Reservasi
                </Link>
                <Link
                  href="/#tarif"
                  className="px-3 py-1.5 rounded-full hover:bg-slate-900/5 hover:text-slate-950 transition-all text-slate-500"
                >
                  Tarif
                </Link>
                <Link
                  href="/#faq"
                  className="px-3 py-1.5 rounded-full hover:bg-slate-900/5 hover:text-slate-950 transition-all text-slate-500"
                >
                  FAQ
                </Link>

                {isAuthenticated && currentRole === "member" && (
                  <Link
                    href="/dashboard/member"
                    className="inline-flex items-center gap-1.5 text-sky-700 hover:text-sky-900 font-semibold bg-sky-50/80 hover:bg-sky-100/80 px-2.5 py-1 rounded-full text-xs border border-sky-200/60 transition-all"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Jadwal Saya</span>
                  </Link>
                )}
                {isAuthenticated && currentRole === "owner" && (
                  <Link
                    href="/dashboard/owner"
                    className="inline-flex items-center gap-1.5 text-sky-700 hover:text-sky-900 font-semibold bg-sky-50/80 hover:bg-sky-100/80 px-2.5 py-1 rounded-full text-xs border border-sky-200/60 transition-all"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
                    <span>Dashboard Mitra</span>
                  </Link>
                )}
                {isAuthenticated && currentRole === "staff" && (
                  <Link
                    href="/dashboard/staff"
                    className="inline-flex items-center gap-1.5 text-sky-700 hover:text-sky-900 font-semibold bg-sky-50/80 hover:bg-sky-100/80 px-2.5 py-1 rounded-full text-xs border border-sky-200/60 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5 text-sky-600" />
                    <span>Terminal Check-In</span>
                  </Link>
                )}
                {isAuthenticated && currentRole === "super_admin" && (
                  <Link
                    href="/dashboard/super-admin"
                    className="inline-flex items-center gap-1.5 text-slate-800 hover:text-slate-950 font-semibold bg-slate-100/80 hover:bg-slate-200/80 px-2.5 py-1 rounded-full text-xs border border-slate-200/60 transition-all"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-600" />
                    <span>Admin Panel</span>
                  </Link>
                )}
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-2.5">
              <div ref={searchContainerRef} className="relative">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      setSearchDropdownOpen(false);
                      router.push(`/spaces?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="relative flex items-center"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!searchDropdownOpen && e.target.value.trim()) {
                        setSearchDropdownOpen(true);
                      }
                    }}
                    onFocus={() => {
                      if (searchQuery.trim() || searchResults.length > 0) {
                        setSearchDropdownOpen(true);
                      }
                    }}
                    placeholder="Cari ruangan..."
                    className={`${
                      isExpanded ? "w-36 lg:w-48 focus:w-56" : "w-28 lg:w-40 focus:w-52"
                    } pl-8 pr-7 py-1.5 rounded-full border border-slate-200/70 bg-white/50 hover:bg-white/80 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none shadow-2xs`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setSearchDropdownOpen(false);
                      }}
                      className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </form>

                {searchDropdownOpen && searchQuery.trim() && (
                  <div className="absolute right-0 top-full mt-3 w-80 lg:w-96 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl p-2.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    {searchLoading ? (
                      <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                        <span>Mencari ruangan...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Hasil Pencarian
                        </div>
                        {searchResults.map((space) => (
                          <Link
                            key={space.id}
                            href={`/spaces/${space.id}`}
                            onClick={() => setSearchDropdownOpen(false)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-sky-50/60 transition-colors group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <img
                                src={
                                  space.foto ||
                                  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80"
                                }
                                alt={space.namaSpace}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate group-hover:text-sky-600">
                                {space.namaSpace}
                              </p>
                              <p className="text-[11px] text-slate-400 capitalize">
                                {space.tipe?.replace("_", " ")} &bull; {space.kapasitas} Orang
                              </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-sky-600 shrink-0">
                              Rp {(space.hargaPerJam || 0).toLocaleString("id-ID")}
                            </span>
                          </Link>
                        ))}
                        <div className="pt-1.5 border-t border-slate-100 mt-1">
                          <Link
                            href={`/spaces?search=${encodeURIComponent(searchQuery.trim())}`}
                            onClick={() => setSearchDropdownOpen(false)}
                            className="block text-center py-1.5 text-xs font-bold text-sky-600 hover:underline"
                          >
                            Lihat semua hasil pencarian &rarr;
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Tidak ada ruangan yang cocok dengan &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/spaces"
                    className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-full transition-all shadow-sm shadow-sky-600/20 active:scale-95"
                  >
                    Pesan Ruangan
                  </Link>

                  <div ref={userMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-slate-200/80 bg-white/70 hover:bg-white transition-all shadow-2xs focus:outline-none cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                        {(getDisplayName() || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[100px]">
                          {getDisplayName()}
                        </p>
                      </div>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-3 border-b border-slate-100 bg-sky-50/40 rounded-t-2xl">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
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
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                                <span>Overview Platform</span>
                              </Link>
                              <Link
                                href="/dashboard/super-admin/owners"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span>Mitra Space Owner</span>
                              </Link>
                              <Link
                                href="/dashboard/super-admin/commission"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <TicketPercent className="w-3.5 h-3.5 text-slate-400" />
                                <span>Komisi Platform</span>
                              </Link>
                              <Link
                                href="/dashboard/super-admin/transactions"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Transaksi Global</span>
                              </Link>
                              <Link
                                href="/dashboard/super-admin/profile"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
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
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                                <span>Dashboard KPI</span>
                              </Link>
                              <Link
                                href="/dashboard/owner/reservations"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Manajemen Reservasi</span>
                              </Link>
                              <Link
                                href="/dashboard/owner/spaces"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span>Inventory Ruangan</span>
                              </Link>
                              <Link
                                href="/dashboard/owner/discounts"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <TicketPercent className="w-3.5 h-3.5 text-slate-400" />
                                <span>Kode Promo Diskon</span>
                              </Link>
                              <Link
                                href="/dashboard/owner/staff"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                <span>Tim Staff</span>
                              </Link>
                              <Link
                                href="/dashboard/owner/transactions"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Transaksi &amp; Finansial</span>
                              </Link>
                              <Link
                                href="/dashboard/owner/profile"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
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
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                                <span>Terminal Check-In</span>
                              </Link>
                              <Link
                                href="/dashboard/owner/transactions"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Transaksi</span>
                              </Link>
                              <Link
                                href="/dashboard/staff/profile"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
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
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />
                                <span>Tiket &amp; Jadwal Saya</span>
                              </Link>
                              <Link
                                href="/dashboard/member/transactions"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <Wallet className="w-3.5 h-3.5 text-sky-600" />
                                <span>Transaksi &amp; Invoice</span>
                              </Link>
                              <Link
                                href="/dashboard/member/spaces"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                              >
                                <Compass className="w-3.5 h-3.5 text-slate-400" />
                                <span>Katalog Ruangan</span>
                              </Link>
                              <Link
                                href="/dashboard/member/profile"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
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
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>Keluar Akun</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors px-3.5 py-1.5 rounded-full hover:bg-slate-900/5"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-full transition-all shadow-sm shadow-sky-600/25 active:scale-95"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            <div className="flex md:hidden items-center gap-1.5">
              {isAuthenticated && user ? (
                <Link
                  href={
                    currentRole === "owner"
                      ? "/dashboard/owner"
                      : currentRole === "staff"
                      ? "/dashboard/staff"
                      : currentRole === "super_admin"
                      ? "/dashboard/super-admin"
                      : "/dashboard/member"
                  }
                  className="w-7 h-7 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs"
                >
                  {(getDisplayName() || "U").charAt(0).toUpperCase()}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-bold px-3 py-1 bg-sky-600 text-white rounded-full shadow-xs"
                >
                  Masuk
                </Link>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-full text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
                aria-label="Menu navigasi"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-2 w-full max-w-lg mx-auto rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_24px_50px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/10 p-4 space-y-3 pointer-events-auto max-h-[82vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    setMobileMenuOpen(false);
                    router.push(`/spaces?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="relative flex items-center"
              >
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau jenis ruangan..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 pb-2 border-b border-slate-200/60">
                <Link
                  href="/#ruang-kerja"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 transition-colors text-center border border-slate-100"
                >
                  Lihat Ruangan
                </Link>
                <Link
                  href="/#tata-cara"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 transition-colors text-center border border-slate-100"
                >
                  Tata Cara
                </Link>
                <Link
                  href="/#tarif"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 transition-colors text-center border border-slate-100"
                >
                  Tarif
                </Link>
                <Link
                  href="/#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-2xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 transition-colors text-center border border-slate-100"
                >
                  FAQ
                </Link>
              </div>

              {isAuthenticated && user ? (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="px-3 py-2 bg-sky-50/70 rounded-2xl border border-sky-100">
                    <p className="text-xs font-bold text-slate-900">{getDisplayName()}</p>
                    <p className="text-[11px] text-sky-700 font-medium">Peran: {getRoleLabel()}</p>
                  </div>

                  <div className="space-y-1">
                    {currentRole === "super_admin" && (
                      <>
                        <Link
                          href="/dashboard/super-admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <LayoutDashboard className="w-4 h-4 text-sky-600" />
                          <span>Overview Platform</span>
                        </Link>
                        <Link
                          href="/dashboard/super-admin/owners"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <Building className="w-4 h-4 text-sky-600" />
                          <span>Mitra Space Owner</span>
                        </Link>
                        <Link
                          href="/dashboard/super-admin/commission"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <TicketPercent className="w-4 h-4 text-sky-600" />
                          <span>Komisi Platform</span>
                        </Link>
                        <Link
                          href="/dashboard/super-admin/transactions"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <ReceiptText className="w-4 h-4 text-sky-600" />
                          <span>Transaksi Global</span>
                        </Link>
                        <Link
                          href="/dashboard/super-admin/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <UserCog className="w-4 h-4 text-sky-600" />
                          <span>Pengaturan Akun</span>
                        </Link>
                      </>
                    )}

                    {currentRole === "owner" && (
                      <>
                        <Link
                          href="/dashboard/owner"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <LayoutDashboard className="w-4 h-4 text-sky-600" />
                          <span>Dashboard KPI</span>
                        </Link>
                        <Link
                          href="/dashboard/owner/reservations"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <CalendarClock className="w-4 h-4 text-sky-600" />
                          <span>Manajemen Reservasi</span>
                        </Link>
                        <Link
                          href="/dashboard/owner/spaces"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <Building className="w-4 h-4 text-sky-600" />
                          <span>Inventory Ruangan</span>
                        </Link>
                        <Link
                          href="/dashboard/owner/discounts"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <TicketPercent className="w-4 h-4 text-sky-600" />
                          <span>Kode Promo Diskon</span>
                        </Link>
                        <Link
                          href="/dashboard/owner/staff"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <UserCheck className="w-4 h-4 text-sky-600" />
                          <span>Tim Staff</span>
                        </Link>
                        <Link
                          href="/dashboard/owner/transactions"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <ReceiptText className="w-4 h-4 text-sky-600" />
                          <span>Transaksi &amp; Finansial</span>
                        </Link>
                        <Link
                          href="/dashboard/owner/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <UserCog className="w-4 h-4 text-sky-600" />
                          <span>Pengaturan Akun</span>
                        </Link>
                      </>
                    )}

                    {currentRole === "staff" && (
                      <>
                        <Link
                          href="/dashboard/staff"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <QrCode className="w-4 h-4 text-sky-600" />
                          <span>Terminal Check-In</span>
                        </Link>
                        <Link
                          href="/dashboard/staff/history"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <CalendarCheck className="w-4 h-4 text-sky-600" />
                          <span>Log Reservasi</span>
                        </Link>
                        <Link
                          href="/dashboard/staff/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <UserCog className="w-4 h-4 text-sky-600" />
                          <span>Pengaturan Akun</span>
                        </Link>
                      </>
                    )}

                    {currentRole === "member" && (
                      <>
                        <Link
                          href="/dashboard/member"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <CalendarCheck className="w-4 h-4 text-sky-600" />
                          <span>Tiket &amp; Jadwal Saya</span>
                        </Link>
                        <Link
                          href="/dashboard/member/transactions"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <Wallet className="w-4 h-4 text-sky-600" />
                          <span>Transaksi &amp; Invoice</span>
                        </Link>
                        <Link
                          href="/dashboard/member/spaces"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <Compass className="w-4 h-4 text-slate-500" />
                          <span>Katalog Ruangan</span>
                        </Link>
                        <Link
                          href="/dashboard/member/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 rounded-xl"
                        >
                          <UserCog className="w-4 h-4 text-slate-500" />
                          <span>Pengaturan Akun</span>
                        </Link>
                      </>
                    )}
                  </div>

                  <Link
                    href="/spaces"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-sm"
                  >
                    <span>Pesan Ruangan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <Link
                    href="/spaces"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-sm"
                  >
                    <span>Jelajahi Ruangan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 text-center px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Masuk</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 text-center px-4 py-2.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors"
                    >
                      <span>Daftar</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
