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
  Building2,
  UserCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowRight,
  Plus,
  Clock,
  Layers,
  Users,
  Briefcase,
  TicketPercent,
  TrendingUp,
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
  if (amount === 0) return "Rp 0";
  if (amount >= 1000000000) {
    const b = amount / 1000000000;
    return `Rp ${b % 1 === 0 ? b : b.toFixed(1)} M`;
  }
  if (amount >= 1000000) {
    const m = amount / 1000000;
    return `Rp ${m % 1 === 0 ? m : m.toFixed(1)} Jt`;
  }
  if (amount >= 1000) {
    return `Rp ${Math.round(amount / 1000)} Rb`;
  }
  return `Rp ${amount}`;
}

export interface ChartPoint {
  x: number;
  y: number;
  rev: number;
  month: string;
  shortMonth: string;
  bookings: number;
}

/**
 * Fritsch-Carlson Monotone Cubic Spline Algorithm.
 * Ensures strict monotonicity: perfectly horizontal lines at 0 revenue,
 * smooth apex curves at peaks, and zero overshoot/undershoot below baseline.
 */
function getSmoothSplinePath(
  pts: ChartPoint[],
  baseline: number,
  paddingTop: number
): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

  const dxs: number[] = [];
  const dys: number[] = [];
  const ms: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    dxs.push(dx);
    dys.push(dy);
    ms.push(dx === 0 ? 0 : dy / dx);
  }

  const c: number[] = [ms[0]];
  for (let i = 0; i < ms.length - 1; i++) {
    const m0 = ms[i];
    const m1 = ms[i + 1];
    if (m0 * m1 <= 0) {
      c.push(0);
    } else {
      const dx0 = dxs[i];
      const dx1 = dxs[i + 1];
      const common = dx0 + dx1;
      c.push((3 * common) / ((common + dx1) / m0 + (common + dx0) / m1));
    }
  }
  c.push(ms[ms.length - 1]);

  let path = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const dx = dxs[i];
    const dy = dys[i];

    if (dy === 0) {
      path += ` L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
      continue;
    }

    const cp1x = p0.x + dx / 3;
    const cp1y = Math.min(baseline, Math.max(paddingTop, p0.y + (c[i] * dx) / 3));
    const cp2x = p1.x - dx / 3;
    const cp2y = Math.min(baseline, Math.max(paddingTop, p1.y - (c[i + 1] * dx) / 3));

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  return path;
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

  const coworkingName = user?.spaceOwner?.namaCoworking || "CoreCraft Space Hub";

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

  // Scaled max calculations for clean grid line intervals
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
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const baseline = paddingTop + usableHeight;

  const points = useMemo<ChartPoint[]>(() => {
    if (!safeMonthlyRevenue.length) return [];
    const count = safeMonthlyRevenue.length;
    return safeMonthlyRevenue.map((item, idx) => {
      const stepX = usableWidth / count;
      const x = paddingLeft + idx * stepX + stepX / 2;
      const rev = Number(item?.revenue) || 0;
      const y =
        maxRevenue > 0
          ? baseline - (rev / maxRevenue) * usableHeight
          : baseline;
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
  }, [safeMonthlyRevenue, maxRevenue, usableWidth, usableHeight, paddingLeft, baseline]);

  const linePath = useMemo(() => {
    return getSmoothSplinePath(points, baseline, paddingTop);
  }, [points, baseline, paddingTop]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
  }, [points, linePath, baseline]);

  const totalInventorySpaces = useMemo(() => {
    return safeDistribution.reduce((acc, d) => acc + (Number(d.count) || 0), 0);
  }, [safeDistribution]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Operasional
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {coworkingName} • {totalInventorySpaces} Ruangan terdaftar • {summary?.totalStaffs || 0} Staff aktif
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedYear)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>

          <Link
            href="/dashboard/owner/discounts"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <TicketPercent className="w-3.5 h-3.5 text-slate-500" />
            <span>Kelola Promo</span>
          </Link>

          <Link
            href="/dashboard/owner/spaces"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs shadow-cyan-600/20 transition-all cursor-pointer"
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

      {/* 2. Precision Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omzet Bersih */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pendapatan Terverifikasi</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : formatRupiah(summary?.totalRevenue || 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Transaksi berstatus disetujui & selesai</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Reservasi */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Volume Reservasi</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalReservations || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Total pesanan masuk dari member terdaftar
            </p>
          </div>
        </div>

        {/* Card 3: Ruangan Aktif */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ruangan & Workstation</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalSpaces || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Unit desk, meeting room & office aktif
            </p>
          </div>
        </div>

        {/* Card 4: Staff Scanner */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Petugas Resepsionis</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : summary?.totalStaffs || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Operator scanner QR & verifikasi check-in
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financial Trend Line Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Grafik Pendapatan Bulanan
                </h2>
                <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200/80">
                  {selectedYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kurva tren pendapatan bulanan dari transaksi selesai.
              </p>
            </div>

            {/* Year Selector */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-2xs">
              {[currentYear, currentYear - 1, currentYear - 2].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleYearChange(yr)}
                  disabled={loading || loadingRevenue}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    selectedYear === yr
                      ? "bg-slate-900 text-white font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {loading || loadingRevenue ? (
            <div className="py-20 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Memuat data grafik...</p>
            </div>
          ) : safeMonthlyRevenue.length > 0 ? (
            <div className="space-y-3 pt-1">
              <div className="relative w-full">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-56 sm:h-64 overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity="0.22" />
                      <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis Scale Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = baseline - usableHeight * ratio;
                    const val = maxRevenue * ratio;
                    return (
                      <g key={`grid-${i}`}>
                        <line
                          x1={paddingLeft - 8}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke={ratio === 0 ? "#cbd5e1" : "#f1f5f9"}
                          strokeDasharray={ratio === 0 ? "none" : "3 3"}
                          strokeWidth={ratio === 0 ? "1.5" : "1"}
                        />
                        <text
                          x={paddingLeft - 14}
                          y={y + 3.5}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94a3b8"
                          className="font-mono font-medium"
                        >
                          {formatShortCurrency(val)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Hairline Guide on Hover */}
                  {hoveredIndex !== null && points[hoveredIndex] && (
                    <line
                      x1={points[hoveredIndex].x}
                      y1={paddingTop}
                      x2={points[hoveredIndex].x}
                      y2={baseline}
                      stroke="#0891b2"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="pointer-events-none"
                    />
                  )}

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

                  {/* Data Point Nodes and Month Labels */}
                  {points.map((pt, idx) => {
                    const stepX = usableWidth / points.length;
                    const isHovered = hoveredIndex === idx;

                    return (
                      <g
                        key={`node-${idx}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Invisible Touch Target */}
                        <rect
                          x={pt.x - stepX / 2}
                          y={paddingTop}
                          width={stepX}
                          height={usableHeight + paddingBottom}
                          fill="transparent"
                        />

                        {/* Outer Glow on Hover */}
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={9}
                            fill="#06b6d4"
                            opacity="0.25"
                            className="animate-pulse pointer-events-none"
                          />
                        )}

                        {/* Node Circle */}
                        {(pt.rev > 0 || isHovered) && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 5.5 : pt.rev > 0 ? 4 : 2.5}
                            fill="#ffffff"
                            stroke={isHovered ? "#0891b2" : pt.rev > 0 ? "#0284c7" : "#94a3b8"}
                            strokeWidth={isHovered ? 2.5 : 2}
                            className="transition-all duration-150 pointer-events-none"
                          />
                        )}

                        {/* Month Label below */}
                        <text
                          x={pt.x}
                          y={chartHeight - 12}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight={isHovered ? "700" : "500"}
                          fill={isHovered ? "#0f172a" : "#64748b"}
                          className="transition-colors pointer-events-none"
                        >
                          {pt.shortMonth}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip Card */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                  (() => {
                    const rawLeftPercent = (points[hoveredIndex].x / chartWidth) * 100;
                    const clampedPercent = Math.max(14, Math.min(86, rawLeftPercent));
                    const currentPt = points[hoveredIndex];
                    return (
                      <div
                        className="absolute -top-3 z-20 bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700 pointer-events-none transition-all duration-150 -translate-x-1/2 min-w-40"
                        style={{ left: `${clampedPercent}%` }}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1 mb-1">
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

              {/* Performance Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
                  <span className="text-[11px] text-slate-500 block">Total Omzet {selectedYear}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(totalAnnualRevenue)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
                  <span className="text-[11px] text-slate-500 block">Rata-rata / Bulan</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(averageMonthlyRevenue)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
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

        {/* Right: Space Inventory & Distribution (Unified, Clean Palette) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Inventaris & Utilisasi Ruangan
                </h2>
                <p className="text-xs text-slate-500">
                  Komposisi kategori ruangan aktif & kontribusi omzet.
                </p>
              </div>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Memuat data inventaris...</p>
              </div>
            ) : safeDistribution.length > 0 ? (
              <div className="space-y-3 pt-1">
                {safeDistribution.map((d, idx) => {
                  const isDesk = d.tipe === "desk";
                  const isMeeting = d.tipe === "meeting_room";
                  const typeLabel = isDesk
                    ? "Hot Desk & Workstation"
                    : isMeeting
                    ? "Meeting Room"
                    : "Private Office";

                  const IconComp = isDesk ? Layers : isMeeting ? Users : Briefcase;
                  const hasBookings = (d.totalBookings || 0) > 0;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2.5 text-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200 bg-white text-slate-700 text-[11px] shadow-2xs">
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-slate-800">{typeLabel}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {d.count} Unit <span className="text-slate-400 font-normal">({d.percentage}%)</span>
                        </span>
                      </div>

                      {/* Unified Sleek Progress Bar (No Mixed Rainbow Colors) */}
                      <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-800 rounded-full transition-all duration-500"
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
              className="text-slate-700 hover:text-slate-900 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Kelola Inventaris</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Transactions Stream */}
      <div className="space-y-3">
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

        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
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
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeTransactions.map((t) => {
                    const rawDate = t.tanggalReservasi ? t.tanggalReservasi.split("T")[0] : "-";
                    const spaceName = t.detailReservasi?.space?.namaSpace || `Space #${t.id}`;
                    const memberName = t.member?.namaMember || `Member #${t.memberId}`;
                    const cost = t.detailReservasi?.totalHarga || 0;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <span>{memberName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{spaceName}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
