"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  getDashboardSummary,
  getMonthlyRevenue,
  getSpaceTypeDistribution,
  getRecentTransactions,
  DashboardSummary,
  MonthlyRevenueItem,
  SpaceTypeDistributionItem,
  Reservation,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah } from "@/components/SpaceCard";
import {
  LayoutDashboard,
  DollarSign,
  CalendarCheck,
  Building,
  UserCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  PieChart,
  Plus,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Percent,
  CreditCard,
  Layers,
  Users,
  Search,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Calendar,
} from "lucide-react";

export default function OwnerOverviewPage() {
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([]);
  const [distribution, setDistribution] = useState<SpaceTypeDistributionItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Reservation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, revData, distData, transData] = await Promise.all([
        getDashboardSummary().catch(() => ({
          totalRevenue: 0,
          totalReservations: 0,
          totalSpaces: 0,
          totalStaffs: 0,
        })),
        getMonthlyRevenue().catch(() => []),
        getSpaceTypeDistribution().catch(() => []),
        getRecentTransactions().catch(() => []),
      ]);

      setSummary(sumData);
      setMonthlyRevenue(Array.isArray(revData) ? revData : []);
      setDistribution(Array.isArray(distData) ? distData : []);
      setRecentTransactions(Array.isArray(transData) ? transData : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const coworkingName = user?.spaceOwner?.namaCoworking || "Coworking Space";
  const ownerName = user?.spaceOwner?.namaPemilik || user?.email || "Pengelola";
  const coworkingAddress = user?.spaceOwner?.alamat || "Lokasi Coworking";

  // Dynamic Greeting based on WIB hour
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 11) return "Selamat Pagi";
    if (hours >= 11 && hours < 15) return "Selamat Siang";
    if (hours >= 15 && hours < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  // Defensive array access
  const safeMonthlyRevenue = Array.isArray(monthlyRevenue) ? monthlyRevenue : [];
  const safeDistribution = Array.isArray(distribution) ? distribution : [];
  const safeTransactions = Array.isArray(recentTransactions) ? recentTransactions : [];

  // Calculate highest revenue for bar chart scaling
  const maxRevenue = Math.max(
    ...safeMonthlyRevenue.map((m) => Number(m?.revenue) || 0),
    100000
  );

  // Best revenue month
  const bestMonth = useMemo(() => {
    if (!safeMonthlyRevenue.length) return null;
    return safeMonthlyRevenue.reduce(
      (max, m) => (m.revenue > (max?.revenue || 0) ? m : max),
      safeMonthlyRevenue[0]
    );
  }, [safeMonthlyRevenue]);

  // Filtered transactions for quick search
  const filteredTransactions = useMemo(() => {
    return safeTransactions.filter((t) => {
      const memberName = t.member?.namaMember || "";
      const spaceName = t.detailReservasi?.space?.namaSpace || "";
      const invoice = t.qrCode || "";
      const matchesSearch =
        memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || t.status?.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [safeTransactions, searchQuery, filterStatus]);

  return (
    <div className="space-y-7 pb-10">
      {/* 1. Header Banner & Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 p-6 sm:p-8 text-white shadow-xl shadow-cyan-950/20 border border-slate-700/50">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-cyan-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate">{coworkingName}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/70 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-300" />
                <span className="truncate max-w-[180px]">{coworkingAddress}</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {getGreeting()}, <span className="text-cyan-300">{ownerName}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Kelola inventaris ruangan kerja, pantau booking member secara real-time, dan monitor performa finansial coworking space Anda.
              </p>
            </div>
          </div>

          {/* Quick Header CTA Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-300" : "text-white"}`} />
              <span>Segarkan</span>
            </button>

            <Link
              href="/dashboard/owner/spaces"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ruangan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Gagal Memuat Analitik Terkini</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* 2. Primary KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs hover:shadow-md space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Omzet
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : formatRupiah(summary?.totalRevenue || 0)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold mt-2 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Akumulasi Transaksi</span>
              </span>
              <span className="font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                Lunas
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Reservations */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs hover:shadow-md space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Reservasi
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalReservations || 0}
            </p>
            <div className="flex items-center justify-between text-[11px] text-cyan-800 font-semibold mt-2 pt-2 border-t border-slate-100">
              <span className="text-slate-500">Booking Masuk</span>
              <Link
                href="/dashboard/owner/reservations"
                className="inline-flex items-center gap-0.5 text-cyan-700 hover:text-cyan-800 hover:underline text-[11px]"
              >
                <span>Kelola</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 3: Active Spaces */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs hover:shadow-md space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ruangan & Desk
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalSpaces || 0}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mt-2 pt-2 border-t border-slate-100">
              <span>Inventaris Aktif</span>
              <Link
                href="/dashboard/owner/spaces"
                className="inline-flex items-center gap-0.5 text-sky-700 hover:text-sky-800 hover:underline text-[11px]"
              >
                <span>Katalog</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 4: Staff Accounts */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs hover:shadow-md space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tim Resepsionis
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalStaffs || 0}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mt-2 pt-2 border-t border-slate-100">
              <span>Petugas Scanner QR</span>
              <Link
                href="/dashboard/owner/staff"
                className="inline-flex items-center gap-0.5 text-indigo-700 hover:text-indigo-800 hover:underline text-[11px]"
              >
                <span>Staff</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Hub Shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Link
          href="/dashboard/owner/spaces"
          className="p-4 bg-white hover:bg-cyan-50/40 rounded-xl border border-slate-200 hover:border-cyan-300 transition-all shadow-2xs group flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors truncate">
              Katalog Ruangan
            </p>
            <p className="text-[11px] text-slate-400 truncate">Tambah & edit space</p>
          </div>
        </Link>

        <Link
          href="/dashboard/owner/reservations"
          className="p-4 bg-white hover:bg-cyan-50/40 rounded-xl border border-slate-200 hover:border-cyan-300 transition-all shadow-2xs group flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
              Jadwal Reservasi
            </p>
            <p className="text-[11px] text-slate-400 truncate">Persetujuan booking</p>
          </div>
        </Link>

        <Link
          href="/dashboard/owner/discounts"
          className="p-4 bg-white hover:bg-cyan-50/40 rounded-xl border border-slate-200 hover:border-cyan-300 transition-all shadow-2xs group flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Percent className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
              Promo Diskon
            </p>
            <p className="text-[11px] text-slate-400 truncate">Kupon & cashback</p>
          </div>
        </Link>

        <Link
          href="/dashboard/owner/transactions"
          className="p-4 bg-white hover:bg-cyan-50/40 rounded-xl border border-slate-200 hover:border-cyan-300 transition-all shadow-2xs group flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
              Laporan Keuangan
            </p>
            <p className="text-[11px] text-slate-400 truncate">Riwayat pembayaran</p>
          </div>
        </Link>
      </div>

      {/* 4. Analytics Visual Charts (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Revenue Visual Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Performa Pendapatan Bulanan
                </h2>
                {bestMonth && Number(bestMonth.revenue) > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Puncak: {bestMonth.month}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Akumulasi omzet sewa ruangan berdasarkan transaksi lunas.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-800 font-bold bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-200 self-start sm:self-auto">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
              <span>Real-time Live</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 text-cyan-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-medium">Memuat grafik omzet...</p>
            </div>
          ) : safeMonthlyRevenue.length > 0 ? (
            <div className="space-y-4 pt-1">
              <div className="space-y-3.5">
                {safeMonthlyRevenue.map((m, idx) => {
                  const revVal = Number(m.revenue) || 0;
                  const percent = Math.min(100, Math.round((revVal / maxRevenue) * 100));
                  const isTop = bestMonth && bestMonth.month === m.month && revVal > 0;

                  return (
                    <div key={idx} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 group-hover:text-cyan-700 transition-colors">
                            {m.month}
                          </span>
                          {m.totalBookings !== undefined && m.totalBookings > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({m.totalBookings} booking)
                            </span>
                          )}
                        </div>
                        <span className={`font-mono font-bold ${isTop ? "text-emerald-600" : "text-slate-900"}`}>
                          {formatRupiah(revVal)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isTop
                              ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                              : "bg-gradient-to-r from-cyan-600 to-sky-500"
                          }`}
                          style={{ width: `${Math.max(6, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                <span>Skala Grafik: 0 s/d {formatRupiah(maxRevenue)}</span>
                <span className="text-cyan-700 font-semibold">Tersinkronisasi otomatis</span>
              </div>
            </div>
          ) : (
            <div className="py-14 text-center text-xs text-slate-400 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium text-slate-600">Belum Ada Transaksi Pendapatan</p>
              <p className="text-[11px]">Pendapatan akan tercatat otomatis saat reservasi member berstatus disetujui / lunas.</p>
            </div>
          )}
        </div>

        {/* Right: Space Category Composition */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Distribusi Kategori Ruangan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rasio ketersediaan tipe workstation di lokasi.
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
              <PieChart className="w-4 h-4" />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 text-cyan-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-medium">Memuat distribusi...</p>
            </div>
          ) : safeDistribution.length > 0 ? (
            <div className="space-y-3.5 pt-1">
              {safeDistribution.map((d, idx) => {
                const isDesk = d.tipe === "desk";
                const isMeeting = d.tipe === "meeting_room";
                const typeLabel = isDesk
                  ? "Hot Desk & Dedicated Workstation"
                  : isMeeting
                  ? "Meeting Room & Conference"
                  : "Private Office Suite";

                const badgeBg = isDesk
                  ? "bg-cyan-50 border-cyan-200 text-cyan-800"
                  : isMeeting
                  ? "bg-sky-50 border-sky-200 text-sky-800"
                  : "bg-blue-50 border-blue-200 text-blue-800";

                const barGradient = isDesk
                  ? "from-cyan-500 to-teal-500"
                  : isMeeting
                  ? "from-sky-500 to-cyan-600"
                  : "from-blue-600 to-indigo-600";

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2 hover:border-cyan-300 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{typeLabel}</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${badgeBg}`}>
                        {d.count} Unit ({d.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(5, d.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <Link
                  href="/dashboard/owner/spaces"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tipe Ruangan Baru</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-14 text-center text-xs text-slate-400 space-y-2">
              <Building className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium text-slate-600">Belum Ada Inventaris Ruangan</p>
              <Link
                href="/dashboard/owner/spaces"
                className="inline-flex items-center gap-1 text-cyan-600 hover:underline font-bold text-xs"
              >
                <span>Daftarkan Ruangan Pertama</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Booking & Reservation Activity */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Aktivitas Reservasi Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Pantau jadwal sewa masuk dan status pemesanan tiket pengunjung secara langsung.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/owner/reservations"
              className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-800 hover:underline"
            >
              <span>Lihat Semua Reservasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama member, nama ruangan, atau kode tiket QR..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Persetujuan</option>
              <option value="disetujui">Disetujui</option>
              <option value="aktif">Aktif Digunakan</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-14 text-center">
              <Loader2 className="w-7 h-7 text-cyan-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2 font-medium">Memuat data aktivitas...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Member Pemesan</th>
                    <th className="py-3.5 px-4">Ruangan Kerja</th>
                    <th className="py-3.5 px-4">Jadwal Penggunaan</th>
                    <th className="py-3.5 px-4">Total Biaya</th>
                    <th className="py-3.5 px-4">Status Booking</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => {
                    const rawDate = t.tanggalReservasi ? t.tanggalReservasi.split("T")[0] : "-";
                    const spaceName = t.detailReservasi?.space?.namaSpace || `Space #${t.id}`;
                    const memberName = t.member?.namaMember || `Member #${t.memberId}`;
                    const memberInstansi = t.member?.instansi || "Umum";
                    const cost = t.detailReservasi?.totalHarga || 0;
                    const initialChar = memberName.charAt(0).toUpperCase() || "M";

                    return (
                      <tr key={t.id} className="hover:bg-cyan-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {initialChar}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{memberName}</p>
                              <p className="text-[11px] text-slate-400">{memberInstansi}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{spaceName}</p>
                          <span className="font-mono text-[10px] text-cyan-700">
                            #{t.qrCode || `QR-${t.id}`}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="space-y-0.5">
                            <p className="font-medium flex items-center gap-1.5 text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{rawDate}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-600" />
                              <span>{t.jamMulai} WIB ({t.durasiJam || 1} Jam)</span>
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {formatRupiah(cost)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={t.status} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href="/dashboard/owner/reservations"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 text-xs font-semibold transition-all"
                          >
                            <span>Rincian</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium text-slate-700">Tidak ada data transaksi yang sesuai</p>
              <p className="text-[11px] text-slate-400">
                {searchQuery || filterStatus !== "all"
                  ? "Coba sesuaikan kata kunci pencarian atau filter status."
                  : "Belum ada pesanan reservasi yang masuk ke coworking space Anda."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
