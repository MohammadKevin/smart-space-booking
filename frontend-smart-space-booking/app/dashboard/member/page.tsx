"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getMyBookings,
  cancelBooking,
  Reservation,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah } from "@/components/SpaceCard";
import {
  CalendarCheck,
  QrCode,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Plus,
  ArrowRight,
  User,
  Phone,
  ShieldCheck,
} from "lucide-react";

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBookings();
      setReservations(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Active / Upcoming Bookings
  const activeOrPendingBookings = reservations.filter((r) => {
    const s = r.status?.toLowerCase() || "";
    return s === "disetujui" || s === "aktif" || s === "pending";
  });

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    setCancelling(true);
    try {
      await cancelBooking(cancelTargetId);
      setCancelSuccessMsg("Reservasi berhasil dibatalkan.");
      setCancelTargetId(null);
      await fetchBookings();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      setCancelTargetId(null);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Portal Member</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Tiket Digital & Riwayat Reservasi
          </h1>
          <p className="text-xs text-slate-500">
            Kelola jadwal sewa ruangan dan gunakan kode tiket digital untuk proses check-in di lokasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchBookings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-400"}`} />
            <span>Segarkan</span>
          </button>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Pesan Ruang Baru</span>
          </Link>
        </div>
      </div>

      {/* Success Alert */}
      {cancelSuccessMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setCancelSuccessMsg(null)}
            className="font-bold text-emerald-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Terjadi Kendala</p>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      )}

      {/* Section 1: Active Digital Tickets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Tiket Digital Siap Digunakan ({activeOrPendingBookings.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Tunjukkan kode tiket kepada staff di lokasi
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2">Memuat tiket digital...</p>
          </div>
        ) : activeOrPendingBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrPendingBookings.map((res) => {
              const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";
              const spaceName = res.detailReservasi?.space?.namaSpace || `Space #${res.id}`;
              const coworkingName = res.detailReservasi?.space?.owner?.namaCoworking;
              const canCancel = res.status?.toLowerCase() === "pending" || res.status?.toLowerCase() === "disetujui";

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      {coworkingName && (
                        <p className="text-[11px] font-semibold text-slate-500">
                          {coworkingName}
                        </p>
                      )}
                      <h3 className="text-base font-bold text-slate-900">
                        {spaceName}
                      </h3>
                    </div>
                    <StatusBadge status={res.status} />
                  </div>

                  {/* Monospace Code Ticket Box */}
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Kode Check-In
                      </span>
                      <p className="font-mono text-base font-bold text-slate-900">
                        {res.qrCode}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <QrCode className="w-5 h-5 text-sky-600" />
                    </div>
                  </div>

                  {/* Schedule Specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rawDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{res.jamMulai} WIB ({res.durasiJam || 1} Jam)</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  {canCancel && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCancelTargetId(res.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        Batalkan Reservasi
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-3">
            <QrCode className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">
                Tidak Ada Tiket Aktif
              </h3>
              <p className="text-xs text-slate-500">
                Anda belum memiliki pemesanan aktif. Silakan pilih ruangan di katalog untuk mulai menyewa.
              </p>
            </div>
            <Link
              href="/spaces"
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg"
            >
              <span>Jelajahi Katalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Section 2: Complete Reservation History Table */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Seluruh Reservasi ({reservations.length})
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Memuat riwayat...</p>
            </div>
          ) : reservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Ruangan</th>
                    <th className="py-3 px-4">Tanggal & Jam</th>
                    <th className="py-3 px-4">Kode Tiket</th>
                    <th className="py-3 px-4">Total Biaya</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map((r) => {
                    const rawDate = r.tanggalReservasi ? r.tanggalReservasi.split("T")[0] : "-";
                    const spaceName = r.detailReservasi?.space?.namaSpace || `Space #${r.id}`;
                    const cost = r.detailReservasi?.totalHarga || 0;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {spaceName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {rawDate}, {r.jamMulai} WIB
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {r.qrCode}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {formatRupiah(cost)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Belum ada riwayat transaksi reservasi.
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-xl">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Batalkan Reservasi?</h3>
              <p className="text-xs text-slate-500">
                Pemesanan ini akan dibatalkan dan kode tiket tidak dapat digunakan untuk check-in.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Ya, Batalkan</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
