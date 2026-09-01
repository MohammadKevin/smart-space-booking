"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getMyBookings,
  cancelBooking,
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
  Ban,
  User,
  Phone,
  MapPin,
  Briefcase,
  Ticket,
} from "lucide-react";

export default function MemberDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter Tab
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Cancel Confirmation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBookings();
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
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenCancelModal = (res: Reservation) => {
    setCancelTarget(res);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    setIsCanceling(true);
    setFeedbackMessage(null);
    try {
      await cancelBooking(cancelTarget.id);
      setFeedbackMessage({
        type: "success",
        text: `Reservasi #${cancelTarget.id} berhasil dibatalkan.`,
      });
      setCancelModalOpen(false);
      setCancelTarget(null);
      await fetchBookings();
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

  const activeReservations = reservations.filter(
    (r) => r.status.toLowerCase() === "disetujui" || r.status.toLowerCase() === "aktif"
  );

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Ticket className="w-3.5 h-3.5 text-sky-600" />
            <span>Portal Member Terpadu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Reservasi & Tiket
          </h1>
          <p className="text-xs text-slate-600">
            Kelola sesi aktif Anda, scan tiket QR Code saat tiba di lokasi, dan tinjau riwayat pemesanan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBookings}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm shadow-sky-600/20 transition-all"
          >
            <span>Pesan Ruangan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Member Profile Card & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 font-black text-lg flex items-center justify-center shadow-inner">
              {(user?.member?.namaMember || user?.username || "M").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {user?.member?.namaMember || user?.username}
              </h3>
              <p className="text-xs text-sky-600 font-mono">@{user?.username}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Instansi: <strong className="text-slate-800">{user?.member?.instansi || "-"}</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-sky-600 shrink-0" />
              <span>No. Telp: <strong className="text-slate-800">{user?.member?.telp || "-"}</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="line-clamp-1">Alamat: <strong className="text-slate-800">{user?.member?.alamat || "-"}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Reservasi
            </span>
            <p className="text-3xl font-black text-slate-900">
              {reservations.length}
            </p>
            <p className="text-[11px] text-slate-500">Seluruh riwayat transaksi</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Sesi Siap / Aktif
            </span>
            <p className="text-3xl font-black text-emerald-600">
              {activeReservations.length}
            </p>
            <p className="text-[11px] text-slate-500">Dapat di-check-in sekarang</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Menunggu Konfirmasi
            </span>
            <p className="text-3xl font-black text-amber-600">
              {reservations.filter((r) => r.status.toLowerCase() === "pending").length}
            </p>
            <p className="text-[11px] text-slate-500">Dalam proses verifikasi</p>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs animate-in fade-in ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
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

      {/* Active Sesi Section */}
      {activeReservations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h2 className="text-lg font-black text-slate-900">
              Sesi Booking Berjalan & Siap Check-In ({activeReservations.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeReservations.map((res) => {
              const spaceInfo = res.detailReservasi?.space || (res as any).space;
              const spaceName = spaceInfo?.namaSpace || `Ruangan #${res.id}`;
              const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-3xl border-2 border-sky-200 p-6 shadow-md shadow-sky-50 space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <StatusBadge status={res.status} />
                      <h3 className="font-bold text-slate-900 text-lg mt-2">{spaceName}</h3>
                      {res.owner?.namaCoworking && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-sky-500" />
                          {res.owner.namaCoworking}
                        </p>
                      )}
                    </div>

                    {/* Numeric QR Code Box */}
                    <div className="bg-sky-50 p-2.5 rounded-2xl border border-sky-200 text-center shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Kode Check-In</p>
                      <p className="font-mono text-sm font-black text-slate-900 tracking-wider mt-0.5">
                        {res.qrCode}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{rawDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{res.jamMulai} ({res.durasiJam} Jam)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedQr({
                          code: res.qrCode,
                          spaceName,
                          date: rawDate,
                          time: `${res.jamMulai} (${res.durasiJam} Jam)`,
                        })
                      }
                      className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Buka Tiket QR Lengkap</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs & History Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-900">
            Riwayat Seluruh Pemesanan
          </h2>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm no-scrollbar">
            {[
              { id: "all", label: "Semua" },
              { id: "pending", label: "Pending" },
              { id: "disetujui", label: "Disetujui" },
              { id: "aktif", label: "Aktif" },
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Memuat riwayat pemesanan...</p>
            </div>
          ) : filteredReservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Kode Tiket</th>
                    <th className="py-3.5 px-4">Ruangan</th>
                    <th className="py-3.5 px-4">Jadwal & Durasi</th>
                    <th className="py-3.5 px-4">Total Biaya</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReservations.map((res) => {
                    const spaceInfo = res.detailReservasi?.space || (res as any).space;
                    const spaceName = spaceInfo?.namaSpace || `Space #${res.id}`;
                    const totalCost = res.detailReservasi?.totalHarga || 0;
                    const rawDate = res.tanggalReservasi ? res.tanggalReservasi.split("T")[0] : "-";
                    const canCancel =
                      res.status.toLowerCase() === "pending" ||
                      res.status.toLowerCase() === "disetujui";

                    return (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {res.qrCode}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {spaceName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <p className="font-semibold text-slate-800">{rawDate}</p>
                          <p className="text-[11px] text-slate-500">{res.jamMulai} ({res.durasiJam} Jam)</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatRupiah(totalCost)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={res.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedQr({
                                  code: res.qrCode,
                                  spaceName,
                                  date: rawDate,
                                  time: `${res.jamMulai} (${res.durasiJam} Jam)`,
                                })
                              }
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                            >
                              Tiket
                            </button>

                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(res)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-[11px] transition-colors"
                              >
                                Batalkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Tidak ada pemesanan dengan status &quot;{statusFilter}&quot;.
              </p>
              <Link
                href="/spaces"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                <span>Cari Ruangan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Dialog Modal */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Tiket QR Check-In
              </h3>
              <p className="text-xs text-slate-500 font-medium">
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

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tunjukkan kode ini kepada staff operasional untuk verifikasi check-in saat Anda tiba.
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
              <h3 className="text-lg font-black text-slate-900">
                Batalkan Reservasi Ini?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin membatalkan reservasi pada{" "}
                <span className="font-bold text-slate-800">
                  {cancelTarget.detailReservasi?.space?.namaSpace || "Ruangan"}
                </span>{" "}
                untuk tanggal{" "}
                <span className="font-bold text-slate-800">
                  {cancelTarget.tanggalReservasi?.split("T")[0]} ({cancelTarget.jamMulai})
                </span>
                ?
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
