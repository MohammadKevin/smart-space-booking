"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  processCheckIn,
  processCheckOut,
  getAllBookings,
  Reservation,
  CheckinResponse,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/StatusBadge";
import { LiveQrScanner } from "@/components/LiveQrScanner";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Zap,
  RefreshCw,
  LogOut,
  ShieldCheck,
  User,
  Building,
  Camera,
  Keyboard,
  Users,
  Calendar,
  Sparkles,
  Volume2,
} from "lucide-react";

export default function StaffTerminalPage() {
  const { user } = useAuth();

  const [inputMode, setInputMode] = useState<"camera" | "manual">("camera");
  const [qrCode, setQrCode] = useState("");
  const [actionMode, setActionMode] = useState<"auto" | "checkin" | "checkout">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResponse | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);

  const cooldownUntilRef = useRef<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const remainingMs = cooldownUntilRef.current - Date.now();
      if (remainingMs > 0) {
        setCooldownRemaining(Math.ceil(remainingMs / 1000));
      } else {
        setCooldownRemaining(0);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const playScanBeep = (isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (isSuccess) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}
  };

  const fetchOccupancy = useCallback(async () => {
    setLoadingActive(true);
    try {
      const all = await getAllBookings();
      setReservations(all || []);
    } catch {
    } finally {
      setLoadingActive(false);
    }
  }, []);

  useEffect(() => {
    fetchOccupancy();
  }, [fetchOccupancy]);

  const activeReservations = reservations.filter(
    (r) => r.status?.toLowerCase() === "aktif" || r.status?.toLowerCase() === "disetujui"
  );
  const checkedInNow = reservations.filter((r) => r.status?.toLowerCase() === "aktif");

  const executeCheckinProcess = async (codeToProcess: string, isFromCamera = false) => {
    if (!codeToProcess.trim()) {
      setError("Masukkan atau scan kode tiket QR.");
      return;
    }

    // Debounce check: if still in 5-second cooldown, ignore camera scan to prevent double check-in / check-out
    if (isFromCamera && Date.now() < cooldownUntilRef.current) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: CheckinResponse;
      if (actionMode === "checkout") {
        res = await processCheckOut(codeToProcess.trim());
      } else if (actionMode === "checkin") {
        res = await processCheckIn({ qrCode: codeToProcess.trim(), action: "checkin" });
      } else {
        res = await processCheckIn({ qrCode: codeToProcess.trim(), action: "auto" });
      }

      setResult(res);
      setQrCode("");
      playScanBeep(true);
      cooldownUntilRef.current = Date.now() + 5000;
      setCooldownRemaining(5);
      await fetchOccupancy();
    } catch (err: unknown) {
      playScanBeep(false);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCheckinProcess(qrCode, false);
  };

  const handleQuickCheckOut = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await processCheckOut(code);
      setResult(res);
      await fetchOccupancy();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Terminal Resepsionis & Staff</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Validasi & Scan Barcode Check-In
          </h1>
          <p className="text-xs text-slate-500">
            Arahkan kamera ke barcode QR tiket pengunjung untuk verifikasi dan pembaruan status otomatis secara instan.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOccupancy}
          disabled={loadingActive}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingActive ? "animate-spin text-cyan-600" : "text-slate-400"}`} />
          <span>Segarkan Okupansi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Pengunjung Aktif</p>
            <p className="text-xl font-bold text-slate-900">{checkedInNow.length} Orang</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Siap Check-In (Disetujui)</p>
            <p className="text-xl font-bold text-slate-900">
              {reservations.filter((r) => r.status?.toLowerCase() === "disetujui").length} Tiket
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Selesai Hari Ini</p>
            <p className="text-xl font-bold text-slate-900">
              {reservations.filter((r) => r.status?.toLowerCase() === "selesai").length} Sesi
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setInputMode("camera")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputMode === "camera"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Kamera Live Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode("manual")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputMode === "manual"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Input Manual / Scanner Gun</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px]">
              {(["auto", "checkin", "checkout"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActionMode(mode)}
                  className={`px-2.5 py-1 rounded-md font-bold capitalize transition-colors ${
                    actionMode === mode
                      ? "bg-white text-cyan-700 shadow-xs border border-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {mode === "auto" ? "Auto" : mode === "checkin" ? "Check-In" : "Check-Out"}
                </button>
              ))}
            </div>
          </div>

          {cooldownRemaining > 0 && (
            <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs animate-pulse">
              <Volume2 className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>
                Barcode tiket berhasil diproses! Cooldown proteksi aktif: <strong>{cooldownRemaining} detik</strong> (mencegah double-scan / checkout).
              </span>
            </div>
          )}

          {inputMode === "camera" ? (
            <LiveQrScanner
              onScanSuccess={(code) => executeCheckinProcess(code, true)}
              isProcessing={loading || cooldownRemaining > 0}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="space-y-1 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Input Manual atau Scanner USB</h3>
                <p className="text-xs text-slate-500">
                  Ketikkan string kode QR tiket atau tembak barcode menggunakan scanner fisik USB.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="relative">
                  <QrCode className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Contoh: SSB-1788247503405-7DBEB5"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-cyan-600 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses Kode...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Eksekusi Validasi Tiket</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs shadow-xs animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-sm">Gagal Memproses Tiket</p>
                <p className="text-slate-600 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs text-emerald-900 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2.5 border-b border-emerald-200/80 pb-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-emerald-950">{result.message}</p>
                  <p className="text-[11px] text-emerald-700">Status reservasi telah otomatis diperbarui di sistem.</p>
                </div>
              </div>

              {result.data && (
                <div className="bg-white p-3.5 rounded-lg border border-emerald-200 text-slate-700 grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Status Baru</span>
                    <span className="font-bold text-slate-900 capitalize text-xs">
                      {result.data.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Waktu Sesi</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {new Date().toLocaleTimeString("id-ID")} WIB
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengunjung di Lokasi ({activeReservations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Sesi ruangan aktif dan pemesanan yang siap check-in.
              </p>
            </div>
          </div>

          {loadingActive ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-cyan-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Memuat okupansi...</p>
            </div>
          ) : activeReservations.length > 0 ? (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {activeReservations.map((res) => {
                const isSessionActive = res.status?.toLowerCase() === "aktif";
                const memberName = res.member?.namaMember || `Member #${res.memberId}`;
                const spaceName = res.detailReservasi?.space?.namaSpace || `Space #${res.id}`;
                const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";

                return (
                  <div
                    key={res.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSessionActive
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    } flex items-center justify-between gap-3 text-xs`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={res.status} />
                        <span className="font-mono text-slate-800 font-bold truncate max-w-[130px]">
                          {res.qrCode}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">{memberName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {spaceName} • {rawDate}, {res.jamMulai} WIB ({res.durasiJam || 1}j)
                      </p>
                    </div>

                    {isSessionActive ? (
                      <button
                        type="button"
                        onClick={() => handleQuickCheckOut(res.qrCode)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check-Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => executeCheckinProcess(res.qrCode)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Check-In</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <QrCode className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Tidak ada reservasi aktif atau siap check-in saat ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
