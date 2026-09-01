"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

export default function StaffTerminalPage() {
  const { user } = useAuth();

  const [qrCode, setQrCode] = useState("");
  const [actionMode, setActionMode] = useState<"auto" | "checkin" | "checkout">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResponse | null>(null);

  // Active Occupancy List
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);

  const fetchActiveOccupancy = useCallback(async () => {
    setLoadingActive(true);
    try {
      const all = await getAllBookings();
      const activeOnly = (all || []).filter(
        (r: Reservation) => r.status?.toLowerCase() === "aktif" || r.status?.toLowerCase() === "disetujui"
      );
      setActiveReservations(activeOnly);
    } catch {
      // Handled silently
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
      setError("Masukkan kode tiket QR");
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
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terminal Operasional Resepsionis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Verifikasi & Validasi Check-In
          </h1>
          <p className="text-xs text-slate-500">
            Masukkan string kode QR tiket untuk memvalidasi akses fisik dan mengubah sesi menjadi Aktif atau Selesai.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchActiveOccupancy}
          disabled={loadingActive}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingActive ? "animate-spin text-sky-600" : "text-slate-400"}`} />
          <span>Segarkan Okupansi</span>
        </button>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Code Input & Action Mode */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Input String Kode Tiket
            </h2>
            <p className="text-xs text-slate-500">
              Gunakan scanner USB atau ketikkan kode tiket secara manual.
            </p>
          </div>

          {/* Action Mode Pills */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-lg border border-slate-200 gap-1">
            {[
              { id: "auto", label: "Auto (Deteksi)" },
              { id: "checkin", label: "Check-In" },
              { id: "checkout", label: "Check-Out" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActionMode(tab.id as any)}
                className={`py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  actionMode === tab.id
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleProcess} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Kode Tiket QR
              </label>
              <div className="relative">
                <QrCode className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Contoh: SSB-1788247503405-7DBEB5"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-sky-600 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses Kode...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Eksekusi Verifikasi</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback & Result Alerts */}
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Gagal Memproses Tiket</p>
                <p className="text-slate-600">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="font-bold">{result.message}</p>
              </div>

              {result.data && (
                <div className="bg-white p-2.5 rounded-md border border-emerald-200 text-slate-700 space-y-1 text-[11px]">
                  <p>Status Terkini: <strong>{result.data.status}</strong></p>
                  {result.data.waktuCheckin && (
                    <p>Waktu Check-In: <strong>{new Date(result.data.waktuCheckin).toLocaleTimeString("id-ID")} WIB</strong></p>
                  )}
                  {result.data.waktuCheckout && (
                    <p>Waktu Check-Out: <strong>{new Date(result.data.waktuCheckout).toLocaleTimeString("id-ID")} WIB</strong></p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Active Occupancy Checklist */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengunjung Aktif di Lokasi ({activeReservations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Daftar sesi yang sedang berlangsung di dalam ruangan.
              </p>
            </div>
          </div>

          {loadingActive ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            </div>
          ) : activeReservations.length > 0 ? (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {activeReservations.map((res) => {
                const isSessionActive = res.status?.toLowerCase() === "aktif";
                const memberName = res.member?.namaMember || `Member #${res.memberId}`;
                const spaceName = res.detailReservasi?.space?.namaSpace || `Space #${res.id}`;
                const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";

                return (
                  <div
                    key={res.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={res.status} />
                        <span className="font-mono text-slate-800 font-bold">
                          {res.qrCode}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{memberName}</p>
                      <p className="text-[11px] text-slate-500">{spaceName} ({rawDate}, {res.jamMulai} WIB)</p>
                    </div>

                    {isSessionActive && (
                      <button
                        type="button"
                        onClick={() => handleQuickCheckOut(res.qrCode)}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors shrink-0 flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check-Out</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada sesi pengunjung aktif saat ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
