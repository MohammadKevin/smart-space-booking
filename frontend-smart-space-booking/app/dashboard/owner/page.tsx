"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  getDashboardSummary,
  getMonthlyRevenue,
  getRecentTransactions,
  getSpaces,
  DashboardSummary,
  MonthlyRevenueItem,
  Reservation,
  Space,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import {
  CalendarCheck,
  Building2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Plus,
  DoorOpen,
  CreditCard,
  Building,
  Download,
  Users,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function OwnerOverviewPage() {
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Reservation[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (yearToFetch = selectedYear) => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, revData, transData, spacesData] = await Promise.all([
        getDashboardSummary().catch(() => ({
          totalRevenue: 0,
          totalNetRevenue: 0,
          totalGrossRevenue: 0,
          totalPlatformCommission: 0,
          commissionRate: 10,
          totalReservations: 0,
          totalSpaces: 0,
          totalStaffs: 0,
        })),
        getMonthlyRevenue(yearToFetch).catch(() => []),
        getRecentTransactions(10).catch(() => []),
        getSpaces().catch(() => []),
      ]);

      setSummary(sumData);
      setMonthlyRevenue(Array.isArray(revData) ? revData : []);
      setRecentTransactions(Array.isArray(transData) ? transData : []);
      setSpaces(Array.isArray(spacesData) ? spacesData : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchAnalytics(selectedYear);
  }, [fetchAnalytics, selectedYear]);

  const coworkingName = user?.spaceOwner?.namaCoworking || "WorkNest Hub";
  const totalNetRevenue = summary?.totalNetRevenue ?? summary?.totalRevenue ?? 0;
  const totalGrossRevenue = summary?.totalGrossRevenue ?? totalNetRevenue;
  const totalCommission = summary?.totalPlatformCommission ?? Math.max(0, totalGrossRevenue - totalNetRevenue);
  const commissionRate = summary?.commissionRate ?? 10;
  const totalRoomsCount = spaces.length || summary?.totalSpaces || 0;

  const activeBookings = useMemo(() => {
    return recentTransactions.filter(
      (t) => t.status?.toLowerCase() === "aktif" || t.status?.toLowerCase() === "disetujui"
    );
  }, [recentTransactions]);

  const occupiedCount = Math.min(activeBookings.length, totalRoomsCount);
  const occupancyPercent = totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0;
  const availableRoomsCount = Math.max(0, totalRoomsCount - occupiedCount);

  const maxMonthlyRevenue = useMemo(() => {
    if (!monthlyRevenue.length) return 1;
    return Math.max(...monthlyRevenue.map((r) => r.revenue), 1);
  }, [monthlyRevenue]);

  const hasRevenueData = useMemo(() => {
    return monthlyRevenue.length > 0 && monthlyRevenue.some((m) => m.revenue > 0);
  }, [monthlyRevenue]);

  const handleExportReport = () => {
    const csvContent = [
      ["ID Transaksi", "Ruangan", "Pengguna/Member", "Nominal Bruto", "Status", "Tanggal"].join(","),
      ...recentTransactions.map((t) =>
        [
          `TRX-${t.id}`,
          `"${t.detailReservasi?.space?.namaSpace || "Ruangan"}"`,
          `"${t.member?.namaMember || "Member"}"`,
          t.detailReservasi?.totalHarga || 0,
          t.status,
          t.tanggalReservasi ? t.tanggalReservasi.split("T")[0] : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `WorkNest-Owner-Report-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-700 mb-1">
            <span>WORKSPACE OWNER DASHBOARD</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              {coworkingName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Operasional Venue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Pantau metrik pendapatan bersih mitra (setelah dipotong komisi super admin), tingkat okupansi real-time, dan status ruangan kerja.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedYear)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-sky-600" : ""}`}
            />
            <span>Perbarui</span>
          </button>
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <Link
            href="/dashboard/owner/spaces/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-sky-600/25 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Ruangan</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pendapatan Bersih */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              PENDAPATAN BERSIH MITRA
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">
              {loading ? "..." : formatRupiah(totalNetRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Net (Sudah Dipotong Komisi {commissionRate}%)
              </span>
            </div>
            {totalGrossRevenue > 0 && totalGrossRevenue !== totalNetRevenue && (
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Bruto: {formatRupiah(totalGrossRevenue)} &bull; Komisi Super Admin: -{formatRupiah(totalCommission)}
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Okupansi Real-Time */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              OKUPANSI REAL-TIME
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : `${occupiedCount} / ${totalRoomsCount}`}{" "}
              <span className="text-xs font-normal text-slate-500 font-sans">Unit</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {occupancyPercent}% Terpakai
              </span>
              <span className="text-[11px] text-slate-500">
                {availableRoomsCount} siap sewa
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Reservasi */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL RESERVASI MASUK
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : summary?.totalReservations || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Seluruh pemesanan ruang kerja oleh member
            </p>
          </div>
        </div>

        {/* Card 4: Ruangan & Staf */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              INVENTARIS &amp; TIM
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : totalRoomsCount}{" "}
              <span className="text-xs font-normal text-slate-500 font-sans">Ruangan</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {summary?.totalStaffs || 0} Staf Frontdesk
              </span>
              <span className="text-[11px] text-slate-500">
                Aktif bertugas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Tren Pendapatan Bersih Bulanan ({selectedYear})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik pendapatan bersih mitra (sudah dipotong komisi platform super admin {commissionRate}%) per bulan.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
              <span>Pendapatan Bersih</span>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasRevenueData ? (
          <div className="space-y-3 pt-2">
            {/* Horizontal scrollable wrapper for small mobile screens to ensure perfect readability */}
            <div className="overflow-x-auto pb-2 -mx-2 px-2">
              <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-56 min-w-[560px] sm:min-w-0 items-end border-b border-slate-100 pb-3">
                {monthlyRevenue.map((item) => {
                  const heightPercent = maxMonthlyRevenue > 0
                    ? Math.max(8, (item.revenue / maxMonthlyRevenue) * 100)
                    : 8;

                  return (
                    <div
                      key={item.monthNumber || item.month}
                      className="flex flex-col items-center justify-end h-full gap-1 group relative"
                    >
                      {/* Tooltip Hover */}
                      <div className="absolute -top-16 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] font-mono py-1.5 px-2.5 rounded-xl shadow-xl z-30 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                        <span className="font-bold text-sky-300">{item.month}</span>
                        <span className="font-semibold text-emerald-400">Net: {formatRupiah(item.revenue)}</span>
                        {item.grossRevenue ? (
                          <span className="text-slate-300 text-[9px]">Bruto: {formatRupiah(item.grossRevenue)}</span>
                        ) : null}
                        <span className="text-slate-400 text-[9px]">Booking: {item.totalBookings || 0} Sesi</span>
                      </div>

                      <div className="w-full max-w-[32px] flex items-end justify-center h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            item.revenue > 0
                              ? "bg-emerald-500 group-hover:bg-emerald-400 shadow-xs shadow-emerald-500/20"
                              : "bg-slate-100"
                          }`}
                        />
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 mt-1">
                        {item.month.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 pt-1 gap-1">
              <span>* Nilai nominal telah dipotong komisi super admin sebesar {commissionRate}%</span>
              <span className="font-mono text-slate-600 font-bold">
                Total Net {selectedYear}: {formatRupiah(monthlyRevenue.reduce((a, b) => a + b.revenue, 0))}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl">
            Belum ada data pendapatan bulanan untuk tahun {selectedYear}.
          </div>
        )}
      </div>

      {/* Room Status Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Status Langsung Inventaris Ruangan
            </h2>
            <p className="text-xs text-slate-500">
              Katalog unit ruang kerja, tarif per jam, dan kode akses reservasi aktif venue Anda.
            </p>
          </div>

          <Link
            href="/dashboard/owner/spaces"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
          >
            <span>Buka Inventaris Lengkap ({spaces.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">NAMA RUANGAN</th>
                <th className="py-3 px-4 font-bold">KAPASITAS</th>
                <th className="py-3 px-4 font-bold">TARIF / JAM</th>
                <th className="py-3 px-4 font-bold">STATUS SESI</th>
                <th className="py-3 px-4 font-bold">KODE OTP AKSES</th>
                <th className="py-3 px-4 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {spaces.length > 0 ? (
                spaces.slice(0, 6).map((sp) => {
                  const activeRes = activeBookings.find(
                    (b) => b.detailReservasi?.spaceId === sp.id
                  );
                  const isOccupied = !!activeRes;
                  const otpCode = activeRes
                    ? `${activeRes.qrCode.slice(0, 3)}-${activeRes.qrCode.slice(-3)}`
                    : "SIAP-SEWA";

                  return (
                    <tr key={sp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100 overflow-hidden">
                            {sp.foto ? (
                              <img src={sp.foto} alt={sp.namaSpace} className="w-full h-full object-cover" />
                            ) : (
                              <Building className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{sp.namaSpace}</p>
                            <p className="text-[10px] text-slate-400 font-normal uppercase font-mono">
                              {sp.tipe?.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {sp.kapasitas} Kursi
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatRupiah(sp.hargaPerJam)}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">/ jam</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOccupied ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Terisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-[10px] border border-sky-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            Kosong
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {otpCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/spaces/${sp.id}`}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    Belum ada ruangan yang terdaftar di venue ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Visible only on mobile) */}
        <div className="md:hidden space-y-3">
          {spaces.length > 0 ? (
            spaces.slice(0, 6).map((sp) => {
              const activeRes = activeBookings.find(
                (b) => b.detailReservasi?.spaceId === sp.id
              );
              const isOccupied = !!activeRes;
              const otpCode = activeRes
                ? `${activeRes.qrCode.slice(0, 3)}-${activeRes.qrCode.slice(-3)}`
                : "SIAP-SEWA";

              return (
                <div
                  key={sp.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100 overflow-hidden">
                        {sp.foto ? (
                          <img src={sp.foto} alt={sp.namaSpace} className="w-full h-full object-cover" />
                        ) : (
                          <Building className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{sp.namaSpace}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-mono">
                          {sp.tipe?.replace(/_/g, " ")} &bull; {sp.kapasitas} Kursi
                        </p>
                      </div>
                    </div>

                    <div>
                      {isOccupied ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                          Terisi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-[10px] border border-sky-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          Kosong
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(sp.hargaPerJam)}
                      </span>
                      <span className="text-[10px] text-slate-400"> / jam</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                        {otpCode}
                      </span>
                      <Link
                        href={`/spaces/${sp.id}`}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-[11px] shadow-2xs"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              Belum ada ruangan yang terdaftar di venue ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
