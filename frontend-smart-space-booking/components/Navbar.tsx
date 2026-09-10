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
  Search,
  Loader2,
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
      setSearchResults([]);
      setSearchLoading(false);
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

  const isDashboard = pathname?.startsWith("/dashboard");
  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/verify-email");

  if (!pathname || isDashboard || isAuthPage) {
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 w-full shadow-2xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link
              href="/#home"
              className="flex items-center gap-2 group focus:outline-none"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-6 h-6 rounded-md bg-[#0D5C63] flex items-center justify-center text-white shrink-0 shadow-xs">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 text-[15px] tracking-tight">
                WorkNest
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-[13px] font-normal text-slate-600">
              <Link
                href="/#ruang-kerja"
                className={`transition-colors hover:text-slate-900 ${pathname.startsWith("/#ruang-kerja") ? "text-slate-900 font-semibold" : ""}`}
              >
                Ruangan
              </Link>
              <Link
                href="/#tarif"
                className="transition-colors hover:text-slate-900"
              >
                Tarif
              </Link>
              <Link
                href="/#protocol"
                className="transition-colors hover:text-slate-900"
              >
                Tentang Kami
              </Link>

              {isAuthenticated && currentRole === "member" && (
                <Link
                  href="/dashboard/member"
                  className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 font-medium bg-cyan-50 px-2 py-0.5 rounded text-xs border border-cyan-200/70"
                >
                  <CalendarCheck className="w-3 h-3" />
                  <span>Tiket Saya</span>
                </Link>
              )}
              {isAuthenticated && currentRole === "owner" && (
                <Link
                  href="/dashboard/owner"
                  className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 font-medium bg-cyan-50 px-2 py-0.5 rounded text-xs border border-cyan-200/70"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Dashboard Owner</span>
                </Link>
              )}
              {isAuthenticated && currentRole === "staff" && (
                <Link
                  href="/dashboard/staff"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200/70"
                >
                  <QrCode className="w-3 h-3" />
                  <span>Terminal</span>
                </Link>
              )}
              {isAuthenticated && currentRole === "super_admin" && (
                <Link
                  href="/dashboard/super-admin"
                  className="inline-flex items-center gap-1 text-slate-800 hover:text-slate-950 font-medium bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Overview</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
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
                  setSearchDropdownOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim() || searchResults.length > 0) {
                    setSearchDropdownOpen(true);
                  }
                }}
                placeholder="Cari ruangan..."
                className="w-60 lg:w-72 pl-9 pr-7 py-2 rounded-[10px] border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white focus:border-[#006370] focus:ring-2 focus:ring-[#006370]/15 transition-all text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchDropdownOpen(false);
                  }}
                  className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>

            {searchDropdownOpen && searchQuery.trim() && (
              <div className="absolute left-0 top-full mt-1.5 w-80 lg:w-96 bg-white rounded-[10px] border border-slate-200 shadow-xl p-2 z-50 space-y-1">
                {searchLoading ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#006370]" />
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
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
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
                          <p className="font-bold text-slate-900 text-xs truncate group-hover:text-[#006370]">
                            {space.namaSpace}
                          </p>
                          <p className="text-[11px] text-slate-400 capitalize">
                            {space.tipe?.replace("_", " ")} &bull; {space.kapasitas} Orang
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#006370] shrink-0">
                          Rp {(space.hargaPerJam || 0).toLocaleString("id-ID")}
                        </span>
                      </Link>
                    ))}
                    <div className="pt-1 border-t border-slate-100 mt-1">
                      <Link
                        href={`/spaces?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setSearchDropdownOpen(false)}
                        className="block text-center py-1.5 text-xs font-bold text-[#006370] hover:underline"
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
              <div className="flex items-center gap-3">
                <Link
                  href="/spaces"
                  className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-white bg-[#006370] hover:bg-[#004e58] rounded-[10px] transition-colors shadow-2xs"
                >
                  Pesan Ruangan
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#0D5C63] text-white font-bold text-xs flex items-center justify-center shadow-xs">
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
                            href="/dashboard/member/spaces"
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
            </div>
          ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors px-1"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-white bg-[#006370] hover:bg-[#004e58] rounded-[10px] transition-colors shadow-2xs"
                >
                  Daftar
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
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 pb-2 border-b border-slate-100">
            <Link
              href="/spaces"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              Ruangan
            </Link>
            <Link
              href="/#instant-rates"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              Tarif
            </Link>
            <Link
              href="/register?role=owner"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              Pemilik Ruangan
            </Link>
            <Link
              href="/#protocol"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              Tentang Kami
            </Link>
          </div>

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
