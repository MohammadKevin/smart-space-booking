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
  Clock,
  BarChart3,
  Calendar,
  Layers,
  Users,
  Briefcase,
  Award,
} from "lucide-react";

const SHORT_MONTHS: Record<string, string> = {
  Januari: "Jan",
  Februari: "Feb",
  Maret: "Mar",
  April: "Apr",
  Mei: "Mei",
  Juni: "Jun",
  Juli: "Jul",
  Agustus: "Agu",
  September: "Sep",
  Oktober: "Okt",
  November: "Nov",
  Desember: "Des",
};

function formatShortCurrency(amount: number): string {
  if (amount === 0) return "0";
  if (amount >= 1000000000) {
    const b = amount / 1000000000;
    return `${b % 1 === 0 ? b : b.toFixed(1)} M`;
  }
  if (amount >= 1000000) {
    const m = amount / 1000000;
    return `${m % 1 === 0 ? m : m.toFixed(1)} jt`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)} rb`;
  }
  return amount.toString();
}

function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function OwnerOverviewPage() {
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([]);
  const [distribution, setDistribution] = useState<SpaceTypeDistributionItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Reservation[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async (yearToFetch = selectedYear) => {
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
        getMonthlyRevenue(yearToFetch).catch(() => []),
        getSpaceTypeDistribution().catch(() => []),
        getRecentTransactions(8).catch(() => []),
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
  }, [selectedYear]);

  const handleYearChange = async (year: number) => {
    setSelectedYear(year);
    setLoadingRevenue(true);
    try {
      const revData = await getMonthlyRevenue(year);
      setMonthlyRevenue(Array.isArray(revData) ? revData : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingRevenue(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedYear);
  }, [fetchAnalytics, selectedYear]);

  const safeMonthlyRevenue = useMemo(
    () => (Array.isArray(monthlyRevenue) ? monthlyRevenue : []),
    [monthlyRevenue]
  );
  const safeDistribution = useMemo(
    () => (Array.isArray(distribution) ? distribution : []),
    [distribution]
  );
  const safeTransactions = useMemo(
    () => (Array.isArray(recentTransactions) ? recentTransactions : []),
    [recentTransactions]
  );

  const totalAnnualRevenue = useMemo(() => {
    return safeMonthlyRevenue.reduce((acc, m) => acc + (Number(m?.revenue) || 0), 0);
  }, [safeMonthlyRevenue]);

  const totalAnnualBookings = useMemo(() => {
    return safeMonthlyRevenue.reduce((acc, m) => acc + (Number(m?.totalBookings) || 0), 0);
  }, [safeMonthlyRevenue]);

  const averageMonthlyRevenue = useMemo(() => {
    return Math.round(totalAnnualRevenue / (safeMonthlyRevenue.length || 12));
  }, [totalAnnualRevenue, safeMonthlyRevenue.length]);

  const bestMonth = useMemo(() => {
    if (!safeMonthlyRevenue.length) return null;
    return safeMonthlyRevenue.reduce((best, curr) => {
      const bestRev = Number(best?.revenue) || 0;
      const currRev = Number(curr?.revenue) || 0;
      return currRev > bestRev ? curr : best;
    }, safeMonthlyRevenue[0]);
  }, [safeMonthlyRevenue]);

  // Scaled max calculations for smooth SVG bounds
  const rawMax = useMemo(() => {
    return Math.max(...safeMonthlyRevenue.map((m) => Number(m?.revenue) || 0), 0);
  }, [safeMonthlyRevenue]);

  const maxRevenue = useMemo(() => {
    let step = 100000;
    if (rawMax > 10000000) step = 5000000;
    else if (rawMax > 5000000) step = 2000000;
    else if (rawMax > 2000000) step = 1000000;
    else if (rawMax > 500000) step = 250000;
    else if (rawMax > 100000) step = 100000;
    else step = 100000;

    return Math.max(step * 4, Math.ceil(rawMax / step) * step);
  }, [rawMax]);

  const chartWidth = 640;
  const chartHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const points = useMemo(() => {
    if (!safeMonthlyRevenue.length) return [];
    const count = safeMonthlyRevenue.length;
    return safeMonthlyRevenue.map((item, idx) => {
      const stepX = usableWidth / count;
      const x = paddingLeft + idx * stepX + stepX / 2;
      const rev = Number(item?.revenue) || 0;
      const y =
        maxRevenue > 0
          ? paddingTop + usableHeight - (rev / maxRevenue) * usableHeight
          : paddingTop + usableHeight;
      const shortName = SHORT_MONTHS[item.month] || item.month.slice(0, 3);
      return {
        x,
        y,
        rev,
        month: item.month,
        shortMonth: shortName,
        bookings: item.totalBookings || 0,
      };
    });
  }, [safeMonthlyRevenue, maxRevenue, usableWidth, usableHeight, paddingLeft, paddingTop]);

  const linePath = useMemo(() => {
    return getSmoothPath(points);
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const bottom = paddingTop + usableHeight;
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }, [points, linePath, paddingTop, usableHeight]);

  const totalInventorySpaces = useMemo(() => {
    return safeDistribution.reduce((acc, d) => acc + (Number(d.count) || 0), 0);
  }, [safeDistribution]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Operasional & Pendapatan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Pantau arus kas reservasi, performa utilisasi workstation, inventaris ruangan, dan aktivitas operasional secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedYear)}
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

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Gagal Memuat Analitik</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pendapatan (Akumulasi)</span>
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
              <span>Seluruh transaksi disetujui & lunas</span>
            </p>
          </div>
        </div>

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
              Pemesanan terdaftar di sistem
            </p>
          </div>
        </div>

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
              Unit workstation, meeting & office
            </p>
          </div>
        </div>

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
              Petugas verifikasi scanner QR
            </p>
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Revenue Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Visualisasi Omzet Bulanan
                </h2>
                <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {selectedYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Grafik batang dan tren garis pendapatan per periode bulanan.
              </p>
            </div>

            {/* Year Filter Dropdown */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  disabled={loading || loadingRevenue}
                  aria-label="Pilih tahun laporan pendapatan"
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {[currentYear, currentYear - 1, currentYear - 2].map((yr) => (
                    <option key={yr} value={yr}>
                      Tahun {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-cyan-700 font-bold bg-cyan-50 px-2.5 py-1.5 rounded-lg border border-cyan-200">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Live</span>
              </div>
            </div>
          </div>

          {loading || loadingRevenue ? (
            <div className="py-20 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Memuat data grafik...</p>
            </div>
          ) : safeMonthlyRevenue.length > 0 ? (
            <div className="space-y-4 pt-1">
              <div className="relative w-full">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-56 sm:h-64 overflow-visible"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity="0.25" />
                      <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                    <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" />
                      <stop offset="100%" stopColor="#0e7490" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = paddingTop + usableHeight * (1 - ratio);
                    const val = maxRevenue * ratio;
                    return (
                      <g key={i}>
                        <line
                          x1={paddingLeft - 8}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeDasharray={ratio === 0 ? "none" : "3 3"}
                          strokeWidth={ratio === 0 ? "1.5" : "1"}
                        />
                        <text
                          x={paddingLeft - 14}
                          y={y + 3.5}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94a3b8"
                          className="font-mono font-medium select-none"
                        >
                          {formatShortCurrency(val)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill under curve */}
                  {areaPath && (
                    <path
                      d={areaPath}
                      fill="url(#areaGradient)"
                      className="pointer-events-none transition-all duration-300"
                    />
                  )}

                  {/* Smooth Trend Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#0891b2"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none transition-all duration-300"
                    />
                  )}

                  {/* Monthly Columns (Bars) */}
                  {points.map((pt, idx) => {
                    const stepX = usableWidth / points.length;
                    const barW = Math.min(22, stepX * 0.45);
                    const barH = paddingTop + usableHeight - pt.y;
                    const isHovered = hoveredIndex === idx;

                    return (
                      <g
                        key={`bar-${idx}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Hover trigger zone */}
                        <rect
                          x={pt.x - stepX / 2}
                          y={paddingTop}
                          width={stepX}
                          height={usableHeight + paddingBottom}
                          fill="transparent"
                        />

                        {/* Visual Bar */}
                        {barH > 0 && (
                          <rect
                            x={pt.x - barW / 2}
                            y={pt.y}
                            width={barW}
                            height={Math.max(3, barH)}
                            rx="4"
                            fill={isHovered ? "url(#barHoverGradient)" : "url(#barGradient)"}
                            opacity={hoveredIndex !== null && !isHovered ? 0.35 : 0.85}
                            className="transition-all duration-200"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Data Point Nodes and X-Axis Labels */}
                  {points.map((pt, idx) => {
                    const isHovered = hoveredIndex === idx;
                    return (
                      <g
                        key={`node-${idx}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Outer Glow Ring on Hover */}
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={8}
                            fill="#06b6d4"
                            opacity="0.25"
                            className="animate-pulse"
                          />
                        )}

                        {/* Data Node Circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 5.5 : 3.5}
                          fill="#ffffff"
                          stroke={isHovered ? "#0891b2" : "#0284c7"}
                          strokeWidth={isHovered ? 2.5 : 2}
                          className="transition-all duration-150"
                        />

                        {/* Month Label below */}
                        <text
                          x={pt.x}
                          y={chartHeight - 12}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight={isHovered ? "700" : "500"}
                          fill={isHovered ? "#0f172a" : "#64748b"}
                          className="transition-colors select-none"
                        >
                          {pt.shortMonth}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Interactive Tooltip */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                  (() => {
                    const rawLeftPercent = (points[hoveredIndex].x / chartWidth) * 100;
                    const clampedPercent = Math.max(12, Math.min(88, rawLeftPercent));
                    const currentPt = points[hoveredIndex];
                    return (
                      <div
                        className="absolute -top-3 z-20 bg-slate-900/95 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700 pointer-events-none transition-all duration-150 -translate-x-1/2 min-w-44"
                        style={{ left: `${clampedPercent}%` }}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5 mb-1.5">
                          <span className="font-bold text-cyan-300">
                            {currentPt.month} {selectedYear}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {currentPt.bookings} booking
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Pendapatan:</span>
                          <span className="font-mono font-extrabold text-emerald-400">
                            {formatRupiah(currentPt.rev)}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Chart Performance Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/70">
                  <span className="text-[11px] text-slate-500 block">Total Omzet {selectedYear}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(totalAnnualRevenue)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/70">
                  <span className="text-[11px] text-slate-500 block">Rata-rata / Bulan</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(averageMonthlyRevenue)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/70">
                  <span className="text-[11px] text-slate-500 block">Bulan Tertinggi</span>
                  <span className="font-mono font-bold text-cyan-700 text-sm">
                    {bestMonth && (Number(bestMonth.revenue) || 0) > 0
                      ? `${bestMonth.month} (${formatShortCurrency(Number(bestMonth.revenue))})`
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">Belum ada data pendapatan bulanan</p>
              <p>Transaksi selesai pada tahun {selectedYear} akan otomatis direkap di grafik ini.</p>
            </div>
          )}
        </div>

        {/* Right: Space Inventory & Distribution */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Distribusi Inventaris Ruang
                </h2>
                <p className="text-xs text-slate-500">
                  Komposisi kategori ruangan aktif & kontribusi omzet.
                </p>
              </div>
              <PieChart className="w-4 h-4 text-cyan-600" />
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Memuat data inventaris...</p>
              </div>
            ) : safeDistribution.length > 0 ? (
              <div className="space-y-3.5 pt-1">
                {safeDistribution.map((d, idx) => {
                  const isDesk = d.tipe === "desk";
                  const isMeeting = d.tipe === "meeting_room";
                  const typeLabel = isDesk
                    ? "Hot Desk & Workstation"
                    : isMeeting
                    ? "Meeting Room"
                    : "Private Office";

                  const IconComp = isDesk ? Layers : isMeeting ? Users : Briefcase;
                  const barColor = isDesk
                    ? "bg-cyan-600"
                    : isMeeting
                    ? "bg-sky-500"
                    : "bg-indigo-600";
                  const badgeColor = isDesk
                    ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                    : isMeeting
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200";

                  const hasBookings = (d.totalBookings || 0) > 0;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs hover:border-cyan-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center border text-[11px] ${badgeColor}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-slate-800">{typeLabel}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {d.count} Unit <span className="text-slate-400 font-normal">({d.percentage}%)</span>
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(d.count > 0 ? 4 : 0, d.percentage))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>
                          {hasBookings ? `${d.totalBookings} Reservasi diproses` : "Belum ada reservasi"}
                        </span>
                        <span className="font-mono font-semibold text-slate-700">
                          {formatRupiah(d.totalRevenue || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <p>Belum ada inventaris ruangan yang terdaftar.</p>
                <Link
                  href="/dashboard/owner/spaces"
                  className="inline-flex items-center gap-1 text-cyan-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Ruangan Baru</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Kapasitas: <strong className="text-slate-800 font-mono">{totalInventorySpaces} Unit</strong></span>
            <Link
              href="/dashboard/owner/spaces"
              className="text-cyan-600 hover:text-cyan-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Kelola Ruangan</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Transaksi Reservasi Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Aktivitas pemesanan masuk yang baru saja tercatat di sistem.
            </p>
          </div>
          <Link
            href="/dashboard/owner/transactions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            <span>Semua Transaksi</span>
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
