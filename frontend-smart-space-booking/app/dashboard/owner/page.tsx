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
import { formatRupiah } from "@/components/SpaceCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Building,
  DollarSign,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertCircle,
  Loader2,
  PieChart,
  BarChart3,
  Layers,
} from "lucide-react";

export default function OwnerOverviewPage() {
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([]);
  const [spaceDistribution, setSpaceDistribution] = useState<SpaceTypeDistributionItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, monthRes, distRes, recentRes] = await Promise.allSettled([
        getDashboardSummary(),
        getMonthlyRevenue(),
        getSpaceTypeDistribution(),
        getRecentTransactions(8),
      ]);

      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (monthRes.status === "fulfilled") setMonthlyRevenue(monthRes.value);
      if (distRes.status === "fulfilled") setSpaceDistribution(distRes.value);
      if (recentRes.status === "fulfilled") setRecentTransactions(recentRes.value);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            <span>Dashboard Space Owner & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {user?.spaceOwner?.namaCoworking || "Coworking Space Analytics"}
          </h1>
          <p className="text-xs text-slate-600">
            Ringkasan performa finansial, okupansi workstation, dan transaksi reservasi real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOverviewData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-500"}`} />
            <span>Refresh Data</span>
          </button>
          <Link
            href="/dashboard/owner/spaces"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm shadow-sky-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Ruangan</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-bold">Gagal Memuat Sebagian Data Analitik</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Compact KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pendapatan */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Pendapatan
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? "..." : formatRupiah(summary?.totalRevenue || 0)}
          </p>
          <p className="text-[11px] text-slate-500">Dari transaksi selesai</p>
        </div>

        {/* Total Reservasi */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Booking
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? "..." : summary?.totalReservations || 0}
          </p>
          <p className="text-[11px] text-slate-500">Semua riwayat pemesanan</p>
        </div>

        {/* Unit Ruangan */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Jumlah Ruangan
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? "..." : summary?.totalSpaces || 0}
          </p>
          <Link
            href="/dashboard/owner/spaces"
            className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1"
          >
            <span>Kelola Inventory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Staff Terdaftar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Staff Operasional
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? "..." : summary?.totalStaffs || 0}
          </p>
          <Link
            href="/dashboard/owner/staff"
            className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1"
          >
            <span>Kelola Tim Staff</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Grid: Space Type Distribution & Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Space Distribution */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Distribusi Tipe Ruangan
            </h3>
          </div>

          {spaceDistribution.length > 0 ? (
            <div className="space-y-3">
              {spaceDistribution.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{item.label}</span>
                    <span className="text-sky-600">{item.count} Unit ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-sky-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Pendapatan:</span>
                    <span className="font-bold text-slate-700">{formatRupiah(item.totalRevenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada data distribusi tipe ruangan.
            </div>
          )}
        </div>

        {/* Monthly Revenue Bars Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Rekap Pendapatan Bulanan ({new Date().getFullYear()})
              </h3>
            </div>
          </div>

          {monthlyRevenue.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {monthlyRevenue.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-center"
                >
                  <p className="text-[11px] font-bold uppercase text-slate-400">{m.month}</p>
                  <p className="text-xs font-black text-slate-900">{formatRupiah(m.revenue)}</p>
                  <p className="text-[10px] text-sky-600 font-semibold">{m.totalBookings} Booking</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada transaksi pendapatan bulanan pada tahun ini.
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">
            Transaksi & Reservasi Terbaru
          </h2>
          <span className="text-xs text-slate-500">Live API Data Feed</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Memuat transaksi...</p>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Kode Tiket</th>
                    <th className="py-3.5 px-4">Member</th>
                    <th className="py-3.5 px-4">Ruangan</th>
                    <th className="py-3.5 px-4">Jadwal</th>
                    <th className="py-3.5 px-4">Total Biaya</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((res) => {
                    const memberName = res.member?.namaMember || `Member #${res.memberId}`;
                    const spaceName = res.detailReservasi?.space?.namaSpace || `Space #${res.id}`;
                    const totalCost = res.detailReservasi?.totalHarga || 0;
                    const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";

                    return (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {res.qrCode}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {memberName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {spaceName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {rawDate} ({res.jamMulai})
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatRupiah(totalCost)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={res.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada riwayat transaksi reservasi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
