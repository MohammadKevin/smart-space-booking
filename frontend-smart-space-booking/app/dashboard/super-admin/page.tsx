"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  getSuperAdminOverview,
  getSuperAdminMonthlyRevenue,
  getSuperAdminOwners,
  SuperAdminOverview,
  SuperAdminMonthlyRevenueItem,
  SuperAdminSpaceOwner,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRupiah } from "@/components/SpaceCard";
import {
  CreditCard,
  Building2,
  CalendarCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Receipt,
  Download,
  Building,
  Users,
  UserCheck,
  Coins,
  ChevronRight, 
  Sparkles,
  TicketPercent,
  ReceiptText,
} from "lucide-react";

export default function SuperAdminOverviewPage() {
  const { user } = useAuth();

  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [revenueItems, setRevenueItems] = useState<SuperAdminMonthlyRevenueItem[]>([]);
  const [owners, setOwners] = useState<SuperAdminSpaceOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, revData, ownData] = await Promise.all([
        getSuperAdminOverview(),
        getSuperAdminMonthlyRevenue(selectedYear).catch(() => null),
        getSuperAdminOwners().catch(() => []),
      ]);
      setOverview(ovData);
      setRevenueItems(revData?.months || []);
      setOwners(ownData || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const gmvValue = overview?.totalGmv || 0;
  const netTakeValue = overview?.platformProfit || 0;
  const payoutValue = overview?.totalOwnersPayout || 0;
  const bookingsCount = overview?.totalReservations || 0;
  const activeBookingsCount = overview?.activeReservations || 0;
  const commissionRate = overview?.currentCommissionPercent || 12;

  const cityBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; spaces: number; gmv: number }>();

    owners.forEach((o) => {
      const addr = o.alamat || o.namaCoworking || "Lainnya";
      const parts = addr.split(",");
      const city = parts[parts.length - 1]?.trim() || "Jabodetabek";

      const current = map.get(city) || { count: 0, spaces: 0, gmv: 0 };
      current.count += 1;
      current.spaces += o.totalSpaces || 0;
      current.gmv += o.gmv || 0;
      map.set(city, current);
    });

    return Array.from(map.entries()).map(([city, data]) => ({
      city,
      ...data,
    }));
  }, [owners]);

  const handleExportAudit = () => {
    const headers = "Metric,Nilai\n";
    const rows = [
      `Total GMV Nasional,${gmvValue}`,
      `Pendapatan Bersih Platform (Komisi),${netTakeValue}`,
      `Total Payout Mitra,${payoutValue}`,
      `Persentase Komisi,${commissionRate}%`,
      `Total Reservasi,${bookingsCount}`,
      `Reservasi Aktif,${activeBookingsCount}`,
      `Total Mitra Terdaftar,${overview?.totalOwners || 0}`,
      `Total Ruangan Terdaftar,${overview?.totalSpaces || 0}`,
      `Total Member Terdaftar,${overview?.totalMembers || 0}`,
      `Total Staff Frontdesk,${overview?.totalStaffs || 0}`,
    ].join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worknest-audit-platform-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxMonthlyGmv = useMemo(() => {
    if (!revenueItems.length) return 1;
    return Math.max(...revenueItems.map((r) => r.gmv), 1);
  }, [revenueItems]);

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Dashboard Super Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola seluruh operasional Worknest, mitra venue, dan transaksi platform dari satu tempat.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui Data</span>
          </button>
          <button
            type="button"
            onClick={handleExportAudit}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] active:bg-[#003d45] text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Audit (CSV)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xs text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL GMV NASIONAL
            </span>
            <div className="w-8 h-8 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <CreditCard className="w-4 h-4 text-[#006370]" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : formatRupiah(gmvValue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Akumulasi nilai bruto seluruh transaksi
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              PENDAPATAN PLATFORM
            </span>
            <div className="w-8 h-8 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <Coins className="w-4 h-4 text-[#006370]" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#006370]">
              {loading ? "..." : formatRupiah(netTakeValue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F4F2] text-[#006370] border border-[#BCE3DE]">
                Tarif Komisi: {commissionRate}%
              </span>
              <Link
                href="/dashboard/super-admin/commission"
                className="text-[11px] text-[#006370] hover:underline font-medium"
              >
                Ubah
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL PAYOUT MITRA
            </span>
            <div className="w-8 h-8 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : formatRupiah(payoutValue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Hak bersih seluruh mitra space owner
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL RESERVASI
            </span>
            <div className="w-8 h-8 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <CalendarCheck className="w-4 h-4 text-[#006370]" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {loading ? "..." : bookingsCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {activeBookingsCount} Aktif
              </span>
              <span className="text-[11px] text-slate-500">
                {bookingsCount - activeBookingsCount} Selesai/Histori
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xs p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              MITRA VENUE
            </span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {overview?.totalOwners || owners.length || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1">Owner</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xs p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xs bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              TOTAL RUANGAN
            </span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {overview?.totalSpaces || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1">Unit</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xs p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xs bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              MEMBER TERDAFTAR
            </span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {overview?.totalMembers || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1">Akun</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xs p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xs bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              STAFF FRONTDESK
            </span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {overview?.totalStaffs || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1">Petugas</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Tren Pendapatan Transaksi Bulanan ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500">
              Grafik perbandingan perolehan Gross Merchandise Value (GMV) dan bagi hasil komisi platform.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#006370]" />
                <span className="text-slate-600">GMV Bruto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                <span className="text-slate-600">Komisi Platform</span>
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

        {revenueItems.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 h-52 items-end border-b border-slate-100 pb-3">
              {revenueItems.map((item) => {
                const gmvHeight = maxMonthlyGmv > 0 ? Math.max(8, (item.gmv / maxMonthlyGmv) * 100) : 8;
                const profitHeight = maxMonthlyGmv > 0 ? Math.max(4, (item.platformProfit / maxMonthlyGmv) * 100) : 4;

                return (
                  <div key={item.monthIndex} className="flex flex-col items-center justify-end h-full gap-1 group relative">
                    
                    <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-xs shadow-lg z-20 whitespace-nowrap">
                      <span>{item.monthName}</span>
                      <span>GMV: {formatRupiah(item.gmv)}</span>
                      <span>Komisi: {formatRupiah(item.platformProfit)}</span>
                    </div>

                    <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-full">
                      <div
                        style={{ height: `${gmvHeight}%` }}
                        className="w-full bg-[#006370] rounded-t-xs hover:opacity-90 transition-all"
                      />
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 mt-1">
                      {item.monthName.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xs">
            Belum ada data transaksi bulanan untuk tahun {selectedYear}.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-serif text-base font-bold text-slate-900">
                Sebaran Mitra Berdasarkan Wilayah
              </h2>
              <p className="text-xs text-slate-500">
                Konsentrasi coworking space dan total unit ruangan aktif
              </p>
            </div>
            <Link
              href="/dashboard/super-admin/owners"
              className="text-xs font-semibold text-[#006370] hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-2.5">
            {cityBreakdown.length > 0 ? (
              cityBreakdown.map((item) => (
                <div
                  key={item.city}
                  className="p-3 bg-slate-50/70 rounded-xs border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.city}</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {item.count} Mitra Venue • {item.spaces} Ruangan
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-900">{formatRupiah(item.gmv)}</span>
                    <span className="block text-[10px] text-slate-400">Total Transaksi</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada data sebaran wilayah mitra.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-serif text-base font-bold text-slate-900">
              Navigasi Kontrol Super Admin
            </h2>
            <p className="text-xs text-slate-500">
              Akses cepat ke modul manajemen platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Link
              href="/dashboard/super-admin/owners"
              className="p-4 rounded-xs border border-slate-200 hover:border-[#006370] hover:bg-[#E6F4F2]/30 transition-all space-y-1.5 group"
            >
              <div className="w-8 h-8 rounded-xs bg-slate-100 text-slate-700 group-hover:bg-[#006370] group-hover:text-white flex items-center justify-center transition-colors">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-[#006370]">
                Mitra Space Owner
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Kelola direktori {owners.length} pemilik venue dan verifikasi operasional.
              </p>
            </Link>

            <Link
              href="/dashboard/super-admin/commission"
              className="p-4 rounded-xs border border-slate-200 hover:border-[#006370] hover:bg-[#E6F4F2]/30 transition-all space-y-1.5 group"
            >
              <div className="w-8 h-8 rounded-xs bg-slate-100 text-slate-700 group-hover:bg-[#006370] group-hover:text-white flex items-center justify-center transition-colors">
                <TicketPercent className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-[#006370]">
                Komisi Platform
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Atur tarif bagi hasil saat ini ({commissionRate}%) dan simulasi potongan.
              </p>
            </Link>

            <Link
              href="/dashboard/super-admin/transactions"
              className="p-4 rounded-xs border border-slate-200 hover:border-[#006370] hover:bg-[#E6F4F2]/30 transition-all space-y-1.5 group"
            >
              <div className="w-8 h-8 rounded-xs bg-slate-100 text-slate-700 group-hover:bg-[#006370] group-hover:text-white flex items-center justify-center transition-colors">
                <ReceiptText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-[#006370]">
                Transaksi Global
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Audit buku besar seluruh mutasi pembayaran Midtrans nasional.
              </p>
            </Link>

            <Link
              href="/dashboard/super-admin/profile"
              className="p-4 rounded-xs border border-slate-200 hover:border-[#006370] hover:bg-[#E6F4F2]/30 transition-all space-y-1.5 group"
            >
              <div className="w-8 h-8 rounded-xs bg-slate-100 text-slate-700 group-hover:bg-[#006370] group-hover:text-white flex items-center justify-center transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-[#006370]">
                Pengaturan Akun
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Perbarui profil administrator, email, dan kata sandi login.
              </p>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Mitra Space Owner Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Daftar venue coworking yang terdaftar dan aktif di sistem WorkNest
            </p>
          </div>

          <Link
            href="/dashboard/super-admin/owners"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006370] hover:underline"
          >
            <span>Buka Direktori Lengkap ({owners.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">NAMA COWORKING &amp; LOKASI</th>
                <th className="py-3 px-4 font-bold">PEMILIK / KONTAK</th>
                <th className="py-3 px-4 font-bold">RUANGAN</th>
                <th className="py-3 px-4 font-bold">TOTAL RESERVASI</th>
                <th className="py-3 px-4 font-bold">TOTAL GMV</th>
                <th className="py-3 px-4 font-bold">NET PAYOUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {owners.length > 0 ? (
                owners.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{o.namaCoworking}</p>
                          <p className="text-[10px] text-slate-400 font-normal truncate max-w-[200px]">
                            {o.alamat || "Alamat belum diatur"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{o.namaPemilik}</p>
                      <p className="text-[10px] text-slate-400">{o.user?.email || o.telp}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {o.totalSpaces || 0} Ruangan
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {o.totalBookings || 0} Booking
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatRupiah(o.gmv || 0)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {formatRupiah(o.netPayout || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    Belum ada mitra space owner terdaftar di platform.
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
