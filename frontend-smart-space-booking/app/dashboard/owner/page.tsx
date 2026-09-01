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
      setMonthlyRevenue(revData);
      setDistribution(distData);
      setRecentTransactions(transData);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Portal Pengelola Ruangan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ringkasan Operasional & Pendapatan
          </h1>
          <p className="text-xs text-slate-500">
            Pemantauan performa ruangan, utilisasi workstation, dan rekonsiliasi transaksi {coworkingName}.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold self-start md:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-400"}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Gagal Memuat Analitik</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Total Pendapatan</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {loading ? "..." : formatRupiah(summary?.totalRevenue || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Akumulasi seluruh transaksi terverifikasi</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Total Reservasi</span>
            <CalendarCheck className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {loading ? "..." : summary?.totalReservations || 0}
          </p>
          <p className="text-[11px] text-slate-400">Total pemesanan masuk</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Ruangan Aktif</span>
            <Building className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {loading ? "..." : summary?.totalSpaces || 0}
          </p>
          <p className="text-[11px] text-slate-400">Inventaris ruangan terdaftar</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Akun Staff</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {loading ? "..." : summary?.totalStaffs || 0}
          </p>
          <p className="text-[11px] text-slate-400">Petugas operasional check-in</p>
        </div>
      </div>

      {/* Distribution & Performance Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Space Type Distribution */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Distribusi Tipe Ruangan
            </h2>
            <p className="text-xs text-slate-500">
              Persentase dan jumlah unit berdasarkan kategori workstation.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            </div>
          ) : distribution.length > 0 ? (
            <div className="space-y-4">
              {distribution.map((d, idx) => {
                const typeLabel =
                  d.tipe === "desk"
                    ? "Hot Desk / Workstation"
                    : d.tipe === "meeting_room"
                    ? "Meeting Room"
                    : "Private Office";

                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700">{typeLabel}</span>
                      <span className="font-mono text-slate-900">
                        {d.count} Unit ({d.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full"
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada data distribusi tipe ruangan.
            </div>
          )}
        </div>

        {/* Right: Monthly Revenue Summary */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Laporan Pendapatan Bulanan
              </h2>
              <p className="text-xs text-slate-500">
                Arus kas operasional yang tercatat di sistem.
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            </div>
          ) : monthlyRevenue.length > 0 ? (
            <div className="space-y-2.5">
              {monthlyRevenue.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-700">{m.month}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(m.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada transaksi pendapatan bulanan.
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-base font-bold text-slate-900">
            Transaksi Reservasi Terbaru
          </h2>
          <Link
            href="/dashboard/owner/spaces"
            className="text-xs font-semibold text-sky-600 hover:underline"
          >
            Kelola Ruangan
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Memuat transaksi...</p>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Ruangan</th>
                    <th className="py-3 px-4">Tanggal & Jam</th>
                    <th className="py-3 px-4">Total Biaya</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((t) => {
                    const rawDate = t.tanggalReservasi ? t.tanggalReservasi.split("T")[0] : "-";
                    const spaceName = t.detailReservasi?.space?.namaSpace || `Space #${t.id}`;
                    const memberName = t.member?.namaMember || `Member #${t.memberId}`;
                    const cost = t.detailReservasi?.totalHarga || 0;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {memberName}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{spaceName}</td>
                        <td className="py-3 px-4 text-slate-600">{rawDate}, {t.jamMulai} WIB</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {formatRupiah(cost)}
                        </td>
                        <td className="py-3 px-4">
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
