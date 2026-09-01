"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  verifyCheckIn,
  processCheckIn,
  processCheckOut,
  getAllBookings,
  Reservation,
  CheckinResponse,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/StatusBadge";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building,
  Loader2,
  Zap,
  RefreshCw,
  LogOut,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";

export default function StaffTerminalPage() {
  const { user } = useAuth();

  const [qrCode, setQrCode] = useState("");
  const [actionMode, setActionMode] = useState<"auto" | "checkin" | "checkout">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResponse | null>(null);

  // Active Occupancy / Check-in List
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);

  const fetchActiveOccupancy = useCallback(async () => {
    setLoadingActive(true);
    try {
      const all = await getAllBookings();
      const activeOnly = all.filter(
        (r) => r.status.toLowerCase() === "aktif" || r.status.toLowerCase() === "disetujui"
      );
      setActiveReservations(activeOnly);
    } catch {
      // Handled gracefully
    } finally {
      setLoadingActive(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveOccupancy();
  }, [fetchActiveOccupancy]);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) {
      setError("Silakan masukkan kode tiket QR");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: CheckinResponse;
      if (actionMode === "checkout") {
        res = await processCheckOut(qrCode.trim());
      } else if (actionMode === "checkin") {
        res = await processCheckIn({ qrCode: qrCode.trim(), action: "checkin" });
      } else {
        res = await processCheckIn({ qrCode: qrCode.trim(), action: "auto" });
      }

      setResult(res);
      setQrCode("");
      await fetchActiveOccupancy();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckOut = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await processCheckOut(code);
      setResult(res);
      await fetchActiveOccupancy();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <QrCode className="w-3.5 h-3.5 text-sky-600" />
            <span>Terminal Operasional Resepsionis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Verifikasi & Scanner Check-In QR
          </h1>
          <p className="text-xs text-slate-600">
            Masukkan string kode QR tiket member untuk memvalidasi status dan mengubah sesi menjadi Aktif (Check-In) atau Selesai (Check-Out).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchActiveOccupancy}
            disabled={loadingActive}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingActive ? "animate-spin text-sky-600" : "text-slate-500"}`} />
            <span>Refresh Occupancy</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: QR Code Input Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Input String Tiket QR
            </h2>
            <p className="text-xs text-slate-500">
              Gunakan barcode scanner USB/kamera atau ketikkan kode QR secara manual.
            </p>
          </div>

          {/* Action Tabs */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
            {[
              { id: "auto", label: "Auto (Deteksi)" },
              { id: "checkin", label: "Check-In Saja" },
              { id: "checkout", label: "Check-Out Saja" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActionMode(tab.id as any)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  actionMode === tab.id
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleProcess} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kode QR Tiket
              </label>
              <div className="relative">
                <QrCode className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="e.g. SSB-1788247503405-7DBEB5"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-2xl text-sm font-mono font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Tiket...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Eksekusi Verifikasi Tiket</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback & Result Alerts */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="leading-snug">
                <h4 className="font-bold">Gagal Memproses Tiket</h4>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900 text-xs">
                    {result.message}
                  </h3>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Status Reservasi Terkini: <strong>{result.data?.status || "Aktif"}</strong>
                  </p>
                </div>
              </div>

              {result.data && (
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1">
                  {result.data.waktuCheckin && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Waktu Check-In: <strong>{new Date(result.data.waktuCheckin).toLocaleTimeString("id-ID")}</strong></span>
                    </p>
                  )}
                  {result.data.waktuCheckout && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Waktu Check-Out: <strong>{new Date(result.data.waktuCheckout).toLocaleTimeString("id-ID")}</strong></span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Active Occupancy Table */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengunjung Aktif & Siap Check-In ({activeReservations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Daftar sesi yang sedang berlangsung di workstation.
              </p>
            </div>
          </div>

          {loadingActive ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Memuat pengunjung aktif...</p>
            </div>
          ) : activeReservations.length > 0 ? (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {activeReservations.map((res) => {
                const isSessionActive = res.status.toLowerCase() === "aktif";
                const memberName = res.member?.namaMember || `Member #${res.memberId}`;
                const spaceName = res.detailReservasi?.space?.namaSpace || `Space #${res.id}`;
                const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";

                return (
                  <div
                    key={res.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSessionActive
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={res.status} />
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {res.qrCode}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1.5">{memberName}</h4>
                        <p className="text-xs text-slate-600">{spaceName} ({rawDate}, {res.jamMulai})</p>
                      </div>

                      {isSessionActive && (
                        <button
                          type="button"
                          onClick={() => handleQuickCheckOut(res.qrCode)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl shadow-sm transition-colors shrink-0 flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Check-Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Tidak ada sesi pengunjung aktif saat ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
