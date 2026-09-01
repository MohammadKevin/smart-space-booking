"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getMyReservations,
  cancelReservation,
  Reservation,
  ReservationStatus,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah } from "@/components/SpaceCard";
import {
  CalendarCheck,
  Calendar,
  Clock,
  QrCode,
  Building,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Ban,
} from "lucide-react";

function ReservationsContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter Tab
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Cancel Confirmation Modal State
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // QR Modal State
  const [selectedQr, setSelectedQr] = useState<{
    code: string;
    spaceName: string;
    date: string;
    time: string;
  } | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyReservations();
      // Sort newest first
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      setReservations(sorted);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/dashboard/reservations");
      } else {
        fetchReservations();
      }
    }
  }, [isAuthenticated, authLoading, router, fetchReservations]);

  const handleOpenCancelModal = (res: Reservation) => {
    setCancelTarget(res);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    setIsCanceling(true);
    setFeedbackMessage(null);
    try {
      await cancelReservation(cancelTarget.id);
      setFeedbackMessage({
        type: "success",
        text: `Reservasi #${cancelTarget.id} berhasil dibatalkan.`,
      });
      setCancelModalOpen(false);
      setCancelTarget(null);
      // Refresh list
      await fetchReservations();
    } catch (err: unknown) {
      setFeedbackMessage({
        type: "error",
        text: getApiErrorMessage(err),
      });
      setCancelModalOpen(false);
    } finally {
      setIsCanceling(false);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <CalendarCheck className="w-3.5 h-3.5 text-sky-500" />
            <span>Riwayat Pemesanan Anda</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Daftar Reservasi Ruangan
          </h1>
          <p className="text-sm text-slate-600">
            Pantau status verifikasi, scan tiket QR Code saat tiba, atau batalkan pemesanan aktif Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-sm transition-all focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-500"}`} />
            <span>Muat Ulang</span>
          </button>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-600/20 transition-all"
          >
            <span>Pesan Ruangan Lain</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-sm animate-in fade-in ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{feedbackMessage.text}</div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm no-scrollbar">
        {[
          { id: "all", label: "Semua" },
          { id: "pending", label: "Menunggu Konfirmasi" },
          { id: "disetujui", label: "Disetujui" },
          { id: "aktif", label: "Sesi Aktif" },
          { id: "selesai", label: "Selesai" },
          { id: "dibatalkan", label: "Dibatalkan" },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          const count =
            tab.id === "all"
              ? reservations.length
              : reservations.filter((r) => r.status.toLowerCase() === tab.id).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? "bg-sky-700 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Gagal Mengambil Data Reservasi</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* List / Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded w-1/4" />
                <div className="h-6 bg-slate-200 rounded-full w-28" />
              </div>
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-10 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredReservations.map((res) => {
            const spaceInfo = res.detailReservasi?.space || (res as any).space;
            const spaceName =
              spaceInfo?.namaSpace || `Space #${res.detailReservasi?.spaceId || res.id}`;
            const totalCost = res.detailReservasi?.totalHarga || 0;
            const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";
            const canCancel =
              res.status.toLowerCase() === "pending" ||
              res.status.toLowerCase() === "disetujui";

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left side: Space & Schedule info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={res.status} />

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedQr({
                          code: res.qrCode,
                          spaceName: spaceName,
                          date: rawDate,
                          time: `${res.jamMulai} - ${res.jamSelesai || "Selesai"}`,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors"
                      title="Klik untuk melihat QR Tiket"
                    >
                      <QrCode className="w-3.5 h-3.5 text-sky-600" />
                      <span className="font-mono">{res.qrCode}</span>
                    </button>
                  </div>

                  <div>
                    {res.owner?.namaCoworking && (
                      <p className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-0.5">
                        <Building className="w-3 h-3 text-sky-500" />
                        {res.owner.namaCoworking}
                      </p>
                    )}
                    <h3 className="text-lg font-bold text-slate-900">
                      {spaceName}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">{rawDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {res.jamMulai} - {res.jamSelesai || "Selesai"} ({res.durasiJam} Jam)
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                      <span>Total: {formatRupiah(totalCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2.5 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedQr({
                        code: res.qrCode,
                        spaceName: spaceName,
                        date: rawDate,
                        time: `${res.jamMulai} - ${res.jamSelesai || "Selesai"}`,
                      })
                    }
                    className="flex-1 md:flex-initial px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5 text-slate-600" />
                    <span>Lihat Tiket QR</span>
                  </button>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(res)}
                      className="flex-1 md:flex-initial px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Batalkan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Belum Ada Reservasi
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {statusFilter === "all"
                ? "Anda belum memiliki riwayat pemesanan ruangan. Cari workstation atau ruang meeting yang sesuai dan buat pemesanan sekarang!"
                : `Tidak ada pemesanan dengan status "${statusFilter}".`}
            </p>
          </div>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all"
          >
            <span>Jelajahi Ruangan Tersedia</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* QR Code Dialog Modal */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Tiket QR Check-In
              </h3>
              <p className="text-xs text-slate-500">
                {selectedQr.spaceName}
              </p>
            </div>

            {/* QR display box */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="p-4 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
                <p className="font-mono text-base font-black text-slate-900 tracking-wider">
                  {selectedQr.code}
                </p>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p className="font-bold">{selectedQr.date}</p>
                <p className="text-slate-500">{selectedQr.time}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Tunjukkan kode ini kepada petugas atau scan di terminal check-in untuk memulai sesi Anda.
            </p>

            <button
              type="button"
              onClick={() => setSelectedQr(null)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Batalkan Reservasi Ini?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin membatalkan reservasi pada{" "}
                <span className="font-bold text-slate-800">
                  {cancelTarget.detailReservasi?.space?.namaSpace || "Ruangan Terpilih"}
                </span>{" "}
                untuk jadwal{" "}
                <span className="font-bold text-slate-800">
                  {cancelTarget.tanggalReservasi?.split("T")[0]} ({cancelTarget.jamMulai})
                </span>
                ? Tindakan ini tidak dapat diurungkan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={isCanceling}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCanceling}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <span>Ya, Batalkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
          Memuat riwayat reservasi...
        </div>
      }
    >
      <ReservationsContent />
    </Suspense>
  );
}
