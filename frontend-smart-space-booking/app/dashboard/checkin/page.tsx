"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  processCheckIn,
  processCheckOut,
  verifyQr,
  CheckinResponse,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

function CheckinTerminalContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [qrCode, setQrCode] = useState("");
  const [actionMode, setActionMode] = useState<"auto" | "checkin" | "checkout">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResponse | null>(null);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) {
      setError("Silakan masukkan kode QR tiket");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: CheckinResponse;
      if (actionMode === "checkout") {
        res = await processCheckOut({ qrCode: qrCode.trim(), action: "checkout" });
      } else if (actionMode === "checkin") {
        res = await processCheckIn({ qrCode: qrCode.trim(), action: "checkin" });
      } else {
        res = await processCheckIn({ qrCode: qrCode.trim(), action: "auto" });
      }
      setResult(res);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <QrCode className="w-3.5 h-3.5 text-sky-500" />
          <span>Terminal Operasional Staff & Owner</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Scan & Verifikasi QR Tiket
        </h1>
        <p className="text-sm text-slate-600">
          Masukkan string kode QR member untuk memvalidasi tiket dan memproses Check-In / Check-Out secara real-time.
        </p>
      </div>

      {/* Main Terminal Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xl shadow-slate-200/50 space-y-6">
        {/* Action Tabs */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          {[
            { id: "auto", label: "Auto Detect" },
            { id: "checkin", label: "Check-In Saja" },
            { id: "checkout", label: "Check-Out Saja" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActionMode(tab.id as any)}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                actionMode === tab.id
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleProcess} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              String Kode QR Tiket
            </label>
            <div className="relative">
              <QrCode className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="e.g. SSB-1788247503405-7DBEB5"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-2xl text-base font-mono font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Tiket QR...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Proses Tiket Seketika</span>
              </>
            )}
          </button>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="leading-snug">
              <h4 className="font-bold">Gagal Memproses Tiket</h4>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Success Result Card */}
        {result && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 text-base">
                  {result.message}
                </h3>
                <p className="text-xs text-emerald-700">
                  Status Pemesanan: <strong>{result.data?.status || "Aktif"}</strong>
                </p>
              </div>
            </div>

            {result.data && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-emerald-200 text-xs text-slate-700">
                {result.data.waktuCheckin && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Check-In: <strong>{new Date(result.data.waktuCheckin).toLocaleTimeString("id-ID")}</strong>
                    </span>
                  </div>
                )}
                {result.data.waktuCheckout && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Check-Out: <strong>{new Date(result.data.waktuCheckout).toLocaleTimeString("id-ID")}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckinTerminalPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto p-12 text-center text-slate-500">Memuat terminal...</div>}>
      <CheckinTerminalContent />
    </Suspense>
  );
}
