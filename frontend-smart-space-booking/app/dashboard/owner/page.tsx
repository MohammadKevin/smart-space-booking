"use client";

import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";

export default function OwnerOverviewPage() {
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([]);
  const [distribution, setDistribution] = useState<SpaceTypeDistributionItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Reservation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const coworkingName = user?.spaceOwner?.namaCoworking || "Coworking Hub";

  // Defensive array access
  const safeMonthlyRevenue = Array.isArray(monthlyRevenue) ? monthlyRevenue : [];
  const safeDistribution = Array.isArray(distribution) ? distribution : [];
  const safeTransactions = Array.isArray(recentTransactions) ? recentTransactions : [];

  // Calculate highest revenue for bar chart scaling
  const maxRevenue = Math.max(
    ...safeMonthlyRevenue.map((m) => Number(m?.revenue) || 0),
    100000
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Sparkles className="w-3 h-3 text-cyan-600" />
            <span>Dashboard Pengelola • {coworkingName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Operasional & Pendapatan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Pantau arus kas reservasi, performa utilisasi workstation, inventaris ruangan, dan aktivitas tim staff secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-cyan-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan Data</span>
          </button>

          <Link
            href="/dashboard/owner/spaces"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Ruangan</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Gagal Memuat Analitik</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pendapatan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : formatRupiah(summary?.totalRevenue || 0)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>Akumulasi transaksi selesai</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Reservations */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Reservasi</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalReservations || 0}
            </p>
            <p className="text-[11px] text-cyan-700 font-semibold mt-1">
              Booking masuk dari member
            </p>
          </div>
        </div>

        {/* Metric 3: Active Spaces */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ruangan Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalSpaces || 0}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Unit workstation & room
            </p>
          </div>
        </div>

        {/* Metric 4: Staff Accounts */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Petugas Staff</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalStaffs || 0}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Scanner check-in resepsionis
            </p>
          </div>
        </div>
      </div>

      {/* Distribution & Performance Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Revenue Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Visualisasi Omzet Bulanan
              </h2>
              <p className="text-xs text-slate-500">
                Perkembangan pendapatan sewa ruang kerja per periode.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-cyan-700 font-bold bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Grafik Live</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
            </div>
          ) : safeMonthlyRevenue.length > 0 ? (
            <div className="space-y-4 pt-2">
              {/* Visual Horizontal Bar Chart */}
              <div className="space-y-3">
                {safeMonthlyRevenue.map((m, idx) => {
                  const percent = Math.min(100, Math.round(((m.revenue || 0) / maxRevenue) * 100));
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{m.month}</span>
                        <span className="font-mono text-slate-900 font-bold">
                          {formatRupiah(m.revenue || 0)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-600 to-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(8, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada transaksi pendapatan bulanan yang tercatat.
            </div>
          )}
        </div>

        {/* Right: Space Type Distribution */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Distribusi Inventaris Ruang
              </h2>
              <p className="text-xs text-slate-500">
                Komposisi kategori ruangan yang tersedia.
              </p>
            </div>
            <PieChart className="w-4 h-4 text-cyan-600" />
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
            </div>
          ) : safeDistribution.length > 0 ? (
            <div className="space-y-4 pt-1">
              {safeDistribution.map((d, idx) => {
                const typeLabel =
                  d.tipe === "desk"
                    ? "Hot Desk & Workstation"
                    : d.tipe === "meeting_room"
                    ? "Meeting Room & Soundproof"
                    : "Private Office";

                const barColor =
                  d.tipe === "desk"
                    ? "bg-cyan-600"
                    : d.tipe === "meeting_room"
                    ? "bg-sky-500"
                    : "bg-blue-600";

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800">{typeLabel}</span>
                      <span className="font-mono text-cyan-700">
                        {d.count} Unit ({d.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all`}
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada data distribusi ruangan.
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Transaksi Reservasi Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Aktivitas pemesanan masuk yang baru saja diverifikasi di sistem.
            </p>
          </div>
          <Link
            href="/dashboard/owner/spaces"
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            <span>Kelola Inventaris Ruangan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Memuat transaksi...</p>
            </div>
          ) : safeTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Ruangan</th>
                    <th className="py-3 px-4">Jadwal Reservasi</th>
                    <th className="py-3 px-4">Total Biaya</th>
                    <th className="py-3 px-4">Status Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeTransactions.map((t) => {
                    const rawDate = t.tanggalReservasi ? t.tanggalReservasi.split("T")[0] : "-";
                    const spaceName = t.detailReservasi?.space?.namaSpace || `Space #${t.id}`;
                    const memberName = t.member?.namaMember || `Member #${t.memberId}`;
                    const cost = t.detailReservasi?.totalHarga || 0;

                    return (
                      <tr key={t.id} className="hover:bg-cyan-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <span>{memberName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{spaceName}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            <span>{rawDate}, {t.jamMulai} WIB</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {formatRupiah(cost)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Belum ada transaksi pemesanan terbaru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

