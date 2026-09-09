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
          totalReservations: 0,
          totalSpaces: 0,
          totalStaffs: 0,
        })),
        getMonthlyRevenue(yearToFetch).catch(() => []),
        getRecentTransactions(8).catch(() => []),
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
  const totalGrossRevenue = summary?.totalRevenue || 0;
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
      ["Transaction ID", "Space", "Member", "Amount", "Status", "Date"].join(","),
      ...recentTransactions.map((t) =>
        [
          `TRX-${t.id}`,
          `"${t.detailReservasi?.space?.namaSpace || "Space"}"`,
          `"${t.detailReservasi?.space?.owner?.namaCoworking || "Member"}"`,
          t.detailReservasi?.totalHarga || 0,
          t.status,
          t.tanggalReservasi || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `WorkNest-Operations-Report-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>WORKSPACE OWNER</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              {coworkingName}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Ringkasan Operasional Venue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Pantau metrik pendapatan sewa, tingkat okupansi real-time, dan status langsung ruangan kerja Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedYear)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`}
            />
            <span>Perbarui</span>
          </button>
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <Link
            href="/dashboard/owner/spaces/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Ruangan</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL PENDAPATAN
            </span>
            <div className="w-8 h-8 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <CreditCard className="w-4 h-4 text-[#006370]" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : formatRupiah(totalGrossRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Akumulasi bruto seluruh reservasi lunas
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              OKUPANSI REAL-TIME
            </span>
            <div className="w-8 h-8 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <DoorOpen className="w-4 h-4 text-[#006370]" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : `${occupiedCount} / ${totalRoomsCount}`}{" "}
              <span className="text-xs font-normal text-slate-500 font-sans">Unit</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#E6F4F2] text-[#006370] border border-[#BCE3DE]">
                {occupancyPercent}% Terpakai
              </span>
              <span className="text-[11px] text-slate-500">
                {availableRoomsCount} siap sewa
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL RESERVASI MASUK
            </span>
            <div className="w-8 h-8 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <CalendarCheck className="w-4 h-4 text-[#006370]" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : summary?.totalReservations || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pemesanan ruang kerja oleh member
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              INVENTARIS RUANGAN
            </span>
            <div className="w-8 h-8 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <Building2 className="w-4 h-4 text-[#006370]" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : totalRoomsCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {summary?.totalStaffs || 0} Staf
              </span>
              <span className="text-[11px] text-slate-500">
                Aktif terdaftar
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Tren Pendapatan Bulanan ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500">
              Grafik pendapatan kotor dan frekuensi pemesanan ruangan per bulan dari database.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#006370]" />
                <span className="text-slate-600">Pendapatan Kotor</span>
              </div>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xs text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
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
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 h-52 items-end border-b border-slate-100 pb-3">
              {monthlyRevenue.map((item) => {
                const heightPercent = maxMonthlyRevenue > 0 ? Math.max(8, (item.revenue / maxMonthlyRevenue) * 100) : 8;

                return (
                  <div
                    key={item.monthNumber || item.month}
                    className="flex flex-col items-center justify-end h-full gap-1 group relative"
                  >
                    <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-xs shadow-lg z-20 whitespace-nowrap">
                      <span>{item.month}</span>
                      <span>Pendapatan: {formatRupiah(item.revenue)}</span>
                      <span>Booking: {item.totalBookings || 0} Sesi</span>
                    </div>

                    <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-[#006370] rounded-t-xs hover:opacity-90 transition-all"
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
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xs">
            Belum ada data pendapatan bulanan untuk tahun {selectedYear}.
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Status Langsung Inventaris Ruangan
            </h2>
            <p className="text-xs text-slate-500">
              Katalog unit ruang kerja, tarif per jam, dan kode akses reservasi aktif
            </p>
          </div>

          <Link
            href="/dashboard/owner/spaces"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006370] hover:underline"
          >
            <span>Buka Inventaris Lengkap ({spaces.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
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
                    <tr key={sp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center shrink-0 border border-[#BCE3DE]">
                            <Building className="w-4 h-4" />
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
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-cyan-50 text-cyan-800 font-semibold text-[10px] border border-cyan-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
                            Terisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Kosong
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200">
                          {otpCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/spaces/${sp.id}`}
                          className="px-2.5 py-1 rounded-xs border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
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
      </div>
    </div>
  );
}
