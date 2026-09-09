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
  Zap,
  Radio,
  Delete,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Camera,
  Keyboard,
  Building,
  Users,
  RefreshCw,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";

export default function StaffTerminalPage() {
  const { user } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  const [cameraActive, setCameraActive] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const [gateUnlocked, setGateUnlocked] = useState(false);

  const [muted, setMuted] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

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

  const pendingReservations = useMemo(() => {
    return reservations.filter((r) => r.status?.toLowerCase() === "pending");
  }, [reservations]);

  const playChime = useCallback(
    (type: "success" | "error") => {
      if (muted) return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "success") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } else {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch {}
    },
    [muted]
  );

  const executeCheckin = useCallback(
    async (code: string) => {
      if (!code.trim() || loading) return;
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await processCheckIn({
          qrCode: code.trim(),
          action: "checkin",
        });
        setResult(res);
        setGateUnlocked(true);
        playChime("success");

        setTimeout(() => {
          setGateUnlocked(false);
          setResult(null);
          setPinDigits([]);
          setManualCodeInput("");
        }, 4000);

        fetchReservations();
      } catch (err: unknown) {
        const msg = getApiErrorMessage(err);
        setError(msg);
        playChime("error");
      } finally {
        setLoading(false);
      }
    },
    [loading, playChime, fetchReservations]
  );

  const handleKeypadPress = (digit: string) => {
    if (pinDigits.length < 6) {
      setPinDigits((prev) => [...prev, digit]);
    }
  };

  const handleClearPin = () => {
    setPinDigits([]);
    setError(null);
  };

  const handleBackspacePin = () => {
    setPinDigits((prev) => prev.slice(0, -1));
  };

  const handleVerifyPin = useCallback(() => {
    if (pinDigits.length === 0) return;
    executeCheckin(pinDigits.join(""));
  }, [pinDigits, executeCheckin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key >= "0" && e.key <= "9") {
        if (pinDigits.length < 6) {
          setPinDigits((prev) => [...prev, e.key]);
        }
      } else if (e.key === "Backspace") {
        setPinDigits((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        if (pinDigits.length > 0) {
          handleVerifyPin();
        }
      } else if (e.key === "Escape") {
        setPinDigits([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pinDigits, handleVerifyPin]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#006370] mb-1">
            <span>TERMINAL FRONTDESK</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-sans font-normal">
              Otorisasi &amp; Validasi Masuk
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Terminal Check-In &amp; Pintu Otomatis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Pindai QR code tiket reservasi atau masukkan PIN akses 6-digit untuk memvalidasi check-in tamu dan membuka akses pintu.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
            <Clock className="w-3.5 h-3.5 text-[#006370]" />
            <span className="font-bold text-slate-900">{currentTime || "00:00:00 WIB"}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 hidden sm:inline">{currentDate}</span>
          </div>

          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
            title={muted ? "Nyalakan Audio Beep" : "Bisukan Audio"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600" />}
          </button>

          <button
            type="button"
            onClick={fetchReservations}
            disabled={fetchingData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${fetchingData ? "animate-spin text-[#006370]" : ""}`} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xs bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-800 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
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
        <div className="p-4 rounded-xs bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Akses Diberikan • Check-In Berhasil</p>
              <p className="text-[11px] text-emerald-800">
                {result.message || "Validasi tiket berhasil. Sesi reservasi telah diaktifkan."}
              </p>
            </div>
          </div>
          <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-xs border border-emerald-200 text-emerald-800">
            OPEN: 4.0s
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              STATUS GERBANG IOT
            </span>
            <Radio className="w-4 h-4 text-[#006370]" />
          </div>
          <div className="text-xl font-bold font-mono">
            {gateUnlocked ? (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <Unlock className="w-4 h-4" /> TERBUKA
              </span>
            ) : (
              <span className="text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" /> TERKUNCI AMAN
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {gateUnlocked ? "Siklus pembukaan 4 detik" : "Siaga menerima verifikasi"}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TAMU AKTIF DI VENUE
            </span>
            <Users className="w-4 h-4 text-[#006370]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {activeReservations.length}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">
            Sesi sedang berjalan
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              MENUNGGU CHECK-IN
            </span>
            <CalendarCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {pendingReservations.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Perlu verifikasi tiket
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xs p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOTAL LOG HARI INI
            </span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {reservations.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Riwayat reservasi terdaftar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#006370] uppercase block">
                METODE 01
              </span>
              <h2 className="font-serif text-base font-bold text-slate-900">
                Pindai QR Code Tiket
              </h2>
            </div>
            <QrCode className="w-4 h-4 text-[#006370]" />
          </div>

          <div className="space-y-4">
            {cameraActive ? (
              <div className="rounded-xs overflow-hidden border border-slate-200 bg-slate-900 relative">
                <LiveQrScanner
                  onScanSuccess={(scannedCode: string) => {
                    executeCheckin(scannedCode);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setCameraActive(false)}
                  className="absolute top-3 right-3 px-3 py-1 bg-black/70 hover:bg-black text-white text-xs font-semibold rounded-xs border border-white/20 cursor-pointer"
                >
                  Tutup Kamera
                </button>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xs text-center space-y-3 bg-slate-50/50">
                <div className="w-12 h-12 rounded-xs bg-[#E6F4F2] text-[#006370] flex items-center justify-center mx-auto border border-[#BCE3DE]">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Scanner Kamera</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nyalakan kamera depan/belakang untuk memindai barcode QR member secara otomatis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCameraActive(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006370] hover:bg-[#004f59] text-white text-xs font-bold rounded-xs shadow-2xs transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Nyalakan Kamera Scanner</span>
                </button>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Atau Masukkan Kode QR Manual
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="Contoh: WN-BOK-123456"
                  className="flex-1 px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xs text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#006370] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => executeCheckin(manualCodeInput)}
                  disabled={!manualCodeInput.trim() || loading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Verifikasi
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#006370] uppercase block">
                METODE 02
              </span>
              <h2 className="font-serif text-base font-bold text-slate-900">
                Input Keypad PIN 6-Digit
              </h2>
            </div>
            <Keyboard className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const digit = pinDigits[index];
                const isActive = pinDigits.length === index;
                return (
                  <div
                    key={index}
                    className={`w-10 h-12 rounded-xs flex items-center justify-center font-mono text-xl font-bold border transition-all ${
                      digit
                        ? "bg-slate-50 text-[#006370] border-[#006370] shadow-2xs"
                        : isActive
                        ? "bg-white text-slate-400 border-[#006370] ring-1 ring-[#006370]/20"
                        : "bg-slate-50 text-slate-300 border-slate-200"
                    }`}
                  >
                    {digit ? digit : "-"}
                  </div>
                );
              })}
            </div>

            <div className="max-w-xs mx-auto w-full grid grid-cols-3 gap-2 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="h-11 rounded-xs bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg border border-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-2xs select-none"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearPin}
                className="h-11 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center cursor-pointer select-none"
              >
                HAPUS
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="h-11 rounded-xs bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg border border-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-2xs select-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspacePin}
                className="h-11 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center cursor-pointer select-none"
                aria-label="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleVerifyPin}
              disabled={pinDigits.length === 0 || loading}
              className={`w-full py-2.5 px-4 rounded-xs font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer ${
                pinDigits.length === 6
                  ? "bg-[#006370] hover:bg-[#004f59] text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi PIN...</span>
                </>
              ) : gateUnlocked ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-600" />
                  <span>Pintu Terbuka!</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Verifikasi PIN &amp; Buka Pintu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-serif text-base font-bold text-slate-900">
              Daftar Reservasi Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Monitoring tamu yang memiliki jadwal reservasi di venue Anda
            </p>
          </div>
          <Link
            href="/dashboard/staff/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006370] hover:underline"
          >
            <span>Buka Log Lengkap ({reservations.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">KODE TIKET</th>
                <th className="py-3 px-4 font-bold">TAMU / MEMBER</th>
                <th className="py-3 px-4 font-bold">RUANGAN</th>
                <th className="py-3 px-4 font-bold">JADWAL</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 font-bold text-right">AKSI CEPAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reservations.length > 0 ? (
                reservations.slice(0, 5).map((r) => {
                  const space = r.detailReservasi?.space;
                  const date = r.tanggalReservasi ? r.tanggalReservasi.split("T")[0] : "-";
                  const isAktif = r.status === "aktif";
                  const isPending = r.status === "pending";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {r.qrCode || `RES-${r.id}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{r.member?.namaMember || "Member"}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.member?.telp || "-"}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {space?.namaSpace || "Ruangan"}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <p className="font-semibold text-slate-900">{date}</p>
                        <p className="text-[10px] text-slate-400">{r.jamMulai} WIB ({r.durasiJam} Jam)</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {isAktif && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-xs bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                            Pending
                          </span>
                        )}
                        {!isAktif && !isPending && (
                          <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                            {r.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => executeCheckin(r.qrCode || String(r.id))}
                          className="px-2.5 py-1 rounded-xs border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Validasi
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    Belum ada data reservasi tercatat pada venue ini.
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
