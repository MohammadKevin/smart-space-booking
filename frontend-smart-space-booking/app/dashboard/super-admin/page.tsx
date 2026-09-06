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
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  CalendarCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowRight,
  TicketPercent,
  ReceiptText,
  Clock,
  ShieldCheck,
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
  transactions: number;
}

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

export default function SuperAdminOverviewPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [monthlyData, setMonthlyData] = useState<SuperAdminMonthlyRevenueItem[]>([]);
  const [owners, setOwners] = useState<SuperAdminSpaceOwner[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchSuperAdminData = useCallback(async (yearToFetch = selectedYear) => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, monthlyRes, ownersData] = await Promise.all([
        getSuperAdminOverview().catch(() => ({
          totalGmv: 0,
          platformProfit: 0,
          totalOwnersPayout: 0,
          currentCommissionPercent: 5.0,
          totalOwners: 0,
          totalSpaces: 0,
          totalMembers: 0,
          totalStaffs: 0,
          totalReservations: 0,
          activeReservations: 0,
        })),
        getSuperAdminMonthlyRevenue(yearToFetch).catch(() => ({
          year: yearToFetch,
          commissionPercent: 5,
          totalGmvAnnual: 0,
          totalPlatformProfitAnnual: 0,
          months: [],
        })),
        getSuperAdminOwners().catch(() => []),
      ]);

      setOverview(overviewData);
      setMonthlyData(Array.isArray(monthlyRes?.months) ? monthlyRes.months : []);
      setOwners(Array.isArray(ownersData) ? ownersData : []);
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
      const monthlyRes = await getSuperAdminMonthlyRevenue(year);
      setMonthlyData(Array.isArray(monthlyRes?.months) ? monthlyRes.months : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingRevenue(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData(selectedYear);
  }, [fetchSuperAdminData, selectedYear]);

  const safeMonthly = useMemo(() => (Array.isArray(monthlyData) ? monthlyData : []), [monthlyData]);

  const totalAnnualProfit = useMemo(() => {
    return safeMonthly.reduce((acc, m) => acc + (Number(m?.platformProfit) || 0), 0);
  }, [safeMonthly]);

  const totalAnnualGmv = useMemo(() => {
    return safeMonthly.reduce((acc, m) => acc + (Number(m?.gmv) || 0), 0);
  }, [safeMonthly]);

  const rawMax = useMemo(() => {
    return Math.max(...safeMonthly.map((m) => Number(m?.platformProfit) || 0), 0);
  }, [safeMonthly]);

  const maxProfit = useMemo(() => {
    let step = 10000;
    if (rawMax > 5000000) step = 1000000;
    else if (rawMax > 1000000) step = 200000;
    else if (rawMax > 200000) step = 50000;
    else if (rawMax > 50000) step = 10000;
    else step = 10000;

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
    if (!safeMonthly.length) return [];
    const count = safeMonthly.length;
    return safeMonthly.map((item, idx) => {
      const stepX = usableWidth / count;
      const x = paddingLeft + idx * stepX + stepX / 2;
      const rev = Number(item?.platformProfit) || 0;
      const y = maxProfit > 0 ? baseline - (rev / maxProfit) * usableHeight : baseline;
      const shortName = SHORT_MONTHS[item.monthName] || item.monthName.slice(0, 3);
      return {
        x,
        y,
        rev,
        month: item.monthName,
        shortMonth: shortName,
        transactions: item.totalTransactions || 0,
      };
    });
  }, [safeMonthly, maxProfit, usableWidth, usableHeight, paddingLeft, baseline]);

  const linePath = useMemo(() => {
    return getSmoothSplinePath(points, baseline, paddingTop);
  }, [points, baseline, paddingTop]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
  }, [points, linePath, baseline]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Executive Overview Platform
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
              <span>CEO Workspace</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Pantau arus kas komisi platform, perputaran uang seluruh merchant (GMV), dan performa mitra space owner.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchSuperAdminData(selectedYear)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>

          <Link
            href="/dashboard/super-admin/commission"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <TicketPercent className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pengaturan Komisi ({overview?.currentCommissionPercent || 5}%)</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* 2. Four Master KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Keuntungan Bersih Platform */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Keuntungan Platform (Komisi)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : formatRupiah(overview?.platformProfit || 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>{overview?.currentCommissionPercent || 5}% dari seluruh transaksi lunas</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total GMV */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Merchandise Value (GMV)</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <ReceiptText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : formatRupiah(overview?.totalGmv || 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Total perputaran uang sewa se-platform
            </p>
          </div>
        </div>

        {/* Card 3: Mitra Space Owner */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Mitra Space Owner</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : overview?.totalOwners || 0} <span className="text-sm font-semibold text-slate-400">Coworking</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {overview?.totalSpaces || 0} unit ruangan terdaftar
            </p>
          </div>
        </div>

        {/* Card 4: Member & Transaksi */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Member Pengguna</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? "..." : overview?.totalMembers || 0} <span className="text-sm font-semibold text-slate-400">User</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {overview?.totalReservations || 0} total reservasi ({overview?.activeReservations || 0} aktif)
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Platform Commission Revenue Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Tren Keuntungan Komisi Platform
                </h2>
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {selectedYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Arus pendapatan bersih platform dari potongan komisi transaksi.
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
              <p className="text-xs text-slate-400 font-medium">Memuat grafik pendapatan platform...</p>
            </div>
          ) : safeMonthly.length > 0 ? (
            <div className="space-y-3 pt-1">
              <div className="relative w-full">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-56 sm:h-64 overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" stopOpacity="0.18" />
                      <stop offset="60%" stopColor="#0891b2" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis Scale Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = baseline - usableHeight * ratio;
                    const val = maxProfit * ratio;
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
                      stroke="#0f172a"
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
                      fill="url(#profitGradient)"
                      className="pointer-events-none transition-all duration-300"
                    />
                  )}

                  {/* Smooth Trend Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#0f172a"
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
                            fill="#0f172a"
                            opacity="0.2"
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
                            stroke={isHovered ? "#0f172a" : pt.rev > 0 ? "#0891b2" : "#94a3b8"}
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
                    const currentGmv = safeMonthly[hoveredIndex]?.gmv || 0;
                    return (
                      <div
                        className="absolute -top-3 z-20 bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700 pointer-events-none transition-all duration-150 -translate-x-1/2 min-w-44 space-y-1"
                        style={{ left: `${clampedPercent}%` }}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1">
                          <span className="font-bold text-cyan-300">
                            {currentPt.month} {selectedYear}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {currentPt.transactions} tx
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Komisi Platform:</span>
                          <span className="font-mono font-extrabold text-emerald-400">
                            {formatRupiah(currentPt.rev)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Total GMV:</span>
                          <span className="font-mono font-bold text-slate-300">{formatRupiah(currentGmv)}</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Strip Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
                  <span className="text-[11px] text-slate-500 block">Total Komisi Platform {selectedYear}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(totalAnnualProfit)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/60">
                  <span className="text-[11px] text-slate-500 block">Total GMV Transaksi {selectedYear}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(totalAnnualGmv)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              Belum ada data pendapatan platform.
            </div>
          )}
        </div>

        {/* Right: Space Owners Quick Summary */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Performa Mitra Space Owner
                </h2>
                <p className="text-xs text-slate-500">
                  Coworking space dengan kontribusi omzet tertinggi.
                </p>
              </div>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Memuat data mitra...</p>
              </div>
            ) : owners.length > 0 ? (
              <div className="space-y-3 pt-1">
                {owners.slice(0, 4).map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2 text-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{o.namaCoworking}</p>
                        <p className="text-[11px] text-slate-500">
                          {o.namaPemilik} • {o.totalSpaces} Ruangan
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900">{formatRupiah(o.gmv)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">GMV</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">
                        Komisi Platform: <strong className="text-emerald-700 font-mono">{formatRupiah(o.platformFee)}</strong>
                      </span>
                      <span className="text-slate-500">
                        Hak Owner: <strong className="text-slate-800 font-mono">{formatRupiah(o.netPayout)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada mitra space owner yang terdaftar.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Mitra: <strong className="text-slate-800 font-mono">{owners.length} Space Owner</strong></span>
            <Link
              href="/dashboard/super-admin/owners"
              className="text-slate-900 hover:text-cyan-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Kelola Semua Mitra</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
