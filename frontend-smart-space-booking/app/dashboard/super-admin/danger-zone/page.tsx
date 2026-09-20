"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { resetAllData, getApiErrorMessage, ResetDataResponse } from "@/lib/api";
import {
  AlertTriangle,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  RotateCcw,
  Building,
  Users,
  CalendarCheck,
  Receipt,
  TicketPercent,
  Star,
  Layers,
  X,
  Lock,
  Unlock,
} from "lucide-react";

export default function DangerZonePage() {
  const { user } = useAuth();
  const [resetModeOn, setResetModeOn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const CONFIRM_PHRASE = "RESET ALL DATA";

  useEffect(() => {
    if (resetModeOn) {
      setTimeLeft(120);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setResetModeOn(false);
            setModalOpen(false);
            setConfirmText("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(120);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetModeOn]);

  const handleToggle = (checked: boolean) => {
    setResetModeOn(checked);
    setError(null);
    if (!checked) {
      setModalOpen(false);
      setConfirmText("");
    }
  };

  const handleConfirmReset = async () => {
    if (confirmText !== CONFIRM_PHRASE || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await resetAllData({
        confirmationText: confirmText,
        excludeSuperAdmin: true,
      });

      setResult(response);
      setModalOpen(false);
      setResetModeOn(false);
      setConfirmText("");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        setError(
          err?.response?.data?.message ||
            "Akses ditolak: Reset data dinonaktifkan di environment ini atau akun Anda tidak memiliki hak super_admin."
        );
      } else if (status === 400) {
        setError(
          err?.response?.data?.message ||
            'Teks konfirmasi tidak sesuai. Harap ketik persis "RESET ALL DATA".'
        );
      } else if (status === 500) {
        setError(
          "Terjadi kesalahan saat memproses reset. Transaksi dibatalkan secara otomatis dan tidak ada data yang berubah."
        );
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-mono font-bold uppercase tracking-wider">
              High Risk Operation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-rose-600" />
            <span>Danger Zone</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Tindakan di halaman ini bersifat permanen dan tidak dapat dibatalkan. Hanya administrator dengan hak akses Super Admin yang dapat memicu eksekusi ini.
          </p>
        </div>
      </div>

      {resetModeOn && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3.5 animate-in fade-in duration-200 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-xs sm:text-sm font-bold text-rose-900">
              Mode Reset Data Aktif ({formatTime(timeLeft)})
            </p>
            <p className="text-xs text-rose-700 leading-relaxed">
              Tombol tindakan destruktif di bawah kini telah dibuka kuncinya. Jika tidak ada tindakan dalam {formatTime(timeLeft)}, mode ini akan otomatis terkunci kembali demi keamanan data.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Gagal Melakukan Reset Data</p>
            <p className="text-rose-700 text-xs">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h2 className="text-base font-bold text-emerald-900">
                Data Testing Berhasil Direset
              </h2>
              <p className="text-xs text-emerald-700">
                {result.message}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-emerald-800 font-mono">
                <span>Waktu: {new Date(result.executedAt).toLocaleString("id-ID")}</span>
                <span>•</span>
                <span>Eksekutor: {result.executedBy}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-200/80 pt-4">
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider font-mono mb-3">
              Ringkasan Data yang Dihapus:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { label: "Detail Reservasi", count: result.summary.detail_reservasi, icon: Layers },
                { label: "Ulasan / Review", count: result.summary.review, icon: Star },
                { label: "Waitlist", count: result.summary.waitlist, icon: Clock },
                { label: "Transaksi", count: result.summary.transaksi, icon: Receipt },
                { label: "Reservasi", count: result.summary.reservasi, icon: CalendarCheck },
                { label: "Diskon & Promo", count: result.summary.diskon, icon: TicketPercent },
                { label: "Unit Ruangan", count: result.summary.spaces, icon: Building },
                { label: "Staf Frontdesk", count: result.summary.staffs, icon: Users },
                { label: "Space Owner", count: result.summary.space_owners, icon: Building },
                { label: "Akun Member", count: result.summary.members, icon: Users },
                { label: "User Dihapus", count: result.summary.users_deleted, icon: Trash2 },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-white/80 border border-emerald-200/70 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs text-slate-700 font-medium">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {resetModeOn ? (
                <Unlock className="w-4 h-4 text-rose-600" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
              <span>Kontrol Keamanan Eksekusi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nyalakan saklar pengaman terlebih dahulu untuk membuka akses tombol destruktif.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold ${
                resetModeOn ? "text-rose-600 font-bold" : "text-slate-500"
              }`}
            >
              {resetModeOn ? "Mode Reset: AKTIF" : "Mode Reset: NONAKTIF"}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={resetModeOn}
              onClick={() => handleToggle(!resetModeOn)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                resetModeOn ? "bg-rose-600" : "bg-slate-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  resetModeOn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 transition-all space-y-4 ${
            resetModeOn
              ? "border-rose-300 bg-rose-50/30"
              : "border-slate-200 bg-slate-50/50 opacity-75"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Reset Seluruh Data Platform (Kecuali Super Admin)
                </h3>
                {resetModeOn && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                    Siap Dijalankan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mengosongkan seluruh tabel reservasi, transaksi, ruangan, diskon promo, ulasan, daftar tunggu, akun staf, space owner, dan member. Seluruh ID auto-increment akan direset ke 1. Akun Super Admin yang sedang aktif tidak akan dihapus.
              </p>
            </div>

            <button
              type="button"
              disabled={!resetModeOn || loading}
              onClick={() => setModalOpen(true)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                resetModeOn && !loading
                  ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-600/25 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Semua Data</span>
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Konfirmasi Reset Data
                  </h3>
                  <p className="text-xs text-rose-600 font-medium">
                    Tindakan ini permanen &amp; tidak dapat dipulihkan
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setModalOpen(false);
                  setConfirmText("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Tindakan ini akan <strong>menghapus secara permanen</strong> seluruh data operasional berikut:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 font-medium text-slate-700">
                <p>• Seluruh data Ruangan &amp; Foto Galeri</p>
                <p>• Seluruh Jadwal Reservasi &amp; Detail Pemesanan</p>
                <p>• Seluruh Riwayat Transaksi &amp; Pembayaran</p>
                <p>• Seluruh Promo &amp; Kode Diskon</p>
                <p>• Seluruh Review, Rating, &amp; Antrean Waitlist</p>
                <p>• Seluruh Akun Member, Space Owner, dan Staf Frontdesk</p>
                <p className="text-emerald-700 font-semibold pt-1">
                  ✓ Akun Super Admin ({user?.email}) akan tetap dipertahankan.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Ketik <span className="text-rose-600 font-mono select-all">RESET ALL DATA</span> untuk melanjutkan:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Ketik "${CONFIRM_PHRASE}" untuk konfirmasi`}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:opacity-50"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setModalOpen(false);
                  setConfirmText("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmText !== CONFIRM_PHRASE || loading}
                onClick={handleConfirmReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses Reset...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
