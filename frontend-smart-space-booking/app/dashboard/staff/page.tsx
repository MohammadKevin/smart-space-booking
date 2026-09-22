"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  processCheckIn,
  getAllBookings,
  Reservation,
  CheckinResponse,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LiveQrScanner } from "@/components/LiveQrScanner";
import { formatRupiah } from "@/components/SpaceCard";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Radio,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Camera,
  Building,
  Users,
  RefreshCw,
  CalendarCheck,
  ArrowRight,
  Maximize2,
  Minimize2,
  Search,
  X,
  Check,
  Calendar,
  Sparkles,
  LogOut as LogOutIcon,
  LogIn as LogInIcon,
} from "lucide-react";

export default function StaffTerminalPage() {
  const { user } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const [gateUnlocked, setGateUnlocked] = useState(false);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "disetujui" | "aktif" | "selesai">("all");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateStr = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setCurrentTime(`${timeStr} WIB`);
      setCurrentDate(dateStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchReservations = useCallback(async () => {
    setFetchingData(true);
    try {
      const data = await getAllBookings();
      setReservations(Array.isArray(data) ? data : []);
    } catch {
      setReservations([]);
    } finally {
      setFetchingData(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const activeReservations = useMemo(() => {
    return reservations.filter((r) => r.status?.toLowerCase() === "aktif");
  }, [reservations]);

  const scheduledReservations = useMemo(() => {
    return reservations.filter(
      (r) =>
        r.status?.toLowerCase() === "disetujui" ||
        r.status?.toLowerCase() === "pending"
    );
  }, [reservations]);

  const completedReservations = useMemo(() => {
    return reservations.filter((r) => r.status?.toLowerCase() === "selesai");
  }, [reservations]);

  const executeCheckin = useCallback(
    async (code: string, action: "auto" | "checkin" | "checkout" = "auto") => {
      if (!code.trim() || loading) return;
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await processCheckIn({
          qrCode: code.trim(),
          action,
        });

        setResult(res);
        setGateUnlocked(true);

        setTimeout(() => {
          setGateUnlocked(false);
          setResult(null);
          setManualCodeInput("");
        }, 6000);

        fetchReservations();
      } catch (err: unknown) {
        const msg = getApiErrorMessage(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [loading, fetchReservations]
  );

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const q = searchFilter.toLowerCase().trim();
      const code = (r.qrCode || "").toLowerCase();
      const member = (r.member?.namaMember || "").toLowerCase();
      const space = (r.detailReservasi?.space?.namaSpace || "").toLowerCase();
      const matchSearch = !q || code.includes(q) || member.includes(q) || space.includes(q);

      const status = r.status?.toLowerCase() || "";
      const matchTab =
        activeTab === "all" ||
        (activeTab === "pending" && status === "pending") ||
        (activeTab === "disetujui" && status === "disetujui") ||
        (activeTab === "aktif" && status === "aktif") ||
        (activeTab === "selesai" && status === "selesai");

      return matchSearch && matchTab;
    });
  }, [reservations, searchFilter, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className="space-y-6 pb-16">
      {/* Fullscreen Overlay Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-in fade-in">
          <div className="p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between text-white z-20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
              <div>
                <span className="font-extrabold text-base tracking-tight block">
                  WorkNest Fullscreen Terminal
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentTime} • {currentDate}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Keluar Layar Penuh (ESC)</span>
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-4">
            <LiveQrScanner
              onScanSuccess={(scannedCode) => executeCheckin(scannedCode, "auto")}
              isProcessing={loading}
              isFullscreen={true}
              onToggleFullscreen={() => setIsFullscreen(false)}
            />

            {result && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 p-4 rounded-2xl bg-emerald-500 text-white shadow-2xl z-30 flex items-center gap-3 animate-in zoom-in-95">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div className="flex-1">
                  <p className="font-extrabold text-sm">
                    {result.actionPerformed === "checkout" ? "Check-Out Berhasil" : "Check-In Berhasil • Akses Diterima"}
                  </p>
                  <p className="text-xs text-emerald-100">{result.message}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 p-4 rounded-2xl bg-rose-600 text-white shadow-2xl z-30 flex items-center gap-3 animate-in zoom-in-95">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <div className="flex-1">
                  <p className="font-extrabold text-sm">Gagal Verifikasi</p>
                  <p className="text-xs text-rose-100">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="font-bold text-lg p-1 hover:text-rose-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-center text-xs text-slate-400 z-20 shrink-0">
            Arahkan barcode QR tiket ponsel tamu ke dalam area scanner kamera untuk validasi otomatis.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-600 mb-1">
            <span>TERMINAL FRONTDESK</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Check-In &amp; Validasi Masuk Ruangan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Terminal Check-In Resepsionis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Pindai kode QR tiket tamu untuk Check-In atau Check-Out otomatis, serta kelola log kedatangan secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-bold text-slate-900">{currentTime || "00:00:00 WIB"}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 hidden sm:inline">{currentDate}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Mode Layar Penuh</span>
          </button>

          <button
            type="button"
            onClick={fetchReservations}
            disabled={fetchingData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${fetchingData ? "animate-spin text-sky-600" : ""}`} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      {/* Error & Success Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-bold text-rose-700 hover:text-rose-900 p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {result && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3 text-xs text-sky-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">
                {result.actionPerformed === "checkout" ? "Check-Out Selesai" : "Akses Diberikan • Check-In Berhasil"}
              </p>
              <p className="text-[11px] text-sky-800">
                {result.message || "Validasi tiket berhasil."}
              </p>
            </div>
          </div>
          <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md border shadow-sm ${
            result.actionPerformed === "checkout"
              ? "bg-slate-100 text-slate-700 border-slate-200"
              : "bg-white text-sky-800 border-sky-200"
          }`}>
            {result.actionPerformed === "checkout" ? "STATUS SELESAI" : "STATUS AKTIF"}
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              STATUS GERBANG AKSES
            </span>
            <Radio className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold font-mono">
            {gateUnlocked ? (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <Unlock className="w-4 h-4" /> GERBANG TERBUKA
              </span>
            ) : (
              <span className="text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" /> SIAGA SCANNER
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {gateUnlocked ? "Akses pintu berhasil dibuka" : "Siaga menerima verifikasi tiket"}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TAMU AKTIF (DI VENUE)
            </span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-600 font-mono">
            {activeReservations.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Sesi yang sedang berlangsung saat ini
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              JADWAL TERDAFTAR
            </span>
            <CalendarCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {scheduledReservations.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Menunggu kedatangan tamu
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              SESI SELESAI HARI INI
            </span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {completedReservations.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Tamu yang telah check-out
          </p>
        </div>
      </div>

      {/* Main Grid: Scanner Left & Quick Table Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Camera Scanner Card */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-600 uppercase block">
                SCANNER KAMERA OPTIK
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Pindai Barcode QR Tiket
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Perbesar Layar Penuh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Layar Penuh</span>
            </button>
          </div>

          <LiveQrScanner
            onScanSuccess={(scannedCode) => executeCheckin(scannedCode, "auto")}
            isProcessing={loading}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Atau Verifikasi Kode Tiket Manual
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                placeholder="Contoh: SSB-1790016-XXXXXX"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => executeCheckin(manualCodeInput, "auto")}
                disabled={!manualCodeInput.trim() || loading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verifikasi"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Today's Reservation List & Quick Actions */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                DAFTAR TAMU VENUE
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Log Reservasi Hari Ini
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
              {[
                { id: "all", label: "Semua" },
                { id: "disetujui", label: "Siap Masuk" },
                { id: "aktif", label: "Aktif" },
                { id: "selesai", label: "Selesai" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-slate-900 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari nama member, kode tiket #SSB, ruangan..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredReservations.length > 0 ? (
              filteredReservations.map((r) => {
                const space = r.detailReservasi?.space;
                const status = r.status?.toLowerCase();
                const isPaid =
                  !r.transaksi || r.transaksi.statusPembayaran === "lunas";

                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {r.member?.namaMember || "Member"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            status === "aktif"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : status === "selesai"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : status === "disetujui"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : status === "dibatalkan"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {space?.namaSpace || "Ruangan"} • Pukul {r.jamMulai} WIB ({r.durasiJam || 1} Jam)
                      </p>
                      <p className="font-mono text-[10px] text-sky-600 font-semibold truncate">
                        {r.qrCode}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {status === "aktif" ? (
                        <button
                          type="button"
                          onClick={() => executeCheckin(r.qrCode, "checkout")}
                          disabled={loading}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <LogOutIcon className="w-3 h-3" />
                          <span>Check-Out</span>
                        </button>
                      ) : status === "disetujui" ? (
                        isPaid ? (
                          <button
                            type="button"
                            onClick={() => executeCheckin(r.qrCode, "checkin")}
                            disabled={loading}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs shadow-sky-600/20 flex items-center gap-1"
                          >
                            <LogInIcon className="w-3 h-3" />
                            <span>Check-In</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-semibold px-2 py-1 bg-amber-50 rounded-md border border-amber-200">
                            Belum Lunas
                          </span>
                        )
                      ) : status === "selesai" ? (
                        <button
                          type="button"
                          disabled
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-lg cursor-not-allowed border border-slate-200"
                        >
                          Check-In Off (Selesai)
                        </button>
                      ) : status === "dibatalkan" ? (
                        <button
                          type="button"
                          disabled
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-400 text-[10px] font-bold rounded-lg cursor-not-allowed border border-rose-100"
                        >
                          Dibatalkan
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-semibold px-2 py-1 bg-amber-50 rounded-md border border-amber-200">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada data reservasi yang sesuai filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
